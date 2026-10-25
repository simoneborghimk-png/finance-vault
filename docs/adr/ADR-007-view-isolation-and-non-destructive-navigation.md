# ADR-007: Isolamento delle Viste e Navigazione Non-Distruttiva tra Tab

- **Stato:** Accettata
- **Data:** 2026-10-24
- **Contesto:**
  All'interno dell'applicazione coesistono diverse tab con finalità contabili eterogenee (Executive Dashboard, Registro Transazioni, Simulatore Fiscale, Budget & Obiettivi). Condividere i filtri temporali a livello globale causava interferenze indesiderate (es. filtrare *"Questo mese"* in Transazioni alterava inaspettatamente la Dashboard). Inoltre, il comportamento predefinito di smontaggio (unmount) dei componenti inattivi in Radix UI causava la perdita dello stato utente (ricerche, paginazione, espansioni) al cambio scheda.

- **Decisione:**
  1. **Isolamento Rigoroso dello Stato per Tab:** Ogni vista è l'unica proprietaria dei propri stati di filtraggio (ricerca, categorie, finestra temporale, toggle straordinarie). I filtri non vengono mai sollevati a livello root a meno di esplicita richiesta.
  2. **Navigazione Non-Distruttiva con `forceMount`:** Le istanze delle schede principali in `App.tsx` vengono mantenute costantemente montate nel DOM tramite la prop `forceMount` su `<TabsContent>` e nascoste con la classe CSS semantica `data-[state=inactive]:hidden`.
  3. **Rilevamento Deterministico dei Preset Temporali:** Nel componente `DateRangePicker`, la label attiva (es. *"Questo mese"*, *"Anno in corso"*) e la spunta nell'elenco preset vengono calcolate confrontando in tempo reale le date effettive (`value.from` e `value.to`) con i preset prestabiliti, eliminando qualsiasi disallineamento tra stato interno e date renderizzate.
  4. **Layout a Due Livelli per le Toolbar:** Separare categoricamente la barra di ricerca full-text (riga superiore a tutta larghezza) dai controlli dimensionali e temporali (riga inferiore flessibile con respiro), scongiurando il collasso visivo dell'input sui layout desktop standard.

- **Conseguenze:**
  - **Positive:** Esperienza utente fluida e priva di attriti; navigazione tra tab istantanea senza perdita di contesto o reset accidentali; zero contaminazione cross-tab.
  - **Negative:** Tutte le tab rimangono in memoria (impatto trascurabile su React 18+ in ambiente client-side con dataset JSON da qualche migliaio di record).
