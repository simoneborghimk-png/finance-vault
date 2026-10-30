import { RecurringExpense } from '@/types/finance';

export interface SimLoanItem {
  id: string;
  name: string;
  lender: string;
  installmentAmount: number;
  paidInstallments: number;
  remainingInstallments: number;
  totalInstallments: number;
  totalAmount: number;
  paidAmount: number;
  remainingDebt: number;
  endDate: string; // "YYYY-MM"
  notes?: string;
  channel?: string;
  efficiencyRatio: number; // (installmentAmount / remainingDebt) * 100
}

export type PayoffStrategy = 'cashflow' | 'snowball' | 'custom';

export interface SimulatedLoanOutcome {
  loan: SimLoanItem;
  status: 'fully_paid' | 'partially_paid' | 'unchanged';
  allocatedAmount: number;
  newRemainingDebt: number;
  newRemainingInstallments: number;
  freedMonthlyInstallment: number;
  newEndDate: string;
}

export interface PayoffSimulationResult {
  strategy: PayoffStrategy;
  availableLiquidity: number;
  totalAllocated: number;
  unallocatedLiquidity: number;

  // Baseline metrics
  baselineTotalDebt: number;
  baselineMonthlyRate: number;
  baselineDebtFreeDate: string; // "YYYY-MM"
  baselineActiveCount: number;

  // Simulated metrics
  simulatedTotalDebt: number;
  simulatedMonthlyRate: number;
  freedMonthlyCashFlow: number;
  annualCashFlowFreed: number;
  simulatedDebtFreeDate: string; // "YYYY-MM" o "Debito Zero"
  monthsSaved: number;
  fullyPaidLoansCount: number;

  // Outcomes per loan
  loanOutcomes: SimulatedLoanOutcome[];
}

/**
 * Calcola i mesi intercorrenti tra due date ISO "YYYY-MM"
 */
export function getMonthsBetween(dateA: string, dateB: string): number {
  if (!dateA || !dateB || dateA === 'Debito Zero' || dateB === 'Debito Zero') return 0;
  const [yA, mA] = dateA.split('-').map(Number);
  const [yB, mB] = dateB.split('-').map(Number);
  if (isNaN(yA) || isNaN(mA) || isNaN(yB) || isNaN(mB)) return 0;
  return (yB - yA) * 12 + (mB - mA);
}

/**
 * Formatta "YYYY-MM" in etichetta leggibile italiana (es. "2027-04" -> "Aprile 2027")
 */
export function formatMonthYearLabel(ym: string): string {
  if (!ym || ym === 'Debito Zero') return 'Debito Zero 🎉';
  const [y, m] = ym.split('-').map(Number);
  if (isNaN(y) || isNaN(m)) return ym;
  const date = new Date(y, m - 1, 1);
  const label = date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Calcola la nuova data di fine ammortamento riducendo le rate residue
 */
export function computeNewEndDate(currentEndDate: string, remainingBefore: number, remainingAfter: number): string {
  if (remainingAfter <= 0) return 'Estinto';
  const [year, month] = currentEndDate.split('-').map(Number);
  if (isNaN(year) || isNaN(month)) return currentEndDate;
  const reductionMonths = Math.max(0, remainingBefore - remainingAfter);
  const targetDate = new Date(year, month - 1 - reductionMonths, 1);
  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Estrae e normalizza i finanziamenti attivi dai contratti ricorrenti
 */
export function extractActiveLoans(expenses: RecurringExpense[]): SimLoanItem[] {
  return expenses
    .filter(
      (e) =>
        e.pricingModel === 'loan' &&
        e.loanDetails &&
        !e.loanDetails.isClosed &&
        e.loanDetails.remainingDebt > 0
    )
    .map((e) => {
      const details = e.loanDetails!;
      const totalAmount = details.totalAmount || (details.paidAmount || 0) + details.remainingDebt;
      const paidAmount = details.paidAmount || totalAmount - details.remainingDebt;
      const efficiencyRatio =
        details.remainingDebt > 0 ? (details.installmentAmount / details.remainingDebt) * 100 : 0;

      // Determinazione dell'ente creditizio o fornitore
      let lender = 'Finanziamento';
      const text = `${e.name} ${details.notes || ''}`.toLowerCase();
      if (text.includes('vorwerk') || text.includes('folletto')) lender = 'Vorwerk SDD';
      else if (text.includes('compass') || text.includes('bimby') || text.includes('heylight'))
        lender = 'Compass / HeyLight';
      else if (text.includes('cofidis')) lender = 'Cofidis';
      else if (text.includes('amazon')) lender = 'Amazon Rate';

      return {
        id: e.id,
        name: e.name,
        lender,
        installmentAmount: details.installmentAmount,
        paidInstallments: details.paidInstallments,
        remainingInstallments: details.remainingInstallments,
        totalInstallments: details.totalInstallments,
        totalAmount: Math.round(totalAmount * 100) / 100,
        paidAmount: Math.round(paidAmount * 100) / 100,
        remainingDebt: Math.round(details.remainingDebt * 100) / 100,
        endDate: details.endDate,
        notes: details.notes,
        channel: e.channel,
        efficiencyRatio: Math.round(efficiencyRatio * 10) / 10,
      };
    })
    .sort((a, b) => b.efficiencyRatio - a.efficiencyRatio); // Default: massima efficienza di rata
}

/**
 * Motore di simulazione estinzione anticipata
 */
export function runPayoffSimulation(
  loans: SimLoanItem[],
  availableLiquidity: number,
  strategy: PayoffStrategy,
  customSelectedIds: string[] = []
): PayoffSimulationResult {
  const baselineTotalDebt = Math.round(loans.reduce((acc, l) => acc + l.remainingDebt, 0) * 100) / 100;
  const baselineMonthlyRate = Math.round(loans.reduce((acc, l) => acc + l.installmentAmount, 0) * 100) / 100;

  // Baseline debt-free date = la data di scadenza più lontana nel futuro tra i prestiti attivi
  let baselineDebtFreeDate = 'Debito Zero';
  if (loans.length > 0) {
    const dates = loans.map((l) => l.endDate).filter(Boolean).sort();
    baselineDebtFreeDate = dates[dates.length - 1] || 'Debito Zero';
  }

  // Ordinamento dei prestiti in base alla strategia
  let orderedLoans = [...loans];
  if (strategy === 'cashflow') {
    // Massimizzatore Cash Flow: priorità a chi ha il rapporto rata/debito più alto
    orderedLoans.sort((a, b) => b.efficiencyRatio - a.efficiencyRatio);
  } else if (strategy === 'snowball') {
    // Snowball: priorità al debito residuo più piccolo per eliminare velocemente i prestiti
    orderedLoans.sort((a, b) => a.remainingDebt - b.remainingDebt);
  } else if (strategy === 'custom') {
    // Personalizzata: priorità a quelli selezionati manualmente dall'utente
    orderedLoans.sort((a, b) => {
      const aSel = customSelectedIds.includes(a.id);
      const bSel = customSelectedIds.includes(b.id);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return b.efficiencyRatio - a.efficiencyRatio;
    });
  }

  let remainingBudget = Math.max(0, availableLiquidity);
  let totalAllocated = 0;
  const loanOutcomes: SimulatedLoanOutcome[] = [];

  for (const loan of orderedLoans) {
    const isTarget = strategy !== 'custom' || customSelectedIds.includes(loan.id);

    if (!isTarget || remainingBudget <= 0) {
      loanOutcomes.push({
        loan,
        status: 'unchanged',
        allocatedAmount: 0,
        newRemainingDebt: loan.remainingDebt,
        newRemainingInstallments: loan.remainingInstallments,
        freedMonthlyInstallment: 0,
        newEndDate: loan.endDate,
      });
      continue;
    }

    if (remainingBudget >= loan.remainingDebt) {
      // Estinzione Completa al 100% del prestito
      const allocated = loan.remainingDebt;
      remainingBudget -= allocated;
      totalAllocated += allocated;

      loanOutcomes.push({
        loan,
        status: 'fully_paid',
        allocatedAmount: allocated,
        newRemainingDebt: 0,
        newRemainingInstallments: 0,
        freedMonthlyInstallment: loan.installmentAmount,
        newEndDate: 'Estinto',
      });
    } else {
      // Estinzione Parziale: abbattimento di parte del debito residuo
      const allocated = remainingBudget;
      remainingBudget = 0;
      totalAllocated += allocated;

      const newRemainingDebt = Math.round((loan.remainingDebt - allocated) * 100) / 100;
      // Stima rate residue ridotte proporzionalmente
      const newRemainingInstallments = Math.max(
        1,
        Math.ceil(newRemainingDebt / loan.installmentAmount)
      );
      const newEndDate = computeNewEndDate(
        loan.endDate,
        loan.remainingInstallments,
        newRemainingInstallments
      );

      loanOutcomes.push({
        loan,
        status: 'partially_paid',
        allocatedAmount: allocated,
        newRemainingDebt,
        newRemainingInstallments,
        freedMonthlyInstallment: 0, // La rata resta attiva finché il prestito non è estinto al 100%
        newEndDate,
      });
    }
  }

  // Riordina outcomes nell'ordine iniziale dei prestiti per consistenza UI
  loanOutcomes.sort((a, b) => {
    const idxA = loans.findIndex((l) => l.id === a.loan.id);
    const idxB = loans.findIndex((l) => l.id === b.loan.id);
    return idxA - idxB;
  });

  const freedMonthlyCashFlow =
    Math.round(
      loanOutcomes
        .filter((o) => o.status === 'fully_paid')
        .reduce((acc, o) => acc + o.freedMonthlyInstallment, 0) * 100
    ) / 100;

  const simulatedTotalDebt = Math.max(0, Math.round((baselineTotalDebt - totalAllocated) * 100) / 100);
  const simulatedMonthlyRate = Math.max(0, Math.round((baselineMonthlyRate - freedMonthlyCashFlow) * 100) / 100);
  const annualCashFlowFreed = Math.round(freedMonthlyCashFlow * 12 * 100) / 100;

  // Nuova debt-free date = la scadenza massima tra i prestiti NON completamente estinti
  const activeRemainingDates = loanOutcomes
    .filter((o) => o.status !== 'fully_paid' && o.newEndDate !== 'Estinto')
    .map((o) => o.newEndDate)
    .filter(Boolean)
    .sort();

  const simulatedDebtFreeDate = activeRemainingDates.length > 0 ? activeRemainingDates[activeRemainingDates.length - 1] : 'Debito Zero';

  // Mesi risparmiati
  let monthsSaved = 0;
  if (baselineDebtFreeDate !== 'Debito Zero') {
    if (simulatedDebtFreeDate === 'Debito Zero') {
      // Tutti i debiti azzerati
      monthsSaved = Math.max(
        0,
        Math.max(...loans.map((l) => l.remainingInstallments))
      );
    } else {
      monthsSaved = Math.max(0, getMonthsBetween(simulatedDebtFreeDate, baselineDebtFreeDate));
    }
  }

  const fullyPaidLoansCount = loanOutcomes.filter((o) => o.status === 'fully_paid').length;

  return {
    strategy,
    availableLiquidity,
    totalAllocated: Math.round(totalAllocated * 100) / 100,
    unallocatedLiquidity: Math.round(remainingBudget * 100) / 100,
    baselineTotalDebt,
    baselineMonthlyRate,
    baselineDebtFreeDate,
    baselineActiveCount: loans.length,
    simulatedTotalDebt,
    simulatedMonthlyRate,
    freedMonthlyCashFlow,
    annualCashFlowFreed,
    simulatedDebtFreeDate,
    monthsSaved,
    fullyPaidLoansCount,
    loanOutcomes,
  };
}

