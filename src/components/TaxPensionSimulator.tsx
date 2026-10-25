import React, { useState, useMemo } from 'react';
import { Transaction, UserFinancialProfile } from '@/types/finance';
import {
  Sparkles,
  Calendar,
  Percent,
  Coins,
  CheckCircle2,
  TrendingUp,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
  Check,
  Receipt,
  PiggyBank,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Slider,
  Badge,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from './ui';

interface TaxPensionSimulatorProps {
  profile: UserFinancialProfile;
  transactions?: Transaction[];
  initialContribution?: number;
  onSaveContribution?: (amount: number) => void;
}

const MAX_DEDUCTIBLE = 5164.57;

export const TaxPensionSimulator: React.FC<TaxPensionSimulatorProps> = ({
  profile,
  transactions = [],
  initialContribution = 2500,
  onSaveContribution,
}) => {
  const [contribution, setContribution] = useState<number>(initialContribution);
  const [marginalTaxRate, setMarginalTaxRate] = useState<number>(35); // 35% o 43%
  const [showDetectedList, setShowDetectedList] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const formatEuro = (val: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);

  // Calcolo anni disponibili dalle transazioni
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    transactions.forEach((t) => {
      const yr = parseInt(t.date.slice(0, 4), 10);
      if (!isNaN(yr)) yearsSet.add(yr);
    });
    // Se non ci sono transazioni, usa l'anno corrente
    const currentYr = new Date().getFullYear();
    yearsSet.add(currentYr);
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transactions]);

  const [selectedYear, setSelectedYear] = useState<number>(() => availableYears[0] || 2026);

  // Filtra transazioni dell'anno selezionato relative a previdenza integrativa
  const isPensionTransaction = (t: Transaction): boolean => {
    if (t.category === 'Previdenza Integrativa') return true;
    if (t.tags?.some((tag) => ['#previdenza', '#fondo', '#deducibile', '#pensione'].includes(tag.toLowerCase()))) {
      return true;
    }
    const desc = (t.description + ' ' + (t.rawDescription || '')).toUpperCase();
    return (
      desc.includes('ORIZZONTE PREVIDENZA') ||
      desc.includes('FONDO PENSIONE') ||
      desc.includes('FON.TE') ||
      desc.includes('POLIZZA 501.505.442') ||
      desc.includes('ALLIANZ')
    );
  };

  const detectedPensionTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.date.startsWith(selectedYear.toString()))
      .filter(isPensionTransaction)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedYear]);

  // Totale già versato nell'anno (uscite negative espresse in positivo)
  const alreadyContributed = useMemo(() => {
    return detectedPensionTransactions.reduce((acc, t) => {
      return acc + (t.amount < 0 ? Math.abs(t.amount) : 0);
    }, 0);
  }, [detectedPensionTransactions]);

  // Plafond residuo art. 51 TUIR
  const remainingDeductible = Math.max(0, MAX_DEDUCTIBLE - alreadyContributed);

  // Quota del nuovo versamento che rientra effettivamente nel plafond deducibile
  const effectiveDeductibleFromNewContribution = Math.min(contribution, remainingDeductible);
  const totalPotentialContribution = alreadyContributed + contribution;
  const overContribution = Math.max(0, totalPotentialContribution - MAX_DEDUCTIBLE);
  const isOverCeiling = overContribution > 0.01;

  // Calcolo rimborso IRPEF 730:
  // Rimborso = Quota effettivamente deducibile * (Aliquota Marginale IRPEF + 1.7% addizionali)
  const totalTaxRate = marginalTaxRate + 1.7;
  const estimatedTaxRefund = (effectiveDeductibleFromNewContribution * totalTaxRate) / 100;
  const netEffectiveCost = contribution - estimatedTaxRefund;
  const immediateReturnPct = netEffectiveCost > 0 ? (estimatedTaxRefund / netEffectiveCost) * 100 : 0;

  // Percentuali grafiche per la barra del plafond a 3 segmenti
  const alreadyPct = Math.min(100, (alreadyContributed / MAX_DEDUCTIBLE) * 100);
  const plannedPct = Math.min(100 - alreadyPct, (effectiveDeductibleFromNewContribution / MAX_DEDUCTIBLE) * 100);
  const remainingPct = Math.max(0, 100 - (alreadyPct + plannedPct));

  // Proiezione montante fondo pensione
  const projectedFundValue = profile.pensionFund.currentValue + contribution;

  // Gestione salvataggio esplicito della pianificazione
  const handleSave = () => {
    if (onSaveContribution) {
      onSaveContribution(contribution);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header fuori dalla card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Simulatore Fiscale & Fondo Pensione Integrativo
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ottimizzazione deducibilità art. 51 TUIR (plafond max {formatEuro(MAX_DEDUCTIBLE)}/anno solare)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Selettore Anno Fiscale */}
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5 shadow-xs">
            <span className="text-[11px] text-muted-foreground font-medium">Anno Fiscale:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-card text-foreground">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-xs py-1.5 px-3">
            {profile.pensionFund.provider}
          </Badge>
          <Badge variant="outline" className="border-border text-foreground text-xs py-1.5 px-3">
            Fondo Attuale: {formatEuro(profile.pensionFund.currentValue)}
          </Badge>
        </div>
      </div>

      {/* Monitor Plafond Art. 51 TUIR & Avanzamento Reale */}
      <Card className="bg-card border-border shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-primary" />
              <CardTitle className="text-base text-foreground">
                Stato Plafond Deducibilità Anno {selectedYear}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Plafond Totale di Legge: <strong className="text-foreground font-mono">{formatEuro(MAX_DEDUCTIBLE)}</strong>
              </span>
            </div>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Monitoraggio in tempo reale tra versamenti già eseguiti nel conto corrente e nuovo versamento pianificato
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 3 KPI Sintetici di Avanzamento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-background border border-border">
              <span className="text-[11px] text-muted-foreground font-medium">1. Già Versato a Consuntivo ({selectedYear})</span>
              <div className="text-lg font-bold text-emerald-500 font-mono mt-0.5">
                {formatEuro(alreadyContributed)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Rilevato da {detectedPensionTransactions.length} moviment{detectedPensionTransactions.length === 1 ? 'o' : 'i'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-background border border-border">
              <span className="text-[11px] text-muted-foreground font-medium">2. Nuovo Versamento Pianificato</span>
              <div className="text-lg font-bold text-primary font-mono mt-0.5">
                {formatEuro(contribution)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {effectiveDeductibleFromNewContribution < contribution ? (
                  <span className="text-amber-500 font-medium">
                    {formatEuro(effectiveDeductibleFromNewContribution)} deducibili
                  </span>
                ) : (
                  'Interamente deducibile'
                )}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-background border border-border">
              <span className="text-[11px] text-muted-foreground font-medium">3. Deducibilità Residua Disponibile</span>
              <div className={`text-lg font-bold font-mono mt-0.5 ${remainingDeductible - contribution <= 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
                {formatEuro(Math.max(0, remainingDeductible - contribution))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Capienza ancora sfruttabile prima del 31/12
              </p>
            </div>
          </div>

          {/* Barra Visuale Multi-Segmento */}
          <div className="space-y-1.5 pt-1">
            <div className="h-3 w-full bg-muted/60 rounded-full overflow-hidden flex">
              {/* Quota Già Versata (Emerald) */}
              <div
                style={{ width: `${alreadyPct}%` }}
                className="bg-emerald-500 transition-all duration-300"
                aria-label={`Già versato: ${alreadyPct.toFixed(1)}%`}
              />
              {/* Quota Nuova Pianificata (Primary) */}
              <div
                style={{ width: `${plannedPct}%` }}
                className="bg-primary transition-all duration-300"
                aria-label={`Pianificato: ${plannedPct.toFixed(1)}%`}
              />
              {/* Quota Residua (Trasparente su sfondo muted) */}
            </div>

            {/* Legenda Barra */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground pt-0.5">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  Già Versato ({alreadyPct.toFixed(1)}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                  Nuovo Pianificato ({plannedPct.toFixed(1)}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30 shrink-0" />
                  Residuo Libero ({remainingPct.toFixed(1)}%)
                </span>
              </div>
              <span className="font-medium text-foreground">
                Saturazione Totale: {((alreadyPct + plannedPct)).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Banner di Sovra-Contribuzione (se applicabile) */}
          {isOverCeiling && (
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-amber-500">
                  Attenzione: {formatEuro(overContribution)} eccedono il plafond annuale deducibile di {formatEuro(MAX_DEDUCTIBLE)}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  La quota eccedente non beneficerà del rimborso IRPEF nel Modello 730. Per legge (art. 8, co. 4, D.Lgs. 252/2005), 
                  ricordati di comunicare ad Allianz/Fon.Te. entro il 31 Dicembre dell'anno successivo l'importo dei 
                  <strong> contributi non dedotti</strong>, al fine di renderli esenti da tassazione al momento del riscatto o della pensione.
                </p>
              </div>
            </div>
          )}

          {/* Dettaglio Espandibile Movimenti Reali Rilevati */}
          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setShowDetectedList((prev) => !prev)}
              className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Receipt className="w-3.5 h-3.5 text-primary" />
                Dettaglio Movimenti Previdenziali Rilevati per il {selectedYear} ({detectedPensionTransactions.length})
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                {showDetectedList ? 'Nascondi lista' : 'Mostra lista'}
                {showDetectedList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </span>
            </button>

            {showDetectedList && (
              <div className="mt-2.5 space-y-1.5 bg-background p-2.5 rounded-lg border border-border">
                {detectedPensionTransactions.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2 text-center">
                    Nessuna transazione contabile categorizzata come previdenza integrativa rilevata nel {selectedYear}. 
                    Tutto il plafond di {formatEuro(MAX_DEDUCTIBLE)} è interamente sfruttabile.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {detectedPensionTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-2 rounded bg-card border border-border/60 text-xs"
                      >
                        <div className="space-y-0.5 min-w-0 pr-3">
                          <div className="font-medium text-foreground truncate">{tx.description}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                            <span>{tx.date}</span>
                            <span>•</span>
                            <span>{tx.channel}</span>
                            {tx.tags && tx.tags.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-primary">{tx.tags.join(', ')}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="font-bold font-mono text-emerald-500 shrink-0">
                          {formatEuro(Math.abs(tx.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Slider, Presets and Controls */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground flex items-center justify-between">
                <span>Versamento Volontario Pianificato</span>
                <span className="text-2xl font-black text-primary font-mono">
                  {formatEuro(contribution)}
                </span>
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                Sposta il cursore o usa i preset per simulare l'impatto fiscale del contributo integrativo
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Slider */}
              <div className="space-y-2 pt-2">
                <Slider
                  min={0}
                  max={MAX_DEDUCTIBLE}
                  step={50}
                  value={contribution}
                  onValueChange={(val) => setContribution(val)}
                  className="py-4"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>0 €</span>
                  <span className="text-primary font-medium">Consigliato: ~2.500 €</span>
                  <span>Max Deducibile: {formatEuro(MAX_DEDUCTIBLE)}</span>
                </div>
              </div>

              {/* Quick Presets Adattivi */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-muted-foreground font-medium">Impostazione Rapida:</span>
                <div className="flex flex-wrap gap-2">
                  {/* Preset Satura Plafond Residuo (Consigliato) */}
                  {remainingDeductible > 0 && (
                    <button
                      type="button"
                      onClick={() => setContribution(Number(remainingDeductible.toFixed(2)))}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                        Math.abs(contribution - remainingDeductible) < 1
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-semibold shadow-xs'
                          : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Satura Plafond Residuo ({formatEuro(remainingDeductible)})
                    </button>
                  )}

                  {[1000, 2000, 2500, 3500, MAX_DEDUCTIBLE].map((amt) => {
                    const isSelected = Math.abs(contribution - amt) < 1;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setContribution(amt)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/20 text-primary font-semibold shadow-xs'
                            : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-border/80'
                        }`}
                      >
                        {amt === MAX_DEDUCTIBLE ? 'Plafond 5.164 €' : formatEuro(amt)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scaglione IRPEF selector con Toggletip al click */}
              <div className="p-3.5 rounded-lg bg-background border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-primary" />
                      Aliquota IRPEF Marginale Applicata
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded focus:outline-hidden focus:ring-1 focus:ring-ring"
                          aria-label="Informazioni sulla deducibilità IRPEF"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="top" className="text-xs p-3 max-w-xs space-y-1.5">
                        <p className="font-semibold text-foreground">Come funziona la deduzione?</p>
                        <p className="text-muted-foreground leading-normal">
                          I contributi al fondo pensione fino a 5.164,57 € riducono il reddito imponibile IRPEF al tuo scaglione più alto. Il risparmio ti viene rimborsato integralmente nel Modello 730 di Luglio.
                        </p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <span className="text-xs font-mono font-semibold text-primary">
                    {marginalTaxRate}% (+1,7% addizionali = {totalTaxRate}%)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setMarginalTaxRate(35)}
                    className={`text-xs py-1.5 px-3 rounded-md border text-center transition-all ${
                      marginalTaxRate === 35
                        ? 'bg-primary/20 border-primary text-primary font-medium'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    35% (Redditi 28k – 50k €)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarginalTaxRate(43)}
                    className={`text-xs py-1.5 px-3 rounded-md border text-center transition-all ${
                      marginalTaxRate === 43
                        ? 'bg-primary/20 border-primary text-primary font-medium'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    43% (Redditi oltre 50k €)
                  </button>
                </div>
              </div>

              {/* Pulsante Esplicito di Salvataggio Pianificazione */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <Button
                  onClick={handleSave}
                  className="w-full h-10 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  variant={saveSuccess ? 'outline' : 'default'}
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-500">Pianificazione Versamento Salvata!</span>
                    </>
                  ) : (
                    <>
                      <BookmarkCheck className="w-4 h-4" />
                      Salva Pianificazione Versamento ({formatEuro(contribution)})
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Timeline & Optimal Timing Box */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary">
                <Calendar className="w-4 h-4" />
                <CardTitle className="text-sm font-semibold text-foreground">
                  Finestra Ottimale di Versamento Consigliata
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-foreground">
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/30 font-mono">
                  15 Novembre – 10 Dicembre
                </span>
                <span className="text-muted-foreground">prima della chiusura contabile dell'anno fiscale</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                Effettuare il bonifico deducibile con causale specifica entro il 10 Dicembre garantisce la ricezione della quietanza fiscale da Allianz/Fon.Te. e l'inserimento automatico nella dichiarazione precompilata Modello 730 di Luglio.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Output Metrics & ROI Calculation */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-card border-border relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Riepilogo Vantaggio Fiscale Immediato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stat 1: Rimborso 730 */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                <span className="text-xs font-medium text-primary">
                  Rimborso IRPEF 730 Stimato (A Luglio)
                </span>
                <div className="text-3xl font-extrabold text-foreground mt-1 font-mono">
                  +{formatEuro(estimatedTaxRefund)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Accreditato direttamente nella busta paga di Luglio
                </p>
              </div>

              {/* Stat 2: Esborso Netto */}
              <div className="p-4 rounded-xl bg-background border border-border">
                <span className="text-xs font-medium text-muted-foreground">
                  Costo Effettivo Reale a Carico Tuo
                </span>
                <div className="text-2xl font-bold text-foreground mt-1 font-mono">
                  {formatEuro(netEffectiveCost)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Versamento ({formatEuro(contribution)}) meno il rimborso fiscale ({formatEuro(estimatedTaxRefund)})
                </p>
              </div>

              {/* Stat 3: Rendimento Immediato */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">
                    Rendimento "Risk-Free" Istantaneo
                  </span>
                  <Badge variant="outline" className="border-primary/40 text-primary text-xs">
                    Garanzia Stato
                  </Badge>
                </div>
                <div className="text-3xl font-extrabold text-primary mt-1 font-mono">
                  +{immediateReturnPct.toFixed(1)}%
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Rapporto tra rimborso ottenuto ed esborso netto reale sostenuto
                </p>
              </div>

              {/* Pension Fund Balance Projection */}
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Nuovo Saldo Stimato Fondo Pensione:</span>
                  <span className="font-bold text-foreground font-mono">{formatEuro(projectedFundValue)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-1">
                  <span>Commissione gestione fondo (TER):</span>
                  <span>{profile.pensionFund.managementFeePct.toFixed(1)}% / anno</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
