# Architectural Decision Records (ADR) — Personal Finance Vault

Questo archivio costituisce la **Memoria Fredda Decisionale** del progetto.
Ogni decisione tecnica rilevante è documentata in un record atomico e immutabile.

## Indice ADR

| ID | Data | Titolo | Stato |
| :--- | :--- | :--- | :--- |
| [ADR-001](./ADR-001-zero-knowledge-crypto.md) | 2026-10-23 | Cifratura Client-Side AES-256-GCM + PBKDF2 100k Iterazioni | Accettata |
| [ADR-002](./ADR-002-client-side-storage-gdrive.md) | 2026-10-23 | Architettura Zero-Cost con Sincronizzazione Google Drive (`drive.file`) | Accettata |
| [ADR-003](./ADR-003-token-and-memory-architecture.md) | 2026-10-23 | Architettura della Memoria Calda/Fredda e Token Optimization | Accettata |

---

> **Regola di Consultazione per Agenti AI:**
> Non caricare mai preventivamente l'intera cartella `docs/adr/`. Consultare chirurgicamente solo il singolo ADR pertinente al task specifico.
