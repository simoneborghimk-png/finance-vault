import React, { useState, useMemo } from 'react';
import {
  Compass,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Clock,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Flame,
  Check,
  Coins,
  Wallet,
  AlertCircle,
  HelpCircle,
  Percent,
  Layers,
  ArrowUpRight,
  Lock,
} from 'lucide-react';
import { Transaction, UserFinancialProfile, RecurringOverride } from '@/types/finance';
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
  calculateSafeToSpend,
  calculateSeasonalRoadmap,
  calculatePensionStrategy,
  generateTacticalInsights,
  formatEuro,
  getAvailableMonths,
  MAX_PENSION_DEDUCTIBLE,
  SeasonQuarter,
} from '@/lib/financialAdvisor';

interface FinancialAdvisorProps {
  transactions: Transaction[];
  profile: UserFinancialProfile;
  overrides?: Record<string, RecurringOverride>;
  onNavigateToTab?: (tab: string) => void;
}

export const FinancialAdvisor: React.FC<FinancialAdvisorProps> = ({
  transactions,
  profile,
  overrides = {},
  onNavigateToTab,
}) => {
  // Lista mesi disponibili per l'analisi del mese
  const availableMonths = useMemo(() => getAvailableMonths(transactions), [transactions]);

  // Default mese corrente o più recente
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return availableMonths.includes(currentYm) ? currentYm : availableMonths[0] || currentYm;
  });

  // Anno di riferimento per la Roadmap e Fondo Pensione
  const selectedYear = useMemo(() => {
    return parseInt(selectedMonth.slice(0, 4), 10) || new Date().getFullYear();
  }, [selectedMonth]);

  // Aliquota marginale IRPEF stimata (35% o 43%)
  const [marginalTaxRate, setMarginalTaxRate] = useState<number>(35);

  // 1. Calcolo Safe-to-Spend per il mese selezionato
  const safeToSpend = useMemo(() => {
    return calculateSafeToSpend(transactions, profile, selectedMonth, overrides);
  }, [transactions, profile, selectedMonth, overrides]);

  // 2. Calcolo Roadmap Stagionale a 4 Trimestri per l'anno selezionato
  const seasonalRoadmap = useMemo(() => {
    return calculateSeasonalRoadmap(selectedYear, transactions, profile);
  }, [selectedYear, transactions, profile]);

  // 3. Calcolo Strategia Previdenziale e Tranches
  const pensionStrategy = useMemo(() => {
    return calculatePensionStrategy(selectedYear, transactions, profile, marginalTaxRate);
  }, [selectedYear, transactions, profile, marginalTaxRate]);

  // 4. Raccomandazioni Tattiche Intelligenti
  const tacticalInsights = useMemo(() => {
    return generateTacticalInsights(transactions, profile, overrides);
  }, [transactions, profile, overrides]);

  return (
    <TooltipProvider>
      <div className="space-y-8 animate-fade-in pb-12">
        {/* ========================================================================= */}
        {/* HEADER DI PAGINA SU CANVAS (Zero-Knowledge, Icona e Filtro Temporale)    */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/50 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Compass className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Financial Advisor & Spending Optimizer
              </h2>
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[11px] font-mono px-2 py-0.5">
                ADR-012
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Strategia stagionale patrimoniale, calibrazione del plafond discrezionale mensile e tranches previdenziali Art. 51 TUIR.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card/60 text-xs">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground mr-1">Mese di Analisi:</span>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-7 border-0 bg-transparent px-1 font-semibold text-foreground focus:ring-0 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {availableMonths.map((ym) => {
                    const [y, m] = ym.split('-');
                    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
                    const label = dateObj.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
                    return (
                      <SelectItem key={ym} value={ym} className="text-xs capitalize">
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Badge variant="outline" className="h-8 border-border bg-card/80 text-muted-foreground text-xs flex items-center gap-1.5 px-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Zero-Knowledge Engine</span>
            </Badge>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SEZIONE 1: SAFE-TO-SPEND ENGINE (Plafond Discrezionale Mensile Wants)     */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                <span>Safe-to-Spend: Plafond Discrezionale Mensile ({safeToSpend.monthLabel})</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Tetto massimo di spesa per shopping, ristoranti e svago (Wants) calcolato dopo costi fissi e quota di risparmio.
              </p>
            </div>

            {safeToSpend.status === 'safe' && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs py-1 px-2.5 flex items-center gap-1.5 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ritmo di Spesa in Sicurezza</span>
              </Badge>
            )}
            {safeToSpend.status === 'warning' && (
              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs py-1 px-2.5 flex items-center gap-1.5 self-start sm:self-auto">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Pre-Allarme Tetto (≥80%)</span>
              </Badge>
            )}
            {safeToSpend.status === 'danger' && (
              <Badge className="bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs py-1 px-2.5 flex items-center gap-1.5 self-start sm:self-auto">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Plafond Mensile Superato</span>
              </Badge>
            )}
          </div>

          {/* 4 Card KPI Safe-to-Spend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Plafond Calcolato */}
            <Card className="bg-card/70 border-border shadow-xs hover:border-primary/40 transition-colors">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">Plafond Discrezionale (Cap)</CardTitle>
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-1.5">
                <div className="text-2xl font-bold font-mono text-foreground">
                  {formatEuro(safeToSpend.safeToSpendCap)}
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span>Stipendio netto ordinario ({formatEuro(safeToSpend.baseNetSalary)})</span>
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Speso Finora */}
            <Card className="bg-card/70 border-border shadow-xs hover:border-primary/40 transition-colors">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">Spesa Wants Sostenuta</CardTitle>
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <Flame className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-1.5">
                <div className="text-2xl font-bold font-mono text-foreground">
                  {formatEuro(safeToSpend.actualWantsSpent)}
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Consumo plafond:</span>
                  <span className={`font-mono font-medium ${safeToSpend.spentPct > 100 ? 'text-rose-400' : safeToSpend.spentPct >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {safeToSpend.spentPct}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Margine Residuo */}
            <Card className={`border shadow-xs transition-colors ${safeToSpend.remainingAllowance >= 0 ? 'bg-card/70 border-border hover:border-emerald-500/40' : 'bg-rose-500/5 border-rose-500/30'}`}>
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">Margine Libero Residuo</CardTitle>
                <div className={`p-1.5 rounded-lg ${safeToSpend.remainingAllowance >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  <PiggyBank className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-1.5">
                <div className={`text-2xl font-bold font-mono ${safeToSpend.remainingAllowance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {safeToSpend.remainingAllowance >= 0 ? '+' : ''}{formatEuro(safeToSpend.remainingAllowance)}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {safeToSpend.remainingAllowance >= 0 ? 'Ancora spendibile senza deficit' : 'Sforamento rispetto al tetto mensile'}
                </p>
              </CardContent>
            </Card>

            {/* Card 4: Daily Safe Allowance */}
            <Card className="bg-card/70 border-border shadow-xs hover:border-primary/40 transition-colors">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">Budget Giornaliero Residuo</CardTitle>
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                  <Clock className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-1.5">
                <div className="text-2xl font-bold font-mono text-sky-400">
                  {formatEuro(safeToSpend.dailyAllowance)}
                  <span className="text-xs font-normal text-muted-foreground ml-1">/giorno</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Per i restanti {safeToSpend.daysRemaining} giorni del mese
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Barra di Ripartizione Matematica della Cassa del Mese */}
          <Card className="bg-card/40 border-border p-4">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                <span className="font-medium text-foreground">Scomposizione Cassa Stipendio ({formatEuro(safeToSpend.baseNetSalary)})</span>
                <span className="text-muted-foreground text-[11px]">
                  Costi Fissi ({formatEuro(safeToSpend.committedFixedCosts)}) + Risparmio 20% ({formatEuro(safeToSpend.plannedSavings)}) + Plafond Libero ({formatEuro(safeToSpend.safeToSpendCap)})
                </span>
              </div>

              {/* Stacked Progress Bar */}
              <div className="h-3 w-full rounded-full bg-muted/40 overflow-hidden flex">
                <div
                  style={{ width: `${Math.min(100, (safeToSpend.committedFixedCosts / safeToSpend.baseNetSalary) * 100)}%` }}
                  className="bg-indigo-500 transition-all"
                  title={`Costi Fissi Ricorrenti: ${formatEuro(safeToSpend.committedFixedCosts)}`}
                />
                <div
                  style={{ width: `${Math.min(100, (safeToSpend.plannedSavings / safeToSpend.baseNetSalary) * 100)}%` }}
                  className="bg-emerald-500 transition-all"
                  title={`Risparmio Obiettivo: ${formatEuro(safeToSpend.plannedSavings)}`}
                />
                <div
                  style={{ width: `${Math.min(100, (safeToSpend.actualWantsSpent / safeToSpend.baseNetSalary) * 100)}%` }}
                  className="bg-amber-500 transition-all"
                  title={`Speso Wants: ${formatEuro(safeToSpend.actualWantsSpent)}`}
                />
                {safeToSpend.remainingAllowance > 0 && (
                  <div
                    style={{ width: `${Math.min(100, (safeToSpend.remainingAllowance / safeToSpend.baseNetSalary) * 100)}%` }}
                    className="bg-sky-500/60 transition-all"
                    title={`Margine Libero Residuo: ${formatEuro(safeToSpend.remainingAllowance)}`}
                  />
                )}
              </div>

              {/* Legenda Elementi */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-3 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500" />
                  <span>Costi Fissi & Utenze ({formatEuro(safeToSpend.committedFixedCosts)})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                  <span>Accantonamento 20% ({formatEuro(safeToSpend.plannedSavings)})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                  <span>Wants Già Spesi ({formatEuro(safeToSpend.actualWantsSpent)})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-sky-500/60" />
                  <span>Margine Rimanente ({formatEuro(Math.max(0, safeToSpend.remainingAllowance))})</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* SEZIONE 2: ROADMAP FINANZIARIA STAGIONALE (4 FASI DELL'ANNO)              */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>Roadmap Finanziaria Stagionale — Anno {selectedYear}</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Ciclo quadrimestrale sincronizzato con gli accrediti CCNL (14ª e 13ª) e il conguaglio fiscale del Modello 730.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {seasonalRoadmap.map((phase) => (
              <Card
                key={phase.quarter}
                className={`relative flex flex-col justify-between transition-all border ${
                  phase.isCurrent
                    ? 'border-primary/60 bg-primary/5 shadow-md ring-1 ring-primary/30'
                    : 'border-border bg-card/60 hover:border-border/80'
                }`}
              >
                <div>
                  <CardHeader className="p-4 pb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                        {phase.quarter}
                      </span>
                      {phase.isCurrent && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold animate-pulse">
                          FASE ATTIVA
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      {phase.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground line-clamp-1">
                      {phase.theme}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 space-y-3 text-xs">
                    {/* Badge Entrate Attese */}
                    <div className="p-2.5 rounded-lg bg-card border border-border/60 space-y-1">
                      <div className="text-[11px] text-muted-foreground">Entrate del Periodo:</div>
                      <div className="font-mono font-semibold text-foreground text-xs flex items-center justify-between">
                        <span>Totale:</span>
                        <span>{formatEuro(phase.expectedIncome.ordinary + phase.expectedIncome.extra)}</span>
                      </div>
                      {phase.expectedIncome.extra > 0 && (
                        <div className="text-[10px] text-primary font-medium flex items-center gap-1 pt-0.5">
                          <Coins className="w-3 h-3 shrink-0" />
                          <span className="truncate">{phase.expectedIncome.extraDescription}</span>
                        </div>
                      )}
                    </div>

                    {/* Pilastri Strategici */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-medium text-foreground">Focus Strategico:</div>
                      <ul className="space-y-1 text-[11px] text-muted-foreground">
                        {phase.focusPillars.map((pillar, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-primary mt-0.5 text-xs">•</span>
                            <span>{pillar}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </div>

                {/* Azioni Chiave in Fondo */}
                <CardFooter className="p-4 pt-2 border-t border-border/40 flex flex-col items-stretch gap-2">
                  <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                    Azione Consigliata
                  </div>
                  {phase.strategicActions.slice(0, 1).map((act, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border text-[11px] flex items-start gap-2 ${
                        act.isCompleted
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : act.urgency === 'high'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-muted/40 border-border/60 text-foreground'
                      }`}
                    >
                      {act.isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="font-medium line-clamp-1">{act.title}</div>
                        <div className="text-[10px] text-muted-foreground line-clamp-1">{act.description}</div>
                      </div>
                    </div>
                  ))}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SEZIONE 3: STRATEGIA TRANCHES FONDO PENSIONE (Art. 51 TUIR - 5.164,57 €)  */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                <span>Strategia Tranches Fondo Pensione (Art. 51 TUIR — {selectedYear})</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Ripartizione ottimale dei versamenti deducibili verso il plafond massimo di 5.164,57 € per massimizzare il rimborso 730.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-muted-foreground">Aliquota IRPEF Marginale:</span>
              <div className="flex items-center rounded-lg border border-border bg-card p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setMarginalTaxRate(35)}
                  className={`px-2 py-1 rounded-md transition-all font-mono font-medium ${marginalTaxRate === 35 ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  35%
                </button>
                <button
                  type="button"
                  onClick={() => setMarginalTaxRate(43)}
                  className={`px-2 py-1 rounded-md transition-all font-mono font-medium ${marginalTaxRate === 43 ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  43%
                </button>
              </div>
            </div>
          </div>

          <Card className="bg-card/70 border-border p-5 space-y-6">
            {/* Riepilogo Capienza & Rimborso Fiscale */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-border/50 pb-5">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Già Versato nell'Anno ({selectedYear}):</span>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {formatEuro(pensionStrategy.alreadyContributed)}
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    / {formatEuro(MAX_PENSION_DEDUCTIBLE)}
                  </span>
                </div>
                <div className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Credito 730 maturato: {formatEuro(pensionStrategy.estimatedTaxRefundAlreadySecured)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Capienza Residua Deducibile:</span>
                <div className={`text-2xl font-bold font-mono ${pensionStrategy.remainingToDeduct === 0 ? 'text-emerald-400' : 'text-primary'}`}>
                  {formatEuro(pensionStrategy.remainingToDeduct)}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{pensionStrategy.daysRemainingInTaxYear} giorni alla scadenza del 31/12</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Potenziale Rimborso Residuo:</span>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  +{formatEuro(pensionStrategy.estimatedTaxRefundRemaining)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Rimborso IRPEF totale a tetto: {formatEuro(pensionStrategy.totalEstimatedTaxRefund)}
                </p>
              </div>
            </div>

            {/* Barra Segmentata di Avanzamento */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Completamento Plafond 5.164,57 €:</span>
                <span className="font-mono font-bold text-primary">{pensionStrategy.completionPct}%</span>
              </div>
              <Progress value={pensionStrategy.completionPct} className="h-3" />
            </div>

            {/* Le 3 Tranches Calendarizzate */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-foreground tracking-wide uppercase">
                Piano delle 3 Tranches Strategiche Consigliate
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {pensionStrategy.tranches.map((tranche) => (
                  <div
                    key={tranche.trancheNumber}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 ${
                      tranche.status === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : tranche.status === 'urgent'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-card border-border/70'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{tranche.name}</span>
                        {tranche.status === 'completed' ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] py-0 px-1.5 border-0">
                            Completata
                          </Badge>
                        ) : tranche.status === 'urgent' ? (
                          <Badge className="bg-amber-500/20 text-amber-400 text-[10px] py-0 px-1.5 border-0">
                            In Scadenza
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground">
                            Pianificata
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{tranche.targetMonth} • {tranche.sourceLever}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Importo:</span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        {formatEuro(tranche.suggestedAmount)}
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      {tranche.notes}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Collegamento al Simulatore Fiscale */}
            {onNavigateToTab && (
              <div className="flex items-center justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateToTab('tax-pension')}
                  className="text-xs flex items-center gap-1.5 hover:text-primary hover:border-primary/40"
                >
                  <span>Apri Simulatore Fiscale Dettagliato</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* SEZIONE 4: SCHEDE TATTICHE INTELLIGENTI (TACTICAL ADVISOR INSIGHTS)       */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Insight Tattici & Raccomandazioni Personalizzate</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Suggerimenti proattivi generati dall'analisi delle transazioni reali, debiti ammortizzati e contratti.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tacticalInsights.map((insight) => (
              <Card
                key={insight.id}
                className={`p-4 border transition-all ${
                  insight.severity === 'critical'
                    ? 'border-rose-500/40 bg-rose-500/5'
                    : insight.severity === 'warning'
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : insight.severity === 'success'
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-border bg-card/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        insight.severity === 'critical'
                          ? 'bg-rose-500/15 text-rose-400'
                          : insight.severity === 'warning'
                          ? 'bg-amber-500/15 text-amber-400'
                          : insight.severity === 'success'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {insight.severity === 'critical' || insight.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : insight.severity === 'success' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{insight.title}</span>
                  </div>

                  {insight.metricBadge && (
                    <Badge
                      variant="outline"
                      className={`font-mono text-[10px] shrink-0 ${
                        insight.severity === 'success'
                          ? 'border-emerald-500/40 text-emerald-400'
                          : insight.severity === 'warning'
                          ? 'border-amber-500/40 text-amber-400'
                          : 'border-primary/40 text-primary'
                      }`}
                    >
                      {insight.metricBadge}
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  {insight.description}
                </p>

                {insight.actionText && onNavigateToTab && insight.targetTab && (
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigateToTab(insight.targetTab!)}
                      className="text-xs h-7 px-2.5 text-primary hover:text-primary hover:bg-primary/10 flex items-center gap-1"
                    >
                      <span>{insight.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

