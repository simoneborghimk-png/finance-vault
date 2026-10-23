import React, { useState, useEffect } from 'react';
import { Cloud, CloudCheck, Key, Lock, Download, Upload, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { googleDrive } from '@/lib/googleDrive';
import { Button, Input, Badge, Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui';

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
    setIsConnected(googleDrive.isConnected());
  }, []);

  const handleSaveClientId = async () => {
    if (!clientId) return;
    localStorage.setItem('gdrive_client_id', clientId);
    try {
      await googleDrive.initClient(clientId);
      setIsModalOpen(false);
    } catch (e: any) {
      setAuthError(e.message);
    }
  };

  const handleConnectGoogle = async () => {
    setAuthError(null);
    try {
      if (!clientId) {
        setIsModalOpen(true);
        return;
      }
      await googleDrive.initClient(clientId);
      await googleDrive.login();
      setIsConnected(true);
      await onSync();
    } catch (err: any) {
      setAuthError(err.message || 'Errore di connessione a Google Drive');
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">Zero-Knowledge Vault:</span>
        </div>
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 bg-emerald-950/20 text-[10px]">
          AES-256-GCM + PBKDF2
        </Badge>
        {lastSyncTime && (
          <span className="text-slate-500 hidden sm:inline text-[11px]">
            Ultimo salvataggio: {new Date(lastSyncTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Local Backup Export / Import */}
        <Button
          variant="outline"
          onClick={onExportLocalEncrypted}
          className="h-8 border-slate-700 text-slate-300 hover:text-white text-[11px] px-2.5 flex items-center gap-1.5"
          title="Scarica file cifrato di backup (vault_finanze.enc)"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Scarica</span> .enc
        </Button>

        <label className="h-8 border border-slate-700 hover:border-slate-600 rounded-md px-2.5 flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white text-[11px] bg-transparent">
          <Upload className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Ripristina</span>
          <input
            type="file"
            accept=".enc,.json"
            className="hidden"
            onChange={onImportLocalEncrypted}
          />
        </label>

        {/* Google Drive Status & Connection */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className={`h-8 text-[11px] px-3 flex items-center gap-1.5 ${
                isConnected
                  ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/20'
                  : 'border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              {isConnected ? 'Google Drive Connesso' : 'Collega Google Drive'}
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-[#0f172a] border-slate-800 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-400" />
                Configurazione Google Drive (drive.file)
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-1">
                L'applicazione accede con scope ristretto <code className="text-emerald-400">drive.file</code> unicamente al file cifrato da essa creato (<code className="text-cyan-400">vault_finanze.enc</code>).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {authError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Google Cloud OAuth2 Client ID</label>
                <Input
                  placeholder="xxxx.apps.googleusercontent.com"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="bg-slate-950/80 border-slate-700 text-slate-100 text-xs font-mono"
                />
                <div className="text-[11px] text-slate-400 space-y-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <p className="font-medium text-slate-300">Origini JavaScript autorizzate (Google Cloud Console):</p>
                  <ul className="list-disc list-inside space-y-0.5 font-mono text-[10px] text-emerald-400">
                    <li>http://localhost:5180</li>
                    <li>https://simoneborghimk-png.github.io</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSaveClientId}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2"
                >
                  Salva e Inizializza
                </Button>
                <Button
                  variant="outline"
                  onClick={handleConnectGoogle}
                  className="flex-1 border-slate-700 text-slate-200 text-xs py-2"
                >
                  Connetti Account
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
