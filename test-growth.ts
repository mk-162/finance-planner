
import { calculateProjection } from './services/calculationEngine';
import { UserInputs } from './types';

const baseInputs: UserInputs = {
    birthYear: 1980,
    currentAge: 44,
    retirementAge: 65,
    pensionAccessAge: 57,
    lifeExpectancy: 90,
    currentSalary: 50000,
    dividendIncome: 0,
    hasSideHustle: false,
    additionalIncome: 0,
    isSalaryGross: true,
    salaryGrowth: 2,
    statePension: 10000,
    statePensionAge: 68,
    housingMode: 'mortgage',
    mortgages: [],
    mortgageType: 'repayment',
    mortgageRateType: 'fixed',
    mortgagePayment: 1000,
    mortgageEndAge: 60,
    mortgageFinalPayment: 0,
    rentAmount: 0,
    rentInflation: 0,
    savingsCash: 10000,
    savingsISA: 10000,
    savingsGIA: 10000,
    savingsPension: 100000,
    contribCash: 0,
    contribISA: 0,
    contribGIA: 0,
    contribPension: 500,
    surplusAllocationOrder: ['pension'],
    drawdownStrategy: 'tax_efficient_bridge',
    maxISAFromGIA: false,
    pensionLumpSumMode: 'drip',
    pensionLumpSumDestination: 'cash',
    annualSpending: 30000,
    spendingTaperAge: 85,
    spendingTaperRate: 0,
    inflation: 2,
    growthCash: 1,
    growthISA: 5,
    growthGIA: 5,
    growthPension: 5,
    pensionTaxFreeCash: 25,
    pensionTaxRate: 20,
    events: [],
    loans: [],
    investmentProperties: [],
    dbPensions: []
};

const res5 = calculateProjection({ ...baseInputs, growthPension: 5 });
const pension5 = res5[res5.length - 1].balancePension;

const res8 = calculateProjection({ ...baseInputs, growthPension: 8 });
const pension8 = res8[res8.length - 1].balancePension;

console.log(`Growth 5%: £${pension5.toFixed(2)}`);
console.log(`Growth 8%: £${pension8.toFixed(2)}`);

if (pension8 > pension5) {
    console.log("SUCCESS: Higher growth results in higher pension.");
} else {
    console.log("FAILURE: Pension did not increase with growth rate.");
}
