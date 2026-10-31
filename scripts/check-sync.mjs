#!/usr/bin/env node

import { spawnSync, execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(import.meta.url), '../..');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

console.log(`${colors.bold}${colors.cyan}=== [Gate di Sincronizzazione & Qualità Locale] ===${colors.reset}\n`);

// 1. Oxlint
console.log(`${colors.blue}ℹ Step 1/3: Linting rapido (oxlint)...${colors.reset}`);
const lintResult = spawnSync('npx oxlint .', {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: true,
});

if (lintResult.status !== 0) {
  console.error(
    `\n${colors.red}${colors.bold}❌ Lint check fallito (oxlint). Risolvi gli errori sopra prima di procedere.${colors.reset}\n`
  );
  process.exit(lintResult.status ?? 1);
}
console.log(`${colors.green}✔ Lint check superato.${colors.reset}\n`);

// 2. TSC
console.log(`${colors.blue}ℹ Step 2/3: Type check statico (tsc --noEmit)...${colors.reset}`);
const tscResult = spawnSync('npx tsc --noEmit', {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: true,
});

if (tscResult.status !== 0) {
  console.error(
    `\n${colors.red}${colors.bold}❌ Type check fallito (tsc --noEmit). Risolvi gli errori di tipo prima di procedere.${colors.reset}\n`
  );
  process.exit(tscResult.status ?? 1);
}
console.log(`${colors.green}✔ Type check statico superato.${colors.reset}\n`);

// 3. Git differential check
console.log(`${colors.blue}ℹ Step 3/3: Controllo differenziale Git (src/ vs documentazione)...${colors.reset}`);

function getChangedFiles() {
  const fileMap = new Map(); // path -> status

  // 1. Working tree and staging (uncommitted)
  try {
    const statusOut = execSync('git status --porcelain', {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    for (const rawLine of statusOut.split('\n')) {
      const line = rawLine.trimEnd();
      if (!line || line.length < 3) continue;
      const status = line.slice(0, 2);
      let filePath = line.slice(3).trim();
      if (filePath.includes(' -> ')) {
        filePath = filePath.split(' -> ')[1].trim();
      }
      filePath = filePath.replace(/^"|"$/g, '').replace(/\\/g, '/');

      // Escludi file puramente cancellati senza aggiunta/modifica
      if (!status.includes('D') || status.includes('M') || status.includes('A')) {
        fileMap.set(filePath, status.trim());
      }
    }
  } catch (err) {
    console.warn(`${colors.yellow}Attenzione: impossibile eseguire git status (${err.message}).${colors.reset}`);
  }

  // 2. Unpushed commits rispetto a upstream (se configurato)
  try {
    execSync('git rev-parse --abbrev-ref @{u}', {
      cwd: repoRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const diffOut = execSync('git diff --name-status @{u}..HEAD', {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    for (const rawLine of diffOut.split('\n')) {
      const line = rawLine.trim();
      if (!line) continue;
      const parts = line.split('\t');
      const status = parts[0];
      let filePath = parts[parts.length - 1].trim();
      filePath = filePath.replace(/^"|"$/g, '').replace(/\\/g, '/');

      if (!status.startsWith('D')) {
        if (!fileMap.has(filePath)) {
          fileMap.set(filePath, status);
        }
      }
    }
  } catch {
    // Nessun branch upstream o git non configurato per il tracking
  }

  return Array.from(fileMap.entries()).map(([path, status]) => ({ path, status }));
}

const changedFiles = getChangedFiles();
const srcChanges = changedFiles.filter((f) => f.path.startsWith('src/'));
const docChanges = changedFiles.filter(
  (f) => f.path === 'CHANGELOG.md' || f.path.startsWith('docs/adr/')
);

if (srcChanges.length > 0) {
  console.log(`Rilevati ${srcChanges.length} file di codice modificati o aggiunti sotto 'src/':`);
  for (const file of srcChanges) {
    console.log(`  - [${file.status}] ${file.path}`);
  }

  if (docChanges.length === 0) {
    console.error(`\n${colors.red}${colors.bold}❌ ERRORE DOCUMENTATION-SYNC-GATE:${colors.reset}`);
    console.error(
      `${colors.red}Sono state apportate modifiche al codice sorgente in 'src/', ma non risulta alcun aggiornamento documentale corrispondente in 'CHANGELOG.md' o sotto 'docs/adr/'.${colors.reset}\n`
    );
    console.error(`${colors.yellow}Azione correttiva richiesta prima di richiedere validazione:${colors.reset}`);
    console.error(`  1. Aggiorna ${colors.bold}CHANGELOG.md${colors.reset} registrando i cambiamenti nella sezione appropriata;`);
    console.error(`     OPPURE`);
    console.error(`  2. Aggiungi/aggiorna un'ADR in ${colors.bold}docs/adr/ADR-XXX-<slug>.md${colors.reset} se la modifica introduce una decisione architetturale.\n`);
    process.exit(1);
  }

  console.log(`\nDocumentazione sincronizzata rilevata:`);
  for (const doc of docChanges) {
    console.log(`  ${colors.green}✔ [${doc.status}] ${doc.path}${colors.reset}`);
  }
} else {
  console.log(`${colors.green}✔ Nessun file di codice modificato o aggiunto sotto 'src/'. Sync documentale non richiesto.${colors.reset}`);
}

console.log(`\n${colors.bold}${colors.green}🎉 Tutti i controlli di sincronizzazione e qualità sono stati superati con successo!${colors.reset}\n`);
process.exit(0);

