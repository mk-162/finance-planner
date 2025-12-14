

import { UserInputs, YearlyResult, SurplusTarget, Loan } from '../types';


/**
 * Calculate UK State Pension age based on birth year
 * Current UK regulations (as of 2024):
 * - Born before 6 April 1960: Age 66
 * - Born 6 April 1960 - 5 April 1961: Transitional (66y + months, simplified to 66-67)
 * - Born 6 April 1961 - 5 April 1977: Age 67
 * - Born on or after 6 April 1977: Age 68 (scheduled 2044-2046)
 */
export const getStatePensionAge = (birthYear: number): number => {
    if (birthYear < 1960) return 66;
    if (birthYear === 1960) return 66; // Transitional year, simplified
    if (birthYear <= 1977) return 67;
    return 68; // Born 1978 onwards
};

/**
 * Advanced UK Tax Estimator (2024/25 Basis + Inflation Logic)
 * Handles Salary (NI + Income Tax) and Dividends (Dividend Tax) stacking.
 * Supports Personal Allowance Taper for high earners (>100k).
 */
const calculateUKNetIncome = (
    grossSalary: number,
    grossDividends: number,
    otherTaxableIncome: number,
    inflationMultiplier: number
): { netSalary: number, netDividends: number } => {

    // 1. Base Constants (2024/25) - Inflated to avoid fiscal drag in projections
    const BASE_PERSONAL_ALLOWANCE = 12570;
    const BASE_BASIC_RATE_LIMIT = 50270;
    const BASE_HIGHER_RATE_LIMIT = 125140;
    const BASE_DIVIDEND_ALLOWANCE = 500;

    // Apply Inflation to Bands
    const personalAllowanceCap = BASE_PERSONAL_ALLOWANCE * inflationMultiplier;
    const basicRateLimit = BASE_BASIC_RATE_LIMIT * inflationMultiplier;
    const higherRateLimit = BASE_HIGHER_RATE_LIMIT * inflationMultiplier;
    const dividendAllowance = BASE_DIVIDEND_ALLOWANCE * inflationMultiplier;

    const totalNonDividendIncome = grossSalary + otherTaxableIncome;
    const totalAdjustedIncome = totalNonDividendIncome + grossDividends; // For Taper calculation (simplified)

    // --- PA Taper Logic (The 60% Trap) ---
    // For every £2 earned over £100k (adjusted for inflation), lose £1 of PA.
    const taperThreshold = 100000 * inflationMultiplier;
    let availablePersonalAllowance = personalAllowanceCap;

    if (totalAdjustedIncome > taperThreshold) {
        const reduction = (totalAdjustedIncome - taperThreshold) / 2;
        availablePersonalAllowance = Math.max(0, personalAllowanceCap - reduction);
    }

    // --- A. National Insurance (Class 1) on Salary Only ---
    // NI Thresholds usually freeze or move differently, but we'll inflate them for consistency
    const niPrimaryThreshold = 12570 * inflationMultiplier;

    let ni = 0;
    let niable = Math.max(0, grossSalary - niPrimaryThreshold);
    if (niable > 0) {
        // Main Rate (8%) up to Basic Rate Limit (approx)
        const amountAtMain = Math.min(niable, basicRateLimit - niPrimaryThreshold);
        ni += amountAtMain * 0.08;
        niable -= amountAtMain;
    }
    if (niable > 0) {
        // Additional Rate (2%) above
        ni += niable * 0.02;
    }

    // --- B. Income Tax (Non-Savings) ---
    // Salary uses the bands first.
    let taxSalary = 0;
    let remainingAllowance = availablePersonalAllowance;
    let taxableSalary = totalNonDividendIncome;

    // Apply Allowance
    if (taxableSalary > remainingAllowance) {
        taxableSalary -= remainingAllowance;
        remainingAllowance = 0;
    } else {
        remainingAllowance -= taxableSalary;
        taxableSalary = 0;
    }

    let incomeInBasic = 0;
    let incomeInHigher = 0;
    let incomeInAdditional = 0;

    // Basic Rate Band (20%)
    if (taxableSalary > 0) {
        const bandSize = basicRateLimit - availablePersonalAllowance; // Band size shrinks if PA shrinks? No, band usually fixed width, but in UK system Basic Rate Limit is a hard ceiling usually.
        // Actually UK system: Basic Rate Limit is £50,270 *including* PA.
        // Taxable Band Width = 37,700.
        // If PA is 0, Basic Rate Band is still 37,700? 
        // UK Rule: Basic rate band is £37,700. If you lose PA, you pay basic rate on the first £37,700.
        const basicBandWidth = (BASE_BASIC_RATE_LIMIT - BASE_PERSONAL_ALLOWANCE) * inflationMultiplier;

        const amount = Math.min(taxableSalary, basicBandWidth);
        taxSalary += amount * 0.20;
        incomeInBasic = amount;
        taxableSalary -= amount;
    }
    // Higher Rate Band (40%)
    if (taxableSalary > 0) {
        const higherBandWidth = (BASE_HIGHER_RATE_LIMIT - BASE_BASIC_RATE_LIMIT) * inflationMultiplier;
        const amount = Math.min(taxableSalary, higherBandWidth);
        taxSalary += amount * 0.40;
        incomeInHigher = amount;
        taxableSalary -= amount;
    }
    // Additional Rate Band (45%)
    if (taxableSalary > 0) {
        taxSalary += taxableSalary * 0.45;
        incomeInAdditional = taxableSalary;
    }

    // --- C. Dividend Tax ---
    // Dividends sit on top of Total Non-Dividend Income
    let taxDividends = 0;
    let taxableDivs = Math.max(0, grossDividends - dividendAllowance);

    // We need to know where the Dividends start in the bands.
    // The "Start Point" is totalNonDividendIncome relative to the bands.
    // Logic: Treat bands as buckets filled by salary first.

    // Remaining space in Basic Band?
    const basicBandWidth = (BASE_BASIC_RATE_LIMIT - BASE_PERSONAL_ALLOWANCE) * inflationMultiplier;
    const usedBasic = incomeInBasic; // Amount of salary in basic
    let remainingBasic = Math.max(0, basicBandWidth - usedBasic);

    // If salary didn't even use up PA, we have PA overlap? No, dividends use PA first if available.
    // Simplified: We assumed Salary used PA.

    // 1. Fill remaining Basic Band (8.75%)
    if (taxableDivs > 0 && remainingBasic > 0) {
        const amount = Math.min(taxableDivs, remainingBasic);
        taxDividends += amount * 0.0875;
        taxableDivs -= amount;
    }

    // 2. Fill Higher Band (33.75%)
    const higherBandWidth = (BASE_HIGHER_RATE_LIMIT - BASE_BASIC_RATE_LIMIT) * inflationMultiplier;
    const usedHigher = incomeInHigher;
    let remainingHigher = Math.max(0, higherBandWidth - usedHigher);

    if (taxableDivs > 0 && remainingHigher > 0) {
        const amount = Math.min(taxableDivs, remainingHigher);
        taxDividends += amount * 0.3375;
        taxableDivs -= amount;
    }

    // 3. Additional Rate (39.35%)
    if (taxableDivs > 0) {
        taxDividends += taxableDivs * 0.3935;
    }

    // Total Tax
    const netSalaryTotal = totalNonDividendIncome - taxSalary - ni;
    const netDividends = grossDividends - taxDividends;

    // Split netSalaryTotal back relative to input (approx)
    const ratio = grossSalary / (totalNonDividendIncome || 1);

    return {
        netSalary: netSalaryTotal * ratio,
        netDividends: netDividends
    };
};

export const calculateProjection = (inputs: UserInputs): YearlyResult[] => {
    const results: YearlyResult[] = [];
    const currentYear = new Date().getFullYear();

    // Helper to safely get numbers with defaults
    const val = (n: number | undefined, def: number) => (typeof n === 'number' && !isNaN(n) ? n : def);

    // Initialize mutable balances
    let potCash = val(inputs.savingsCash, 0);
    let potISA = val(inputs.savingsISA, 0);
    let potGIA = val(inputs.savingsGIA, 0);
    let potPension = val(inputs.savingsPension, 0) + val(inputs.savingsWorkplacePension, 0) + val(inputs.savingsSIPP, 0);

    // Initialize Property Values (BTL)
    let propertyBalances = new Map<string, number>();
    (inputs.investmentProperties || []).forEach(p => {
        propertyBalances.set(p.id, p.value);
    });

    // Initialize Loan Balances map (id -> currentBalance)
    let loanBalances = new Map<string, number>();
    (inputs.loans || []).forEach(loan => {
        loanBalances.set(loan.id, 0);
    });

    // State for One-off Lifecycle Events
    let hasTakenLumpSum = false;

    // Extract robust values for loop
    const currentAge = val(inputs.currentAge, 30);
    const lifeExpectancy = val(inputs.lifeExpectancy, 90);

    // Stages
    const retirementAge = val(inputs.retirementAge, 65); // End Full Time
    const semiRetirementAge = val(inputs.semiRetirementAge, retirementAge); // End Part Time

    const pensionAccessAge = val(inputs.pensionAccessAge, 57);
    const statePensionAge = val(inputs.statePensionAge, 68);
    const inflationRate = val(inputs.inflation, 2.5);
    const salaryGrowthRate = val(inputs.salaryGrowth, 0);

    // Tax Settings Defaults
    const pensionTaxFreeCashVal = val(inputs.pensionTaxFreeCash, 25);
    const pensionTaxRateVal = val(inputs.pensionTaxRate, 20);

    for (let age = currentAge; age <= lifeExpectancy; age++) {
        const yearIndex = age - currentAge;
        const year = currentYear + yearIndex;

        // Status Flags
        const isWorkingFullTime = age < retirementAge;
        const isWorkingPartTime = age >= retirementAge && age < semiRetirementAge;
        const isFullyRetired = age >= semiRetirementAge;

        // --- 1. Multipliers & Inflation ---
        const inflationMultiplier = Math.pow(1 + inflationRate / 100, yearIndex);
        const salaryMultiplier = Math.pow(1 + salaryGrowthRate / 100, yearIndex);

        // --- 2. Income Calculation (Pre-Tax Accumulation) ---

        // A. Gross Salary / Labour Income
        let grossSalary = 0;

        if (isWorkingFullTime) {
            grossSalary = val(inputs.currentSalary, 0) * salaryMultiplier;
        } else if (isWorkingPartTime) {
            grossSalary = val(inputs.semiRetirementIncome, 0) * salaryMultiplier;
        }

        // Add Additional Income (Multiple Sources + Legacy Support)
        const additionalIncomes = inputs.additionalIncomes || [];

        // 1. Array Logic
        if (additionalIncomes.length > 0) {
            additionalIncomes.forEach(inc => {
                if (age >= inc.startAge && age < inc.endAge) {
                    let amount = inc.amount;
                    if (inc.inflationLinked !== false) { // Default to true
                        amount = amount * inflationMultiplier;
                    }
                    grossSalary += amount;
                }
            });
        }
        // 2. Legacy Fallback (if no array items)
        else if (val(inputs.additionalIncome, 0) > 0) {
            const addIncomeStart = inputs.additionalIncomeStartAge ?? retirementAge;
            const addIncomeEnd = inputs.additionalIncomeEndAge ?? (retirementAge + 5);

            if (age >= addIncomeStart && age < addIncomeEnd) {
                const additionalIncomeNow = val(inputs.additionalIncome, 0) * inflationMultiplier;
                grossSalary += additionalIncomeNow;
            }
        }

        // B. Dividends
        let grossDividends = 0;
        if (isWorkingFullTime) {
            grossDividends = val(inputs.dividendIncome, 0) * inflationMultiplier;
        }

        // C. Events (Income) - Separating Taxable vs Non-Taxable
        let eventIncomeNet = 0;
        let eventIncomeTaxable = 0; // Goes to Income Tax stack
        let eventDividends = 0; // Goes to Dividend stack

        (inputs.events || []).forEach(e => {
            let isActive = false;
            if (e.isRecurring) {
                const end = e.endAge || e.age;
                isActive = (age >= e.age && age <= end);
            } else {
                isActive = (age === e.age);
            }

            if (isActive && e.type === 'income') {
                const amount = e.amount * inflationMultiplier;

                if (e.taxType === 'taxable_income') {
                    eventIncomeTaxable += amount;
                } else if (e.taxType === 'dividend') {
                    eventDividends += amount;
                } else if (e.taxType === 'capital_gains') {
                    // Simplified CGT: 20% flat deduction on the whole amount (assuming amount is gain)
                    eventIncomeNet += amount * 0.80;
                } else {
                    // Tax Free (Gift, Inheritance, ISA maturity)
                    eventIncomeNet += amount;
                }
            }
        });

        // --- 3. Tax Calculation ---
        // We combine Salary + Taxable Events for the "Salary" slot in calculator
        // We use Dividends + Event Dividends for the "Dividend" slot

        let netSalaryIncome = 0;
        let netDividendIncome = 0;

        if (inputs.isSalaryGross) {
            // Pass inflationMultiplier to scale tax bands
            const taxResult = calculateUKNetIncome(grossSalary, grossDividends + eventDividends, eventIncomeTaxable, inflationMultiplier);
            netSalaryIncome = taxResult.netSalary;
            netDividendIncome = taxResult.netDividends;
        } else {
            // Assume input was already net (User selected 'Net' toggle)
            // We add net events directly
            netSalaryIncome = grossSalary + eventIncomeTaxable;
            netDividendIncome = grossDividends + eventDividends;
        }

        // --- 4. Other Income Streams (Post-Tax / Non-earned) ---

        // State Pension
        let statePensionIncome = 0;
        if (age >= statePensionAge) {
            statePensionIncome = val(inputs.statePension, 0) * inflationMultiplier;
        }

        // Defined Benefit Pensions (Final Salary)
        let dbPensionIncome = 0;
        (inputs.dbPensions || []).forEach(db => {
            if (age >= db.startAge) {
                let amount = db.annualIncome;
                if (db.inflationLinked !== false) {
                    amount = amount * inflationMultiplier;
                }
                dbPensionIncome += amount;
            }
        });

        // Rental Income (BTL)
        let rentalIncome = 0;
        (inputs.investmentProperties || []).forEach(prop => {
            rentalIncome += (prop.monthlyRent * 12) * inflationMultiplier;
        });

        // --- 5. Spending & Expenses ---

        // A. General Spending
        let generalSpending = val(inputs.annualSpending, 0) * inflationMultiplier;
        const taperAge = val(inputs.spendingTaperAge, 75);
        const taperRate = val(inputs.spendingTaperRate, 0);
        if (age > taperAge) {
            const yearsPastTaper = age - taperAge;
            generalSpending = generalSpending * Math.pow(1 - taperRate / 100, yearsPastTaper);
        }

        // B. Housing
        let housingExpense = 0;
        const mortgageEnd = val(inputs.mortgageEndAge, 0);

        if (inputs.housingMode === 'rent') {
            const rentMultiplier = Math.pow(1 + val(inputs.rentInflation, 2.5) / 100, yearIndex);
            housingExpense = (val(inputs.rentAmount, 0) * 12) * rentMultiplier;
        } else {
            // Multiple Mortgages Logic
            const mortgages = inputs.mortgages || []; // Safe fallback

            // If no mortgages array but using legacy single mode (fallback)
            if (mortgages.length === 0 && val(inputs.mortgagePayment, 0) > 0) {
                const mortgageEnd = val(inputs.mortgageEndAge, 65);
                if (age < mortgageEnd) {
                    housingExpense = val(inputs.mortgagePayment, 0) * 12;
                } else if (age === mortgageEnd) {
                    housingExpense = (val(inputs.mortgagePayment, 0) * 12) + val(inputs.mortgageFinalPayment, 0);
                }
            } else {
                // Processing Array
                mortgages.forEach(m => {
                    if (age < m.endAge) {
                        housingExpense += m.monthlyPayment * 12;
                    } else if (age === m.endAge) {
                        // Check if there's a balloon payment (Interest Only)
                        // If type is interest_only, we assume the balance is due
                        // If type is repayment, we assume it's fully paid
                        if (m.type === 'interest_only') {
                            housingExpense += (m.monthlyPayment * 12) + m.balance;
                        } else {
                            housingExpense += (m.monthlyPayment * 12);
                        }
                    }
                });
            }
        }

        // C. Debt Repayments
        let debtRepaymentYear = 0;
        (inputs.loans || []).forEach(loan => {
            if (age === loan.startAge) {
                loanBalances.set(loan.id, loan.balance);
            }
            const currentBalance = loanBalances.get(loan.id) || 0;
            if (age >= loan.startAge && currentBalance > 0) {
                const annualInterest = currentBalance * (val(loan.interestRate, 0) / 100);
                let annualPayment = loan.monthlyPayment * 12;
                if (annualPayment >= (currentBalance + annualInterest)) {
                    annualPayment = currentBalance + annualInterest;
                    loanBalances.set(loan.id, 0);
                } else {
                    loanBalances.set(loan.id, currentBalance + annualInterest - annualPayment);
                }
                debtRepaymentYear += annualPayment;
            }
        });


        // D. Event Expenses
        let eventExpense = 0;
        (inputs.events || []).forEach(e => {
            let isActive = false;
            if (e.isRecurring) {
                const end = e.endAge || e.age;
                isActive = (age >= e.age && age <= end);
            } else {
                isActive = (age === e.age);
            }

            if (isActive && e.type === 'expense') {
                eventExpense += e.amount * inflationMultiplier;
            }
        });

        const totalIncome = netSalaryIncome + netDividendIncome + statePensionIncome + dbPensionIncome + rentalIncome + eventIncomeNet;
        const totalExpense = generalSpending + housingExpense + eventExpense + debtRepaymentYear;

        // --- 6. Contributions (Scheduled) ---
        let contribCashYear = 0;
        let contribISAYear = 0;
        let contribGIAYear = 0;
        let contribPensionYear = 0;

        if (isWorkingFullTime) {
            contribCashYear = (val(inputs.contribCash, 0) * 12) * inflationMultiplier;
            contribISAYear = (val(inputs.contribISA, 0) * 12) * inflationMultiplier;
            contribGIAYear = (val(inputs.contribGIA, 0) * 12) * inflationMultiplier;
            contribPensionYear = ((val(inputs.contribPension, 0) + val(inputs.contribWorkplacePension, 0) + val(inputs.contribSIPP, 0)) * 12) * inflationMultiplier;
        }

        const annualLimitPension = 60000 * inflationMultiplier;
        const annualLimitISA = 20000 * inflationMultiplier;

        // --- 7. Pension Lump Sum ---
        let lumpSumToISA = 0;
        let lumpSumTaken = 0;
        const effectiveRetirementAge = Math.max(retirementAge, pensionAccessAge);

        if (!hasTakenLumpSum && age === effectiveRetirementAge && inputs.pensionLumpSumMode === 'upfront') {
            const lumpSumRatio = val(inputs.pensionTaxFreeCash, 25) / 100;
            const lumpSumAmount = potPension * lumpSumRatio;

            if (lumpSumAmount > 0) {
                potPension -= lumpSumAmount;
                lumpSumTaken = lumpSumAmount;
                let remainingLump = lumpSumAmount;

                if (inputs.pensionLumpSumDestination === 'isa') {
                    const isaHeadroom = Math.max(0, annualLimitISA - contribISAYear);
                    const toISA = Math.min(remainingLump, isaHeadroom);
                    potISA += toISA;
                    lumpSumToISA += toISA;
                    remainingLump -= toISA;
                    potGIA += remainingLump;
                }
                else if (inputs.pensionLumpSumDestination === 'gia') {
                    potGIA += remainingLump;
                }
                else {
                    potCash += remainingLump; // Default to Cash
                }
                hasTakenLumpSum = true;
            }
        }

        // --- 8. Cash Flow Analysis ---

        let totalScheduledContributions = contribCashYear + contribISAYear + contribGIAYear + contribPensionYear;
        let rawNetPosition = totalIncome - totalExpense - totalScheduledContributions;

        if (rawNetPosition < 0 && totalScheduledContributions > 0) {
            const deficitAmount = Math.abs(rawNetPosition);
            // Simple logic: If deficit, pause savings first
            contribCashYear = 0;
            contribISAYear = 0;
            contribGIAYear = 0;
            contribPensionYear = 0;
            totalScheduledContributions = 0;

            rawNetPosition = totalIncome - totalExpense - totalScheduledContributions;
        }

        let surplusToCash = 0;
        let surplusToISA = 0;
        let surplusToPension = 0;
        let surplusToGIA = 0;

        if (rawNetPosition >= 0) {
            let remainingSurplus = rawNetPosition;
            const allocationOrder = inputs.surplusAllocationOrder && inputs.surplusAllocationOrder.length > 0
                ? inputs.surplusAllocationOrder
                : ['pension', 'isa', 'gia', 'cash'];

            allocationOrder.forEach(target => {
                if (remainingSurplus <= 0) return;
                let amountAllocated = 0;

                if (target === 'pension') {
                    if (isFullyRetired) return;
                    const headroom = Math.max(0, annualLimitPension - contribPensionYear);
                    amountAllocated = Math.min(remainingSurplus, headroom);
                    surplusToPension += amountAllocated;
                }
                else if (target === 'isa') {
                    const headroom = Math.max(0, annualLimitISA - (contribISAYear + lumpSumToISA));
                    amountAllocated = Math.min(remainingSurplus, headroom);
                    surplusToISA += amountAllocated;
                }
                else if (target === 'gia') {
                    amountAllocated = remainingSurplus;
                    surplusToGIA += amountAllocated;
                }
                else if (target === 'mortgage') {
                    amountAllocated = 0; // Mortgage overpayments not implemented in engine logic yet
                }
                else {
                    amountAllocated = remainingSurplus;
                    surplusToCash += amountAllocated;
                }
                remainingSurplus -= amountAllocated;
            });
        }

        // --- 9. Fund Deficit (Withdrawals) ---
        let deficit = rawNetPosition < 0 ? Math.abs(rawNetPosition) : 0;
        let remainingDeficit = deficit;

        let withdrawalCash = 0;
        let withdrawalISA = 0;
        let withdrawalGIA = 0;
        let withdrawalPensionNet = 0;
        let withdrawalPensionGross = 0;

        let withdrawalOrder: ('cash' | 'isa' | 'gia' | 'pension')[] = [];
        const canAccessPension = age >= pensionAccessAge;

        if (inputs.drawdownStrategy === 'tax_efficient_bridge') {
            withdrawalOrder = !canAccessPension ? ['gia', 'cash', 'isa'] : ['pension', 'gia', 'cash', 'isa'];
        } else if (inputs.drawdownStrategy === 'preserve_pension') {
            withdrawalOrder = ['gia', 'cash', 'isa', 'pension'];
        } else {
            withdrawalOrder = ['cash', 'gia', 'isa', 'pension'];
        }

        const withdrawFromPot = (potType: 'cash' | 'isa' | 'gia' | 'pension') => {
            if (remainingDeficit <= 0) return;

            if (potType === 'pension') {
                if (!canAccessPension) return;
                const available = Math.max(0, potPension);

                // Tax Logic
                const currentTaxFreePct = hasTakenLumpSum ? 0 : (pensionTaxFreeCashVal / 100);
                const taxRate = pensionTaxRateVal / 100;
                const effectiveRetentionRate = currentTaxFreePct + ((1 - currentTaxFreePct) * (1 - taxRate));
                const safeRetentionRate = effectiveRetentionRate > 0 ? effectiveRetentionRate : 0.01;

                const grossNeeded = remainingDeficit / safeRetentionRate;
                const takeGross = Math.min(available, grossNeeded);
                const takeNet = takeGross * safeRetentionRate;

                withdrawalPensionGross += takeGross;
                withdrawalPensionNet += takeNet;
                remainingDeficit -= takeNet;
            } else {
                let available = 0;
                if (potType === 'cash') available = Math.max(0, potCash);
                else if (potType === 'isa') available = Math.max(0, potISA);
                else if (potType === 'gia') available = Math.max(0, potGIA);

                const take = Math.min(available, remainingDeficit);
                remainingDeficit -= take;

                if (potType === 'cash') withdrawalCash += take;
                else if (potType === 'isa') withdrawalISA += take;
                else if (potType === 'gia') withdrawalGIA += take;
            }
        };

        withdrawalOrder.forEach(pot => withdrawFromPot(pot));

        const shortfall = remainingDeficit > 1 ? remainingDeficit : 0;

        // --- 10. Bed and ISA ---
        if (inputs.maxISAFromGIA) {
            const totalUsed = contribISAYear + surplusToISA + lumpSumToISA;
            const isaHeadroom = Math.max(0, annualLimitISA - totalUsed);

            if (isaHeadroom > 0) {
                const moveFromGIA = Math.min(Math.max(0, potGIA), isaHeadroom);
                if (moveFromGIA > 0) {
                    potGIA -= moveFromGIA;
                    potISA += moveFromGIA;
                }
                const remainingHeadroom = isaHeadroom - moveFromGIA;
                if (remainingHeadroom > 0) {
                    const moveFromCash = Math.min(Math.max(0, potCash), remainingHeadroom);
                    if (moveFromCash > 0) {
                        potCash -= moveFromCash;
                        potISA += moveFromCash;
                    }
                }
            }
        }

        // --- 11. Apply Growth ---
        const getGrowthFactor = (rate: number | undefined) => 1 + (val(rate, 0) / 100);
        const getMidYearGrowthFactor = (rate: number | undefined) => Math.pow(1 + (val(rate, 0) / 100), 0.5);

        potCash = (potCash * getGrowthFactor(inputs.growthCash))
            + (contribCashYear * getMidYearGrowthFactor(inputs.growthCash))
            + (surplusToCash * getMidYearGrowthFactor(inputs.growthCash))
            - (withdrawalCash * getMidYearGrowthFactor(inputs.growthCash));

        potISA = (potISA * getGrowthFactor(inputs.growthISA))
            + (contribISAYear * getMidYearGrowthFactor(inputs.growthISA))
            + (surplusToISA * getMidYearGrowthFactor(inputs.growthISA))
            - (withdrawalISA * getMidYearGrowthFactor(inputs.growthISA));

        potGIA = (potGIA * getGrowthFactor(inputs.growthGIA))
            + (contribGIAYear * getMidYearGrowthFactor(inputs.growthGIA))
            + (surplusToGIA * getMidYearGrowthFactor(inputs.growthGIA))
            - (withdrawalGIA * getMidYearGrowthFactor(inputs.growthGIA));

        const netPensionGrowthRate = val(inputs.growthPension, 5) - val(inputs.pensionFees, 0);

        potPension = (potPension * getGrowthFactor(netPensionGrowthRate))
            + (contribPensionYear * getMidYearGrowthFactor(netPensionGrowthRate))
            + (surplusToPension * getMidYearGrowthFactor(netPensionGrowthRate))
            - (withdrawalPensionGross * getMidYearGrowthFactor(netPensionGrowthRate));

        // --- 11a. Benchmark Calculation (Shadow Pot) ---
        // Simulate what the pension would be with Low Cost Fixed Fees (£240/yr)
        const benchmarkFee = 240 * inflationMultiplier;
        const grossPensionGrowth = val(inputs.growthPension, 5); // No % fee deduction

        // Apply same cashflows to benchmark, but different fee structure
        // Note: We use the SAME withdrawal amount to see capital erosion impact,
        // rather than recalculating sustainable withdrawal.
        potPensionBenchmark = (potPensionBenchmark * getGrowthFactor(grossPensionGrowth))
            + (contribPensionYear * getMidYearGrowthFactor(grossPensionGrowth))
            + (surplusToPension * getMidYearGrowthFactor(grossPensionGrowth))
            - (withdrawalPensionGross * getMidYearGrowthFactor(grossPensionGrowth))
            - benchmarkFee;

        // Property Growth
        let totalPropertyValue = 0;
        (inputs.investmentProperties || []).forEach(p => {
            let currentVal = propertyBalances.get(p.id) || p.value;
            const gf = getGrowthFactor(p.growthRate);
            currentVal = currentVal * gf;
            propertyBalances.set(p.id, currentVal);
            totalPropertyValue += currentVal;
        });


        // --- 12. Visualization Data Prep ---
        let expensesToCover = totalExpense;

        // Fill expenses bucket from sources (Order matters for stacking)
        // 1. Earned Income
        const spentSalary = Math.min(netSalaryIncome + netDividendIncome + rentalIncome, expensesToCover);
        expensesToCover -= spentSalary;

        // 2. Guaranteed Income
        const spentStatePension = Math.min(statePensionIncome + dbPensionIncome, expensesToCover);
        expensesToCover -= spentStatePension;

        // 3. One-off / Other
        const spentOther = Math.min(eventIncomeNet, expensesToCover);
        expensesToCover -= spentOther;

        results.push({
            age,
            year,
            salaryIncome: netSalaryIncome,
            dividendIncome: netDividendIncome,
            statePensionIncome,
            dbPensionIncome,
            rentalIncome,
            otherIncome: eventIncomeNet,
            generalSpending,
            housingExpense,
            debtRepayments: debtRepaymentYear,
            oneOffExpense: eventExpense,
            totalExpense,
            totalContribution: totalScheduledContributions,
            totalOutgoings: totalExpense + totalScheduledContributions,
            withdrawalCash,
            withdrawalISA,
            withdrawalGIA,
            withdrawalPension: withdrawalPensionNet + lumpSumTaken,
            shortfall,
            savedToCash: surplusToCash,
            savedToISA: surplusToISA,
            savedToGIA: surplusToGIA,
            savedToPension: surplusToPension,

            // Visualization fields
            spentSalary,
            spentStatePension,
            spentOther,
            totalSavedToCash: surplusToCash + contribCashYear + (inputs.pensionLumpSumDestination === 'cash' ? (lumpSumTaken - lumpSumToISA) : 0), // Assuming dest=isa implies lumpSumToISA takes it all? No.
            // Correction: if dest=ISA, overflow goes to GIA.
            // If dest=GIA, it all goes to GIA.
            // If dest=Cash, it all goes to Cash.
            // Logic in Section 7:
            // if dest=isa -> some to ISA, remainder to GIA.
            // if dest=gia -> all to GIA.
            // if dest=cash -> all to Cash.

            totalSavedToISA: surplusToISA + contribISAYear + lumpSumToISA,
            totalSavedToGIA: surplusToGIA + contribGIAYear + (inputs.pensionLumpSumDestination === 'gia' ? lumpSumTaken : (inputs.pensionLumpSumDestination === 'isa' ? (lumpSumTaken - lumpSumToISA) : 0)),
            totalSavedToPension: surplusToPension + contribPensionYear,

            balanceCash: Math.max(0, potCash),
            balanceISA: Math.max(0, potISA),
            balanceGIA: Math.max(0, potGIA),
            balancePension: Math.max(0, potPension),
            propertyValue: totalPropertyValue,
            liquidNetWorth: Math.max(0, potCash + potISA + potGIA),
            totalNetWorth: Math.max(0, potCash + potISA + potGIA + potPension + totalPropertyValue),
            benchmarkPensionPot: Math.max(0, potPensionBenchmark)
        });
    }

    return results;
};