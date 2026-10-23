import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Fingerprint, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { isWebAuthnAvailable, hasBiometricSetup, authenticateWithBiometrics, registerBiometricUnlock } from '@/lib/crypto';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge } from './ui';

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
      <Card className="w-full max-w-md border-emerald-500/30 bg-[#0d1321] text-slate-100 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center mb-3">
            <Lock className="w-7 h-7 text-emerald-400" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Personal Finance Vault
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            Architettura Zero-Knowledge e Cifratura AES-GCM 256-bit
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="flex items-center justify-center gap-2 text-xs">
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 bg-emerald-950/40 py-1 px-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              PBKDF2 100k Iterazioni
            </Badge>
            <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 bg-cyan-950/40 py-1 px-2.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              AES-256-GCM
            </Badge>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Master Password</label>
              <Input
                type="password"
                placeholder="Inserisci la tua Master Password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="bg-slate-900/80 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400">
                La chiave di cifratura viene derivata esclusivamente in locale nel tuo browser.
              </p>
            </div>

            {supportsBiometrics && !hasBiometric && (
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={enableBiometricsOnUnlock}
                  onChange={(e) => setEnableBiometricsOnUnlock(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                Abilita sblocco rapido biometrico (Face ID / Touch ID)
              </label>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 transition-all shadow-lg shadow-emerald-900/30"
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
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0d1321] px-2 text-slate-400">Oppure</span></div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleBiometricUnlock}
                disabled={isLoading}
                className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40 flex items-center justify-center gap-2"
              >
                <Fingerprint className="w-4 h-4 text-cyan-400" />
                Accedi con Biometria / Passkey
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="text-center justify-center border-t border-slate-800/80 pt-4 text-xs text-slate-400">
          Nessun dato finanziario in chiaro lascia mai questo dispositivo.
        </CardFooter>
      </Card>
    </div>
  );
};
