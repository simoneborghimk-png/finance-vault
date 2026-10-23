/**
 * Google Drive Client with Google Identity Services (GIS) OAuth2
 * Restricted scope: https://www.googleapis.com/auth/drive.file
 * (The app only has access to files it creates itself)
 */

import { EncryptedVaultPayload } from '@/types/finance';

const DRIVE_FILE_NAME = 'vault_finanze.enc';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const LOCAL_STORAGE_KEY = 'finance_vault_encrypted_local';

export interface GoogleDriveState {
  isAuthenticated: boolean;
  userEmail?: string;
  lastSynced?: string;
  fileId?: string;
}

class GoogleDriveService {
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private fileId: string | null = null;

  constructor() {
    this.accessToken = sessionStorage.getItem('gdrive_access_token');
    this.fileId = localStorage.getItem('gdrive_file_id');
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public isConnected(): boolean {
    return !!this.accessToken;
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
            this.accessToken = tokenResponse.access_token;
            sessionStorage.setItem('gdrive_access_token', tokenResponse.access_token);
          }
        },
      });
    }
  }

  /**
   * Triggers the Google Login popup
   */
  public async login(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Google Identity Services client not initialized. Inserisci il Client ID Google Cloud.'));
        return;
      }

      this.tokenClient.callback = (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error));
          return;
        }
        this.accessToken = tokenResponse.access_token;
        sessionStorage.setItem('gdrive_access_token', tokenResponse.access_token);
        resolve(tokenResponse.access_token);
      };

      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  public logout(): void {
    if (this.accessToken && (window as any).google?.accounts?.oauth2) {
      (window as any).google.accounts.oauth2.revoke(this.accessToken, () => {
        // revoked
      });
    }
    this.accessToken = null;
    sessionStorage.removeItem('gdrive_access_token');
  }

  /**
   * Search for existing vault_finanze.enc in Google Drive
   */
  public async findVaultFile(): Promise<string | null> {
    if (!this.accessToken) throw new Error('Non autenticato su Google Drive');

    const query = encodeURIComponent(`name = '${DRIVE_FILE_NAME}' and trashed = false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!res.ok) throw new Error('Impossibile cercare file in Google Drive');

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      this.fileId = data.files[0].id;
      localStorage.setItem('gdrive_file_id', this.fileId!);
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

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
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

    if (!this.accessToken) {
      return; // Saved locally only
    }

    const fileContent = JSON.stringify(payload, null, 2);
    const existingId = this.fileId || (await this.findVaultFile());

    if (existingId) {
      // Update existing file
      const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
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
        headers: { Authorization: `Bearer ${this.accessToken}` },
        body: form,
      });

      if (!createRes.ok) throw new Error('Errore durante la creazione del file su Google Drive');
      const data = await createRes.json();
      this.fileId = data.id;
      localStorage.setItem('gdrive_file_id', data.id);
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
