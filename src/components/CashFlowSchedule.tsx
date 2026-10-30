import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Wallet,
  CreditCard,
  Building2,
  Sparkles,
  ShieldCheck,
  Check,
  RotateCcw,
  Filter,
  Flame,
  Zap,
  Repeat,
  Tv,
  Coins,
  ChevronDown,
  CalendarDays,
  List,
  X,
} from 'lucide-react';
import {
  Transaction,
  RecurringExpense,
  UserFinancialProfile,
  RecurringOverride,
} from '@/types/finance';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Button,
  Progress,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui';
import {
  buildMonthlyCashFlowSchedule,
  CashFlowEvent,
  formatEuro,
} from '@/lib/cashFlowScheduler';
import { getAvailableMonths } from '@/lib/financialAdvisor';

interface CashFlowScheduleProps {
  expenses: RecurringExpense[];
  transactions: Transaction[];
  profile?: UserFinancialProfile;
  getEntityVisual?: (item: any) => {
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    badgeLabel: string;
    hex: string;
  };
}

const WEEKDAY_NAMES = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

export const CashFlowSchedule: React.FC<CashFlowScheduleProps> = ({
  expenses,
  transactions,
  profile,
  getEntityVisual,
}) => {
  // Lista mesi disponibili
  const availableMonths = useMemo(() => getAvailableMonths(transactions), [transactions]);

  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentDay = now.getDate();

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return availableMonths.includes(currentYm) ? currentYm : availableMonths[0] || currentYm;
  });

  // Switch modalità visualizzazione: Calendario a griglia o Lista cronologica
  const [displayMode, setDisplayMode] = useState<'calendar' | 'timeline'>('calendar');

  // Giorno del calendario selezionato dall'utente per ispezione
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);

  // Filtro canale attivo
  const [selectedChannel, setSelectedChannel] = useState<string>('all');

  // Filtro stato (tutti, solo pending, solo pagati)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');

  // Calcolo dati scadenziario
  const schedule = useMemo(() => {
    return buildMonthlyCashFlowSchedule(expenses, transactions, selectedMonth, profile);
  }, [expenses, transactions, selectedMonth, profile]);

  const isCurrentMonth = selectedMonth === currentYm;

  // Navigazione mese precedente / successivo
  const handlePrevMonth = () => {
    setSelectedDayNumber(null);
    const idx = availableMonths.indexOf(selectedMonth);
    if (idx < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[idx + 1]);
    } else {
      const [y, m] = selectedMonth.split('-');
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 2, 1);
      const prevYm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(prevYm);
    }
  };

  const handleNextMonth = () => {
    setSelectedDayNumber(null);
    const idx = availableMonths.indexOf(selectedMonth);
    if (idx > 0) {
      setSelectedMonth(availableMonths[idx - 1]);
    } else {
      const [y, m] = selectedMonth.split('-');
      const d = new Date(parseInt(y, 10), parseInt(m, 10), 1);
      const nextYm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(nextYm);
    }
  };

  // Filtraggio eventi per la lista cronologica
  const filteredEvents = useMemo(() => {
    return schedule.eventsList.filter((ev) => {
      if (selectedChannel !== 'all' && ev.channel !== selectedChannel) return false;
      if (statusFilter === 'pending' && ev.status === 'paid') return false;
      if (statusFilter === 'paid' && ev.status !== 'paid') return false;
      return true;
    });
  }, [schedule.eventsList, selectedChannel, statusFilter]);

  // Costruzione della Matrice Calendario Europea a 7 Colonne (LUN-DOM)
  const calendarDays = useMemo(() => {
    const [yStr, mStr] = selectedMonth.split('-');
    const year = parseInt(yStr, 10);
    const monthNum = parseInt(mStr, 10); // 1-12
    const totalDays = new Date(year, monthNum, 0).getDate();

    // Giorno della settimana del 1° del mese (0=Dom, 1=Lun, ..., 6=Sab)
    const firstDayIndex = new Date(year, monthNum - 1, 1).getDay();
    // Offset Europeo: Lunedì = 0, Domenica = 6
    const startPadding = (firstDayIndex + 6) % 7;

    const days: Array<{
      dayNumber: number | null;
      dateString: string | null;
      events: CashFlowEvent[];
      totalOutgoing: number;
      totalIncome: number;
      hasSalary: boolean;
      hasPending: boolean;
      hasDueSoon: boolean;
    }> = [];

    // Padding giorni mese precedente
    for (let i = 0; i < startPadding; i++) {
      days.push({
        dayNumber: null,
        dateString: null,
        events: [],
        totalOutgoing: 0,
        totalIncome: 0,
        hasSalary: false,
        hasPending: false,
        hasDueSoon: false,
      });
    }

    // Giorni 1..totalDays
    for (let d = 1; d <= totalDays; d++) {
      const dateString = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      const dayEvents = schedule.eventsByDay[d] || [];
      const filteredDayEvents = dayEvents.filter((ev) => {
        if (selectedChannel !== 'all' && ev.channel !== selectedChannel) return false;
        if (statusFilter === 'pending' && ev.status === 'paid') return false;
        if (statusFilter === 'paid' && ev.status !== 'paid') return false;
        return true;
      });

      const totalOutgoing = filteredDayEvents
        .filter((e) => !e.isSalary)
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);
      const totalIncome = filteredDayEvents
        .filter((e) => e.isSalary)
        .reduce((sum, e) => sum + e.amount, 0);

      const hasSalary = filteredDayEvents.some((e) => e.isSalary);
      const hasPending = filteredDayEvents.some((e) => !e.isSalary && e.status !== 'paid');
      const hasDueSoon = filteredDayEvents.some((e) => e.status === 'today' || e.status === 'due_soon');

      days.push({
        dayNumber: d,
        dateString,
        events: filteredDayEvents,
        totalOutgoing,
        totalIncome,
        hasSalary,
        hasPending,
        hasDueSoon,
      });
    }

    // Padding per completare l'ultima settimana a multiplo di 7
    while (days.length % 7 !== 0) {
      days.push({
        dayNumber: null,
        dateString: null,
        events: [],
        totalOutgoing: 0,
        totalIncome: 0,
        hasSalary: false,
        hasPending: false,
        hasDueSoon: false,
      });
    }

    return days;
  }, [selectedMonth, schedule.eventsByDay, selectedChannel, statusFilter]);

  // Eventi del giorno selezionato nel calendario
  const selectedDayEvents = useMemo(() => {
    if (selectedDayNumber === null) return null;
    const dayData = calendarDays.find((d) => d.dayNumber === selectedDayNumber);
    return dayData ? dayData.events : [];
  }, [selectedDayNumber, calendarDays]);

  const channelBadgeColor: Record<string, string> = {
    BancoBPM: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    Numia: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    Nexi: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    PayPal: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    Satispay: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    Contanti: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ========================================================================= */}
        {/* BARRA NAVIGAZIONE MESE & SUB-TOGGLE VISTA (CALENDARIO vs LISTA)           */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card/60 border border-border p-3 rounded-xl">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Navigatore Mese: < [ Mese Anno ] > */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevMonth}
                className="h-8 w-8 rounded-lg hover:border-primary/40"
                aria-label="Mese precedente"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="text-sm font-bold text-foreground min-w-32 px-1 text-center select-none">
                {schedule.monthLabel}
              </span>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                className="h-8 w-8 rounded-lg hover:border-primary/40"
                aria-label="Mese successivo"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Indicazioni Aggiuntive e Bottone Ritorno a Oggi a seguire */}
            {isCurrentMonth ? (
              <Badge className="bg-primary/15 text-primary border border-primary/30 text-[10px] py-1 px-2.5 font-medium">
                Mese Corrente (Oggi è il {currentDay})
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedMonth(currentYm);
                  setSelectedDayNumber(null);
                }}
                className="h-8 text-xs px-2.5 text-muted-foreground hover:text-foreground border-border hover:border-primary/40"
              >
                Torna a Oggi
              </Button>
            )}
          </div>

          {/* Filtri Canale e Sub-Toggle Visualizzazione */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sub-Toggle Calendario vs Lista */}
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setDisplayMode('calendar')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                  displayMode === 'calendar'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Calendario Griglia</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('timeline')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                  displayMode === 'timeline'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Lista Timeline</span>
              </button>
            </div>

            {/* Filtro Stato */}
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-1 rounded-md transition-all font-medium ${
                  statusFilter === 'all'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Tutti ({schedule.eventsCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-2 py-1 rounded-md transition-all font-medium ${
                  statusFilter === 'pending'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                In Coda ({schedule.pendingEventsCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('paid')}
                className={`px-2 py-1 rounded-md transition-all font-medium ${
                  statusFilter === 'paid'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Contabilizzati
              </button>
            </div>

            {/* Filtro Canale */}
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="h-8 text-xs bg-card border border-border rounded-lg px-2 text-foreground focus:outline-none cursor-pointer"
            >
              <option value="all">Tutti i Canali</option>
              <option value="BancoBPM">Banco BPM</option>
              <option value="Numia">Carta Numia</option>
              <option value="Nexi">Carta Nexi</option>
              <option value="PayPal">PayPal</option>
              <option value="Satispay">Satispay</option>
              <option value="Contanti">Contanti</option>
            </select>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MINI-CRUSCOTTO DI CASSA & SICUREZZA PRE-STIPENDIO                         */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Totale Uscite Mese */}
          <Card className="bg-card/70 border-border shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">Uscite Fisse Totali</CardTitle>
              <div className="p-1 rounded-md bg-muted text-muted-foreground">
                <Repeat className="w-3.5 h-3.5" />
              </div>
            </CardHeader>
            <CardContent className="p-3.5 pt-1 space-y-1">
              <div className="text-xl font-bold font-mono text-foreground">
                {formatEuro(schedule.totalExpectedOutgoings)}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {schedule.eventsCount - 1} addebiti previsti nel mese
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Già Addebitati */}
          <Card className="bg-card/70 border-border shadow-xs hover:border-emerald-500/40 transition-colors">
            <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">Già Contabilizzati</CardTitle>
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </CardHeader>
            <CardContent className="p-3.5 pt-1 space-y-1">
              <div className="text-xl font-bold font-mono text-emerald-400">
                {formatEuro(schedule.totalPaidOutgoings)}
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Completamento:</span>
                <span className="font-mono font-medium text-foreground">
                  {schedule.totalExpectedOutgoings > 0
                    ? Math.round((schedule.totalPaidOutgoings / schedule.totalExpectedOutgoings) * 100)
                    : 100}
                  %
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Ancora da Addebitare */}
          <Card className={`border shadow-xs transition-colors ${
            schedule.totalPendingOutgoings > 0 ? 'bg-card/70 border-border hover:border-amber-500/40' : 'bg-card/40 border-border'
          }`}>
            <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">Ancora in Coda (Pending)</CardTitle>
              <div className={`p-1 rounded-md ${schedule.totalPendingOutgoings > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                <Clock className="w-3.5 h-3.5" />
              </div>
            </CardHeader>
            <CardContent className="p-3.5 pt-1 space-y-1">
              <div className={`text-xl font-bold font-mono ${schedule.totalPendingOutgoings > 0 ? 'text-amber-400' : 'text-foreground'}`}>
                {formatEuro(schedule.totalPendingOutgoings)}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {schedule.pendingEventsCount} addebiti rimanenti
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Saldo Minimo Pre-Stipendio */}
          <Card className="bg-primary/5 border-primary/30 shadow-xs">
            <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-primary">Saldo Minimo Pre-Stipendio</CardTitle>
              <div className="p-1 rounded-md bg-primary/10 text-primary">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </CardHeader>
            <CardContent className="p-3.5 pt-1 space-y-1">
              <div className="text-xl font-bold font-mono text-foreground">
                {formatEuro(schedule.safetyBufferPreSalary)}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Buffer da tenere su BPM prima dello stipendio (il {schedule.salaryDay})
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* VISTA 1: CALENDARIO MENSILE A GRIGLIA (7 Colonne LUN - DOM)               */}
        {/* ========================================================================= */}
        {displayMode === 'calendar' ? (
          <div className="space-y-4">
            <Card className="bg-card/70 border-border p-3 sm:p-4 shadow-xs">
              {/* Intestazione Colonne Lunedì - Domenica */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
                {WEEKDAY_NAMES.map((wName, i) => (
                  <div
                    key={wName}
                    className={`text-center py-1.5 text-[11px] font-bold rounded-lg border ${
                      i >= 5 ? 'text-muted-foreground/70 bg-muted/20 border-border/40' : 'text-muted-foreground bg-muted/40 border-border/60'
                    }`}
                  >
                    {wName}
                  </div>
                ))}
              </div>

              {/* Griglia Giorni */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarDays.map((cell, idx) => {
                  if (cell.dayNumber === null) {
                    return (
                      <div
                        key={`pad-${idx}`}
                        className="min-h-[85px] sm:min-h-[110px] rounded-xl border border-dashed border-border/30 bg-muted/5 opacity-30 select-none"
                      />
                    );
                  }

                  const d = cell.dayNumber;
                  const isToday = isCurrentMonth && d === currentDay;
                  const isPast = isCurrentMonth ? d < currentDay : schedule.month < currentYm;
                  const isSelected = selectedDayNumber === d;

                  return (
                    <div
                      key={`day-${d}`}
                      onClick={() => setSelectedDayNumber(isSelected ? null : d)}
                      className={`min-h-[85px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/50 bg-primary/10 shadow-md'
                          : isToday
                          ? 'border-amber-400/80 bg-amber-500/10 ring-1 ring-amber-400/30'
                          : cell.hasSalary
                          ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60'
                          : cell.events.length > 0
                          ? 'border-border bg-card hover:border-primary/40'
                          : 'border-border/50 bg-card/40 hover:bg-card/70'
                      } ${isPast && !isToday && !isSelected ? 'opacity-85' : ''}`}
                    >
                      {/* Top Header Cella: Numero Giorno + Somma Giorno */}
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`font-mono text-xs font-bold w-5 h-5 rounded-md flex items-center justify-center ${
                            isToday
                              ? 'bg-amber-400 text-black'
                              : isSelected
                              ? 'bg-primary text-primary-foreground'
                              : cell.hasSalary
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isPast
                              ? 'text-muted-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {d}
                        </span>

                        {cell.totalOutgoing > 0 && (
                          <span className="font-mono text-[10px] text-muted-foreground font-medium hidden sm:inline">
                            -{formatEuro(cell.totalOutgoing)}
                          </span>
                        )}
                      </div>

                      {/* Eventi all'interno della Cella */}
                      <div className="space-y-1 my-1 overflow-hidden">
                        {cell.events.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate flex items-center justify-between gap-1 border ${
                              ev.isSalary
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                                : ev.status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : ev.status === 'today' || ev.status === 'due_soon'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : ev.status === 'overdue'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-muted/60 text-foreground border-border/60'
                            }`}
                            title={`${ev.name}: ${formatEuro(ev.amount)} (${ev.channel})`}
                          >
                            <span className="truncate">{ev.name}</span>
                            <span className="font-mono shrink-0 hidden md:inline">
                              {ev.isSalary ? '+' : ''}{formatEuro(ev.amount)}
                            </span>
                          </div>
                        ))}

                        {cell.events.length > 2 && (
                          <div className="text-[9px] text-muted-foreground font-mono text-center">
                            +{cell.events.length - 2} altri
                          </div>
                        )}
                      </div>

                      {/* Bottom Footer Cella */}
                      <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                        {isToday && (
                          <span className="text-amber-400 font-semibold tracking-wider uppercase text-[8px]">
                            Oggi
                          </span>
                        )}
                        {cell.hasSalary && (
                          <span className="text-emerald-400 font-semibold text-[8px] ml-auto">
                            +Stipendio
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Dettaglio del Giorno Selezionato nel Calendario */}
            {selectedDayNumber !== null && (
              <Card className="bg-card border-primary/50 shadow-md p-4 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-foreground">
                      Dettaglio Movimenti del {selectedDayNumber} {schedule.monthLabel}
                    </span>
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                      {selectedDayEvents?.length || 0} movimenti
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDayNumber(null)}
                    className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {selectedDayEvents && selectedDayEvents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                          ev.isSalary
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                            : ev.status === 'paid'
                            ? 'bg-card/70 border-border text-foreground'
                            : 'bg-card border-border text-foreground'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            <span>{ev.name}</span>
                            <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${channelBadgeColor[ev.channel]}`}>
                              {ev.channel}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {ev.category} {ev.notes ? `• ${ev.notes}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono font-bold text-sm ${ev.isSalary ? 'text-emerald-400' : 'text-foreground'}`}>
                            {ev.isSalary ? '+' : ''}{formatEuro(ev.amount)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {ev.status === 'paid' ? 'Contabilizzato' : ev.status === 'today' ? 'In scadenza oggi!' : 'In attesa'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-2">
                    Nessun movimento programmato o rilevato per questo giorno.
                  </p>
                )}
              </Card>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* VISTA 2: TIMELINE CRONOLOGICA DEGLI EVENTI DEL MESE                       */
          /* ========================================================================= */
          <div className="space-y-2.5">
            {filteredEvents.length === 0 ? (
              <Card className="bg-card/40 border-border p-8 text-center text-muted-foreground text-xs space-y-2">
                <AlertCircle className="w-6 h-6 mx-auto text-muted-foreground/60" />
                <p>Nessun addebito o evento programmato per i filtri selezionati in questo mese.</p>
              </Card>
            ) : (
              filteredEvents.map((ev) => {
                const isSalary = ev.isSalary;
                const isToday = isCurrentMonth && ev.day === currentDay;
                const isPast = isCurrentMonth ? ev.day < currentDay : schedule.month < currentYm;

                const eventDateObj = new Date(parseInt(ev.date.slice(0, 4), 10), parseInt(ev.date.slice(5, 7), 10) - 1, ev.day);
                const dayOfWeek = eventDateObj.toLocaleDateString('it-IT', { weekday: 'short' });

                return (
                  <div
                    key={ev.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isSalary
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xs'
                        : isToday
                        ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20 shadow-xs'
                        : ev.status === 'paid'
                        ? 'bg-card/50 border-border/60 opacity-80 hover:opacity-100'
                        : ev.status === 'overdue'
                        ? 'bg-rose-500/5 border-rose-500/30'
                        : 'bg-card border-border hover:border-border/80'
                    }`}
                  >
                    {/* Left: Giorno, Icona & Nome */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                          isSalary
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : isToday
                            ? 'bg-amber-500 text-black font-bold border-amber-400'
                            : isPast
                            ? 'bg-muted/50 border-border text-muted-foreground'
                            : 'bg-card border-border text-foreground'
                        }`}
                      >
                        <span className="text-[9px] font-semibold tracking-wider leading-none">
                          {dayOfWeek.slice(0, 3).toUpperCase()}
                        </span>
                        <span className="text-base font-bold font-mono leading-tight">
                          {ev.day}
                        </span>
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-semibold truncate ${isSalary ? 'text-emerald-400 font-bold' : 'text-foreground'}`}>
                            {ev.name}
                          </span>

                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0 px-1.5 font-mono ${channelBadgeColor[ev.channel] || 'bg-muted text-muted-foreground'}`}
                          >
                            {ev.channel}
                          </Badge>

                          <span className="text-[11px] text-muted-foreground hidden sm:inline">
                            • {ev.category}
                          </span>
                        </div>

                        {ev.notes && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {ev.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Importo & Stato */}
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <div className="hidden sm:block">
                        {ev.status === 'paid' && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Contabilizzato</span>
                          </Badge>
                        )}
                        {ev.status === 'today' && (
                          <Badge className="text-[10px] bg-amber-500 text-black font-semibold animate-pulse">
                            In scadenza oggi!
                          </Badge>
                        )}
                        {ev.status === 'due_soon' && (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-300 border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>In Scadenza</span>
                          </Badge>
                        )}
                        {ev.status === 'overdue' && (
                          <Badge variant="outline" className="text-[10px] bg-rose-500/15 text-rose-300 border-rose-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Non Riscontrato</span>
                          </Badge>
                        )}
                        {ev.status === 'pending' && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Programmato
                          </Badge>
                        )}
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-sm sm:text-base font-bold font-mono ${
                            isSalary ? 'text-emerald-400' : 'text-foreground'
                          }`}
                        >
                          {isSalary ? '+' : ''}{formatEuro(ev.amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
