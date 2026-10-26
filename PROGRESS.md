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
| **Tab 2: Costi Fissi & Utenze** |   ✅  | Canoni flat, utenze consuntivate, ammortamenti rate, accordion comparativo |
| **Tab 3: Transazioni (Manager)**|   ✅  | Tabella interattiva, ricerca full-text, filtri, editing e inserimento manuale |
| **Tab 4: Simulatore Fiscale**   |   ✅  | Slider 0-5.164,57 €, deducibilità 730 IRPEF 35-43%, timeline    |
| **Tab 5: Goal Planner**         |   ✅  | Assorbimento 14ª, 13ª e 730, Feasibility Engine e BudgetCap mensili |
| **Tab 6: Ingestione File**      |   ✅  | Dropzone Excel/CSV Banco BPM, Carta Nexi, Numia, PayPal, Satispay |
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

## 4. Backlog Operativo Attivo (Sprint Corrente)

- [x] Blindatura privacy git (esclusione `data/`, `scripts/`, `realTransactions.json` e fallback demo resiliente — ADR-004)
- [x] Riconciliazione multi-fonte: Banco BPM, carte Numia/Nexi, 86 ordini Amazon reali, rate TIMFIN in Commitments (ADR-005)
- [x] Restyling modale sincronizzazione buste paga Drive e unificazione header Zero-Knowledge (ADR-006)
- [x] Perfezionamento Executive Dashboard: KPI reali del periodo filtrato, Donut centrale, BarChart centrato ad alto contrasto
- [x] Ricollocazione contestuale di `BudgetCapManager` in "Budget & Obiettivi"
- [x] Standard isolamento filtri per vista & navigazione non distruttiva `forceMount` (ADR-007)
- [x] Layout toolbar a due livelli (ricerca full-width + filtri responsivi) e preset deterministici
- [x] Potenziamento Executive Dashboard: Regola 50/30/20, Costi Fissi vs Variabili, Burn Rate (ADR-008)
- [x] Potenziamento Tab Fisco: calcolo deducibilità residua art. 51 TUIR dai versamenti reali dell'anno (ADR-009)
- [x] Potenziamento Tab Budget & Obiettivi: stima traguardi su tasso risparmio reale e selettore mese per BudgetCap (ADR-010)
- [x] Subscription & Recurring Tracker: piani ammortamento certificati (Amazon TV/Watch, Cofidis Soundbar/Switch, Vorwerk Folletto VR7s, Bimby TM7 HeyLight/Compass, TIMFin & Compass vecchi chiusi) (ADR-011)
- [x] Data prossimo pagamento e badge urgenza visibili a card chiusa in `RecurringTracker` (sia contratti che rate ammortamento)
- [x] Bonifica ricorrenti: Iren Luce vs Gas, YouTube 15,99 € Numia, Game Pass PayPal, Audible sospeso, UNHCR una tantum (ADR-011)
- [x] Costi Fissi & Utenze: spostata a Tab 2, media consuntiva utenze, monitor rimodulazioni flat, segmentazione Google Play (Philips Hue, tado°, Hiya) (ADR-011)
- [x] Periodo dinamico DateRangePicker, Recharts LineChart utenze, unificazione card KPI e toolbar filtri avanzata (ADR-011)
- [x] Standardizzazione header di pagina: fuori dalle card, icone tab semantiche, azioni e selettore periodo allineati a destra
- [x] Abbonamenti annuali certificati: Netflix (120 €/anno, atteso 2026) e Crunchyroll (15 €/anno, pagato 2026) (ADR-011)
- [x] Segmentazione spese condominiali: Condominio Betulla (3-4 rate/anno trimestrali su BPM) vs Pulizia Scale (15 €/mese contanti) (ADR-011)
- [x] Standardizzazione semantica simbologia & isolamento colori di stato (positive, warning, error, info) (ADR-011)
- [x] Grafico ricorrenti universale e dinamico: select categoria, serie con toggle chip e card riepilogo speculari (ADR-011)
- [x] Palette e iconografia distintive per serie: icone tematiche (Film, Play, Gamepad2, Lightbulb, Thermometer, ecc.) e colori ad alto contrasto senza sovrapposizioni (ADR-011)
- [x] Disaggregazione prelievi SDD Cofidis: Switch 2 (5 rate concluse ed estinte) vs Soundbar LG (12 rate da 56,25 € in corso) (ADR-011)
- [x] Accordion comprimibile per card comparative del grafico in Costi Fissi & rimozione duplicato da GoalPlanner (ADR-011)
- [ ] **Abilitazione e collaudo reale accesso biometrico** (WebAuthn Passkey Touch ID / Face ID)
- [ ] **Check regole parsing per canale** (BPM, Nexi, Numia, PayPal, Satispay), test nuovo file e verifica deduplica
- [ ] [APPROVATO - IN STANDBY] Financial Advisor & Spending Optimizer: roadmap stagionale investimenti, tranches pensione estive/autunnali e plafond consigliati (ADR-012)
- [ ] Bilancio Annuale & Reportistica Fiscale (a bassa priorità su richiesta utente)

## 5. Riferimenti Rapidi & Comandi

```bash
npm run dev           # Dev server applicazione reale → http://localhost:5180/
npx tsc --noEmit      # Typecheck TypeScript strict
npm run build         # Validazione bundle produzione e service worker PWA
```
