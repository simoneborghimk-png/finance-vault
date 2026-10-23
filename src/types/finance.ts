export type MacroCategory = 
  | 'Needs'         // Bisogni Primari & Casa (utenze, condominio, cibo, salute)
  | 'Commitments'   // Rate, finanziamenti, donazioni fisse
  | 'Wants'         // Shopping, hobby, ristorazione, abbonamenti, tempo libero
  | 'Savings'       // Accantonamento liquidità, fondo emergenza, previdenza
  | 'Extraordinary';// Lavori casa, spese eccezionali una tantum

export interface Transaction {
  id: string;
  date: string; // ISO YYYY-MM-DD
  channel: 'BancoBPM' | 'Numia' | 'PayPal' | 'Satispay' | 'Contanti';
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
  notes?: string;
}

export interface EncryptedVaultPayload {
  version: number;
  salt: string; // Base64
  iv: string;   // Base64
  ciphertext: string; // Base64
  timestamp: string;
}

export interface VaultData {
  version: number;
  profile: UserFinancialProfile;
  transactions: Transaction[];
  rules: BudgetRule[];
  goals: SavingsGoal[];
  pensionVoluntaryContribution: number;
  lastUpdated: string;
}
