# Regola: Execution Guardrails (Budget, Sub-processi & Verifica)

## 1. Budget Sessione & Approvazione Preventiva
- **Plan-First Gate:** Esporre sempre piano atomico, file impattati e rationale prima di modificare codice; attendere approvazione esplicita dell'utente. Nessuna azione silente.
- **Budget < 20%:** Stop preventivo immediato per macro-task. Salvare lo stato in `PROGRESS.md` e invitare al riavvio con contesto fresco. Consentiti solo micro-task atomici (1–3 righe).

## 2. Divieto Browser Subagent & Processi Non Deterministici
- **Divieto Assoluto:** Vietato invocare `browser_subagent`, processi CDP interattivi o automazioni browser (prevengono crash Language Server, socket orfane e deadlock IDE).
- **Controllo Visivo:** Riservato esclusivamente all'utente su `http://localhost:5180/`.

## 3. Test Locale Headless Obbligatorio
- **Pre-Review Gate:** Prima di proporre modifiche o richiedere validazione, eseguire sempre:
  1. `npm run check:sync` (oxlint, tsc strict, sync differenziale git).
  2. `npm run build` (bundle produzione e PWA).
- **Auto-Risoluzione:** Se i test falliscono, risolvere gli errori in autonomia prima di fermarsi.

