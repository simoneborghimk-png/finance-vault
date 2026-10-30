import {
  Transaction,
  RecurringExpense,
  UserFinancialProfile,
  MacroCategory,
} from '@/types/finance';
import { normalizeMerchant } from './recurringDetector';

export interface CashFlowEvent {
  id: string;
  day: number; // 1-31
  date: string; // YYYY-MM-DD
  name: string;
  category: string;
  macroCategory: MacroCategory;
  amount: number; // Negativo per addebiti, positivo per stipendio/entrate
  channel: Transaction['channel'];
  status: 'paid' | 'due_soon' | 'today' | 'pending' | 'overdue';
  isSalary: boolean;
  matchedTransactionId?: string;
  entityId: string;
  notes?: string;
}

export interface MonthlyCashFlowSummary {
  month: string; // YYYY-MM
  monthLabel: string; // "Ottobre 2026"
  salaryDay: number; // Giorno effettivo o stimato di accredito stipendio (es. 15, 14, 13)
  totalExpectedOutgoings: number;
  totalPaidOutgoings: number;
  totalPendingOutgoings: number;
  safetyBufferPreSalary: number; // Somma delle uscite ancora da addebitare prima dello stipendio
  totalExpectedIncome: number;
  netProjectedCashFlow: number;
  eventsCount: number;
  pendingEventsCount: number;
  eventsByDay: Record<number, CashFlowEvent[]>;
  eventsList: CashFlowEvent[];
}

/**
 * Formatta un importo in Euro
 */
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Estrae il giorno del mese tipico per un contratto ricorrente
 */
function getExpectedBillingDay(expense: RecurringExpense): number {
  if (expense.nextExpectedDate) {
    const parts = expense.nextExpectedDate.split('-');
    if (parts.length === 3) {
      const d = parseInt(parts[2], 10);
      if (!isNaN(d) && d >= 1 && d <= 31) return d;
    }
  }

  if (expense.lastDate) {
    const parts = expense.lastDate.split('-');
    if (parts.length === 3) {
      const d = parseInt(parts[2], 10);
      if (!isNaN(d) && d >= 1 && d <= 31) return d;
    }
  }

  // Fallback logico per tipologia nota
  if (expense.id.includes('pulizia-scale') || expense.id.includes('betulla')) return 10;
  if (expense.id.includes('netflix')) return 15;
  if (expense.id.includes('iren')) return 20;
  if (expense.id.includes('soundbar') || expense.id.includes('cofidis')) return 28;
  if (expense.id.includes('tim')) return 30;

  return 15;
}

/**
 * Determina se un contratto con frequenza non mensile ricade nel mese target
 */
function isExpenseDueInMonth(expense: RecurringExpense, targetYm: string): boolean {
  if (!expense.isActive || expense.isIgnored || expense.isCancelled) return false;
  if (expense.loanDetails?.isClosed) return false;

  const [, mStr] = targetYm.split('-');
  const targetMonthNum = parseInt(mStr, 10); // 1-12

  if (expense.frequency === 'monthly') return true;

  // Per contratti annuali (es. Netflix a Ottobre, Crunchyroll a Settembre, tado a Novembre)
  if (expense.frequency === 'annual') {
    if (expense.nextExpectedDate) {
      return expense.nextExpectedDate.startsWith(targetYm);
    }
    if (expense.lastDate) {
      const lastMonthNum = parseInt(expense.lastDate.slice(5, 7), 10);
      return lastMonthNum === targetMonthNum;
    }
    return false;
  }

  // Per utenze trimestrali (es. TARI, Condominio)
  if (expense.frequency === 'quarterly') {
    // Solitamente trimestri fissi (es. Mesi 1, 4, 7, 10 o rilevati dallo storico)
    if (expense.nextExpectedDate?.startsWith(targetYm)) return true;
    if (expense.sampleTransactions && expense.sampleTransactions.length > 0) {
      const billedMonths = expense.sampleTransactions.map((tx) => parseInt(tx.date.slice(5, 7), 10));
      return billedMonths.includes(targetMonthNum);
    }
    return targetMonthNum % 3 === 1; // Gennaio, Aprile, Luglio, Ottobre
  }

  // Per bimestrali (es. Luce/Gas a fatturazione bimestrale)
  if (expense.frequency === 'bimonthly') {
    if (expense.nextExpectedDate?.startsWith(targetYm)) return true;
    if (expense.lastDate) {
      const lastMonthNum = parseInt(expense.lastDate.slice(5, 7), 10);
      return Math.abs(targetMonthNum - lastMonthNum) % 2 === 0;
    }
    return targetMonthNum % 2 === 0;
  }

  return true;
}

/**
 * Calcola il giorno lavorativo tipico di accredito stipendio per CLOUDFIRE SRL.
 * Standard: giorno 15 del mese. Se cade nel weekend, anticipa a venerdì (14 o 13).
 * Per Agosto (vigilia Ferragosto), accredita il 14.
 */
export function getExpectedSalaryDay(year: number, monthNum: number): number {
  const d = new Date(year, monthNum - 1, 15);
  const dayOfWeek = d.getDay(); // 0=Domenica, 6=Sabato
  if (dayOfWeek === 6) return 14; // Sabato -> Venerdì 14
  if (dayOfWeek === 0) return 13; // Domenica -> Venerdì 13
  if (monthNum === 8 && d.getDate() === 15) return 14; // Vigilia Ferragosto
  return 15;
}

/**
 * Genera lo scadenziario finanziario completo per il mese selezionato
 */
export function buildMonthlyCashFlowSchedule(
  expenses: RecurringExpense[],
  transactions: Transaction[],
  targetYm: string,
  profile?: UserFinancialProfile
): MonthlyCashFlowSummary {
  const [yStr, mStr] = targetYm.split('-');
  const year = parseInt(yStr, 10);
  const monthNum = parseInt(mStr, 10); // 1-12

  const daysInMonth = new Date(year, monthNum, 0).getDate();

  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isCurrentMonth = targetYm === currentYm;
  const isPastMonth = targetYm < currentYm;
  const todayDate = now.getDate();

  // Filtra le transazioni registrate nel mese target
  const monthTransactions = transactions.filter((t) => t.date.startsWith(targetYm));

  const events: CashFlowEvent[] = [];

  // 1. Inserimento Accredito Stipendio Reale o Proiettato
  // Cerca tutte le transazioni di stipendio registrate nel mese target
  const realSalaryTxs = monthTransactions.filter(
    (t) =>
      t.amount > 0 &&
      (t.category === 'Stipendio Ordinario' ||
        t.category.toLowerCase().includes('stipendio') ||
        t.category.toLowerCase().includes('retribuzione') ||
        t.description.toLowerCase().includes('cloudfire') ||
        t.rawDescription?.toLowerCase().includes('cloudfire') ||
        t.tags?.includes('#stipendio'))
  );

  let primarySalaryDay: number;

  if (realSalaryTxs.length > 0) {
    // Ordina le transazioni di stipendio per data contabile
    realSalaryTxs.sort((a, b) => a.date.localeCompare(b.date));
    primarySalaryDay = parseInt(realSalaryTxs[0].date.slice(8, 10), 10);

    realSalaryTxs.forEach((tx) => {
      const txDay = parseInt(tx.date.slice(8, 10), 10);
      const isExtra13 =
        tx.description.toLowerCase().includes('mens. agg') ||
        tx.description.toLowerCase().includes('13esima') ||
        tx.description.toLowerCase().includes('13ª') ||
        (tx.rawDescription && tx.rawDescription.toLowerCase().includes('mens. agg'));

      let name = 'Accredito Stipendio (CLOUDFIRE SRL)';
      let notes = tx.rawDescription || tx.description;

      if (isExtra13) {
        name = 'Accredito 13ª Mensilità Natalizia (CLOUDFIRE SRL)';
      } else if (monthNum === 7 && tx.amount > 3500) {
        name = 'Accredito Stipendio + 14ª Mensilità (CLOUDFIRE SRL)';
        notes = 'Stipendio ordinario comprensivo di quattordicesima estiva CCNL';
      } else if (monthNum === 8 && tx.amount > 3000) {
        name = 'Accredito Stipendio + Rimborso 730 (CLOUDFIRE SRL)';
        notes = 'Stipendio ordinario comprensivo di rimborso fiscale 730';
      }

      events.push({
        id: `salary-real-${tx.id}`,
        day: txDay,
        date: tx.date,
        name,
        category: tx.category || 'Stipendio Ordinario',
        macroCategory: 'Savings',
        amount: tx.amount,
        channel: tx.channel || 'BancoBPM',
        status: 'paid',
        isSalary: true,
        matchedTransactionId: tx.id,
        entityId: isExtra13 ? 'bonus-13th' : 'salary',
        notes,
      });
    });
  } else {
    // Mese futuro o senza accredito ancora contabilizzato
    const expectedDay = getExpectedSalaryDay(year, monthNum);
    primarySalaryDay = expectedDay;
    const salaryDate = `${targetYm}-${String(expectedDay).padStart(2, '0')}`;
    const baseSalary = profile?.baseMonthlyNetSalary || 1950;

    let salaryStatus: CashFlowEvent['status'] = 'pending';
    if (isPastMonth) {
      salaryStatus = 'overdue';
    } else if (isCurrentMonth) {
      if (todayDate > expectedDay) {
        salaryStatus = 'overdue';
      } else if (todayDate === expectedDay) {
        salaryStatus = 'today';
      } else if (expectedDay - todayDate <= 3) {
        salaryStatus = 'due_soon';
      } else {
        salaryStatus = 'pending';
      }
    } else {
      salaryStatus = 'pending';
    }

    events.push({
      id: `salary-expected-${targetYm}-${expectedDay}`,
      day: expectedDay,
      date: salaryDate,
      name: 'Accredito Stipendio (CLOUDFIRE SRL)',
      category: 'Stipendio Ordinario',
      macroCategory: 'Savings',
      amount: baseSalary,
      channel: 'BancoBPM',
      status: salaryStatus,
      isSalary: true,
      entityId: 'salary',
      notes: `Accredito ordinario atteso intorno al giorno ${expectedDay}.`,
    });

    // Se mese di Giugno (14ª), aggiungi evento 14ª se prevista nel profilo
    if (monthNum === 6 && profile?.extraSalaries?.fourteenthNetJune) {
      const juneExtra = profile.extraSalaries.fourteenthNetJune;
      events.push({
        id: `salary-extra-14th-${targetYm}`,
        day: 15,
        date: `${targetYm}-06-15`,
        name: 'Accredito 14ª Mensilità Estiva',
        category: 'Entrate Straordinarie',
        macroCategory: 'Savings',
        amount: juneExtra,
        channel: 'BancoBPM',
        status: salaryStatus,
        isSalary: true,
        entityId: 'bonus-14th',
        notes: 'Iniezione CCNL estiva destinata a fondo pensione e vacanze.',
      });
    }

    // Se mese di Dicembre (13ª), aggiungi evento 13ª se prevista nel profilo
    if (monthNum === 12 && profile?.extraSalaries?.thirteenthNetDec) {
      const decExtra = profile.extraSalaries.thirteenthNetDec;
      events.push({
        id: `salary-extra-13th-${targetYm}`,
        day: 19,
        date: `${targetYm}-12-19`,
        name: 'Accredito 13ª Mensilità Natalizia',
        category: 'Entrate Straordinarie',
        macroCategory: 'Savings',
        amount: decExtra,
        channel: 'BancoBPM',
        status: salaryStatus,
        isSalary: true,
        entityId: 'bonus-13th',
        notes: 'Accredito natalizio per conguaglio pensione 31/12 e festività.',
      });
    }
  }

  // 2. Mappatura Addebiti Ricorrenti Attivi
  const candidateExpenses = expenses.filter((exp) => isExpenseDueInMonth(exp, targetYm));

  candidateExpenses.forEach((exp) => {
    let day = getExpectedBillingDay(exp);
    if (day > daysInMonth) day = daysInMonth;

    const eventDate = `${targetYm}-${String(day).padStart(2, '0')}`;
    const amount = -Math.abs(exp.lastAmount || exp.averageAmount || 0);

    // Ricerca transazione reale corrispondente già contabilizzata nel mese
    const matchedTx = monthTransactions.find((tx) => {
      if (tx.amount >= 0) return false;
      const txDay = parseInt(tx.date.slice(8, 10), 10);
      const isDayNear = Math.abs(txDay - day) <= 5;

      const norm = normalizeMerchant(tx.description, tx.amount, tx.rawDescription);
      if (norm.key === exp.id) return true;

      // Match su causale / categoria / importo simile
      const isCategoryMatch = tx.category === exp.category;
      const isAmountMatch = Math.abs(Math.abs(tx.amount) - Math.abs(amount)) < 2.0;

      return isCategoryMatch && isAmountMatch && isDayNear;
    });

    // Calcolo stato
    let status: CashFlowEvent['status'] = 'pending';
    if (matchedTx) {
      status = 'paid';
    } else if (isPastMonth) {
      status = 'overdue';
    } else if (isCurrentMonth) {
      if (todayDate > day) {
        status = 'overdue';
      } else if (todayDate === day) {
        status = 'today';
      } else if (day - todayDate <= 3) {
        status = 'due_soon';
      } else {
        status = 'pending';
      }
    } else {
      status = 'pending';
    }

    events.push({
      id: `${exp.id}-${targetYm}-${day}`,
      day,
      date: eventDate,
      name: exp.name,
      category: exp.category,
      macroCategory: exp.macroCategory,
      amount,
      channel: exp.channel,
      status,
      isSalary: false,
      matchedTransactionId: matchedTx?.id,
      entityId: exp.id,
      notes: exp.loanDetails
        ? `Rata ${exp.loanDetails.paidInstallments + 1} di ${exp.loanDetails.totalInstallments} (debito res. ${formatEuro(exp.loanDetails.remainingDebt)})`
        : undefined,
    });
  });

  // Ordina eventi per giorno del mese (e prima lo stipendio se nello stesso giorno)
  events.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    if (a.isSalary !== b.isSalary) return a.isSalary ? -1 : 1;
    return Math.abs(b.amount) - Math.abs(a.amount);
  });

  // Raggruppamento per giorno
  const eventsByDay: Record<number, CashFlowEvent[]> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    eventsByDay[d] = [];
  }
  events.forEach((ev) => {
    if (!eventsByDay[ev.day]) eventsByDay[ev.day] = [];
    eventsByDay[ev.day].push(ev);
  });

  // Metriche di cassa del mese
  const outgoings = events.filter((e) => !e.isSalary);
  const totalExpectedOutgoings = outgoings.reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const totalPaidOutgoings = outgoings.filter((e) => e.status === 'paid').reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const totalPendingOutgoings = outgoings.filter((e) => e.status !== 'paid').reduce((sum, e) => sum + Math.abs(e.amount), 0);

  // Calcolo saldo di sicurezza necessario prima dell'accredito dello stipendio
  // Somma delle uscite non ancora pagate che cadono prima del giorno dello stipendio (primarySalaryDay)
  let safetyBufferPreSalary = 0;
  if (isCurrentMonth) {
    safetyBufferPreSalary = outgoings
      .filter((e) => e.status !== 'paid' && e.day >= todayDate && e.day <= primarySalaryDay)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);
  } else if (!isPastMonth) {
    safetyBufferPreSalary = outgoings
      .filter((e) => e.day <= primarySalaryDay)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);
  }

  const incomeEvents = events.filter((e) => e.isSalary);
  const totalExpectedIncome = incomeEvents.reduce((sum, e) => sum + e.amount, 0);
  const netProjectedCashFlow = totalExpectedIncome - totalExpectedOutgoings;

  // Etichetta del mese formattata in italiano
  const dateObj = new Date(year, monthNum - 1, 1);
  const monthName = dateObj.toLocaleDateString('it-IT', { month: 'long' });
  const monthLabel = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;

  return {
    month: targetYm,
    monthLabel,
    salaryDay: primarySalaryDay,
    totalExpectedOutgoings: Math.round(totalExpectedOutgoings * 100) / 100,
    totalPaidOutgoings: Math.round(totalPaidOutgoings * 100) / 100,
    totalPendingOutgoings: Math.round(totalPendingOutgoings * 100) / 100,
    safetyBufferPreSalary: Math.round(safetyBufferPreSalary * 100) / 100,
    totalExpectedIncome: Math.round(totalExpectedIncome * 100) / 100,
    netProjectedCashFlow: Math.round(netProjectedCashFlow * 100) / 100,
    eventsCount: events.length,
    pendingEventsCount: outgoings.filter((e) => e.status !== 'paid').length,
    eventsByDay,
    eventsList: events,
  };
}

