# ADR-005: Riconciliazione Multi-Fonte e Granularità Transazionale

- **Stato:** Accettata
- **Data:** 2026-10-24
- **Contesto:**
  Gli estratti conto del conto corrente bancario (Banco BPM) aggregano le spese delle carte di credito (Numia, Nexi) sotto forma di addebiti complessivi SDD a fine mese, rischiando duplicazioni di spesa se combinati con i file delle singole carte. Inoltre, tutti i pagamenti effettuati su Amazon figurano con la dicitura generica "Amazon EU S.a r.l.", rendendo impossibile distinguere tra spesa alimentare, libri, elettronica, farmacia o casa.

- **Decisione:**
  1. **Disaccoppiamento Addebiti Doppi:** Riconoscere ed escludere i movimenti di riaddebito SDD di carte e prestiti sul conto BPM quando le singole transazioni granulari della carta sono già presenti nei canali dedicati (`Numia`, `Nexi`).
  2. **Incrocio Amazon a Grana Fine (`amazonReconciler`):** Sviluppare un motore di matching che incrocia la cronologia ordini con i movimenti delle carte per importo e data (finestra di tolleranza di 3 giorni tra ordine e contabilizzazione effettiva). Le righe vengono riclassificate con categoria analitica (es. Spesa Alimentare, Salute e Farmacia, Cura Personale, Libri e Fumetti) e arricchite con tag specifici.
  3. **Riclassificazione Impegni Fissi (`Commitments`):** Rate ricorrenti di finanziamento (es. TIMFIN per acquisto smartphone) vengono scorporate dalle bollette ordinarie e allocate nella macro-categoria `Commitments`.

- **Conseguenze:**
  - **Positive:** Totale spesa reale accurato al centesimo; zero residui in "Altre Spese"; grafici di bilancio e tassi di risparmio fedeli alla realtà.
  - **Negative:** Richiede l'esportazione della cronologia ordini Amazon in caso di nuovi acquisti per mantenere la massima granularità.
