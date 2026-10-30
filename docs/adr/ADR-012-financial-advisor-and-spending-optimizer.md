# ADR-012: Financial Advisor, Seasonal Wealth Roadmap & Spending Optimizer

- **Stato:** Accettata
- **Data:** 2026-10-30
- **Contesto:**
  Nel tracciamento delle finanze personali con retribuzione CCNL e previdenza complementare (Allianz Orizzonte Previdenza / Fon.Te.), coesistono dinamiche stagionali e vincoli complessi:
  1. **Dispersione Informativa & Mancanza di Consulenza Tattica:** Gli utenti faticavano a calibrare il ritmo di spesa quotidiana discrezionale (*Wants*) rispetto al proprio cash flow residuo, rischiando di sforare o di vivere con un'ansia finanziaria non necessaria in assenza di un indicatore chiaro *"Safe-to-Spend"* (Daily Safe Allowance).
  2. **Stagionalità dei Flussi Straordinari CCNL e Fiscali:** Il ciclo finanziario annuale beneficia di iniezioni straordinarie cadenzate nel tempo (14ª Mensilità a Giugno da ~1.848 €, Rimborso IRPEF 730 a Luglio/Agosto da ~2.290 €, 13ª Mensilità a Dicembre da ~1.850 €). Mancava una roadmap a 4 fasi (Q1, Q2, Q3, Q4) che guidasse l'allocazione anticipata di tali liquidità verso obiettivi strategici ed evitasse l'assorbimento in spese ordinarie.
  3. **Pianificazione Tranches Fondo Pensione (Art. 51 TUIR):** Il tetto di deducibilità massima di **5.164,57 €** annui necessita di essere saturato entro il 31 Dicembre. Senza un piano a tranches distribuito tra 14ª, rimborso 730 e saldo di fine anno, l'utente rischiava di concentrare lo sforzo a Dicembre con conseguente stress di cassa, oppure di perdere credito IRPEF (35% - 43%).

- **Decisione:**
  1. **Modulo Indipendente di Calcolo (`src/lib/financialAdvisor.ts`):**
     - Sviluppato un motore matematico puro, disaccoppiato dalla UI, che calcola il *Safe-to-Spend Cap* mensile: `Stipendio base - Costi fissi certi (da recurringDetector) - Risparmio programmatico (20%)`.
     - Calcolo continuativo di: spesa Wants reale del mese, margine residuo spendibile, percentuale di utilizzo e *Daily Safe Allowance* (`margine / giorni_rimanenti_nel_mese`).
  2. **Roadmap Stagionale a 4 Trimestri:**
     - **Q1 (Inverno / Gen-Mar):** *Consolidamento & Routine* (gestione uscite senza extra, monitoraggio conguagli termici e baseline).
     - **Q2 (Primavera / Apr-Giu):** *Finestra 14ª Mensilità* (1ª Tranche Fondo Pensione consigliata ~2.000 €; allocazione vacanze estive).
     - **Q3 (Estate / Lug-Set):** *Finestra Rimborso 730* (2ª Tranche Fondo Pensione consigliata ~1.800 € dal rimborso del cedolino; consolidamento fondo emergenza).
     - **Q4 (Autunno-Inverno / Ott-Dic):** *Finestra 13ª & Conclusione Fiscale* (3ª Tranche a saldo della capienza residua esatta entro il 18 Dicembre per valuta 31/12).
     - Rilevamento automatico della *Fase Attiva* ("SEI QUI") con indicatore dei giorni alla scadenza.
  3. **Strategia delle 3 Tranches Previdenziali:**
     - Calcolo in tempo reale dei versamenti già registrati a consuntivo nell'anno fiscale selezionato.
     - Quantificazione del credito IRPEF già maturato e del credito ulteriore generabile (con toggle aliquota marginale 35% / 43%).
     - Calendarizzazione delle 3 tranches con monitoraggio di completamento (*Completata*, *In Scadenza / Urgente*, *Pianificata*).
  4. **Insight Tattici Intelligenti (Advisor Cards):**
     - Rilevamento automatico di: liquidità mensile liberata da prestiti estinti (es. Switch 2 con +89,14 €/mese), countdown rate per prestiti in chiusura (es. Soundbar LG con scadenza Luglio 2027), alert capienza previdenziale e scadenze annuali.
  5. **Promozione a Vista Principale (`FinancialAdvisor.tsx` & Tab in `App.tsx`):**
     - Posizionata come 3ª Tab di primo livello (`advisor`) con icona `Compass`, navigazione non distruttiva `forceMount` e layout su canvas privo di card wrapper esterni inutili.

- **Conseguenze:**
  - **Positive:** Piena visibilità sulla sostenibilità quotidiana della spesa; valorizzazione massima dei benefici fiscali del CCNL e del Fondo Pensione; azzeramento dello stress di liquidità a fine anno; architettura Zero-Knowledge intatta (nessun dato esce dal browser locale).
  - **Negative:** Richiede la presenza di transazioni o del profilo stipendiale per produrre stime coerenti (è previsto un solido fallback sui default del profilo in caso di vault appena inizializzato).

