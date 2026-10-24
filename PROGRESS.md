# PROGRESS.md — Personal Finance Vault & Dashboard

> **Cruscotto operativo sintetico (Memoria Calda).** Leggi come **azione zero** di ogni sessione AI. Storico milestone: `CHANGELOG.md`. Decisioni tecniche estese: `docs/adr/`. Vincolo: mantenere ≤90–100 righe.

## 1. Coordinate & Stack Attivo

| Campo                | Valore                                                            |
| -------------------- | ----------------------------------------------------------------- |
| **Progetto**         | Personal Finance Vault & Dashboard (Zero-Knowledge, PWA)          |
| **Stack**            | React 18+ (React 19) + TypeScript + Vite 8 + Tailwind CSS         |
| **Visualizzazione**  | Recharts (Donut, Horizontal Bar, 12-Month Area Chart)             |
| **Parsing**          | SheetJS (`xlsx`) + PapaParse (`csv`)                              |
| **Crittografia**     | Web Crypto API (AES-GCM 256-bit + PBKDF2 100k it. SHA-256)        |
| **Sincronizzazione** | Google Identity Services OAuth2 (`drive.file`)                    |
| **Workspace**        | `/Users/simoneborghi/Projects/personal-projects/finance-vault`    |
| **Dev Server App**   | `npm run dev` → `http://localhost:5180/`                          |

## 2. Stato Viste & Moduli — Sintesi Metrica

| Modulo / Vista                  | Stato | Note / Metriche                                                |
| ------------------------------- | :---: | -------------------------------------------------------------- |
| **Vault Unlock & Biometrics**   |   ✅  | Master Password + WebAuthn Passkey (Face ID/Touch ID)          |
| **Tab 1: Executive Dashboard**  |   ✅  | KPI (Entrate, Needs, Wants, Cash Flow, Savings Rate) + Recharts |
| **Tab 2: Transazioni (Manager)**|   ✅  | Tabella interattiva, ricerca full-text, filtri, editing e inserimento manuale |
| **Tab 3: Simulatore Fiscale**   |   ✅  | Slider 0-5.164,57 €, deducibilità 730 IRPEF 35-43%, timeline    |
| **Tab 4: Goal Planner**         |   ✅  | Assorbimento prioritario 14ª Giugno e 730 Luglio               |
| **Tab 5: Ingestione File**      |   ✅  | Dropzone Excel/CSV Banco BPM (`movimentiConto`), Numia         |
| **Drive Sync & Backup**         |   ✅  | Download/Upload `vault_finanze.enc` + Export/Import locale     |

## 3. Indice Decisioni Architetturali (ADR)

| ID      | Decisione / Ambito                                              | Riferimento                                 |
| ------- | --------------------------------------------------------------- | ------------------------------------------- |
| ADR-001 | Cifratura Client-Side AES-256-GCM + PBKDF2 100k iterazioni      | [`docs/adr/ADR-001-zero-knowledge-crypto.md`](./docs/adr/ADR-001-zero-knowledge-crypto.md) |
| ADR-002 | Archiviazione Zero-Cost su Google Drive (`drive.file`)           | [`docs/adr/ADR-002-client-side-storage-gdrive.md`](./docs/adr/ADR-002-client-side-storage-gdrive.md) |
| ADR-003 | Architettura della Memoria Calda/Fredda e Token Hygiene          | [`docs/adr/ADR-003-token-and-memory-architecture.md`](./docs/adr/ADR-003-token-and-memory-architecture.md) |

## 4. Backlog Operativo Attivo

- [x] Inizializzazione stack Vite 8 + React + TypeScript + Tailwind + PWA
- [x] Implementazione suite crittografica e client Google Drive (`drive.file`)
- [x] Motore di auto-categorizzazione e parser Banco BPM / Carta Numia
- [x] Executive Dashboard, Simulatore Fiscale Previdenza, Goal Planner e Ingestion Dropzone
- [x] Eredità pratiche `agent-core-knowledge`: guardrail, regole `.agents/rules/`, memoria calda/fredda
- [x] Portabilità cross-device, porta fissa 5180, base path GitHub Pages e CI/CD Actions
- [x] Tabella Transazioni Interattiva (ricerca, filtri, editing categoria/tag, aggiunta manuale)
- [ ] Budget Cap & Monitoraggio Soglie Spesa mensili
- [ ] Ottimizzazione bundle: Code Splitting dinamico (Lazy loading SheetJS / Dropzone)
- [ ] Lettura automatica buste paga aggiornate da cartella su Google Drive

## 5. Riferimenti Rapidi & Comandi

```bash
npm run dev           # Dev server applicazione reale → http://localhost:5180/
npx tsc --noEmit      # Typecheck TypeScript strict
npm run build         # Validazione bundle produzione e service worker PWA
```
