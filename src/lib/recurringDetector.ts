import {
  Transaction,
  RecurringExpense,
  RecurringExpenseType,
  RecurringPricingModel,
  RecurringOverride,
  LoanAmortizationDetails,
  ChannelTransition,
  PriceChange,
  HistoricalAmountPoint,
} from '@/types/finance';

/**
 * Normalizzazione delle causali bancarie e descrizioni per raggruppare i merchant contrattuali certi
 */
export function normalizeMerchant(
  raw: string,
  amount?: number,
  rawDesc?: string
): { key: string; displayName: string; preferredType?: RecurringExpenseType } {
  let cleaned = (raw || '').toLowerCase().trim();

  // Rimozione prefissi e rumore da stringhe SDD o POS
  cleaned = cleaned
    .replace(/^addebito diretto sdd - sdd core:\s*[a-z0-9.]+\s*/i, '')
    .replace(/^pagamento express checkout - /i, '')
    .replace(/^pagamento pos esercente:\s*/i, '')
    .replace(/<br>.*$/i, '')
    .trim();

  // 1. Abbonamenti Digitali & Streaming Veri
  if (cleaned.includes('audible')) {
    return { key: 'audible', displayName: 'Audible (Amazon Audiobooks)', preferredType: 'subscription' };
  }
  if (
    cleaned.includes('youtubepremium') ||
    cleaned.includes('youtube premium') ||
    (amount !== undefined && Math.abs(Math.abs(amount) - 15.99) < 0.1 && (cleaned.includes('google') || (rawDesc && /google/i.test(rawDesc))))
  ) {
    return { key: 'youtube-premium', displayName: 'YouTube Premium', preferredType: 'subscription' };
  }
  if (cleaned.includes('microsoft payments') || cleaned.includes('microsoft 365') || cleaned.includes('msft')) {
    const absAmt = amount !== undefined ? Math.abs(amount) : undefined;
    // Escludi acquisti spot su Microsoft Store (es. 39,99 € del 18/12/2025)
    if (absAmt !== undefined && absAmt > 20) {
      return { key: 'other', displayName: raw };
    }
    return { key: 'microsoft-gamepass', displayName: 'Xbox Game Pass PC (Microsoft)', preferredType: 'subscription' };
  }

  // Segmentazione abbonamenti specifici Google Play
  if (cleaned.includes('google play') || cleaned.includes('google payment') || (rawDesc && /google/i.test(rawDesc))) {
    const absAmt = amount !== undefined ? Math.abs(amount) : undefined;
    // 1. Philips Hue (Hue Sync TV per LG) - 2,99 €/mese
    if (absAmt !== undefined && Math.abs(absAmt - 2.99) < 0.2) {
      return { key: 'google-philips-hue', displayName: 'Philips Hue (Hue Sync TV per LG)', preferredType: 'subscription' };
    }
    // 2. tado° Auto-Assist - 29,99 €/anno
    if (absAmt !== undefined && Math.abs(absAmt - 29.99) < 0.5) {
      const fullDesc = `${cleaned} ${rawDesc || ''}`.toLowerCase();
      // Escludi transazione spot rimborsata PayPal di Maggio
      if (fullDesc.includes('paypal') || fullDesc.includes('preautorizzato')) {
        return { key: 'other', displayName: raw };
      }
      return { key: 'google-tado', displayName: 'tado° (Auto-Assist Clima)', preferredType: 'subscription' };
    }
    // 3. Hiya: Spam Blocker & Caller ID - 13,99 € promo annuale
    if (absAmt !== undefined && Math.abs(absAmt - 13.99) < 0.5 && !cleaned.includes('youtube')) {
      return { key: 'google-hiya', displayName: 'Hiya: Spam Blocker & Caller ID', preferredType: 'subscription' };
    }
    return { key: 'other', displayName: raw };
  }
  if (cleaned.includes('amazon prime') || cleaned.includes('amzn prime')) {
    return { key: 'amazon-prime', displayName: 'Amazon Prime', preferredType: 'subscription' };
  }
  if (cleaned.includes('aruba')) {
    return { key: 'aruba', displayName: 'Aruba (Dominio & PEC)', preferredType: 'subscription' };
  }
  if (cleaned.includes('linkedin')) {
    return { key: 'linkedin', displayName: 'LinkedIn Premium', preferredType: 'subscription' };
  }
  if (
    cleaned.includes('netflix') ||
    cleaned.includes('gabriele zaniboni') ||
    cleaned.includes('zaniboni') ||
    (rawDesc && /zaniboni/i.test(rawDesc))
  ) {
    return { key: 'netflix', displayName: 'Netflix (Quota Gabriele Zaniboni)', preferredType: 'subscription' };
  }
  if (
    cleaned.includes('crunchyroll') ||
    cleaned.includes('cruncyroll') ||
    ((cleaned.includes('silvioleuci') || cleaned.includes('silvio leuci') || cleaned.includes('silvio l.')) && amount !== undefined && Math.abs(Math.abs(amount) - 15) < 0.5) ||
    (rawDesc && /silvioleuci|silvio leuci/i.test(rawDesc) && amount !== undefined && Math.abs(Math.abs(amount) - 15) < 0.5)
  ) {
    return { key: 'crunchyroll', displayName: 'Crunchyroll (Quota Silvio Leuci)', preferredType: 'subscription' };
  }
  if (cleaned.includes('spotify')) {
    return { key: 'spotify', displayName: 'Spotify', preferredType: 'subscription' };
  }
  if (cleaned.includes('apple.com/bill') || cleaned.includes('icloud')) {
    return { key: 'apple-services', displayName: 'Apple iCloud / Services', preferredType: 'subscription' };
  }
  if (cleaned.includes('disney') || cleaned.includes('disneyplus')) {
    return { key: 'disney-plus', displayName: 'Disney+', preferredType: 'subscription' };
  }

  // 2. Rate & Finanziamenti Attivi (Commitments)
  if (cleaned.includes('timfin') || cleaned.includes('tim fin')) {
    return { key: 'timfin', displayName: 'TIMFin (Finanziamento)', preferredType: 'loan' };
  }
  if (cleaned.includes('compass banca') || cleaned.includes('compass')) {
    if (cleaned.includes('estinzione')) return { key: 'other', displayName: raw };
    // Riconoscimento distinto tra finanziamento pregresso (terminato a Giugno 2026 da ~61€) e Bimby TM7 (52,17€)
    const absAmt = amount !== undefined ? Math.abs(amount) : undefined;
    if ((absAmt !== undefined && Math.abs(absAmt - 61.09) < 2) || cleaned.includes('1947137')) {
      return { key: 'compass-old', displayName: 'Compass: Finanziamento Pregresso', preferredType: 'loan' };
    }
    return { key: 'compass-bimby', displayName: 'Compass / HeyLight: Bimby TM7', preferredType: 'loan' };
  }
  if (cleaned.includes('vorwerk')) {
    // Escludiamo spese spot isolate per ricambi o accessori (es. 29 €)
    const absAmt = amount !== undefined ? Math.abs(amount) : undefined;
    if (absAmt !== undefined && Math.abs(absAmt - 41.66) > 5) {
      return { key: 'other', displayName: raw };
    }
    return { key: 'vorwerk-folletto', displayName: 'Vorwerk: Robot Folletto VR7s', preferredType: 'loan' };
  }
  if (cleaned.includes('cofidis')) {
    const absAmt = amount !== undefined ? Math.abs(amount) : undefined;
    if (absAmt !== undefined && Math.abs(absAmt - 89.14) < 0.2) {
      return { key: 'cofidis-switch2', displayName: 'Cofidis (Nintendo Switch 2)', preferredType: 'loan' };
    }
    if (absAmt !== undefined && Math.abs(absAmt - 56.25) < 0.2) {
      return { key: 'cofidis-soundbar', displayName: 'Cofidis (Soundbar LG)', preferredType: 'loan' };
    }
    return { key: 'cofidis-multi', displayName: 'Cofidis (Rate Cumulative)', preferredType: 'loan' };
  }
  // Rate Amazon ufficiali rateizzate
  if (cleaned.includes('amazon: rata')) {
    if (cleaned.includes('oled') || cleaned.includes('tv') || cleaned.includes('65"')) {
      return { key: 'amazon-rata-tv', displayName: 'Amazon: Rata LG OLED evo 65" G5 TV', preferredType: 'loan' };
    }
    if (cleaned.includes('watch') || cleaned.includes('galaxy') || cleaned.includes('samsung')) {
      return { key: 'amazon-rata-watch', displayName: 'Amazon: Rata Samsung Galaxy Watch9 44mm', preferredType: 'loan' };
    }
    const baseProd = raw.replace(/\s*\(\d+\/\d+\)/, '').trim();
    const key = 'amazon-rata-' + baseProd.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
    return { key, displayName: baseProd, preferredType: 'loan' };
  }

  // 3. Utenze Domestiche & Connettività Contrattuale (Needs)
  if (cleaned.includes('telecomitalia') || cleaned.includes('telecom italia') || cleaned.includes('tim fibra')) {
    return { key: 'telecomitalia', displayName: 'TIM Fibra & Connettività', preferredType: 'utility' };
  }
  if (cleaned.includes('iren') || (rawDesc && /iren/i.test(rawDesc))) {
    const fullStr = `${cleaned} ${rawDesc || ''}`.toLowerCase();
    if (fullStr.includes('ambiente') || fullStr.includes('53489172')) {
      return { key: 'iren-ambiente', displayName: 'Iren Ambiente (TARI)', preferredType: 'utility' };
    }
    // Riconoscimento distinto tra Luce e Gas in base al codice mandato SDD
    if (fullStr.includes('10223638')) {
      return { key: 'iren-luce', displayName: 'Iren Mercato (Luce)', preferredType: 'utility' };
    }
    if (fullStr.includes('10223664')) {
      return { key: 'iren-gas', displayName: 'Iren Mercato (Gas)', preferredType: 'utility' };
    }
    // Fallback: se l'importo è >= 70€ o la causale contiene 'luce'
    if ((amount !== undefined && Math.abs(amount) >= 70) || fullStr.includes('luce')) {
      return { key: 'iren-luce', displayName: 'Iren Mercato (Luce)', preferredType: 'utility' };
    }
    return { key: 'iren-gas', displayName: 'Iren Mercato (Gas)', preferredType: 'utility' };
  }
  if (cleaned.includes('arca s.r.l') || cleaned.includes('arca srl') || cleaned.includes('arca acqua')) {
    return { key: 'arca-acqua', displayName: 'Arca S.r.l. (Acqua)', preferredType: 'utility' };
  }
  if (cleaned.includes('enel energia')) {
    return { key: 'enel-energia', displayName: 'Enel Energia (Utenza)', preferredType: 'utility' };
  }
  if (
    cleaned.includes('pulizia scale') ||
    (cleaned.includes('scale') && (cleaned.includes('condominio') || cleaned.includes('pulizia')))
  ) {
    return { key: 'pulizia-scale', displayName: 'Pulizia Scale Condominio', preferredType: 'utility' };
  }
  if (
    cleaned.includes('condominio') ||
    cleaned.includes('betulla') ||
    cleaned.includes('rata condominiale') ||
    (rawDesc && /condominio|betulla/i.test(rawDesc))
  ) {
    return { key: 'condominio-betulla', displayName: 'Condominio Betulla (Rate Condominiali)', preferredType: 'utility' };
  }

  // 4. Donazioni Periodiche SDD
  if (cleaned.includes('unhcr') || (rawDesc && /unhcr/i.test(rawDesc))) {
    const fullStr = `${cleaned} ${rawDesc || ''}`.toLowerCase();
    // Escludiamo la donazione spot una tantum su PayPal
    if (fullStr.includes('paypal') || (fullStr.includes('donazione') && !fullStr.includes('sdd'))) {
      return { key: 'other', displayName: raw };
    }
    return { key: 'unhcr', displayName: 'UNHCR Agenzia ONU Rifugiati', preferredType: 'donation' };
  }
  if (
    cleaned.includes('lav lega anti vivisezione') ||
    cleaned.includes('lega anti vivisezione') ||
    /\b(sdd\s+)?lav\b/i.test(cleaned)
  ) {
    // Escludiamo esplicitamente prodotti commerciali contenenti la radice lav (detersivo lavatrice, lavastoviglie, ecc.)
    if (!/lavatr|lavastov|lavand|lavagg/i.test(cleaned)) {
      return { key: 'lav', displayName: 'LAV - Lega Anti Vivisezione', preferredType: 'donation' };
    }
  }

  // Qualsiasi altra spesa ordinaria (supermercati, bar, distributori, acquisti singoli, bancomat) NON è un contratto
  return { key: 'other', displayName: raw };
}

/**
 * Anagrafica Piani di Ammortamento per Finanziamenti Reali Certificati
 */
function getPredefinedLoanAmortization(
  key: string,
  txs: Transaction[]
): LoanAmortizationDetails | undefined {
  const count = txs.length;

  if (key === 'amazon-rata-tv') {
    // 12 rate mensili a tasso zero da 134,92 € (Totale: 1.619 €)
    // 5 rate pagate ad oggi (-674,60 €), 7 rate rimanenti (944,40 € residui). Scadenza Maggio 2027.
    const paidInstallments = 5;
    const totalInstallments = 12;
    const remainingInstallments = Math.max(0, totalInstallments - paidInstallments);
    const installmentAmount = 134.92;
    return {
      totalInstallments,
      paidInstallments,
      remainingInstallments,
      totalAmount: 1619.0,
      paidAmount: 674.6,
      remainingDebt: 944.4,
      installmentAmount,
      endDate: '2027-05',
      isClosed: false,
      notes: 'Amazon: 12 rate mensili a tasso zero (LG OLED TV 65" G5)',
    };
  }

  if (key === 'amazon-rata-watch') {
    // 5 rate mensili a tasso zero da 77,80 € (Totale: 389 €)
    // 3 rate pagate ad oggi (-233,40 €), 2 rate rimanenti (155,60 € residui). Scadenza Dicembre 2026.
    const paidInstallments = 3;
    const totalInstallments = 5;
    const remainingInstallments = Math.max(0, totalInstallments - paidInstallments);
    const installmentAmount = 77.8;
    return {
      totalInstallments,
      paidInstallments,
      remainingInstallments,
      totalAmount: 389.0,
      paidAmount: 233.4,
      remainingDebt: 155.6,
      installmentAmount,
      endDate: '2026-12',
      isClosed: false,
      notes: 'Amazon: 5 rate mensili a tasso zero (Galaxy Watch9)',
    };
  }

  if (key === 'cofidis-soundbar') {
    // Cofidis Soundbar LG: 675 € in 12 rate mensili da 56,25 € (partito ad Agosto 2026)
    // 3 rate pagate (Agosto, Settembre, Ottobre 2026 = 168,75 €), 9 rate rimanenti (506,25 € residui). Scadenza Luglio 2027.
    const paidInstallments = 3;
    const totalInstallments = 12;
    const remainingInstallments = 9;
    const installmentAmount = 56.25;
    return {
      totalInstallments,
      paidInstallments,
      remainingInstallments,
      totalAmount: 675.0,
      paidAmount: 168.75,
      remainingDebt: 506.25,
      installmentAmount,
      endDate: '2027-07',
      isClosed: false,
      notes: 'Cofidis: 12 rate mensili da 56,25 € (Soundbar LG - In ammortamento)',
    };
  }

  if (key === 'cofidis-switch2') {
    // Nintendo Switch 2: 5 rate da 89,14 € (totale 445,70 € da Giugno a Ottobre 2026).
    // Concluso ed estinto a Ottobre 2026.
    return {
      totalInstallments: 5,
      paidInstallments: 5,
      remainingInstallments: 0,
      totalAmount: 445.7,
      paidAmount: 445.7,
      remainingDebt: 0.0,
      installmentAmount: 89.14,
      endDate: '2026-10',
      isClosed: true,
      notes: 'Cofidis: 5 rate da 89,14 € (Nintendo Switch 2 - Estinto a Ottobre 2026)',
    };
  }

  if (key === 'timfin') {
    // TIMFin: Chiuso / Estinto su richiesta dell'utente
    return {
      totalInstallments: 24,
      paidInstallments: Math.max(count, 21),
      remainingInstallments: 0,
      totalAmount: 240.0,
      paidAmount: 240.0,
      remainingDebt: 0.0,
      installmentAmount: 10.0,
      endDate: '2026-10',
      isClosed: true,
      notes: 'Finanziamento TIMFin estinto e chiuso',
    };
  }

  if (key === 'vorwerk-folletto' || key === 'vorwerk-bimby') {
    // Vorwerk Robot Folletto VR7s + Base RB7s (Ordine N. 25/6048837 del 25/03/2025)
    // Fornitura: 1.239,84 € (acconto 50 € + 190 € consegna = 240 € versati; 999,84 € finanziati con Vorwerk SDD)
    // Piano: 24 rate da 41,66 € (decorrenza a 30gg da aprile 2025 = maggio 2025).
    // Rate pagate finora (maggio 2025 – ottobre 2026): 18 rate (749,88 €).
    // Rate residue: 6 rate rimanenti (da novembre 2026 ad aprile 2027), debito residuo 249,96 €. Scadenza: Aprile 2027.
    const totalInstallments = 24;
    const paidInstallments = 18;
    const remainingInstallments = 6;
    const installmentAmount = 41.66;
    return {
      totalInstallments,
      paidInstallments,
      remainingInstallments,
      totalAmount: 999.84,
      paidAmount: 749.88,
      remainingDebt: 249.96,
      installmentAmount,
      endDate: '2027-04',
      isClosed: false,
      notes: 'Vorwerk SDD: Ordine N. 25/6048837 (Robot Folletto VR7s + Base RB7s, 24 rate da 41,66 €)',
    };
  }

  if (key === 'compass-bimby' || key === 'compass-banca') {
    // Bimby TM7 (Pratica dilazione HeyLight / Compass n. 2668770 - Ordine Vorwerk del 12/03/2026)
    // Totale dilazionato a tasso zero: 1.878,00 € in 36 rate mensili (rate 1-35: 52,17 €, rata 36: 52,05 €).
    // Avvio: prima rata 15/04/2026. Rate pagate finora (aprile – ottobre 2026): 7 rate (365,19 €).
    // Rate residue: 29 rate rimanenti (da novembre 2026 a marzo 2029).
    // Debito residuo: 1.512,81 € (28 × 52,17 € + 52,05 €). Scadenza: Marzo 2029.
    const totalInstallments = 36;
    const paidInstallments = 7;
    const remainingInstallments = 29;
    const installmentAmount = 52.17;
    return {
      totalInstallments,
      paidInstallments,
      remainingInstallments,
      totalAmount: 1878.0,
      paidAmount: 365.19,
      remainingDebt: 1512.81,
      installmentAmount,
      endDate: '2029-03',
      isClosed: false,
      notes: 'HeyLight / Compass: Pratica n. 2668770 (Bimby TM7, 36 rate da 52,17 € - ultima 52,05 €)',
    };
  }

  if (key === 'compass-old') {
    // Compass: Finanziamento pregresso da ~61,09 €/mese iniziato a giugno 2025 ed estinto al 30/06/2026
    return {
      totalInstallments: 12,
      paidInstallments: 12,
      remainingInstallments: 0,
      totalAmount: 733.08,
      paidAmount: 733.08,
      remainingDebt: 0.0,
      installmentAmount: 61.09,
      endDate: '2026-06',
      isClosed: true,
      notes: 'Compass: Finanziamento pregresso da 61,09 € estinto a Giugno 2026',
    };
  }

  return undefined;
}

/**
 * Calcolo data prossimo rinnovo e giorni mancanti deterministici
 */
function calculateNextBilling(
  lastDateStr: string,
  frequency: 'monthly' | 'bimonthly' | 'quarterly' | 'annual',
  referenceDate: Date = new Date()
): { nextExpectedDate: string; daysUntilNext: number; isActive: boolean } {
  const [y, m, d] = lastDateStr.split('-').map(Number);
  const lastDate = new Date(y, m - 1, d);

  const monthsToAdd =
    frequency === 'monthly' ? 1 : frequency === 'bimonthly' ? 2 : frequency === 'quarterly' ? 3 : 12;

  let candidateDate = new Date(lastDate);
  candidateDate.setMonth(candidateDate.getMonth() + monthsToAdd);

  const diffDaysFromRef = (candidateDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (diffDaysFromRef < -45) {
    while (candidateDate.getTime() < referenceDate.getTime() - 15 * 86400000) {
      candidateDate.setMonth(candidateDate.getMonth() + monthsToAdd);
    }
  }

  const nextY = candidateDate.getFullYear();
  const nextM = String(candidateDate.getMonth() + 1).padStart(2, '0');
  const nextD = String(candidateDate.getDate()).padStart(2, '0');
  const nextExpectedDate = `${nextY}-${nextM}-${nextD}`;

  const daysUntilNext = Math.round((candidateDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

  const maxInactiveDays = frequency === 'annual' ? 400 : frequency === 'bimonthly' ? 100 : 75;
  const daysSinceLast = Math.round((referenceDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  const isActive = daysSinceLast <= maxInactiveDays;

  return { nextExpectedDate, daysUntilNext, isActive };
}

/**
 * Motore Rigoroso di Rilevamento Contratti & Abbonamenti
 * Include esclusivamente contratti certificati e rate di ammortamento a scadenza finita
 */
export function detectRecurringExpenses(
  transactions: Transaction[],
  overrides: Record<string, RecurringOverride> = {},
  referenceDate: Date = new Date()
): RecurringExpense[] {
  const expenseTxs = (transactions || []).filter(
    (t) => t.amount < 0 && !t.isExtraordinary && t.macroCategory !== 'Extraordinary'
  );

  const groups: Record<
    string,
    {
      key: string;
      displayName: string;
      preferredType: RecurringExpenseType;
      transactions: Transaction[];
    }
  > = {};

  expenseTxs.forEach((t) => {
    const norm = normalizeMerchant(t.description, t.amount, t.rawDescription);

    let contractType = norm.preferredType;
    if (!contractType) {
      if (t.tags?.includes('#abbonamento') && t.category === 'Abbonamenti Digitali') {
        contractType = 'subscription';
      } else if (t.tags?.includes('#rata') && t.category === 'Rate Finanziamenti') {
        contractType = 'loan';
      }
    }

    if (norm.key === 'cofidis-multi') {
      // Disaggregazione analitica degli addebiti cumulativi SDD (145,39 € = 89,14 € Switch 2 + 56,25 € Soundbar LG)
      if (!groups['cofidis-soundbar']) {
        groups['cofidis-soundbar'] = {
          key: 'cofidis-soundbar',
          displayName: 'Cofidis (Soundbar LG)',
          preferredType: 'loan',
          transactions: [],
        };
      }
      if (!groups['cofidis-switch2']) {
        groups['cofidis-switch2'] = {
          key: 'cofidis-switch2',
          displayName: 'Cofidis (Nintendo Switch 2)',
          preferredType: 'loan',
          transactions: [],
        };
      }

      // Quota Soundbar LG: 56,25 €
      groups['cofidis-soundbar'].transactions.push({
        ...t,
        id: `${t.id}-soundbar`,
        amount: -56.25,
        description: 'Cofidis: Rata Soundbar LG (quota SDD)',
        rawDescription: t.rawDescription || t.description,
      });

      // Quota Nintendo Switch 2: 89,14 €
      groups['cofidis-switch2'].transactions.push({
        ...t,
        id: `${t.id}-switch2`,
        amount: -89.14,
        description: 'Cofidis: Rata Nintendo Switch 2 (quota SDD)',
        rawDescription: t.rawDescription || t.description,
      });
      return;
    }

    if (!contractType || norm.key === 'other') {
      return;
    }

    if (!groups[norm.key]) {
      groups[norm.key] = {
        key: norm.key,
        displayName: norm.displayName,
        preferredType: contractType,
        transactions: [],
      };
    }
    groups[norm.key].transactions.push(t);
  });

  // Assicuriamo le 5 rate storiche complete per Switch 2 (Giugno, Luglio, Agosto, Settembre, Ottobre 2026)
  if (!groups['cofidis-switch2']) {
    groups['cofidis-switch2'] = {
      key: 'cofidis-switch2',
      displayName: 'Cofidis (Nintendo Switch 2)',
      preferredType: 'loan',
      transactions: [],
    };
  }
  const hasJune = groups['cofidis-switch2'].transactions.some((tx) => tx.date.startsWith('2026-06'));
  if (!hasJune) {
    groups['cofidis-switch2'].transactions.unshift({
      id: 'cofidis-switch2-2026-06-01',
      date: '2026-06-01',
      channel: 'BancoBPM',
      amount: -89.14,
      macroCategory: 'Commitments',
      category: 'Rate Finanziamenti',
      description: 'Cofidis: Rata 1/5 Nintendo Switch 2',
      rawDescription: 'addebito diretto sdd - sdd core: mndtca999102710443p001 cofidis sa',
      tags: ['#rata', '#prestito', '#debito', '#ricorrente'],
      autoCategorized: true,
    });
  }

  // Sottoscrizioni annuali certe certificate (Netflix e Crunchyroll)
  if (!groups['netflix']) {
    groups['netflix'] = {
      key: 'netflix',
      displayName: 'Netflix (Quota Gabriele Zaniboni)',
      preferredType: 'subscription',
      transactions: [
        {
          id: 'netflix-2025-10-15',
          date: '2025-10-15',
          channel: 'PayPal',
          amount: -120.0,
          macroCategory: 'Wants',
          category: 'Abbonamenti Digitali',
          description: 'Gabriele Zaniboni',
          rawDescription: 'Pagamento inviato a Gabriele Zaniboni',
          tags: ['#abbonamento', '#streaming', '#netflix', '#paypal'],
          autoCategorized: true,
        },
      ],
    };
  }

  if (!groups['crunchyroll']) {
    groups['crunchyroll'] = {
      key: 'crunchyroll',
      displayName: 'Crunchyroll (Quota Silvio Leuci)',
      preferredType: 'subscription',
      transactions: [
        {
          id: 'satis-2025-09-01-15.00',
          date: '2025-09-01',
          channel: 'Satispay',
          amount: -15.0,
          macroCategory: 'Wants',
          category: 'Abbonamenti Digitali',
          description: 'Silvio L. (@silvioleuci)',
          rawDescription: '👤 a una Persona - Silvio L. (@silvioleuci)',
          tags: ['#abbonamento', '#streaming', '#anime', '#crunchyroll', '#satispay'],
          autoCategorized: true,
        },
        {
          id: 'satis-2026-09-01-5-15.00',
          date: '2026-09-01',
          channel: 'Satispay',
          amount: -15.0,
          macroCategory: 'Wants',
          category: 'Abbonamenti Digitali',
          description: 'Silvio L. (@silvioleuci)',
          rawDescription: '👤 a una Persona - Silvio L. (@silvioleuci)',
          tags: ['#abbonamento', '#streaming', '#anime', '#crunchyroll', '#satispay'],
          autoCategorized: true,
        },
      ],
    };
  }

  // Uscita fissa mensile contanti per Pulizia Scale (15 €/mese il 10 di ogni mese dall'origine dei dati a Settembre 2025)
  if (!groups['pulizia-scale']) {
    const scaleMonths = [
      '2025-09-10',
      '2025-10-10',
      '2025-11-10',
      '2025-12-10',
      '2026-01-10',
      '2026-02-10',
      '2026-03-10',
      '2026-04-10',
      '2026-05-10',
      '2026-06-10',
      '2026-07-10',
      '2026-08-10',
      '2026-09-10',
      '2026-10-10',
    ];
    groups['pulizia-scale'] = {
      key: 'pulizia-scale',
      displayName: 'Pulizia Scale Condominio',
      preferredType: 'utility',
      transactions: scaleMonths.map((d) => ({
        id: `cash-scale-${d}`,
        date: d,
        channel: 'Contanti',
        amount: -15.0,
        macroCategory: 'Needs',
        category: 'Spese Condominiali',
        description: 'Pulizia Scale Condominio',
        rawDescription: 'Quota mensile contanti pulizia scale',
        tags: ['#spesecondominiali', '#puliziascale', '#contanti', '#ricorrente'],
        autoCategorized: true,
      })),
    };
  }

  const detected: RecurringExpense[] = [];

  Object.values(groups).forEach((group) => {
    const txs = group.transactions.sort((a, b) => a.date.localeCompare(b.date));
    const count = txs.length;
    if (count === 0 && group.key !== 'cofidis-switch2') return;

    // Calcolo intervalli
    const intervals: number[] = [];
    for (let i = 1; i < txs.length; i++) {
      const d1 = new Date(txs[i - 1].date).getTime();
      const d2 = new Date(txs[i].date).getTime();
      intervals.push(Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
    }

    const avgInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 30;

    let frequency: 'monthly' | 'bimonthly' | 'quarterly' | 'annual' = 'monthly';
    if (
      group.key === 'amazon-prime' ||
      group.key === 'aruba' ||
      group.key === 'iren-ambiente' ||
      group.key === 'netflix' ||
      group.key === 'crunchyroll' ||
      avgInterval >= 300
    ) {
      frequency = 'annual';
    } else if (
      group.key === 'condominio-betulla' ||
      (avgInterval >= 80 && avgInterval < 150)
    ) {
      frequency = 'quarterly';
    } else if (
      group.preferredType === 'utility' &&
      (group.key.includes('arca') || group.key.includes('enel') || avgInterval >= 45) &&
      !group.key.includes('iren-luce') &&
      !group.key.includes('iren-gas')
    ) {
      frequency = 'bimonthly';
    }

    // Calcolo importi
    const amounts = txs.map((t) => Math.abs(t.amount));
    const averageAmount = amounts.length > 0 ? Math.round((amounts.reduce((a, b) => a + b, 0) / amounts.length) * 100) / 100 : 0;
    const lastTx = txs[txs.length - 1] || { date: '2026-10-24', channel: 'BancoBPM', category: 'Rate Finanziamenti', macroCategory: 'Commitments' };
    let lastAmount = txs.length > 0 ? Math.abs(lastTx.amount) : 0;

    // Rilevamento dettagli ammortamento prestito (se loan)
    let loanDetails = group.preferredType === 'loan' ? getPredefinedLoanAmortization(group.key, txs) : undefined;

    // Se è la Soundbar Cofidis, la rata reale attiva futura da Novembre è 56,25 €
    if (group.key === 'cofidis-soundbar') {
      lastAmount = 56.25;
    }

    // Prossimo addebito
    let { nextExpectedDate, daysUntilNext, isActive: baseIsActive } = calculateNextBilling(lastTx.date, frequency, referenceDate);

    // Override utente (con retrocompatibilità per vecchia chiave 'condominio')
    const override = overrides[group.key] || (group.key === 'condominio-betulla' ? overrides['condominio'] : undefined);
    const finalName = override?.customName || group.displayName;
    let finalFrequency = override?.customFrequency || frequency;
    const isIgnored = override?.ignored === true;
    const isClosed = override?.isClosed !== undefined ? override.isClosed : loanDetails?.isClosed || false;

    // Analisi canali di pagamento storici e rilevamento transizione (es. Nexi -> Numia)
    const uniqueChannels = Array.from(new Set(txs.map((t) => t.channel)));
    const firstChannel = txs[0]?.channel || lastTx.channel;
    let lastChannel = lastTx.channel;

    let channelTransition: ChannelTransition | undefined = undefined;

    // Gestione specifica YouTube Premium: nuovo listino a 15,99 €/mese e transizione su Numia confermata (fatturazione 02/11)
    if (group.key === 'youtube-premium') {
      lastAmount = 15.99;
      nextExpectedDate = '2026-11-02';
      daysUntilNext = Math.round((new Date(2026, 10, 2).getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      lastChannel = 'Numia';
      if (!uniqueChannels.includes('Numia')) uniqueChannels.push('Numia');
      channelTransition = {
        from: 'Nexi',
        to: 'Numia',
        transitionDate: '2026-10-02',
      };
    }

    // Gestione specifica Xbox Game Pass (Microsoft): 12,99 €/mese su PayPal con rinnovo confermato al 24/10
    if (group.key === 'microsoft-gamepass') {
      lastAmount = 12.99;
      nextExpectedDate = '2026-11-24';
      daysUntilNext = Math.round((new Date(2026, 10, 24).getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      lastChannel = 'PayPal';
    }

    if (uniqueChannels.length > 1 && firstChannel !== lastChannel && !channelTransition) {
      const firstNewTx = txs.find((t) => t.channel === lastChannel);
      channelTransition = {
        from: firstChannel,
        to: lastChannel,
        transitionDate: firstNewTx?.date,
      };
    }

    // Gestione specifica Philips Hue (Google Play): 2,99 €/mese su Numia (da Nexi) con rinnovo al 17/11
    if (group.key === 'google-philips-hue') {
      finalFrequency = 'monthly';
      lastAmount = 2.99;
      nextExpectedDate = '2026-11-17';
      daysUntilNext = Math.round((new Date(2026, 10, 17).getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      lastChannel = 'Numia';
      if (!uniqueChannels.includes('Numia')) uniqueChannels.push('Numia');
      channelTransition = {
        from: 'Nexi',
        to: 'Numia',
        transitionDate: '2026-10-15',
      };
    }

    // Gestione specifica tado° (Google Play): 29,99 €/anno con rinnovo al 15/02/2027
    if (group.key === 'google-tado') {
      finalFrequency = 'annual';
      lastAmount = 29.99;
      nextExpectedDate = '2027-02-15';
      daysUntilNext = Math.round((new Date(2027, 1, 15).getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Gestione specifica Hiya (Google Play): Promo annuale annullata dall'utente (scadenza naturale 06/01/2027)
    const isCancelled = group.key === 'google-hiya' || override?.isCancelled === true;
    const cancellationEndDate = group.key === 'google-hiya' ? '2027-01-06' : override?.cancellationEndDate;
    if (group.key === 'google-hiya') {
      finalFrequency = 'annual';
      lastAmount = 13.99;
      nextExpectedDate = '2027-01-06';
      daysUntilNext = Math.round((new Date(2027, 0, 6).getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Gestione specifica Netflix: 120,00 €/anno, scadenza intorno al 15/10. Nel 2026 non ancora pagato
    if (group.key === 'netflix') {
      finalFrequency = 'annual';
      lastAmount = 120.0;
      nextExpectedDate = '2026-10-15';
      daysUntilNext = Math.round((new Date(2026, 9, 15).getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      lastChannel = 'PayPal';
    }

    // Gestione specifica Crunchyroll: 15,00 €/anno, scadenza intorno al 01/09. Già pagato nel 2026 (prossimo 01/09/2027)
    if (group.key === 'crunchyroll') {
      finalFrequency = 'annual';
      lastAmount = 15.0;
      nextExpectedDate = '2027-09-01';
      daysUntilNext = Math.round((new Date(2027, 8, 1).getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      lastChannel = 'Satispay';
    }

    // Gestione specifica Audible: sospeso temporaneamente dall'utente (non rinnovato)
    const isPaused = group.key === 'audible' || override?.isPaused === true;

    if (loanDetails) {
      loanDetails = {
        ...loanDetails,
        isClosed,
        remainingInstallments: override?.customRemainingInstallments !== undefined ? override.customRemainingInstallments : loanDetails.remainingInstallments,
        remainingDebt: override?.customRemainingDebt !== undefined ? override.customRemainingDebt : loanDetails.remainingDebt,
        endDate: override?.customEndDate || loanDetails.endDate,
      };
    }

    // Determinazione Pricing Model: flat (canone costante o connettività), variable_utility (bolletta a consumo) o loan (rata)
    let pricingModel: RecurringPricingModel = 'flat';
    if (group.preferredType === 'loan') {
      pricingModel = 'loan';
    } else if (group.preferredType === 'utility') {
      if (group.key === 'telecomitalia' || group.key === 'pulizia-scale') {
        pricingModel = 'flat'; // Canone fisso (connettività o pulizia scale)
      } else {
        pricingModel = 'variable_utility'; // Utenze variabili in base ai consumi e rate condominiali
      }
    } else {
      pricingModel = 'flat';
    }

    // Costruzione serie storica cronologica ordinata (dal più vecchio al più recente)
    const historicalTrend: HistoricalAmountPoint[] = txs.map((t) => ({
      date: t.date,
      amount: Math.abs(t.amount),
      channel: t.channel,
    }));

    // Rilevamento rimodulazioni / variazioni tariffarie storiche per contratti a canone flat
    const priceChanges: PriceChange[] = [];
    if (pricingModel === 'flat' && historicalTrend.length >= 2) {
      let prevAmt = historicalTrend[0].amount;
      for (let i = 1; i < historicalTrend.length; i++) {
        const curr = historicalTrend[i];
        const diff = Math.round((curr.amount - prevAmt) * 100) / 100;
        // Rileva salto tariffario significativo (>= 0.50 €)
        if (Math.abs(diff) >= 0.5) {
          priceChanges.push({
            date: curr.date,
            from: prevAmt,
            to: curr.amount,
            delta: diff,
            deltaPct: Math.round((diff / prevAmt) * 1000) / 10,
          });
          prevAmt = curr.amount;
        }
      }
    }

    // Se YouTube Premium: assicura il tracciamento della rimodulazione al nuovo listino 15,99 €
    if (group.key === 'youtube-premium') {
      const hasRecentIncrease = priceChanges.some((p) => p.to === 15.99);
      if (!hasRecentIncrease && historicalTrend.length > 0) {
        const lastOldAmt = historicalTrend[historicalTrend.length - 1]?.amount === 15.99
          ? (historicalTrend[historicalTrend.length - 2]?.amount || 13.99)
          : 13.99;
        priceChanges.push({
          date: '2026-10-02',
          from: lastOldAmt,
          to: 15.99,
          delta: Math.round((15.99 - lastOldAmt) * 100) / 100,
          deltaPct: Math.round(((15.99 - lastOldAmt) / lastOldAmt) * 1000) / 10,
        });
      }
    }

    // Calcolo scostamento percentuale dell'ultima bolletta rispetto alla media storica per le utenze variabili
    let varianceVsAveragePct: number | undefined = undefined;
    if (pricingModel === 'variable_utility' && averageAmount > 0) {
      varianceVsAveragePct = Math.round(((lastAmount - averageAmount) / averageAmount) * 1000) / 10;
    }

    // Calcolo costo annuo matematicamente coerente
    let annualCost = 0;
    if (isPaused || isCancelled) {
      annualCost = 0;
    } else if (pricingModel === 'loan') {
      if (loanDetails && !loanDetails.isClosed) {
        annualCost = Math.round(loanDetails.installmentAmount * Math.min(12, loanDetails.remainingInstallments) * 100) / 100;
      } else {
        annualCost = 0;
      }
    } else if (pricingModel === 'flat') {
      // Per i contratti flat (connettività, streaming, donazioni) il costo annuo è esattamente il canone vigente moltiplicato per la frequenza
      const multiplier = finalFrequency === 'monthly' ? 12 : finalFrequency === 'bimonthly' ? 6 : finalFrequency === 'quarterly' ? 4 : 1;
      annualCost = Math.round(lastAmount * multiplier * 100) / 100;
    } else {
      // Per le utenze a consumo variabile (Luce, Gas, Acqua) la spesa annua attesa è la media moltiplicata per la frequenza
      const multiplier = finalFrequency === 'monthly' ? 12 : finalFrequency === 'bimonthly' ? 6 : finalFrequency === 'quarterly' ? 4 : 1;
      annualCost = Math.round(averageAmount * multiplier * 100) / 100;
    }

    const isActive = !isClosed && !isPaused && !isCancelled && (
      group.key === 'youtube-premium' ||
      group.key === 'microsoft-gamepass' ||
      group.key === 'google-philips-hue' ||
      group.key === 'google-tado' ||
      group.key === 'netflix' ||
      group.key === 'crunchyroll' ||
      group.key === 'pulizia-scale' ||
      baseIsActive
    );

    // Rilevamento addebito in ritardo o mancante (es. mancato passaggio da carta dismessa o rinnovo annuale pendente)
    const isOverdue = isActive && !isPaused && !isCancelled && daysUntilNext < 0;
    let overdueMessage: string | undefined = undefined;
    if (isOverdue) {
      if (group.key === 'netflix') {
        overdueMessage = `Rinnovo annuale 2026 atteso intorno al 15 Ottobre non ancora contabilizzato.`;
      } else if (lastChannel === 'Nexi') {
        overdueMessage = `Addebito atteso su Carta Nexi non riscontrato a Ottobre. Verificare transito su Carta Numia.`;
      } else {
        overdueMessage = `Addebito previsto il ${nextExpectedDate} non ancora contabilizzato.`;
      }
    }

    detected.push({
      id: group.key,
      name: finalName,
      category:
        override?.customCategory ||
        (group.key === 'condominio-betulla' || group.key === 'pulizia-scale'
          ? 'Spese Condominiali'
          : group.preferredType === 'donation'
          ? 'Donazioni & Volontariato'
          : lastTx.category) ||
        'Rate Finanziamenti',
      macroCategory:
        group.key === 'condominio-betulla' || group.key === 'pulizia-scale'
          ? 'Needs'
          : lastTx.macroCategory || 'Commitments',
      channel: lastTx.channel || (group.key === 'pulizia-scale' ? 'Contanti' : 'BancoBPM'),
      channels: uniqueChannels,
      channelTransition,
      type: group.preferredType,
      pricingModel,
      averageAmount: loanDetails ? loanDetails.installmentAmount : averageAmount,
      lastAmount: loanDetails ? loanDetails.installmentAmount : lastAmount,
      varianceVsAveragePct,
      priceChanges,
      historicalTrend,
      frequency: finalFrequency,
      annualCost,
      lastDate: lastTx.date,
      firstDate: txs[0]?.date,
      nextExpectedDate,
      daysUntilNext,
      isActive,
      isPaused,
      isCancelled,
      cancellationEndDate,
      isOverdue,
      overdueMessage,
      occurrences: count,
      sampleTransactions: txs.slice().reverse(), // Tutti gli addebiti storici registrati
      loanDetails,
      isIgnored,
    });
  });

  return detected.sort((a, b) => {
    if (a.isIgnored !== b.isIgnored) return a.isIgnored ? 1 : -1;
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.daysUntilNext - b.daysUntilNext;
  });
}
