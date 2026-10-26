import React, { useState, useMemo } from 'react';
import { SavingsGoal, UserFinancialProfile, Transaction, RecurringOverride } from '@/types/finance';
import {
  Target,
  Compass,
  Plane,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Coins,
  Wallet,
  Gift,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Button,
  Input,
  Progress,
  Badge,
  Tooltip,
  Label,
  MonthTargetPicker,
} from './ui';
import { BudgetCapManager } from './BudgetCapManager';

const formatTargetDateLabel = (dateStr: string) => {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [y, m] = dateStr.split('-');
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
};

interface GoalPlannerProps {
  goals: SavingsGoal[];
  profile: UserFinancialProfile;
  onAddGoal: (goal: SavingsGoal) => void;
  onRemoveGoal: (id: string) => void;
  transactions?: Transaction[];
  budgetCaps?: Record<string, number>;
  onUpdateBudgetCaps?: (caps: Record<string, number>) => void;
  recurringOverrides?: Record<string, RecurringOverride>;
  onUpdateRecurringOverrides?: (overrides: Record<string, RecurringOverride>) => void;
}

export const GoalPlanner: React.FC<GoalPlannerProps> = ({
  goals,
  profile,
  onAddGoal,
  onRemoveGoal,
  transactions = [],
  budgetCaps = {},
  onUpdateBudgetCaps,
  recurringOverrides = {},
  onUpdateRecurringOverrides,
}) => {
  const [activeSection, setActiveSection] = useState<'goals' | 'budgets'>('goals');
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState<number | ''>(4500);
  const [targetDate, setTargetDate] = useState('2027-04');
  const [notes, setNotes] = useState('Pianificazione viaggio');

  const formatEuro = (val: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  // Calcolo e rilevamento dinamico a consuntivo delle tre entrate straordinarie reali (14ª, 13ª e 730)
  const extraLiquidity = useMemo(() => {
    // 1. Rilevamento Rimborso 730 reale
    // A) Transazioni esplicite categorizzate o taggate 730
    const explicit730Txs = (transactions || []).filter((t) => {
      if (t.amount <= 0) return false;
      if (t.category === 'Rimborso 730') return true;
      if (t.tags?.some((tag) => tag.toLowerCase().includes('730'))) return true;
      const desc = (t.description + ' ' + (t.rawDescription || '')).toUpperCase();
      return desc.includes('730') || desc.includes('AGENZIA ENTRATE RIMBORSO');
    });
    const totalExplicit730 = explicit730Txs.reduce((acc, t) => acc + t.amount, 0);

    // B) Bonifici estivi con rimborso integrato nel cedolino (accrediti di Agosto per competenze Luglio e Settembre per competenze Agosto)
    let summerSurplus730 = 0;
    (transactions || []).forEach((t) => {
      if (t.amount > 2100 && (t.date.includes('-08-') || t.date.includes('-09-'))) {
        const desc = (t.description + ' ' + (t.rawDescription || '')).toUpperCase();
        if (desc.includes('CLOUDFIRE') || desc.includes('COMPETENZE') || desc.includes('STIPENDIO')) {
          summerSurplus730 += Math.max(0, t.amount - 1950);
        }
      }
    });

    const real730Amount =
      totalExplicit730 > 0
        ? totalExplicit730
        : summerSurplus730 > 0
        ? summerSurplus730
        : (profile.extraSalaries?.taxRefund730 || 2290);

    // 2. Rilevamento 14ª Giugno reale
    let june14Amount = profile.extraSalaries?.fourteenthNetJune || 1848;
    (transactions || []).forEach((t) => {
      if (t.amount > 0) {
        const desc = (t.description + ' ' + (t.rawDescription || '')).toUpperCase();
        if (desc.includes('14ESIMA') || desc.includes('QUATTORDICESIMA')) {
          june14Amount = t.amount;
        } else if (t.amount > 3000 && t.date.includes('-07-') && (desc.includes('CLOUDFIRE') || desc.includes('COMPETENZE'))) {
          june14Amount = Math.max(0, t.amount - 1950);
        }
      }
    });

    // 3. Rilevamento 13ª Dicembre reale
    let dec13Amount = profile.extraSalaries?.thirteenthNetDec || 1850;
    (transactions || []).forEach((t) => {
      if (t.amount > 0 && t.date.includes('-12-')) {
        const desc = (t.description + ' ' + (t.rawDescription || '')).toUpperCase();
        if (desc.includes('13ESIMA') || desc.includes('TREDICESIMA') || desc.includes('MENS. AGG.')) {
          dec13Amount = t.amount;
        }
      }
    });

    return {
      june14: {
        amount: Math.round(june14Amount),
        label: '14ª Giugno',
      },
      tax730: {
        amount: Math.round(real730Amount),
        label: '730 (Luglio + Agosto)',
        detail: '1.580 € Luglio + 710 € Agosto',
      },
      dec13: {
        amount: Math.round(dec13Amount),
        label: '13ª Dicembre',
      },
      totalAnnualExtra: Math.round(june14Amount + real730Amount + dec13Amount),
    };
  }, [transactions, profile]);

  // Calcolo della capacità di risparmio reale mensile dalle transazioni del vault
  const savingsMetrics = useMemo(() => {
    // Raggruppa entrate e uscite per mese
    const monthlyData: Record<string, { income: number; expense: number }> = {};
    (transactions || []).forEach((t) => {
      const month = t.date.substring(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
      if (t.amount > 0) monthlyData[month].income += t.amount;
      else monthlyData[month].expense += Math.abs(t.amount);
    });

    const months = Object.keys(monthlyData);
    if (months.length === 0) {
      // Fallback sul profilo stipendiale
      const fallbackNet = profile.baseMonthlyNetSalary - 1500;
      return {
        avgMonthlyNetSavings: Math.max(200, fallbackNet),
        avgSavingsRatePct: 20,
        monthsCount: 0,
      };
    }

    let totalIncome = 0;
    let totalExpense = 0;
    months.forEach((m) => {
      totalIncome += monthlyData[m].income;
      totalExpense += monthlyData[m].expense;
    });

    const netSavings = totalIncome - totalExpense;
    const avgMonthlyNetSavings = months.length > 0 ? netSavings / months.length : 0;
    const avgSavingsRatePct = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
      avgMonthlyNetSavings: Math.round(avgMonthlyNetSavings),
      avgSavingsRatePct: Math.max(0, avgSavingsRatePct),
      monthsCount: months.length,
    };
  }, [transactions, profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !budget || budget <= 0) return;

    // Algoritmo di assorbimento multi-fonte con importi consuntivati reali da buste paga e transazioni
    const availableJune = extraLiquidity.june14.amount;
    const available730 = extraLiquidity.tax730.amount;
    const availableDec = extraLiquidity.dec13.amount;

    let allocJune = 0;
    let alloc730 = 0;
    let allocDec = 0;
    let remainingBudget = Number(budget);

    // Priorità 1: 14ª di Giugno (reale)
    if (remainingBudget > 0) {
      allocJune = Math.min(remainingBudget, availableJune);
      remainingBudget -= allocJune;
    }

    // Priorità 2: Rimborso 730 reale (Luglio + Agosto)
    if (remainingBudget > 0) {
      alloc730 = Math.min(remainingBudget, available730);
      remainingBudget -= alloc730;
    }

    // Priorità 3: 13ª di Dicembre (reale)
    if (remainingBudget > 0) {
      allocDec = Math.min(remainingBudget, availableDec);
      remainingBudget -= allocDec;
    }

    const newGoal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      title,
      targetAmount: Number(budget),
      targetDate,
      allocatedJuneExtra: allocJune,
      allocatedJuly730: alloc730,
      allocatedDecExtra: allocDec,
      notes,
    };

    onAddGoal(newGoal);
    setTitle('');
    setBudget('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header fuori dalla card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Budget & Goal Planner (Pianificazione Finanziaria & Grandi Progetti)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestione integrata tetti di spesa e assorbimento grandi progetti con importi consuntivati reali ({formatEuro(extraLiquidity.totalAnnualExtra)}/anno disponibili)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-xs py-1.5 px-2.5 font-mono">
            14ª Giugno: {formatEuro(extraLiquidity.june14.amount)}
          </Badge>
          <Badge variant="outline" className="border-sky-500/40 text-sky-400 bg-sky-500/10 text-xs py-1.5 px-2.5 font-mono">
            730 (Luglio + Agosto): {formatEuro(extraLiquidity.tax730.amount)}
          </Badge>
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs py-1.5 px-2.5 font-mono">
            13ª Dicembre: {formatEuro(extraLiquidity.dec13.amount)}
          </Badge>
        </div>
      </div>

      {/* Sub-Nav Switcher Segmentato */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        <Button
          variant={activeSection === 'goals' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('goals')}
          className="text-xs h-9 gap-2 rounded-lg font-medium"
        >
          <Target className="w-4 h-4" />
          <span>Obiettivi di Risparmio</span>
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 ml-0.5">
            {goals.length}
          </Badge>
        </Button>

        <Button
          variant={activeSection === 'budgets' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('budgets')}
          className="text-xs h-9 gap-2 rounded-lg font-medium"
        >
          <Coins className="w-4 h-4" />
          <span>Tetti di Spesa (BudgetCaps)</span>
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 ml-0.5">
            {Object.keys(budgetCaps).length}
          </Badge>
        </Button>
      </div>

      {/* Sotto-Sezione 1: Obiettivi di Risparmio */}
      {activeSection === 'goals' && (
        <div className="space-y-6">
          {/* Mini-Banner Strategico: Capacità di Risparmio Reale */}
          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Wallet className="w-5 h-5 text-primary shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-foreground">Capacità Reale di Risparmio Ordinario: </span>
            <strong className="text-primary font-mono text-sm">~{formatEuro(savingsMetrics.avgMonthlyNetSavings)}/mese</strong>
            <span className="text-muted-foreground ml-2">
              (Tasso di risparmio medio: <strong>{savingsMetrics.avgSavingsRatePct.toFixed(1)}%</strong> su {savingsMetrics.monthsCount} mesi)
            </span>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground italic sm:text-right">
          Gli obiettivi verificano dinamicamente la fattibilità contro questo surplus.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form to Add a New Goal */}
        <div className="lg:col-span-5">
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Plane className="w-4 h-4 text-primary" />
                Crea Nuovo Obiettivo di Risparmio
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Inserisci l'obiettivo per calcolare la copertura ottimale multi-fonte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Riga 1: Titolo */}
                <div className="space-y-1">
                  <Label htmlFor="goal-title" className="text-xs font-medium text-foreground">
                    Titolo Progetto / Viaggio <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="goal-title"
                    placeholder="es. Viaggio in Giappone 🇯🇵"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-background border-input text-foreground text-xs w-full h-10"
                    required
                  />
                </div>

                {/* Riga 2: Budget Previsto (€) e Mese Target (Scadenza) su una sola riga */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="goal-budget" className="text-xs font-medium text-foreground">
                      Budget Previsto (€) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="goal-budget"
                      type="number"
                      placeholder="4500"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value ? parseFloat(e.target.value) : '')}
                      className="bg-background border-input text-foreground text-xs font-mono w-full h-10"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-foreground">
                      Mese Target (Scadenza) <span className="text-destructive">*</span>
                    </Label>
                    <MonthTargetPicker
                      value={targetDate}
                      onChange={setTargetDate}
                    />
                  </div>
                </div>

                {/* Riga 3: Note */}
                <div className="space-y-1">
                  <Label htmlFor="goal-notes" className="text-xs font-medium text-foreground">Note di Pianificazione</Label>
                  <Input
                    id="goal-notes"
                    placeholder="es. Voli, hotel, pass treni..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-background border-input text-foreground text-xs w-full h-10"
                  />
                </div>

                {/* Riga 4: Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs py-2 h-10 mt-2"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Calcola Allocazione & Salva
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Goals List with Coverage Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            Obiettivi Attivi & Strategia di Copertura Dinamica
          </h3>

          {goals.length === 0 ? (
            <Card className="bg-card/50 border-border p-8 text-center text-muted-foreground text-xs">
              Nessun obiettivo impostato. Inserisci il tuo primo traguardo finanziario.
            </Card>
          ) : (
            goals.map((g) => {
              const totalExtraAllocated =
                (g.allocatedJuneExtra || 0) +
                (g.allocatedJuly730 || 0) +
                (g.allocatedDecExtra || 0);
              const remainingToFund = Math.max(0, g.targetAmount - totalExtraAllocated);
              const extraCoveragePct = Math.min(100, (totalExtraAllocated / g.targetAmount) * 100);

              // Calcolo mesi mancanti alla scadenza
              const [tYear, tMonth] = g.targetDate.split('-');
              const target = new Date(parseInt(tYear, 10), parseInt(tMonth, 10) - 1, 1);
              const now = new Date();
              const monthsDiff = Math.max(
                1,
                (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
              );
              const monthlyOrdinaryEffort = remainingToFund > 0 ? remainingToFund / monthsDiff : 0;

              // Feasibility Engine con confronto del cash flow reale
              const avgSavings = savingsMetrics.avgMonthlyNetSavings;
              let feasibilityStatus: 'covered' | 'sustainable' | 'demanding' | 'overbudget' = 'sustainable';
              let effortRatio = 0;
              let realisticMonths = monthsDiff;
              let realisticDateStr = '';

              if (remainingToFund === 0) {
                feasibilityStatus = 'covered';
              } else if (avgSavings <= 0) {
                feasibilityStatus = 'overbudget';
                realisticMonths = 999;
              } else {
                effortRatio = monthlyOrdinaryEffort / avgSavings;
                if (effortRatio <= 0.5) {
                  feasibilityStatus = 'sustainable';
                } else if (effortRatio <= 1.0) {
                  feasibilityStatus = 'demanding';
                } else {
                  feasibilityStatus = 'overbudget';
                  realisticMonths = Math.ceil(remainingToFund / avgSavings);
                  const estDate = new Date();
                  estDate.setMonth(estDate.getMonth() + realisticMonths);
                  realisticDateStr = estDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
                }
              }

              return (
                <Card key={g.id} className="bg-card border-border relative overflow-hidden shadow-xs">
                  <div className="absolute top-0 right-0 p-3">
                    <Tooltip content="Elimina obiettivo">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveGoal(g.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  </div>

                  <CardHeader className="pb-2 pr-10">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base text-foreground">{g.title}</CardTitle>
                      <Badge variant="outline" className="border-primary/40 text-primary text-[10px] capitalize">
                        Target: {formatTargetDateLabel(g.targetDate)} ({monthsDiff} mes{monthsDiff === 1 ? 'e' : 'i'})
                      </Badge>

                      {/* Badge Feasibility dinamico */}
                      {feasibilityStatus === 'covered' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Copertura 100% Extra
                        </span>
                      )}
                      {feasibilityStatus === 'sustainable' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Sostenibile ({Math.round(effortRatio * 100)}% risparmio/m)
                        </span>
                      )}
                      {feasibilityStatus === 'demanding' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                          Impegnativo ({Math.round(effortRatio * 100)}% risparmio/m)
                        </span>
                      )}
                      {feasibilityStatus === 'overbudget' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-destructive/15 text-destructive border border-destructive/30">
                          Rischio Squilibrio (&gt;100% surplus)
                        </span>
                      )}
                    </div>
                    <CardDescription className="text-xs text-muted-foreground">
                      Budget Totale: <span className="font-bold text-foreground font-mono">{formatEuro(g.targetAmount)}</span>
                      {g.notes && <span className="ml-2 text-muted-foreground">• {g.notes}</span>}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Barra di Copertura Proporzionale */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-foreground">
                        <span>Copertura con Entrate Straordinarie (14ª + 730 + 13ª):</span>
                        <span className="font-mono font-bold text-primary">
                          {formatEuro(totalExtraAllocated)} ({extraCoveragePct.toFixed(0)}%)
                        </span>
                      </div>
                      <Progress value={extraCoveragePct} className="h-2.5 bg-muted" />
                    </div>

                    {/* Breakdown pillole informative a 4 vie */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                      <div className="p-2.5 rounded-lg bg-background border border-border">
                        <span className="text-muted-foreground text-[11px] block">14ª di Giugno:</span>
                        <span className="font-semibold text-primary font-mono">
                          {formatEuro(g.allocatedJuneExtra || 0)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-background border border-border">
                        <span className="text-muted-foreground text-[11px] block">730 (Luglio + Agosto):</span>
                        <span className="font-semibold text-sky-400 font-mono">
                          {formatEuro(g.allocatedJuly730 || 0)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-background border border-border">
                        <span className="text-muted-foreground text-[11px] block">13ª di Dicembre:</span>
                        <span className="font-semibold text-emerald-400 font-mono">
                          {formatEuro(g.allocatedDecExtra || 0)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-background border border-border">
                        <span className="text-muted-foreground text-[11px] block">Sforzo Ordinario:</span>
                        <span className="font-semibold text-foreground font-mono">
                          {monthlyOrdinaryEffort > 0 ? `~${formatEuro(monthlyOrdinaryEffort)}/m` : '0 € / mese 🎉'}
                        </span>
                      </div>
                    </div>

                    {/* Proiezione Realistica o Avviso Copertura */}
                    {feasibilityStatus === 'covered' && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Copertura 100% garantita dalle mensilità straordinarie senza intaccare lo stipendio mensile!</span>
                      </div>
                    )}

                    {feasibilityStatus === 'overbudget' && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-500">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Pianificazione ambiziosa rispetto al cash flow reale</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-[11px]">
                          La quota ordinaria ({formatEuro(monthlyOrdinaryEffort)}/m) eccede la tua capacità media di risparmio mensile ({formatEuro(avgSavings)}/m).
                          {realisticDateStr && (
                            <>
                              {' '}Alla velocità attuale di risparmio, il traguardo sarà realisticamente completato a{' '}
                              <strong className="text-foreground capitalize">{realisticDateStr}</strong> (+{realisticMonths - monthsDiff} mesi rispetto alla data target).
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  )}

  {/* Sotto-Sezione 2: Tetti di Spesa (BudgetCaps) */}
  {activeSection === 'budgets' && (
    <BudgetCapManager
      transactions={transactions}
      budgetCaps={budgetCaps}
      onUpdateBudgetCaps={onUpdateBudgetCaps}
    />
  )}
</div>
);
};
