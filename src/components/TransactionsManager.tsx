import React, { useState, useMemo } from 'react';
import { Transaction, MacroCategory, MACRO_CATEGORY_LABELS, MACRO_CATEGORY_SHORT_LABELS, CustomCategoryRule } from '@/types/finance';
import { CategoryRulesManager } from './CategoryRulesManager';
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  ArrowUpDown,
  Tag,
  CreditCard,
  Building2,
  Wallet,
  Calendar,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Check,
  ReceiptText,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Tooltip,
  Label,
  Checkbox,
  DateRangePicker,
  Switch,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from './ui';
import { DateRange } from 'react-day-picker';
import { format, startOfYear } from 'date-fns';

interface TransactionsManagerProps {
  transactions: Transaction[];
  rules?: CustomCategoryRule[];
  onAddTransaction: (transaction: Transaction) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onSaveRule?: (rule: CustomCategoryRule) => void;
  onDeleteRule?: (id: string) => void;
  onToggleRule?: (id: string, active: boolean) => void;
  onApplyRulesToAll?: () => { modifiedCount: number };
  onResetToRealTransactions?: () => void;
}

const MACRO_COLORS: Record<MacroCategory, { bg: string; text: string; border: string }> = {
  Needs: { bg: 'bg-sky-950/40', text: 'text-sky-300', border: 'border-sky-500/30' },
  Commitments: { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-500/30' },
  Wants: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-500/30' },
  Savings: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  Extraordinary: { bg: 'bg-rose-950/40', text: 'text-rose-300', border: 'border-rose-500/30' },
};

const CHANNEL_ICONS: Record<Transaction['channel'], React.ReactNode> = {
  BancoBPM: <Building2 className="w-3.5 h-3.5 text-sky-400" />,
  Numia: <CreditCard className="w-3.5 h-3.5 text-amber-400" />,
  Nexi: <CreditCard className="w-3.5 h-3.5 text-indigo-400" />,
  PayPal: <Wallet className="w-3.5 h-3.5 text-blue-400" />,
  Satispay: <Wallet className="w-3.5 h-3.5 text-red-400" />,
  Contanti: <Wallet className="w-3.5 h-3.5 text-emerald-400" />,
};

const formatEuro = (amount: number): string => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export const TransactionsManager: React.FC<TransactionsManagerProps> = ({
  transactions,
  rules = [],
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onSaveRule,
  onDeleteRule,
  onToggleRule,
  onApplyRulesToAll,
  onResetToRealTransactions,
}) => {
  // Filtering & Search states (Isolated to this page)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMacro, setSelectedMacro] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [excludeExtraordinary, setExcludeExtraordinary] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    return { from: startOfYear(now), to: now };
  });
  const [sortField, setSortField] = useState<'date' | 'channel' | 'description' | 'category' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    const saved = localStorage.getItem('finance_vault_tx_page_size');
    return saved ? parseInt(saved, 10) || 20 : 20;
  });

  const handlePageSizeChange = (val: string) => {
    const size = parseInt(val, 10) || 20;
    setPageSize(size);
    localStorage.setItem('finance_vault_tx_page_size', String(size));
    setCurrentPage(1);
  };

  // Modals states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [prefilledRule, setPrefilledRule] = useState<Partial<CustomCategoryRule> | null>(null);

  // Crea una regola personalizzata con dati precompilati da una transazione
  const handleCreateRuleFromTx = (tx: Transaction) => {
    const cleanWords = tx.description.split(/[\s\-:,/]+/).filter((w) => w.length > 2);
    const suggestedPattern = cleanWords.slice(0, 2).join(' ') || tx.description;
    setPrefilledRule({
      name: `Regola per ${tx.description.substring(0, 25)}`,
      pattern: suggestedPattern.toUpperCase(),
      matchField: 'both',
      channel: tx.channel,
      macroCategory: tx.macroCategory,
      category: tx.category,
      tags: tx.tags,
      isExtraordinary: tx.isExtraordinary,
    });
    setIsRulesModalOpen(true);
  };

  // Form states for Add/Edit
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formChannel, setFormChannel] = useState<Transaction['channel']>('BancoBPM');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formType, setFormType] = useState<'expense' | 'income'>('expense');
  const [formMacroCategory, setFormMacroCategory] = useState<MacroCategory>('Needs');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formIsExtraordinary, setFormIsExtraordinary] = useState(false);

  // Dynamically compute available categories, optionally scoped by selected macro
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((t) => {
      if (t.category && t.category.trim()) {
        if (selectedMacro === 'ALL' || t.macroCategory === selectedMacro) {
          cats.add(t.category.trim());
        }
      }
    });
    return Array.from(cats).sort((a, b) => a.localeCompare(b, 'it'));
  }, [transactions, selectedMacro]);

  const handleMacroChange = (val: string) => {
    setSelectedMacro(val);
    setSelectedCategory('ALL');
    setCurrentPage(1);
  };

  const handleHeaderSort = (field: 'date' | 'channel' | 'description' | 'category' | 'amount') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'date' || field === 'amount' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedMacro('ALL');
    setSelectedCategory('ALL');
    setSelectedChannel('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    selectedMacro !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    selectedChannel !== 'ALL'
  );

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    let result = transactions.filter((t) => {
      // Search text
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesDesc = t.description?.toLowerCase().includes(query);
        const matchesCat = t.category?.toLowerCase().includes(query);
        const matchesTags = t.tags?.some((tag) => tag.toLowerCase().includes(query));
        const matchesAmount = t.amount.toString().includes(query);
        if (!matchesDesc && !matchesCat && !matchesTags && !matchesAmount) {
          return false;
        }
      }

      // Macro Category
      if (selectedMacro !== 'ALL' && t.macroCategory !== selectedMacro) {
        return false;
      }

      // Specific Category
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) {
        return false;
      }

      // Channel
      if (selectedChannel !== 'ALL' && t.channel !== selectedChannel) {
        return false;
      }

      // Exclude Extraordinary Filter
      if (excludeExtraordinary && (t.isExtraordinary || t.macroCategory === 'Extraordinary')) {
        return false;
      }

      // Date Range Filter
      if (dateRange?.from) {
        const fromIso = format(dateRange.from, 'yyyy-MM-dd');
        if (t.date < fromIso) return false;
      }
      if (dateRange?.to) {
        const toIso = format(dateRange.to, 'yyyy-MM-dd');
        if (t.date > toIso) return false;
      }

      return true;
    });

    // Sorting by column header
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortField === 'amount') cmp = a.amount - b.amount;
      else if (sortField === 'channel') cmp = a.channel.localeCompare(b.channel);
      else if (sortField === 'description') cmp = a.description.localeCompare(b.description);
      else if (sortField === 'category') cmp = a.category.localeCompare(b.category);

      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [transactions, searchTerm, selectedMacro, selectedCategory, selectedChannel, dateRange, excludeExtraordinary, sortField, sortDirection]);

  // Summary stats for filtered results
  const stats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    filteredTransactions.forEach((t) => {
      if (t.amount > 0) income += t.amount;
      else expenses += Math.abs(t.amount);
    });
    return {
      count: filteredTransactions.length,
      income,
      expenses,
      balance: income - expenses,
    };
  }, [filteredTransactions]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Reset page when filters change
  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val);
    setCurrentPage(1);
  };

  // Open Edit Modal
  const handleOpenEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setFormDate(t.date);
    setFormChannel(t.channel);
    setFormAmount(Math.abs(t.amount).toString());
    setFormType(t.amount >= 0 ? 'income' : 'expense');
    setFormMacroCategory(t.macroCategory);
    setFormCategory(t.category);
    setFormDescription(t.description);
    setFormTags(t.tags ? t.tags.join(', ') : '');
    setFormIsExtraordinary(!!t.isExtraordinary);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormChannel('BancoBPM');
    setFormAmount('');
    setFormType('expense');
    setFormMacroCategory('Needs');
    setFormCategory('Supermercato');
    setFormDescription('');
    setFormTags('#spesa');
    setFormIsExtraordinary(false);
    setIsAddModalOpen(true);
  };

  // Save Transaction (Add or Edit)
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const finalAmount = formType === 'expense' ? -parsedAmount : parsedAmount;
    const splitTags = formTags
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => (s.startsWith('#') ? s : `#${s}`));

    if (editingTransaction) {
      // Update
      const updated: Transaction = {
        ...editingTransaction,
        date: formDate,
        channel: formChannel,
        amount: finalAmount,
        macroCategory: formMacroCategory,
        category: formCategory.trim() || 'Generale',
        description: formDescription.trim() || (formType === 'income' ? 'Entrata' : 'Spesa'),
        tags: splitTags,
        isExtraordinary: formIsExtraordinary,
      };
      onUpdateTransaction(updated);
      setEditingTransaction(null);
    } else {
      // Create new
      const newTx: Transaction = {
        id: `tx_manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: formDate,
        channel: formChannel,
        amount: finalAmount,
        macroCategory: formMacroCategory,
        category: formCategory.trim() || 'Generale',
        description: formDescription.trim() || (formType === 'income' ? 'Entrata manuale' : 'Spesa manuale'),
        tags: splitTags,
        isExtraordinary: formIsExtraordinary,
        autoCategorized: false,
      };
      onAddTransaction(newTx);
      setIsAddModalOpen(false);
    }
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (deletingId) {
      onDeleteTransaction(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-primary" />
            Registro Movimenti & Transazioni
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Consulta, ricerca, correggi categorie o aggiungi nuove uscite/entrate nel Vault cifrato
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onResetToRealTransactions && (
            <Button
              variant="outline"
              onClick={onResetToRealTransactions}
              className="border-border text-foreground hover:bg-accent hover:text-accent-foreground text-xs py-2 px-3 flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              <span>Ricarica Dati Reali</span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setPrefilledRule(null);
              setIsRulesModalOpen(true);
            }}
            className="border-border text-foreground hover:bg-accent hover:text-accent-foreground text-xs py-2 px-3 flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Regole ({rules.length})</span>
          </Button>
          <Button
            onClick={handleOpenAdd}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs py-2 px-3.5 flex items-center gap-1.5 shrink-0 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Transazione</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Movimenti Filtrati */}
        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Movimenti Filtrati</span>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <ReceiptText className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground mt-1">
              {stats.count}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <p className="text-[11px] text-muted-foreground">
              Transazioni visibili nel periodo
            </p>
          </CardContent>
        </Card>

        {/* Totale Entrate */}
        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Totale Entrate</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-emerald-400 mt-1">
              {formatEuro(stats.income)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="flex items-center text-[11px] text-emerald-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              <span>Accrediti & stipendi</span>
            </div>
          </CardContent>
        </Card>

        {/* Totale Uscite */}
        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Totale Uscite</span>
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-rose-400 mt-1">
              {formatEuro(stats.expenses)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="flex items-center text-[11px] text-rose-400 font-medium">
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              <span>Spese e addebiti</span>
            </div>
          </CardContent>
        </Card>

        {/* Saldo Netto Periodo */}
        <Card className="bg-card border-border relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-24 h-24 ${stats.balance >= 0 ? 'bg-primary/5' : 'bg-rose-500/5'} rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none`} />
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Saldo Netto Periodo</span>
              <div className={`p-1.5 rounded-lg ${stats.balance >= 0 ? 'bg-primary/10 text-primary' : 'bg-rose-500/10 text-rose-400'}`}>
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className={`text-2xl font-bold mt-1 ${stats.balance >= 0 ? 'text-primary' : 'text-rose-400'}`}>
              {formatEuro(stats.balance)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className={`flex items-center text-[11px] font-medium ${stats.balance >= 0 ? 'text-primary' : 'text-rose-400'}`}>
              {stats.balance >= 0 ? (
                <>
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  <span>Surplus di cassa</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                  <span>Deficit nel periodo</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-card border-border p-4 space-y-3">
        {/* Row 1: Search text input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cerca per descrizione, merchant, categoria o tag (#utenze)..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
              className="pl-9 bg-background border-input text-xs text-foreground placeholder:text-muted-foreground h-9 w-full"
            />
            {searchTerm && (
              <button
                onClick={() => handleFilterChange(setSearchTerm, '')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted border-border flex items-center gap-1.5 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Azzera filtri</span>
            </Button>
          )}
        </div>

        {/* Row 2: Dimensional & Temporal Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
          {/* Macro Category Filter */}
          <Select
            value={selectedMacro}
            onValueChange={handleMacroChange}
          >
            <SelectTrigger className="w-[185px] h-9 text-xs">
              <SelectValue placeholder="Macro-Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tutte le Macro ({transactions.length})</SelectItem>
              <SelectItem value="Needs">Bisogni Primari & Casa</SelectItem>
              <SelectItem value="Commitments">Rate & Finanziamenti</SelectItem>
              <SelectItem value="Wants">Stile di Vita & Shopping</SelectItem>
              <SelectItem value="Savings">Risparmio & Previdenza</SelectItem>
              <SelectItem value="Extraordinary">Spese Straordinarie</SelectItem>
            </SelectContent>
          </Select>

          {/* Specific Category Filter */}
          <Select
            value={selectedCategory}
            onValueChange={(val) => handleFilterChange(setSelectedCategory, val)}
          >
            <SelectTrigger className="w-[195px] h-9 text-xs">
              <SelectValue placeholder="Categoria Specifica" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="ALL">Tutte le Categorie ({availableCategories.length})</SelectItem>
              {availableCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Channel Filter */}
          <Select
            value={selectedChannel}
            onValueChange={(val) => handleFilterChange(setSelectedChannel, val)}
          >
            <SelectTrigger className="w-[135px] h-9 text-xs">
              <SelectValue placeholder="Canale" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tutti i Canali</SelectItem>
              <SelectItem value="BancoBPM">Banco BPM</SelectItem>
              <SelectItem value="Numia">Carta Numia</SelectItem>
              <SelectItem value="Nexi">Carta Nexi</SelectItem>
              <SelectItem value="PayPal">PayPal</SelectItem>
              <SelectItem value="Satispay">Satispay</SelectItem>
              <SelectItem value="Contanti">Contanti</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Picker with Presets & Calendar */}
          <DateRangePicker
            value={dateRange}
            onChange={(range) => {
              setDateRange(range);
              setCurrentPage(1);
            }}
            defaultPreset="Anno in corso"
          />

          {/* Toggle Extraordinary Expenses */}
          <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-lg border border-border h-9 shadow-xs shrink-0">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-foreground font-medium">Escludi Straordinarie</span>
            <Switch
              checked={excludeExtraordinary}
              onCheckedChange={setExcludeExtraordinary}
            />
          </div>
        </div>
      </Card>

      {/* Transactions Table Card */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead
                  onClick={() => handleHeaderSort('date')}
                  className="text-muted-foreground font-semibold text-xs w-28 cursor-pointer select-none hover:text-foreground transition-colors group"
                >
                  <div className="flex items-center">
                    <span>Data</span>
                    {sortField === 'date' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-primary ml-1 inline-block shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-primary ml-1 inline-block shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground ml-1 inline-block shrink-0 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleHeaderSort('channel')}
                  className="text-muted-foreground font-semibold text-xs w-28 cursor-pointer select-none hover:text-foreground transition-colors group"
                >
                  <div className="flex items-center">
                    <span>Canale</span>
                    {sortField === 'channel' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-primary ml-1 inline-block shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-primary ml-1 inline-block shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground ml-1 inline-block shrink-0 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleHeaderSort('description')}
                  className="text-muted-foreground font-semibold text-xs cursor-pointer select-none hover:text-foreground transition-colors group"
                >
                  <div className="flex items-center">
                    <span>Descrizione & Tag</span>
                    {sortField === 'description' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-primary ml-1 inline-block shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-primary ml-1 inline-block shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground ml-1 inline-block shrink-0 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleHeaderSort('category')}
                  className="text-muted-foreground font-semibold text-xs w-48 cursor-pointer select-none hover:text-foreground transition-colors group"
                >
                  <div className="flex items-center">
                    <span>Macro / Categoria</span>
                    {sortField === 'category' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-primary ml-1 inline-block shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-primary ml-1 inline-block shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground ml-1 inline-block shrink-0 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleHeaderSort('amount')}
                  className="text-muted-foreground font-semibold text-xs text-right w-32 cursor-pointer select-none hover:text-foreground transition-colors group"
                >
                  <div className="flex items-center justify-end">
                    <span>Importo</span>
                    {sortField === 'amount' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-primary ml-1 inline-block shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-primary ml-1 inline-block shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground ml-1 inline-block shrink-0 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground font-semibold text-xs text-center w-20">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs align-middle">
                    Nessun movimento trovato con i filtri correnti.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((tx) => {
                  const style = MACRO_COLORS[tx.macroCategory] || MACRO_COLORS.Needs;
                  const isExpanded = expandedTxId === tx.id;
                  return (
                    <React.Fragment key={tx.id}>
                      <TableRow
                        onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                        className={`border-border/80 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-muted/60' : 'hover:bg-muted/40'
                        }`}
                      >
                        {/* Date */}
                        <TableCell className="font-mono text-xs text-foreground font-medium align-middle whitespace-nowrap">
                          {tx.date}
                        </TableCell>

                        {/* Channel */}
                        <TableCell className="align-middle">
                          <div className="flex items-center gap-1.5 text-xs text-foreground">
                            {CHANNEL_ICONS[tx.channel]}
                            <span>{tx.channel}</span>
                          </div>
                        </TableCell>

                        {/* Description & Tags */}
                        <TableCell className="max-w-md align-middle">
                          <div className="space-y-1">
                            <Tooltip content={tx.description}>
                              <p className="text-xs font-medium text-foreground truncate max-w-sm">
                                {tx.description}
                              </p>
                            </Tooltip>
                            {((tx.tags && tx.tags.length > 0) || tx.isExtraordinary) && (
                              <div className="flex flex-wrap items-center gap-1">
                                {tx.isExtraordinary && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-rose-500/30 bg-rose-950/40 text-rose-300 font-normal">
                                    Straordinaria
                                  </Badge>
                                )}
                                {tx.tags?.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Category & Macro Badges */}
                        <TableCell className="align-middle">
                          <div className="flex flex-col gap-1 items-start">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0.5 border ${style.border} ${style.bg} ${style.text} font-medium`}
                            >
                              {MACRO_CATEGORY_SHORT_LABELS[tx.macroCategory] || tx.macroCategory}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-normal px-1.5 py-0.5 bg-muted/70 text-muted-foreground border border-border/70 max-w-[170px] truncate"
                            >
                              {tx.category}
                            </Badge>
                          </div>
                        </TableCell>

                        {/* Amount */}
                        <TableCell className={`text-right font-mono text-xs font-semibold align-middle whitespace-nowrap ${tx.amount > 0 ? 'text-emerald-400' : 'text-foreground'}`}>
                          {tx.amount > 0 ? `+${formatEuro(tx.amount)}` : formatEuro(tx.amount)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-center align-middle" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <Tooltip content="Crea regola da questo movimento">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCreateRuleFromTx(tx)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                aria-label="Crea regola da questo movimento"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </Button>
                            </Tooltip>
                            <Tooltip content="Modifica transazione">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(tx)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                            </Tooltip>
                            <Tooltip content="Elimina transazione">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingId(tx.id)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/15"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expansion Row for technical details and tags (§10.2) */}
                      {isExpanded && (
                        <TableRow className="bg-muted/30 border-b border-border/70 hover:bg-muted/30">
                          <TableCell colSpan={6} className="py-2.5 px-6 text-xs align-middle">
                            <div className="flex flex-wrap items-center justify-between gap-3 text-muted-foreground">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-foreground">Dettagli:</span>
                                <code className="text-[10px] font-mono bg-background border border-border px-1.5 py-0.5 rounded text-primary">
                                  ID: {tx.id}
                                </code>
                                {tx.isExtraordinary && (
                                  <span className="text-[10px] text-destructive bg-destructive/15 border border-destructive/30 px-1.5 py-0.5 rounded font-medium">
                                    Spesa Straordinaria (Esclusa dal cash flow)
                                  </span>
                                )}
                                {tx.autoCategorized && (
                                  <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-medium">
                                    Auto-categorizzato da regole
                                  </span>
                                )}
                              </div>

                              {tx.tags && tx.tags.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-foreground font-medium">Tag:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {tx.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-background border border-border text-foreground font-mono"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination bar with Rows-Per-Page Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border bg-card/60 text-xs text-muted-foreground">
          {/* Left: Rows Per Page Selector & Results Count */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium text-xs">Righe per pagina:</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-8 w-[76px] bg-background border-border text-foreground text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="250">250</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-muted-foreground text-xs">
              {filteredTransactions.length === 0 ? (
                <span>0 movimenti trovati</span>
              ) : (
                <span>
                  Mostrando{' '}
                  <span className="font-semibold text-foreground">
                    {(currentPage - 1) * pageSize + 1}
                  </span>
                  -
                  <span className="font-semibold text-foreground">
                    {Math.min(currentPage * pageSize, filteredTransactions.length)}
                  </span>{' '}
                  di <span className="font-semibold text-foreground">{filteredTransactions.length}</span> movimenti
                </span>
              )}
            </div>
          </div>

          {/* Right: Page Navigation Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 ml-auto">
              {/* First Page */}
              <Tooltip content="Prima pagina">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 border-border text-foreground disabled:opacity-30"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </Button>
              </Tooltip>

              {/* Prev Page */}
              <Tooltip content="Pagina precedente">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2.5 border-border text-foreground disabled:opacity-30 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Prec</span>
                </Button>
              </Tooltip>

              {/* Current Page Indicator */}
              <div className="px-2 text-xs font-medium text-foreground">
                <span className="text-primary font-semibold">{currentPage}</span> / {totalPages}
              </div>

              {/* Next Page */}
              <Tooltip content="Pagina successiva">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2.5 border-border text-foreground disabled:opacity-30 flex items-center gap-1"
                >
                  <span className="hidden sm:inline text-xs">Succ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Tooltip>

              {/* Last Page */}
              <Tooltip content="Ultima pagina">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 border-border text-foreground disabled:opacity-30"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </Button>
              </Tooltip>
            </div>
          )}
        </div>
      </Card>

      {/* Modal Add / Edit Transaction */}
      <Dialog
        open={isAddModalOpen || editingTransaction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingTransaction(null);
          }
        }}
      >
        <DialogContent className="bg-card border-border text-card-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base text-foreground flex items-center gap-2">
              {editingTransaction ? <Edit2 className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
              {editingTransaction ? 'Modifica Transazione' : 'Nuova Transazione Manuale'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              I dati vengono salvati direttamente nel Vault cifrato (AES-256-GCM).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTransaction} className="space-y-4 py-2 text-xs">
            {/* Type selector (Entrata / Uscita) */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formType === 'expense' ? 'default' : 'outline'}
                onClick={() => setFormType('expense')}
                className={`flex-1 text-xs py-2 ${
                  formType === 'expense'
                    ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                    : 'border-border text-foreground'
                }`}
              >
                Uscita / Spesa (-)
              </Button>
              <Button
                type="button"
                variant={formType === 'income' ? 'default' : 'outline'}
                onClick={() => setFormType('income')}
                className={`flex-1 text-xs py-2 ${
                  formType === 'income'
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    : 'border-border text-foreground'
                }`}
              >
                Entrata / Accredito (+)
              </Button>
            </div>

            {/* Date, Channel & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
              <div className="space-y-1">
                <Label htmlFor="tx-form-date" className="text-xs text-foreground font-medium flex items-center gap-1 h-5">
                  <span>Data</span>
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tx-form-date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="bg-background border-input text-foreground text-xs h-9 w-full"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="tx-form-channel" className="text-xs text-foreground font-medium flex items-center gap-1 h-5">
                  <span>Canale</span>
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formChannel}
                  onValueChange={(val) => setFormChannel(val as any)}
                >
                  <SelectTrigger id="tx-form-channel" className="h-9 text-xs w-full">
                    <SelectValue placeholder="Seleziona Canale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BancoBPM">Banco BPM</SelectItem>
                    <SelectItem value="Numia">Carta Numia</SelectItem>
                    <SelectItem value="Nexi">Carta Nexi</SelectItem>
                    <SelectItem value="PayPal">PayPal</SelectItem>
                    <SelectItem value="Satispay">Satispay</SelectItem>
                    <SelectItem value="Contanti">Contanti</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="tx-form-amount" className="text-xs text-foreground font-medium flex items-center gap-1 h-5">
                  <span>Importo (€)</span>
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tx-form-amount"
                  type="text"
                  placeholder="0.00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  required
                  className="bg-background border-input text-foreground font-mono text-xs h-9 w-full"
                />
              </div>
            </div>

            {/* Macro-Category & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <div className="space-y-1">
                <Label htmlFor="tx-form-macro" className="text-xs text-foreground font-medium flex items-center gap-1 h-5">
                  <span>Macro Categoria</span>
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formMacroCategory}
                  onValueChange={(val) => setFormMacroCategory(val as any)}
                >
                  <SelectTrigger id="tx-form-macro" className="h-9 text-xs w-full">
                    <SelectValue placeholder="Seleziona Macro Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Needs">Bisogni Primari & Casa</SelectItem>
                    <SelectItem value="Commitments">Rate & Finanziamenti</SelectItem>
                    <SelectItem value="Wants">Stile di Vita & Shopping</SelectItem>
                    <SelectItem value="Savings">Risparmio & Previdenza</SelectItem>
                    <SelectItem value="Extraordinary">Spese Straordinarie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="tx-form-category" className="text-xs text-foreground font-medium flex items-center gap-1 h-5">
                  <span>Categoria Specifica</span>
                </Label>
                <Input
                  id="tx-form-category"
                  placeholder="es. Supermercato, Utenze Luce, Ristorante..."
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="bg-background border-input text-foreground text-xs h-9 w-full"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="tx-form-desc" className="text-xs text-foreground font-medium flex items-center gap-1 h-5">
                <span>Descrizione / Merchant / Causale</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tx-form-desc"
                placeholder="es. Esselunga spesa settimanale, Cena pizzeria..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                required
                className="bg-background border-input text-foreground text-xs h-9 w-full"
              />
            </div>

            {/* Tags & Extraordinary Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div className="space-y-1">
                <Label htmlFor="tx-form-tags" className="text-xs text-foreground font-medium flex items-center gap-1 h-5">
                  <span>Tag (separati da virgola)</span>
                </Label>
                <Input
                  id="tx-form-tags"
                  placeholder="#spesa, #weekend, #utenze"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="bg-background border-input text-foreground text-xs h-9 w-full"
                />
              </div>

              <div className="h-9 flex items-center gap-2.5 px-3 rounded-md border border-input/60 bg-muted/20 hover:bg-muted/30 transition-colors">
                <Checkbox
                  id="extraordinary_chk"
                  checked={formIsExtraordinary}
                  onCheckedChange={(checked) => setFormIsExtraordinary(Boolean(checked))}
                />
                <Label htmlFor="extraordinary_chk" className="text-foreground text-xs cursor-pointer font-normal select-none truncate">
                  Escludi dal cash flow ordinario (Straordinaria)
                </Label>
              </div>
            </div>

            <DialogFooter className="pt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingTransaction(null);
                }}
                className="border-border text-foreground text-xs"
              >
                Annulla
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs py-2 px-4"
              >
                Salva Transazione
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="bg-card border-border text-card-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base text-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              Conferma Eliminazione
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              Sei sicuro di voler rimuovere questa transazione dal Vault? L'operazione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-3">
            <Button
              variant="outline"
              onClick={() => setDeletingId(null)}
              className="border-border text-foreground text-xs"
            >
              Annulla
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs"
            >
              Elimina Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Rules Manager Dialog */}
      <CategoryRulesManager
        open={isRulesModalOpen}
        onOpenChange={setIsRulesModalOpen}
        rules={rules}
        transactions={transactions}
        onSaveRule={onSaveRule || (() => {})}
        onDeleteRule={onDeleteRule || (() => {})}
        onToggleRule={onToggleRule || (() => {})}
        onApplyRulesToAll={onApplyRulesToAll || (() => ({ modifiedCount: 0 }))}
        initialPrefilledRule={prefilledRule}
      />
    </div>
  );
};
