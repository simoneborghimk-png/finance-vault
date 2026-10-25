# ADR-006: Sincronizzazione Buste Paga da Drive e Monitoraggio Previdenziale

- **Stato:** Accettata
- **Data:** 2026-10-24
- **Contesto:**
  L'utente riceve mensilmente i cedolini paga in formato PDF all'interno di una cartella strutturata su Google Drive (`Lavoro > Buste paga > [Anno]`). Per calcolare con precisione lo stipendio netto reale, monitorare l'assorbimento della deducibilità previdenziale (art. 51 TUIR, max 5.164,57 €/anno) e pianificare le entrate extra (14ª mensilità e rimborso 730), è necessaria un'integrazione diretta client-side.

- **Decisione:**
  1. **Scansione Cartella Drive (`drive.file`):** Interrogare via Google Drive API v3 i file PDF presenti nel percorso convenzionato, scaricando e analizzando i cedolini del corrente anno fiscale in memoria volatile nel browser.
  2. **Alert Intelligente Cedolino Mancante:** Se la data corrente supera il 15 del mese e il cedolino del mese solare precedente non è presente su Drive, l'interfaccia mostra un avviso non bloccante per ricordare l'archiviazione del documento.
  3. **Aggiornamento Profilo Finanziario:** Lo stipendio netto e i contributi effettivi versati al fondo pensione integrativo alimentano automaticamente i modelli del *Simulatore Fiscale* e del *Goal Planner*.

- **Conseguenze:**
  - **Positive:** Automazione del flusso contabile stipendiale; controllo proattivo del plafond deducibile prima della fine dell'anno fiscale.
  - **Negative:** Richiede l'autorizzazione OAuth2 dello scope `drive.file` e che i PDF seguano la convenzione di denominazione/cartella dell'utente.
