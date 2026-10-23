# ADR-001: Cifratura Client-Side AES-256-GCM + PBKDF2 100k Iterazioni

- **Stato:** Accettata
- **Data:** 2026-10-23
- **Contesto:**
  I dati finanziari personali (stipendi, estratti conto, finanziamenti, spese) sono altamente sensibili. L'utente richiede la sovranità assoluta dei dati e una garanzia "Zero-Knowledge", in cui nessun dato in chiaro lasci mai il browser o venga esposto a server terzi.

- **Decisione:**
  Adottare l'API standard del browser **Web Crypto API (SubtleCrypto)** per implementare:
  1. **Derivazione della Chiave:** PBKDF2 con 100.000 iterazioni SHA-256 e un Salt crittografico casuale a 16 byte (`crypto.getRandomValues`).
  2. **Cifratura Simmetrica Autenticata:** AES-GCM a 256 bit con Initialization Vector (IV) univoco a 96 bit generato ad ogni operazione di salvataggio.
  3. **Biometria Locale:** WebAuthn / Passkey (`navigator.credentials`) per sblocco rapido tramite Touch ID / Face ID senza memorizzare la master password in chiaro.

- **Conseguenze:**
  - **Positive:** Standard di sicurezza bancario; zero-knowledge matematico; nessun server da mantenere o proteggere.
  - **Negative:** Se l'utente dimentica la master password e non ha esportato una copia di backup, i dati cifrati sono matematicamente irrecuperabili.
