# ADR-013: Parser Contract Pipeline & Isolamento Schemi di Ingestione

- **Stato:** Accettata
- **Data:** 2026-10-31
- **Contesto:**
  Gli estratti conto scaricati dai portali bancari (Banco BPM, Carta Nexi, Numia, PayPal, Satispay, e futuri istituti) presentano tracciati eterogenei: metadati nelle prime righe, formati data divergenti (italiano `DD/MM/YYYY`, ISO, seriali Excel), convenzioni opposte sul segno algebrico delle spese e righe di compensazione tecnica (SDD di saldo carta o ricariche wallet). L'implementazione diretta dei parser all'interno dei componenti UI senza una previa validazione di schema isolata rischia di produrre regressioni contabili, calcoli errati del cash flow o duplicazioni di spesa.

- **Decisione:**
  1. **Pipeline Obbligatoria a 3 Stadi (Isolate-First):**
     - *Stadio 1 — Profiling & Reverse Engineering:* Analisi del file grezzo tramite lo script `scripts/inspect-export.mjs` per determinare delimitatore, offset dell'header effettivo, formati data e convenzione di segno.
     - *Stadio 2 — Typed Contract & Normalizzazione:* Definizione esplicita dell'interfaccia grezza `RawRow` e mapping deterministico verso l'interfaccia canonica `Transaction` (`id`, `date` ISO YYYY-MM-DD, `channel`, `amount`, `macroCategory`, `category`, `description`, `rawDescription`, `tags`).
     - *Stadio 3 — Validazione Isolata con Mock Fixtures:* Ogni nuovo connettore deve essere collaudato con dati mock anonimizzati prima di essere agganciato ai selettori di `TransactionsManager.tsx` o alla riconciliazione multi-fonte (`amazonReconciler.ts`).
  2. **Convenzione Vincolante del Segno Contabile:**
     - Tutte le uscite nel Vault devono essere rigorosamente **negative** (`amount < 0`).
     - Tutte le entrate devono essere **positive** (`amount > 0`).
     - Se un tracciato (es. carte di credito o riepiloghi spese) riporta gli addebiti come valori positivi, il parser ha l'obbligo di invertire il segno algebrico (`amount = -Math.abs(val)`).
  3. **Disaccoppiamento & Deduplica Clearing:**
     - Ogni parser per conto corrente deve identificare ed escludere i pagamenti cumulativi SDD riferiti a carte o canali già tracciati singolarmente (evitando il doppio conteggio rispetto alle singole transazioni granulari).
  4. **Gate di Integrazione UI:**
     - Nessun nuovo canale/parser viene esposto nell'interfaccia utente (`FileIngestionDropzone.tsx`, filtri canale) prima che lo schema e il parser abbiano superato il test isolato.

- **Conseguenze:**
  - **Positive:** Qualità contabile certificata al centesimo; zero regressioni su grafici, budget cap e indicatori di salute finanziaria; scalabilità immediata verso nuovi istituti finanziari (es. Revolut, Intesa, American Express); tracciabilità delle convenzioni di parsing.
  - **Negative:** Richiede la profilazione preventiva del dataset grezzo prima dell'integrazione del canale nella dropzone.

