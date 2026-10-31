# Regola: Pre-Validation Quality & Documentation Sync Gate

Questa regola impone la verifica automatizzata e deterministica prima di richiedere qualsiasi validazione all'utente o procedere a commit/push.

---

## 1. Comando Obbligatorio di Validazione

Prima di presentare il lavoro completato all'utente o proporre commit, l'agente deve **sempre ed esclusivamente** eseguire:

```bash
npm run check:sync
```

Lo script esegue sequenzialmente in locale:
1. **Linting rapido:** `oxlint .`
2. **Type check statico:** `tsc --noEmit`
3. **Controllo differenziale Git:** se vi sono file modificati o aggiunti sotto `src/`, verifica la presenza di modifiche documentali contemporanee in `CHANGELOG.md` o in `docs/adr/`.

---

## 2. Protocollo di Risoluzione Autonoma (Self-Healing)

Se `npm run check:sync` fallisce (exit code `1`), l'agente **NON deve fermarsi né interpellare l'utente**, ma deve correggere l'errore in completa autonomia:
- **Errori Lint (`oxlint`):** correggere le violazioni di codice individuate.
- **Errori Tipi (`tsc`):** correggere gli errori di tipo TypeScript.
- **Mancata Sincronizzazione (`src/` modificato senza docs):**
  - Aggiungere il riepilogo delle modifiche in `CHANGELOG.md` (sezione `[Unreleased]`), OPPURE
  - Aggiungere la decisione architetturale in `docs/adr/ADR-XXX-<slug>.md` (se la modifica introduce o aggiorna un'architettura/modulo).
- **Riesecuzione:** eseguire nuovamente `npm run check:sync` fino a ottenere esito positivo (exit code `0`) prima di richiedere la validazione all'utente.

---

## 3. Igiene Documentale & Repository

- **`PROGRESS.md`:** deve mantenersi snello e sotto le **90–100 righe totali**. I task completati si spostano periodicamente in `CHANGELOG.md`.
- **Path & URI Hygiene:** tutti i collegamenti nei file Markdown devono essere relativi (nessun percorso assoluto macchina `file:///...`).
- **Nessun Push Remoto:** le modifiche restano rigorosamente in locale; nessun push git senza autorizzazione esplicita.
