import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  ReceiptText,
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
import { DriveSyncBar } from '@/components/DriveSyncBar';
import { Tabs, TabsList, TabsTrigger, TabsContent, Badge, Button } from '@/components/ui';

// Lazy-loaded tabs with code splitting
const TransactionsManager = React.lazy(() =>
  import('@/components/TransactionsManager').then((m) => ({ default: m.TransactionsManager }))
);
const TaxPensionSimulator = React.lazy(() =>
  import('@/components/TaxPensionSimulator').then((m) => ({ default: m.TaxPensionSimulator }))
);
const GoalPlanner = React.lazy(() =>
  import('@/components/GoalPlanner').then((m) => ({ default: m.GoalPlanner }))
);
const FileIngestionDropzone = React.lazy(() =>
  import('@/components/FileIngestionDropzone').then((m) => ({ default: m.FileIngestionDropzone }))
);

function TabLoadingSkeleton() {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center space-y-3">
      <RefreshCw className="w-6 h-6 animate-spin text-primary opacity-80" />
      <p className="text-xs text-muted-foreground font-medium">Caricamento modulo...</p>
    </div>
  );
}

const SESSION_VAULT_KEY = 'finance_vault_session_key';

export function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [vault, setVault] = useState<VaultData>(initialVaultData);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'tax-pension' | 'goals' | 'ingestion'>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const isLegacyMockData = (v: VaultData): boolean => {
    if (!v.transactions || v.transactions.length === 0) return true;
    const hasOldMock = v.transactions.some((t) => t.id.startsWith('mock-') || t.id.startsWith('virtual-'));
    const hasGastroBug = v.transactions.some(
      (t) => t.description.toLowerCase().includes('gastromacelleria') && t.category.includes('Luce')
    );
    const hasExcessiveOther = v.transactions.filter((t) => t.category === 'Altre Spese').length > 5;
    const hasItomiShopping = v.transactions.some(
      (t) => t.description.toLowerCase().includes('itomi') && t.category === 'Shopping e Abbigliamento'
    );
    const hasUnreconciledAmazon = v.transactions.some(
      (t) => /amzn|amazon/i.test(t.description) && t.description.toLowerCase().includes('amazon eu s.a r.l.')
    );
    const hasTimfinNeeds = v.transactions.some(
      (t) => t.description.toLowerCase().includes('timfin') && t.macroCategory === 'Needs'
    );
    return hasOldMock || hasGastroBug || hasExcessiveOther || hasItomiShopping || hasUnreconciledAmazon || hasTimfinNeeds;
  };

  const ensureRealData = (v: VaultData, pwd?: string | null): VaultData => {
    if (isLegacyMockData(v)) {
      const upgraded: VaultData = {
        ...v,
        transactions: initialVaultData.transactions,
        lastUpdated: new Date().toISOString(),
      };
      if (pwd) {
        encryptVault(upgraded, pwd).then((payload) => googleDrive.saveLocalVault(payload));
      }
      return upgraded;
    }
    return v;
  };

  // Check for active session key in sessionStorage or load local encrypted vault on mount
  useEffect(() => {
    const sessionPassword = sessionStorage.getItem(SESSION_VAULT_KEY);
    const localEncrypted = googleDrive.getLocalVault();

    if (sessionPassword && localEncrypted) {
      decryptVault(localEncrypted, sessionPassword)
        .then((decrypted) => {
          setVault(ensureRealData(decrypted, sessionPassword));
          setMasterPassword(sessionPassword);
          setIsLocked(false);
        })
        .catch((err) => {
          console.warn('Session auto-unlock fallito, ripulitura sessione:', err);
          sessionStorage.removeItem(SESSION_VAULT_KEY);
          setIsLocked(true);
        });
    } else if (!localEncrypted) {
      // First setup: pre-load mock data in memory
      setVault(initialVaultData);
    }
  }, []);

  // Proactively migrate any legacy mock transactions currently in state to the real reconciled dataset
  useEffect(() => {
    if (isLegacyMockData(vault)) {
      console.log('Migrazione automatica: caricamento delle 658 transazioni reali...');
      const upgraded: VaultData = {
        ...vault,
        transactions: initialVaultData.transactions,
        lastUpdated: new Date().toISOString(),
      };
      setVault(upgraded);
      if (masterPassword) {
        encryptVault(upgraded, masterPassword).then((payload) => googleDrive.saveLocalVault(payload));
      }
    }
  }, [vault, masterPassword]);

  // Handle Vault Unlock
  const handleUnlock = async (password: string): Promise<boolean> => {
    const localEncrypted = googleDrive.getLocalVault();
    if (localEncrypted) {
      try {
        const decrypted = await decryptVault(localEncrypted, password);
        const data = ensureRealData(decrypted, password);
        setVault(data);
        setMasterPassword(password);
        sessionStorage.setItem(SESSION_VAULT_KEY, password);
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
        sessionStorage.setItem(SESSION_VAULT_KEY, password);
        setIsLocked(false);
        return true;
      } catch (err) {
        console.error('Initial encryption failed:', err);
        return false;
      }
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem(SESSION_VAULT_KEY);
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

  // Single Transaction CRUD Handlers
  const handleAddTransaction = (newTx: Transaction) => {
    const updated = {
      ...vault,
      transactions: [newTx, ...vault.transactions].sort((a, b) => b.date.localeCompare(a.date)),
      lastUpdated: new Date().toISOString(),
    };
    setVault(updated);
    if (masterPassword) {
      encryptVault(updated, masterPassword).then(googleDrive.saveLocalVault);
    }
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    const updated = {
      ...vault,
      transactions: vault.transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t)),
      lastUpdated: new Date().toISOString(),
    };
    setVault(updated);
    if (masterPassword) {
      encryptVault(updated, masterPassword).then(googleDrive.saveLocalVault);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = {
      ...vault,
      transactions: vault.transactions.filter((t) => t.id !== id),
      lastUpdated: new Date().toISOString(),
    };
    setVault(updated);
    if (masterPassword) {
      encryptVault(updated, masterPassword).then(googleDrive.saveLocalVault);
    }
  };

  const handleResetToRealTransactions = useCallback(async () => {
    const updated: VaultData = {
      ...vault,
      transactions: initialVaultData.transactions,
      lastUpdated: new Date().toISOString(),
    };
    setVault(updated);
    if (masterPassword) {
      const payload = await encryptVault(updated, masterPassword);
      googleDrive.saveLocalVault(payload);
    }
    setSyncFeedback('Dataset aggiornato con successo: 658 movimenti reali caricati!');
    setTimeout(() => setSyncFeedback(null), 3500);
  }, [vault, masterPassword]);

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

  const handleUpdateBudgetCaps = (budgetCaps: Record<string, number>) => {
    const updated = {
      ...vault,
      budgetCaps,
      lastUpdated: new Date().toISOString(),
    };
    setVault(updated);
    if (masterPassword) {
      encryptVault(updated, masterPassword).then(googleDrive.saveLocalVault);
    }
  };

  const handleApplySalary = (netSalary: number, isExtra?: '13th' | '14th' | null) => {
    let updatedProfile = { ...vault.profile };
    if (isExtra === '14th') {
      updatedProfile.extraSalaries = {
        ...updatedProfile.extraSalaries,
        fourteenthNetJune: netSalary,
      };
    } else if (isExtra === '13th') {
      updatedProfile.extraSalaries = {
        ...updatedProfile.extraSalaries,
        thirteenthNetDec: netSalary,
      };
    } else {
      updatedProfile.baseMonthlyNetSalary = netSalary;
    }

    const updated = {
      ...vault,
      profile: updatedProfile,
      lastUpdated: new Date().toISOString(),
    };
    setVault(updated);
    if (masterPassword) {
      encryptVault(updated, masterPassword).then(googleDrive.saveLocalVault);
    }
    setSyncFeedback(`Stipendio aggiornato: ${netSalary.toFixed(2)} €`);
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/30 selection:text-primary">
      {/* Vault Unlock Modal */}
      <VaultUnlockModal isLocked={isLocked} onUnlock={handleUnlock} />

      {/* Main App Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-foreground">
                  Finance Vault
                </h1>
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/10 py-0.5">
                  PWA • Zero-Knowledge
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Cash Flow, Simulazione Fiscale & Sincronizzazione Google Drive Cifrata
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {syncFeedback && (
              <span className="text-xs text-primary bg-primary/10 border border-primary/30 px-2.5 py-1 rounded-lg animate-fade-in hidden md:inline">
                {syncFeedback}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLock}
              className="border-border text-foreground hover:bg-accent hover:text-accent-foreground text-xs flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
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
          currentSalary={vault.profile.baseMonthlyNetSalary}
          onApplySalary={handleApplySalary}
        />

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
          <TabsList className="w-full bg-card/80 border border-border p-1.5 rounded-xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 shadow-xs">
            <TabsTrigger
              value="dashboard"
              className="w-full h-10 text-xs rounded-lg px-3 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span className="truncate">Executive Dashboard</span>
            </TabsTrigger>

            <TabsTrigger
              value="transactions"
              className="w-full h-10 text-xs rounded-lg px-3 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <ReceiptText className="w-4 h-4 shrink-0" />
              <span className="truncate">Transazioni</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-muted/80 text-muted-foreground font-mono">
                {vault.transactions.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="tax-pension"
              className="w-full h-10 text-xs rounded-lg px-3 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Coins className="w-4 h-4 shrink-0" />
              <span className="truncate">Simulatore Fiscale</span>
            </TabsTrigger>

            <TabsTrigger
              value="goals"
              className="w-full h-10 text-xs rounded-lg px-3 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Target className="w-4 h-4 shrink-0" />
              <span className="truncate">Goal Planner</span>
            </TabsTrigger>

            <TabsTrigger
              value="ingestion"
              className="w-full h-10 text-xs rounded-lg px-3 py-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <UploadCloud className="w-4 h-4 shrink-0" />
              <span className="truncate">Ingestione File</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Executive Dashboard */}
          <TabsContent value="dashboard" className="outline-none focus:outline-none">
            <ExecutiveDashboard
              transactions={vault.transactions}
              profile={vault.profile}
              budgetCaps={vault.budgetCaps}
              onUpdateBudgetCaps={handleUpdateBudgetCaps}
            />
          </TabsContent>

          {/* Tab 2: Transactions Manager */}
          <TabsContent value="transactions" className="outline-none focus:outline-none">
            <React.Suspense fallback={<TabLoadingSkeleton />}>
              <TransactionsManager
                transactions={vault.transactions}
                onAddTransaction={handleAddTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onResetToRealTransactions={handleResetToRealTransactions}
              />
            </React.Suspense>
          </TabsContent>

          {/* Tab 3: Tax & Pension Fund Simulator */}
          <TabsContent value="tax-pension" className="outline-none focus:outline-none">
            <React.Suspense fallback={<TabLoadingSkeleton />}>
              <TaxPensionSimulator
                profile={vault.profile}
                initialContribution={vault.pensionVoluntaryContribution}
                onSaveContribution={(amt) => {
                  const updated = { ...vault, pensionVoluntaryContribution: amt, lastUpdated: new Date().toISOString() };
                  setVault(updated);
                  if (masterPassword) encryptVault(updated, masterPassword).then(googleDrive.saveLocalVault);
                }}
              />
            </React.Suspense>
          </TabsContent>

          {/* Tab 4: Goal Planner */}
          <TabsContent value="goals" className="outline-none focus:outline-none">
            <React.Suspense fallback={<TabLoadingSkeleton />}>
              <GoalPlanner
                goals={vault.goals}
                profile={vault.profile}
                onAddGoal={handleAddGoal}
                onRemoveGoal={handleRemoveGoal}
              />
            </React.Suspense>
          </TabsContent>

          {/* Tab 5: File Ingestion Dropzone */}
          <TabsContent value="ingestion" className="outline-none focus:outline-none">
            <React.Suspense fallback={<TabLoadingSkeleton />}>
              <FileIngestionDropzone
                onImportTransactions={handleImportTransactions}
                onSyncDrive={handleSyncToDrive}
                isSyncing={isSyncing}
                driveConnected={googleDrive.isConnected()}
              />
            </React.Suspense>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/40 py-4 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Personal Finance Vault & Dashboard • Client-Side Zero-Knowledge Architecture</span>
          <span className="font-mono text-[11px] text-muted-foreground">Localhost Environment • Ready for PWA install</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
