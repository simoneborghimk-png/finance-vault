# Regola: Session Budget Guard (<20% Token Threshold)

## Obiettivo & Trigger

Evitare il troncamento a metà di attività complesse dovuto all'esaurimento del budget token della sessione o alla compattazione forzata della context window.

- **Trigger Esclusivo:** Questa regola si attiva **UNICAMENTE quando il budget token residuo della sessione scende sotto il 20%** (notificato dall'utente o dai metadati di sessione).
- **Zero Overhead:** Se il budget disponibile è >= 20%, la regola rimane inerte e non richiede alcun passaggio operativo o tool aggiuntivo.

---

## Procedura di Controllo Pre-Flight

Al termine di un'attività o prima di pianificare il prossimo step in Fase 1, se il budget è **< 20%**:

1. **Classificazione Rapida del Task:**
   - **Macro-Blocco:** Scaffolding di nuovi moduli, creazione di viste complesse o parser aggiuntivi, refactoring multi-file, estensione suite di test o schemi dati.
   - **Micro-Task:** Correzione atomica di 1–3 righe di codice, fix di un typo, aggiornamento puntuale di un file di documentazione.

2. **Decisione & Segnalazione:**
   - **Se Macro-Blocco con Budget < 20%:** **STOP preventivo.**
     - L'agente NON avvia la pianificazione estesa.
     - Segnala proattivamente all'utente:
       1. Budget residuo rilevato (<20%).
       2. Rischio di interruzione o compattazione forzata a metà task.
       3. Raccomandazione: consolidare lo stato in `PROGRESS.md`, eseguire commit locale di checkpoint, chiudere la sessione pulita e ripartire da una nuova sessione con il 100% di token.
   - **Se Micro-Task con Budget < 20%:** Consentito procedere, purché l'azione sia circoscritta a un singolo turno rapido.
