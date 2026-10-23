# ADR-003: Architettura della Memoria Calda/Fredda e Token Optimization

- **Stato:** Accettata
- **Data:** 2026-10-23
- **Contesto:**
  Le interazioni con modelli LLM e assistenti AI sono soggette a limiti di context window e costi di elaborazione dei token. Caricare interi documenti storici ad ogni turno genera context bloat, latenza e rischio di allucinazioni o compattazioni forzate.

- **Decisione:**
  Ereditare integralmente da `agent-core-knowledge` la divisione della memoria in 3 livelli:
  1. **Memoria Calda (`PROGRESS.md`):** Cruscotto operativo snello mantenuto tassativamente sotto le 90–100 righe, letto come azione zero di ogni sessione.
  2. **Memoria Fredda Decisionale (`docs/adr/`):** File atomici immutabili per le scelte di architettura; consultati unicamente in caso di necessità specifica.
  3. **Memoria Fredda Storica (`CHANGELOG.md`):** Registro dei rilasci (Keep a Changelog) in cui archiviare i task completati al termine delle milestone.
  4. **Chirurgia del Contesto:** Adozione di `grep_search` e slice reading (`StartLine`/`EndLine`) al posto di letture a vuoto; targeted diffing al posto di riscritture integrali.

- **Conseguenze:**
  - **Positive:** Massimo riuso del prefix caching LLM, risposte immediate, zero context bloat, tracciabilità impeccabile di avanzamento e decisioni.
  - **Negative:** Richiede disciplina costante da parte dell'agente nel mantenere `PROGRESS.md` sotto le 100 righe e spostare i task completati in `CHANGELOG.md`.
