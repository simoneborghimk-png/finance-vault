import React, { useState, useMemo } from 'react';
import {
  Transaction,
  RecurringExpense,
  RecurringExpenseType,
  RecurringOverride,
  RecurringPricingModel,
  HistoricalAmountPoint,
} from '@/types/finance';
import { detectRecurringExpenses } from '@/lib/recurringDetector';
import {
  Repeat,
  Tv,
  CreditCard,
  Zap,
  Heart,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  EyeOff,
  Eye,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Flame,
  Droplets,
  ArrowDown,
  ArrowUp,
  BarChart3,
  X,
  RotateCcw,
  SlidersHorizontal,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Button,
  Badge,
  Input,
} from './ui';
import { DateRangePicker } from './ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format, startOfYear } from 'date-fns';

interface RecurringTrackerProps {
  transactions: Transaction[];
  overrides?: Record<string, RecurringOverride>;
  onUpdateOverrides?: (overrides: Record<string, RecurringOverride>) => void;
  onSaveOverride?: (id: string, override: RecurringOverride) => void;
}

const TYPE_CONFIG: Record<
  RecurringExpenseType,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  subscription: {
    label: 'Canoni Flat & Streaming',
    icon: Tv,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
  },
  loan: {
    label: 'Rate & Finanziamenti',
    icon: CreditCard,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  utility: {
    label: 'Utenze & Connettività',
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  donation: {
    label: 'Donazioni Periodiche',
    icon: Heart,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
  other: {
    label: 'Altro Costo Ricorrente',
    icon: Repeat,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
};

const FREQUENCY_LABELS: Record<string, string> = {
  monthly: 'Mensile',
  bimonthly: 'Bimestrale',
  quarterly: 'Trimestrale',
  annual: 'Annuale',
};

export const RecurringTracker: React.FC<RecurringTrackerProps> = ({
  transactions,
  overrides = {},
  onUpdateOverrides,
  onSaveOverride,
}) => {
  // Filter and view states
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFrequency, setSelectedFrequency] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'nextBilling' | 'amountDesc' | 'amountAsc' | 'periodSpent' | 'name'>('nextBilling');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    return { from: startOfYear(now), to: now };
  });

  const [visibleSeries, setVisibleSeries] = useState({
    luce: true,
    gas: true,
    acqua: true,
    tari: true,
  });

  const toggleSeries = (key: 'luce' | 'gas' | 'acqua' | 'tari') => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedStatus !== 'all' ||
    selectedChannel !== 'all' ||
    selectedType !== 'all' ||
    selectedFrequency !== 'all' ||
    sortBy !== 'nextBilling';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedChannel('all');
    setSelectedType('all');
    setSelectedFrequency('all');
    setSortBy('nextBilling');
  };

  const formatEuro = (val: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(val);

  const formatDate = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [y, m, d] = dateStr.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatMonthShort = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [y, m, d] = dateStr.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return date.toLocaleDateString('it-IT', { month: 'short' });
  };

  // Esecuzione dell'algoritmo euristico deterministico su tutte le transazioni
  const allDetected = useMemo(() => {
    return detectRecurringExpenses(transactions, overrides);
  }, [transactions, overrides]);

  const fromIso = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const toIso = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

  // Calcolo dati periodo arricchiti su ciascuna voce ricorrente
  const enhancedDetected = useMemo(() => {
    return allDetected.map((item) => {
      const inPeriodPoints = (item.historicalTrend || []).filter((pt: HistoricalAmountPoint) => {
        if (fromIso && pt.date < fromIso) return false;
        if (toIso && pt.date > toIso) return false;
        return true;
      });
      const periodSpent = inPeriodPoints.reduce((acc, pt) => acc + pt.amount, 0);
      const periodCount = inPeriodPoints.length;
      return {
        ...item,
        periodSpent,
        periodCount,
        inPeriodPoints,
      };
    });
  }, [allDetected, fromIso, toIso]);

  // Metriche Esecutive KPI
  const kpi = useMemo(() => {
    const activeItems = enhancedDetected.filter((item) => !item.isIgnored && item.isActive && !item.isPaused && !item.isCancelled);

    // Totale mensile normalizzato: per i contratti flat si usa il canone vigente (lastAmount), per le utenze la media (averageAmount)
    const monthlyTotal = activeItems.reduce((acc, item) => {
      const amt = item.pricingModel === 'flat' ? item.lastAmount : item.averageAmount;
      const perMonth =
        item.frequency === 'monthly'
          ? amt
          : item.frequency === 'bimonthly'
          ? amt / 2
          : item.frequency === 'quarterly'
          ? amt / 3
          : amt / 12;
      return acc + perMonth;
    }, 0);

    const flatMonthlyTotal = activeItems
      .filter((i) => i.pricingModel === 'flat')
      .reduce((acc, item) => {
        const perMonth =
          item.frequency === 'monthly'
            ? item.lastAmount
            : item.frequency === 'annual'
            ? item.lastAmount / 12
            : item.lastAmount / 3;
        return acc + perMonth;
      }, 0);

    const utilityMonthlyTotal = activeItems
      .filter((i) => i.pricingModel === 'variable_utility')
      .reduce((acc, item) => {
        const perMonth =
          item.frequency === 'monthly'
            ? item.averageAmount
            : item.frequency === 'quarterly'
            ? item.averageAmount / 3
            : item.averageAmount / 12;
        return acc + perMonth;
      }, 0);

    const loanMonthlyTotal = activeItems
      .filter((i) => i.pricingModel === 'loan')
      .reduce((acc, item) => acc + item.lastAmount, 0);

    const annualTotal = activeItems.reduce((acc, item) => acc + item.annualCost, 0);

    // Identifica la voce attiva con il rinnovo più vicino (giorni >= 0)
    const upcoming = [...activeItems]
      .filter((i) => i.daysUntilNext >= 0)
      .sort((a, b) => a.daysUntilNext - b.daysUntilNext)[0];

    const activeLoans = activeItems.filter((i) => i.type === 'loan' && !i.loanDetails?.isClosed);
    const totalRemainingDebt = activeLoans.reduce((acc, i) => acc + (i.loanDetails?.remainingDebt || 0), 0);
    const countActiveLoans = activeLoans.length;

    // Monitor Rimodulazioni contrattuali e variazioni tariffarie (aumenti vs riduzioni)
    const itemsWithPriceChanges = enhancedDetected.filter((i) => i.priceChanges && i.priceChanges.length > 0);
    const totalMonthlyIncreases = itemsWithPriceChanges.reduce((acc, i) => {
      const delta = (i.priceChanges || []).reduce((dAcc, pc) => dAcc + (pc.delta > 0 ? pc.delta : 0), 0);
      return acc + delta;
    }, 0);
    const totalMonthlyDecreases = itemsWithPriceChanges.reduce((acc, i) => {
      const delta = (i.priceChanges || []).reduce((dAcc, pc) => dAcc + (pc.delta < 0 ? Math.abs(pc.delta) : 0), 0);
      return acc + delta;
    }, 0);
    const netMonthlyPriceChange = totalMonthlyIncreases - totalMonthlyDecreases;

    // Utenze a consumo variabile attive
    const variableUtilities = enhancedDetected.filter(
      (i) => i.pricingModel === 'variable_utility' && !i.isIgnored && i.isActive
    );

    // Calcolo spesa reale consuntivata nel periodo selezionato
    const totalSpentInPeriod = enhancedDetected.reduce((acc, item) => acc + item.periodSpent, 0);
    const totalLoanPaidInPeriod = enhancedDetected
      .filter((i) => i.type === 'loan')
      .reduce((acc, item) => acc + item.periodSpent, 0);

    return {
      activeCount: activeItems.length,
      monthlyTotal,
      flatMonthlyTotal,
      utilityMonthlyTotal,
      loanMonthlyTotal,
      annualTotal,
      totalRemainingDebt,
      countActiveLoans,
      upcoming,
      itemsWithPriceChanges,
      totalMonthlyIncreases,
      totalMonthlyDecreases,
      netMonthlyPriceChange,
      variableUtilities,
      totalSpentInPeriod,
      totalLoanPaidInPeriod,
    };
  }, [enhancedDetected]);

  // Dati mensili per il Grafico a Linee delle Utenze
  const monthlyUtilitiesChartData = useMemo(() => {
    const monthsMap = new Map<string, { month: string; rawYm: string; luce?: number; gas?: number; acqua?: number; tari?: number }>();

    enhancedDetected.forEach((item) => {
      let key: 'luce' | 'gas' | 'acqua' | 'tari' | null = null;
      if (item.id === 'iren-luce') key = 'luce';
      else if (item.id === 'iren-gas') key = 'gas';
      else if (item.id.includes('arca')) key = 'acqua';
      else if (item.id === 'iren-ambiente') key = 'tari';

      if (!key) return;

      item.inPeriodPoints.forEach((pt) => {
        const ym = pt.date.substring(0, 7);
        if (!monthsMap.has(ym)) {
          const [year, month] = ym.split('-');
          const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
          const label = d.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
          monthsMap.set(ym, { month: label, rawYm: ym });
        }
        const data = monthsMap.get(ym)!;
        data[key!] = pt.amount;
      });
    });

    return Array.from(monthsMap.values()).sort((a, b) => a.rawYm.localeCompare(b.rawYm));
  }, [enhancedDetected]);

  // Filtraggio dinamico avanzato
  const filteredItems = useMemo(() => {
    return enhancedDetected
      .filter((item) => {
        // Filtro Stato Contratto
        if (selectedStatus === 'active') {
          if (!item.isActive || item.isPaused || item.isCancelled || item.isIgnored) return false;
        } else if (selectedStatus === 'inactive') {
          if (item.isActive && !item.isPaused && !item.isCancelled && !item.isIgnored) return false;
        } else if (selectedStatus === 'loans_active') {
          if (item.type !== 'loan' || item.loanDetails?.isClosed) return false;
        } else if (selectedStatus === 'loans_closed') {
          if (item.type !== 'loan' || !item.loanDetails?.isClosed) return false;
        } else if (selectedStatus === 'all') {
          if (item.isIgnored) return false;
        }

        // Filtro Canale
        if (selectedChannel !== 'all') {
          const itemChannels = item.channels || [item.channel];
          if (!itemChannels.includes(selectedChannel as any)) return false;
        }

        // Filtro Tipologia / Modello
        if (selectedType !== 'all') {
          if (selectedType === 'variable_utility' && item.pricingModel !== 'variable_utility') return false;
          if (selectedType === 'flat' && item.pricingModel !== 'flat') return false;
          if (selectedType === 'subscription' && (item.type !== 'subscription' || item.pricingModel === 'variable_utility')) return false;
          if (selectedType === 'loan' && item.type !== 'loan') return false;
          if (selectedType === 'donation' && item.type !== 'donation') return false;
        }

        // Filtro Frequenza
        if (selectedFrequency !== 'all' && item.frequency !== selectedFrequency) return false;

        // Filtro ricerca testuale
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = item.name.toLowerCase().includes(q);
          const matchesCat = item.category.toLowerCase().includes(q);
          const matchesChannel = (item.channels || [item.channel]).some((c) => c.toLowerCase().includes(q));
          if (!matchesName && !matchesCat && !matchesChannel) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'nextBilling') {
          const aDays = a.daysUntilNext >= 0 ? a.daysUntilNext : 9999;
          const bDays = b.daysUntilNext >= 0 ? b.daysUntilNext : 9999;
          return aDays - bDays;
        }
        if (sortBy === 'amountDesc') {
          const aAmt = a.pricingModel === 'flat' ? a.lastAmount : a.averageAmount;
          const bAmt = b.pricingModel === 'flat' ? b.lastAmount : b.averageAmount;
          return bAmt - aAmt;
        }
        if (sortBy === 'amountAsc') {
          const aAmt = a.pricingModel === 'flat' ? a.lastAmount : a.averageAmount;
          const bAmt = b.pricingModel === 'flat' ? b.lastAmount : b.averageAmount;
          return aAmt - bAmt;
        }
        if (sortBy === 'periodSpent') {
          return b.periodSpent - a.periodSpent;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [enhancedDetected, selectedStatus, selectedChannel, selectedType, selectedFrequency, sortBy, searchQuery]);

  // Toggle ignore / restore
  const handleToggleIgnore = (id: string, currentIgnored?: boolean) => {
    const current = overrides[id] || {};
    const updatedSingle: RecurringOverride = {
      ...current,
      ignored: !currentIgnored,
    };
    if (onSaveOverride) {
      onSaveOverride(id, updatedSingle);
    } else if (onUpdateOverrides) {
      onUpdateOverrides({
        ...overrides,
        [id]: updatedSingle,
      });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Tooltip custom per il grafico a linee delle utenze
  const UtilityCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover/95 border border-border shadow-xl backdrop-blur-md rounded-xl p-3 text-xs min-w-[190px] space-y-1.5">
          <div className="font-semibold text-foreground pb-1.5 border-b border-border text-[11px] flex items-center justify-between">
            <span>Bollette del mese</span>
            <span className="font-mono text-primary font-bold">{label}</span>
          </div>
          {payload.map((entry: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-3 font-mono text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.stroke || entry.color }} />
                <span className="text-muted-foreground">{entry.name}:</span>
              </div>
              <span className="font-bold text-foreground">{formatEuro(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Header fuori dalla card: solo Titolo a sinistra e DateRangePicker a destra */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Repeat className="w-5 h-5 text-primary" />
            Costi Fissi, Utenze & Abbonamenti
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestione analitica di canoni flat, utenze a consumo con scostamento vs media storica e rateizzazioni ad ammortamento
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            defaultPreset="Anno in corso"
          />
        </div>
      </div>

      {/* 1. Cruscotto KPI Esecutivi: Stile Unificato con TransactionsManager & ExecutiveDashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Spesa Ricorrenti nel Periodo */}
        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Spesa Ricorrenti nel Periodo</span>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Repeat className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold font-mono tracking-tight text-foreground mt-1">
              {formatEuro(kpi.totalSpentInPeriod)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <p className="text-[11px] text-muted-foreground truncate">
              A regime: ~{formatEuro(kpi.monthlyTotal)}/m (Flat {formatEuro(kpi.flatMonthlyTotal)} • Utenze ~{formatEuro(kpi.utilityMonthlyTotal)} • Rate {formatEuro(kpi.loanMonthlyTotal)})
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Debito Residuo Prestiti */}
        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Debito Residuo Prestiti</span>
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold font-mono tracking-tight text-foreground mt-1">
              {formatEuro(kpi.totalRemainingDebt)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <p className="text-[11px] text-muted-foreground">
              {formatEuro(kpi.totalLoanPaidInPeriod)} rate pagate nel periodo • {kpi.countActiveLoans} finanziamenti attivi
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Variazioni Tariffarie & Rimodulazioni */}
        <Card className="bg-card border-border relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-24 h-24 ${kpi.netMonthlyPriceChange > 0 ? 'bg-amber-500/5' : 'bg-emerald-500/5'} rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none`} />
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Variazioni Tariffarie</span>
              <div className={`p-1.5 rounded-lg ${kpi.netMonthlyPriceChange > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                {kpi.netMonthlyPriceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
            </div>
            <CardTitle className={`text-2xl font-bold font-mono tracking-tight mt-1 ${kpi.netMonthlyPriceChange > 0 ? 'text-amber-300' : kpi.netMonthlyPriceChange < 0 ? 'text-emerald-400' : 'text-foreground'}`}>
              {kpi.netMonthlyPriceChange > 0 ? `+${formatEuro(kpi.netMonthlyPriceChange)}` : kpi.netMonthlyPriceChange < 0 ? `-${formatEuro(Math.abs(kpi.netMonthlyPriceChange))}` : '0,00 €'}
              <span className="text-xs font-normal text-muted-foreground ml-1">/mese netto</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <p className="text-[11px] text-muted-foreground truncate">
              +{formatEuro(kpi.totalMonthlyIncreases)} rincari (TIM, YouTube) • -{formatEuro(kpi.totalMonthlyDecreases)} risparmi (Game Pass)
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Prossima Scadenza */}
        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Prossima Scadenza</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            {kpi.upcoming ? (
              <CardTitle className="text-base font-bold truncate text-foreground mt-1">
                {kpi.upcoming.name}
              </CardTitle>
            ) : (
              <CardTitle className="text-sm font-semibold text-muted-foreground mt-1">
                Nessuna
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            {kpi.upcoming ? (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="font-mono font-medium text-emerald-400">
                  {formatEuro(kpi.upcoming.lastAmount)}
                </span>
                <span>•</span>
                <span>
                  {kpi.upcoming.daysUntilNext === 0
                    ? 'In scadenza oggi!'
                    : `Tra ${kpi.upcoming.daysUntilNext} gg (${formatDate(kpi.upcoming.nextExpectedDate)})`}
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">Nessun addebito imminente</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 2. Sezione "Analisi Utenze": Senza Card Wrapper Esterno, Grafico a Linee Interattivo e Card di Riepilogo */}
      {kpi.variableUtilities.length > 0 && (
        <div className="space-y-3.5 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                Analisi Utenze & Trend Mensile a Consumo
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Confronto temporale continuo tra bollette consuntivate nel periodo per rilevare stagionalità e scostamenti
              </p>
            </div>

            {/* Toggle Serie Grafico */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => toggleSeries('luce')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                  visibleSeries.luce
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-xs'
                    : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50 opacity-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Luce (Iren)</span>
              </button>
              <button
                onClick={() => toggleSeries('gas')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                  visibleSeries.gas
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                    : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50 opacity-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Gas (Iren)</span>
              </button>
              <button
                onClick={() => toggleSeries('acqua')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                  visibleSeries.acqua
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-xs'
                    : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50 opacity-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Acqua (Arca)</span>
              </button>
              <button
                onClick={() => toggleSeries('tari')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                  visibleSeries.tari
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                    : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50 opacity-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>TARI (Iren)</span>
              </button>
            </div>
          </div>

          {/* Grafico a Linee Recharts */}
          <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
            {monthlyUtilitiesChartData.length > 0 ? (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyUtilitiesChartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} unit="€" />
                    <RechartsTooltip content={<UtilityCustomTooltip />} />
                    {visibleSeries.luce && (
                      <Line
                        type="monotone"
                        dataKey="luce"
                        name="Luce"
                        stroke="#38bdf8"
                        strokeWidth={2.5}
                        dot={{ r: 3.5, fill: '#38bdf8' }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    )}
                    {visibleSeries.gas && (
                      <Line
                        type="monotone"
                        dataKey="gas"
                        name="Gas"
                        stroke="#fb923c"
                        strokeWidth={2.5}
                        dot={{ r: 3.5, fill: '#fb923c' }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    )}
                    {visibleSeries.acqua && (
                      <Line
                        type="monotone"
                        dataKey="acqua"
                        name="Acqua"
                        stroke="#60a5fa"
                        strokeWidth={2.5}
                        dot={{ r: 3.5, fill: '#60a5fa' }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    )}
                    {visibleSeries.tari && (
                      <Line
                        type="monotone"
                        dataKey="tari"
                        name="TARI"
                        stroke="#34d399"
                        strokeWidth={2.5}
                        dot={{ r: 3.5, fill: '#34d399' }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground">
                Nessuna bolletta riscontrata nel periodo selezionato.
              </div>
            )}
          </div>

          {/* Card di Riepilogo Utenze Sottostanti */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {kpi.variableUtilities.map((u) => {
              const isGas = u.id.includes('gas');
              const isLuce = u.id.includes('luce');
              const isTari = u.id.includes('ambiente');
              const Icon = isGas ? Flame : isLuce ? Zap : isTari ? Activity : Droplets;
              const iconColor = isGas ? 'text-amber-400' : isLuce ? 'text-sky-400' : isTari ? 'text-emerald-400' : 'text-blue-400';
              const iconBg = isGas ? 'bg-amber-500/10' : isLuce ? 'bg-sky-500/10' : isTari ? 'bg-emerald-500/10' : 'bg-blue-500/10';

              const variance = u.varianceVsAveragePct || 0;
              const isBelowAvg = variance < 0;
              const isAboveAvg = variance > 0;

              // Statistiche nel periodo selezionato
              const inPeriodBills = u.periodCount || u.occurrences;
              const inPeriodSpent = u.periodSpent > 0 ? u.periodSpent : u.annualCost;
              const inPeriodAvg = inPeriodBills > 0 ? inPeriodSpent / inPeriodBills : u.averageAmount;

              return (
                <div
                  key={u.id}
                  className="p-3.5 rounded-xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">
                          {u.name}
                        </h4>
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          {inPeriodBills} bollette nel periodo
                        </span>
                      </div>
                    </div>

                    {isBelowAvg ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono shrink-0">
                        {Math.abs(variance)}% sotto
                      </Badge>
                    ) : isAboveAvg ? (
                      <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono shrink-0">
                        +{variance}% sopra
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground shrink-0">
                        In media
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Media Periodo</span>
                      <span className="font-bold font-mono text-foreground text-sm">
                        {formatEuro(inPeriodAvg)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">Ultima Bolletta</span>
                      <span className={`font-bold font-mono text-sm ${isBelowAvg ? 'text-emerald-400' : isAboveAvg ? 'text-amber-300' : 'text-foreground'}`}>
                        {formatEuro(u.lastAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 text-[11px] text-muted-foreground flex items-center justify-between font-mono bg-muted/20 px-2.5 py-1 rounded-md">
                    <span>Totale periodo:</span>
                    <strong className="text-foreground">{formatEuro(inPeriodSpent)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Sezione "Monitor Variazioni Tariffarie & Rimodulazioni": Senza Card Wrapper Esterno */}
      {kpi.itemsWithPriceChanges.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Monitor Variazioni Tariffarie & Rimodulazioni
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Rilevamento contrattuale di rincari (+), rimodulazioni e riduzioni di prezzo (-)
              </p>
            </div>
            <Badge variant="outline" className="text-xs bg-amber-500/15 text-amber-300 border-amber-500/40 font-mono w-fit">
              {kpi.netMonthlyPriceChange >= 0 ? `+${formatEuro(kpi.netMonthlyPriceChange * 12)}` : `-${formatEuro(Math.abs(kpi.netMonthlyPriceChange * 12))}`} /anno netto
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {kpi.itemsWithPriceChanges.map((item) => {
              const lastChange = item.priceChanges![item.priceChanges!.length - 1];
              const isIncrease = lastChange.delta > 0;
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                        {isIncrease ? (
                          <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {isIncrease ? 'Aumentato da ' : 'Ridotto da '}
                        <span className="line-through font-mono">{formatEuro(lastChange.from)}</span> a{' '}
                        <strong className={`font-mono ${isIncrease ? 'text-amber-300' : 'text-emerald-400'}`}>
                          {formatEuro(lastChange.to)}
                        </strong>
                      </div>
                    </div>

                    <Badge
                      className={`font-mono text-[11px] shrink-0 ${
                        isIncrease
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {isIncrease ? `+${formatEuro(lastChange.delta)}` : `-${formatEuro(Math.abs(lastChange.delta))}`}/m
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/50">
                    <span>Decorrenza: {formatDate(lastChange.date)}</span>
                    <span className={isIncrease ? 'text-amber-400' : 'text-emerald-400'}>
                      {isIncrease ? `+${lastChange.deltaPct}% rincaro` : `-${Math.abs(lastChange.deltaPct)}% risparmio`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Toolbar Filtri & Ricerca: Senza Card Wrapper Esterno, Filtri Professionali */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Input Ricerca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per merchant, fornitore, categoria o canale..."
              className="pl-9 pr-9 h-9 text-xs bg-card border-border"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              Mostrando <strong className="text-foreground">{filteredItems.length}</strong> di {allDetected.length} voci
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Azzera Filtri</span>
              </Button>
            )}
          </div>
        </div>

        {/* Dropdown Filtri Multipli */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {/* Filtro Stato Contratto */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 text-xs bg-card border border-border rounded-lg px-2.5 text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">Stato: Tutti</option>
            <option value="active">Solo Attivi</option>
            <option value="inactive">Sospesi / Annullati</option>
            <option value="loans_active">Rate in Corso</option>
            <option value="loans_closed">Rate Concluse</option>
          </select>

          {/* Filtro Canale */}
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="h-9 text-xs bg-card border border-border rounded-lg px-2.5 text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">Canale: Tutti</option>
            <option value="BancoBPM">Banco BPM</option>
            <option value="Numia">Carta Numia</option>
            <option value="Nexi">Carta Nexi</option>
            <option value="PayPal">PayPal</option>
            <option value="Satispay">Satispay</option>
          </select>

          {/* Filtro Tipologia */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-9 text-xs bg-card border border-border rounded-lg px-2.5 text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">Tipo: Tutti</option>
            <option value="subscription">Canoni Flat & Streaming</option>
            <option value="variable_utility">Utenze a Consumo</option>
            <option value="loan">Rate Finanziamenti</option>
            <option value="donation">Donazioni</option>
          </select>

          {/* Filtro Frequenza */}
          <select
            value={selectedFrequency}
            onChange={(e) => setSelectedFrequency(e.target.value)}
            className="h-9 text-xs bg-card border border-border rounded-lg px-2.5 text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">Frequenza: Tutte</option>
            <option value="monthly">Mensile</option>
            <option value="bimonthly">Bimestrale</option>
            <option value="quarterly">Trimestrale</option>
            <option value="annual">Annuale</option>
          </select>

          {/* Ordinamento (Sort) */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 text-xs bg-card border border-border rounded-lg px-2.5 text-foreground focus:outline-none cursor-pointer"
          >
            <option value="nextBilling">Ordina: Prossima Scadenza</option>
            <option value="periodSpent">Ordina: Spesa Periodo (↓)</option>
            <option value="amountDesc">Ordina: Importo Canone (↓)</option>
            <option value="amountAsc">Ordina: Importo Canone (↑)</option>
            <option value="name">Ordina: Nome (A-Z)</option>
          </select>
        </div>
      </div>

      {/* 5. Lista Spese Ricorrenti & Expansion Rows */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <Card className="bg-card/50 border-border p-8 text-center text-muted-foreground text-xs space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto text-muted-foreground/60" />
            <p>Nessun costo ricorrente risponde ai criteri di filtro impostati.</p>
          </Card>
        ) : (
          filteredItems.map((item) => {
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;
            const IconComp = cfg.icon;
            const isExpanded = expandedId === item.id;

            // Indicatori di urgenza sul prossimo addebito
            const isUrgent = item.isActive && item.daysUntilNext >= 0 && item.daysUntilNext <= 5;
            const isToday = item.isActive && item.daysUntilNext === 0;

            const isUtility = item.pricingModel === 'variable_utility';
            const isFlat = item.pricingModel === 'flat';
            const isLoan = item.pricingModel === 'loan';

            return (
              <Card
                key={item.id}
                className={`bg-card border-border transition-all duration-200 overflow-hidden ${
                  item.isIgnored
                    ? 'opacity-50 grayscale'
                    : item.isCancelled
                    ? 'border-rose-500/30 bg-card/85'
                    : item.isPaused
                    ? 'border-amber-500/30 bg-card/90'
                    : !item.isActive
                    ? 'opacity-70'
                    : isUrgent
                    ? 'border-amber-500/40 ring-1 ring-amber-500/20 shadow-xs'
                    : 'shadow-xs'
                }`}
              >
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-muted/30 transition-colors select-none"
                >
                  {/* Left: Icon, Name, Category pills */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.border} border`}
                    >
                      <IconComp className={`w-4 h-4 ${cfg.color}`} />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground truncate max-w-xs sm:max-w-md">
                          {item.name}
                        </span>

                        {/* Badges di tipologia modello */}
                        {isUtility ? (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-300 border-amber-500/30 font-medium">
                            Utenza a Consumo
                          </Badge>
                        ) : isFlat && (item.priceChanges && item.priceChanges.length > 0) ? (
                          item.priceChanges[item.priceChanges.length - 1].delta > 0 ? (
                            <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-300 border-amber-500/40 font-medium">
                              Rimodulato (+{formatEuro(item.priceChanges[item.priceChanges.length - 1].delta)})
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-medium">
                              Tariffa Ridotta (-{formatEuro(Math.abs(item.priceChanges[item.priceChanges.length - 1].delta))})
                            </Badge>
                          )
                        ) : null}

                        {item.isIgnored ? (
                          <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                            Silenziato
                          </Badge>
                        ) : item.isCancelled ? (
                          <Badge variant="outline" className="text-[10px] bg-rose-500/15 text-rose-300 border-rose-500/40 font-medium">
                            Annullato
                          </Badge>
                        ) : item.isPaused ? (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-300 border-amber-500/40 font-medium">
                            Sospeso
                          </Badge>
                        ) : item.loanDetails?.isClosed ? (
                          <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Estinto / Concluso
                          </Badge>
                        ) : !item.isActive ? (
                          <Badge variant="outline" className="text-[10px] bg-muted/50 text-muted-foreground">
                            Inattivo
                          </Badge>
                        ) : item.loanDetails ? (
                          <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/30 font-medium">
                            Rata {item.loanDetails.paidInstallments} di {item.loanDetails.totalInstallments}
                          </Badge>
                        ) : null}

                        {/* Badge Urgenza / Overdue / Prossima Scadenza */}
                        {!item.isIgnored && item.isActive && !item.loanDetails?.isClosed && !item.isPaused && (
                          item.isOverdue ? (
                            <Badge variant="outline" className="text-[10px] bg-rose-500/15 text-rose-400 border-rose-500/40 font-medium flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                              <span>Atteso ({Math.abs(item.daysUntilNext)} gg fa)</span>
                            </Badge>
                          ) : isToday ? (
                            <Badge className="text-[10px] bg-amber-500 text-black font-semibold animate-pulse">
                              In scadenza oggi!
                            </Badge>
                          ) : isUrgent ? (
                            <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/30 font-medium">
                              Tra {item.daysUntilNext} gg
                            </Badge>
                          ) : null
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                        <span className="font-medium text-foreground/80">{item.category}</span>
                        <span>•</span>

                        {/* Canale / Transizione Canale */}
                        {item.channelTransition ? (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-purple-300 border-purple-500/40 font-mono flex items-center gap-1 bg-purple-500/10">
                            <span>{item.channelTransition.from}</span>
                            <span>➔</span>
                            <span className="font-semibold text-foreground">{item.channelTransition.to}</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-muted-foreground font-mono">
                            {item.channel}
                          </Badge>
                        )}

                        <span>•</span>
                        <span>{item.occurrences} addebiti rilevati</span>
                        {item.firstDate && item.lastDate && item.occurrences > 1 && (
                          <span className="text-[10px] opacity-80 font-mono">
                            ({item.firstDate.slice(0, 7)} – {item.lastDate.slice(0, 7)})
                          </span>
                        )}

                        {item.loanDetails && (
                          <>
                            <span>•</span>
                            <span className="text-foreground/90 font-medium">
                              Termine: {item.loanDetails.endDate}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Barra di avanzamento rate a blocchi per i finanziamenti */}
                      {item.loanDetails && (
                        <div className="pt-1.5 max-w-sm sm:max-w-md space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>
                              {item.loanDetails.isClosed
                                ? 'Finanziamento 100% rimborsato'
                                : `${item.loanDetails.paidInstallments} di ${item.loanDetails.totalInstallments} rate pagate`}
                            </span>
                            <span className="font-mono font-medium text-foreground">
                              {item.loanDetails.isClosed ? '0,00 € residui' : `${formatEuro(item.loanDetails.remainingDebt)} residui`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: item.loanDetails.totalInstallments }).map((_, idx) => (
                              <div
                                key={idx}
                                className={`h-1.5 flex-1 rounded-xs transition-all ${
                                  idx < item.loanDetails!.paidInstallments
                                    ? item.loanDetails!.isClosed
                                      ? 'bg-muted-foreground/40'
                                      : 'bg-emerald-500'
                                    : 'bg-muted/70'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Amounts & Next Date info (differenziato in base alla natura economica del costo) */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                    <div className="text-left sm:text-right space-y-1">
                      {/* Visualizzazione Cifra Principale */}
                      {item.isCancelled || item.isPaused ? (
                        <div className="text-base font-bold font-mono text-muted-foreground">
                          0,00 €
                        </div>
                      ) : isUtility ? (
                        <div className="text-base font-bold font-mono text-foreground flex items-center sm:justify-end gap-1.5">
                          <span className="text-xs text-muted-foreground font-normal">Media:</span>
                          <span>~{formatEuro(item.averageAmount)}</span>
                          <span className="text-[11px] text-muted-foreground font-normal">
                            /{FREQUENCY_LABELS[item.frequency] || item.frequency}
                          </span>
                        </div>
                      ) : isLoan ? (
                        <div className="text-base font-bold font-mono text-foreground">
                          {item.loanDetails?.isClosed ? (
                            <span className="text-emerald-400">0,00 €</span>
                          ) : (
                            <>
                              {formatEuro(item.lastAmount)}
                              <span className="text-[11px] text-muted-foreground font-normal ml-1">
                                /rata
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        // Flat contract
                        <div className="text-base font-bold font-mono text-foreground">
                          {formatEuro(item.lastAmount)}
                          <span className="text-[11px] text-muted-foreground font-normal ml-1">
                            /{FREQUENCY_LABELS[item.frequency] || item.frequency}
                          </span>
                        </div>
                      )}

                      {/* Riga di Dettaglio Scadenze e Scostamenti */}
                      <div className="text-[11px] text-muted-foreground flex items-center sm:justify-end gap-1.5 flex-wrap">
                        {item.isCancelled ? (
                          <div className="flex items-center sm:justify-end gap-1.5 flex-wrap">
                            <span className="text-rose-300 font-medium text-xs">
                              Termina il {item.cancellationEndDate ? formatDate(item.cancellationEndDate) : formatDate(item.nextExpectedDate)}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-muted-foreground">0,00 €/anno</span>
                          </div>
                        ) : item.isPaused ? (
                          <div className="flex items-center sm:justify-end gap-1.5 flex-wrap">
                            <span className="text-amber-400/90 font-medium text-xs">Abbonamento momentaneamente sospeso</span>
                            <span>•</span>
                            <span className="font-mono text-muted-foreground">0,00 €/anno</span>
                          </div>
                        ) : isUtility ? (
                          // Dettaglio Utenza con scostamento ultima bolletta vs media
                          <div className="flex items-center sm:justify-end gap-1.5 flex-wrap">
                            <span>Ultima: <strong className="text-foreground font-mono">{formatEuro(item.lastAmount)}</strong></span>
                            {item.varianceVsAveragePct !== undefined && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] py-0 px-1 font-mono ${
                                  item.varianceVsAveragePct < 0
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : item.varianceVsAveragePct > 0
                                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {item.varianceVsAveragePct < 0 ? `↓ ${Math.abs(item.varianceVsAveragePct)}%` : `↑ +${item.varianceVsAveragePct}%`} vs media
                              </Badge>
                            )}
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 font-medium text-foreground">
                              <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                              Prossimo: <strong className="text-foreground">{formatDate(item.nextExpectedDate)}</strong>
                            </span>
                            <span>•</span>
                            <span>~{formatEuro(item.annualCost)}/anno</span>
                          </div>
                        ) : isLoan ? (
                          item.loanDetails?.isClosed ? (
                            <span className="text-emerald-400/80">Estinto a {item.loanDetails.endDate}</span>
                          ) : (
                            <div className="flex items-center sm:justify-end gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                <Calendar className="w-3 h-3 text-purple-400 shrink-0" />
                                Prossima rata: <strong className="text-foreground">{formatDate(item.nextExpectedDate)}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                <strong className="text-foreground/90 font-mono">{formatEuro(item.loanDetails?.remainingDebt || 0)}</strong> residui
                              </span>
                            </div>
                          )
                        ) : (
                          // Canone Flat (connettività, streaming, donazioni)
                          <div className="flex items-center sm:justify-end gap-1.5 flex-wrap">
                            {item.isOverdue ? (
                              <span className="inline-flex items-center gap-1 font-medium text-rose-400">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                Scaduto il: <strong className="text-rose-300">{formatDate(item.nextExpectedDate)}</strong>
                              </span>
                            ) : item.isActive ? (
                              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                <Calendar className="w-3 h-3 text-sky-400 shrink-0" />
                                Prossimo: <strong className="text-foreground">{formatDate(item.nextExpectedDate)}</strong>
                              </span>
                            ) : (
                              <span>Ultimo: {formatDate(item.lastDate)}</span>
                            )}
                            <span>•</span>
                            <span className="font-mono text-foreground font-medium">{formatEuro(item.annualCost)}/anno</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-1 rounded-md text-muted-foreground hover:text-foreground">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* 4. Expansion Row: Dettagli analitici, storici e grafici */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-border/60 bg-muted/10 space-y-3">
                    {/* Pulsanti Azione (Silenzia/Escludi) */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-muted-foreground font-mono">
                        ID Riconciliazione: <strong className="text-foreground">{item.id}</strong>
                      </span>
                      <Button
                        variant={item.isIgnored ? 'default' : 'ghost'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleIgnore(item.id, item.isIgnored);
                        }}
                        className="text-xs h-7 px-2.5 gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        {item.isIgnored ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-primary" />
                            <span>Ripristina nel conteggio</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Silenzia spesa ricorrente</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Banner informativo specifico per item annullati */}
                    {item.isCancelled && (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>
                          Abbonamento annullato dall'utente. Il servizio rimarrà attivo e fruibile fino al{' '}
                          {item.cancellationEndDate ? formatDate(item.cancellationEndDate) : formatDate(item.nextExpectedDate)}{' '}
                          senza alcun rinnovo o addebito futuro programmato.
                        </span>
                      </div>
                    )}

                    {/* Banner informativo specifico per item sospesi */}
                    {item.isPaused && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>Abbonamento momentaneamente sospeso dall'utente. Nessun addebito automatico attivo programmato.</span>
                      </div>
                    )}

                    {/* Banner informativo specifico per ritardo/overdue */}
                    {item.isOverdue && item.overdueMessage && (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{item.overdueMessage}</span>
                      </div>
                    )}

                    {/* Sezione Variazioni Tariffarie per Canoni Flat */}
                    {isFlat && item.priceChanges && item.priceChanges.length > 0 && (
                      <div className="p-3 rounded-lg bg-background/80 border border-border/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-semibold text-foreground">
                          <span className="flex items-center gap-1.5 text-primary">
                            <Sparkles className="w-3.5 h-3.5" />
                            Storico Variazioni Tariffarie & Rimodulazioni
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {item.priceChanges.map((pc, idx) => {
                            const isInc = pc.delta > 0;
                            return (
                              <div key={idx} className="p-2 rounded bg-muted/40 border border-border/40 flex items-center justify-between text-[11px]">
                                <div>
                                  <span className="text-muted-foreground block text-[10px]">
                                    {isInc ? 'Rincaro del: ' : 'Riduzione del: '} {formatDate(pc.date)}
                                  </span>
                                  <span>
                                    <span className="text-muted-foreground line-through font-mono">{formatEuro(pc.from)}</span> ➔{' '}
                                    <strong className={`font-mono ${isInc ? 'text-amber-300' : 'text-emerald-400'}`}>{formatEuro(pc.to)}</strong>
                                  </span>
                                </div>
                                <Badge
                                  className={`font-mono text-[10px] ${
                                    isInc
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  }`}
                                >
                                  {isInc ? `+${formatEuro(pc.delta)}` : `-${formatEuro(Math.abs(pc.delta))}`} ({isInc ? `+${pc.deltaPct}%` : `-${Math.abs(pc.deltaPct)}%`})
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Sezione Ammortamento Prestiti */}
                    {item.loanDetails && (
                      <div className="p-3 rounded-lg bg-background/80 border border-border/70 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-semibold text-foreground">
                          <span className="flex items-center gap-1.5 text-purple-400">
                            <CreditCard className="w-3.5 h-3.5" />
                            Riepilogo Ammortamento Prestito
                          </span>
                          <span className="font-mono text-foreground">
                            {item.loanDetails.isClosed
                              ? 'Debito 100% Estinto'
                              : `Debito Residuo: ${formatEuro(item.loanDetails.remainingDebt)}`}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                          <div className="p-2 rounded bg-muted/40 border border-border/40">
                            <span className="text-muted-foreground block text-[10px]">Importo Totale</span>
                            <span className="font-mono font-medium text-foreground">
                              {item.loanDetails.totalAmount ? formatEuro(item.loanDetails.totalAmount) : 'N/D'}
                            </span>
                          </div>

                          <div className="p-2 rounded bg-muted/40 border border-border/40">
                            <span className="text-muted-foreground block text-[10px]">Rimborsato ad Oggi</span>
                            <span className="font-mono font-medium text-emerald-400">
                              {item.loanDetails.paidAmount ? formatEuro(item.loanDetails.paidAmount) : 'N/D'}
                            </span>
                          </div>

                          <div className="p-2 rounded bg-muted/40 border border-border/40">
                            <span className="text-muted-foreground block text-[10px]">Rate Rimanenti</span>
                            <span className="font-mono font-medium text-purple-300">
                              {item.loanDetails.isClosed
                                ? '0 rate'
                                : `${item.loanDetails.remainingInstallments} rate da ${formatEuro(item.loanDetails.installmentAmount)}`}
                            </span>
                          </div>

                          <div className="p-2 rounded bg-muted/40 border border-border/40">
                            <span className="text-muted-foreground block text-[10px]">
                              {item.loanDetails.isClosed ? 'Data Estinzione' : 'Prossima Rata'}
                            </span>
                            <span className="font-mono font-medium text-foreground">
                              {item.loanDetails.isClosed ? item.loanDetails.endDate : formatDate(item.nextExpectedDate)}
                            </span>
                          </div>
                        </div>

                        {item.loanDetails.notes && (
                          <div className="text-[11px] text-muted-foreground italic pt-0.5">
                            ℹ️ {item.loanDetails.notes}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Storico completo addebiti verificati sul conto */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <span>Tutti gli addebiti verificati ({item.sampleTransactions.length})</span>
                        {item.firstDate && item.lastDate && (
                          <span className="font-mono text-[10px] text-muted-foreground/80 lowercase">
                            dal {formatDate(item.firstDate)} al {formatDate(item.lastDate)}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-1 max-h-72 overflow-y-auto pr-1">
                        {item.sampleTransactions.map((tx) => {
                          const txAmount = Math.abs(tx.amount);
                          const isUtilityTxAbove = isUtility && txAmount > item.averageAmount;
                          return (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between p-2 rounded-md bg-background/60 border border-border/60 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-muted-foreground text-[11px] shrink-0">
                                  {tx.date}
                                </span>
                                <span className="truncate text-foreground text-[11px]">
                                  {tx.rawDescription || tx.description}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 font-mono font-medium">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] py-0 px-1.5 font-mono ${
                                    tx.channel === 'Numia'
                                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                      : tx.channel === 'Nexi'
                                      ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                      : tx.channel === 'BancoBPM'
                                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                      : ''
                                  }`}
                                >
                                  {tx.channel}
                                </Badge>

                                {isUtility && (
                                  <span className={`text-[10px] ${isUtilityTxAbove ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {isUtilityTxAbove ? '↑' : '↓'}
                                  </span>
                                )}

                                <span className="text-foreground">{formatEuro(txAmount)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
