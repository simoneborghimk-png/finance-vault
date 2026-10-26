import { UserFinancialProfile, VaultData, Transaction, SavingsGoal, BudgetRule } from '@/types/finance';
import { generatePresetVirtualTransactions } from './parsers/bankParsers';
// Caricamento resiliente per Zero-Knowledge & Portabilità:
// In ambiente locale con dataset reale (escluso da git), carica i movimenti verificati.
// Su un nuovo clone pubblico o in assenza del file, effettua il fallback automatico sui dati demo.
const realDataModules = import.meta.glob<any>('./realTransactions.json', { eager: true });
const localTransactions = (realDataModules['./realTransactions.json']?.default as Transaction[]) || null;
export const hasLocalRealTransactions = Boolean(localTransactions && localTransactions.length > 0);

export const initialProfile: UserFinancialProfile = {
  baseMonthlyNetSalary: 1953.00,
  extraSalaries: {
    fourteenthNetJune: 1848.00,
    thirteenthNetDec: 1850.00,
    taxRefund730: 2290.00,
  },
  pensionFund: {
    provider: 'Allianz Orizzonte Previdenza',
    comparto: 'Linea Azionaria / Crescita',
    currentValue: 28289.00,
    managementFeePct: 2.0,
    targetAnnualContribution: 5164.57,
  },
  activeLoans: [
    { provider: 'Amazon: LG OLED TV 65"', monthlyInstallment: 134.92, remainingMonths: 7 },
    { provider: 'Amazon: Samsung Galaxy Watch9', monthlyInstallment: 77.80, remainingMonths: 2 },
    { provider: 'Cofidis: Soundbar LG', monthlyInstallment: 56.25, remainingMonths: 8 },
    { provider: 'Vorwerk: Robot Folletto VR7s', monthlyInstallment: 41.66, remainingMonths: 6 },
    { provider: 'Compass / HeyLight: Bimby TM7', monthlyInstallment: 52.17, remainingMonths: 29 },
  ],
};

export const initialGoals: SavingsGoal[] = [
  {
    id: 'goal-japan-trip',
    title: 'Viaggio in Giappone 🇯🇵',
    targetAmount: 4500.00,
    targetDate: '2027-04',
    allocatedJuneExtra: 1848.00,
    allocatedJuly730: 2290.00,
    allocatedDecExtra: 362.00,
    notes: 'Copertura 100% da bonus straordinari: 14ª (1.848 €), 730 reale (2.290 €) e quota 13ª (362 €)',
  },
];

export const initialBudgetRules: BudgetRule[] = [
  {
    id: 'rule-salary',
    name: 'Stipendio Cloudfire',
    amount: 1953.00,
    frequency: 'monthly',
    macroCategory: 'Savings',
    category: 'Stipendio Ordinario',
    channel: 'BancoBPM',
    patternMatch: 'CLOUDFIRE SRL',
  },
  {
    id: 'rule-iren',
    name: 'Bolletta Luce e Gas',
    amount: 145.00,
    frequency: 'bimonthly',
    macroCategory: 'Needs',
    category: 'Utenze Luce e Gas',
    channel: 'BancoBPM',
    patternMatch: 'Iren Mercato',
  },
  {
    id: 'rule-betulla',
    name: 'Condominio Betulla',
    amount: 95.00,
    frequency: 'monthly',
    macroCategory: 'Needs',
    category: 'Spese Condominiali',
    channel: 'BancoBPM',
    patternMatch: 'Condominio Betulla',
  },
];

export function generate12MonthsMockTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  const presetVirtual = generatePresetVirtualTransactions(12);
  transactions.push(...presetVirtual);

  const months = [
    { name: 'Ottobre 2026', date: '2026-10' },
    { name: 'Settembre 2026', date: '2026-09' },
    { name: 'Agosto 2026', date: '2026-08' },
    { name: 'Luglio 2026', date: '2026-07' },
    { name: 'Giugno 2026', date: '2026-06' },
    { name: 'Maggio 2026', date: '2026-05' },
    { name: 'Aprile 2026', date: '2026-04' },
    { name: 'Marzo 2026', date: '2026-03' },
    { name: 'Febbraio 2026', date: '2026-02' },
    { name: 'Gennaio 2026', date: '2026-01' },
    { name: 'Dicembre 2025', date: '2025-12' },
    { name: 'Novembre 2025', date: '2025-11' },
  ];

  months.forEach((m, idx) => {
    const ym = m.date;

    // 1. Stipendio Base (27 del mese)
    transactions.push({
      id: `mock-sal-${ym}`,
      date: `${ym}-27`,
      channel: 'BancoBPM',
      amount: 1953.00,
      macroCategory: 'Savings',
      category: 'Stipendio Ordinario',
      description: 'ACCREDITO STIPENDIO CLOUDFIRE SRL',
      rawDescription: 'BONIFICO DA CLOUDFIRE SRL EMOLUMENTI MENSILI',
      tags: ['#stipendio', '#ricorrente'],
      autoCategorized: true,
    });

    // Quattordicesima a Giugno
    if (ym === '2026-06') {
      transactions.push({
        id: `mock-14th-${ym}`,
        date: `${ym}-15`,
        channel: 'BancoBPM',
        amount: 1848.00,
        macroCategory: 'Savings',
        category: 'Quattordicesima',
        description: 'ACCREDITO 14ª MENSILITÀ CLOUDFIRE SRL',
        rawDescription: 'BONIFICO DA CLOUDFIRE SRL 14ESIMA',
        tags: ['#quattordicesima', '#extra'],
        autoCategorized: true,
      });
    }

    // Tredicesima a Dicembre
    if (ym === '2025-12') {
      transactions.push({
        id: `mock-13th-${ym}`,
        date: `${ym}-15`,
        channel: 'BancoBPM',
        amount: 1850.00,
        macroCategory: 'Savings',
        category: 'Tredicesima',
        description: 'ACCREDITO 13ª MENSILITÀ CLOUDFIRE SRL',
        rawDescription: 'BONIFICO DA CLOUDFIRE SRL 13ESIMA',
        tags: ['#tredicesima', '#extra'],
        autoCategorized: true,
      });
    }

    // Rimborso 730 a Luglio
    if (ym === '2026-07') {
      transactions.push({
        id: `mock-730-${ym}`,
        date: `${ym}-20`,
        channel: 'BancoBPM',
        amount: 1540.00,
        macroCategory: 'Savings',
        category: 'Rimborso 730',
        description: 'AGENZIA ENTRATE RIMBORSO MODELLO 730',
        rawDescription: 'ACCREDITO RIMBORSO FISCALE 730 PREVIDENZA E DETRAZIONI',
        tags: ['#730', '#fisco'],
        autoCategorized: true,
      });
    }

    // Spesa Straordinaria (Ristrutturazione infissi a Febbraio 2026)
    if (ym === '2026-02') {
      transactions.push({
        id: `mock-extra-${ym}`,
        date: `${ym}-14`,
        channel: 'BancoBPM',
        amount: -2400.00,
        macroCategory: 'Extraordinary',
        category: 'Lavori Straordinari Casa',
        description: 'BONIFICO PARLANTE RISTRUTTURAZIONE INFISSI',
        rawDescription: 'BONIFICO EDILIZIA INFISSI IN ALLUMINIO DETRAZIONI 50%',
        tags: ['#straordinaria', '#infissi', '#lavori'],
        isExtraordinary: true,
        autoCategorized: true,
      });
    }

    // Needs: Utenze Iren (Bimestrale ~140€ o mensile proporzionato ~70€)
    transactions.push({
      id: `mock-iren-${ym}`,
      date: `${ym}-12`,
      channel: 'BancoBPM',
      amount: -74.50,
      macroCategory: 'Needs',
      category: 'Utenze Luce e Gas',
      description: 'SDD IREN MERCATO ENERGIA E GAS',
      tags: ['#bolletta', '#luce', '#gas'],
      autoCategorized: true,
    });

    // Needs: Acqua Arca srl
    transactions.push({
      id: `mock-arca-${ym}`,
      date: `${ym}-16`,
      channel: 'BancoBPM',
      amount: -28.00,
      macroCategory: 'Needs',
      category: 'Acqua',
      description: 'SDD ARCA S.R.L. ACQUEDOTTO',
      tags: ['#acqua', '#utenze'],
      autoCategorized: true,
    });

    // Needs: TIM Fibra
    transactions.push({
      id: `mock-tim-${ym}`,
      date: `${ym}-08`,
      channel: 'BancoBPM',
      amount: -29.90,
      macroCategory: 'Needs',
      category: 'Fibra e Connettività',
      description: 'SDD TELECOM ITALIA FIBRA CASA',
      tags: ['#fibra', '#tim'],
      autoCategorized: true,
    });

    // Needs: Condominio Betulla
    transactions.push({
      id: `mock-condo-${ym}`,
      date: `${ym}-10`,
      channel: 'BancoBPM',
      amount: -95.00,
      macroCategory: 'Needs',
      category: 'Spese Condominiali',
      description: 'CONDOMINIO BETULLA RATA ORDINARIA',
      tags: ['#condominio'],
      autoCategorized: true,
    });

    // Needs: Spesa Conad
    transactions.push({
      id: `mock-conad1-${ym}`,
      date: `${ym}-04`,
      channel: 'BancoBPM',
      amount: -185.00,
      macroCategory: 'Needs',
      category: 'Spesa Alimentare',
      description: 'SDD GESTIONE CARTE CONAD ALIMENTARI',
      tags: ['#supermercato', '#cibo'],
      autoCategorized: true,
    });
    transactions.push({
      id: `mock-conad2-${ym}`,
      date: `${ym}-21`,
      channel: 'BancoBPM',
      amount: -160.00,
      macroCategory: 'Needs',
      category: 'Spesa Alimentare',
      description: 'SDD GESTIONE CARTE CONAD SPESA',
      tags: ['#supermercato', '#cibo'],
      autoCategorized: true,
    });

    // Needs: Salute e Farmacia
    transactions.push({
      id: `mock-farma-${ym}`,
      date: `${ym}-17`,
      channel: 'Numia',
      amount: -38.50,
      macroCategory: 'Needs',
      category: 'Salute e Farmacia',
      description: 'FARMACIA CENTRALE S.N.C.',
      tags: ['#salute', '#farmacia'],
      autoCategorized: true,
    });

    // Needs: Trasporti e Carburante
    transactions.push({
      id: `mock-fuel-${ym}`,
      date: `${ym}-09`,
      channel: 'Numia',
      amount: -65.00,
      macroCategory: 'Needs',
      category: 'Trasporti e Carburante',
      description: 'Q8 SERVICE CARBURANTE',
      tags: ['#auto', '#benzina'],
      autoCategorized: true,
    });

    // Commitments: Finanziamenti (Cofidis 85€, Compass 115€, Vorwerk Bimby 45€, TIMFin 25€) = 270€
    transactions.push({
      id: `mock-compass-${ym}`,
      date: `${ym}-15`,
      channel: 'BancoBPM',
      amount: -115.00,
      macroCategory: 'Commitments',
      category: 'Rate Finanziamenti',
      description: 'SDD COMPASS BANCA S.P.A. RATA FINANZIAMENTO',
      tags: ['#rate', '#finanziamento'],
      autoCategorized: true,
    });
    transactions.push({
      id: `mock-cofidis-${ym}`,
      date: `${ym}-15`,
      channel: 'BancoBPM',
      amount: -85.00,
      macroCategory: 'Commitments',
      category: 'Rate Finanziamenti',
      description: 'SDD COFIDIS S.A. RATA DILAZIONE',
      tags: ['#rate', '#finanziamento'],
      autoCategorized: true,
    });
    transactions.push({
      id: `mock-bimby-${ym}`,
      date: `${ym}-15`,
      channel: 'BancoBPM',
      amount: -45.00,
      macroCategory: 'Commitments',
      category: 'Rate Finanziamenti',
      description: 'SDD VORWERK ITALIA BIMBY',
      tags: ['#bimby', '#rate'],
      autoCategorized: true,
    });
    transactions.push({
      id: `mock-timfin-${ym}`,
      date: `${ym}-15`,
      channel: 'BancoBPM',
      amount: -25.00,
      macroCategory: 'Commitments',
      category: 'Rate Finanziamenti',
      description: 'SDD TIMFIN RATA SMARTPHONE',
      tags: ['#timfin', '#rate'],
      autoCategorized: true,
    });

    // Commitments: Donazioni (UNHCR 15€, LAV 10€)
    transactions.push({
      id: `mock-unhcr-${ym}`,
      date: `${ym}-22`,
      channel: 'BancoBPM',
      amount: -15.00,
      macroCategory: 'Commitments',
      category: 'Donazioni & Volontariato',
      description: 'SDD UNHCR DONAZIONE MENSILE',
      tags: ['#onlus'],
      autoCategorized: true,
    });
    transactions.push({
      id: `mock-lav-${ym}`,
      date: `${ym}-22`,
      channel: 'BancoBPM',
      amount: -10.00,
      macroCategory: 'Commitments',
      category: 'Donazioni & Volontariato',
      description: 'SDD LAV LEGA ANTI VIVISEZIONE',
      tags: ['#onlus'],
      autoCategorized: true,
    });

    // Wants: Shopping Amazon & PayPal
    transactions.push({
      id: `mock-amz1-${ym}`,
      date: `${ym}-06`,
      channel: 'Numia',
      amount: -74.90,
      macroCategory: 'Wants',
      category: 'Shopping Amazon',
      description: 'AMAZON.IT PRIME LUXEMBOURG',
      tags: ['#shopping', '#amazon'],
      autoCategorized: true,
    });
    transactions.push({
      id: `mock-pp-${ym}`,
      date: `${ym}-18`,
      channel: 'PayPal',
      amount: -45.00,
      macroCategory: 'Wants',
      category: 'Shopping PayPal',
      description: 'PAYPAL *EBAY COMMERCE',
      tags: ['#paypal'],
      autoCategorized: true,
    });

    // Wants: Abbonamenti digitali
    transactions.push({
      id: `mock-gplay-${ym}`,
      date: `${ym}-03`,
      channel: 'Numia',
      amount: -12.99,
      macroCategory: 'Wants',
      category: 'Abbonamenti Digitali',
      description: 'GOOGLE PLAY APPS & SERVICES',
      tags: ['#abbonamento'],
      autoCategorized: true,
    });

    // Wants: Ristorazione e Uscite
    transactions.push({
      id: `mock-resto-${ym}`,
      date: `${ym}-19`,
      channel: 'Numia',
      amount: -68.00,
      macroCategory: 'Wants',
      category: 'Ristorazione e Bar',
      description: 'OSTERIA DEL VIALE CENA',
      tags: ['#ristorante'],
      autoCategorized: true,
    });
  });

  return transactions.sort((a, b) => b.date.localeCompare(a.date));
}

export const defaultBudgetCaps: Record<string, number> = {
  'Supermercato & Alimentari': 450,
  'Ristorazione e Bar': 180,
  'Shopping Amazon & Abbigliamento': 150,
  'Utenze Luce e Gas': 160,
  'Carburante & Trasporti': 120,
  'Abbonamenti Streaming & Software': 45,
};

export const initialVaultData: VaultData = {
  version: 1,
  profile: initialProfile,
  transactions: localTransactions || generate12MonthsMockTransactions(),
  rules: initialBudgetRules,
  goals: initialGoals,
  budgetCaps: defaultBudgetCaps,
  pensionVoluntaryContribution: 2500.00,
  lastUpdated: new Date().toISOString(),
};
