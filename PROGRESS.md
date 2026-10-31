# PROGRESS.md — Personal Finance Vault & Dashboard

> **Cruscotto operativo sintetico (Memoria Calda).** Leggi come **azione zero** di ogni sessione AI. Storico milestone: `CHANGELOG.md`. Decisioni tecniche estese: `docs/adr/`. Vincolo: mantenere ≤90–100 righe.

## 1. Coordinate & Stack Attivo

| Campo                | Valore                                                            |
| -------------------- | ----------------------------------------------------------------- |
| **Progetto**         | Personal Finance Vault & Dashboard (Zero-Knowledge, PWA)          |
| **Stack**            | React 18+ (React 19) + TypeScript + Vite 8 + Tailwind CSS         |
| **Visualizzazione**  | Recharts (Donut, Horizontal Bar, 12-Month Area Chart, Multi-Line) |
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
| **Tab 2: Costi Fissi & Utenze** |   ✅  | Canoni flat, utenze consuntivate, ammortamenti rate, scadenziario e simulatore estinzione prestiti |
| **Tab 3: Financial Advisor**     |   ✅  | Safe-to-Spend mensile, roadmap 4 trimestri, tranches pensione 5.164,57 € (ADR-012) |
| **Tab 4: Transazioni (Manager)**|   ✅  | Tabella interattiva, ricerca full-text, filtri, editing e inserimento manuale |
| **Tab 5: Simulatore Fiscale**   |   ✅  | Slider 0-5.164,57 €, deducibilità 730 IRPEF 35-43%, timeline    |
| **Tab 6: Goal Planner**         |   ✅  | Assorbimento 14ª, 13ª e 730, Feasibility Engine e BudgetCap mensili |
| **Tab 7: Ingestione File**      |   ✅  | Dropzone Excel/CSV Banco BPM, Carta Nexi, Numia, PayPal, Satispay |
| **Drive Sync & Backup**         |   ✅  | Download/Upload `vault_finanze.enc` + Export/Import locale     |

## 3. Indice Decisioni Architetturali (ADR) — Memoria Fredda Decisionale

| ID      | Decisione / Ambito                                              | Riferimento                                 |
| ------- | --------------------------------------------------------------- | ------------------------------------------- |
| ADR-001 | Cifratura Client-Side AES-256-GCM + PBKDF2 100k iterazioni      | [`docs/adr/ADR-001-zero-knowledge-crypto.md`](./docs/adr/ADR-001-zero-knowledge-crypto.md) |
| ADR-002 | Archiviazione Zero-Cost su Google Drive (`drive.file`)           | [`docs/adr/ADR-002-client-side-storage-gdrive.md`](./docs/adr/ADR-002-client-side-storage-gdrive.md) |
| ADR-003 | Architettura della Memoria Calda/Fredda e Token Hygiene          | [`docs/adr/ADR-003-token-and-memory-architecture.md`](./docs/adr/ADR-003-token-and-memory-architecture.md) |
| ADR-004 | Blindatura Privacy Git e Fallback Demo Runtime                  | [`docs/adr/ADR-004-git-privacy-and-demo-fallback.md`](./docs/adr/ADR-004-git-privacy-and-demo-fallback.md) |
| ADR-005 | Riconciliazione Multi-Fonte e Granularità Transazionale         | [`docs/adr/ADR-005-multi-source-reconciliation.md`](./docs/adr/ADR-005-multi-source-reconciliation.md) |
| ADR-006 | Sincronizzazione Buste Paga da Drive e Monitoraggio Previdenziale | [`docs/adr/ADR-006-payslip-sync-and-pension-tracking.md`](./docs/adr/ADR-006-payslip-sync-and-pension-tracking.md) |
| ADR-007 | Isolamento delle Viste e Navigazione Non-Distruttiva tra Tab    | [`docs/adr/ADR-007-view-isolation-and-non-destructive-navigation.md`](./docs/adr/ADR-007-view-isolation-and-non-destructive-navigation.md) |
| ADR-008 | Metriche Esecutive di Salute Finanziaria e Ripartizione Costi   | [`docs/adr/ADR-008-executive-financial-health-metrics.md`](./docs/adr/ADR-008-executive-financial-health-metrics.md) |
| ADR-009 | Tracciamento Automatico Deducibilità Fondo Pensione (Art. 51)   | [`docs/adr/ADR-009-automated-pension-deductibility-tracking.md`](./docs/adr/ADR-009-automated-pension-deductibility-tracking.md) |
| ADR-010 | Monitoraggio Temporale BudgetCap e Feasibility Engine Obiettivi | [`docs/adr/ADR-010-budget-caps-and-dynamic-goal-feasibility.md`](./docs/adr/ADR-010-budget-caps-and-dynamic-goal-feasibility.md) |
| ADR-011 | Rilevamento Intelligente Uscite Ricorrenti e Abbonamenti       | [`docs/adr/ADR-011-subscription-and-recurring-tracker.md`](./docs/adr/ADR-011-subscription-and-recurring-tracker.md) |
| ADR-012 | Financial Advisor, Seasonal Wealth Roadmap & Spending Optimizer | [`docs/adr/ADR-012-financial-advisor-and-spending-optimizer.md`](./docs/adr/ADR-012-financial-advisor-and-spending-optimizer.md) |

## 4. Backlog Operativo Attivo (Sprint Corrente)

- [x] Financial Advisor & Spending Optimizer: Safe-to-Spend mensile, roadmap 4 trimestri, tranches pensione e insight tattici (ADR-012)
- [x] Subscription & Recurring Tracker: piani ammortamento certificati (Switch 2 estinto, Soundbar LG, Vorwerk Folletto, Bimby TM7) e canoni flat (ADR-011)
- [x] Analizzatore Utenze con Recharts LineChart dinamico, toggle chip serie e card riepilogo comparative con accordion (ADR-011)
- [x] Standard isolamento filtri per vista & navigazione non distruttiva `forceMount` (ADR-007)
- [x] Potenziamento Executive Dashboard: Regola 50/30/20, Costi Fissi vs Variabili, Burn Rate (ADR-008)
- [x] Potenziamento Tab Fisco: calcolo deducibilità residua art. 51 TUIR dai versamenti reali dell'anno (ADR-009)
- [x] Potenziamento Tab Budget & Obiettivi: stima traguardi su tasso risparmio reale e selettore mese per BudgetCap (ADR-010)
- [x] Scadenziario & Calendario Mensile Uscite Fisse (timeline + griglia calendario LUN-DOM, stipendio reale al 15) & routing URL path
- [x] **Miglioramenti pratici quotidiani:**
  - [x] Multi-File Dropzone Batch Ingestion (BPM, Nexi, Numia, PayPal contemporanei con deduplica)
  - [x] Regole di Categorizzazione Personalizzate salvate nel vault cifrato (in-vault user rules)
  - [x] Simulatore di Estinzione Anticipata Prestiti (Loan Payoff Simulator con Snowball, Cash Flow Maximizer e salvataggio nel vault)
  - [x] Gate deterministico qualità e sync documentale: script CLI `check-sync.mjs` (`npm run check:sync`)
- [ ] **Abilitazione e collaudo reale accesso biometrico** (WebAuthn Passkey Touch ID / Face ID)
- [x] **Check regole parsing per canale**: pipeline standardizzata, profiler inspect-export.mjs & contratto ADR-013
- [ ] Bilancio Annuale & Reportistica Fiscale (a bassa priorità su richiesta utente)

## 5. Riferimenti Rapidi & Comandi

```bash
npm run dev           # Dev server applicazione reale → http://localhost:5180/
npm run check:sync    # Gate deterministico: oxlint, tsc, git diff sync
npm run build         # Validazione bundle produzione e service worker PWA
```
