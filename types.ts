

export interface FinancialEvent {
  id: string;
  name: string;
  age: number;
  amount: number;
  type: 'expense' | 'income';
  isRecurring: boolean;
  endAge?: number; // If recurring, when does it stop?
  taxType?: 'tax_free' | 'taxable_income' | 'capital_gains' | 'dividend'; // New: Tax Treatment
}

export interface EducationEvent {
  id: string;
  name: string;
  startAge: number;
  endAge: number;
  annualCost: number;
}

export interface Loan {
  id: string;
  name: string;
  balance: number; // Initial balance or Principal
  interestRate: number; // %
  monthlyPayment: number;
  startAge: number; // When does this loan start? (defaults to current age)
  endAge?: number; // Optional override, otherwise calculated by amortization
}

export interface InvestmentProperty {
  id: string;
  name: string;
  value: number;
  monthlyRent: number;
  monthlyCost?: number; // Costs (Management, Maintenance, etc) - optional for backwards compatibility
  growthRate: number; // Capital Appreciation

  // Linked Mortgage
  hasMortgage?: boolean;
  mortgageBalance?: number;
  interestRate?: number;
  monthlyPayment?: number;
  isInterestOnly?: boolean; // simplified type
  endAge?: number;
}

export interface DefinedBenefitPension {
  id: string;
  name: string;
  annualIncome: number;
  startAge: number;
  inflationLinked: boolean;
}

export interface Mortgage {
  id: string;
  name: string;
  balance: number; // Current Outstanding Balance
  monthlyPayment: number;
  interestRate: number;
  type: 'repayment' | 'interest_only';
  chargeType?: 'first' | 'second'; // First or second charge mortgage
  endDate?: number; // Optional: Year mortgage ends
  endAge: number; // Age when mortgage ends
}

export interface AdditionalIncome {
  id: string;
  name: string;
  amount: number;
  startAge: number;
  endAge: number;
  inflationLinked?: boolean;
  taxAsDividend?: boolean; // If true, taxed as dividend income instead of regular income
  growthRate?: number; // Annual growth rate
}

export type SurplusTarget = 'pension' | 'isa' | 'gia' | 'cash' | 'mortgage';

export interface UserInputs {
  // Personal
  birthYear: number;
  currentAge: number; // Derived/Legacy support for engine
  retirementAge: number; // Stop Full Time Work

  // Semi-Retirement
  hasSemiRetirement: boolean;
  semiRetirementAge: number; // Stop Part Time Work
  semiRetirementIncome: number; // Annual Earnings during semi-retirement

  pensionAccessAge: number; // UK Default 57
  lifeExpectancy: number;

  // Income
  currentSalary: number;
  dividendIncome: number; // Legacy: Single dividend value (kept for backwards compatibility)
  hasSideHustle: boolean;
  additionalIncome: number; // Legacy (to be migrated)
  isSalaryGross: boolean;
  salaryGrowth: number;

  additionalIncomeStartAge?: number; // Legacy
  additionalIncomeEndAge?: number; // Legacy

  additionalIncomes?: AdditionalIncome[]; // New Array Input
  statePension: number;
  statePensionAge: number;
  missingNIYears?: number; // Missing National Insurance years (0-35), defaults to 0 for full pension

  // Housing / Property
  housingMode: 'mortgage' | 'rent';

  // Mortgage Specifics
  mortgages: Mortgage[]; // New: List of Mortgages
  // Legacy Single Mortgage Fields (kept for migration/fallback)
  mortgageType: 'repayment' | 'interest_only';
  mortgageRateType: 'fixed' | 'tracker';
  mortgagePayment: number; // Monthly
  mortgageEndAge: number;
  mortgageFinalPayment: number; // Balloon / Payoff at end (Capital Balance for Interest Only)
  mortgageInterestRate?: number; // % Interest rate

  // Rent Specifics
  rentAmount: number; // Monthly
  rentInflation: number; // % annual increase

  // Savings (Current Balances)
  savingsCash: number;
  savingsISA: number;
  savingsGIA: number; // Trading Account
  savingsPension: number; // Legacy/Total
  savingsWorkplacePension?: number; // New
  savingsSIPP?: number; // New

  // Contributions (Monthly)
  contribCash: number;
  contribISA: number;
  contribGIA: number; // Trading Account
  contribPension: number; // Legacy/Total
  contribWorkplacePension?: number; // New
  contribSIPP?: number; // New

  // Advanced Strategy
  surplusAllocationOrder: SurplusTarget[]; // Order of priority: ['pension', 'isa', 'gia', 'mortgage', 'cash']
  drawdownStrategy: 'tax_efficient_bridge' | 'preserve_pension' | 'standard';
  maxISAFromGIA: boolean; // "Bed and ISA" / Maximize usage

  // Pension Lump Sum Strategy
  pensionLumpSumMode: 'drip' | 'upfront';
  pensionLumpSumDestination: 'isa' | 'gia' | 'cash';

  // Outgoings
  annualSpending: number; // General spending EXCLUDING housing

  spendingTaperAge: number;
  spendingTaperRate: number; // Percentage

  // Assumptions
  inflation: number; // %
  growthCash: number; // %
  growthISA: number; // %
  growthGIA: number; // %
  growthPension: number; // %
  pensionFees?: number; // % Annual Fee

  // Tax Assumptions
  pensionTaxFreeCash: number; // % (Default 25)
  pensionTaxRate: number; // % (Default 20 - Basic Rate)

  events: FinancialEvent[];
  loans: Loan[];

  // Advanced Assets
  investmentProperties: InvestmentProperty[];
  dbPensions: DefinedBenefitPension[];
}

export interface Scenario {
  id: string;
  name: string;
  data: UserInputs;
  createdAt: number;
}

// Tax breakdown for transparency modal - shows how taxes were calculated
export interface TaxBreakdown {
  // Gross Income Components
  grossSalary: number;
  grossDividends: number;
  grossStatePension: number;
  grossDBPension: number;
  grossRentalProfit: number;
  grossPensionWithdrawal: number;  // Taxable portion of pension drawdown
  grossOther: number;
  totalGrossIncome: number;

  // Allowances Used
  personalAllowanceUsed: number;
  dividendAllowanceUsed: number;
  cgtAllowanceUsed: number;

  // Income Tax Breakdown
  incomeInBasicBand: number;
  incomeInHigherBand: number;
  incomeInAdditionalBand: number;
  basicRateTax: number;
  higherRateTax: number;
  additionalRateTax: number;
  totalIncomeTax: number;

  // National Insurance (on salary only)
  niMainRate: number;
  niHigherRate: number;
  totalNI: number;

  // Dividend Tax
  dividendBasicTax: number;
  dividendHigherTax: number;
  dividendAdditionalTax: number;
  totalDividendTax: number;

  // Capital Gains Tax
  cgtBasicRate: number;
  cgtHigherRate: number;
  totalCGT: number;

  // Summary
  totalTaxPaid: number;
  netIncome: number;
  effectiveTaxRate: number; // totalTaxPaid / totalGrossIncome * 100
}

export interface YearlyResult {
  age: number;
  year: number;

  // Income Sources
  salaryIncome: number;
  dividendIncome: number; // New
  statePensionIncome: number;
  dbPensionIncome: number; // New: Final Salary
  rentalIncome: number; // New: BTL
  otherIncome: number; // From events

  // Expenses
  generalSpending: number;
  housingExpense: number; // Mortgage or Rent
  debtRepayments: number; // Loans/Finance
  oneOffExpense: number; // From events
  totalExpense: number; // Lifestyle + Housing + Debt + Events
  totalContribution: number; // Scheduled Savings
  totalOutgoings: number; // Expense + Contribution

  // Withdrawals (to cover expenses)
  withdrawalCash: number;
  withdrawalISA: number;
  withdrawalGIA: number;
  withdrawalPension: number;
  shortfall: number; // If money runs out

  // Savings Actions (Surplus allocation)
  savedToCash: number;
  savedToISA: number;
  savedToGIA: number;
  savedToPension: number;

  // VISUALIZATION FIELDS (Splitting Income into Spent vs Saved)
  // These help the chart stack bars correctly relative to the expense line
  spentSalary: number;
  spentStatePension: number;
  spentOther: number;

  totalSavedToCash: number; // Scheduled + Surplus
  totalSavedToISA: number;
  totalSavedToGIA: number;
  totalSavedToPension: number;

  // End of Year Balances
  balanceCash: number;
  balanceISA: number;
  balanceGIA: number;
  balancePension: number;
  propertyValue: number; // New: Investment Property Value

  totalNetWorth: number;
  liquidNetWorth: number; // Cash + ISA + GIA
  totalInvestmentGrowth?: number; // New: Growth from all assets in this year
  benchmarkPensionPot?: number; // New: Simulated pot with low fees

  // Tax Transparency Fields
  pensionTaxRelief: number; // Value of tax relief on pension contributions
  taxBreakdown: TaxBreakdown; // Full breakdown for transparency modal
}