# CHANGELOG.md — Personal Finance Vault & Dashboard

Tutte le modifiche rilevanti apportate a questo progetto sono documentate in questo file.
Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.1.0/).

---

## [Unreleased]

### Added / Changed
- **Zero-Knowledge Git Privacy & Portabilità Universale:**
  - Blindato `.gitignore` escludendo categoricamente le cartelle di esportazione raw (`data/`), gli script interni con cronologie ordini (`scripts/`) e il dataset compilato dei movimenti reali (`src/lib/realTransactions.json`).
  - Implementato in `src/lib/mockData.ts` il caricamento dinamico e resiliente (`import.meta.glob` di Vite): sulla macchina locale dell'utente viene agganciato automaticamente il dataset reale non versionato; su qualsiasi altra macchina o clone pubblico da GitHub, l'app compila ed esegue immediatamente effettuando il fallback sulle transazioni demo di `generate12MonthsMockTransactions()`.
  - Garantita la totale privacy in vista della pubblicazione remota: zero dati bancari, zero estratti conto e zero token Google finiscono nel versionamento Git, mentre il vault reale rimane protetto crittograficamente su Google Drive (`vault_finanze.enc` con AES-256-GCM + PBKDF2).
- **Restyling Modale Sincronizzazione Buste Paga Drive:** Risolti i difetti di layout del dialogo:
  - Eliminata la collisione visiva nell'header rimuovendo il vecchio pulsante icona in sovrapposizione con la `X` di chiusura e aggiungendo `pr-8` per il corretto respiro del titolo e della descrizione.
  - Risolto il clipping orizzontale della prima riga nella lista scrollabile aggiungendo padding interno (`p-1 pr-1.5`) e portando l'altezza utile a `max-h-[320px]`.
  - Spostato il trigger di sincronizzazione nel `DialogFooter` in basso a destra come azione primaria visibile (*"Sincronizza Buste Paga"*, colore smeraldo primario, stato di caricamento dinamico con spinner) affiancato al pulsante secondario *"Chiudi"*.
  - Sostituito lo stato *"In uso"* nelle righe dei cedolini con un badge discreto per mantenere un'unica chiara azione primaria a schermo in piena conformità con le linee guida UX/UI Tier 0.
- **Riclassificazione Finanziamenti TIMFIN (21 Transazioni):** Spostati tutti i 21 addebiti ricorrenti mensili di *TIMFIN* (rate da 10,00 € e 4,00 € per finanziamento acquisto smartphone/prodotti) dalla categoria *Fibra e Connettività* (`Needs`) alla corretta categoria **`Rate Finanziamenti`** nella macro-categoria **`Commitments`** con tag dedicati (`#rata`, `#prestito`, `#debito`, `#ricorrente`).
- **Riconciliazione Granulare Ordini Amazon (86 Ordini Estratti & 79 Movimenti Riconciliati):** Risolta l'attribuzione generica di Amazon a *Shopping e Abbigliamento*. Implementato il modulo `amazonReconciler.ts` che incrocia l'intera cronologia ordini con i movimenti bancari e delle carte:
  - **Spesa Alimentare (`Needs`):** Riconosciuti acquisti come *M&M's Confetti Arachidi*, *Haribo*, *Capsule Nespresso (100pz)*, *Dolcificante Eridania Zero*, *Barrette Barebells & Premier Protein*, *nut&me Mirtilli Liofilizzati*, *The Kraken Rum Speziato*, *Cannamela Aglio & BBQ Rubs*.
  - **Salute e Farmacia (`Needs`):** Riconosciuti *Vivin Tosse Complete 3in1*, *Aurora Biofarma Marial Stick Reflusso*, *NeuroMAG Magnesio Treonato*, *Autan Active Spray Antizanzare*, *Imetec Termoforo Feel*.
  - **Animali e Veterinario (`Needs`):** Riconosciuti *Seresto Collare Antiparassitario Gatti*, *Morpilot Trasportino Gatti*, *Bravpet Tappetino Rinfrescante*, *Tydi Rullo Leva Pelucchi Animali*.
  - **Casa, Arredo e Brico (`Wants`):** Riconosciuti *Chanteclair Detersivo Lavatrice*, *Wc Net Candeggina Gel*, *Pattex Millechiodi*, *ASUS ZenWiFi BT10 Mesh WiFi 7*, *EPYC Nytro & Neon Gruppi di Continuità (UPS)*, *Finish Sale & Curalavastoviglie*, *Rastrello & Forbici Gardena*, *LERAVA Concimi & Rame Zolfo*, *R&R Semi Prato*, *Bicchieri Stölzle Prestige*, *Completo Lenzuola Matrimoniali Cotone*, *Barattoli Fermentazione HEFTMAN*, *Weber Miscele & Spray*.
  - **Gaming, VR e Hobby (`Wants`):** Riconosciuti *Nintendo Switch 2*, *Pokémon Pokopia*, *Custodia Turtle Beach PlayTrek*, *Bandai Spirits 30MS Model Kit*, *Clementoni Sapientino*, *Accessori Meta Quest 2 VR (KIWI Design & Cavo INIU)*.
  - **Libri e Fumetti (`Wants`):** Riconosciuti *Divina Commedia Edizione Illustrata* e *Pokémon Deluxe Character Guide*.
  - **Cura Personale (`Wants`):** Riconosciuti *Testina Rasoio Braun Series 3*, *Vidal Docciaschiuma*, *CeraVe Lozione Idratante*, *Colgate Collutorio Plax*, *Nivea Men Deodorante*, *Liquidraw Portaspazzolino*.
  - **Abbonamenti Digitali (`Wants`):** Distinti chiaramente il canone annuale *Amazon Prime* (49,90 €) e l'abbonamento mensile *Audible* (9,99 €).
  - **Piani Rateali a Tasso Zero (`Commitments` / `Rate Finanziamenti`):** Riconciliate con causale chiara le rate mensili di *LG OLED evo 65" G5 TV* (134,92 € / mese) e di *Samsung Galaxy Watch9 44mm* (77,80 € / mese).
  - **Spedizioni Frazionate & Bundled:** Mappate e scomposte al centesimo le spedizioni multiple emesse dallo stesso carrello (es. carrello 73,73 € diviso in 6,26 € + 67,47 €; carrello 343,29 € diviso in 271,29 € + 72,00 €; carrello 47,60 € diviso in 22,90 € + 24,70 €).
- **Riclassificazione Editoria & Libri (`ITOMI SRL`):** Rimossa la voce `ITOMI SRL` da *Shopping e Abbigliamento* e creata/assegnata la categoria specifica **`Libri e Fumetti`** (`Wants`) assieme a *Tomodachi Press*, *Panini Comics* e fumetterie/librerie con tag dedicati (`#libri`, `#fumetti`, `#cultura`, `#lettura`).
- **Paginazione Avanzata con Selezione Righe per Pagina:** Implementato il controllo di paginazione dinamico nella tabella transazioni con selettore Radix UI per le righe visualizzate per pagina (`10`, `20`, `50`, `100`, `250`), persistenza della preferenza in `localStorage`, conteggio in tempo reale dei movimenti visualizzati (es. *"Mostrando 1-20 di 588 movimenti"*) e controlli rapidi di navigazione (prima pagina, precedente, indicatore pagina corrente, successiva, ultima pagina).
- **Categorizzazione a Grana Fine & Azzeramento "Altre Spese":** Risolto l'accumulo di 240 transazioni in *"Altre Spese"* e 89 in *"Altre Entrate"*, portandole letteralmente a **0 residui**. Create categorie granulari reali per: *Rimborsi e Quote Amici*, *Uscite e Cene con Amici*, *Gaming, Fumetti e Hobby*, *Eventi, Concerti e Cinema*, *Animali e Veterinario*, *Casa, Arredo e Brico*, *Tassa Rifiuti (TARI)*, *Manutenzione Auto e Revisioni*, *Sport e Palestra*, *Prelievi Contanti ATM*, *Ristrutturazione e Opere Casa (Straordinaria)*, *Regali e Aiuti Familiari*, *Vendite Second-Hand*.
- **Bug Fix Substring Luce/Gas (`GAS` in `GASTROMACELLERIA`):** Corretta la regex per *Utenze Luce e Gas* imponendo boundary di parola (`\bGAS\b`, `\bMETANO\b`) ed escludendo le diciture alimentari: `Gastromacelleria` e negozi gastronomici sono ora correttamente classificati al 100% in *Spesa Alimentare* (`Needs`). Lo stesso vale per *Acqua* (`\bACQUA\b`), evitando falsi positivi per negozi di acquariologia (`Animali e Veterinario`).
- **Eliminazione Radicale Duplicati SDD & Clearing:** Esclusi dai parser e dal dataset tutti gli addebiti di regolamento bancario mensile (SDD Nexi e addebiti SDD PayPal sul conto Banco BPM, nonché i movimenti interni di clearing PayPal), imputando le spese unicamente al canale reale dell'acquisto (Nexi, PayPal, Satispay) per un totale di 588 movimenti unici e verificati.
- **Miglioramento Causali Bonifici:** Riscritto il pulitore delle causali bancarie `cleanDescription` per preservare ed evidenziare sia l'ordinante nei bonifici in entrata (es. *Borghi Lucio e Papi Ivetta*) sia il beneficiario nei bonifici in uscita (es. *Michele Maruccia Ditta*, *De Biasi Automatismi*), convertiti in Spese Straordinarie per opere casa.
- **Riposizionamento Backup Offline (.enc):** Rimossi i pulsanti *"Scarica .enc"* e *"Ripristina"* dalla top bar principale per alleggerire la navigazione visiva, ricollocandoli all'interno del modale di configurazione Google Drive come fallback manuale offline.
- **Scansione Ricorsiva Cedolini Drive (`Lavoro > Buste paga`):** Aggiornato il client Google Drive con scope combinato (`drive.file` + `drive.readonly`) e attraversamento strutturato dell'albero cartelle (`Lavoro` → `Buste paga` → sottocartelle per Anno `2024`, `2025`, `2026`), con parser robusto dei mesi in italiano e rilevamento automatico 13ª e 14ª mensilità.
- **Alert Intelligente Cedolino Mancante dopo il 15:** Implementata logica e UI di notifica (badge dinamico *"⚠️ Manca [Mese]"* sul pulsante *Buste Paga Drive* e banner evidenziato nel dialogo di sincronizzazione) quando la data corrente è >= 15 del mese e la busta paga del mese precedente non è ancora archiviata su Drive.
- **Ordinamento Interattivo da Header Tabella:** Rimosso il selettore a tendina di ordinamento dalla toolbar; abilitato l'ordinamento multi-colonna direttamente cliccando sulle intestazioni (`Data`, `Canale`, `Descrizione`, `Macro / Categoria`, `Importo`), con icone di direzione (`ArrowUp` / `ArrowDown` per stato attivo, `ArrowUpDown` discreto al passaggio del cursore).
- **Filtro Categoria Specifica Dinamico:** Aggiunto un nuovo selettore a tendina dedicato nella toolbar che elenca dinamicamente tutte le categorie reali presenti nei movimenti (ordinate alfabeticamente e automaticamente circoscritte alla macro-categoria selezionata); aggiunto il pulsante *"Azzera filtri"* quando ci sono filtri attivi.
- **Badge Categoria Specifica in Tabella:** Convertita l'etichetta testuale della categoria in un badge visivo secondario (`Badge variant="secondary"`), affiancato verticalmente al badge colorato della macro-categoria per una lettura immediata e ordinata.
- **Localizzazione Macro-Categorie in Italiano:** Tradotte al 100% tutte le etichette delle macro-categorie nei filtri, modali, badge e grafici (*Bisogni Primari & Casa, Rate & Finanziamenti, Stile di Vita & Shopping, Risparmio & Previdenza, Spese Straordinarie*).
- **Ingestione & Riconciliazione Dati Reali (Zero Double-Counting):** Sostituito l'intero dataset sintetico con 658 transazioni reali verificate estratte dagli export (`movimentiConto.xlsx`, `Nexi.xlsx`, `Numia.xlsx`, `Paypal.CSV`, `Satispay.xlsx`).
- **Deduplicazione Intelligente Canali & Zero Giroconti:** Esclusi automaticamente i 69 addebiti diretti SDD bancari di regolamento carte e wallet (PayPal, Nexi, Numia, Satispay) per imputare le spese direttamente al rispettivo canale di acquisto con il reale esercente, azzerando doppie contabilizzazioni e righe ridondanti di giroconto.
- **Supporto Esteso Ingestion Dropzone & Parser:** Aggiunti parser dedicati per Carta Nexi (`parseCartaNexi`), PayPal (`parsePayPal` con filtro su completate) e Satispay (`parseSatispay`), con pulizia automatica dei tag tecnici bancari e categorizzazione avanzata.
- **Canale Carta Nexi in UI:** Aggiunta l'icona e l'opzione "Carta Nexi" (`Nexi`) nel filtro canali della toolbar e nella modale di inserimento/modifica transazione.
- **Migrazione Automatica Vault:** Aggiornato lo sblocco del Vault per migrare automaticamente alla base dati reale se la sessione/cache locale contiene ancora i vecchi ID sintetici (`mock-*`).
- **Sincronizzazione Google Drive Trasparente:** Persistenza del token di accesso in `localStorage` con TTL e scadenza automatica; adozione del flusso *Silent Authentication* (`prompt: ''`) per evitare la richiesta ripetuta del consenso ad ogni apertura; auto-connessione all'avvio dell'app se il Client ID è configurato.
- **Persistenza di Sessione del Vault (Zero-Knowledge Session Cache):** Salvataggio della chiave di sessione in `sessionStorage` per evitare il ri-blocco del Vault durante i refresh di pagina (`F5`) nella medesima scheda; pulizia automatica alla chiusura del browser/scheda o al click esplicito su *"Blocca Vault"*.
- **Tab Bar Estesa Full-Width & Navigazione:** Layout esteso a tutta la larghezza (`w-full`) con griglia responsiva per i 5 tab, pill attiva smeraldo brillante (`bg-primary text-primary-foreground`) e supporto all'opacità dei token in Tailwind via `color-mix`.
- **Date Range Picker & Calendario Soft Primary:** Highlight dell'intervallo temporale nel calendario aggiornato a una tonalità morbida del verde primario (`aria-selected:bg-primary/15 aria-selected:text-primary`); eliminato l'effetto rimbalzo/bounce all'apertura del popover tramite transizione fluida (`duration-150 fade-in slide-in-1`); aggiunto il bordo attivo verde e rotazione animata del chevron quando il selettore è aperto.
- **Modernizzazione Completa Select & Menù:** Sostituiti tutti i select HTML nativi con i componenti Radix/Shadcn `Select` (sia nei filtri toolbar sia nella modale di inserimento/modifica transazione); restyling dei menu a tendina con angoli `rounded-xl`, bordo semantico, sfondi scuri coerenti, hover verde smeraldo e spunta di selezione.
- **Allineamento Pixel-Perfect Modale Transazioni:** Corretto il disallineamento della modale (risolto il wrapping dell'asterisco su riga separata nel campo Data, uniformata l'altezza dei label a `h-5`, integrato il container compatto `h-9` per il toggle Spesa Straordinaria perfettamente allineato con il campo Tag).

### Planned
- Export sintetico del bilancio annuale in PDF / CSV formattato.

---

## [0.1.0] - 2026-10-23

### Added
- **Fondamenta & Infrastruttura:**
  - Scaffolding progetto con Vite 8, React 19, TypeScript in Strict Mode.
  - Configurazione PWA con `vite-plugin-pwa`, manifest offline, tema scuro e icone SVG dedicate.
  - Setup di Tailwind CSS e design system tokens HSL ereditati da `agent-core-knowledge`.
  - Componenti UI accessibili (`Card`, `Button`, `Badge`, `Slider`, `Tabs`, `Dialog`, `Table`, `Switch`).

- **Sicurezza Zero-Knowledge & Web Crypto API:**
  - Suite crittografica in `src/lib/crypto.ts` basata sullo standard W3C Web Crypto.
  - Derivazione chiavi PBKDF2 con 100.000 iterazioni SHA-256 e Salt crittografico a 16 byte.
  - Cifratura simmetrica AES-GCM a 256 bit con IV casuale a 96 bit rigenerato ad ogni salvataggio.
  - Modal di sblocco con Master Password e supporto WebAuthn / Passkey per sblocco biometrico (Touch ID / Face ID).
  - Client Google Identity Services (GIS) in `src/lib/googleDrive.ts` con scope ristretto `https://www.googleapis.com/auth/drive.file`.

- **Motore di Ingestione & Parser Bancari:**
  - Ingestione universale drag & drop per file Excel (`.xlsx`, `.xls`) e CSV con SheetJS e PapaParse.
  - Parser Banco BPM (`movimentiConto.xlsx`) con riconoscimento stipendio Cloudfire, utenze Iren, acqua Arca, TIM, Conad, rate Cofidis/Compass/Vorwerk, donazioni UNHCR/LAV.
  - Parser Carta Numia (`movimenti (2).xlsx`) per spese online, pedaggi ASPIT, canoni e bolli.
  - Regole virtuali preimpostate: 15,00 €/mese per pulizia scale condominio (Contanti) e 20,00 €/mese verso Giusi Fortunata C. (Satispay).

- **Executive Dashboard (Tab 1):**
  - KPI Card con calcolo Entrate base, Bisogni primari (Needs), Stile di vita (Wants), Cash Flow residuo e Tasso di risparmio annualizzato (>30%).
  - Donut Chart con ripartizione percentuale delle macro-categorie.
  - Bar Chart orizzontale per impatto medio mensile delle principali voci di spesa.
  - Area Chart storico temporale a 12 mesi Entrate vs Uscite con toggle per escludere spese straordinarie.

- **Simulatore Fiscale & Fondo Pensione (Tab 2):**
  - Slider interattivo di versamento volontario previdenziale (da 0 € a 5.164,57 € art. 51 TUIR).
  - Calcolo automatico in tempo reale del rimborso IRPEF 730 stimato (scaglioni 35% e 43% + addizionali) e rendimento risk-free immediato.
  - Indicatore visivo della finestra temporale ottimale di bonifico (15 Novembre – 10 Dicembre) per Allianz Orizzonte Previdenza / Fon.Te.

- **Goal Planner & Grandi Progetti (Tab 3):**
  - Form per creazione obiettivi (es. "Viaggio in Giappone" da 4.500 €).
  - Algoritmo di assorbimento prioritario che alloca la 14ª di Giugno (~1.848 €) e il rimborso 730 di Luglio (~1.500 €) a impatto zero sul cash flow ordinario.

- **Governance & Token Optimization (`agent-core-knowledge`):**
  - Adozione delle regole operative in `AGENTS.md` e `.agents/rules/` (`session-budget-guard.md`, `no-browser-subagent.md`, `documentation-sync-gate.md`, `token-optimization.md`).
  - Architettura a 3 livelli della memoria: calda (`PROGRESS.md`), fredda decisionale (`docs/adr/`), fredda storica (`CHANGELOG.md`).
  - Pratiche di chirurgia del contesto (slice reading, targeted diffing, zero context bloat).
