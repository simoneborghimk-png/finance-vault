import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Coins,
  Target,
  UploadCloud,
  Lock,
  Unlock,
  RefreshCw,
  Sparkles,
  PieChart as PieChartIcon
} from 'lucide-react';
import { VaultData, Transaction, SavingsGoal } from '@/types/finance';
import { initialVaultData } from '@/lib/mockData';
import { encryptVault, decryptVault } from '@/lib/crypto';
import { googleDrive } from '@/lib/googleDrive';

import { VaultUnlockModal } from '@/components/VaultUnlockModal';
import { ExecutiveDashboard } from '@/components/ExecutiveDashboard';
import { TaxPensionSimulator } from '@/components/TaxPensionSimulator';
import { GoalPlanner } from '@/components/GoalPlanner';
import { FileIngestionDropzone } from '@/components/FileIngestionDropzone';
import { DriveSyncBar } from '@/components/DriveSyncBar';
import { Tabs, TabsList, TabsTrigger, TabsContent, Badge, Button } from '@/components/ui';

export function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [vault, setVault] = useState<VaultData>(initialVaultData);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tax-pension' | 'goals' | 'ingestion'>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Load local encrypted vault on mount if present
  useEffect(() => {
    const localEncrypted = googleDrive.getLocalVault();
    if (!localEncrypted) {
      // First setup: pre-load mock data in memory
      setVault(initialVaultData);
    }
  }, []);

  // Handle Vault Unlock
  const handleUnlock = async (password: string): Promise<boolean> => {
    const localEncrypted = googleDrive.getLocalVault();
    if (localEncrypted) {
      try {
        const decrypted = await decryptVault(localEncrypted, password);
        setVault(decrypted);
        setMasterPassword(password);
        setIsLocked(false);
        return true;
      } catch (err) {
        console.error('Decryption failed:', err);
        return false;
      }
    } else {
      // First initialization: encrypt initial data with chosen password
      try {
        const payload = await encryptVault(initialVaultData, password);
        googleDrive.saveLocalVault(payload);
        setVault(initialVaultData);
        setMasterPassword(password);
        setIsLocked(false);
        return true;
      } catch (err) {
        console.error('Initial encryption failed:', err);
        return false;
      }
    }
  };

  const handleLock = () => {
    setMasterPassword(null);
    setIsLocked(true);
  };

  // Sync to Drive and save local encrypted copy
  const handleSyncToDrive = useCallback(async () => {
    if (!masterPassword) return;
    setIsSyncing(true);
    setSyncFeedback('Cifratura AES-GCM 256 in corso...');

    try {
      const updatedVault: VaultData = {
        ...vault,
        lastUpdated: new Date().toISOString(),
      };
      const encryptedPayload = await encryptVault(updatedVault, masterPassword);
      await googleDrive.uploadVault(encryptedPayload);

      setVault(updatedVault);
      setSyncFeedback('Vault cifrato e sincronizzato con successo!');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err: any) {
      setSyncFeedback('Errore sincronizzazione: ' + (err?.message || 'Errore sconosciuto'));
    } finally {
      setIsSyncing(false);
    }
  }, [vault, masterPassword]);

  // Export encrypted binary file locally (.enc)
  const handleExportLocalEncrypted = async () => {
    if (!masterPassword) return;
    const payload = await encryptVault(vault, masterPassword);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault_finanze_${new Date().toISOString().split('T')[0]}.enc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import encrypted binary file locally
  const handleImportLocalEncrypted = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !masterPassword) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const decrypted = await decryptVault(payload, masterPassword);
      setVault(decrypted);
      googleDrive.saveLocalVault(payload);
      setSyncFeedback('Backup importato e decifrato con successo!');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err: any) {
      alert('Impossibile decifrare il file con la master password corrente: ' + err.message);
    }
  };

  // Merge newly parsed transactions into vault
  const handleImportTransactions = (newTransactions: Transaction[]) => {
    // Avoid duplicates by id
    const existingIds = new Set(vault.transactions.map((t) => t.id));
    const uniqueNew = newTransactions.filter((t) => !existingIds.has(t.id));

    const updated = {
      ...vault,
      transactions: [...uniqueNew, ...vault.transactions].sort((a, b) => b.date.localeCompare(a.date)),
      lastUpdated: new Date().toISOString(),
    };
    setVault(updated);

    // Auto-save local encrypted
    if (masterPassword) {
      encryptVault(updated, masterPassword).then((payload) => {
        googleDrive.saveLocalVault(payload);
      });
    }
  };

  // Goals Handlers
  const handleAddGoal = (goal: SavingsGoal) => {
    const updated = {
      ...vault,
      goals: [...vault.goals, goal],
      lastUpdated: new Date().toISOString(),
    };
    setVault(updated);
    if (masterPassword) {
      encryptVault(updated, masterPassword).then(googleDrive.saveLocalVault);
    }
  };

  const handleRemoveGoal = (id: string) => {
    const updated = {
      ...vault,
      goals: vault.goals.filter((g) => g.id !== id),
      lastUpdated: new Date().toISOString(),
    };
    setVault(updated);
    if (masterPassword) {
      encryptVault(updated, masterPassword).then(googleDrive.saveLocalVault);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Vault Unlock Modal */}
      <VaultUnlockModal isLocked={isLocked} onUnlock={handleUnlock} />

      {/* Main App Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">
                  Finance Vault
                </h1>
                <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-950/30 py-0.5">
                  PWA • Zero-Knowledge
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Cash Flow, Simulazione Fiscale & Sincronizzazione Google Drive Cifrata
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {syncFeedback && (
              <span className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg animate-fade-in hidden md:inline">
                {syncFeedback}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLock}
              className="border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Blocca Vault</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Drive & Security Bar */}
        <DriveSyncBar
          onSync={handleSyncToDrive}
          onExportLocalEncrypted={handleExportLocalEncrypted}
          onImportLocalEncrypted={handleImportLocalEncrypted}
          lastSyncTime={vault.lastUpdated}
        />

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
          <TabsList className="bg-slate-900/80 border border-slate-800 p-1 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-1">
            <TabsTrigger
              value="dashboard"
              className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex items-center justify-center gap-2 py-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Executive Dashboard</span>
            </TabsTrigger>

            <TabsTrigger
              value="tax-pension"
              className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex items-center justify-center gap-2 py-2"
            >
              <Coins className="w-4 h-4" />
              <span>Simulatore Fiscale</span>
            </TabsTrigger>

            <TabsTrigger
              value="goals"
              className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex items-center justify-center gap-2 py-2"
            >
              <Target className="w-4 h-4" />
              <span>Goal Planner</span>
            </TabsTrigger>

            <TabsTrigger
              value="ingestion"
              className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex items-center justify-center gap-2 py-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Ingestione File</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Executive Dashboard */}
          <TabsContent value="dashboard" className="outline-none focus:outline-none">
            <ExecutiveDashboard transactions={vault.transactions} profile={vault.profile} />
          </TabsContent>

          {/* Tab 2: Tax & Pension Fund Simulator */}
          <TabsContent value="tax-pension" className="outline-none focus:outline-none">
            <TaxPensionSimulator
              profile={vault.profile}
              initialContribution={vault.pensionVoluntaryContribution}
              onSaveContribution={(amt) => {
                const updated = { ...vault, pensionVoluntaryContribution: amt, lastUpdated: new Date().toISOString() };
                setVault(updated);
                if (masterPassword) encryptVault(updated, masterPassword).then(googleDrive.saveLocalVault);
              }}
            />
          </TabsContent>

          {/* Tab 3: Goal Planner */}
          <TabsContent value="goals" className="outline-none focus:outline-none">
            <GoalPlanner
              goals={vault.goals}
              profile={vault.profile}
              onAddGoal={handleAddGoal}
              onRemoveGoal={handleRemoveGoal}
            />
          </TabsContent>

          {/* Tab 4: File Ingestion Dropzone */}
          <TabsContent value="ingestion" className="outline-none focus:outline-none">
            <FileIngestionDropzone
              onImportTransactions={handleImportTransactions}
              onSyncDrive={handleSyncToDrive}
              isSyncing={isSyncing}
              driveConnected={googleDrive.isConnected()}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Personal Finance Vault & Dashboard • Client-Side Zero-Knowledge Architecture</span>
          <span className="font-mono text-[11px] text-slate-600">Localhost Environment • Ready for PWA install</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
