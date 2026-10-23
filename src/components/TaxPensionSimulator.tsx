import React, { useState } from 'react';
import { UserFinancialProfile } from '@/types/finance';
import { ShieldAlert, Sparkles, Calendar, Percent, Coins, ArrowRight, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Slider, Badge, Button } from './ui';

interface TaxPensionSimulatorProps {
  profile: UserFinancialProfile;
  initialContribution?: number;
  onSaveContribution?: (amount: number) => void;
}

const MAX_DEDUCTIBLE = 5164.57;

export const TaxPensionSimulator: React.FC<TaxPensionSimulatorProps> = ({
  profile,
  initialContribution = 2500,
  onSaveContribution,
}) => {
  const [contribution, setContribution] = useState<number>(initialContribution);
  const [marginalTaxRate, setMarginalTaxRate] = useState<number>(35); // 35% o 43%

  const formatEuro = (val: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);

  // Calcolo rimborso IRPEF 730:
  // Rimborso = Versamento * Aliquota Marginale IRPEF (es. 35% per redditi tra 28k e 50k €)
  // Più addizionali regionali/comunali stimate ~1.7%
  const totalTaxRate = marginalTaxRate + 1.7;
  const estimatedTaxRefund = (contribution * totalTaxRate) / 100;
  const netEffectiveCost = contribution - estimatedTaxRefund;
  const immediateReturnPct = ((estimatedTaxRefund / netEffectiveCost) * 100);

  // Proiezione montante fondo pensione
  const projectedFundValue = profile.pensionFund.currentValue + contribution;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            Simulatore Fiscale & Fondo Pensione Integrativo
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ottimizzazione deducibilità art. 51 TUIR (plafond max {formatEuro(MAX_DEDUCTIBLE)}/anno)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 bg-emerald-950/30 text-xs py-1 px-3">
            {profile.pensionFund.provider}
          </Badge>
          <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs py-1 px-3">
            Fondo Attuale: {formatEuro(profile.pensionFund.currentValue)}
          </Badge>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Slider and Controls */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center justify-between">
                <span>Versamento Volontario Annuo</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {formatEuro(contribution)}
                </span>
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Sposta il cursore per simulare l'impatto fiscale del contributo integrativo
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
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>0 €</span>
                  <span className="text-emerald-400 font-medium">Consigliato: ~2.500 €</span>
                  <span>Max Deducibile: {formatEuro(MAX_DEDUCTIBLE)}</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[1000, 2000, 2500, 3500, MAX_DEDUCTIBLE].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setContribution(amt)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      Math.abs(contribution - amt) < 1
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-semibold shadow-xs'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {amt === MAX_DEDUCTIBLE ? 'Plafond Max' : formatEuro(amt)}
                  </button>
                ))}
              </div>

              {/* Scaglione IRPEF selector */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-cyan-400" />
                    Aliquota IRPEF Marginale Applicata
                  </label>
                  <span className="text-xs font-mono font-semibold text-cyan-300">
                    {marginalTaxRate}% (+1,7% addizionali = {totalTaxRate}%)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setMarginalTaxRate(35)}
                    className={`text-xs py-1.5 px-3 rounded-md border text-center transition-all ${
                      marginalTaxRate === 35
                        ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200 font-medium'
                        : 'border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    35% (Redditi 28k – 50k €)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarginalTaxRate(43)}
                    className={`text-xs py-1.5 px-3 rounded-md border text-center transition-all ${
                      marginalTaxRate === 43
                        ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200 font-medium'
                        : 'border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    43% (Redditi oltre 50k €)
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline & Optimal Timing Box */}
          <Card className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/30">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-amber-400">
                <Calendar className="w-4 h-4" />
                <CardTitle className="text-sm font-semibold text-amber-300">
                  Finestra Ottimale di Versamento Consigliata
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 font-mono">
                  15 Novembre – 10 Dicembre
                </span>
                <span className="text-slate-400">prima della chiusura contabile dell'anno fiscale</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Effettuare il bonifico deducibile con causale specifica entro il 10 Dicembre garantisce la ricezione della quietanza fiscale da Allianz/Fon.Te. e l'inserimento automatico nella dichiarazione precompilata Modello 730 di Luglio.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Output Metrics & ROI Calculation */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-slate-900/60 border-slate-800 relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Riepilogo Vantaggio Fiscale Immediato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stat 1: Rimborso 730 */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                <span className="text-xs font-medium text-emerald-400">
                  Rimborso IRPEF 730 Stimato (A Luglio)
                </span>
                <div className="text-3xl font-extrabold text-white mt-1 font-mono">
                  +{formatEuro(estimatedTaxRefund)}
                </div>
                <p className="text-[11px] text-emerald-300/80 mt-1">
                  Accreditato direttamente nella busta paga di Luglio
                </p>
              </div>

              {/* Stat 2: Esborso Netto */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-xs font-medium text-slate-400">
                  Costo Effettivo Reale a Carico Tuo
                </span>
                <div className="text-2xl font-bold text-slate-200 mt-1 font-mono">
                  {formatEuro(netEffectiveCost)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Versamento ({formatEuro(contribution)}) meno il rimborso fiscale ({formatEuro(estimatedTaxRefund)})
                </p>
              </div>

              {/* Stat 3: Rendimento Immediato */}
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-cyan-300">
                    Rendimento "Risk-Free" Istantaneo
                  </span>
                  <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 text-xs">
                    Garanzia Stato
                  </Badge>
                </div>
                <div className="text-3xl font-extrabold text-cyan-200 mt-1 font-mono">
                  +{immediateReturnPct.toFixed(1)}%
                </div>
                <p className="text-[11px] text-cyan-300/70 mt-1">
                  Rapporto tra rimborso ottenuto ed esborso netto reale sostenuto
                </p>
              </div>

              {/* Pension Fund Balance Projection */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Nuovo Saldo Stimato Fondo Pensione:</span>
                  <span className="font-bold text-white font-mono">{formatEuro(projectedFundValue)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
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
