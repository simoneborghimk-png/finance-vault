import { Transaction, UserFinancialProfile, RecurringOverride } from '@/types/finance';
import { detectRecurringExpenses } from './recurringDetector';

export const MAX_PENSION_DEDUCTIBLE = 5164.57;

export interface SafeToSpendAnalysis {
  month: string; // YYYY-MM
  monthLabel: string; // es. "Ottobre 2026"
  baseNetSalary: number;
  extraIncome: number;
  totalIncome: number;
  committedFixedCosts: number;
  plannedSavings: number;
  safeToSpendCap: number; // Plafond massimo per Wants
  actualWantsSpent: number; // Spesa reale Wants sostenuta
  remainingAllowance: number; // Plafond residuo spendibile
  spentPct: number; // % del plafond consumato
  daysInMonth: number;
  daysPassed: number;
  daysRemaining: number;
  dailyAllowance: number; // Budget giornaliero residuo consigliato
  status: 'safe' | 'warning' | 'danger';
  fixedExpensesCount: number;
}

export type SeasonQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface SeasonalRoadmapPhase {
  quarter: SeasonQuarter;
  months: string[]; // ['Gennaio', 'Febbraio', 'Marzo']
  title: string;
  theme: string;
  isCurrent: boolean;
  expectedIncome: {
    ordinary: number;
    extra: number;
    extraDescription?: string;
  };
  focusPillars: string[];
  strategicActions: Array<{
    title: string;
    description: string;
    targetDate: string;
    recommendedAmount?: number;
    isCompleted?: boolean;
    urgency: 'low' | 'medium' | 'high';
  }>;
}

export interface PensionTranchePlan {
  trancheNumber: 1 | 2 | 3;
  name: string;
  targetMonth: string; // 'Giugno', 'Agosto', 'Novembre/Dicembre'
  sourceLever: string; // '14ª Mensilità', 'Rimborso 730', '13ª Mensilità / Saldo Fine Anno'
  suggestedAmount: number;
  status: 'completed' | 'urgent' | 'pending';
  notes: string;
}

export interface PensionStrategyOverview {
  year: number;
  maxDeductible: number;
  alreadyContributed: number;
  remainingToDeduct: number;
  completionPct: number;
  estimatedTaxRefundAlreadySecured: number;
  estimatedTaxRefundRemaining: number;
  totalEstimatedTaxRefund: number;
  marginalTaxRate: number;
  tranches: PensionTranchePlan[];
  daysRemainingInTaxYear: number;
}

export interface TacticalAdvisorInsight {
  id: string;
  type: 'tax_deadline' | 'loan_payoff' | 'spending_pace' | 'subscription_audit' | 'opportunity';
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  description: string;
  metricBadge?: string;
  impactEuro?: number;
  actionText?: string;
  targetTab?: string;
}

/**
 * Helper per formattare importi in Euro
 */
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatta YYYY-MM in etichetta leggibile italiana (es. "Ottobre 2026")
 */
export function formatMonthYearLabel(yearMonth: string): string {
  if (!yearMonth || !yearMonth.includes('-')) return yearMonth;
  const [yearStr, monthStr] = yearMonth.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10) - 1;
  const d = new Date(y, m, 1);
  const monthName = d.toLocaleDateString('it-IT', { month: 'long' });
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${y}`;
}

/**
 * Estrae tutti i mesi unici (YYYY-MM) presenti nelle transazioni in ordine decrescente
 */
export function getAvailableMonths(transactions: Transaction[]): string[] {
  const months = new Set<string>();
  transactions.forEach((t) => {
    if (t.date && t.date.length >= 7) {
      months.add(t.date.slice(0, 7));
    }
  });

  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  months.add(currentYm);

  return Array.from(months).sort().reverse();
}

/**
 * Calcola l'analisi Safe-to-Spend per il mese selezionato
 */
export function calculateSafeToSpend(
  transactions: Transaction[],
  profile: UserFinancialProfile,
  targetMonth?: string,
  overrides: Record<string, RecurringOverride> = {}
): SafeToSpendAnalysis {
  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const ym = targetMonth || currentYm;

  const [yStr, mStr] = ym.split('-');
  const year = parseInt(yStr, 10);
  const monthNum = parseInt(mStr, 10); // 1-12

  // Giorni del mese
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const isCurrentMonth = ym === currentYm;
  const currentDay = now.getDate();
  const daysPassed = isCurrentMonth ? Math.min(daysInMonth, currentDay) : daysInMonth;
  const daysRemaining = isCurrentMonth ? Math.max(1, daysInMonth - currentDay) : 1;

  // 1. Entrate ordinarie e straordinarie del mese
  // Cerca se nel mese target sono registrate transazioni reali di stipendio
  const monthSalaries = transactions.filter(
    (t) =>
      t.date.startsWith(ym) &&
      t.amount > 0 &&
      (t.category === 'Stipendio Ordinario' ||
        t.category.toLowerCase().includes('stipendio') ||
        t.category.toLowerCase().includes('retribuzione') ||
        t.description.toLowerCase().includes('cloudfire') ||
        t.tags?.includes('#stipendio'))
  );

  let baseNetSalary = profile.baseMonthlyNetSalary || 1949;
  let extraIncome = 0;
  let totalIncome = 0;

  if (monthSalaries.length > 0) {
    totalIncome = monthSalaries.reduce((sum, t) => sum + t.amount, 0);
    // Assegna lo stipendio principale effettivo
    baseNetSalary = monthSalaries[0].amount;
    extraIncome = Math.max(0, totalIncome - baseNetSalary);
  } else {
    if (monthNum === 6 && profile.extraSalaries?.fourteenthNetJune) {
      extraIncome += profile.extraSalaries.fourteenthNetJune;
    } else if ((monthNum === 7 || monthNum === 8) && profile.extraSalaries?.taxRefund730) {
      // Il 730 arriva solitamente in Luglio o Agosto
      extraIncome += profile.extraSalaries.taxRefund730;
    } else if (monthNum === 12 && profile.extraSalaries?.thirteenthNetDec) {
      extraIncome += profile.extraSalaries.thirteenthNetDec;
    }
    totalIncome = baseNetSalary + extraIncome;
  }

  // 2. Costi fissi certi del mese da recurringDetector
  const detectedRecurring = detectRecurringExpenses(transactions, overrides);
  const activeRecurring = detectedRecurring.filter((r) => r.isActive && !r.isIgnored && !r.isCancelled);

  // Calcolo costo fisso mensile equivalente delle uscite ricorrenti attive
  let committedFixedCosts = 0;
  activeRecurring.forEach((r) => {
    if (r.frequency === 'monthly') committedFixedCosts += r.lastAmount;
    else if (r.frequency === 'bimonthly') committedFixedCosts += r.lastAmount / 2;
    else if (r.frequency === 'quarterly') committedFixedCosts += r.lastAmount / 3;
    else if (r.frequency === 'annual') committedFixedCosts += r.lastAmount / 12;
  });

  // Se non ci sono contratti rilevati, fallback su stima dei Needs storici
  if (committedFixedCosts === 0) {
    committedFixedCosts = baseNetSalary * 0.5; // 50% secondo regola 50/30/20
  }

  // 3. Risparmio programmato (20% dello stipendio base ordinario come regola aurea)
  const plannedSavings = Math.round(baseNetSalary * 0.2 * 100) / 100;

  // 4. Safe-to-Spend Cap (Plafond massimo per spese Wants/discrezionali)
  // Non consuma gli extra (14a, 730, 13a) per la spesa ordinaria: protegge gli extra per il risparmio
  const safeToSpendCap = Math.max(0, baseNetSalary - committedFixedCosts - plannedSavings);

  // 5. Spesa Wants reale già effettuata nel mese
  const monthTransactions = transactions.filter((t) => t.date.startsWith(ym));
  const actualWantsSpent = monthTransactions
    .filter((t) => t.amount < 0 && (t.macroCategory === 'Wants' || t.category.includes('Shopping') || t.category.includes('Ristorazione')))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // 6. Plafond residuo e daily allowance
  const remainingAllowance = safeToSpendCap - actualWantsSpent;
  const spentPct = safeToSpendCap > 0 ? Math.round((actualWantsSpent / safeToSpendCap) * 100) : 100;
  const dailyAllowance = Math.max(0, Math.round((remainingAllowance / daysRemaining) * 100) / 100);

  let status: 'safe' | 'warning' | 'danger' = 'safe';
  if (spentPct > 100) {
    status = 'danger';
  } else if (spentPct >= 80) {
    status = 'warning';
  }

  return {
    month: ym,
    monthLabel: formatMonthYearLabel(ym),
    baseNetSalary,
    extraIncome,
    totalIncome,
    committedFixedCosts: Math.round(committedFixedCosts * 100) / 100,
    plannedSavings,
    safeToSpendCap: Math.round(safeToSpendCap * 100) / 100,
    actualWantsSpent: Math.round(actualWantsSpent * 100) / 100,
    remainingAllowance: Math.round(remainingAllowance * 100) / 100,
    spentPct,
    daysInMonth,
    daysPassed,
    daysRemaining,
    dailyAllowance,
    status,
    fixedExpensesCount: activeRecurring.length,
  };
}

/**
 * Calcola la Roadmap Finanziaria Stagionale articolata sui 4 Trimestri
 */
export function calculateSeasonalRoadmap(
  year: number,
  transactions: Transaction[],
  profile: UserFinancialProfile
): SeasonalRoadmapPhase[] {
  const now = new Date();
  const currentMonthIdx = now.getMonth(); // 0-11
  const isCurrentYear = now.getFullYear() === year;

  // Calcolo versamenti al fondo pensione effettuati per determinare azioni completate
  const pensionTxs = transactions.filter(
    (t) =>
      t.date.startsWith(String(year)) &&
      (t.category === 'Previdenza Integrativa' ||
        t.tags?.some((tag) => /previdenz|fondo|deducibil/i.test(tag)) ||
        /allianz|fon\.?te|previdenza/i.test(t.description))
  );
  const totalPensionDone = pensionTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Quarti
  // Q1: Gennaio - Marzo (0, 1, 2)
  // Q2: Aprile - Giugno (3, 4, 5)
  // Q3: Luglio - Settembre (6, 7, 8)
  // Q4: Ottobre - Dicembre (9, 10, 11)

  const isQ1 = isCurrentYear && currentMonthIdx >= 0 && currentMonthIdx <= 2;
  const isQ2 = isCurrentYear && currentMonthIdx >= 3 && currentMonthIdx <= 5;
  const isQ3 = isCurrentYear && currentMonthIdx >= 6 && currentMonthIdx <= 8;
  const isQ4 = isCurrentYear && currentMonthIdx >= 9 && currentMonthIdx <= 11;

  const baseSalary = profile.baseMonthlyNetSalary || 1949;
  const june14th = profile.extraSalaries?.fourteenthNetJune || 1848;
  const refund730 = profile.extraSalaries?.taxRefund730 || 2290;
  const dec13th = profile.extraSalaries?.thirteenthNetDec || 1850;

  return [
    {
      quarter: 'Q1',
      months: ['Gennaio', 'Febbraio', 'Marzo'],
      title: 'Fase 1: Consolidamento & Routine',
      theme: 'Disciplina Baseline & Assorbimento Spese di Inizio Anno',
      isCurrent: isQ1,
      expectedIncome: {
        ordinary: baseSalary * 3,
        extra: 0,
      },
      focusPillars: [
        'Nessun flusso straordinario: operare sul cash-flow ordinario',
        'Assorbimento spese fisse di inizio anno (conguagli, condominio Q1)',
        'Verifica capienze BudgetCap per shopping e tempo libero',
      ],
      strategicActions: [
        {
          title: 'Verifica Consumi Utenze Invernali',
          description: 'Monitora la bolletta Gas e Luce Iren per prevenire sorprese di conguaglio termico.',
          targetDate: `${year}-02-28`,
          urgency: 'medium',
        },
        {
          title: 'Allineamento BudgetCap Mensili',
          description: 'Mantieni la spesa discrezionale Wants strettamente entro la Daily Allowance calcolata.',
          targetDate: `${year}-03-31`,
          urgency: 'low',
        },
      ],
    },
    {
      quarter: 'Q2',
      months: ['Aprile', 'Maggio', 'Giugno'],
      title: 'Fase 2: Finestra 14ª Mensilità',
      theme: 'Iniezione CCNL Estiva & 1ª Tranche Fondo Pensione',
      isCurrent: isQ2,
      expectedIncome: {
        ordinary: baseSalary * 3,
        extra: june14th,
        extraDescription: `14ª Mensilità a Giugno (~${formatEuro(june14th)})`,
      },
      focusPillars: [
        'Accredito 14ª Mensilità a fine Giugno',
        '1ª Tranche consigliata Fondo Pensione (40% del plafond di 5.164,57 €)',
        'Budgetizzazione trasparente per vacanze estive a debito zero',
      ],
      strategicActions: [
        {
          title: '1ª Tranche Versamento Fondo Pensione',
          description: `Versa ~2.000 € su Allianz/Fon.Te sfruttando l'accredito della 14ª mensilità.`,
          targetDate: `${year}-06-30`,
          recommendedAmount: 2000,
          isCompleted: totalPensionDone >= 1500,
          urgency: totalPensionDone >= 1500 ? 'low' : isQ2 ? 'high' : 'medium',
        },
        {
          title: 'Allocazione Vacanze Estive',
          description: 'Isola la quota vacanze dalla 14ª, lasciando intatto lo stipendio base di Luglio.',
          targetDate: `${year}-06-25`,
          urgency: 'medium',
        },
      ],
    },
    {
      quarter: 'Q3',
      months: ['Luglio', 'Agosto', 'Settembre'],
      title: 'Fase 3: Finestra Rimborso Fiscale 730',
      theme: 'Recupero Imposte IRPEF & 2ª Tranche Previdenziale',
      isCurrent: isQ3,
      expectedIncome: {
        ordinary: baseSalary * 3,
        extra: refund730,
        extraDescription: `Rimborso 730 in Busta Paga (~${formatEuro(refund730)})`,
      },
      focusPillars: [
        'Accredito conguaglio credito IRPEF nel cedolino di Luglio/Agosto',
        '2ª Tranche Fondo Pensione (35% del plafond di 5.164,57 €)',
        'Rinforzo Fondo Emergenza o Sinking Funds per grandi progetti',
      ],
      strategicActions: [
        {
          title: '2ª Tranche Versamento Fondo Pensione',
          description: `Reinvesti ~1.800 € del rimborso fiscale per alimentare il circolo virtuoso delle deduzioni.`,
          targetDate: `${year}-08-31`,
          recommendedAmount: 1800,
          isCompleted: totalPensionDone >= 3500,
          urgency: totalPensionDone >= 3500 ? 'low' : isQ3 ? 'high' : 'medium',
        },
        {
          title: 'Controllo Spese Condominiali Betulla',
          description: 'Verifica rata trimestrale condominiale e addebiti estivi.',
          targetDate: `${year}-09-15`,
          urgency: 'low',
        },
      ],
    },
    {
      quarter: 'Q4',
      months: ['Ottobre', 'Novembre', 'Dicembre'],
      title: 'Fase 4: Finestra 13ª & Saturazione Fiscale',
      theme: 'Saturazione Plafond 5.164,57 € & Chiusura Anno Solare',
      isCurrent: isQ4,
      expectedIncome: {
        ordinary: baseSalary * 3,
        extra: dec13th,
        extraDescription: `13ª Mensilità a Dicembre (~${formatEuro(dec13th)})`,
      },
      focusPillars: [
        'Scadenza inderogabile 31 Dicembre per deducibilità Art. 51 TUIR',
        'Bonifico a saldo della capienza residua (3ª Tranche)',
        'Accredito 13ª Mensilità per regali e cuscinetto di fine anno',
      ],
      strategicActions: [
        {
          title: '3ª Tranche a Saldo Fondo Pensione (Deadline 31/12)',
          description: `Bonifica l'esatta quota mancante a raggiungere 5.164,57 € entro il 18 Dicembre per valuta contabile certa.`,
          targetDate: `${year}-12-18`,
          recommendedAmount: Math.max(0, Math.round((MAX_PENSION_DEDUCTIBLE - totalPensionDone) * 100) / 100),
          isCompleted: totalPensionDone >= MAX_PENSION_DEDUCTIBLE - 50,
          urgency: totalPensionDone >= MAX_PENSION_DEDUCTIBLE - 50 ? 'low' : isQ4 ? 'high' : 'medium',
        },
        {
          title: 'Pianificazione Spese Natalizie & Fine Anno',
          description: 'Destina parte della 13ª a spese festive preservando la quota di chiusura fiscale.',
          targetDate: `${year}-12-24`,
          urgency: 'medium',
        },
      ],
    },
  ];
}

/**
 * Calcola la strategia delle Tranches di Versamento al Fondo Pensione
 */
export function calculatePensionStrategy(
  year: number,
  transactions: Transaction[],
  profile: UserFinancialProfile,
  marginalTaxRate: number = 35
): PensionStrategyOverview {
  const pensionTxs = transactions.filter(
    (t) =>
      t.date.startsWith(String(year)) &&
      (t.category === 'Previdenza Integrativa' ||
        t.tags?.some((tag) => /previdenz|fondo|deducibil/i.test(tag)) ||
        /allianz|fon\.?te|previdenza/i.test(t.description))
  );

  const alreadyContributed = pensionTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const remainingToDeduct = Math.max(0, MAX_PENSION_DEDUCTIBLE - alreadyContributed);
  const completionPct = Math.min(100, Math.round((alreadyContributed / MAX_PENSION_DEDUCTIBLE) * 100));

  const estimatedTaxRefundAlreadySecured = Math.round(Math.min(MAX_PENSION_DEDUCTIBLE, alreadyContributed) * (marginalTaxRate / 100) * 100) / 100;
  const estimatedTaxRefundRemaining = Math.round(remainingToDeduct * (marginalTaxRate / 100) * 100) / 100;
  const totalEstimatedTaxRefund = Math.round(MAX_PENSION_DEDUCTIBLE * (marginalTaxRate / 100) * 100) / 100;

  // Calcolo giorni rimanenti nell'anno fiscale
  const now = new Date();
  const endOfYear = new Date(year, 11, 31);
  const diffTime = endOfYear.getTime() - now.getTime();
  const daysRemainingInTaxYear = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Costruzione delle 3 tranches strategiche consigliate
  // Tranche 1: 2.000 € a Giugno (14a)
  // Tranche 2: 1.800 € ad Agosto (730)
  // Tranche 3: Saldo (~1.364,57 €) a Novembre/Dicembre (pre-13a)
  const tranche1Done = alreadyContributed >= 1500;
  const tranche2Done = alreadyContributed >= 3500;
  const tranche3Done = remainingToDeduct <= 20;

  const tranches: PensionTranchePlan[] = [
    {
      trancheNumber: 1,
      name: 'Tranche Estiva CCNL',
      targetMonth: 'Giugno',
      sourceLever: '14ª Mensilità',
      suggestedAmount: 2000,
      status: tranche1Done ? 'completed' : 'pending',
      notes: tranche1Done
        ? 'Tranche completata con successo a consuntivo.'
        : 'Finanziata con parte della 14ª mensilità (~1.850 €).',
    },
    {
      trancheNumber: 2,
      name: 'Tranche Fiscale 730',
      targetMonth: 'Agosto',
      sourceLever: 'Rimborso Fiscale 730',
      suggestedAmount: 1800,
      status: tranche2Done ? 'completed' : tranche1Done ? 'pending' : 'pending',
      notes: tranche2Done
        ? 'Tranche registrata e verificata a consuntivo.'
        : 'Reinvestimento diretto del credito IRPEF liquidato nel cedolino.',
    },
    {
      trancheNumber: 3,
      name: 'Tranche Conclusiva a Saldo',
      targetMonth: 'Novembre / Dicembre',
      sourceLever: '13ª Mensilità / Liquidità di Chiusura',
      suggestedAmount: Math.round(remainingToDeduct * 100) / 100,
      status: tranche3Done ? 'completed' : daysRemainingInTaxYear <= 60 ? 'urgent' : 'pending',
      notes: tranche3Done
        ? 'Plafond annuo di 5.164,57 € completamente saturato!'
        : `Bonifico di conguaglio di ${formatEuro(remainingToDeduct)} entro il 18 Dicembre per garantire la valuta 31/12.`,
    },
  ];

  return {
    year,
    maxDeductible: MAX_PENSION_DEDUCTIBLE,
    alreadyContributed: Math.round(alreadyContributed * 100) / 100,
    remainingToDeduct: Math.round(remainingToDeduct * 100) / 100,
    completionPct,
    estimatedTaxRefundAlreadySecured,
    estimatedTaxRefundRemaining,
    totalEstimatedTaxRefund,
    marginalTaxRate,
    tranches,
    daysRemainingInTaxYear,
  };
}

/**
 * Genera schede tattiche intelligenti basate sui dati reali del vault
 */
export function generateTacticalInsights(
  transactions: Transaction[],
  profile: UserFinancialProfile,
  overrides: Record<string, RecurringOverride> = {}
): TacticalAdvisorInsight[] {
  const insights: TacticalAdvisorInsight[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();

  // 1. Insight Scadenza Previdenziale & Detrazioni
  const pensionStrategy = calculatePensionStrategy(currentYear, transactions, profile);
  if (pensionStrategy.remainingToDeduct > 50) {
    const isUrgent = pensionStrategy.daysRemainingInTaxYear <= 60;
    insights.push({
      id: 'pension-deductibility-urgency',
      type: 'tax_deadline',
      severity: isUrgent ? 'warning' : 'info',
      title: isUrgent ? 'Chiusura Anno Fiscale: Capienza Previdenziale Residua' : 'Opportunità Deducibilità Pensione',
      description: `Hai ancora ${formatEuro(pensionStrategy.remainingToDeduct)} di capienza deducibile (art. 51 TUIR). Versandola entro il 31/12 generi un rimborso IRPEF certo di ${formatEuro(pensionStrategy.estimatedTaxRefundRemaining)} nel prossimo 730.`,
      metricBadge: `${pensionStrategy.daysRemainingInTaxYear} giorni al 31/12`,
      impactEuro: pensionStrategy.estimatedTaxRefundRemaining,
      actionText: 'Simula Versamento',
      targetTab: 'tax-pension',
    });
  } else {
    insights.push({
      id: 'pension-deductibility-maxed',
      type: 'opportunity',
      severity: 'success',
      title: 'Plafond Fondo Pensione Completamente Saturato',
      description: `Complimenti! Hai raggiunto il 100% della deducibilità massima di ${formatEuro(MAX_PENSION_DEDUCTIBLE)}. Hai già blindato un credito fiscale IRPEF di ${formatEuro(pensionStrategy.estimatedTaxRefundAlreadySecured)}.`,
      metricBadge: '100% Saturato',
      impactEuro: pensionStrategy.estimatedTaxRefundAlreadySecured,
      targetTab: 'tax-pension',
    });
  }

  // 2. Insight Liberazione Flussi di Cassa da Prestiti Estinti o in Chiusura
  const detectedRecurring = detectRecurringExpenses(transactions, overrides);
  const closedLoans = detectedRecurring.filter((r) => r.loanDetails?.isClosed);
  const activeLoans = detectedRecurring.filter((r) => r.loanDetails && !r.loanDetails.isClosed && r.isActive);

  if (closedLoans.length > 0) {
    const freedMonthlyCash = closedLoans.reduce((sum, r) => sum + (r.loanDetails?.installmentAmount || r.lastAmount), 0);
    insights.push({
      id: 'freed-cash-flow',
      type: 'loan_payoff',
      severity: 'success',
      title: 'Liquidità Mensile Liberata da Prestiti Chiusi',
      description: `Con l'estinzione di ${closedLoans.map((l) => l.name).join(', ')}, hai liberato ${formatEuro(freedMonthlyCash)}/mese (+${formatEuro(freedMonthlyCash * 12)}/anno). Si consiglia di reindirizzarli verso risparmio o previdenza anziché assorbirli in spese futili.`,
      metricBadge: `+${formatEuro(freedMonthlyCash)}/mese`,
      impactEuro: freedMonthlyCash * 12,
      targetTab: 'fixed-costs',
    });
  }

  // Prestiti con poche rate rimanenti (< 6 mesi)
  const nearEndLoans = activeLoans.filter((l) => l.loanDetails && l.loanDetails.remainingInstallments > 0 && l.loanDetails.remainingInstallments <= 6);
  if (nearEndLoans.length > 0) {
    nearEndLoans.forEach((loan) => {
      insights.push({
        id: `loan-near-end-${loan.id}`,
        type: 'loan_payoff',
        severity: 'info',
        title: `Traguardo Vicino: ${loan.name}`,
        description: `Mancano solo ${loan.loanDetails?.remainingInstallments} rate da ${formatEuro(loan.loanDetails?.installmentAmount || loan.lastAmount)} (scadenza ${loan.loanDetails?.endDate}). Da quel mese il tuo cash flow aumenterà di ${formatEuro(loan.loanDetails?.installmentAmount || loan.lastAmount)}/mese.`,
        metricBadge: `${loan.loanDetails?.remainingInstallments} rate rimaste`,
        impactEuro: (loan.loanDetails?.installmentAmount || loan.lastAmount) * 12,
        targetTab: 'fixed-costs',
      });
    });
  }

  // 3. Insight Safe-to-Spend Mensile
  const safeAnalysis = calculateSafeToSpend(transactions, profile);
  if (safeAnalysis.status === 'danger') {
    insights.push({
      id: 'safe-to-spend-danger',
      type: 'spending_pace',
      severity: 'critical',
      title: 'Attenzione: Tetto Discrezionale Mensile Superato',
      description: `Nel mese corrente le uscite Wants hanno superato il plafond calcolato di ${formatEuro(Math.abs(safeAnalysis.remainingAllowance))}. Frena le spese discrezionali per preservare il tasso di risparmio.`,
      metricBadge: `${safeAnalysis.spentPct}% del tetto`,
      impactEuro: Math.abs(safeAnalysis.remainingAllowance),
      actionText: 'Vedi Transazioni',
      targetTab: 'transactions',
    });
  } else if (safeAnalysis.status === 'safe') {
    insights.push({
      id: 'safe-to-spend-healthy',
      type: 'spending_pace',
      severity: 'success',
      title: 'Disciplina di Cassa Eccellente',
      description: `Stai spendendo in modo equilibrato (${safeAnalysis.spentPct}% del plafond consumato). Hai un budget giornaliero di sicurezza di ${formatEuro(safeAnalysis.dailyAllowance)}/giorno per i restanti ${safeAnalysis.daysRemaining} giorni del mese.`,
      metricBadge: `${formatEuro(safeAnalysis.dailyAllowance)}/giorno`,
      impactEuro: safeAnalysis.remainingAllowance,
      actionText: 'Monitora Spese',
      targetTab: 'transactions',
    });
  }

  // 4. Insight Abbonamenti Annuali e Verifiche
  const annualSubs = detectedRecurring.filter((r) => r.frequency === 'annual' && r.isActive && !r.isIgnored);
  if (annualSubs.length > 0) {
    const overdueAnnuals = annualSubs.filter((r) => r.isOverdue);
    if (overdueAnnuals.length > 0) {
      overdueAnnuals.forEach((sub) => {
        insights.push({
          id: `annual-sub-overdue-${sub.id}`,
          type: 'subscription_audit',
          severity: 'warning',
          title: `Rinnovo Annuale Atteso: ${sub.name}`,
          description: sub.overdueMessage || `Addebito annuale stimato di ${formatEuro(sub.lastAmount)} non ancora contabilizzato.`,
          metricBadge: 'Rinnovo in arrivo',
          impactEuro: sub.lastAmount,
          targetTab: 'fixed-costs',
        });
      });
    }
  }

  return insights;
}

