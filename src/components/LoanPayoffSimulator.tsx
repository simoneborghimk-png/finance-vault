import React, { useState, useMemo } from 'react';
import {
  RecurringExpense,
  UserFinancialProfile,
} from '@/types/finance';
import {
  extractActiveLoans,
  runPayoffSimulation,
  formatMonthYearLabel,
  SimLoanItem,
  PayoffStrategy,
} from '@/lib/loanPayoffSimulator';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Repeat,
  TrendingUp,
  CheckCircle2,
  Zap,
  Snowflake,
  SlidersHorizontal,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LoanPayoffSimulatorProps {
  expenses: RecurringExpense[];
  profile?: UserFinancialProfile;
  onApplyPayoffToVault?: (loanIds: string[]) => void;
}

const formatEuro = (amount: number): string => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const LoanPayoffSimulator: React.FC<LoanPayoffSimulatorProps> = ({
  expenses,
  profile,
  onApplyPayoffToVault,
}) => {
  // Estrai i prestiti attivi con debito residuo
  const activeLoans = useMemo(() => extractActiveLoans(expenses), [expenses]);

  // Debito totale base
  const totalDebt = useMemo(
    () => Math.round(activeLoans.reduce((sum, l) => sum + l.remainingDebt, 0) * 100) / 100,
    [activeLoans]
  );

  // Stato simulazione
  const [strategy, setStrategy] = useState<PayoffStrategy>('cashflow');
  const [allocatedLiquidity, setAllocatedLiquidity] = useState<number>(() => {
    // Default: prova a pre-allocare una cifra realistica (es. 1.000 € o la 14ª, se < totalDebt)
    const defaultPreset = profile?.extraSalaries?.fourteenthNetJune || 1000;
    return Math.min(totalDebt, Math.max(0, defaultPreset));
  });
  const [customSelectedIds, setCustomSelectedIds] = useState<string[]>([]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [applySuccessFeedback, setApplySuccessFeedback] = useState(false);

  // Esecuzione del calcolo di simulazione
  const simulation = useMemo(() => {
    return runPayoffSimulation(
      activeLoans,
      allocatedLiquidity,
      strategy,
      customSelectedIds
    );
  }, [activeLoans, allocatedLiquidity, strategy, customSelectedIds]);

  // ID dei prestiti completamente estinti nella simulazione corrente
  const fullyPaidLoanIds = useMemo(() => {
    return simulation.loanOutcomes
      .filter((o) => o.status === 'fully_paid')
      .map((o) => o.loan.id);
  }, [simulation.loanOutcomes]);

  // Gestione toggle personalizzato
  const toggleCustomLoan = (id: string) => {
    setCustomSelectedIds((prev) => {
      const isSelected = prev.includes(id);
      const next = isSelected ? prev.filter((item) => item !== id) : [...prev, id];
      // Se siamo in modalità personalizzata e la liquidità allocata era 0 o diversa,
      // allinea la liquidità alla somma esatta dei debiti selezionati per comodità
      if (strategy === 'custom') {
        const sumSelected = activeLoans
          .filter((l) => next.includes(l.id))
          .reduce((acc, l) => acc + l.remainingDebt, 0);
        setAllocatedLiquidity(Math.round(sumSelected * 100) / 100);
      }
      return next;
    });
  };

  // Preset rapidi di liquidità
  const presets = useMemo(() => {
    const list: Array<{ label: string; amount: number; hint: string }> = [];

    if (profile?.extraSalaries?.fourteenthNetJune) {
      list.push({
        label: '14ª Mensilità (Giu)',
        amount: profile.extraSalaries.fourteenthNetJune,
        hint: 'Bonus estivo busta paga',
      });
    }

    if (profile?.extraSalaries?.thirteenthNetDec) {
      list.push({
        label: '13ª Mensilità (Dic)',
        amount: profile.extraSalaries.thirteenthNetDec,
        hint: 'Gratifica natalizia',
      });
    }

    if (profile?.extraSalaries?.taxRefund730) {
      list.push({
        label: 'Rimborso 730 (Lug/Ago)',
        amount: profile.extraSalaries.taxRefund730,
        hint: 'Credito IRPEF conguaglio',
      });
    }

    list.push({ label: '500 €', amount: 500, hint: 'Piccolo buffer straordinario' });
    list.push({ label: '1.000 €', amount: 1000, hint: 'Quota risparmio medio' });

    if (totalDebt > 0) {
      list.push({
        label: 'Estinzione Totale',
        amount: totalDebt,
        hint: 'Azzera tutti i finanziamenti',
      });
    }

    return list;
  }, [profile, totalDebt]);

  // Se nessun prestito attivo è presente nel vault
  if (activeLoans.length === 0) {
    return (
      <Card className="bg-card/60 border-border p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">Nessun Finanziamento Attivo</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Tutte le rate e i finanziamenti risultano completamente estinti o chiusi. Il tuo cash flow è libero da debiti rateali al consumo!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ========================================================================= */}
        {/* 1. HERO HEADER                                                            */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-primary/10 via-card/70 to-card/90 border border-primary/20 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border border-primary/40 text-xs px-2.5 py-0.5 flex items-center gap-1.5 font-medium">
                  <Zap className="w-3.5 h-3.5" />
                  Simulatore Debito Zero
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {activeLoans.length} finanziamenti in ammortamento
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Estinzione Anticipata Prestiti
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                Simula l'impiego strategico di liquidità straordinaria (14ª, 13ª, rimborso 730) per azzerare rate a tasso zero, abbattere le uscite fisse mensili e anticipare la libertà da debiti.
              </p>
            </div>

            {/* Quick Summary Pill */}
            <div className="bg-card/80 border border-border rounded-xl p-3 sm:text-right shrink-0">
              <div className="text-[11px] text-muted-foreground">Debito Residuo Totale</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-foreground">
                {formatEuro(totalDebt)}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                {formatEuro(simulation.baselineMonthlyRate)}/mese di rate
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. KPI METRICS CARDS (PRIMA vs DOPO)                                     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Card 1: Debito Residuo Proiettato */}
          <Card className="bg-card/70 border-border shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Debito Residuo
              </CardTitle>
              <div className="p-1 rounded-md bg-muted text-muted-foreground">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            </CardHeader>
            <CardContent className="p-3.5 pt-1 space-y-0.5">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">
                {formatEuro(simulation.simulatedTotalDebt)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {simulation.totalAllocated > 0 ? (
                  <span className="text-emerald-400 font-medium">
                    -{formatEuro(simulation.totalAllocated)} abbattuti
                  </span>
                ) : (
                  <span>Debito di partenza</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Nuova Rata Mensile */}
          <Card className="bg-card/70 border-border shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Rate Mensili
              </CardTitle>
              <div className="p-1 rounded-md bg-muted text-muted-foreground">
                <Repeat className="w-3.5 h-3.5" />
              </div>
            </CardHeader>
            <CardContent className="p-3.5 pt-1 space-y-0.5">
              <div className="text-xl font-bold font-mono tracking-tight text-foreground">
                {formatEuro(simulation.simulatedMonthlyRate)}
                <span className="text-xs font-normal text-muted-foreground ml-1">/mese</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {simulation.freedMonthlyCashFlow > 0 ? (
                  <span className="line-through">
                    Prima: {formatEuro(simulation.baselineMonthlyRate)}/m
                  </span>
                ) : (
                  <span>Costi fissi mensili</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Cash Flow Liberato Subito */}
          <Card className="bg-card/70 border-border shadow-xs hover:border-emerald-500/40 transition-colors">
            <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Cash Flow Liberato
              </CardTitle>
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </CardHeader>
            <CardContent className="p-3.5 pt-1 space-y-0.5">
              <div className="text-xl font-bold font-mono tracking-tight text-emerald-400">
                +{formatEuro(simulation.freedMonthlyCashFlow)}
                <span className="text-xs font-normal text-emerald-400/70 ml-1">/mese</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                +{formatEuro(simulation.annualCashFlowFreed)}/anno nel budget
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Traguardo Senza Debiti */}
          <Card className="bg-card/70 border-border shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Debito Zero
              </CardTitle>
              <div className="p-1 rounded-md bg-primary/10 text-primary">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </CardHeader>
            <CardContent className="p-3.5 pt-1 space-y-0.5">
              <div className="text-base sm:text-lg font-bold tracking-tight text-primary truncate">
                {formatMonthYearLabel(simulation.simulatedDebtFreeDate)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {simulation.monthsSaved > 0 ? (
                  <span className="text-primary font-medium">
                    ⚡ {simulation.monthsSaved} mesi prima del previsto!
                  </span>
                ) : (
                  <span>Scadenza: {formatMonthYearLabel(simulation.baselineDebtFreeDate)}</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* 3. PANNELLO DI CONTROLLO SIMULAZIONE (STRATEGIA & LIQUIDITÀ)              */}
        {/* ========================================================================= */}
        <Card className="bg-card/80 border-border p-4 sm:p-5 space-y-5">
          {/* Riga Superiore: Scelta Strategia */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
            <div>
              <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                1. Scegli la Strategia di Allocazione
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Ottimizza in base alla liberazione del cash flow o all'eliminazione rapida del numero di posizioni
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background/60 p-1 text-xs">
              {/* Cash Flow Maximizer */}
              <button
                type="button"
                onClick={() => setStrategy('cashflow')}
                className={`px-3 py-1.5 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                  strategy === 'cashflow'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Cash Flow Maximizer</span>
                <span className="text-[9px] bg-background/20 px-1 py-0.2 rounded font-normal">
                  Consigliata
                </span>
              </button>

              {/* Snowball */}
              <button
                type="button"
                onClick={() => setStrategy('snowball')}
                className={`px-3 py-1.5 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                  strategy === 'snowball'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Snowflake className="w-3.5 h-3.5" />
                <span>Metodo Snowball</span>
              </button>

              {/* Manual Selection */}
              <button
                type="button"
                onClick={() => {
                  setStrategy('custom');
                  if (customSelectedIds.length === 0) {
                    // Pre-seleziona il primo prestito per feedback immediato
                    setCustomSelectedIds([activeLoans[0].id]);
                  }
                }}
                className={`px-3 py-1.5 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                  strategy === 'custom'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Selezione Manuale</span>
              </button>
            </div>
          </div>

          {/* Riga Inferiore: Selezione Liquidità Straordinaria */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                  2. Definisci il Budget Straordinario da Allocare
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Inserisci l'importo o usa i preset per simulare l'assorbimento di 14ª, 13ª o 730
                </p>
              </div>

              {/* Input Numerico Diretto */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Importo:</span>
                <div className="relative w-36">
                  <Input
                    type="number"
                    min={0}
                    max={totalDebt}
                    step={10}
                    value={allocatedLiquidity}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(totalDebt, Number(e.target.value) || 0));
                      setAllocatedLiquidity(val);
                    }}
                    className="h-8 text-right font-mono font-bold pr-7 text-xs bg-card"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-muted-foreground pointer-events-none">
                    €
                  </span>
                </div>
              </div>
            </div>

            {/* Slider interattivo */}
            <div className="pt-2 px-1">
              <Slider
                value={[allocatedLiquidity]}
                min={0}
                max={totalDebt}
                step={25}
                onValueChange={(val) => setAllocatedLiquidity(val || 0)}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1 font-mono">
                <span>0,00 €</span>
                <span>50% ({formatEuro(totalDebt / 2)})</span>
                <span>Totale Debiti ({formatEuro(totalDebt)})</span>
              </div>
            </div>

            {/* Chip Preset Rapidi */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground mr-1">Preset veloci:</span>
              {presets.map((preset) => (
                <Tooltip key={preset.label}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        setAllocatedLiquidity(Math.min(totalDebt, preset.amount));
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all font-mono font-medium flex items-center gap-1 ${
                        Math.abs(allocatedLiquidity - preset.amount) < 1
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border'
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className="text-[10px] opacity-80">({formatEuro(preset.amount)})</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">{preset.hint}</p>
                  </TooltipContent>
                </Tooltip>
              ))}

              <button
                type="button"
                onClick={() => setAllocatedLiquidity(0)}
                className="text-xs px-2 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-auto"
              >
                Azzera
              </button>
            </div>
          </div>
        </Card>

        {/* ========================================================================= */}
        {/* 4. TABELLA / CARD DEI FINANZIAMENTI ATTIVI & ESITO SIMULAZIONE            */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Dettaglio Finanziamenti e Impatto Simulazione
              </h3>
              <p className="text-xs text-muted-foreground">
                {strategy === 'cashflow' &&
                  'Ordinati per Efficienza di Rata: estinguere per primi quelli con il miglior rapporto rata mensile / debito residuo.'}
                {strategy === 'snowball' &&
                  'Ordinati per Debito Residuo Crescente: estinguere per primi i saldi minori per liberare la mente da crediti aperti.'}
                {strategy === 'custom' &&
                  'Selezione Manuale: spunta le caselle per scegliere esattamente quali posizioni estinguere con il tuo budget.'}
              </p>
            </div>

            {/* Badge Prestiti Estinti */}
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                className={`text-xs px-2.5 py-1 font-medium ${
                  simulation.fullyPaidLoansCount > 0
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {simulation.fullyPaidLoansCount} su {activeLoans.length} estinti al 100%
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {simulation.loanOutcomes.map((outcome) => {
              const { loan, status, allocatedAmount, newRemainingDebt, newRemainingInstallments, freedMonthlyInstallment, newEndDate } = outcome;
              const isSelectedInCustom = customSelectedIds.includes(loan.id);

              return (
                <div
                  key={loan.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                    status === 'fully_paid'
                      ? 'bg-emerald-500/5 border-emerald-500/40 shadow-xs'
                      : status === 'partially_paid'
                      ? 'bg-amber-500/5 border-amber-500/40 shadow-xs'
                      : 'bg-card/70 border-border hover:border-border/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Lato Sinistro: Checkbox (se custom) + Nome + Dettagli Fornitore */}
                    <div className="flex items-start gap-3">
                      {strategy === 'custom' && (
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            checked={isSelectedInCustom}
                            onChange={() => toggleCustomLoan(loan.id)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
                            aria-label={`Seleziona ${loan.name} per estinzione anticipata`}
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {loan.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                            {loan.lender}
                          </Badge>
                          {loan.channel && (
                            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                              {loan.channel}
                            </Badge>
                          )}

                          {/* Efficiency Badge */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono flex items-center gap-1 cursor-help">
                                <Zap className="w-2.5 h-2.5" />
                                {loan.efficiencyRatio.toFixed(1)}% / mese
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p className="text-xs">
                                <strong>Indice di Efficienza Rata:</strong> ogni 100 € impiegati per estinguere questo debito liberano{' '}
                                <strong>{loan.efficiencyRatio.toFixed(2)} € ogni singolo mese</strong> dal bilancio fisso.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        {loan.notes && (
                          <p className="text-[11px] text-muted-foreground">
                            {loan.notes}
                          </p>
                        )}

                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3 pt-0.5 font-mono">
                          <span>
                            Rata: <strong>{formatEuro(loan.installmentAmount)}/m</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Rate: {loan.paidInstallments} pagate / <strong>{loan.remainingInstallments} rimanenti</strong> (di {loan.totalInstallments})
                          </span>
                          <span>•</span>
                          <span>
                            Scadenza naturale: <strong>{formatMonthYearLabel(loan.endDate)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lato Destro: Debito Attuale vs Esito Simulazione */}
                    <div className="flex flex-wrap sm:flex-col sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40 shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Debito Residuo</div>
                        <div className="text-sm font-bold font-mono text-foreground">
                          {status === 'fully_paid' ? (
                            <span className="line-through text-muted-foreground mr-1.5">
                              {formatEuro(loan.remainingDebt)}
                            </span>
                          ) : status === 'partially_paid' ? (
                            <span className="line-through text-muted-foreground mr-1.5 text-xs">
                              {formatEuro(loan.remainingDebt)}
                            </span>
                          ) : null}
                          <span
                            className={
                              status === 'fully_paid'
                                ? 'text-emerald-400 font-bold'
                                : status === 'partially_paid'
                                ? 'text-amber-400 font-bold'
                                : 'text-foreground'
                            }
                          >
                            {formatEuro(newRemainingDebt)}
                          </span>
                        </div>
                      </div>

                      {/* Status Outcome Badge */}
                      <div>
                        {status === 'fully_paid' && (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px] py-0.5 px-2 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Estinto 100% (+{formatEuro(freedMonthlyInstallment)}/m)</span>
                          </Badge>
                        )}
                        {status === 'partially_paid' && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[11px] py-0.5 px-2 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              Abbattuto di {formatEuro(allocatedAmount)} ({newRemainingInstallments} rate res.)
                            </span>
                          </Badge>
                        )}
                        {status === 'unchanged' && (
                          <Badge variant="outline" className="text-[11px] py-0.5 px-2 border-border text-muted-foreground">
                            Invariato
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. BANNER AZIONE PRIMARIA: APPLICA AL VAULT                              */}
        {/* ========================================================================= */}
        {simulation.fullyPaidLoansCount > 0 && (
          <Card className="bg-gradient-to-r from-emerald-500/10 via-card to-emerald-500/5 border border-emerald-500/30 p-4 sm:p-5 animate-fade-in shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs px-2.5 py-0.5 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Traguardo Raggiungibile
                  </Badge>
                  <span className="text-xs text-emerald-400 font-semibold font-mono">
                    +{formatEuro(simulation.freedMonthlyCashFlow)}/mese liberati
                  </span>
                </div>
                <h4 className="text-base font-bold text-foreground">
                  Registra l'estinzione di {simulation.fullyPaidLoansCount} {simulation.fullyPaidLoansCount === 1 ? 'finanziamento' : 'finanziamenti'}
                </h4>
                <p className="text-xs text-muted-foreground max-w-xl">
                  Con un'allocazione di <strong>{formatEuro(simulation.totalAllocated)}</strong> azzeri{' '}
                  {simulation.loanOutcomes
                    .filter((o) => o.status === 'fully_paid')
                    .map((o) => o.loan.name)
                    .join(', ')}
                  . Puoi salvare l'estinzione direttamente nel Vault cifrato.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {applySuccessFeedback ? (
                  <Badge className="bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                    <ShieldCheck className="w-4 h-4" />
                    Vault Aggiornato con Successo!
                  </Badge>
                ) : (
                  <Button
                    variant="default"
                    size="default"
                    onClick={() => setConfirmModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 text-xs shadow-sm flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Applica Estinzione al Vault</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* 6. MODALE DI CONFERMA ESTINZIONE NEL VAULT                                */}
        {/* ========================================================================= */}
        <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
          <DialogContent className="max-w-md bg-card border-border">
            <DialogHeader className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                Conferma Estinzione nel Vault
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Stai per registrare l'estinzione anticipata dei seguenti finanziamenti nel Vault personale protetto:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <div className="rounded-lg border border-border bg-background/50 p-3 space-y-2">
                {simulation.loanOutcomes
                  .filter((o) => o.status === 'fully_paid')
                  .map((o) => (
                    <div
                      key={o.loan.id}
                      className="flex items-center justify-between text-xs font-mono"
                    >
                      <span className="font-sans text-foreground font-medium">
                        {o.loan.name}
                      </span>
                      <span className="text-emerald-400 font-bold">
                        +{formatEuro(o.loan.installmentAmount)}/m
                      </span>
                    </div>
                  ))}
              </div>

              <div className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/60 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-foreground">
                  <AlertCircle className="w-3.5 h-3.5 text-primary" />
                  Effetti sul Bilancio e Scadenziario:
                </div>
                <p>
                  I finanziamenti selezionati saranno contrassegnati come <strong>estinti (isClosed = true)</strong>. Le rate future non compariranno più nel Cash Flow mensile né nello scadenziario. Potrai sempre riaprirli o modificarli dal tab <em>Contratti & Rate</em>.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmModalOpen(false)}
                className="text-xs"
              >
                Annulla
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (onApplyPayoffToVault && fullyPaidLoanIds.length > 0) {
                    onApplyPayoffToVault(fullyPaidLoanIds);
                    setApplySuccessFeedback(true);
                    setTimeout(() => setApplySuccessFeedback(false), 4000);
                  }
                  setConfirmModalOpen(false);
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold"
              >
                Conferma e Salva nel Vault
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};
