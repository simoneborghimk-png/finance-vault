# Personal Finance Vault & Dashboard 🔐📊

> **Zero-Knowledge, Client-Side & PWA Personal Wealth Dashboard** con cifratura AES-256-GCM, simulatore fiscale/previdenziale, motore di auto-categorizzazione bancaria e sincronizzazione crittografata su Google Drive.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-2563eb?style=for-the-badge&logo=github)](https://simoneborghimk-png.github.io/finance-vault/)

🌐 **Web App Live:** [https://simoneborghimk-png.github.io/finance-vault/](https://simoneborghimk-png.github.io/finance-vault/)

---

## ⚡ Quickstart per Sviluppatori & Agenti AI

Se hai appena clonato questo repository su una nuova macchina:

```bash
# 1. Installazione dipendenze esatte
npm ci

# 2. Verifica integrità TypeScript
npx tsc --noEmit

# 3. Avvio dev server locale (porta fissa 5180)
npm run dev
```

L'applicazione sarà immediatamente disponibile su **`http://localhost:5180/`**.

### Comandi Operativi Essenziali

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia il server Vite locale su porta `5180` |
| `npx tsc --noEmit` | Controllo tipi TypeScript in Strict Mode |
| `npm run build` | Compilazione del bundle di produzione e precache service worker PWA |
| `npm run preview` | Anteprima del bundle di produzione compilato su porta `5180` |

---

## 🛡️ Architettura Zero-Knowledge & Sicurezza

L'applicazione **non possiede alcun backend proprietario** né server centrali. I tuoi dati finanziari privati godono di sovranità totale:

* **Cifratura Client-Side:** Derivazione della chiave tramite **PBKDF2** (100.000 iterazioni SHA-256) e cifratura **AES-256-GCM** a 256-bit con IV casuale a 96-bit ad ogni salvataggio.
* **Memoria Volatile:** La Master Password in chiaro risiede solo in RAM durante la sessione attiva e viene distrutta al blocco del Vault o alla chiusura del browser.
* **Biometria Locale (WebAuthn):** Supporto per Touch ID, Face ID e Windows Hello memorizzato in sicurezza nel Secure Enclave/autenticatore del singolo dispositivo.
* **Google Drive Scope Ristretto (`drive.file`):** L'applicazione richiede esclusivamente il permesso per creare e modificare il proprio file cifrato (`vault_finanze.enc`), senza poter accedere agli altri file personali su Google Drive.

---

## ☁️ Sincronizzazione Cross-Device (Google Drive)

I dati viaggiano sempre e solo in formato cifrato binario (`vault_finanze.enc`).

1. **Percorso su Google Drive:** Il file può essere collocato nella cartella `Projects > Personal > finance-vault`.
2. **Accesso da altri dispositivi:**
   * Apri l'app sul nuovo dispositivo (in locale o su GitHub Pages).
   * Inserisci il **Google Cloud OAuth2 Client ID** (salvato solo nel tuo browser).
   * Accedi con Google e inserisci la tua **Master Password**: il vault verrà decifrato in RAM all'istante.
3. **Backup Manuale Locale:** Puoi in qualsiasi momento esportare una copia fisica cifrata tramite il pulsante **"Scarica .enc"** o importare un backup con **"Ripristina"**.

---

## 🌐 Pubblicazione su GitHub Pages

Il repository include una GitHub Action automatica in `.github/workflows/deploy.yml`.

### Come abilitare GitHub Pages:
1. Su GitHub, vai in **Settings** del repository `simoneborghimk-png/finance-vault`.
2. Nel menu laterale seleziona **Pages**.
3. Sotto **Build and deployment > Source**, seleziona **GitHub Actions**.
4. Ad ogni `git push` sul branch `main`, l'app verrà automaticamente compilata e pubblicata su:
   * **`https://simoneborghimk-png.github.io/finance-vault/`**

### Configurazione Origini Google Cloud per OAuth:
Nella [Google Cloud Console](https://console.cloud.google.com/) (sotto **Credenziali > ID client OAuth > Origini JavaScript autorizzate**), inserisci:
* `http://localhost:5180` (sviluppo locale)
* `https://simoneborghimk-png.github.io` (produzione GitHub Pages)

---

## 📁 Struttura del Progetto

```
finance-vault/
├── .github/workflows/     # CI/CD automatica per GitHub Pages
├── .agents/               # Regole operative vincolanti per Agenti AI
│   └── rules/             # Context hygiene, execution guardrails, documentation sync
├── src/
│   ├── components/        # Dashboard, Simulatori, Dropzone, VaultUnlock, DriveSync
│   ├── lib/
│   │   ├── crypto.ts      # Web Crypto API Suite (AES-GCM, PBKDF2, WebAuthn)
│   │   ├── googleDrive.ts # Google Identity Services (GIS) client OAuth2
│   │   └── parsers/       # Parser estratti conto Banco BPM e Carta Numia
│   └── types/             # Modelli TypeScript strict per finanze e transazioni
├── AGENTS.md              # Costituzione e guardrail operativi per assistenti AI
├── PROGRESS.md            # Memoria calda / cruscotto sintetico di avanzamento
└── vite.config.ts         # Configurazione Vite, porta 5180, base path e PWA
```
