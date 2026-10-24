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
  Layers
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
  Label
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

export const BudgetCapManager: React.FC<BudgetCapManagerProps> = ({
  transactions,
  budgetCaps = {},
  onUpdateBudgetCaps,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableCaps, setEditableCaps] = useState<Record<string, number>>(budgetCaps);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');

  // Sincronizza quando cambiano le props
  React.useEffect(() => {
    setEditableCaps(budgetCaps);
  }, [budgetCaps]);

  // Calcola la spesa reale dell'ultimo mese attivo per ogni categoria con un cap
  const spendingMetrics = useMemo(() => {
    // Determina l'ultimo mese presente nelle transazioni
    const months = Array.from(new Set(transactions.map((t) => t.date.substring(0, 7)))).sort();
    const latestMonth = months[months.length - 1] || new Date().toISOString().substring(0, 7);

    // Mappa della spesa per categoria nell'ultimo mese
    const monthlySpending: Record<string, number> = {};
    transactions
      .filter((t) => t.date.startsWith(latestMonth) && t.amount < 0)
      .forEach((t) => {
        monthlySpending[t.category] = (monthlySpending[t.category] || 0) + Math.abs(t.amount);
      });

    const entries = Object.entries(budgetCaps).map(([category, limit]) => {
      const spent = monthlySpending[category] || 0;
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const remaining = limit - spent;
      const isExceeded = spent > limit;
      const isWarning = !isExceeded && percentage >= 75;

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

    return {
      latestMonth,
      entries: entries.sort((a, b) => b.percentage - a.percentage),
    };
  }, [transactions, budgetCaps]);

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

  return (
    <Card className="bg-card border-border relative overflow-hidden">
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
              Controllo in tempo reale dell'assorbimento delle soglie di spesa (riferimento {spendingMetrics.latestMonth})
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditableCaps(budgetCaps);
              setIsModalOpen(true);
            }}
            className="h-8 text-xs border-border hover:bg-muted/50 gap-1.5 self-start sm:self-auto"
          >
            <Sliders className="w-3.5 h-3.5 text-primary" />
            <span>Imposta Soglie Budget</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {spendingMetrics.entries.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Nessun budget cap impostato. Clicca su "Imposta Soglie Budget" per definire i limiti massimi mensili per categoria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {spendingMetrics.entries.map((item) => {
              // Determina stili di alert e progress indicator
              let indicatorColor = 'bg-primary';
              let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
              let badgeText = `${item.percentage}%`;
              let badgeClass = 'text-muted-foreground';

              if (item.isExceeded) {
                indicatorColor = 'bg-destructive';
                badgeVariant = 'destructive';
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
                      className={`font-semibold ${
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
                  <span className="font-medium truncate text-foreground flex-1">{cat}</span>
                  <div className="flex items-center gap-2">
                    <div className="relative w-28">
                      <Input
                        type="number"
                        min="0"
                        step="10"
                        value={limit}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEditableCaps((prev) => ({ ...prev, [cat]: val }));
                        }}
                        className="h-8 text-xs font-mono pr-6 text-right"
                      />
                      <span className="absolute right-2 top-2 text-muted-foreground text-xs pointer-events-none">
                        €
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCap(cat)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Aggiungi nuovo Cap */}
            <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Aggiungi nuova soglia
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome Categoria (es. Trasporti, Uscite...)"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="h-8 text-xs flex-1"
                />
                <div className="relative w-28">
                  <Input
                    placeholder="Budget"
                    type="number"
                    min="1"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    className="h-8 text-xs font-mono pr-6 text-right"
                  />
                  <span className="absolute right-2 top-2 text-muted-foreground text-xs pointer-events-none">
                    €
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCap}
                  className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-3 gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Aggiungi</span>
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="h-8 text-xs border-border"
            >
              Annulla
            </Button>
            <Button
              type="button"
              onClick={handleSaveCaps}
              className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 shadow-sm"
            >
              Salva Soglie nel Vault
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
