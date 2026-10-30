import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  ArrowRight,
} from 'lucide-react';
import {
  Transaction,
  MacroCategory,
  MACRO_CATEGORY_SHORT_LABELS,
  CustomCategoryRule,
} from '@/types/finance';
import {
  findMatchingTransactions,
} from '@/lib/userRulesEngine';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Badge,
  Switch,
  Label,
} from './ui';

interface CategoryRulesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rules: CustomCategoryRule[];
  transactions: Transaction[];
  onSaveRule: (rule: CustomCategoryRule) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string, active: boolean) => void;
  onApplyRulesToAll: () => { modifiedCount: number };
  initialPrefilledRule?: Partial<CustomCategoryRule> | null;
}

const MACRO_COLORS: Record<MacroCategory, { bg: string; text: string; border: string }> = {
  Needs: { bg: 'bg-sky-950/40', text: 'text-sky-300', border: 'border-sky-500/30' },
  Commitments: { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-500/30' },
  Wants: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-500/30' },
  Savings: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  Extraordinary: { bg: 'bg-rose-950/40', text: 'text-rose-300', border: 'border-rose-500/30' },
};

const CHANNEL_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  all: { bg: 'bg-muted/40', text: 'text-foreground', border: 'border-border' },
  BancoBPM: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Numia: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  Nexi: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  PayPal: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  Satispay: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  Contanti: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
};

export const CategoryRulesManager: React.FC<CategoryRulesManagerProps> = ({
  open,
  onOpenChange,
  rules,
  transactions,
  onSaveRule,
  onDeleteRule,
  onToggleRule,
  onApplyRulesToAll,
  initialPrefilledRule,
}) => {
  // Modal view: 'list' | 'form'
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPattern, setFormPattern] = useState('');
  const [formMatchField, setFormMatchField] = useState<'both' | 'description' | 'rawDescription'>('both');
  const [formChannel, setFormChannel] = useState<Transaction['channel'] | 'all'>('all');
  const [formMacroCategory, setFormMacroCategory] = useState<MacroCategory>('Needs');
  const [formCategory, setFormCategory] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formIsExtraordinary, setFormIsExtraordinary] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);

  // Feedback banner state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Elenco categorie note presenti nel Vault
  const existingCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.category && t.category.trim()) {
        set.add(t.category.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'it'));
  }, [transactions]);

  // Se viene fornita una regola precompilata (es. da riga transazione), apri direttamente il form
  useEffect(() => {
    if (initialPrefilledRule && open) {
      setEditingRuleId(null);
      setFormName(initialPrefilledRule.name || '');
      setFormPattern(initialPrefilledRule.pattern || '');
      setFormMatchField(initialPrefilledRule.matchField || 'both');
      setFormChannel(initialPrefilledRule.channel || 'all');
      setFormMacroCategory(initialPrefilledRule.macroCategory || 'Needs');
      setFormCategory(initialPrefilledRule.category || '');
      setFormTags((initialPrefilledRule.tags || []).join(', '));
      setFormIsExtraordinary(Boolean(initialPrefilledRule.isExtraordinary));
      setFormIsActive(true);
      setViewMode('form');
    }
  }, [initialPrefilledRule, open]);

  // Anteprima live dei movimenti che farebbero match con il pattern in fase di digitazione
  const liveMatches = useMemo(() => {
    if (!formPattern.trim()) return [];
    const tempRule: CustomCategoryRule = {
      id: 'temp-preview',
      name: formName || 'Preview',
      pattern: formPattern,
      matchField: formMatchField,
      channel: formChannel,
      macroCategory: formMacroCategory,
      category: formCategory,
      tags: [],
      isActive: true,
      createdAt: '',
    };
    return findMatchingTransactions(transactions, tempRule);
  }, [formPattern, formMatchField, formChannel, formMacroCategory, formCategory, formName, transactions]);

  // Apertura form per nuova regola
  const handleOpenNewForm = () => {
    setEditingRuleId(null);
    setFormName('');
    setFormPattern('');
    setFormMatchField('both');
    setFormChannel('all');
    setFormMacroCategory('Needs');
    setFormCategory('');
    setFormTags('');
    setFormIsExtraordinary(false);
    setFormIsActive(true);
    setViewMode('form');
    setFeedback(null);
  };

  // Apertura form per modifica regola esistente
  const handleOpenEditForm = (rule: CustomCategoryRule) => {
    setEditingRuleId(rule.id);
    setFormName(rule.name);
    setFormPattern(rule.pattern);
    setFormMatchField(rule.matchField);
    setFormChannel(rule.channel);
    setFormMacroCategory(rule.macroCategory);
    setFormCategory(rule.category);
    setFormTags((rule.tags || []).join(', '));
    setFormIsExtraordinary(Boolean(rule.isExtraordinary));
    setFormIsActive(rule.isActive);
    setViewMode('form');
    setFeedback(null);
  };

  // Salvataggio regola
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPattern.trim() || !formCategory.trim()) {
      setFeedback({ type: 'error', message: 'Compila nome regola, pattern di ricerca e categoria.' });
      return;
    }

    const parsedTags = formTags
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const rule: CustomCategoryRule = {
      id: editingRuleId || `user-rule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: formName.trim(),
      pattern: formPattern.trim(),
      matchField: formMatchField,
      channel: formChannel,
      macroCategory: formMacroCategory,
      category: formCategory.trim(),
      tags: parsedTags,
      isExtraordinary: formIsExtraordinary,
      isActive: formIsActive,
      createdAt: new Date().toISOString(),
    };

    onSaveRule(rule);
    setFeedback({
      type: 'success',
      message: `Regola "${rule.name}" salvata con successo nel Vault cifrato!`,
    });
    setViewMode('list');
  };

  // Esecuzione retroattiva su tutte le transazioni
  const handleApplyAll = () => {
    const { modifiedCount } = onApplyRulesToAll();
    setFeedback({
      type: 'success',
      message:
        modifiedCount > 0
          ? `Applicazione completata: ${modifiedCount} ${modifiedCount === 1 ? 'movimento riclassificato' : 'movimenti riclassificati'} nel Vault!`
          : 'Nessun movimento modificato: tutte le transazioni corrispondenti sono già allineate.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border text-foreground max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
        {/* ========================================================================= */}
        {/* HEADER MODALE                                                             */}
        {/* ========================================================================= */}
        <DialogHeader className="p-5 pb-3 border-b border-border/70 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Regole di Categorizzazione Personalizzate (In-Vault)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Le regole vengono salvate nel Vault cifrato (AES-256-GCM) e hanno priorità assoluta sull'auto-categorizzazione
            </DialogDescription>
          </div>
          {viewMode === 'list' && (
            <Button
              onClick={handleOpenNewForm}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 py-1.5 h-8 flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuova Regola</span>
            </Button>
          )}
        </DialogHeader>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`mx-5 mt-3 p-2.5 rounded-lg border text-xs flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-destructive/10 border-destructive/30 text-destructive'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Chiudi avviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CORPO: VISTA FORM DI MODIFICA/CREAZIONE                                    */}
        {/* ========================================================================= */}
        {viewMode === 'form' ? (
          <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Nome Regola */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="rule-name" className="text-xs font-medium text-foreground">
                  Nome Regola *
                </Label>
                <Input
                  id="rule-name"
                  placeholder="Es. Panificio San Carlo, Barbiere Marco, Spesa Locale..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-8 text-xs bg-background border-border"
                  required
                />
              </div>

              {/* Pattern di Ricerca */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rule-pattern" className="text-xs font-medium text-foreground">
                    Pattern di Testo o Regex *
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    Supporta testo o regex (es. <code className="text-primary font-mono">/parrucchiera/i</code>)
                  </span>
                </div>
                <Input
                  id="rule-pattern"
                  placeholder="Es. SAN CARLO, PANIFICIO, GIUSI FORTUNATA..."
                  value={formPattern}
                  onChange={(e) => setFormPattern(e.target.value)}
                  className="h-8 text-xs font-mono bg-background border-border"
                  required
                />
              </div>

              {/* Campo di Confronto */}
              <div className="space-y-1.5">
                <Label htmlFor="rule-matchfield" className="text-xs font-medium text-foreground">
                  Verifica in
                </Label>
                <select
                  id="rule-matchfield"
                  value={formMatchField}
                  onChange={(e) => setFormMatchField(e.target.value as any)}
                  className="w-full h-8 px-2 rounded-lg bg-background border border-border text-xs text-foreground cursor-pointer"
                >
                  <option value="both">Descrizione + Causale Estesa</option>
                  <option value="description">Solo Descrizione Principale</option>
                  <option value="rawDescription">Solo Causale Banca (raw)</option>
                </select>
              </div>

              {/* Canale */}
              <div className="space-y-1.5">
                <Label htmlFor="rule-channel" className="text-xs font-medium text-foreground">
                  Canale Rilevato
                </Label>
                <select
                  id="rule-channel"
                  value={formChannel}
                  onChange={(e) => setFormChannel(e.target.value as any)}
                  className="w-full h-8 px-2 rounded-lg bg-background border border-border text-xs text-foreground cursor-pointer"
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

              {/* Macro-Categoria */}
              <div className="space-y-1.5">
                <Label htmlFor="rule-macro" className="text-xs font-medium text-foreground">
                  Macro-Categoria Assegnata
                </Label>
                <select
                  id="rule-macro"
                  value={formMacroCategory}
                  onChange={(e) => setFormMacroCategory(e.target.value as MacroCategory)}
                  className="w-full h-8 px-2 rounded-lg bg-background border border-border text-xs text-foreground cursor-pointer"
                >
                  <option value="Needs">Needs (Necessità e Spese Fisse)</option>
                  <option value="Wants">Wants (Desideri e Tempo Libero)</option>
                  <option value="Commitments">Commitments (Finanziamenti & Rate)</option>
                  <option value="Savings">Savings (Risparmi & Entrate)</option>
                  <option value="Extraordinary">Extraordinary (Uscite Straordinarie)</option>
                </select>
              </div>

              {/* Categoria */}
              <div className="space-y-1.5">
                <Label htmlFor="rule-category" className="text-xs font-medium text-foreground">
                  Categoria Assegnata *
                </Label>
                <Input
                  id="rule-category"
                  placeholder="Es. Supermercato & Alimentari, Ristorazione..."
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  list="known-categories"
                  className="h-8 text-xs bg-background border-border"
                  required
                />
                <datalist id="known-categories">
                  {existingCategories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              {/* Tags Opzionali */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="rule-tags" className="text-xs font-medium text-foreground">
                  Tag Aggiuntivi (opzionali, separati da spazio o virgola)
                </Label>
                <Input
                  id="rule-tags"
                  placeholder="#cibo #colazione #locale"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="h-8 text-xs bg-background border-border"
                />
              </div>

              {/* Switch Attivo & Straordinaria */}
              <div className="flex items-center justify-between sm:col-span-2 p-2.5 rounded-lg border border-border bg-card/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-foreground">Regola Attiva</div>
                  <div className="text-[10px] text-muted-foreground">
                    Se disattivata, la regola non verrà applicata durante l'ingestione
                  </div>
                </div>
                <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
              </div>
            </div>

            {/* Anteprima Live dei Match nel Vault */}
            {formPattern.trim() && (
              <div className="p-3 rounded-xl border border-border bg-card/90 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Search className="w-3.5 h-3.5 text-primary" />
                    <span>Corrispondenze nel Vault ({liveMatches.length})</span>
                  </div>
                  <Badge variant="outline" className="border-border text-[10px]">
                    {liveMatches.length > 0 ? `${liveMatches.length} movimenti trovati` : 'Nessun match'}
                  </Badge>
                </div>
                {liveMatches.length > 0 ? (
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {liveMatches.slice(0, 4).map((m) => (
                      <div
                        key={m.id}
                        className="text-[11px] flex items-center justify-between p-1.5 rounded-md bg-background/60 border border-border/50"
                      >
                        <span className="truncate max-w-72 font-medium text-foreground">{m.description}</span>
                        <div className="flex items-center gap-2 shrink-0 text-[10px] text-muted-foreground font-mono">
                          <span>{m.date}</span>
                          <span className={m.amount > 0 ? 'text-primary' : 'text-foreground'}>
                            {m.amount > 0 ? `+${m.amount.toFixed(2)}` : m.amount.toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    ))}
                    {liveMatches.length > 4 && (
                      <div className="text-[10px] text-muted-foreground text-center pt-0.5">
                        ...e altri {liveMatches.length - 4} movimenti
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Nessuna transazione attualmente presente nel Vault corrisponde a questo pattern.
                  </p>
                )}
              </div>
            )}

            <DialogFooter className="pt-2 flex flex-row items-center justify-between sm:justify-between gap-2 border-t border-border/70">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 text-xs border-border text-foreground hover:bg-accent"
              >
                Annulla
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                {editingRuleId ? 'Salva Modifiche' : 'Crea Regola'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* ========================================================================= */
          /* CORPO: VISTA ELENCO REGOLE SALVATE                                        */
          /* ========================================================================= */
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {rules.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">Nessuna Regola Personalizzata</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Crea la tua prima regola per mappare automaticamente merchant e descrizioni ricorrenti nella giusta categoria.
                  </p>
                </div>
                <Button
                  onClick={handleOpenNewForm}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3.5 py-1.5 h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Crea Prima Regola
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => {
                  const channelStyle = CHANNEL_BADGES[rule.channel] || CHANNEL_BADGES.all;
                  const macroStyle = MACRO_COLORS[rule.macroCategory];
                  const matchCount = findMatchingTransactions(transactions, rule).length;

                  return (
                    <div
                      key={rule.id}
                      className={`p-3 rounded-xl border transition-all ${
                        rule.isActive
                          ? 'border-border bg-card/80 hover:bg-card hover:border-primary/30'
                          : 'border-border/50 bg-muted/20 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-foreground truncate">{rule.name}</span>
                            <Badge
                              variant="outline"
                              className={`${channelStyle.bg} ${channelStyle.text} ${channelStyle.border} text-[10px] py-0 px-1.5 font-medium`}
                            >
                              {rule.channel === 'all' ? 'Tutti i Canali' : rule.channel}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px] bg-background border-border text-foreground py-0 px-1.5"
                            >
                              "{rule.pattern}"
                            </Badge>
                          </div>

                          {/* Target Category Mapping */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>Mappa in:</span>
                            <Badge
                              variant="outline"
                              className={`${macroStyle.bg} ${macroStyle.text} ${macroStyle.border} text-[10px] py-0 px-1.5 font-medium`}
                            >
                              {MACRO_CATEGORY_SHORT_LABELS[rule.macroCategory] || rule.macroCategory}
                            </Badge>
                            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="font-medium text-foreground">{rule.category}</span>
                            <span className="text-[10px] text-muted-foreground ml-1">
                              ({matchCount} {matchCount === 1 ? 'movimento' : 'movimenti'})
                            </span>
                          </div>

                          {/* Tags */}
                          {rule.tags && rule.tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              {rule.tags.map((tg) => (
                                <span key={tg} className="text-[10px] text-muted-foreground font-mono">
                                  {tg}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Azioni Regola: Toggle Attiva, Edit, Delete */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={(checked) => onToggleRule(rule.id, checked)}
                            aria-label={`Attiva o disattiva la regola ${rule.name}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditForm(rule)}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                            aria-label={`Modifica regola ${rule.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteRule(rule.id)}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            aria-label={`Elimina regola ${rule.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* FOOTER MODALE: AZIONE RETROATTIVA & CHIUSURA                              */}
        {/* ========================================================================= */}
        {viewMode === 'list' && (
          <DialogFooter className="p-4 border-t border-border/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyAll}
              disabled={rules.filter((r) => r.isActive).length === 0}
              className="h-8 text-xs border-border hover:border-primary/40 text-foreground flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              <span>Applica Regole ai Movimenti Esistenti</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs border-border text-foreground hover:bg-accent"
            >
              Chiudi
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
