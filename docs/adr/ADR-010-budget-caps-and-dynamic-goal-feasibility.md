# ADR-010: Monitoraggio Temporale BudgetCap e Feasibility Engine degli Obiettivi di Risparmio

- **Stato:** Accettata
- **Data:** 2026-10-24
- **Contesto:**
  Nel modulo di pianificazione finanziaria e grandi progetti (`GoalPlanner`), coesistevano due limitazioni funzionali:
  1. I **Budget Cap** mensili per categoria erano vincolati in modo rigido all'ultimo mese rilevato, impedendo all'utente di consultare lo storico dei mesi precedenti o di verificare la tenuta dei limiti nel tempo. Mancavano inoltre metriche di sintesi aggregata (budget complessivo, totale speso, margine residuo, riepilogo stati OK/warning/sforato).
  2. Gli **Obiettivi di Risparmio** (es. grandi viaggi, acquisti importanti) calcolavano la copertura fornita dalle mensilità estive (14ª di Giugno e rimborso 730 di Luglio), ma non valutavano la sostenibilità dello sforzo ordinario residuo (`€/mese`) rispetto al tasso di risparmio e al cash flow reale dell'utente.

- **Decisione:**
  1. **Selettore Mese Storico per BudgetCap:**
     - Estrazione dinamica e ordinamento decrescente di tutti i mesi presenti nelle transazioni del vault.
     - Selettore temporale a tendina formattato in lingua italiana (es. *"Ottobre 2026"*).
     - Calcolo istantaneo della spesa reale per categoria filtrata per il mese selezionato.
  2. **Mini-Cruscotto Aggregato delle Soglie:**
     - Visualizzazione a colpo d'occhio di: Budget Totale Monitorato, Totale Speso nel Mese, Margine Netto Residuo (verde smeraldo per surplus o rosso per deficit) e badge di conteggio delle categorie (*OK*, *Pre-allarme ≥75%*, *Sforate*).
  3. **Motore di Valutazione Fattibilità Obiettivi & Allocazione Multi-Fonte:**
     - Integrazione completa delle tre leve di liquidità straordinaria CCNL e Fiscale: **14ª Mensilità (Giugno)**, **Rimborsi Fiscali 730 (Luglio, Agosto, Settembre)** e **13ª Mensilità (Dicembre)**, con rilevamento dinamico degli accrediti effettivi da transazioni.
     - Sostituzione del campo data nativo con il componente dedicato `MonthTargetPicker` integrato su riga singola con il budget, dotato di popover, navigatore anno/mesi e preset rapidi (*Tra 1 mese*, *Tra 3 mesi*, *Tra 6 mesi*, *Tra 1 anno*, *Tra 2 anni*).
     - Calcolo continuativo della capacità reale di risparmio ordinario mensile (`avgMonthlyNetSavings`) e del tasso medio di risparmio (`avgSavingsRatePct`) a partire dalle transazioni effettive.
     - Classificazione della fattibilità per ciascun traguardo:
       - *Copertura 100% Extra:* nessun impatto sullo stipendio ordinario (assorbito da 14ª, 730 e 13ª).
       - *Altamente Sostenibile:* sforzo mensile < 50% del surplus reale.
       - *Impegnativo:* sforzo mensile tra il 50% e il 100% del surplus.
       - *Rischio Squilibrio:* sforzo mensile > 100% del surplus reale.
  4. **Proiezione Data Realistica in Caso di Squilibrio:**
     - Se l'obiettivo eccede la capacità di cassa, il sistema calcola automaticamente quanti mesi reali occorrono (`remainingToFund / avgMonthlyNetSavings`) e stima la data realistica di completamento con il differenziale in mesi rispetto al target desiderato.

- **Conseguenze:**
  - **Positive:** Piena consapevolezza della disciplina di spesa nel tempo; obiettivi di vita realistici e ancorati alla vera traiettoria finanziaria personale; prevenzione di squilibri di cassa occulti.
  - **Negative:** Richiede che il vault contenga una cronologia di transazioni per calcolare un tasso di risparmio statisticamente significativo (è stato predisposto un fallback sul profilo stipendiale base per vault appena inizializzati).
