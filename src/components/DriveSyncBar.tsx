import React, { useState, useEffect } from 'react';
import { Cloud, Download, Upload, AlertCircle, FileText, AlertTriangle } from 'lucide-react';
import { googleDrive, checkMissingPreviousMonthPayslip } from '@/lib/googleDrive';
import { Button, Input, Badge, Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, Tooltip, Label } from './ui';
import { PayslipSyncDialog } from './PayslipSyncDialog';

interface DriveSyncBarProps {
  onSync: () => Promise<void>;
  onExportLocalEncrypted: () => void;
  onImportLocalEncrypted: (e: React.ChangeEvent<HTMLInputElement>) => void;
  lastSyncTime?: string;
  currentSalary?: number;
  onApplySalary?: (netSalary: number, isExtra?: '13th' | '14th' | null) => void;
}

export const DriveSyncBar: React.FC<DriveSyncBarProps> = ({
  onSync,
  onExportLocalEncrypted,
  onImportLocalEncrypted,
  lastSyncTime,
  currentSalary,
  onApplySalary,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState(() => localStorage.getItem('gdrive_client_id') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [missingPayslip, setMissingPayslip] = useState<{ isMissing: boolean; targetMonthLabel: string }>({
    isMissing: false,
    targetMonthLabel: '',
  });

  const checkPayslipsAlert = async () => {
    if (!googleDrive.isConnected()) return;
    try {
      const items = await googleDrive.listPayslips();
      const res = checkMissingPreviousMonthPayslip(items);
      setMissingPayslip(res);
    } catch {
      // Ignora silenziosamente errori di scan in background
    }
  };

  useEffect(() => {
    // Se il Client ID è già memorizzato, tenta l'auto-connessione silenziosa
    const savedClientId = localStorage.getItem('gdrive_client_id');
    if (savedClientId) {
      googleDrive.autoConnect().then((connected) => {
        setIsConnected(connected);
        if (connected) {
          checkPayslipsAlert();
        }
      });
    } else {
      const conn = googleDrive.isConnected();
      setIsConnected(conn);
      if (conn) {
        checkPayslipsAlert();
      }
    }
  }, []);

  const [isConnecting, setIsConnecting] = useState(false);

  const handleDisconnect = () => {
    googleDrive.logout();
    setIsConnected(false);
    setIsModalOpen(false);
    setMissingPayslip({ isMissing: false, targetMonthLabel: '' });
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
      await checkPayslipsAlert();
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
                Configurazione Google Drive
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs mt-1">
                Sincronizzazione crittografata del vault (<code className="text-primary font-mono">vault_finanze.enc</code>) e lettura cedolini in <code className="text-primary font-mono">Lavoro &gt; Buste paga</code>.
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

              {/* Sezione Backup Manuale Offline (.enc) spostata qui (Opzione A) */}
              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold text-foreground">Backup Manuale Offline (.enc)</span>
                  <span className="text-[10px] text-muted-foreground">
                    Salva o ripristina manualmente il file cifrato in locale in alternativa a Google Drive.
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onExportLocalEncrypted}
                    className="h-8 border-border text-foreground hover:bg-accent text-[11px] px-2.5 flex items-center justify-center gap-1.5 flex-1"
                  >
                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Scarica backup</span>
                  </Button>
                  <label className="h-8 border border-border hover:border-border/80 rounded-md px-2.5 flex items-center justify-center gap-1.5 cursor-pointer text-foreground hover:bg-accent text-[11px] bg-transparent flex-1">
                    <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Ripristina file</span>
                    <input
                      type="file"
                      accept=".enc,.json"
                      className="hidden"
                      onChange={onImportLocalEncrypted}
                    />
                  </label>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pulsante Sincronizzazione Buste Paga Drive con Alert Promemoria oltre il 15 */}
        <Tooltip content={
          missingPayslip.isMissing
            ? `Attenzione: dopo il 15 del mese manca il cedolino di ${missingPayslip.targetMonthLabel} su Drive!`
            : 'Verifica e aggiorna lo stipendio scansionando i cedolini da Drive'
        }>
          <Button
            variant="outline"
            onClick={() => setIsPayslipModalOpen(true)}
            className={`h-8 text-[11px] px-2.5 flex items-center gap-1.5 transition-colors ${
              missingPayslip.isMissing
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                : 'border-border hover:bg-accent text-foreground'
            }`}
          >
            {missingPayslip.isMissing ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-primary" />
            )}
            <span className="hidden sm:inline">Buste Paga Drive</span>
            {missingPayslip.isMissing && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/25 text-amber-300 text-[10px] font-medium border border-amber-500/40">
                Manca {missingPayslip.targetMonthLabel.split(' ')[0]}
              </span>
            )}
          </Button>
        </Tooltip>

        <PayslipSyncDialog
          open={isPayslipModalOpen}
          onOpenChange={(open) => {
            setIsPayslipModalOpen(open);
            if (!open) {
              checkPayslipsAlert();
            }
          }}
          currentSalary={currentSalary || 1953}
          onApplySalary={onApplySalary || (() => {})}
        />
      </div>
    </div>
  );
};
