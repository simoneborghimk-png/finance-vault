import { Transaction } from '@/types/finance';
import { categorizeDescription } from './categorizer';

/**
 * Normalizes Italian date strings into ISO format YYYY-MM-DD
 * Handles "DD/MM/YYYY", "DD-MM-YYYY", "DD/MM/YYYY HH:mm", Excel serial numbers
 */
export function normalizeDate(raw: any): string {
  if (!raw) return new Date().toISOString().split('T')[0];

  if (typeof raw === 'number') {
    // Excel date serial
    const date = new Date(Math.round((raw - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0];
  }

  const str = String(raw).trim();
  const dateMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    const year = dateMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Normalizes Italian numeric strings (e.g. "-1.250,50" -> -1250.50)
 */
export function normalizeAmount(raw: any): number {
  if (typeof raw === 'number') return raw;
  if (!raw) return 0;

  let str = String(raw).trim();
  str = str.replace(/[€\s]/g, '');
  
  if (str.includes('.') && str.includes(',')) {
    // Standard Italian format: 1.250,50
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    // Simple Italian format: 1250,50
    str = str.replace(',', '.');
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Cleans technical noise and tags from bank descriptions
 */
export function cleanDescription(raw: string): string {
  let s = String(raw || '').replace(/<[^>]*>/g, ' ');

  // Bonifici in uscita: preserva beneficiario e causale
  const favoreMatch = s.match(/favore\s+([^N]+?)\s+(?:nr\.\s*bonifico|iban|rif)/i);
  const causaleMatch = s.match(/causale:\s*(.+)$/i);
  if (favoreMatch && causaleMatch) {
    return `Bonifico a ${favoreMatch[1].trim()} (${causaleMatch[1].trim()})`;
  } else if (favoreMatch) {
    return `Bonifico a ${favoreMatch[1].trim()}`;
  }

  // Bonifici in entrata: preserva ordinante
  const bonDaMatch = s.match(/bon(?:ifico|\.)?\s*da\s+([^N]+?)\s+(?:nr\.\s*bonifico|iban|rif)/i);
  if (bonDaMatch) {
    const ordinante = bonDaMatch[1].trim();
    if (causaleMatch) {
      return `Bonifico da ${ordinante} (${causaleMatch[1].trim()})`;
    }
    return `Bonifico da ${ordinante}`;
  }

  s = s.replace(/addebito diretto sdd\s*-\s*sdd core:\s*[a-z0-9.)]+\s*/gi, '');
  s = s.replace(/pagamento con carta\s*-\s*carta\*\d+\s*mc digit-\d{2}:\d{2}-/gi, '');
  s = s.replace(/spesa pagobancomat\s*-\s*carta\*\d+-\d{2}:\d{2}-/gi, '');
  s = s.replace(/add\.\s*pagam\.\s*diversi\s*-\s*sdd core:\s*[a-z0-9]+\s*/gi, '');
  s = s.replace(/bon\.da\s+/gi, 'Bonifico da ');
  s = s.replace(/vs\.disp\.\s*rif\.[^\-]+causale:\s*/gi, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Parse Banco BPM Movimenti Conto (.xlsx or CSV)
 * Key columns: "Data Contabile", "Importo", "Causale / Descrizione"
 * Automatically filters out clearing SDDs to PayPal, credit cards and wallet top-ups
 * so expenses are tracked once with their actual merchant on the respective channel.
 */
export function parseBancoBPM(rows: any[]): Transaction[] {
  const transactions: Transaction[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const dateKey = Object.keys(row).find((k) => /data\s*contabile/i.test(k) || /data\s*valuta/i.test(k) || /^data$/i.test(k));
    const amountKey = Object.keys(row).find((k) => /importo/i.test(k));
    const descKey = Object.keys(row).find((k) => /causale/i.test(k) || /descrizione/i.test(k));

    if (!dateKey || !amountKey) continue;

    const rawDate = row[dateKey];
    const rawAmount = row[amountKey];
    const rawDesc = descKey ? String(row[descKey] || '') : '';

    const amount = normalizeAmount(rawAmount);
    if (amount === 0 && !rawDesc) continue;

    const date = normalizeDate(rawDate);
    if (!date) continue;

    // Check for clearing debits to avoid double counting
    const lower = rawDesc.toLowerCase();
    if (
      lower.includes('paypal (europe)') ||
      lower.includes('paypal europe') ||
      lower.includes('spesa con carta di credito nexi') ||
      lower.includes('carta nexi') ||
      lower.includes('nexi payments') ||
      lower.includes('nexi s.p.a.') ||
      lower.includes('e/c carta di credito') ||
      lower.includes('carta numia') ||
      lower.includes('satispay')
    ) {
      continue;
    }

    const cleanedDesc = cleanDescription(rawDesc) || 'Movimento Banco BPM';
    const cat = categorizeDescription(cleanedDesc, amount, 'BancoBPM');

    transactions.push({
      id: `bpm-${date}-${i}-${Math.abs(amount).toFixed(2)}`,
      date,
      channel: 'BancoBPM',
      amount,
      macroCategory: cat.macroCategory,
      category: cat.category,
      description: cleanedDesc,
      rawDescription: rawDesc,
      tags: cat.tags,
      isExtraordinary: cat.isExtraordinary,
      autoCategorized: cat.autoCategorized,
    });
  }

  return transactions;
}

/**
 * Parse Carta Numia (.xlsx or CSV)
 * Key columns: "Data e Ora", "Importo €", "Descrizione"
 */
export function parseCartaNumia(rows: any[]): Transaction[] {
  const transactions: Transaction[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const dateKey = Object.keys(row).find((k) => /data/i.test(k));
    const amountKey = Object.keys(row).find((k) => /importo/i.test(k));
    const descKey = Object.keys(row).find((k) => /descrizione/i.test(k));

    if (!dateKey || !amountKey) continue;

    const rawDate = row[dateKey];
    let amount = normalizeAmount(row[amountKey]);
    if (amount > 0) amount = -amount;

    const rawDesc = descKey ? String(row[descKey] || '') : '';
    const cleanedDesc = cleanDescription(rawDesc) || 'Movimento Carta Numia';
    const date = normalizeDate(rawDate);
    if (!date) continue;

    const cat = categorizeDescription(cleanedDesc, amount, 'Numia');

    transactions.push({
      id: `numia-${date}-${i}-${Math.abs(amount).toFixed(2)}`,
      date,
      channel: 'Numia',
      amount,
      macroCategory: cat.macroCategory,
      category: cat.category,
      description: cleanedDesc,
      rawDescription: rawDesc,
      tags: [...cat.tags, '#cartaNumia'],
      isExtraordinary: cat.isExtraordinary,
      autoCategorized: cat.autoCategorized,
    });
  }

  return transactions;
}

/**
 * Parse Carta Nexi (.xlsx)
 * Handles Nexi export layout with metadata in top rows and data starting row ~10
 */
export function parseCartaNexi(rows: any[]): Transaction[] {
  const transactions: Transaction[] = [];

  // Determine if rows is array-of-arrays or array-of-objects
  if (Array.isArray(rows[0])) {
    let startIdx = 0;
    // Find header row containing "data operazione" or similar
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const lineStr = (rows[i] || []).join(' ').toLowerCase();
      if (lineStr.includes('data operazione') || lineStr.includes('descrizione operazione')) {
        startIdx = i + 1;
        break;
      }
    }
    if (startIdx === 0 && rows.length > 10) startIdx = 10;

    for (let i = startIdx; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const rawDate = row[1];
      const rawDesc = row[4];
      const rawAmt = row[8];
      if (!rawDate || rawAmt === undefined) continue;

      const date = normalizeDate(rawDate);
      if (!date) continue;

      let amount = normalizeAmount(rawAmt);
      if (amount > 0) amount = -amount;
      else if (amount < 0) amount = Math.abs(amount); // refund

      const desc = cleanDescription(String(rawDesc || 'Spesa Nexi'));
      const cat = categorizeDescription(desc, amount, 'Nexi');

      transactions.push({
        id: `nexi-${date}-${i}-${Math.abs(amount).toFixed(2)}`,
        date,
        channel: 'Nexi',
        amount,
        macroCategory: cat.macroCategory,
        category: cat.category,
        description: desc,
        rawDescription: String(rawDesc),
        tags: [...cat.tags, '#cartaNexi'],
        isExtraordinary: cat.isExtraordinary,
        autoCategorized: cat.autoCategorized,
      });
    }
  } else {
    // Array of objects
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const dateKey = Object.keys(row).find((k) => /data\s*operazione/i.test(k) || /^data$/i.test(k));
      const amountKey = Object.keys(row).find((k) => /importo/i.test(k));
      const descKey = Object.keys(row).find((k) => /descrizione/i.test(k));

      if (!dateKey || !amountKey) continue;
      const rawDate = row[dateKey];
      let amount = normalizeAmount(row[amountKey]);
      if (amount > 0) amount = -amount;

      const date = normalizeDate(rawDate);
      if (!date) continue;

      const desc = cleanDescription(String(descKey ? row[descKey] : 'Spesa Nexi'));
      const cat = categorizeDescription(desc, amount, 'Nexi');

      transactions.push({
        id: `nexi-${date}-${i}-${Math.abs(amount).toFixed(2)}`,
        date,
        channel: 'Nexi',
        amount,
        macroCategory: cat.macroCategory,
        category: cat.category,
        description: desc,
        rawDescription: descKey ? String(row[descKey]) : undefined,
        tags: [...cat.tags, '#cartaNexi'],
        isExtraordinary: cat.isExtraordinary,
        autoCategorized: cat.autoCategorized,
      });
    }
  }

  return transactions;
}

/**
 * Parse PayPal Activity (.CSV)
 * Filters for completed transactions and purchases/refunds
 * Skips internal settlement clearing rows to prevent double-counting
 */
export function parsePayPal(rows: any[]): Transaction[] {
  const transactions: Transaction[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const statusKey = Object.keys(row).find((k) => /stato/i.test(k));
    const typeKey = Object.keys(row).find((k) => /tipo/i.test(k));
    const dateKey = Object.keys(row).find((k) => /^data$/i.test(k));
    const amountKey = Object.keys(row).find((k) => /lordo/i.test(k) || /importo/i.test(k) || /totale/i.test(k));
    const nameKey = Object.keys(row).find((k) => /nome/i.test(k));
    const descKey = Object.keys(row).find((k) => /descrizione/i.test(k));

    if (!dateKey || !amountKey) continue;

    // Filter only completed payment/refund rows
    const stato = statusKey ? String(row[statusKey] || '') : 'Completata';
    const tipo = typeKey ? String(row[typeKey] || '') : 'Pagamento';
    if (stato !== 'Completata') continue;

    const isPayment = /pagamento/i.test(tipo) || /rimborso/i.test(tipo);
    if (!isPayment) continue;

    const date = normalizeDate(row[dateKey]);
    if (!date) continue;

    const amount = normalizeAmount(row[amountKey]);
    const nome = nameKey ? String(row[nameKey] || '').trim() : '';
    const desc = descKey ? String(row[descKey] || '').trim() : '';

    // Filtra clearing interno PayPal e ricariche conto
    const lowerNome = nome.toLowerCase();
    if (lowerNome.includes('paypal (europe)') || lowerNome.includes('paypal europe')) {
      continue;
    }
    if (nome === 'PayPal' && amount > 0) {
      continue;
    }

    const fullDesc = (nome ? (desc ? `${nome} - ${desc}` : nome) : desc) || 'Spesa PayPal';
    const cat = categorizeDescription(fullDesc, amount, 'PayPal');

    transactions.push({
      id: `pp-${date}-${i}-${Math.abs(amount).toFixed(2)}`,
      date,
      channel: 'PayPal',
      amount,
      macroCategory: cat.macroCategory,
      category: cat.category,
      description: fullDesc,
      rawDescription: `${tipo} - ${fullDesc}`,
      tags: [...cat.tags, '#paypal'],
      isExtraordinary: cat.isExtraordinary,
      autoCategorized: cat.autoCategorized,
    });
  }

  return transactions;
}

/**
 * Parse Satispay Activity (.xlsx)
 * Skips bank top-ups (Dalla Banca) and logs actual payments
 */
export function parseSatispay(rows: any[]): Transaction[] {
  const transactions: Transaction[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const statusKey = Object.keys(row).find((k) => /stato/i.test(k));
    const typeKey = Object.keys(row).find((k) => /tipo/i.test(k));
    const dateKey = Object.keys(row).find((k) => /^data$/i.test(k));
    const amountKey = Object.keys(row).find((k) => /importo/i.test(k));
    const nameKey = Object.keys(row).find((k) => /nome/i.test(k));
    const descKey = Object.keys(row).find((k) => /descrizione/i.test(k));

    if (!dateKey || !amountKey) continue;

    const stato = statusKey ? String(row[statusKey] || '') : '';
    if (stato && !stato.includes('Approvato')) continue;

    const tipo = typeKey ? String(row[typeKey] || '') : '';
    const nome = nameKey ? String(row[nameKey] || '').trim() : '';
    const desc = descKey ? String(row[descKey] || '').trim() : '';

    // Skip balance recharges per user directive
    if (tipo.includes('Dalla Banca') || nome.includes('Ricarica Satispay')) continue;

    const date = normalizeDate(row[dateKey]);
    if (!date) continue;

    const amount = normalizeAmount(row[amountKey]);
    const fullDesc = nome ? (desc ? `${nome} (${desc})` : nome) : desc || 'Spesa Satispay';
    const cat = categorizeDescription(fullDesc, amount, 'Satispay');

    transactions.push({
      id: `satis-${date}-${i}-${Math.abs(amount).toFixed(2)}`,
      date,
      channel: 'Satispay',
      amount,
      macroCategory: cat.macroCategory,
      category: cat.category,
      description: fullDesc,
      rawDescription: `${tipo} - ${fullDesc}`,
      tags: [...cat.tags, '#satispay'],
      isExtraordinary: cat.isExtraordinary,
      autoCategorized: cat.autoCategorized,
    });
  }

  return transactions;
}

/**
 * Universal Ingestion Function for File (Excel / CSV)
 */
export async function parseFinancialFile(file: File): Promise<{
  channel: Transaction['channel'];
  transactions: Transaction[];
}> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const filename = file.name.toLowerCase();

  let rows: any[] = [];

  if (extension === 'csv') {
    const text = await file.text();
    const Papa = (await import('papaparse')).default;
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    rows = result.data;

    // Check if PayPal CSV
    const sampleKeys = Object.keys(rows[0] || {}).join(' ').toLowerCase();
    if (filename.includes('paypal') || sampleKeys.includes('lordo') || sampleKeys.includes('stato')) {
      return {
        channel: 'PayPal',
        transactions: parsePayPal(rows),
      };
    }
  } else {
    // xlsx, xls
    const buffer = await file.arrayBuffer();
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Check sheet names to guide parser
    const sheetNames = workbook.SheetNames.map((s) => s.toLowerCase());

    if (filename.includes('nexi') || sheetNames.includes('movimenti conto')) {
      const sheet = workbook.Sheets['Movimenti conto'] || workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      return {
        channel: 'Nexi',
        transactions: parseCartaNexi(rawRows),
      };
    }

    if (filename.includes('satispay') || sheetNames.includes('transactions')) {
      const sheet = workbook.Sheets['Transactions'] || workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet);
      return {
        channel: 'Satispay',
        transactions: parseSatispay(rawRows),
      };
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    rows = XLSX.utils.sheet_to_json(worksheet);
  }

  if (rows.length === 0) {
    return { channel: 'BancoBPM', transactions: [] };
  }

  const sampleKeys = Object.keys(rows[0] || {}).join(' ').toLowerCase();

  if (filename.includes('numia') || sampleKeys.includes('data e ora')) {
    return {
      channel: 'Numia',
      transactions: parseCartaNumia(rows),
    };
  }

  if (filename.includes('movimenticonto') || sampleKeys.includes('data contabile') || sampleKeys.includes('causale')) {
    return {
      channel: 'BancoBPM',
      transactions: parseBancoBPM(rows),
    };
  }

  // Default fallback
  const transactions = parseBancoBPM(rows);
  return {
    channel: 'BancoBPM',
    transactions,
  };
}

/**
 * Pre-set Fixed Recurring / Manual Rules
 * - Spesa contanti fissa: 15,00 €/mese ("Pulizia Scale Condominio", Needs)
 * - Transazione Satispay ricorrente verso Giusi Fortunata C. (@gcalato88): 20,00 €/mese ("Cura Personale / Parrucchiera", Wants)
 */
export function generatePresetVirtualTransactions(monthsBack: number = 12): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date();

  for (let m = 0; m < monthsBack; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 5);
    const dateStr = d.toISOString().split('T')[0];

    // 1. Pulizia Scale (Contanti 15€)
    transactions.push({
      id: `virtual-scale-${dateStr}`,
      date: dateStr,
      channel: 'Contanti',
      amount: -15.00,
      macroCategory: 'Needs',
      category: 'Spese Condominiali',
      description: 'Pulizia Scale Condominio',
      rawDescription: 'Contanti mensili per pulizia scale',
      tags: ['#scale', '#condominio', '#contanti', '#ricorrente'],
      autoCategorized: true,
    });

    // 2. Parrucchiera Satispay Giusi Fortunata C. (20€)
    const d2 = new Date(now.getFullYear(), now.getMonth() - m, 18);
    const dateStr2 = d2.toISOString().split('T')[0];
    transactions.push({
      id: `virtual-satispay-${dateStr2}`,
      date: dateStr2,
      channel: 'Satispay',
      amount: -20.00,
      macroCategory: 'Wants',
      category: 'Cura Personale / Parrucchiera',
      description: 'Giusi Fortunata C. (@gcalato88)',
      rawDescription: 'Satispay P2P Giusi Fortunata C. (@gcalato88)',
      tags: ['#parrucchiera', '#satispay', '#curapersonale', '#ricorrente'],
      autoCategorized: true,
    });
  }

  return transactions;
}
