#!/usr/bin/env node

/**
 * ============================================================================
 * Reverse Engineering & Dataset Profiler per Estratti Conto Bancari
 * ============================================================================
 * Utilizzo:
 *   node scripts/inspect-export.mjs <percorso-file> [num-righe]
 *   node scripts/inspect-export.mjs data/exports/Nexi.xlsx
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';
import Papa from 'papaparse';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const filePath = process.argv[2];
const sampleLimit = parseInt(process.argv[3] || '10', 10);

if (!filePath) {
  console.log(`${colors.bold}${colors.cyan}=== [Bank Export Profiler & Reverse Engineering] ===${colors.reset}\n`);
  console.log(`Uso: ${colors.yellow}node scripts/inspect-export.mjs <file-path> [num-righe]${colors.reset}\n`);
  console.log('File disponibili in data/exports/:');
  if (fs.existsSync('data/exports')) {
    const files = fs.readdirSync('data/exports').filter((f) => !f.startsWith('.'));
    for (const f of files) {
      console.log(`  - data/exports/${f}`);
    }
  }
  process.exit(0);
}

if (!fs.existsSync(filePath)) {
  console.error(`${colors.red}Errore: file non trovato: ${filePath}${colors.reset}`);
  process.exit(1);
}

const ext = path.extname(filePath).toLowerCase();
const fileName = path.basename(filePath);

console.log(`${colors.bold}${colors.cyan}=== [Analisi Tracciato: ${fileName}] ===${colors.reset}\n`);

let rawMatrix = []; // array di array di stringhe/valori
let detectedDelimiter = null;

if (ext === '.csv' || ext === '.txt') {
  const content = fs.readFileSync(filePath, 'utf8');
  // Rilevamento automatico delimitatore
  const delimiters = [';', ',', '\t', '|'];
  let bestDelim = ';';
  let maxCols = 0;
  for (const d of delimiters) {
    const firstLine = content.split(/\r?\n/)[0] || '';
    const cols = firstLine.split(d).length;
    if (cols > maxCols) {
      maxCols = cols;
      bestDelim = d;
    }
  }
  detectedDelimiter = bestDelim;
  const parsed = Papa.parse(content, { delimiter: bestDelim, skipEmptyLines: true });
  rawMatrix = parsed.data;
  console.log(`${colors.blue}Formato:${colors.reset} CSV (delimitatore rilevato: ${colors.bold}'${detectedDelimiter}'${colors.reset})`);
} else if (ext === '.xlsx' || ext === '.xls') {
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  rawMatrix = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`${colors.blue}Formato:${colors.reset} Excel Workbook (${wb.SheetNames.length} fogli, foglio attivo: ${colors.bold}'${sheetName}'${colors.reset})`);
} else {
  console.error(`${colors.red}Formato non supportato (${ext}). Supportati: .csv, .xlsx, .xls${colors.reset}`);
  process.exit(1);
}

console.log(`${colors.blue}Righe totali estratte:${colors.reset} ${rawMatrix.length}`);

// 1. Individuazione riga header e offset
let headerRowIndex = 0;
let headerScores = [];
const headerKeywords = [
  /data/i,
  /date/i,
  /importo/i,
  /amount/i,
  /causale/i,
  /descrizione/i,
  /description/i,
  /beneficiario/i,
  /movimento/i,
  /operazione/i,
  /dare/i,
  /avere/i,
  /saldo/i,
];

for (let r = 0; r < Math.min(rawMatrix.length, 20); r++) {
  const row = rawMatrix[r] || [];
  let score = 0;
  for (const cell of row) {
    const val = String(cell || '').trim();
    if (headerKeywords.some((rx) => rx.test(val))) {
      score++;
    }
  }
  headerScores.push({ index: r, score, row });
}

headerScores.sort((a, b) => b.score - a.score);
if (headerScores.length > 0 && headerScores[0].score > 0) {
  headerRowIndex = headerScores[0].index;
}

console.log(
  `${colors.green}✔ Intestazione identificata alla riga:${colors.reset} ${colors.bold}${headerRowIndex + 1}${colors.reset} (offset skip iniziale: ${headerRowIndex} righe)\n`
);

const headers = (rawMatrix[headerRowIndex] || []).map((h, idx) => {
  const name = String(h || '').trim();
  return name ? name : `Colonna_${idx + 1}`;
});

const dataRows = rawMatrix.slice(headerRowIndex + 1).filter((r) => r && r.length > 0);
const samples = dataRows.slice(0, sampleLimit);

// 2. Analisi Colonne & Tipi dedotti
console.log(`${colors.bold}--- Profilazione Colonne & Tipi Rilevati ---${colors.reset}`);

function inferType(values) {
  let isDateIT = 0;
  let isDateISO = 0;
  let isDateExcel = 0;
  let isAmountIT = 0;
  let isAmountStandard = 0;
  let negativeCount = 0;
  let positiveCount = 0;

  for (const v of values) {
    if (v === null || v === undefined || String(v).trim() === '') continue;
    const str = String(v).trim();

    // Data italiana (es. 24/10/2026, 24-10-2026)
    if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}/.test(str)) isDateIT++;
    // Data ISO (es. 2026-10-24)
    else if (/^\d{4}-\d{2}-\d{2}/.test(str)) isDateISO++;
    // Seriale Excel (numero intero 40000-60000)
    else if (typeof v === 'number' && v > 35000 && v < 65000) isDateExcel++;

    // Importo numerico nativo
    if (typeof v === 'number' && (v <= 35000 || v >= 65000)) {
      isAmountStandard++;
      if (v < 0) negativeCount++;
      else positiveCount++;
    }
    // Importo con virgola italiana (es. -1.250,50 o 12,00 o 10,1)
    else if (/^[+-]?\s*\d{1,3}(\.\d{3})*,\d+$/.test(str) || /^[+-]?\s*\d+,\d+$/.test(str)) {
      isAmountIT++;
      if (str.includes('-')) negativeCount++;
      else positiveCount++;
    }
    // Importo standard con punto (es. -1250.50 o 10.1)
    else if (/^[+-]?\s*\d+(\.\d+)?$/.test(str) && !/^\d{4}$/.test(str)) {
      isAmountStandard++;
      if (str.includes('-')) negativeCount++;
      else positiveCount++;
    }
  }

  const total = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '').length;
  if (total === 0) return { type: 'Empty / Null', sign: 'N/A' };

  let type = 'String';
  if (isDateIT / total > 0.6) type = 'Date (Italian DD/MM/YYYY)';
  else if (isDateISO / total > 0.6) type = 'Date (ISO YYYY-MM-DD)';
  else if (isDateExcel / total > 0.6) type = 'Date (Excel Serial Number)';
  else if (isAmountIT / total > 0.6) type = 'Amount (Italian format: 1.250,50)';
  else if (isAmountStandard / total > 0.6) type = 'Amount (Numeric float: 1250.50)';

  let signInfo = 'N/A';
  if (type.startsWith('Amount')) {
    signInfo = `${negativeCount} negativi / ${positiveCount} positivi`;
  }

  return { type, sign: signInfo, negativeCount, positiveCount };
}

const columnProfiles = headers.map((name, colIdx) => {
  const colValues = samples.map((row) => row[colIdx]);
  const inference = inferType(colValues);
  return {
    index: colIdx,
    name,
    samples: colValues.slice(0, 3).map((v) => (v === undefined ? '' : String(v))),
    ...inference,
  };
});

for (const col of columnProfiles) {
  const sampleStr = col.samples.map((s) => `"${s}"`).join(', ');
  console.log(
    `[${String(col.index + 1).padStart(2, '0')}] ${colors.bold}${col.name}${colors.reset} → ${colors.magenta}${col.type}${colors.reset}`
  );
  console.log(`     Esempi: ${sampleStr}`);
  if (col.sign !== 'N/A') {
    console.log(`     Ripartizione Segno: ${colors.yellow}${col.sign}${colors.reset}`);
  }
}

// 3. Rilevamento Campi Chiave per il Mapping
console.log(`\n${colors.bold}--- Campi Suggeriti per il Mapping su Transaction ---${colors.reset}`);
const dateCol = columnProfiles.find((c) => /data|date/i.test(c.name) && c.type.startsWith('Date'));
const amountCol = columnProfiles.find((c) => /importo|amount|dare|avere/i.test(c.name) && c.type.startsWith('Amount'));
const descCol = columnProfiles.find((c) => /causale|descrizione|description|dettaglio/i.test(c.name));

console.log(`• Data: ${dateCol ? `${colors.green}${dateCol.name} (col #${dateCol.index + 1})${colors.reset}` : `${colors.red}Non rilevata con certezza${colors.reset}`}`);
console.log(`• Importo: ${amountCol ? `${colors.green}${amountCol.name} (col #${amountCol.index + 1})${colors.reset}` : `${colors.red}Non rilevato con certezza${colors.reset}`}`);
console.log(`• Descrizione: ${descCol ? `${colors.green}${descCol.name} (col #${descCol.index + 1})${colors.reset}` : `${colors.red}Non rilevata con certezza${colors.reset}`}`);

// 4. Avviso Segno Contabile
if (amountCol && amountCol.positiveCount > 0 && amountCol.negativeCount === 0) {
  console.log(`\n${colors.yellow}${colors.bold}⚠️ ATTENZIONE SEGNO CONTABILE (Carta di Credito / Spese Positive):${colors.reset}`);
  console.log(`  Tutti gli importi campionati sono positivi. Negli estratti carta di credito le spese sono indicate con segno positivo.`);
  console.log(`  ${colors.bold}Regola vincolante ADR-013:${colors.reset} invertire il segno in uscita -> amount = -Math.abs(normalizeAmount(rawAmount));`);
}

// 5. Scaffolding Bozza Schema TypeScript
const cleanChannelName = path.parse(filePath).name.replace(/[^a-zA-Z0-9]/g, '');
console.log(`\n${colors.bold}--- Bozza Scaffold Contratto TypeScript (${cleanChannelName}) ---${colors.reset}\n`);

const tsInterface = `
// 1. Contratto di Riga Grezza
export interface Raw${cleanChannelName}Row {
${columnProfiles
  .map((c) => {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(c.name) ? c.name : `'${c.name}'`;
    return `  ${safeKey}: ${c.type.startsWith('Amount') ? 'string | number' : 'string'};`;
  })
  .join('\n')}
}

// 2. Normalizzatore verso Transaction del Vault
export function parse${cleanChannelName}(rows: any[]): Transaction[] {
  // Offset header rilevato: ${headerRowIndex} righe
  const startRow = ${headerRowIndex > 0 ? headerRowIndex : 0};
  const list: Transaction[] = [];

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    
    // Normalizza data e importo
    const rawDate = row[${dateCol ? dateCol.index : 0}];
    const rawAmount = row[${amountCol ? amountCol.index : 1}];
    const rawDesc = String(row[${descCol ? descCol.index : 2}] || '');

    const date = normalizeDate(rawDate);
    let amount = normalizeAmount(rawAmount);
    // TODO: applicare convenzione di segno ADR-013 (uscite < 0, entrate > 0)
    ${amountCol && amountCol.positiveCount > 0 && amountCol.negativeCount === 0 ? 'if (amount > 0) amount = -amount;' : ''}

    const desc = cleanDescription(rawDesc);
    const cat = categorizeDescription(desc, amount, '${cleanChannelName}');

    list.push({
      id: \`${cleanChannelName.toLowerCase()}-\${date}-\${i}-\${Math.abs(amount).toFixed(2)}\`,
      date,
      channel: '${cleanChannelName}' as any,
      amount,
      macroCategory: cat.macroCategory,
      category: cat.category,
      description: desc,
      rawDescription: rawDesc,
      tags: [...cat.tags, '#${cleanChannelName.toLowerCase()}'],
      isExtraordinary: cat.isExtraordinary,
      autoCategorized: cat.autoCategorized,
    });
  }

  return list;
}
`;

console.log(tsInterface);
console.log(`${colors.green}✔ Profilazione completata.${colors.reset}\n`);
