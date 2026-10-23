# Regola: Divieto di Avvio Automatico del Browser per Test Stilistici & Interattivi

## Divieto Assoluto di Browser Subagent & Automazione Interattiva Chrome

- **Nessun avvio automatico del subagent browser (`browser_subagent`):** È severamente vietato invocare `browser_subagent` o strumenti automatizzati di controllo interattivo del browser (Chrome interattivo pilotato via CDP dall'assistente) per verificare stili, layout o stati UX.
- **Motivazione Tecnica:** Su macOS l'avvio del browser di testing con profilo utente e porta interattiva lascia processi orfani e socket aperte (porta 9222 / profilo Chrome) che provocano deadlock, crash del Language Server (`SIGABRT`) e il blocco perenne dell'interfaccia IDE nello stato "Working".

## Modalità Operativa di Verifica

- **Analisi Statica e Test Headless (Ammessi e Obbligatori):** La validazione delle modifiche deve avvenire esclusivamente tramite:
  1. Analisi statica dei file sorgente (lettura TSX, CSS, conformità token).
  2. Esecuzione di comandi headless/CLI in terminale standard: controlli TypeScript (`npx tsc --noEmit`), build di validazione (`npm run build`), linting.
- **Controllo Visivo Interattivo Riservato all'Utente:** Il riscontro visivo finale e interattivo nell'anteprima di sviluppo locale (es. `http://localhost:5173/` o `:5174/`) è sempre demandato all'utente.
- **Richiesta Dati al Browser:** Se l'agente ha stretta necessità di stili computati o informazioni di runtime ricavabili solo dal browser, non deve tentare di pilotare Chrome: deve chiedere direttamente all'utente nella chat i passaggi da ispezionare tramite DevTools.
