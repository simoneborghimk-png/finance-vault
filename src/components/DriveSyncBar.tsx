import React, { useState, useEffect } from 'react';
import { Cloud, CloudCheck, Key, Lock, Download, Upload, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { googleDrive } from '@/lib/googleDrive';
import { Button, Input, Badge, Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, Tooltip, Label } from './ui';

interface DriveSyncBarProps {
  onSync: () => Promise<void>;
  onExportLocalEncrypted: () => void;
  onImportLocalEncrypted: (e: React.ChangeEvent<HTMLInputElement>) => void;
  lastSyncTime?: string;
}

export const DriveSyncBar: React.FC<DriveSyncBarProps> = ({
  onSync,
  onExportLocalEncrypted,
  onImportLocalEncrypted,
  lastSyncTime,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState(() => localStorage.getItem('gdrive_client_id') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Se il Client ID è già memorizzato, tenta l'auto-connessione silenziosa
    const savedClientId = localStorage.getItem('gdrive_client_id');
    if (savedClientId) {
      googleDrive.autoConnect().then((connected) => {
        setIsConnected(connected);
      });
    } else {
      setIsConnected(googleDrive.isConnected());
    }
  }, []);

  const [isConnecting, setIsConnecting] = useState(false);

  const handleDisconnect = () => {
    googleDrive.logout();
    setIsConnected(false);
    setIsModalOpen(false);
  };

  const handleConnectGoogle = async () => {
    if (!clientId.trim()) {
      setAuthError('Inserisci un Client ID Google Cloud valido.');
      return;
    }
    setAuthError(null);
    setIsConnecting(true);
    try {
      const trimmedId = clientId.trim();
      localStorage.setItem('gdrive_client_id', trimmedId);
      await googleDrive.initClient(trimmedId);
      // Tenta prima rinnovo silenzioso; se fallisce o non ancora autorizzato, forza consent
      try {
        await googleDrive.login(false);
      } catch {
        await googleDrive.login(true);
      }
      setIsConnected(true);
      setIsModalOpen(false);
      await onSync();
    } catch (err: any) {
      setAuthError(err.message || 'Errore di connessione a Google Drive');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border text-card-foreground text-xs">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-semibold text-foreground">Zero-Knowledge Vault:</span>
        </div>
        <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[10px]">
          AES-256-GCM + PBKDF2
        </Badge>
        {lastSyncTime && (
          <span className="text-muted-foreground hidden sm:inline text-[11px]">
            Ultimo salvataggio: {new Date(lastSyncTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Local Backup Export / Import con Tooltip accessibili */}
        <Tooltip content="Scarica file cifrato di backup (vault_finanze.enc)">
          <Button
            variant="outline"
            onClick={onExportLocalEncrypted}
            className="h-8 border-border text-foreground hover:bg-accent hover:text-accent-foreground text-[11px] px-2.5 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden md:inline">Scarica</span> .enc
          </Button>
        </Tooltip>

        <Tooltip content="Carica e ripristina un file di backup cifrato (.enc o .json)">
          <label className="h-8 border border-border hover:border-border/80 rounded-md px-2.5 flex items-center gap-1.5 cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground text-[11px] bg-transparent">
            <Upload className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden md:inline">Ripristina</span>
            <input
              type="file"
              accept=".enc,.json"
              className="hidden"
              onChange={onImportLocalEncrypted}
            />
          </label>
        </Tooltip>

        {/* Google Drive Status & Connection */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className={`h-8 text-[11px] px-3 flex items-center gap-1.5 ${
                isConnected
                  ? 'border-primary/40 text-primary bg-primary/10'
                  : 'border-border text-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              {isConnected ? 'Google Drive Connesso' : 'Collega Google Drive'}
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-card border-border text-card-foreground max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base text-foreground flex items-center gap-2">
                <Cloud className="w-5 h-5 text-primary" />
                Configurazione Google Drive (drive.file)
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs mt-1">
                L'applicazione accede con scope ristretto <code className="text-primary font-mono">drive.file</code> unicamente al file cifrato da essa creato (<code className="text-primary font-mono">vault_finanze.enc</code>).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {authError && (
                <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/40 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="gdrive-client-id" className="text-foreground font-medium">Google Cloud OAuth2 Client ID</Label>
                <Input
                  id="gdrive-client-id"
                  placeholder="xxxx.apps.googleusercontent.com"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="bg-background border-input text-foreground text-xs font-mono w-full"
                />
                <div className="text-[11px] text-muted-foreground space-y-1.5 bg-muted/40 p-2.5 rounded-lg border border-border">
                  <p className="font-medium text-foreground">Origini JavaScript autorizzate (Google Cloud Console):</p>
                  <ul className="list-disc list-inside space-y-0.5 font-mono text-[10px] text-primary">
                    <li>http://localhost:5180</li>
                    <li>https://simoneborghimk-png.github.io</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleConnectGoogle}
                  disabled={isConnecting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs py-2.5 flex items-center justify-center gap-2 font-medium"
                >
                  <Cloud className="w-4 h-4" />
                  {isConnecting
                    ? 'Connessione in corso...'
                    : isConnected
                    ? 'Riconnetti / Sincronizza'
                    : 'Salva e Connetti Google Drive'}
                </Button>
                {isConnected && (
                  <Button
                    variant="outline"
                    onClick={handleDisconnect}
                    className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 text-xs py-2"
                  >
                    Disconnetti Account
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
