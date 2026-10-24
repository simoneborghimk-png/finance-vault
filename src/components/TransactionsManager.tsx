import React, { useState, useMemo } from 'react';
import { Transaction, MacroCategory } from '@/types/finance';
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
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Check
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
  Checkbox
} from './ui';

interface TransactionsManagerProps {
  transactions: Transaction[];
  onAddTransaction: (transaction: Transaction) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
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
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
}) => {
  // Filtering & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMacro, setSelectedMacro] = useState<string>('ALL');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Modals states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

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

  // Distinct months list
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        set.add(t.date.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

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

      // Channel
      if (selectedChannel !== 'ALL' && t.channel !== selectedChannel) {
        return false;
      }

      // Month
      if (selectedMonth !== 'ALL' && !t.date.startsWith(selectedMonth)) {
        return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [transactions, searchTerm, selectedMacro, selectedChannel, selectedMonth, sortBy]);

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
            Registro Movimenti & Transazioni
          </h2>
          <p className="text-xs text-muted-foreground">
            Consulta, ricerca, correggi categorie o aggiungi nuove uscite/entrate nel Vault cifrato
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs py-2 px-3.5 flex items-center gap-1.5 shrink-0 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Nuova Transazione</span>
        </Button>
      </div>

      {/* KPI Stats pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-card border-border p-3">
          <p className="text-[11px] text-muted-foreground font-medium">Movimenti Filtrati</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{stats.count}</p>
        </Card>
        <Card className="bg-card border-border p-3">
          <p className="text-[11px] text-primary font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Totale Entrate
          </p>
          <p className="text-lg font-bold text-primary mt-0.5">{formatEuro(stats.income)}</p>
        </Card>
        <Card className="bg-card border-border p-3">
          <p className="text-[11px] text-destructive font-medium flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> Totale Uscite
          </p>
          <p className="text-lg font-bold text-destructive mt-0.5">{formatEuro(stats.expenses)}</p>
        </Card>
        <Card className="bg-card border-border p-3">
          <p className="text-[11px] text-foreground font-medium">Saldo Netto Periodo</p>
          <p className={`text-lg font-bold mt-0.5 ${stats.balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {formatEuro(stats.balance)}
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-card border-border p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search text input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cerca per descrizione, merchant, categoria o tag (#utenze)..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
              className="pl-9 bg-background border-input text-xs text-foreground placeholder:text-muted-foreground h-9"
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

          {/* Quick Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Macro Category Filter */}
            <select
              value={selectedMacro}
              onChange={(e) => handleFilterChange(setSelectedMacro, e.target.value)}
              className="bg-background border border-input rounded-md text-xs text-foreground px-2.5 py-2 focus:ring-1 focus:ring-ring outline-none"
            >
              <option value="ALL">Tutte le Macro-Categorie</option>
              <option value="Needs">Needs (Bisogni Primari)</option>
              <option value="Commitments">Commitments (Rate & Fissi)</option>
              <option value="Wants">Wants (Stile di Vita)</option>
              <option value="Savings">Savings (Risparmio)</option>
              <option value="Extraordinary">Extraordinary (Straordinarie)</option>
            </select>

            {/* Channel Filter */}
            <select
              value={selectedChannel}
              onChange={(e) => handleFilterChange(setSelectedChannel, e.target.value)}
              className="bg-background border border-input rounded-md text-xs text-foreground px-2.5 py-2 focus:ring-1 focus:ring-ring outline-none"
            >
              <option value="ALL">Tutti i Canali</option>
              <option value="BancoBPM">Banco BPM</option>
              <option value="Numia">Carta Numia</option>
              <option value="PayPal">PayPal</option>
              <option value="Satispay">Satispay</option>
              <option value="Contanti">Contanti</option>
            </select>

            {/* Month Filter */}
            <select
              value={selectedMonth}
              onChange={(e) => handleFilterChange(setSelectedMonth, e.target.value)}
              className="bg-background border border-input rounded-md text-xs text-foreground px-2.5 py-2 focus:ring-1 focus:ring-ring outline-none"
            >
              <option value="ALL">Tutti i Mesi</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-background border border-input rounded-md text-xs text-foreground px-2.5 py-2 focus:ring-1 focus:ring-ring outline-none"
            >
              <option value="date-desc">Data più recente</option>
              <option value="date-asc">Data meno recente</option>
              <option value="amount-desc">Importo più alto</option>
              <option value="amount-asc">Importo più basso</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Transactions Table Card */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-semibold text-xs w-28">Data</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-xs w-28">Canale</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-xs">Descrizione & Tag</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-xs w-44">Macro / Categoria</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-xs text-right w-32">Importo</TableHead>
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
                        <TableCell className="font-mono text-xs text-foreground align-middle">
                          <div className="flex items-center gap-1.5">
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                                isExpanded ? 'rotate-180 text-primary' : ''
                              }`}
                            />
                            <span>{tx.date}</span>
                          </div>
                        </TableCell>

                        {/* Channel */}
                        <TableCell className="align-middle">
                          <div className="flex items-center gap-1.5 text-xs text-foreground">
                            {CHANNEL_ICONS[tx.channel]}
                            <span>{tx.channel}</span>
                          </div>
                        </TableCell>

                        {/* Description */}
                        <TableCell className="max-w-md align-middle">
                          <Tooltip content={tx.description}>
                            <p className="text-xs font-medium text-foreground truncate max-w-sm">
                              {tx.description}
                            </p>
                          </Tooltip>
                        </TableCell>

                        {/* Category & Macro */}
                        <TableCell className="align-middle">
                          <div className="space-y-0.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0.5 border ${style.border} ${style.bg} ${style.text}`}
                            >
                              {tx.macroCategory}
                            </Badge>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                              {tx.category}
                            </p>
                          </div>
                        </TableCell>

                        {/* Amount */}
                        <TableCell className={`text-right font-mono text-xs font-semibold align-middle ${tx.amount > 0 ? 'text-primary' : 'text-foreground'}`}>
                          {tx.amount > 0 ? `+${formatEuro(tx.amount)}` : formatEuro(tx.amount)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-center align-middle" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
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

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
            <div>
              Mostrando pagina <span className="font-semibold text-foreground">{currentPage}</span> di{' '}
              <span className="font-semibold text-foreground">{totalPages}</span> ({filteredTransactions.length} movimenti)
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 border-border text-foreground disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Precedente</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 border-border text-foreground disabled:opacity-40"
              >
                <span>Successiva</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="tx-form-date" className="text-foreground font-medium">
                  Data (AAAA-MM-GG) <span className="text-destructive">*</span>
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
                <Label htmlFor="tx-form-channel" className="text-foreground font-medium">
                  Canale <span className="text-destructive">*</span>
                </Label>
                <select
                  id="tx-form-channel"
                  value={formChannel}
                  onChange={(e) => setFormChannel(e.target.value as any)}
                  className="w-full bg-background border border-input rounded-md text-xs text-foreground px-2.5 h-9 focus:ring-1 focus:ring-ring outline-none"
                >
                  <option value="BancoBPM">Banco BPM</option>
                  <option value="Numia">Carta Numia</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Satispay">Satispay</option>
                  <option value="Contanti">Contanti</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="tx-form-amount" className="text-foreground font-medium">
                  Importo (€) <span className="text-destructive">*</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="tx-form-macro" className="text-foreground font-medium">
                  Macro Categoria <span className="text-destructive">*</span>
                </Label>
                <select
                  id="tx-form-macro"
                  value={formMacroCategory}
                  onChange={(e) => setFormMacroCategory(e.target.value as any)}
                  className="w-full bg-background border border-input rounded-md text-xs text-foreground px-2.5 h-9 focus:ring-1 focus:ring-ring outline-none"
                >
                  <option value="Needs">Needs (Bisogni Primari & Casa)</option>
                  <option value="Commitments">Commitments (Rate & Fissi)</option>
                  <option value="Wants">Wants (Stile di Vita & Tempo Libero)</option>
                  <option value="Savings">Savings (Risparmio & Investimento)</option>
                  <option value="Extraordinary">Extraordinary (Spesa Straordinaria)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="tx-form-category" className="text-foreground font-medium">Categoria Specifica</Label>
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
              <Label htmlFor="tx-form-desc" className="text-foreground font-medium">
                Descrizione / Merchant / Causale <span className="text-destructive">*</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label htmlFor="tx-form-tags" className="text-foreground font-medium">Tag (separati da virgola)</Label>
                <Input
                  id="tx-form-tags"
                  placeholder="#spesa, #weekend, #utenze"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="bg-background border-input text-foreground text-xs h-9 w-full"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="extraordinary_chk"
                  checked={formIsExtraordinary}
                  onCheckedChange={(checked) => setFormIsExtraordinary(Boolean(checked))}
                />
                <Label htmlFor="extraordinary_chk" className="text-foreground text-xs cursor-pointer font-normal">
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
    </div>
  );
};
