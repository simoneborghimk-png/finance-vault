export type MacroCategory = 
  | 'Needs'         // Bisogni Primari & Casa (utenze, condominio, cibo, salute)
  | 'Commitments'   // Rate, finanziamenti, donazioni fisse
  | 'Wants'         // Shopping, hobby, ristorazione, abbonamenti, tempo libero
  | 'Savings'       // Accantonamento liquidità, fondo emergenza, previdenza
  | 'Extraordinary';// Lavori casa, spese eccezionali una tantum

export const MACRO_CATEGORY_LABELS: Record<MacroCategory, string> = {
  Needs: 'Bisogni Primari & Casa',
  Commitments: 'Rate & Finanziamenti',
  Wants: 'Stile di Vita & Shopping',
  Savings: 'Risparmio & Previdenza',
  Extraordinary: 'Spese Straordinarie',
};

export const MACRO_CATEGORY_SHORT_LABELS: Record<MacroCategory, string> = {
  Needs: 'Bisogni Primari',
  Commitments: 'Rate & Fissi',
  Wants: 'Stile di Vita',
  Savings: 'Risparmio',
  Extraordinary: 'Straordinarie',
};

export interface Transaction {
  id: string;
  date: string; // ISO YYYY-MM-DD
  channel: 'BancoBPM' | 'Numia' | 'Nexi' | 'PayPal' | 'Satispay' | 'Contanti';
  amount: number; // Negativo per uscite, positivo per entrate
  macroCategory: MacroCategory;
  category: string; // es. "Utenze Luce/Gas", "Supermercato", "Rate Finanziamenti", "Shopping Amazon"
  description: string;
  rawDescription?: string;
  tags: string[]; // es. ["#bolletta", "#parrucchiera", "#scale", "#ricorrente"]
  isExtraordinary?: boolean; // Per escludere spese eccezionali dal cash flow ordinario
  autoCategorized?: boolean;
}

export interface BudgetRule {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'bimonthly' | 'quarterly' | 'annual';
  macroCategory: MacroCategory;
  category: string;
  channel: Transaction['channel'];
  patternMatch?: string; // Regex o keyword per auto-categorizzazione
}

export interface UserFinancialProfile {
  baseMonthlyNetSalary: number; // Default: 1953 €
  extraSalaries: {
    fourteenthNetJune: number; // ~1848 €
    thirteenthNetDec: number;  // ~1850 €
    taxRefund730?: number;     // Rimborso effettivo 730 da buste paga (es. 2.290 € su Luglio e Agosto)
  };
  pensionFund: {
    provider: 'Allianz Orizzonte Previdenza' | 'Fon.Te.';
    comparto: string;
    currentValue: number; // ~28.289 €
    managementFeePct: number; // 2.0%
    targetAnnualContribution: number; // Max 5164.57 €
  };
  activeLoans: Array<{
    provider: string; // "Cofidis", "Compass", "Vorwerk Bimby", "TIMFin"
    monthlyInstallment: number;
    remainingMonths?: number;
  }>;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  targetDate: string; // YYYY-MM
  allocatedJuneExtra: number; // allocazione da 14a (~1850 €)
  allocatedJuly730: number;   // allocazione da rimborso 730 (~1500 €)
  allocatedDecExtra?: number; // allocazione da 13a (~1850 €)
  notes?: string;
}

export interface EncryptedVaultPayload {
  version: number;
  salt: string; // Base64
  iv: string;   // Base64
  ciphertext: string; // Base64
  timestamp: string;
}

export interface CategoryBudgetCap {
  category: string;
  monthlyLimit: number;
  macroCategory?: MacroCategory;
}

export type RecurringExpenseType = 'subscription' | 'loan' | 'utility' | 'donation' | 'other';

export interface LoanAmortizationDetails {
  totalInstallments: number;       // es. 12
  paidInstallments: number;        // es. 5
  remainingInstallments: number;   // es. 7
  totalAmount?: number;            // es. 1619.00
  paidAmount?: number;             // es. 674.60
  remainingDebt: number;           // es. 944.40
  installmentAmount: number;       // es. 134.92
  endDate: string;                 // ISO YYYY-MM o fine prestito (es. "2027-05")
  isClosed: boolean;               // true se estinto (es. TIMFin, Switch 2)
  notes?: string;
}

export interface ChannelTransition {
  from: Transaction['channel'];
  to: Transaction['channel'];
  transitionDate?: string;
}

export type RecurringPricingModel = 'flat' | 'variable_utility' | 'loan';

export interface PriceChange {
  date: string;
  from: number;
  to: number;
  delta: number;
  deltaPct: number;
}

export interface HistoricalAmountPoint {
  date: string;
  amount: number;
  channel: Transaction['channel'];
}

export interface RecurringExpense {
  id: string; // merchant hash o chiave normalizzata
  name: string;
  category: string;
  macroCategory: MacroCategory;
  channel: Transaction['channel'];
  channels?: Transaction['channel'][]; // Tutti i canali impiegati storicamente
  channelTransition?: ChannelTransition; // Se migrato (es. Nexi -> Numia)
  type: RecurringExpenseType;
  pricingModel: RecurringPricingModel; // Natura del costo: flat, utenza a consumo, prestito
  averageAmount: number; // costo medio positivo
  lastAmount: number;
  varianceVsAveragePct?: number; // Delta % dell'ultima bolletta rispetto alla media storica
  priceChanges?: PriceChange[]; // Rimodulazioni o variazioni tariffarie rilevate nello storico
  historicalTrend?: HistoricalAmountPoint[]; // Serie storica cronologica per visualizzazione trend
  frequency: 'monthly' | 'bimonthly' | 'quarterly' | 'annual';
  annualCost: number;
  lastDate: string; // ISO YYYY-MM-DD
  firstDate?: string; // ISO YYYY-MM-DD del primo addebito rilevato
  nextExpectedDate: string; // ISO YYYY-MM-DD
  daysUntilNext: number;
  isActive: boolean;
  isOverdue?: boolean; // true se superata la data attesa e non ancora riscontrato
  overdueMessage?: string; // Messaggio esplicativo (es. mancato addebito su Nexi / da verificare su Numia)
  isPaused?: boolean; // true se sospeso / in pausa dall'utente (es. Audible)
  isCancelled?: boolean; // true se annullato / disdetto (es. Hiya con scadenza naturale)
  cancellationEndDate?: string; // Data termine finale servizio dopo cancellazione (es. "2027-01-06")
  occurrences: number;
  sampleTransactions: Transaction[];
  loanDetails?: LoanAmortizationDetails;
  isIgnored?: boolean;
}

export interface RecurringOverride {
  ignored?: boolean;
  isPaused?: boolean;
  isCancelled?: boolean;
  cancellationEndDate?: string;
  customName?: string;
  customCategory?: string;
  customFrequency?: 'monthly' | 'bimonthly' | 'quarterly' | 'annual';
  customTotalInstallments?: number;
  customRemainingInstallments?: number;
  customRemainingDebt?: number;
  customEndDate?: string;
  isClosed?: boolean;
}

export interface VaultData {
  version: number;
  profile: UserFinancialProfile;
  transactions: Transaction[];
  rules: BudgetRule[];
  goals: SavingsGoal[];
  budgetCaps?: Record<string, number>;
  recurringOverrides?: Record<string, RecurringOverride>;
  pensionVoluntaryContribution: number;
  lastUpdated: string;
}

