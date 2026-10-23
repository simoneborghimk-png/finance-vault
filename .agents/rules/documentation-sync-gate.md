# Regola: Pre-Push Documentation Gate & Token-Efficient Sync Protocol

Questo documento definisce la regola canonica per l'allineamento della documentazione prima del rilascio di modifiche su Git o consolidamento milestone.

---

## 1. Momento di Attivazione (Quando Scatta il Gate)

- **UNIVOCO MOMENTO DI ESECUZIONE:**
  - Il gate documentale scatta **ESCLUSIVAMENTE al termine di un task completo o alla chiusura di una milestone approvata dall'utente**, prima di creare il commit convenzionale e proporre il `git push`.
  - **DIVIETO DI OVERHEAD NEI MICRO-TURNI:** È tassativamente vietato avviare l'audit o riscrivere file di documentazione durante i micro-turni intermedi di sviluppo, correzione bug, refactoring in corso o esecuzione di test pilota.

---

## 2. Condizioni di Attivazione & Soglia

- **Macro-Blocchi & Milestone (Sincronizzazione Obbligatoria):**
  - Rilascio di nuove viste della Dashboard o estensioni al simulatore fiscale / goal planner.
  - Aggiunta di nuovi parser bancari o schemi di categorizzazione.
  - Variazione dell'architettura di sicurezza o del protocollo di cifratura / sincronizzazione Google Drive.
  - Nuove decisioni architetturali (ADR) o modifiche strutturali ai moduli.
- **Micro-Task & Hotfix Locali (Sync Non Richiesto):**
  - Correzione di 1–3 righe di codice, fix di un typo in una label o aggiornamento di un singolo import isolato.
    _In tali casi si procede direttamente con il commit atomico ordinario, senza attivare il sync-gate documentale esteso._

---

## 3. Perimetro Esatto di Sincronizzazione & Routing della Memoria

1. **`PROGRESS.md` — Cruscotto Operativo Attivo (sempre obbligatorio a fine task):**
   - Aggiornamento backlog: spunta `[ ] → [x]` dei task completati nel §4 Backlog.
   - **DIVIETO DI ACCUMULO:** I task completati NON devono accumularsi indefinitamente in `PROGRESS.md`. Al termine di ogni milestone, spostarli in `CHANGELOG.md` sotto la sezione `[Unreleased]` o nella versione appropriata.
   - **Nuove ADR:** Creare il file atomico `docs/adr/ADR-XXX-<slug>.md` con il testo completo della decisione, quindi aggiungere **unicamente una singola riga** nella tabella §3 di `PROGRESS.md`. Non inserire il testo completo dell'ADR in `PROGRESS.md`.
   - **Vincolo dimensionale vincolante:** `PROGRESS.md` deve restare sotto le **90–100 righe totali**. Se il file supera tale soglia, spostare i task completati in `CHANGELOG.md` e le ADR in `docs/adr/` prima di procedere con qualsiasi commit.
2. **`CHANGELOG.md` — Memoria Storica dei Rilasci (a chiusura milestone):**
   - Spostare qui tutti i task completati con successo, raggruppati per aree tematiche (`Sicurezza & Cifratura`, `Dashboard & Visualizzazione`, `Simulatore Previdenziale`, `Parser Bancari & Ingestione`, `PWA & Infrastruttura`).
   - Formato: [Keep a Changelog](https://keepachangelog.com/it/1.1.0/).
3. **`docs/adr/` — Memoria Fredda delle Decisioni Architetturali:**
   - Ogni nuova decisione tecnica rilevante → nuovo file `docs/adr/ADR-XXX-<slug>.md`.
   - Aggiornare l'indice `docs/adr/README.md` con la nuova riga.
   - I file ADR sono **immutabili**: le revisioni producono nuovi ADR che sostituiscono i precedenti.
4. **Path & URI Hygiene:**
   - Verifica tassativa che ogni nuovo collegamento aggiunto nei file Markdown utilizzi percorsi relativi (nessun URI macchina assoluto `file:///...` nei file versionati).
