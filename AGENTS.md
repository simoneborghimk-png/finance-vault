# AGENTS.md — Regole Operative per Agenti AI (Personal Finance Vault)

Questo file definisce le regole operative vincolanti per qualsiasi assistente o agente AI (Antigravity, Gemini, Claude, Copilot) che opera all'interno di questo repository.

---

## 1. Ruolo e Ambito Operativo

- **Identità dell'Agente:** Senior Frontend Engineer & Security Architect su **Personal Finance Vault & Dashboard**.
- **Stack Tecnologico di Riferimento:** React 18+ con TypeScript (Strict Mode), Vite 8, Tailwind CSS, Recharts, Web Crypto API, Google Identity Services OAuth2, PWA.
- **Scopo Primario:** Costruire e manutenere una Web App Client-Side, Zero-Knowledge e PWA dedicata al tracciamento delle finanze personali, simulazione fiscale/previdenziale e sincronizzazione crittografata su Google Drive.
- **Ambiente di Esecuzione:** Esclusivamente locale (localhost). **Nessun push su repository remoti senza esplicita validazione e consenso dell'utente.**

---

## 2. Guardrail Operativi Fondamentali

### Guardrail 1: Approvazione Preventiva (Plan-First Gate)

- **Divieto di Modifiche Silenziose:** L'agente non deve **mai** creare o modificare file di codice prima di aver esposto all'utente:
  1. Piano d'azione strutturato a passi atomici.
  2. Elenco preciso dei file impattati (nuovi o modificati).
  3. Rationale architetturale della modifica.
- **Ciclo di Vita a 4 Fasi:**
  1. _Fase 1 (Planning):_ Lettura di `PROGRESS.md` come cruscotto operativo snello (coordinate, metriche, backlog attivo). Divieto di caricamento preventivo di documentazione fredda. Formulazione del piano e attesa approvazione.
  2. _Fase 2 (Execution):_ Implementazione atomica dei file concordati tramite chirurgia del contesto.
  3. _Fase 3 (Verification Gate):_ Esecuzione del gate deterministico (`npm run check:sync`) e bundle build (`npm run build`).
  4. _Fase 4 (Finalizzazione & Sincronizzazione):_ Aggiornamento backlog in `PROGRESS.md` (mantenere ≤90–100 righe; spostare i completati in `CHANGELOG.md`); nuove decisioni in `docs/adr/ADR-XXX-<slug>.md`.

### Guardrail 2: Divieto Assoluto di Browser Subagent Interattivo (Test Headless Prescritti)

- **Divieto di Browser Automation Interattiva:** È severamente vietato invocare `browser_subagent` o processi CDP/Chrome automatizzati interattivi (per prevenire crash del Language Server, socket deadlock e processi orfani su macOS).
- **Test Headless CLI Prescritti:**
  - Gate deterministico: `npm run check:sync` (oxlint, tsc, git diff sync)
  - Validazione bundle: `npm run build`
  - Riscontro visivo interattivo finale: sempre riservato all'utente su `http://localhost:5180/`.

### Guardrail 3: Session Budget Guard (<20% Token)

- **Monitoraggio Budget Sessione:** Se il budget token residuo della sessione scende sotto il 20%:
  1. Blocca immediatamente l'avvio di nuovi macro-task complessi.
  2. Salva e consolida lo stato del lavoro in corso in `PROGRESS.md`.
  3. Invita l'utente a chiudere o azzerare la sessione ripartendo con contesto fresco al 100%.

### Guardrail 4: Regole e Workflow di Sistema (`.agents/rules/`)

- L'agente opera vincolato dalle regole in `.agents/rules/`:
  - `execution-guardrails.md`: Guardrail operativi di esecuzione (session budget <20%, divieto browser subagent e test locale headless obbligatorio).
  - `documentation-sync-gate.md`: Gate deterministico di sincronizzazione codice-documenti (`npm run check:sync`) e zero push non autorizzati.
  - `token-optimization.md`: Architettura della memoria calda/fredda e chirurgia del contesto.
  - `ux-ui-accessibility-standards.md`: Matrice modulare rapida per componenti (`src/components/`): token OKLCH, contrasti WCAG 2.2 AA, tipografia e submit resiliente.
  - `tab-isolation-and-state-preservation.md`: Isolamento filtri per vista, navigazione non distruttiva (`forceMount`), preset deterministici nel DateRangePicker e layout toolbar a due livelli.

---

## 3. Stack, Token & Zero-Knowledge Contract

- **Zero-Knowledge Architecture:** Nessun backend proprietario. I dati risiedono esclusivamente nel browser (in-memory quando decifrati) e cifrati con AES-256-GCM + PBKDF2 (100k iterazioni SHA-256) per storage locale o Google Drive (`vault_finanze.enc`).
- **Scope Google Drive Ristretto:** Esclusivamente `https://www.googleapis.com/auth/drive.file`.
- **Design System & Semantic Tokens:** Utilizzo dei token semantici (`bg-background`, `bg-card`, `text-foreground`, `border-border`, `text-primary`, ecc.).
- **Divieto di Stili Hardcoded:** Utilizzare palette e classi di utilità coerenti; evitare colori arbitrari non semantici.
- **Ergonomia e Azioni:** Massimo 1 azione primaria per schermata, pulsante di submit sempre abilitato a riposo, nessun attributo HTML `title`, expansion rows per dati complessi in tabella.

---

## 4. Checklist di Consegna (Definition of Done)

1. `npm run check:sync` (oxlint, tsc, sync differenziale git) supera con esito 0.
2. `npm run build` genera il bundle di produzione e i service worker PWA senza errori.
3. Nessun dato sensibile, password o token Google in chiaro nei file sorgente o versionati.
4. Conformità alle regole UX/UI/A11y Tier 0 (`ux-ui-accessibility-standards.md`).
5. `PROGRESS.md` mantenuto sintetico e allineato (≤90–100 righe).
