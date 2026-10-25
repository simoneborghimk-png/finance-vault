import React, { useState, useMemo } from 'react';
import { Transaction, UserFinancialProfile, MACRO_CATEGORY_LABELS } from '@/types/finance';
import {
  TrendingUp,
  Wallet,
  ShoppingBag,
  Home,
  PiggyBank,
  CheckCircle2,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Calendar,
  Scale,
  Layers,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  LabelList,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Switch, DateRangePicker } from './ui';
import { DateRange } from 'react-day-picker';
import { format, startOfYear } from 'date-fns';

interface ExecutiveDashboardProps {
  transactions: Transaction[];
  profile: UserFinancialProfile;
}

const CATEGORY_COLORS: Record<string, string> = {
  Needs: '#0ea5e9',        // Cyan / Sky
  Commitments: '#8b5cf6',  // Violet
  Wants: '#f59e0b',        // Amber
  Savings: '#10b981',      // Emerald
  Extraordinary: '#f43f5e',// Rose
};

const SPECIFIC_CATEGORY_COLORS: Record<string, string> = {
  'Casa, Arredo e Brico': '#f97316',        // Warm Orange
  'Spesa Alimentare': '#0ea5e9',            // Sky Blue
  'Rate Finanziamenti': '#8b5cf6',          // Violet / Purple
  'Utenze Luce e Gas': '#06b6d4',           // Cyan
  'Shopping e Abbigliamento': '#ec4899',    // Rose Pink
  'Ristorazione e Bar': '#eab308',          // Amber / Gold
  'Libri e Fumetti': '#10b981',             // Emerald
  'Gaming e Hobby': '#6366f1',              // Indigo
  'Salute e Farmacia': '#14b8a6',           // Teal
  'Fibra e Connettività': '#3b82f6',        // Blue
  'Animali e Veterinario': '#a855f7',       // Purple
  'Trasporti e Mobilità': '#f59e0b',        // Amber
  'Sport e Palestra': '#84cc16',            // Lime
  'Cura Personale': '#d946ef',              // Fuchsia
  'Eventi e Spettacoli': '#ef4444',         // Red
  'Ristrutturazione Casa': '#f43f5e',       // Crimson
};

const PALETTE_FALLBACKS = [
  '#0ea5e9', '#f97316', '#8b5cf6', '#10b981', '#ec4899',
  '#eab308', '#06b6d4', '#6366f1', '#14b8a6', '#f43f5e'
];

const formatEuro = (amount: number): string => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  transactions,
  profile,
}) => {
  // Filtering states (Isolated to this page)
  const [excludeExtraordinary, setExcludeExtraordinary] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    return { from: startOfYear(now), to: now };
  });

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (excludeExtraordinary) {
      result = result.filter((t) => !t.isExtraordinary && t.macroCategory !== 'Extraordinary');
    }
    if (dateRange?.from) {
      const fromIso = format(dateRange.from, 'yyyy-MM-dd');
      result = result.filter((t) => t.date >= fromIso);
    }
    if (dateRange?.to) {
      const toIso = format(dateRange.to, 'yyyy-MM-dd');
      result = result.filter((t) => t.date <= toIso);
    }
    return result;
  }, [transactions, excludeExtraordinary, dateRange]);

  // KPI Metrics & Timeline based strictly on filteredTransactions in the selected period
  const kpiMetrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    const monthsMap = new Map<string, { income: number; expenses: number }>();

    filteredTransactions.forEach((t) => {
      const ym = t.date.substring(0, 7);
      if (!monthsMap.has(ym)) {
        monthsMap.set(ym, { income: 0, expenses: 0 });
      }
      const m = monthsMap.get(ym)!;

      if (t.amount > 0) {
        totalIncome += t.amount;
        m.income += t.amount;
      } else {
        const absVal = Math.abs(t.amount);
        totalExpenses += absVal;
        m.expenses += absVal;
      }
    });

    const monthKeys = Array.from(monthsMap.keys()).sort();
    const numMonths = monthKeys.length || 1;
    const netSavings = totalIncome - totalExpenses;
    const realSavingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    const avgMonthlyExpense = totalExpenses / numMonths;
    const avgMonthlyIncome = totalIncome / numMonths;

    const timelineData = monthKeys.map((ym) => {
      const data = monthsMap.get(ym)!;
      const [year, month] = ym.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
      const label = dateObj.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
      return {
        month: label,
        rawYm: ym,
        Entrate: Math.round(data.income),
        Uscite: Math.round(data.expenses),
        CashFlow: Math.round(data.income - data.expenses),
      };
    });

    // 50/30/20 Rule Calculations
    let needsAndCommitments = 0;
    let wants = 0;
    let savings = 0;

    // Fixed vs Variable Classification
    const FIXED_CATEGORIES = new Set([
      'Rate Finanziamenti',
      'Utenze Luce e Gas',
      'Fibra e Connettività',
      'Casa, Arredo e Brico',
      'Acqua',
      'Assicurazioni',
      'Tasse e Imposte'
    ]);
    let fixedExpenses = 0;
    let variableExpenses = 0;

    filteredTransactions.forEach((t) => {
      if (t.amount < 0) {
        const absVal = Math.abs(t.amount);
        if (t.macroCategory === 'Needs' || t.macroCategory === 'Commitments') {
          needsAndCommitments += absVal;
        } else if (t.macroCategory === 'Wants') {
          wants += absVal;
        } else if (t.macroCategory === 'Savings') {
          savings += absVal;
        }

        if (t.macroCategory === 'Commitments' || FIXED_CATEGORIES.has(t.category)) {
          fixedExpenses += absVal;
        } else {
          variableExpenses += absVal;
        }
      }
    });

    const needsPct = totalIncome > 0 ? Math.round((needsAndCommitments / totalIncome) * 100) : 0;
    const wantsPct = totalIncome > 0 ? Math.round((wants / totalIncome) * 100) : 0;
    const totalSaved = Math.max(0, netSavings) + savings;
    const savingsPct = totalIncome > 0 ? Math.round((totalSaved / totalIncome) * 100) : 0;

    let healthStatus: { label: string; description: string; variant: 'success' | 'warning' | 'destructive' | 'default' } = {
      label: 'Equilibrato',
      description: 'Spese ed entrate in equilibrio sano',
      variant: 'default',
    };
    if (netSavings < 0) {
      healthStatus = {
        label: 'Disavanzo Periodo',
        description: 'Uscite superiori alle entrate',
        variant: 'destructive',
      };
    } else if (savingsPct >= 20 && needsPct <= 55) {
      healthStatus = {
        label: 'Virtuoso (50/30/20)',
        description: 'Obiettivo 20% risparmio centrato e bisogni sotto controllo',
        variant: 'success',
      };
    } else if (needsPct > 60) {
      healthStatus = {
        label: 'Costi Fissi Elevati',
        description: 'Bisogni e rate assorbono oltre il 60% delle entrate',
        variant: 'warning',
      };
    } else if (wantsPct > 35) {
      healthStatus = {
        label: 'Stile di Vita Alto',
        description: 'Spese discrezionali superiori al 35% del budget',
        variant: 'warning',
      };
    }

    let numDays = numMonths * 30;
    if (dateRange?.from && dateRange?.to) {
      const diffMs = dateRange.to.getTime() - dateRange.from.getTime();
      const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
      numDays = diffDays;
    }
    const dailyBurnRate = numDays > 0 ? Math.round((totalExpenses / numDays) * 10) / 10 : 0;
    const dailyIncome = numDays > 0 ? Math.round((totalIncome / numDays) * 10) / 10 : 0;
    const fixedPct = totalExpenses > 0 ? Math.round((fixedExpenses / totalExpenses) * 100) : 0;
    const variablePct = totalExpenses > 0 ? 100 - fixedPct : 0;
    const avgMonthlyVariable = numMonths > 0 ? Math.round(variableExpenses / numMonths) : 0;

    return {
      totalIncome: Math.round(totalIncome),
      totalExpenses: Math.round(totalExpenses),
      netSavings: Math.round(netSavings),
      realSavingsRate: realSavingsRate.toFixed(1),
      avgMonthlyExpense: Math.round(avgMonthlyExpense),
      avgMonthlyIncome: Math.round(avgMonthlyIncome),
      numMonths,
      timelineData,
      // Strategic Health Metrics
      needsAndCommitments: Math.round(needsAndCommitments),
      wants: Math.round(wants),
      totalSaved: Math.round(totalSaved),
      needsPct,
      wantsPct,
      savingsPct,
      healthStatus,
      fixedExpenses: Math.round(fixedExpenses),
      variableExpenses: Math.round(variableExpenses),
      fixedPct,
      variablePct,
      avgMonthlyVariable,
      numDays,
      dailyBurnRate,
      dailyIncome,
    };
  }, [filteredTransactions, dateRange]);

  // Donut chart breakdown
  const pieData = useMemo(() => {
    const macroTotals: Record<string, number> = {
      Needs: 0,
      Commitments: 0,
      Wants: 0,
      Savings: 0,
    };
    if (!excludeExtraordinary) {
      macroTotals.Extraordinary = 0;
    }

    filteredTransactions.forEach((t) => {
      if (t.amount < 0) {
        const cat = t.macroCategory;
        if (macroTotals[cat] !== undefined) {
          macroTotals[cat] += Math.abs(t.amount);
        }
      }
    });

    return Object.keys(macroTotals).map((key) => ({
      name: (MACRO_CATEGORY_LABELS as any)[key] || key,
      categoryKey: key,
      value: Math.round(macroTotals[key]),
      color: CATEGORY_COLORS[key] || '#94a3b8',
    })).filter(item => item.value > 0);
  }, [filteredTransactions, excludeExtraordinary]);

  const totalPieValue = useMemo(() => {
    return pieData.reduce((acc, item) => acc + item.value, 0);
  }, [pieData]);

  // Horizontal bar chart: category impact in filtered period
  const categoryBarData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    const categoryToMacro: Record<string, string> = {};

    filteredTransactions.forEach((t) => {
      if (t.amount < 0) {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
        if (!categoryToMacro[t.category]) {
          categoryToMacro[t.category] = t.macroCategory;
        }
      }
    });

    return Object.entries(categoryTotals)
      .map(([catName, total]) => {
        const macro = categoryToMacro[catName] || 'Needs';
        return {
          category: catName,
          macroCategory: macro,
          totalAmount: Math.round(total),
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 8) // Top 8 categories
      .map((item, index) => ({
        ...item,
        color: SPECIFIC_CATEGORY_COLORS[item.category] || PALETTE_FALLBACKS[index % PALETTE_FALLBACKS.length],
      }));
  }, [filteredTransactions]);

  const BarCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const macroLabel = (MACRO_CATEGORY_LABELS as any)[data.macroCategory] || data.macroCategory;
      return (
        <div className="bg-popover/95 border border-border shadow-xl backdrop-blur-md rounded-xl p-3 text-xs min-w-[200px]">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-border">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: data.color }} />
            <span className="font-semibold text-foreground truncate">{data.category}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-muted-foreground font-mono mb-1">
            <span className="text-[11px]">Totale Spesa:</span>
            <span className="text-foreground font-bold text-sm">{formatEuro(data.totalAmount)}</span>
          </div>
          <div className="text-[10px] text-muted-foreground pt-1 flex items-center justify-between">
            <span>Macro:</span>
            <span className="text-foreground font-medium">{macroLabel}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const DonutCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = totalPieValue > 0 ? ((data.value / totalPieValue) * 100).toFixed(1) : '0';
      return (
        <div className="bg-popover/95 border border-border shadow-xl backdrop-blur-md rounded-xl p-3 text-xs min-w-[180px]">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-border">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: data.color }} />
            <span className="font-semibold text-foreground truncate">{data.name}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-muted-foreground font-mono">
            <span className="text-[11px]">{pct}% del totale</span>
            <span className="text-foreground font-bold text-sm">{formatEuro(data.value)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Header fuori dalla card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Executive Dashboard & Cash Flow
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Analisi aggregata delle finanze personali basata sullo storico bancario
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-lg border border-border text-xs">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span className="text-foreground font-medium text-xs">Escludi Straordinarie</span>
            <Switch
              checked={excludeExtraordinary}
              onCheckedChange={setExcludeExtraordinary}
            />
          </div>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            defaultPreset="Anno in corso"
          />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Entrate Effettive */}
        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Entrate Effettive</span>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground mt-1">
              {formatEuro(kpiMetrics.totalIncome)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="flex items-center text-[11px] text-primary font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 shrink-0" />
              <span>
                {kpiMetrics.numMonths > 1
                  ? `Media ~${formatEuro(kpiMetrics.avgMonthlyIncome)} / mese`
                  : 'Incassate nel periodo'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Uscite Effettive */}
        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Uscite Effettive</span>
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground mt-1">
              {formatEuro(kpiMetrics.totalExpenses)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="flex items-center text-[11px] text-muted-foreground">
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 shrink-0 text-rose-400" />
              <span className="font-semibold text-rose-400 mr-1.5">
                {kpiMetrics.totalIncome > 0
                  ? `${((kpiMetrics.totalExpenses / kpiMetrics.totalIncome) * 100).toFixed(1)}%`
                  : '100%'}
              </span>
              <span>delle entrate</span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Risparmio Netto Reale */}
        <Card className="bg-card border-border relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-24 h-24 ${kpiMetrics.netSavings >= 0 ? 'bg-emerald-500/5' : 'bg-rose-500/5'} rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none`} />
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Risparmio Netto Reale</span>
              <div className={`p-1.5 rounded-lg ${kpiMetrics.netSavings >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className={`text-2xl font-bold mt-1 ${kpiMetrics.netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {kpiMetrics.netSavings >= 0 ? '+' : ''}{formatEuro(kpiMetrics.netSavings)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className={`flex items-center text-[11px] font-medium ${kpiMetrics.netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span>
                {kpiMetrics.netSavings >= 0 ? 'Surplus netto generato' : 'Disavanzo nel periodo'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 4. Tasso Risparmio Reale */}
        <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/30 relative overflow-hidden">
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary">Tasso Risparmio Reale</span>
              <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground mt-1">
              {kpiMetrics.realSavingsRate}%
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="text-[11px] text-primary/90 leading-tight">
              {Number(kpiMetrics.realSavingsRate) >= 0
                ? 'Delle entrate effettive accantonate'
                : 'Spese superiori alle entrate'}
            </div>
          </CardContent>
        </Card>

        {/* 5. Spesa Media Mensile */}
        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Spesa Media Mensile</span>
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground mt-1">
              ~{formatEuro(kpiMetrics.avgMonthlyExpense)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="flex items-center text-[11px] text-muted-foreground">
              <span>
                Ponderata su {kpiMetrics.numMonths} {kpiMetrics.numMonths === 1 ? 'mese attivo' : 'mesi attivi'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Insights Grid: 50/30/20, Fixed vs Variable, Runway & Burn Rate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Regola 50/30/20 */}
        <Card className="bg-card border-border relative overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Scale className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-foreground">Regola 50 / 30 / 20</span>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0.5 font-medium ${
                  kpiMetrics.healthStatus.variant === 'success'
                    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                    : kpiMetrics.healthStatus.variant === 'warning'
                    ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                    : kpiMetrics.healthStatus.variant === 'destructive'
                    ? 'border-rose-500/40 text-rose-400 bg-rose-500/10'
                    : 'border-primary/40 text-primary bg-primary/10'
                }`}
              >
                {kpiMetrics.healthStatus.label}
              </Badge>
            </div>
            <CardDescription className="text-[11px] text-muted-foreground mt-1">
              Confronto modello ideale vs ripartizione effettiva sulle entrate
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1 space-y-2.5">
            {/* Needs bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
                  Bisogni & Rate (Target 50%)
                </span>
                <span className="font-semibold text-foreground">
                  {kpiMetrics.needsPct}% <span className="text-[10px] text-muted-foreground font-normal">({formatEuro(kpiMetrics.needsAndCommitments)})</span>
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#0ea5e9] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, kpiMetrics.needsPct)}%` }}
                />
              </div>
            </div>

            {/* Wants bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                  Stile di Vita (Target 30%)
                </span>
                <span className="font-semibold text-foreground">
                  {kpiMetrics.wantsPct}% <span className="text-[10px] text-muted-foreground font-normal">({formatEuro(kpiMetrics.wants)})</span>
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#f59e0b] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, kpiMetrics.wantsPct)}%` }}
                />
              </div>
            </div>

            {/* Savings bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                  Risparmio Netto (Target 20%)
                </span>
                <span className="font-semibold text-emerald-400">
                  {kpiMetrics.savingsPct}% <span className="text-[10px] text-muted-foreground font-normal">({formatEuro(kpiMetrics.totalSaved)})</span>
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#10b981] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, kpiMetrics.savingsPct)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Costi Fissi vs Variabili Comprimibili */}
        <Card className="bg-card border-border relative overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-foreground">Fissi vs Comprimibili</span>
              </div>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-border text-muted-foreground">
                Flessibilità Budget
              </Badge>
            </div>
            <CardDescription className="text-[11px] text-muted-foreground mt-1">
              Spese contrattuali non comprimibili vs uscite discrezionali
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1 space-y-3">
            {/* Visual ratio bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-muted rounded-full h-3 flex overflow-hidden">
                <div
                  className="bg-purple-500 h-3 transition-all duration-500"
                  style={{ width: `${kpiMetrics.fixedPct}%` }}
                />
                <div
                  className="bg-amber-500 h-3 transition-all duration-500"
                  style={{ width: `${kpiMetrics.variablePct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Fissi {kpiMetrics.fixedPct}% ({formatEuro(kpiMetrics.fixedExpenses)})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Variabili {kpiMetrics.variablePct}% ({formatEuro(kpiMetrics.variableExpenses)})
                </span>
              </div>
            </div>

            {/* Savings Buffer Insight */}
            <div className="p-2.5 rounded-lg bg-background border border-border/80 flex items-start gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">
                  ~{formatEuro(kpiMetrics.avgMonthlyVariable)} / mese comprimibili
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Margine di taglio immediato in caso di emergenza senza intaccare contratti o rate.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Burn Rate & Ritmo di Spesa */}
        <Card className="bg-card border-border relative overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                  <Flame className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-foreground">Burn Rate & Ritmo</span>
              </div>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-border text-muted-foreground">
                {kpiMetrics.numDays} Giorni
              </Badge>
            </div>
            <CardDescription className="text-[11px] text-muted-foreground mt-1">
              Velocità di consumo del capitale e cassa giornaliera
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-background border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Uscita Media</p>
                <p className="text-lg font-bold text-rose-400 mt-0.5">
                  {formatEuro(kpiMetrics.dailyBurnRate)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">al giorno</p>
              </div>
              <div className="p-2.5 rounded-lg bg-background border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Entrata Media</p>
                <p className="text-lg font-bold text-primary mt-0.5">
                  {formatEuro(kpiMetrics.dailyIncome)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">al giorno</p>
              </div>
            </div>

            {/* Daily Net Flow */}
            <div className="p-2.5 rounded-lg bg-background border border-border/80 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Differenziale netto giornaliero:</span>
              <span className={`font-bold font-mono ${kpiMetrics.dailyIncome - kpiMetrics.dailyBurnRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {kpiMetrics.dailyIncome - kpiMetrics.dailyBurnRate >= 0 ? '+' : ''}
                {formatEuro(kpiMetrics.dailyIncome - kpiMetrics.dailyBurnRate)} / dì
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts: Donut + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart: Macro Categories */}
        <Card className="lg:col-span-5 bg-card border-border flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Spaccato per Macro-Categoria
            </CardTitle>
            <p className="text-xs text-muted-foreground">Distribuzione delle uscite nel periodo selezionato</p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="relative h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--card)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutCustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Central KPI Metric in Donut Hole */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Totale Spese</span>
                <span className="text-base font-bold text-foreground font-mono">{formatEuro(totalPieValue)}</span>
              </div>
            </div>

            {/* Custom Enriched Legend */}
            <div className="space-y-1.5 pt-3 border-t border-border mt-1">
              {pieData.map((item) => {
                const pct = totalPieValue > 0 ? ((item.value / totalPieValue) * 100).toFixed(1) : '0';
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs py-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate text-foreground font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 font-mono text-[11px]">
                      <span className="text-muted-foreground">{pct}%</span>
                      <span className="text-foreground font-semibold">{formatEuro(item.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Horizontal Bar Chart: Category Impact in Period */}
        <Card className="lg:col-span-7 bg-card border-border flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Spesa per Categoria Principale
            </CardTitle>
            <p className="text-xs text-muted-foreground">Principali voci di costo nel periodo selezionato</p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center px-4 pb-4 pt-1">
            <div className="h-[310px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryBarData}
                  layout="vertical"
                  margin={{ top: 8, right: 65, left: 10, bottom: 0 }}
                  barSize={18}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" tickFormatter={(v) => `${v} €`} fontSize={11} />
                  <YAxis type="category" dataKey="category" stroke="var(--foreground)" fontSize={11} width={160} tickLine={false} />
                  <Tooltip content={<BarCustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.15 }} />
                  <Bar dataKey="totalAmount" radius={[0, 6, 6, 0]}>
                    {categoryBarData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                    <LabelList dataKey="totalAmount" position="right" formatter={(v: any) => `${v} €`} className="text-[11px] fill-foreground font-mono font-medium" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Area Timeline in Period */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Trend Entrate vs Uscite
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Andamento dei flussi di cassa e liquidità nel periodo selezionato
              </p>
            </div>
            {excludeExtraordinary && (
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 text-xs">
                Spese straordinarie escluse
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpiMetrics.timelineData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `${v} €`} />
                <Tooltip
                  formatter={(val: any, name: any) => [formatEuro(Number(val)), name]}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--card-foreground)', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="Entrate" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="Uscite" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
