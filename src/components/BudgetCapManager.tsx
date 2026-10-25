import React, { useState, useMemo } from 'react';
import { Transaction } from '@/types/finance';
import {
  ShieldAlert,
  Sliders,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  TrendingDown,
  Layers,
  Calendar,
  Check,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Progress,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
} from './ui';

interface BudgetCapManagerProps {
  transactions: Transaction[];
  budgetCaps?: Record<string, number>;
  onUpdateBudgetCaps?: (caps: Record<string, number>) => void;
}

const formatEuro = (amount: number): string => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatMonthLabel = (m: string) => {
  const [y, mon] = m.split('-');
  const date = new Date(parseInt(y, 10), parseInt(mon, 10) - 1, 1);
  return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
};

export const BudgetCapManager: React.FC<BudgetCapManagerProps> = ({
  transactions,
  budgetCaps = {},
  onUpdateBudgetCaps,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableCaps, setEditableCaps] = useState<Record<string, number>>(budgetCaps);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');

  // Estrae tutti i mesi presenti nelle transazioni in ordine decrescente
  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(transactions.map((t) => t.date.substring(0, 7)))).sort().reverse();
    if (months.length === 0) {
      return [new Date().toISOString().substring(0, 7)];
    }
    return months;
  }, [transactions]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => availableMonths[0] || new Date().toISOString().substring(0, 7));

  // Sincronizza se i mesi disponibili cambiano
  React.useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // Sincronizza quando cambiano le props
  React.useEffect(() => {
    setEditableCaps(budgetCaps);
  }, [budgetCaps]);

  // Calcola la spesa reale del mese selezionato per ogni categoria con un cap
  const spendingMetrics = useMemo(() => {
    // Mappa della spesa per categoria nel mese selezionato
    const monthlySpending: Record<string, number> = {};
    transactions
      .filter((t) => t.date.startsWith(selectedMonth) && t.amount < 0)
      .forEach((t) => {
        monthlySpending[t.category] = (monthlySpending[t.category] || 0) + Math.abs(t.amount);
      });

    let totalBudget = 0;
    let totalSpent = 0;
    let exceededCount = 0;
    let warningCount = 0;
    let okCount = 0;

    const entries = Object.entries(budgetCaps).map(([category, limit]) => {
      const spent = monthlySpending[category] || 0;
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const remaining = limit - spent;
      const isExceeded = spent > limit;
      const isWarning = !isExceeded && percentage >= 75;

      totalBudget += limit;
      totalSpent += spent;
      if (isExceeded) exceededCount++;
      else if (isWarning) warningCount++;
      else okCount++;

      return {
        category,
        limit,
        spent: Math.round(spent),
        remaining: Math.round(remaining),
        percentage,
        isExceeded,
        isWarning,
      };
    });

    const totalRemaining = totalBudget - totalSpent;

    return {
      selectedMonth,
      totalBudget,
      totalSpent: Math.round(totalSpent),
      totalRemaining: Math.round(totalRemaining),
      exceededCount,
      warningCount,
      okCount,
      entries: entries.sort((a, b) => b.percentage - a.percentage),
    };
  }, [transactions, budgetCaps, selectedMonth]);

  const handleSaveCaps = () => {
    onUpdateBudgetCaps?.(editableCaps);
    setIsModalOpen(false);
  };

  const handleAddCap = () => {
    const limitNum = parseFloat(newLimit.replace(',', '.'));
    if (!newCategory.trim() || isNaN(limitNum) || limitNum <= 0) return;

    setEditableCaps((prev) => ({
      ...prev,
      [newCategory.trim()]: limitNum,
    }));
    setNewCategory('');
    setNewLimit('');
  };

  const handleDeleteCap = (cat: string) => {
    setEditableCaps((prev) => {
      const next = { ...prev };
      delete next[cat];
      return next;
    });
  };

  // Categorie uniche disponibili dalle transazioni per auto-completamento rapido
  const availableCategories = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [transactions]);

  return (
    <Card className="bg-card border-border relative overflow-hidden shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">
                Monitoraggio Budget Cap & Soglie Mensili
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Controllo in tempo reale dell'assorbimento delle soglie di spesa nelle categorie critiche
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Selettore Mese Storico */}
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer capitalize"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m} className="bg-card text-foreground capitalize">
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditableCaps(budgetCaps);
                setIsModalOpen(true);
              }}
              className="h-8 text-xs border-border hover:bg-muted/50 gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-primary" />
              <span>Imposta Soglie Budget</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mini-Cruscotto Aggregato se sono presenti cap */}
        {spendingMetrics.entries.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-background border border-border">
            <div>
              <span className="text-[10px] text-muted-foreground font-medium block">Budget Totale Monitorato</span>
              <span className="text-sm font-bold text-foreground font-mono">
                {formatEuro(spendingMetrics.totalBudget)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground font-medium block">Speso a {formatMonthLabel(selectedMonth)}</span>
              <span className="text-sm font-bold text-foreground font-mono">
                {formatEuro(spendingMetrics.totalSpent)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground font-medium block">Margine Residuo</span>
              <span
                className={`text-sm font-bold font-mono ${
                  spendingMetrics.totalRemaining >= 0 ? 'text-emerald-500' : 'text-destructive'
                }`}
              >
                {spendingMetrics.totalRemaining >= 0 ? `+${formatEuro(spendingMetrics.totalRemaining)}` : formatEuro(spendingMetrics.totalRemaining)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground font-medium block">Stato delle Soglie</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-semibold">
                  {spendingMetrics.okCount} OK
                </span>
                {spendingMetrics.warningCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 font-semibold">
                    {spendingMetrics.warningCount} Pre-allarme
                  </span>
                )}
                {spendingMetrics.exceededCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-semibold">
                    {spendingMetrics.exceededCount} Sforati
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {spendingMetrics.entries.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Nessun budget cap impostato. Clicca su "Imposta Soglie Budget" per definire i limiti massimi mensili per categoria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {spendingMetrics.entries.map((item) => {
              // Determina stili di alert e progress indicator
              let indicatorColor = 'bg-primary';
              let badgeText = `${item.percentage}%`;
              let badgeClass = 'text-muted-foreground';

              if (item.isExceeded) {
                indicatorColor = 'bg-destructive';
                badgeText = `Sforato (+${formatEuro(Math.abs(item.remaining))})`;
                badgeClass = 'bg-destructive text-destructive-foreground';
              } else if (item.isWarning) {
                indicatorColor = 'bg-amber-500';
                badgeClass = 'bg-amber-500/15 text-amber-500 border border-amber-500/30';
              } else {
                badgeClass = 'bg-primary/15 text-primary border border-primary/30';
              }

              return (
                <div
                  key={item.category}
                  className="p-3 rounded-xl border border-border bg-background/50 space-y-2 hover:border-border/80 transition-all shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate">
                      <p className="text-xs font-semibold text-foreground truncate">{item.category}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Speso {formatEuro(item.spent)} su {formatEuro(item.limit)}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>

                  <Progress
                    value={Math.min(item.percentage, 100)}
                    className="h-2 bg-muted/60"
                    indicatorClassName={indicatorColor}
                  />

                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="text-muted-foreground">
                      {item.isExceeded ? 'Limite superato' : 'Margine residuo'}
                    </span>
                    <span
                      className={`font-semibold font-mono ${
                        item.isExceeded
                          ? 'text-destructive'
                          : item.isWarning
                          ? 'text-amber-500'
                          : 'text-primary'
                      }`}
                    >
                      {item.isExceeded
                        ? `-${formatEuro(Math.abs(item.remaining))}`
                        : `+${formatEuro(item.remaining)} disponibili`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Dialog Gestione Soglie */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              Gestione Soglie di Spesa Mensili (Budget Caps)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Definisci il limite massimo di spesa mensile per le categorie critiche. I dati vengono crittografati nel Vault.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Lista cap esistenti */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {Object.entries(editableCaps).map(([cat, limit]) => (
                <div
                  key={cat}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg bg-background border border-border"
                >
                  <span className="font-medium text-foreground truncate">{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{formatEuro(limit)}/m</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCap(cat)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded"
                      aria-label={`Rimuovi cap per ${cat}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {Object.keys(editableCaps).length === 0 && (
                <p className="text-center py-4 text-muted-foreground italic">
                  Nessun cap definito. Aggiungine uno qui sotto.
                </p>
              )}
            </div>

            {/* Form aggiunta nuovo cap */}
            <div className="p-3 rounded-lg bg-background border border-border space-y-3">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-primary" />
                Aggiungi o Modifica Soglia
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="cap-category" className="text-[11px] text-muted-foreground">Categoria</Label>
                  <input
                    id="cap-category"
                    list="categories-list"
                    type="text"
                    placeholder="es. Supermercato"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full mt-1 bg-card border border-input rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <datalist id="categories-list">
                    {availableCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <Label htmlFor="cap-limit" className="text-[11px] text-muted-foreground">Tetto Mensile (€)</Label>
                  <input
                    id="cap-limit"
                    type="number"
                    placeholder="es. 400"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    className="w-full mt-1 bg-card border border-input rounded px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleAddCap}
                disabled={!newCategory.trim() || !newLimit}
                className="w-full h-8 text-xs font-medium"
              >
                Aggiungi alla Lista
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs"
            >
              Annulla
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveCaps}
              className="text-xs"
            >
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
