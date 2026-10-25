# ADR-004: Blindatura Privacy Git e Fallback Demo Runtime

- **Stato:** Accettata
- **Data:** 2026-10-24
- **Contesto:**
  Il repository contiene estratti conto reali (Banco BPM, carte Numia e Nexi), cronologie ordini Amazon e cedolini stipendiali. L'utente desidera la possibilità di versionare il codice su GitHub (anche in repo pubblico o per CI/CD Pages) senza alcun rischio di esporre transazioni bancarie o identificativi reali.

- **Decisione:**
  1. **Esclusione Categorica in `.gitignore`:** Tutte le cartelle di esportazione grezza (`data/`), gli script interni con payload personali (`scripts/`) e il dataset compilato dei movimenti reali (`src/lib/realTransactions.json`) sono esclusi dal tracciamento Git.
  2. **Risoluzione Dinamica & Resiliente a Runtime (`mockData.ts`):** Utilizzare `import.meta.glob` di Vite per caricare dinamicamente `realTransactions.json` solo se presente sul filesystem locale della macchina dell'utente. Se assente (es. clone pulito su un'altra macchina o build CI remota), l'applicazione esegue automaticamente un fallback non bloccante sul generatore di movimenti simulati (`generate12MonthsMockTransactions()`).
  3. **Persistenza Crittografata:** L'unico luogo in cui risiede il dataset reale completo è il file cifrato `vault_finanze.enc` su Google Drive, protetto con AES-256-GCM + PBKDF2.

- **Conseguenze:**
  - **Positive:** Zero rischi di leak di dati finanziari in chiaro nei commit o nel cloud; portabilità universale del codice sorgente (`npm run build` e `npm run dev` funzionano su qualsiasi clone pulito).
  - **Negative:** Lo sviluppo su una nuova macchina richiede di sbloccare il vault da Google Drive o di reimportare il file `.enc` per avere a disposizione i dati reali anziché la simulazione demo.
