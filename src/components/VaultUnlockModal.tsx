import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Fingerprint, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { isWebAuthnAvailable, hasBiometricSetup, authenticateWithBiometrics, registerBiometricUnlock } from '@/lib/crypto';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Checkbox, Label } from './ui';

interface VaultUnlockModalProps {
  isLocked: boolean;
  onUnlock: (password: string) => Promise<boolean>;
}

export const VaultUnlockModal: React.FC<VaultUnlockModalProps> = ({ isLocked, onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [supportsBiometrics, setSupportsBiometrics] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [enableBiometricsOnUnlock, setEnableBiometricsOnUnlock] = useState(true);

  useEffect(() => {
    isWebAuthnAvailable().then(setSupportsBiometrics);
    setHasBiometric(hasBiometricSetup());
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Inserisci la master password del Vault.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const success = await onUnlock(password);
      if (success) {
        if (supportsBiometrics && !hasBiometric && enableBiometricsOnUnlock) {
          await registerBiometricUnlock(password);
        }
      } else {
        setError('Master password errata o vault non valido.');
      }
    } catch (err: any) {
      setError(err?.message || 'Errore durante lo sblocco del vault.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricUnlock = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const recoveredPassword = await authenticateWithBiometrics();
      if (recoveredPassword) {
        await onUnlock(recoveredPassword);
      } else {
        setError('Autenticazione biometrica annullata o non riconosciuta.');
      }
    } catch (err: any) {
      setError('Errore di lettura biometrica.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <Card className="w-full max-w-md border-primary/30 bg-card text-card-foreground shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-3">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
            Personal Finance Vault
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Architettura Zero-Knowledge e Cifratura AES-GCM 256-bit
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="flex items-center justify-center gap-2 text-xs">
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 py-1 px-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              PBKDF2 100k Iterazioni
            </Badge>
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 py-1 px-2.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              AES-256-GCM
            </Badge>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/40 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="vault-master-password" className="text-xs font-medium text-foreground">
                Master Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vault-master-password"
                type="password"
                placeholder="Inserisci la tua Master Password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full"
              />
              <p className="text-[11px] text-muted-foreground">
                La chiave di cifratura viene derivata esclusivamente in locale nel tuo browser.
              </p>
            </div>

            {supportsBiometrics && !hasBiometric && (
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="enable-biometrics"
                  checked={enableBiometricsOnUnlock}
                  onCheckedChange={(checked) => setEnableBiometricsOnUnlock(Boolean(checked))}
                />
                <Label htmlFor="enable-biometrics" className="text-xs text-foreground cursor-pointer font-normal">
                  Abilita sblocco rapido biometrico (Face ID / Touch ID)
                </Label>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 transition-all shadow-lg"
            >
              {isLoading ? 'Decifratura in corso...' : (
                <span className="flex items-center justify-center gap-2">
                  <Unlock className="w-4 h-4" />
                  Sblocca Vault
                </span>
              )}
            </Button>
          </form>

          {supportsBiometrics && hasBiometric && (
            <div className="pt-2">
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Oppure</span></div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleBiometricUnlock}
                disabled={isLoading}
                className="w-full border-primary/30 text-primary hover:bg-primary/10 flex items-center justify-center gap-2"
              >
                <Fingerprint className="w-4 h-4 text-primary" />
                Accedi con Biometria / Passkey
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="text-center justify-center border-t border-border pt-4 text-xs text-muted-foreground">
          Nessun dato finanziario in chiaro lascia mai questo dispositivo.
        </CardFooter>
      </Card>
    </div>
  );
};
