import * as XLSX from 'xlsx';
import Papa from 'papaparse';
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
 * Parse Banco BPM Movimenti Conto (.xlsx or CSV)
 * Key columns: "Data Contabile", "Importo", "Causale / Descrizione" (or "Causale", "Descrizione operazione")
 */
export function parseBancoBPM(rows: any[]): Transaction[] {
  const transactions: Transaction[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Find matching keys flexibly
    const dateKey = Object.keys(row).find((k) => /data\s*contabile/i.test(k) || /data/i.test(k));
    const amountKey = Object.keys(row).find((k) => /importo/i.test(k));
    const descKey = Object.keys(row).find((k) => /causale/i.test(k) || /descrizione/i.test(k));

    if (!dateKey || !amountKey) continue;

    const rawDate = row[dateKey];
    const rawAmount = row[amountKey];
    const rawDesc = descKey ? String(row[descKey] || '') : '';

    const amount = normalizeAmount(rawAmount);
    if (amount === 0 && !rawDesc) continue;

    const date = normalizeDate(rawDate);
    const cat = categorizeDescription(rawDesc, amount);

    transactions.push({
      id: `bpm-${date}-${i}-${Math.abs(amount).toFixed(2)}`,
      date,
      channel: 'BancoBPM',
      amount,
      macroCategory: cat.macroCategory,
      category: cat.category,
      description: rawDesc || 'Movimento Banco BPM',
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
    // Credit card debits are usually positive in exports; invert to negative if not already
    if (amount > 0) {
      amount = -amount;
    }

    const rawDesc = descKey ? String(row[descKey] || '') : '';
    const date = normalizeDate(rawDate);
    const cat = categorizeDescription(rawDesc, amount);

    transactions.push({
      id: `numia-${date}-${i}-${Math.abs(amount).toFixed(2)}`,
      date,
      channel: 'Numia',
      amount,
      macroCategory: cat.macroCategory,
      category: cat.category,
      description: rawDesc || 'Movimento Carta Numia',
      rawDescription: rawDesc,
      tags: [...cat.tags, '#cartaNumia'],
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
  channel: 'BancoBPM' | 'Numia' | 'Generic';
  transactions: Transaction[];
}> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  let rows: any[] = [];

  if (extension === 'csv') {
    const text = await file.text();
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    rows = result.data;
  } else {
    // xlsx, xls
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    rows = XLSX.utils.sheet_to_json(worksheet);
  }

  if (rows.length === 0) {
    return { channel: 'Generic', transactions: [] };
  }

  // Detect bank channel by filename or header keys
  const filename = file.name.toLowerCase();
  const sampleKeys = Object.keys(rows[0] || {}).join(' ').toLowerCase();

  if (filename.includes('movimenticonto') || sampleKeys.includes('data contabile') || sampleKeys.includes('causale')) {
    return {
      channel: 'BancoBPM',
      transactions: parseBancoBPM(rows),
    };
  }

  if (filename.includes('movimenti') || sampleKeys.includes('data e ora') || sampleKeys.includes('numia')) {
    return {
      channel: 'Numia',
      transactions: parseCartaNumia(rows),
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
