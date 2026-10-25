# ADR-009: Tracciamento Automatico Deducibilità Fiscale Fondo Pensione (Art. 51 TUIR)

- **Stato:** Accettata
- **Data:** 2026-10-24
- **Contesto:**
  La disciplina tributaria italiana (art. 51 del TUIR e D.Lgs. 252/2005) fissa in **5.164,57 €** annui il plafond massimo di deducibilità dal reddito complessivo IRPEF per i contributi versati alla previdenza complementare (Allianz Orizzonte Previdenza, Fondo Fon.Te., ecc.).
  Nel software, il simulatore fiscale operava inizialmente come strumento ipotetico isolato senza visibilità sulle transazioni del vault:
  1. Non rilevava se l'utente avesse già effettuato versamenti effettivi nel corso dell'anno (bonifici deducibili o contributi a consuntivo).
  2. Rischiava di simulare deduzioni fiscali fittizie oltre il tetto di legge in presenza di versamenti multipli.
  3. Non guidava l'utente verso la saturazione esatta della deducibilità residua (`5.164,57 € - già versato`).
  4. Non avvisava l'utente dell'adempimento obbligatorio di comunicazione dei contributi non dedotti per somme eccedenti.

- **Decisione:**
  1. **Collegamento Transazionale:** Il componente `TaxPensionSimulator` riceve la collezione completa delle transazioni del vault (`transactions: Transaction[]`).
  2. **Selettore Anno Fiscale & Rilevamento Consuntivo:** L'utente può selezionare l'anno fiscale di riferimento (con default sull'anno più recente disponibile). Il sistema scansiona le transazioni dell'anno con `category === 'Previdenza Integrativa'`, tag previdenziali (`#previdenza`, `#fondo`, `#deducibile`) o causali bancarie pertinenti, calcolando il totale già versato a consuntivo (`alreadyContributed`).
  3. **Calcolo Dinamico Deducibilità Residua & Barra Segmentata:**
     - `remainingDeductible = Math.max(0, 5164.57 - alreadyContributed)`
     - Visualizzazione a 3 segmenti (già versato, nuovo pianificato, residuo libero).
  4. **Preset Intelligente di Saturazione:** Introduzione del preset rapido *"Satura Plafond Residuo"* che imposta lo slider esattamente sulla capienza ancora sfruttabile.
  5. **Calcolo Rimborso 730 Rigoroso:** Il credito IRPEF a rimborso nel Modello 730 viene calcolato esclusivamente sulla quota che non sfora il plafond (`Math.min(contribution, remainingDeductible)`).
  6. **Gestione Contributi Non Dedotti (D.Lgs. 252/2005):** In caso di superamento del plafond, viene visualizzato un alert con le istruzioni per la comunicazione formale al fondo pensione entro il 31 Dicembre dell'anno successivo, prevenendo la doppia tassazione al momento del riscatto.
  7. **Persistenza & Trasparenza:** Aggiunto il pulsante per salvare la pianificazione del versamento volontario direttamente in `vault.pensionVoluntaryContribution` e un registro espandibile dei movimenti contabili rilevati.

- **Conseguenze:**
  - **Positive:** Precisione contabile al centesimo; eliminazione di simulazioni irrealistiche; massima ottimizzazione fiscale del risparmio; trasparenza e verificabilità di ogni cifra.
  - **Negative:** Richiede che le transazioni relative al fondo pensione abbiano categorie o tag conformi alle regole di parsing (già garantito dal motore di categorizzazione).
