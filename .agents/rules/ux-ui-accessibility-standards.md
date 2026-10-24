# Regole Operative UX, UI & Accessibilità (Tier 0 Design System Authority)

Questo documento sintetizza le linee guida vincolanti e gli standard universali di UX, UI, ergonomia e accessibilità (WCAG 2.2 AA) ereditati da `agent-core-knowledge` (`design.md` e `dev-handoff-checklist.md`).

---

## 1. Gerarchia delle Azioni (Button & Action Hierarchy)

- **Regola dell'Azione Primaria Singola:** È consentito al massimo **1 solo pulsante primario (`variant="primary"` / `variant="default"`) per schermata**.
- **Azioni di Sezione e Toolbar (`variant="secondary"` / `variant="outline"`):** Tutte le azioni collocate negli header di sezione, nelle toolbar delle tabelle o nei pannelli intermedi adottano la variante `secondary` o `outline`, evitando che più bottoni primari competano per l'attenzione dell'utente.
- **Azioni di Riga e Terziarie (`variant="ghost"` / `variant="outline"`):** Comandi contestuali, icone di modifica/cancellazione e link di riga adottano `ghost` o `outline`.
- **Dimensioni Standard:** Pulsanti con testo adottano sempre la dimensione standard (`size="md"`, altezza 32px / `h-8`). Dimensioni ridotte (`sm`, `xs`) ammesse solo per vincoli di spazio documentati.
- **Divieto di Pulsanti Dashed:** È vietato l'uso di bottoni a bordo tratteggiato (_dashed-outline_).

---

## 2. Form e Data Entry Resilienti

1. **Submit Sempre Abilitato a Riposo:**
   - Il pulsante di invio deve essere **sempre abilitato** allo stato di riposo.
   - **Divieto di disabilitazione preventiva del submit** (es. `disabled={!isValid}` a monte): impedisce la focusabilità da tastiera, ha contrasto insufficiente e non comunica quali campi manchino.
   - Disabilitato esclusivamente *in-flight* mentre la richiesta asincrona è in elaborazione (per prevenire il doppio invio accidentale).
   - Se l'utente tenta l'invio con campi non validi: evidenziare i campi errati e spostare automaticamente il focus sul primo campo invalido.
   - _Eccezione:_ Dialog di conferma rafforzata con digitazione (Type-to-confirm).
2. **Campi a Piena Larghezza (Full-Width):**
   - Tutti gli `<Input>` e `<Select>` nei form occupano l'intera larghezza della colonna (`w-full`), anche se affiancati.
   - Per importi monetari o quote numeriche discrete utilizzare larghezze calibrate (es. `w-36` / font monospazio `font-mono`).
3. **Label Semantiche & Integrità Visiva:**
   - Vietato sostituire l'etichetta con il solo `placeholder`.
   - Utilizzare esclusivamente il componente `<Label>` di Shadcn associato semanticamente (`htmlFor`).
   - L'asterisco visivo è riservato ai soli campi obbligatori (`required`).
4. **Validazione Non Punitiva:** Scatta all'uscita dal campo (`blur`).

---

## 3. Architettura Data Grid, Tabelle & Expansion Rows

1. **Expansion Rows per Dettagli Tecnici:**
   - Dettagli tecnici, note estese, log o liste di tag **non devono mai essere stipati all'interno di una cella**, provocando lo slittamento arbitrario delle larghezze delle colonne.
   - I dettagli si aprono in una **riga di espansione dedicata sottostante** a tutta larghezza coprendo tutte le colonne (`colSpan={columns.length}`).
2. **Allineamento Verticale Centrato:** Il contenuto di tutte le celle della tabella è rigorosamente centrato verticalmente (`align-middle`).
3. **RowActions Progressive:**
   - 1 sola azione: icon button (`ghost` icon-sm) con `<Tooltip>`.
   - Più azioni: menu contestuale a tendina "⋮" (`DropdownMenu`) con l'azione distruttiva per ultima, preceduta da separatore visivo e conferma.
4. **Filtri e Toolbar:** Ricerca e filtri primari inline a sinistra; filtri multipli o complessi in un `FilterPanel` (`Popover` al click). **Mai usare uno `Sheet` per contenere filtri.**
5. **Entry Point Unificato al Dettaglio:** Click sull'intera riga della tabella.

---

## 4. Badge di Stato & Iconografia

1. **Icona Obbligatoria nei Badge di Stato:**
   - Ogni badge di stato deve incorporare un'icona **Solid** del design system per garantire immediata riconoscibilità e conformità a utenti daltonici (mai affidarsi al solo colore).
   - _Completato / Attivo:_ icona spunta circolare (`CheckCircle2`).
   - _In attesa / Verifica:_ icona orologio (`Clock`) o triangolo di avviso (`AlertTriangle`).
   - _Errore / Bloccato:_ icona avviso circolare (`AlertCircle`).
   - _Non definito / Neutro:_ icona punto interrogativo (`HelpCircle`).
2. **Peso Iconografico Differenziato:**
   - Icone in pulsanti e alert: stile **Solid**.
   - Icone in menu a comparsa, sidebar di navigazione, campi di input e link: stile **Regular**.

---

## 5. Spiegazione delle Funzioni ("Explain in Tiers") & Tooltip Accessibili

1. **Livelli Gerarchici di Spiegazione:**
   - Pagine e dialog hanno sempre una riga descrittiva sintetica (≤120 caratteri) sotto il titolo.
   - Informazioni secondarie, note di calcolo o glossario adottano il pattern **Toggletip** (icona informativa "i" che apre una card `Popover` **esclusivamente al click**, mai su hover).
2. **Divieto Assoluto dell'Attributo HTML `title`:**
   - È vietato l'uso dell'attributo nativo HTML `title`. Usare esclusivamente il componente `<Tooltip>` del kit per icon-only button o testi troncati con ellissi.
   - Se il controllo scatenante è disabilitato (`disabled`), deve essere avvolto da un contenitore accessibile (`<span tabIndex={0}>`) per consentire la ricezione del focus e la lettura del tooltip esplicativo.
3. **Rischi Critici:** Sempre tramite un componente `Alert` dedicato e visibile.

---

## 6. Accessibilità & DOM Hygiene

1. **Target Ergonomico Minimo (WCAG 2.2):** Minimo 44x44px su touch / mobile e 32-40px su desktop con puntatore di precisione.
2. **"Remove What a Role Can't Use":** Funzionalità non autorizzate o non disponibili per lo stato corrente vanno escluse completamente dal DOM (nessun blocco grigio disabilitato con lucchetto).
3. **Nessun Blocco agli Eventi nei Dialog:** Vietato applicare `onClick={(e) => e.stopPropagation()}` sui container di dialog modali (`DialogContent`, `AlertDialogContent`).
