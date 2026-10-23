# ADR-002: Architettura Zero-Cost con Sincronizzazione Google Drive (`drive.file`)

- **Stato:** Accettata
- **Data:** 2026-10-23
- **Contesto:**
  Si richiede una soluzione ad architettura Zero-Cost (nessun database remoto, nessun server backend) ma con persistenza cloud affidabile e cross-device.

- **Decisione:**
  Utilizzare **Google Drive** come storage layer remoto per il file binario cifrato `vault_finanze.enc`:
  1. **Google Identity Services (GIS):** Flusso OAuth2 PKCE client-side.
  2. **Scope Minimo:** Esclusivamente `https://www.googleapis.com/auth/drive.file`, che concede all'app accesso unicamente ai file creati da essa stessa.
  3. **Fallback Locale:** Cache cifrata su `localStorage` per consentire operatività 100% offline (PWA) e sincronizzazione manuale o automatica al ripristino della connettività.

- **Conseguenze:**
  - **Positive:** Costo di hosting zero (SPA statica su Cloudflare Pages / Vercel Hobby); sovranità del dato in capo all'account Google personale dell'utente; privacy garantita dalla cifratura preventiva lato client.
  - **Negative:** Richiede la creazione una tantum di un Google OAuth2 Client ID da parte dell'utente per l'accesso a Google Drive API.
