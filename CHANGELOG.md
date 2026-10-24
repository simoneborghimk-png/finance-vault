# CHANGELOG.md — Personal Finance Vault & Dashboard

Tutte le modifiche rilevanti apportate a questo progetto sono documentate in questo file.
Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.1.0/).

---

## [Unreleased]

### Added / Changed
- **Sincronizzazione Google Drive Trasparente:** Persistenza del token di accesso in `localStorage` con TTL e scadenza automatica; adozione del flusso *Silent Authentication* (`prompt: ''`) per evitare la richiesta ripetuta del consenso ad ogni apertura; auto-connessione all'avvio dell'app se il Client ID è configurato.
- **Persistenza di Sessione del Vault (Zero-Knowledge Session Cache):** Salvataggio della chiave di sessione in `sessionStorage` per evitare il ri-blocco del Vault durante i refresh di pagina (`F5`) nella medesima scheda; pulizia automatica alla chiusura del browser/scheda o al click esplicito su *"Blocca Vault"*.

### Planned
- Export sintetico del bilancio annuale in PDF / CSV formattato.
- Riconciliazione automatica tra transiti PayPal (`movimentiConto.xlsx`) ed estratto conto PayPal dettagliato.

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
