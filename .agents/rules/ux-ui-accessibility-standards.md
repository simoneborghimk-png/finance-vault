# Checklist Modulare UX, UI & Accessibilità (`src/components/`)

Matrice operativa obbligatoria da validare prima di modificare o creare componenti.

| Area | Regola Tassativa | Token / Pattern Prescritto |
| :--- | :--- | :--- |
| **Colori & Token** | Zero stili/colori hardcoded o classi hex/rgb arbitrarie. Solo token semantici del design system (OKLCH/CSS vars). | `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary`. |
| **Contrasti (WCAG 2.2 AA)** | Minimo 4.5:1 (testo normale) e 3:1 (testo ≥18px / elementi UI attivi). | Accoppiate semantiche verificate: `text-foreground` su `bg-card`/`bg-background`; `text-primary-foreground` su `bg-primary`. |
| **Tipografia & Dati** | Scalatura gerarchica fissa; cifre monetarie e quote contabili sempre monospazio e allineate a destra. | Labels: `text-xs font-medium`; Body: `text-sm`; Titoli: `text-base`/`text-lg font-semibold`; Cifre: `font-mono tabular-nums text-right`. |
| **Gerarchia Azioni** | Max **1 azione primaria** per schermata. Sezioni e toolbar usano `secondary`/`outline`. Comandi riga `ghost`. | Primario: `variant="default"` (`h-8`); Secondario: `variant="secondary"` / `variant="outline"`; Riga: `variant="ghost"`. No bordi dashed. |
| **Submit Resiliente** | Submit **sempre abilitato a riposo**. Disabilitato SOLO durante fetch asincrona (`in-flight`). | Mai `disabled={!isValid}` a riposo. Su invio con errori: focus sul 1° campo invalido ed evidenziazione visiva contestuale. |
| **Form & Input** | Full-width di colonna (`w-full`). Label semantiche collegate con `htmlFor`. Asterisco visivo solo su `required`. | `<Input className="w-full">`, `<Label htmlFor="...">`. Mai sostituire label con solo placeholder. Validazione su evento `blur`. |
| **Tabelle & Dati Complessi** | Dettagli tecnici, log e note NON si stipano nelle celle: usare riga di espansione a tutta larghezza. | Cella: `align-middle`. Espansione: `colSpan={cols.length}`. Filtri: `Popover` (`FilterPanel`), mai `Sheet`. |
| **Badge di Stato** | Icona obbligatoria accoppiata al colore (conformità daltonismo). Icone bottoni/alert = Solid; menu/link = Regular. | Attivo: `CheckCircle2`; Attesa: `Clock` / `AlertTriangle`; Errore: `AlertCircle`; Neutro: `HelpCircle`. |
| **Tooltip & Info Tiers** | **Vietato attributo HTML `title`**. Tooltip solo per icon-button o testo troncato. Dettagli secondari via Toggletip al click. | Icon-button: `<Tooltip>`. Se disabilitato: avvolgere con `<span tabIndex={0}>`. Dettagli/glossario: `Popover` su click icona "i", mai su hover. |
| **Touch Targets & Dialog** | Area interattiva min 44x44px touch, 32–40px desktop. Nessun blocco di propagazione eventi sui dialog container. | Evitare `onClick={(e) => e.stopPropagation()}` su modali. Rimuovere dal DOM funzioni non accessibili al ruolo corrente. |
