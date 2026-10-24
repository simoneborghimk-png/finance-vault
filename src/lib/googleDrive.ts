/**
 * Google Drive Client with Google Identity Services (GIS) OAuth2
 * Restricted scope: https://www.googleapis.com/auth/drive.file
 * (The app only has access to files it creates itself)
 */

import { EncryptedVaultPayload } from '@/types/finance';

const DRIVE_FILE_NAME = 'vault_finanze.enc';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const LOCAL_STORAGE_KEY = 'finance_vault_encrypted_local';
const STORAGE_KEY_TOKEN = 'gdrive_access_token';
const STORAGE_KEY_EXPIRES_AT = 'gdrive_token_expires_at';
const STORAGE_KEY_CLIENT_ID = 'gdrive_client_id';
const STORAGE_KEY_FILE_ID = 'gdrive_file_id';

export interface GoogleDriveState {
  isAuthenticated: boolean;
  userEmail?: string;
  lastSynced?: string;
  fileId?: string;
}

class GoogleDriveService {
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private fileId: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const expires = localStorage.getItem(STORAGE_KEY_EXPIRES_AT);
    this.tokenExpiresAt = expires ? parseInt(expires, 10) : 0;
    this.fileId = localStorage.getItem(STORAGE_KEY_FILE_ID);

    if (this.isTokenExpired()) {
      this.accessToken = null;
    }
  }

  public isTokenExpired(): boolean {
    if (!this.accessToken || !this.tokenExpiresAt) return true;
    // Buffer of 60 seconds before expiration
    return Date.now() >= this.tokenExpiresAt - 60000;
  }

  public getAccessToken(): string | null {
    if (this.isTokenExpired()) {
      return null;
    }
    return this.accessToken;
  }

  public isConnected(): boolean {
    return !!this.accessToken && !this.isTokenExpired();
  }

  private saveToken(token: string, expiresInSeconds?: number): void {
    this.accessToken = token;
    const ttl = expiresInSeconds && expiresInSeconds > 0 ? expiresInSeconds : 3599;
    this.tokenExpiresAt = Date.now() + ttl * 1000;
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_EXPIRES_AT, this.tokenExpiresAt.toString());
  }

  private clearToken(): void {
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_EXPIRES_AT);
  }

  /**
   * Initializes GIS OAuth2 Token Client
   */
  public async initClient(clientId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if google scripts are already loaded
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
        this.setupTokenClient(clientId);
        resolve();
        return;
      }

      // Load script dynamically
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.setupTokenClient(clientId);
        resolve();
      };
      script.onerror = (err) => reject(new Error('Failed to load Google Identity Services: ' + err));
      document.body.appendChild(script);
    });
  }

  private setupTokenClient(clientId: string) {
    if ((window as any).google?.accounts?.oauth2) {
      this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            this.saveToken(tokenResponse.access_token, Number(tokenResponse.expires_in));
          }
        },
      });
    }
  }

  /**
   * Requests access token.
   * If forceConsent is false, uses prompt: '' for seamless/silent re-auth without repeating consent.
   */
  public async login(forceConsent: boolean = false): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Google Identity Services client non inizializzato. Inserisci il Client ID Google Cloud.'));
        return;
      }

      this.tokenClient.callback = (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error));
          return;
        }
        this.saveToken(tokenResponse.access_token, Number(tokenResponse.expires_in));
        resolve(tokenResponse.access_token);
      };

      this.tokenClient.requestAccessToken({ prompt: forceConsent ? 'consent' : '' });
    });
  }

  /**
   * Attempts automatic silent connection using saved Client ID
   */
  public async autoConnect(): Promise<boolean> {
    const savedClientId = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
    if (!savedClientId) return false;

    try {
      await this.initClient(savedClientId);
      if (this.isConnected()) {
        return true;
      }
      await this.login(false);
      return this.isConnected();
    } catch (err) {
      console.warn('Auto-connect Google Drive silent login non riuscito:', err);
      return false;
    }
  }

  /**
   * Ensures a valid unexpired access token exists before API calls
   */
  public async ensureValidToken(): Promise<string> {
    if (this.isConnected() && this.accessToken) {
      return this.accessToken;
    }
    const savedClientId = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
    if (savedClientId) {
      if (!this.tokenClient) {
        await this.initClient(savedClientId);
      }
      const token = await this.login(false);
      if (token) return token;
    }
    throw new Error('Non autenticato su Google Drive. Clicca su "Collega Google Drive".');
  }

  public logout(): void {
    if (this.accessToken && (window as any).google?.accounts?.oauth2) {
      (window as any).google.accounts.oauth2.revoke(this.accessToken, () => {
        // revoked
      });
    }
    this.clearToken();
  }

  /**
   * Search for existing vault_finanze.enc in Google Drive
   */
  public async findVaultFile(): Promise<string | null> {
    const token = await this.ensureValidToken();

    const query = encodeURIComponent(`name = '${DRIVE_FILE_NAME}' and trashed = false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Impossibile cercare file in Google Drive');

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      this.fileId = data.files[0].id;
      localStorage.setItem(STORAGE_KEY_FILE_ID, this.fileId!);
      return this.fileId;
    }
    return null;
  }

  /**
   * Download the encrypted vault payload from Google Drive
   */
  public async downloadVault(): Promise<EncryptedVaultPayload | null> {
    const fileId = await this.findVaultFile();
    if (!fileId) return null;

    const token = await this.ensureValidToken();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Errore nel download del vault da Google Drive');

    const payload: EncryptedVaultPayload = await res.json();
    this.saveLocalVault(payload);
    return payload;
  }

  /**
   * Upload encrypted vault payload to Google Drive (create or update)
   */
  public async uploadVault(payload: EncryptedVaultPayload): Promise<void> {
    this.saveLocalVault(payload);

    let token = this.accessToken;
    if (!token || this.isTokenExpired()) {
      try {
        token = await this.ensureValidToken();
      } catch {
        // If not authenticated or cannot silent renew, leave saved locally only
        return;
      }
    }

    const fileContent = JSON.stringify(payload, null, 2);
    const existingId = this.fileId || (await this.findVaultFile());

    if (existingId) {
      // Update existing file
      const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      });

      if (!updateRes.ok) throw new Error('Errore durante l\'aggiornamento del file su Google Drive');
    } else {
      // Create new file with metadata (multipart)
      const metadata = {
        name: DRIVE_FILE_NAME,
        mimeType: 'application/json',
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([fileContent], { type: 'application/json' }));

      const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!createRes.ok) throw new Error('Errore durante la creazione del file su Google Drive');
      const data = await createRes.json();
      this.fileId = data.id;
      localStorage.setItem(STORAGE_KEY_FILE_ID, data.id);
    }
  }

  /**
   * Local storage fallback
   */
  public saveLocalVault(payload: EncryptedVaultPayload): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  }

  public getLocalVault(): EncryptedVaultPayload | null {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

export const googleDrive = new GoogleDriveService();
