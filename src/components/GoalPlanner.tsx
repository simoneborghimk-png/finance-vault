import React, { useState } from 'react';
import { SavingsGoal, UserFinancialProfile } from '@/types/finance';
import { Target, Compass, Plane, Plus, Trash2, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button, Input, Progress, Badge, Tooltip, Label } from './ui';

interface GoalPlannerProps {
  goals: SavingsGoal[];
  profile: UserFinancialProfile;
  onAddGoal: (goal: SavingsGoal) => void;
  onRemoveGoal: (id: string) => void;
}

export const GoalPlanner: React.FC<GoalPlannerProps> = ({
  goals,
  profile,
  onAddGoal,
  onRemoveGoal,
}) => {
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState<number | ''>(4500);
  const [targetDate, setTargetDate] = useState('2027-04');
  const [notes, setNotes] = useState('Pianificazione viaggio');

  const formatEuro = (val: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !budget || budget <= 0) return;

    // Automatic allocation algorithm
    // Extra income assumptions:
    // 14th June: profile.extraSalaries.fourteenthNetJune (~1848 €)
    // 730 July refund: ~1500 €
    const availableJune = profile.extraSalaries.fourteenthNetJune;
    const availableJuly = 1500;

    let allocJune = 0;
    let allocJuly = 0;
    let remainingBudget = Number(budget);

    // Prioritize 14th June
    if (remainingBudget > 0) {
      allocJune = Math.min(remainingBudget, availableJune);
      remainingBudget -= allocJune;
    }

    // Then prioritize 730 July
    if (remainingBudget > 0) {
      allocJuly = Math.min(remainingBudget, availableJuly);
      remainingBudget -= allocJuly;
    }

    const newGoal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      title,
      targetAmount: Number(budget),
      targetDate,
      allocatedJuneExtra: allocJune,
      allocatedJuly730: allocJuly,
      notes,
    };

    onAddGoal(newGoal);
    setTitle('');
    setBudget('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Goal Planner & Grandi Progetti (Zero Cash-Flow Impact)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Algoritmo intelligente che assorbe le grandi spese allocando prioritariamente la 14ª e il rimborso 730
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 text-primary text-xs py-1 px-3">
            14ª Giugno: {formatEuro(profile.extraSalaries.fourteenthNetJune)}
          </Badge>
          <Badge variant="outline" className="border-primary/30 text-primary text-xs py-1 px-3">
            730 Luglio: ~{formatEuro(1500)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form to Add a New Goal */}
        <div className="lg:col-span-5">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Plane className="w-4 h-4 text-primary" />
                Crea Nuovo Obiettivo di Risparmio
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Inserisci l'obiettivo per calcolare la copertura ottimale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="goal-title" className="text-xs font-medium text-foreground">
                    Titolo Progetto / Viaggio <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="goal-title"
                    placeholder="es. Viaggio in Giappone 🇯🇵"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-background border-input text-foreground text-xs w-full"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="goal-budget" className="text-xs font-medium text-foreground">
                    Budget Previsto (€) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="goal-budget"
                    type="number"
                    placeholder="4500"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value ? parseFloat(e.target.value) : '')}
                    className="bg-background border-input text-foreground text-xs font-mono w-full"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="goal-target-date" className="text-xs font-medium text-foreground">
                    Mese Target (Scadenza) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="goal-target-date"
                    type="month"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="bg-background border-input text-foreground text-xs w-full"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="goal-notes" className="text-xs font-medium text-foreground">Note di Pianificazione</Label>
                  <Input
                    id="goal-notes"
                    placeholder="es. Voli, hotel, pass treni..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-background border-input text-foreground text-xs w-full"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs py-2 mt-2"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Calcola Allocazione & Salva
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Goals List with Coverage Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            Obiettivi Attivi & Strategia di Copertura
          </h3>

          {goals.length === 0 ? (
            <Card className="bg-card/50 border-border p-8 text-center text-muted-foreground text-xs">
              Nessun obiettivo impostato. Inserisci il tuo primo traguardo finanziario.
            </Card>
          ) : (
            goals.map((g) => {
              const totalExtraAllocated = g.allocatedJuneExtra + g.allocatedJuly730;
              const remainingToFund = Math.max(0, g.targetAmount - totalExtraAllocated);
              const extraCoveragePct = Math.min(100, (totalExtraAllocated / g.targetAmount) * 100);

              // Months remaining calculation
              const [tYear, tMonth] = g.targetDate.split('-');
              const target = new Date(parseInt(tYear), parseInt(tMonth) - 1, 1);
              const now = new Date();
              const monthsDiff = Math.max(
                1,
                (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
              );
              const monthlyOrdinaryEffort = remainingToFund > 0 ? remainingToFund / monthsDiff : 0;

              return (
                <Card key={g.id} className="bg-card border-border relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3">
                    <Tooltip content="Elimina obiettivo">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveGoal(g.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  </div>

                  <CardHeader className="pb-2 pr-10">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base text-foreground">{g.title}</CardTitle>
                      <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
                        Target: {g.targetDate} ({monthsDiff} mesi)
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-muted-foreground">
                      Budget Totale: <span className="font-bold text-foreground">{formatEuro(g.targetAmount)}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress Bar of Summer Extra Coverage */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-foreground">
                        <span>Copertura con Entrate Straordinarie:</span>
                        <span className="font-mono font-bold text-primary">
                          {formatEuro(totalExtraAllocated)} ({extraCoveragePct.toFixed(0)}%)
                        </span>
                      </div>
                      <Progress value={extraCoveragePct} className="h-2.5 bg-muted" />
                    </div>

                    {/* Breakdown pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                      <div className="p-2.5 rounded-lg bg-background border border-border">
                        <span className="text-muted-foreground text-[11px] block">14ª di Giugno:</span>
                        <span className="font-semibold text-primary font-mono">
                          {formatEuro(g.allocatedJuneExtra)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-background border border-border">
                        <span className="text-muted-foreground text-[11px] block">Rimborso 730 Luglio:</span>
                        <span className="font-semibold text-primary font-mono">
                          {formatEuro(g.allocatedJuly730)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-background border border-border">
                        <span className="text-muted-foreground text-[11px] block">Impatto Cash Flow:</span>
                        <span className="font-semibold text-foreground font-mono">
                          {monthlyOrdinaryEffort > 0 ? `~${formatEuro(monthlyOrdinaryEffort)}/m` : '0 € / mese 🎉'}
                        </span>
                      </div>
                    </div>

                    {monthlyOrdinaryEffort === 0 && (
                      <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <span>Copertura 100% garantita dalle mensilità estive senza intaccare lo stipendio mensile!</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
