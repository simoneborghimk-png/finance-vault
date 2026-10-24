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
  CreditCard
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
  Area
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, Badge, Switch, DateRangePicker } from './ui';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { BudgetCapManager } from './BudgetCapManager';

interface ExecutiveDashboardProps {
  transactions: Transaction[];
  profile: UserFinancialProfile;
  budgetCaps?: Record<string, number>;
  onUpdateBudgetCaps?: (caps: Record<string, number>) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Needs: '#0ea5e9',        // Cyan / Sky
  Commitments: '#8b5cf6',  // Violet
  Wants: '#f59e0b',        // Amber
  Savings: '#10b981',      // Emerald
  Extraordinary: '#f43f5e',// Rose
};

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
  budgetCaps,
  onUpdateBudgetCaps,
}) => {
  const [excludeExtraordinary, setExcludeExtraordinary] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

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

  // Monthly Aggregations
  const monthlyMetrics = useMemo(() => {
    // Group transactions by YYYY-MM
    const monthsMap = new Map<string, { income: number; expenses: number; needs: number; wants: number; commitments: number; extraordinary: number }>();

    filteredTransactions.forEach((t) => {
      const ym = t.date.substring(0, 7);
      if (!monthsMap.has(ym)) {
        monthsMap.set(ym, { income: 0, expenses: 0, needs: 0, wants: 0, commitments: 0, extraordinary: 0 });
      }
      const data = monthsMap.get(ym)!;
      if (t.amount > 0) {
        data.income += t.amount;
      } else {
        const absVal = Math.abs(t.amount);
        data.expenses += absVal;
        if (t.macroCategory === 'Needs') data.needs += absVal;
        else if (t.macroCategory === 'Wants') data.wants += absVal;
        else if (t.macroCategory === 'Commitments') data.commitments += absVal;
        else if (t.macroCategory === 'Extraordinary') data.extraordinary += absVal;
      }
    });

    const monthKeys = Array.from(monthsMap.keys()).sort();
    const count = monthKeys.length || 1;

    let totalNeeds = 0;
    let totalWants = 0;
    let totalCommitments = 0;
    let totalExtraordinary = 0;
    let totalExpenses = 0;

    monthKeys.forEach((k) => {
      const m = monthsMap.get(k)!;
      totalNeeds += m.needs;
      totalWants += m.wants;
      totalCommitments += m.commitments;
      totalExtraordinary += m.extraordinary;
      totalExpenses += m.expenses;
    });

    const avgNeeds = totalNeeds / count;
    const avgWants = totalWants / count;
    const avgCommitments = totalCommitments / count;
    const avgExtraordinary = totalExtraordinary / count;

    // Ordinary baseline metrics
    const baseSalary = profile.baseMonthlyNetSalary; // 1953
    const ordinaryNeeds = avgNeeds; // ~857
    const ordinaryWants = avgWants; // ~790
    const ordinaryResidue = baseSalary - (ordinaryNeeds + ordinaryWants); // ~306

    // Annualized calculation:
    // Extra income per year = 14th (~1848) + 13th (~1850) + 730 (~1500) = ~5198 €
    const annualExtraIncome = profile.extraSalaries.fourteenthNetJune + profile.extraSalaries.thirteenthNetDec + 1500;
    const annualTotalIncome = baseSalary * 12 + annualExtraIncome;
    const annualOrdinarySavings = ordinaryResidue * 12;
    const effectiveAnnualSavings = annualOrdinarySavings + annualExtraIncome;
    const effectiveSavingsRate = (effectiveAnnualSavings / annualTotalIncome) * 100;

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

    return {
      baseSalary,
      avgNeeds: Math.round(avgNeeds),
      avgWants: Math.round(avgWants),
      avgCommitments: Math.round(avgCommitments),
      avgExtraordinary: Math.round(avgExtraordinary),
      ordinaryResidue: Math.round(ordinaryResidue),
      effectiveSavingsRate: effectiveSavingsRate.toFixed(1),
      timelineData,
      totalExpenses,
    };
  }, [filteredTransactions, profile]);

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

  // Horizontal bar chart: category impact (€ / mese)
  const categoryBarData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    const monthsSet = new Set<string>();

    filteredTransactions.forEach((t) => {
      if (t.amount < 0) {
        monthsSet.add(t.date.substring(0, 7));
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
      }
    });

    const numMonths = monthsSet.size || 1;

    return Object.entries(categoryTotals)
      .map(([catName, total]) => ({
        category: catName,
        monthlyAvg: Math.round(total / numMonths),
      }))
      .sort((a, b) => b.monthlyAvg - a.monthlyAvg)
      .slice(0, 8); // Top 8 categories
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      {/* Top Bar with Filter Toggle & DateRangePicker */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Executive Dashboard & Cash Flow
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Analisi aggregata delle finanze personali basata sullo storico bancario
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          <div className="flex items-center gap-3 bg-background px-3.5 py-2 rounded-lg border border-border">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-xs text-foreground font-medium">Escludi Spese Straordinarie</span>
            <Switch
              checked={excludeExtraordinary}
              onCheckedChange={setExcludeExtraordinary}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Entrate Base */}
        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Entrate Base Ordinarie</span>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground mt-1">
              {formatEuro(monthlyMetrics.baseSalary)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="flex items-center text-[11px] text-primary font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              <span>Stipendio mensile netto</span>
            </div>
          </CardContent>
        </Card>

        {/* Costi Fissi (Needs) */}
        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Bisogni Primari & Casa</span>
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                <Home className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground mt-1">
              ~{formatEuro(monthlyMetrics.avgNeeds)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="flex items-center text-[11px] text-muted-foreground">
              <span className="font-semibold text-sky-400 mr-1.5">
                {((monthlyMetrics.avgNeeds / monthlyMetrics.baseSalary) * 100).toFixed(1)}%
              </span>
              <span>dello stipendio base</span>
            </div>
          </CardContent>
        </Card>

        {/* Stile di Vita (Wants) */}
        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Stile di Vita & Shopping</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground mt-1">
              ~{formatEuro(monthlyMetrics.avgWants)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="flex items-center text-[11px] text-muted-foreground">
              <span className="font-semibold text-amber-400 mr-1.5">
                {((monthlyMetrics.avgWants / monthlyMetrics.baseSalary) * 100).toFixed(1)}%
              </span>
              <span>dello stipendio base</span>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Residuo */}
        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Cash Flow Ordinario</span>
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground mt-1">
              ~{formatEuro(monthlyMetrics.ordinaryResidue)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="flex items-center text-[11px] text-teal-400 font-medium">
              <span className="font-semibold mr-1.5">
                {((monthlyMetrics.ordinaryResidue / monthlyMetrics.baseSalary) * 100).toFixed(1)}%
              </span>
              <span>margine mensile libero</span>
            </div>
          </CardContent>
        </Card>

        {/* Tasso Risparmio Annualizzato */}
        <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/30 relative overflow-hidden">
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary">Tasso Risparmio Effettivo</span>
              <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground mt-1">
              &gt; {monthlyMetrics.effectiveSavingsRate}%
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="text-[11px] text-primary/90 leading-tight">
              Integrando 13ª, 14ª (~3.700 €) e rimborsi 730
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts: Donut + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart: Macro Categories */}
        <Card className="lg:col-span-5 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Spaccato Percentuale per Macro-Categoria
            </CardTitle>
            <p className="text-xs text-muted-foreground">Distribuzione proporzionale delle uscite complessive</p>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--card)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatEuro(Number(val)), 'Totale']}
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--card-foreground)', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Horizontal Bar Chart: Monthly Impact */}
        <Card className="lg:col-span-7 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Impatto Medio Mensile per Categoria Principale
            </CardTitle>
            <p className="text-xs text-muted-foreground">Top voci di costo ricorrenti ponderate su base mensile (€/mese)</p>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryBarData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" tickFormatter={(v) => `${v} €`} fontSize={11} />
                  <YAxis type="category" dataKey="category" stroke="var(--foreground)" fontSize={11} width={95} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [formatEuro(Number(val)), 'Media Mensile']}
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--card-foreground)', fontSize: '12px' }}
                  />
                  <Bar dataKey="monthlyAvg" fill="var(--info)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Caps & Monthly Thresholds Monitoring */}
      <BudgetCapManager
        transactions={filteredTransactions}
        budgetCaps={budgetCaps}
        onUpdateBudgetCaps={onUpdateBudgetCaps}
      />

      {/* Historical 12-Month Area Timeline */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Trend Storico Entrate vs Uscite (12 Mesi)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Monitoraggio della traiettoria di liquidità mensile e surplus accumulato
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
              <AreaChart data={monthlyMetrics.timelineData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
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
