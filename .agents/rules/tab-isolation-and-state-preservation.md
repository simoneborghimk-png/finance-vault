# Standard di Isolamento dei Filtri & Preservazione dello Stato (Tab Isolation & State Preservation)

Questo documento definisce le regole operative vincolanti per la gestione dello stato dei filtri, la navigazione tra tab e la progettazione ergonomica delle toolbar di ricerca all'interno di **Personal Finance Vault & Dashboard**.

---

## 1. Principio Fondamentale di Isolamento per Vista (Tab Filter Isolation)

1. **Autonomia Totale di Ciascuna Pagina:**
   - I filtri di ricerca, categoria, canale, finestra temporale o spese straordinarie impostati all'interno di una pagina/tab agiscono **esclusivamente sul perimetro visivo di quella pagina**.
   - È **severamente vietato** condividere o sollevare (lift) filtri specifici di visualizzazione a livello root globale provocando la contaminazione incrociata tra tab differenti (es. impostare *"Questo mese"* in Transazioni non deve MAI riscrivere la data della Dashboard).
2. **Default Indipendenti:**
   - Ciascuna vista si apre con il proprio default (es. *"Anno in corso (YTD)"*), ma la modifica manuale di una vista non influenza le altre.

---

## 2. Navigazione Non Distruttiva tra Tab (Preservazione tramite `forceMount`)

1. **Divieto di Unmount Distruttivo:**
   - Negli schemi a schede (es. Radix UI / Shadcn `<Tabs>`), il comportamento nativo di smontare il componente inattivo dal DOM è **vietato** per i moduli applicativi principali.
   - Ogni `<TabsContent>` deve essere dichiarato con:
     ```tsx
     <TabsContent value="..." forceMount className="outline-none focus:outline-none data-[state=inactive]:hidden">
     ```
2. **Conservazione dello Stato Utente:**
   - Lo switch tra le schede deve avvenire tramite visibilità CSS (`display: none` / `display: block`).
   - Passando da una tab all'altra e tornando indietro, l'utente deve ritrovare intatti:
     - Testo cercato nella barra di ricerca.
     - Filtri di categoria, canale o temporali selezionati.
     - Pagina corrente nella paginazione della tabella (es. pagina 4).
     - Righe espanse per i dettagli.
     - Posizione di scroll.

---

## 3. Rilevamento Deterministico nel DateRangePicker

1. **Sincronia Indissolubile tra Dati e Label:**
   - La label mostrata sul pulsante del selettore data (es. *"Anno in corso (2026)"*, *"Questo mese"*, *"Ultimi 3 mesi"*) e il checkmark visivo dell'elenco preset devono essere calcolati in modo **deterministico** confrontando l'intervallo temporale effettivo (`value.from` e `value.to`) con i preset noti.
   - È vietato mantenere uno stato `activePreset` disallineato da `value`, che provocherebbe incongruenze visive (es. label *"Anno in corso"* mentre i dati sono filtrati su *"Questo mese"*).
2. **Fallback Pulito su Date Esatte:**
   - Se un intervallo non corrisponde a nessun preset predefinito, la label mostra sempre l'intervallo formattato (es. `1 ott 2026 – 24 ott 2026`).

---

## 4. Gerarchia e Responsività delle Toolbar (Two-Tier Layout)

1. **Divieto di Schiacciamento su Singola Riga Flex:**
   - È vietato collocare un input di ricerca elastico (`flex-1`) sulla stessa riga flex di molteplici selettori a larghezza fissa (es. 3 dropdown + datepicker + switch = oltre 900px).
   - Su schermi medi o finestre ridimensionate, questo pattern comprime la casella di ricerca riducendola a un'icona microscopica inutilizzabile (`[ 🔍 ]`).
2. **Struttura Standard a Due Livelli:**
   - **Livello 1 (Ricerca Full-Text):** Campo di ricerca a tutta larghezza (`w-full`), spazioso, con icona di ricerca a sinistra e pulsante di cancellazione `X` a destra. Se sono attivi filtri di ricerca, il pulsante *"Azzera filtri"* si affianca a destra in modo visibile e ordinato.
   - **Livello 2 (Toolbar Filtri Dimensionali):** Riga separata con bordo sottile di respiro (`pt-2 border-t border-border/40`), in cui dropdown Macro, Categoria Specifica, Canale, DateRangePicker e Switch Straordinarie si dispongono con `flex-wrap` e gap calibrato.

---

## 5. Ergonomia del Comando "Azzera Filtri"

1. **Nessun Falso Positivo all'Avvio:**
   - Il pulsante *"Azzera filtri"* deve essere visibile **solo se** l'utente ha inserito una ricerca testuale o selezionato un filtro specifico di macro/categoria/canale.
   - La presenza di una data di default (es. *"Anno in corso"*) **non deve** attivare il pulsante all'avvio dell'applicazione.
2. **Reset Non Distruttivo:**
   - Cliccare *"Azzera filtri"* pulisce unicamente il testo e i menu a tendina dimensionali, preservando la selezione del periodo temporale scelto dall'utente.
