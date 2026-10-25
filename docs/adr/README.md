# Architectural Decision Records (ADR) — Personal Finance Vault

Questo archivio costituisce la **Memoria Fredda Decisionale** del progetto.
Ogni decisione tecnica rilevante è documentata in un record atomico e immutabile.

## Indice ADR

| ID | Data | Titolo | Stato |
| :--- | :--- | :--- | :--- |
| [ADR-001](./ADR-001-zero-knowledge-crypto.md) | 2026-10-23 | Cifratura Client-Side AES-256-GCM + PBKDF2 100k Iterazioni | Accettata |
| [ADR-002](./ADR-002-client-side-storage-gdrive.md) | 2026-10-23 | Architettura Zero-Cost con Sincronizzazione Google Drive (`drive.file`) | Accettata |
| [ADR-003](./ADR-003-token-and-memory-architecture.md) | 2026-10-23 | Architettura della Memoria Calda/Fredda e Token Optimization | Accettata |
| [ADR-004](./ADR-004-git-privacy-and-demo-fallback.md) | 2026-10-24 | Blindatura Privacy Git e Fallback Demo Runtime | Accettata |
| [ADR-005](./ADR-005-multi-source-reconciliation.md) | 2026-10-24 | Riconciliazione Multi-Fonte e Granularità Transazionale | Accettata |
| [ADR-006](./ADR-006-payslip-sync-and-pension-tracking.md) | 2026-10-24 | Sincronizzazione Buste Paga da Drive e Monitoraggio Previdenziale | Accettata |
| [ADR-007](./ADR-007-view-isolation-and-non-destructive-navigation.md) | 2026-10-24 | Isolamento delle Viste e Navigazione Non-Distruttiva tra Tab | Accettata |
| [ADR-008](./ADR-008-executive-financial-health-metrics.md) | 2026-10-24 | Metriche Esecutive di Salute Finanziaria e Ripartizione Costi | Accettata |
| [ADR-009](./ADR-009-automated-pension-deductibility-tracking.md) | 2026-10-24 | Tracciamento Automatico Deducibilità Fiscale Fondo Pensione (Art. 51 TUIR) | Accettata |
| [ADR-010](./ADR-010-budget-caps-and-dynamic-goal-feasibility.md) | 2026-10-24 | Monitoraggio Temporale BudgetCap e Feasibility Engine degli Obiettivi | Accettata |
| [ADR-011](./ADR-011-subscription-and-recurring-tracker.md) | 2026-10-24 | Rilevamento Intelligente e Monitoraggio Uscite Ricorrenti e Abbonamenti | Accettata |

---

> **Regola di Consultazione per Agenti AI:**
> Non caricare mai preventivamente l'intera cartella `docs/adr/`. Consultare chirurgicamente solo il singolo ADR pertinente al task specifico.
