# ADR-011: Rilevamento Intelligente e Monitoraggio Uscite Ricorrenti e Abbonamenti

- **Stato:** Accettata
- **Data:** 2026-10-24
- **Contesto:**
  Nel tracciamento ordinario delle spese personali, gli addebiti periodici (abbonamenti software e streaming, rate di finanziamenti a tasso zero o al consumo, bollette e utenze domestiche, donazioni verso enti del terzo settore) tendono a frammentarsi nel flusso cronologico del conto corrente, occultando il reale carico di "costi fissi impegnati" del mese e dell'anno.
  Era necessario un motore client-side capace di rilevare automaticamente queste uscite senza richiedere inserimenti manuali ridondanti, salvaguardando l'architettura Zero-Knowledge del Vault.

- **Decisione:**
  1. **Motore Euristico Determinico & Pricing Model (`recurringDetector.ts`):**
     - Normalizzazione semantica dei merchant da causali SDD bancarie, circuiti carte, Satispay e PayPal (es. *TIMFIN*, *Compass Banca*, *Vorwerk Bimby*, *Telecom Italia / Fibra TIM*, *Iren Mercato*, *Arca*, *UNHCR*, *LAV*, *Google YouTubePremium*, *Microsoft Payments*, *Satispay @silvioleuci*, *PayPal Gabriele Zaniboni*).
     - Riconoscimento esplicito del pricing model economico:
       - *Canoni Flat & Connettività:* canone costante soggetto a monitoraggio variazioni tariffarie e rimodulazioni contrattuali (saldo netto tra rincari e riduzioni di prezzo).
       - *Utenze a Consumo Variabile (Luce, Gas, Acqua, Rifiuti):* superata l'ambiguità dell'ultima bolletta; esposizione della media storica consuntivata e della percentuale di scostamento dell'ultima bolletta (`↓ sotto media` o `↑ sopra media`).
       - *Rate & Finanziamenti ad Ammortamento Finito:* estinzione a termine con debito residuo effettivo, avanzamento rateale a blocchi visivi e data certa di fine piano.
     - Calcolo dell'intervallo temporale medio tra le transazioni (cluster 25-35 gg per frequenza *Mensile*, 50-70 gg per *Bimestrale*, 80-100 gg per *Trimestrale*, >300 gg per *Annuale*).
     - Calcolo continuativo di importo medio, importo recente, costo annualizzato (`€/anno`) e stima deterministica del **prossimo addebito previsto** con contatore dei giorni mancanti (`tra X giorni` / `oggi`).
  2. **Interfaccia Esecutiva Dedicata su Canvas & Promozione a 1° Livello (`RecurringTracker.tsx`):**
     - Promossa a tab di navigazione primaria di 1° livello nella barra superiore (`Costi Fissi & Utenze`).
     - Layout arioso su canvas senza card wrapper esterni ridondanti, con header standardizzato conforme a tutte le viste (icona semantica tab a sinistra, selettore periodo `DateRangePicker` ad allineamento destro che rimodula realmente l'intera pagina).
     - 4 Card KPI unificate nello stile semantico di Dashboard e Transazioni (Canoni Flat, Utenze Medie, Rate Finanziamenti, Variazioni Tariffarie Nette).
     - Analizzatore Utenze con Recharts `LineChart` multi-serie e toggle chip interattivi (Luce, Gas, Acqua, TARI), affiancato da 4 schede comparative inferiori.
     - Monitor Rimodulazioni trasparente con scomposizione tra rincari lordi e risparmi tariffari.
     - Toolbar filtri avanzata a due livelli con ricerca full-text immediata, cancellazione rapida `(X)`, reset filtri e 5 dropdown responsivi (Stato, Canale, Tipo, Frequenza, Ordinamento).
     - Card con layout gerarchico a espansione (Tier 0 A11y): badge canale (BancoBPM, Numia, Nexi, PayPal, Satispay), transizione circuito (`Nexi ➔ Numia`), frequenza, data prossimo addebito con indicatore visivo di imminenza ed elenco cronologico illimitato di tutti gli addebiti riscontrati.
  3. **Persistenza & Override Zero-Knowledge:**
     - Salvataggio delle preferenze di esclusione/silenziamento utente (`recurringOverrides`) all'interno del payload `VaultData` protetto da crittografia AES-256-GCM.
  4. **Riconciliazione Quote Condivise & Canali Reali:**
     - Mappatura intelligente dei trasferimenti P2P per abbonamenti condivisi (es. Crunchyroll su Satispay verso Silvio Leuci, Netflix su PayPal verso Gabriele Zaniboni).

- **Conseguenze:**
  - **Positive:** Totale visibilità preventiva sui rinnovi imminenti e sul peso reale dei costi fissi annuali; eliminazione di abbonamenti fantasma o dimenticati; perfetta coerenza tra media consuntiva delle bollette stagionali e canoni fissi; zero latenza grazie all'esecuzione pura in-memory sul client.
  - **Negative:** Richiede che il conto contenga almeno 2 o 3 addebiti storici per calcolare con precisione l'intervallo (mitigato dal riconoscimento automatico dei brand noti anche con storico breve).
