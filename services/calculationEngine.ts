

import { UserInputs, YearlyResult, SurplusTarget, Loan, TaxBreakdown } from '../types';


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
    if (birthYear === 1960) return 66; // Transitional year (66y + months), simplified
    if (birthYear < 1977) return 67; // Born 1961-1976
    return 68; // Born 1977 onwards (conservative - regulations say 6 April 1977+)
};

/**
 * UK Tax Constants (2024/25)
 * FROZEN thresholds remain fixed, others inflate with assumptions
 */
const UK_TAX_CONSTANTS = {
    // FROZEN until 2028 - do NOT inflate
    PERSONAL_ALLOWANCE: 12570,
    PA_TAPER_THRESHOLD: 100000,
    NI_PRIMARY_THRESHOLD: 12570,
    NI_UPPER_THRESHOLD: 50270,

    // Can inflate (assumptions about future policy)
    BASIC_RATE_BAND_WIDTH: 37700,  // £50,270 - £12,570
    HIGHER_RATE_CEILING: 125140,

    // Allowances (can inflate)
    DIVIDEND_ALLOWANCE: 500,
    CGT_ALLOWANCE: 3000,

    // Rates
    NI_MAIN_RATE: 0.08,
    NI_HIGHER_RATE: 0.02,
    BASIC_RATE: 0.20,
    HIGHER_RATE: 0.40,
    ADDITIONAL_RATE: 0.45,
    DIVIDEND_BASIC: 0.0875,
    DIVIDEND_HIGHER: 0.3375,
    DIVIDEND_ADDITIONAL: 0.3935,
    CGT_BASIC: 0.10,
    CGT_HIGHER: 0.20,
    // Residential Property Rates (2024/25)
    CGT_RESIDENTIAL_BASIC: 0.18,
    CGT_RESIDENTIAL_HIGHER: 0.24,
};

/**
 * Advanced UK Tax Estimator (2024/25 Basis)
 * Now includes State Pension & DB Pension in tax calculation
 * Returns detailed breakdown for transparency modal
 */
interface TaxCalculationResult {
    netSalary: number;
    netDividends: number;
    netPensionIncome: number;
    netRentalProfit: number;
    breakdown: Partial<TaxBreakdown>;
}

const calculateUKNetIncome = (
    grossSalary: number,
    grossDividends: number,
    grossStatePension: number,
    grossDBPension: number,
    grossRentalProfit: number,
    otherTaxableIncome: number,
    grossPensionWithdrawal: number,  // Pension drawdown (gross amount withdrawn)
    pensionTaxFreePct: number,       // % that is tax-free (25% if lump sum not taken, 0% if already taken)
    inflationMultiplier: number
): TaxCalculationResult => {
    const c = UK_TAX_CONSTANTS;

    // FROZEN thresholds - no inflation
    const personalAllowanceCap = c.PERSONAL_ALLOWANCE;
    const paTaperThreshold = c.PA_TAPER_THRESHOLD;
    const niPrimaryThreshold = c.NI_PRIMARY_THRESHOLD;
    const niUpperThreshold = c.NI_UPPER_THRESHOLD;

    // Thresholds that inflate
    const basicRateBandWidth = c.BASIC_RATE_BAND_WIDTH * inflationMultiplier;
    const higherRateCeiling = c.HIGHER_RATE_CEILING * inflationMultiplier;
    const dividendAllowance = c.DIVIDEND_ALLOWANCE * inflationMultiplier;

    // Calculate taxable portion of pension withdrawal
    // (1 - pensionTaxFreePct) is the taxable portion
    const taxablePensionWithdrawal = grossPensionWithdrawal * (1 - pensionTaxFreePct);

    // Total non-dividend taxable income (all taxed at income tax rates)
    // Pension income is taxable but NOT subject to NI
    const salaryOnlyIncome = grossSalary; // For NI calculation
    const totalNonDividendIncome = grossSalary + grossStatePension + grossDBPension + grossRentalProfit + otherTaxableIncome + taxablePensionWithdrawal;
    const totalAdjustedIncome = totalNonDividendIncome + grossDividends;

    // --- PA Taper Logic (The 60% Trap) ---
    // For every £2 earned over £100k, lose £1 of PA
    // £100k threshold is FROZEN
    let availablePersonalAllowance = personalAllowanceCap;
    let personalAllowanceUsed = 0;

    if (totalAdjustedIncome > paTaperThreshold) {
        const reduction = (totalAdjustedIncome - paTaperThreshold) / 2;
        availablePersonalAllowance = Math.max(0, personalAllowanceCap - reduction);
    }

    // --- A. National Insurance (Class 1) on SALARY ONLY ---
    // NI is NOT paid on pension income, rental income, or dividends
    // NI thresholds are FROZEN
    let niMain = 0;
    let niHigher = 0;

    let niable = Math.max(0, salaryOnlyIncome - niPrimaryThreshold);
    if (niable > 0) {
        // Main Rate (8%) from threshold to upper limit
        const amountAtMain = Math.min(niable, niUpperThreshold - niPrimaryThreshold);
        niMain = amountAtMain * c.NI_MAIN_RATE;
        niable -= amountAtMain;
    }
    if (niable > 0) {
        // Higher Rate (2%) above upper limit - NO CEILING
        niHigher = niable * c.NI_HIGHER_RATE;
    }
    const totalNI = niMain + niHigher;

    // --- B. Income Tax (Non-Savings, Non-Dividend) ---
    let taxableSalary = totalNonDividendIncome;

    // Apply Personal Allowance
    if (taxableSalary > availablePersonalAllowance) {
        personalAllowanceUsed = availablePersonalAllowance;
        taxableSalary -= availablePersonalAllowance;
    } else {
        personalAllowanceUsed = taxableSalary;
        taxableSalary = 0;
    }

    let incomeInBasic = 0;
    let incomeInHigher = 0;
    let incomeInAdditional = 0;
    let basicRateTax = 0;
    let higherRateTax = 0;
    let additionalRateTax = 0;

    // Basic Rate Band (20%)
    if (taxableSalary > 0) {
        const amount = Math.min(taxableSalary, basicRateBandWidth);
        basicRateTax = amount * c.BASIC_RATE;
        incomeInBasic = amount;
        taxableSalary -= amount;
    }

    // Higher Rate Band (40%)
    if (taxableSalary > 0) {
        const higherBandWidth = higherRateCeiling - personalAllowanceCap - basicRateBandWidth;
        const amount = Math.min(taxableSalary, higherBandWidth);
        higherRateTax = amount * c.HIGHER_RATE;
        incomeInHigher = amount;
        taxableSalary -= amount;
    }

    // Additional Rate Band (45%)
    if (taxableSalary > 0) {
        additionalRateTax = taxableSalary * c.ADDITIONAL_RATE;
        incomeInAdditional = taxableSalary;
    }

    const totalIncomeTax = basicRateTax + higherRateTax + additionalRateTax;

    // --- C. Dividend Tax ---
    let dividendBasicTax = 0;
    let dividendHigherTax = 0;
    let dividendAdditionalTax = 0;
    let dividendAllowanceUsed = Math.min(grossDividends, dividendAllowance);

    let taxableDivs = Math.max(0, grossDividends - dividendAllowance);

    // Dividends stack on top of non-dividend income
    // Find remaining space in each band

    // Remaining space in Basic Band
    let remainingBasic = Math.max(0, basicRateBandWidth - incomeInBasic);

    if (taxableDivs > 0 && remainingBasic > 0) {
        const amount = Math.min(taxableDivs, remainingBasic);
        dividendBasicTax = amount * c.DIVIDEND_BASIC;
        taxableDivs -= amount;
    }

    // Remaining space in Higher Band
    const higherBandWidth = higherRateCeiling - personalAllowanceCap - basicRateBandWidth;
    let remainingHigher = Math.max(0, higherBandWidth - incomeInHigher);

    if (taxableDivs > 0 && remainingHigher > 0) {
        const amount = Math.min(taxableDivs, remainingHigher);
        dividendHigherTax = amount * c.DIVIDEND_HIGHER;
        taxableDivs -= amount;
    }

    // Additional Rate
    if (taxableDivs > 0) {
        dividendAdditionalTax = taxableDivs * c.DIVIDEND_ADDITIONAL;
    }

    const totalDividendTax = dividendBasicTax + dividendHigherTax + dividendAdditionalTax;

    // --- Calculate Net Amounts ---
    const totalTaxOnNonDividend = totalIncomeTax + totalNI;
    const totalTaxPaid = totalIncomeTax + totalNI + totalDividendTax;
    const totalGrossIncome = totalNonDividendIncome + grossDividends;
    const netIncome = totalGrossIncome - totalTaxPaid;

    // Split tax proportionally across income sources (for reporting)
    const salaryRatio = grossSalary / (totalNonDividendIncome || 1);
    const statePensionRatio = grossStatePension / (totalNonDividendIncome || 1);
    const dbPensionRatio = grossDBPension / (totalNonDividendIncome || 1);
    const rentalRatio = grossRentalProfit / (totalNonDividendIncome || 1);

    // Salary pays both income tax AND NI
    const salaryIncomeTax = totalIncomeTax * salaryRatio;
    const netSalaryIncome = grossSalary - salaryIncomeTax - totalNI;

    // Other income only pays income tax (no NI)
    const pensionIncomeTax = totalIncomeTax * (statePensionRatio + dbPensionRatio);
    const netPensionIncome = (grossStatePension + grossDBPension) - pensionIncomeTax;

    const rentalIncomeTax = totalIncomeTax * rentalRatio;
    const netRentalProfit = grossRentalProfit - rentalIncomeTax;

    const netDividends = grossDividends - totalDividendTax;

    // Build breakdown for transparency modal
    const breakdown: Partial<TaxBreakdown> = {
        grossSalary,
        grossDividends,
        grossStatePension,
        grossDBPension,
        grossRentalProfit,
        grossPensionWithdrawal: taxablePensionWithdrawal,  // Taxable portion of pension drawdown
        grossOther: otherTaxableIncome,
        totalGrossIncome,
        personalAllowanceUsed,
        dividendAllowanceUsed,
        cgtAllowanceUsed: 0, // Set externally for CGT events
        incomeInBasicBand: incomeInBasic,
        incomeInHigherBand: incomeInHigher,
        incomeInAdditionalBand: incomeInAdditional,
        basicRateTax,
        higherRateTax,
        additionalRateTax,
        totalIncomeTax,
        niMainRate: niMain,
        niHigherRate: niHigher,
        totalNI,
        dividendBasicTax,
        dividendHigherTax,
        dividendAdditionalTax,
        totalDividendTax,
        cgtBasicRate: 0, // Set externally
        cgtHigherRate: 0, // Set externally
        totalCGT: 0, // Set externally
        totalTaxPaid,
        netIncome,
        effectiveTaxRate: totalGrossIncome > 0 ? (totalTaxPaid / totalGrossIncome) * 100 : 0,
    };

    return {
        netSalary: netSalaryIncome,
        netDividends,
        netPensionIncome,
        netRentalProfit,
        breakdown,
    };
};

/**
 * Helper: Resolve exact Gross Withdrawal needed to achieve a target Net amount
 * Uses binary search because inverting the progressive tax logic is complex.
 */
const resolveGrossWithdrawalForTargetNet = (
    targetNetDeficit: number,
    context: {
        grossSalary: number;
        grossDividends: number;
        grossStatePension: number;
        grossDBPension: number;
        grossRentalProfit: number;
        otherTaxableIncome: number;
        pensionTaxFreePct: number;
        inflationMultiplier: number;
    },
    availablePot: number
): { gross: number; net: number } => {
    // 1. Calculate Baseline Net Income (without withdrawal)
    const baseline = calculateUKNetIncome(
        context.grossSalary,
        context.grossDividends,
        context.grossStatePension,
        context.grossDBPension,
        context.grossRentalProfit,
        context.otherTaxableIncome,
        0,
        context.pensionTaxFreePct,
        context.inflationMultiplier
    );

    const baselineNet = baseline.breakdown.netIncome || 0;
    const targetNetTotal = baselineNet + targetNetDeficit;

    // 2. Binary Search for Gross Withdrawal
    let low = targetNetDeficit; // Minimum possible (0% tax)
    let high = targetNetDeficit * 2.5; // Generous upper bound (assuming >60% effective tax worst case)

    // Safety clamp upper bound to available pot if it's small, matches 'low' if available is tiny
    if (high > availablePot) high = Math.max(low, availablePot);

    // If available pot is less than the theoretical minimum needed (low), just take it all
    if (availablePot < low) {
        const result = calculateUKNetIncome(
            context.grossSalary,
            context.grossDividends,
            context.grossStatePension,
            context.grossDBPension,
            context.grossRentalProfit,
            context.otherTaxableIncome,
            availablePot,
            context.pensionTaxFreePct,
            context.inflationMultiplier
        );
        return { gross: availablePot, net: (result.breakdown.netIncome || 0) - baselineNet };
    }

    let iterations = 0;
    let bestGross = high;
    let bestNetDiff = 0;

    while (low <= high && iterations < 30) { // 30 iterations is ample for penny precision
        const mid = (low + high) / 2;

        // Calculate Net with this candidate Gross
        const res = calculateUKNetIncome(
            context.grossSalary,
            context.grossDividends,
            context.grossStatePension,
            context.grossDBPension,
            context.grossRentalProfit,
            context.otherTaxableIncome,
            mid,
            context.pensionTaxFreePct,
            context.inflationMultiplier
        );

        const currentNetAdded = (res.breakdown.netIncome || 0) - baselineNet;

        if (Math.abs(currentNetAdded - targetNetDeficit) < 0.05) {
            // Close enough (within 5p)
            bestGross = mid;
            bestNetDiff = currentNetAdded;
            break;
        }

        if (currentNetAdded < targetNetDeficit) {
            low = mid + 0.01;
        } else {
            bestGross = mid; // Keep this as a valid candidate that covers the need (maybe slightly over)
            bestNetDiff = currentNetAdded;
            high = mid - 0.01;
        }
        iterations++;
    }

    // Final clamp to available pot
    if (bestGross > availablePot) {
        bestGross = availablePot;
        const finalRes = calculateUKNetIncome(
            context.grossSalary,
            context.grossDividends,
            context.grossStatePension,
            context.grossDBPension,
            context.grossRentalProfit,
            context.otherTaxableIncome,
            bestGross,
            context.pensionTaxFreePct,
            context.inflationMultiplier
        );
        bestNetDiff = (finalRes.breakdown.netIncome || 0) - baselineNet;
    }

    return { gross: bestGross, net: bestNetDiff };
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
    let shadowPensionPot = potPension; // Shadow pot for fee comparison

    // Initialize Property Values (BTL)
    let propertyBalances = new Map<string, number>();
    (inputs.investmentProperties || []).forEach(p => {
        propertyBalances.set(p.id, p.value);
    });

    // Initialize Loan Balances map (id -> currentBalance)
    // If loan startAge <= currentAge, initialize with balance (loan already active)
    const currentAgeForInit = val(inputs.currentAge, 30);
    let loanBalances = new Map<string, number>();
    (inputs.loans || []).forEach(loan => {
        // If loan has already started, use actual balance; otherwise start at 0
        const initialBalance = loan.startAge <= currentAgeForInit ? loan.balance : 0;
        loanBalances.set(loan.id, initialBalance);
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
        // Now also handles dividend income via taxAsDividend flag
        const additionalIncomes = inputs.additionalIncomes || [];
        let grossDividends = 0;

        // 1. Array Logic - split between regular income and dividends based on taxAsDividend flag
        if (additionalIncomes.length > 0) {
            additionalIncomes.forEach(inc => {
                if (age >= inc.startAge && age <= inc.endAge) {
                    // Calculate amount with growth/inflation
                    const yearsFromStart = age - inc.startAge;
                    let amount = inc.amount;

                    if (inc.growthRate !== undefined) {
                        // Use explicit growth rate
                        amount = amount * Math.pow(1 + inc.growthRate / 100, yearsFromStart);
                    } else if (inc.inflationLinked !== false) {
                        // Default to inflation-linked
                        amount = amount * inflationMultiplier;
                    }

                    // Route to correct income type based on tax treatment
                    if (inc.taxAsDividend) {
                        grossDividends += amount;
                    } else {
                        grossSalary += amount;
                    }
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

        // B. Legacy single dividend value (for backwards compatibility)
        if (val(inputs.dividendIncome, 0) > 0 && isWorkingFullTime) {
            grossDividends += val(inputs.dividendIncome, 0) * inflationMultiplier;
        }

        // C. State Pension (calculate BEFORE tax so it can be taxed)
        // Apply missing NI years reduction - minimum 10 qualifying years required for any pension
        let grossStatePension = 0;
        if (age >= statePensionAge) {
            const missingYears = val(inputs.missingNIYears, 0);
            const qualifyingYears = Math.max(0, 35 - missingYears);
            // UK requires minimum 10 qualifying years for any state pension
            if (qualifyingYears >= 10) {
                const pensionFraction = qualifyingYears / 35;
                const fullStatePension = val(inputs.statePension, 0);
                grossStatePension = fullStatePension * pensionFraction * inflationMultiplier;
            }
        }

        // D. Defined Benefit Pensions (calculate BEFORE tax so it can be taxed)
        let grossDBPension = 0;
        (inputs.dbPensions || []).forEach(db => {
            if (age >= db.startAge) {
                let amount = db.annualIncome;
                if (db.inflationLinked !== false) {
                    amount = amount * inflationMultiplier;
                }
                grossDBPension += amount;
            }
        });

        // E. Rental Income (calculate profit BEFORE tax - gross rent minus costs)
        let grossRentalIncome = 0;
        let grossRentalProfit = 0;
        (inputs.investmentProperties || []).forEach(prop => {
            // Stop rent if sold
            if (prop.sellAge && age >= prop.sellAge) return;

            const rent = (prop.monthlyRent * 12) * inflationMultiplier;
            const costs = ((prop.monthlyCost || 0) * 12) * inflationMultiplier;
            grossRentalIncome += rent;
            grossRentalProfit += Math.max(0, rent - costs);
        });

        // F. Events (Income) - Separating Taxable vs Non-Taxable
        let eventIncomeNet = 0;
        let eventIncomeTaxable = 0; // Goes to Income Tax stack
        let eventDividends = 0; // Goes to Dividend stack
        let totalCGT = 0;
        let cgtBasicRate = 0;
        let cgtHigherRate = 0;
        let cgtAllowanceUsed = 0;

        // F1. Standard Events
        (inputs.events || []).forEach(e => {
            let isActive = false;
            if (e.isRecurring) {
                const end = e.endAge || lifeExpectancy;
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
                    // CGT with £3k allowance and 10%/20% rates
                    const cgtAllowance = UK_TAX_CONSTANTS.CGT_ALLOWANCE * inflationMultiplier;

                    // Note: This logic assumes independent allowances per event which is a simplification
                    // Ideally we should aggregate all gains first. 
                    // For now, we deduct allowance used by previous events in this year?
                    // The simpler path is to just reuse the allowance if we haven't tracked "remaining".
                    // However, let's try to be smart about allowance usage sharing.
                    const remainingAllowance = Math.max(0, cgtAllowance - cgtAllowanceUsed);

                    const gainUsingAllowance = Math.min(amount, remainingAllowance);
                    cgtAllowanceUsed += gainUsingAllowance;

                    const taxableGain = Math.max(0, amount - gainUsingAllowance);

                    // Determine CGT rate based on total taxable income (simplified)
                    const totalOtherIncome = grossSalary + grossStatePension + grossDBPension + grossRentalProfit;
                    const basicRateCeiling = UK_TAX_CONSTANTS.PERSONAL_ALLOWANCE + (UK_TAX_CONSTANTS.BASIC_RATE_BAND_WIDTH * inflationMultiplier);

                    if (totalOtherIncome < basicRateCeiling) {
                        // Basic rate taxpayer - gains fill remaining basic band at 10%
                        const basicBandRemaining = basicRateCeiling - totalOtherIncome;
                        const gainInBasic = Math.min(taxableGain, basicBandRemaining);
                        const gainInHigher = Math.max(0, taxableGain - gainInBasic);

                        // Accumulate tax
                        cgtBasicRate += gainInBasic * UK_TAX_CONSTANTS.CGT_BASIC;
                        cgtHigherRate += gainInHigher * UK_TAX_CONSTANTS.CGT_HIGHER;
                    } else {
                        // Higher rate taxpayer - all gains at 20%
                        cgtHigherRate += taxableGain * UK_TAX_CONSTANTS.CGT_HIGHER;
                    }

                    eventIncomeNet += amount - (taxableGain * (totalOtherIncome < basicRateCeiling ? UK_TAX_CONSTANTS.CGT_BASIC : UK_TAX_CONSTANTS.CGT_HIGHER)); // Approximate deduction
                } else if (e.taxType === 'residential_property') {
                    // Residential Property CGT (18% / 24%)
                    const cgtAllowance = UK_TAX_CONSTANTS.CGT_ALLOWANCE * inflationMultiplier;
                    const remainingAllowance = Math.max(0, cgtAllowance - cgtAllowanceUsed);

                    const gainUsingAllowance = Math.min(amount, remainingAllowance);
                    cgtAllowanceUsed += gainUsingAllowance;

                    const taxableGain = Math.max(0, amount - gainUsingAllowance);

                    // Determine rate
                    const totalOtherIncome = grossSalary + grossStatePension + grossDBPension + grossRentalProfit;
                    const basicRateCeiling = UK_TAX_CONSTANTS.PERSONAL_ALLOWANCE + (UK_TAX_CONSTANTS.BASIC_RATE_BAND_WIDTH * inflationMultiplier);

                    let taxToPay = 0;
                    if (totalOtherIncome < basicRateCeiling) {
                        const basicBandRemaining = basicRateCeiling - totalOtherIncome;
                        const gainInBasic = Math.min(taxableGain, basicBandRemaining);
                        const gainInHigher = Math.max(0, taxableGain - gainInBasic);

                        const taxBasic = gainInBasic * UK_TAX_CONSTANTS.CGT_RESIDENTIAL_BASIC;
                        const taxHigher = gainInHigher * UK_TAX_CONSTANTS.CGT_RESIDENTIAL_HIGHER;

                        taxToPay = taxBasic + taxHigher;
                        cgtBasicRate += taxBasic;
                        cgtHigherRate += taxHigher;
                    } else {
                        taxToPay = taxableGain * UK_TAX_CONSTANTS.CGT_RESIDENTIAL_HIGHER;
                        cgtHigherRate += taxToPay;
                    }

                    eventIncomeNet += amount - taxToPay;
                } else {
                    // Tax Free (Gift, Inheritance, ISA maturity)
                    eventIncomeNet += amount;
                }
            }
        });

        // F2. Property Disposals (Treated as Capital Events)
        (inputs.investmentProperties || []).forEach(prop => {
            if (prop.sellAge && age === prop.sellAge) {
                // 1. Determine Sale Value
                let saleValue = 0;
                if (prop.sellPrice) {
                    // Override provided (Today's Money -> Inflated)
                    saleValue = prop.sellPrice * inflationMultiplier;
                } else {
                    // Default: Grow by property specific growth rate
                    const yearsHeld = age - currentAge;
                    saleValue = prop.value * Math.pow(1 + (prop.growthRate || 0) / 100, yearsHeld);
                }

                // 2. Determine Capital Gain
                // Proxy Cost Basis = Initial Value (should ideally be original purchase price)
                const costBasis = prop.value;
                const gain = Math.max(0, saleValue - costBasis);

                // 3. Calculate CGT (Residential Property Rates should be 18%/24% but using standard for consistency unless specified)
                // We share the same allowance tracking
                const cgtAllowance = UK_TAX_CONSTANTS.CGT_ALLOWANCE * inflationMultiplier;
                const remainingAllowance = Math.max(0, cgtAllowance - cgtAllowanceUsed);

                const gainUsingAllowance = Math.min(gain, remainingAllowance);
                cgtAllowanceUsed += gainUsingAllowance;

                const taxableGain = Math.max(0, gain - gainUsingAllowance);

                let propertyTax = 0;

                const totalOtherIncome = grossSalary + grossStatePension + grossDBPension + grossRentalProfit;
                const basicRateCeiling = UK_TAX_CONSTANTS.PERSONAL_ALLOWANCE + (UK_TAX_CONSTANTS.BASIC_RATE_BAND_WIDTH * inflationMultiplier);

                if (totalOtherIncome < basicRateCeiling) {
                    const basicBandRemaining = Math.max(0, basicRateCeiling - totalOtherIncome);
                    // Note: Need to subtract gains already used in basic band by previous events? 
                    // This is getting complex. Simplified: just check band against income.

                    const gainInBasic = Math.min(taxableGain, basicBandRemaining);
                    const gainInHigher = Math.max(0, taxableGain - gainInBasic);

                    const taxBasic = gainInBasic * UK_TAX_CONSTANTS.CGT_BASIC; // Ideally 18%
                    const taxHigher = gainInHigher * UK_TAX_CONSTANTS.CGT_HIGHER; // Ideally 24%

                    propertyTax = taxBasic + taxHigher;
                    cgtBasicRate += taxBasic;
                    cgtHigherRate += taxHigher;
                } else {
                    const taxHigher = taxableGain * UK_TAX_CONSTANTS.CGT_HIGHER;
                    propertyTax = taxHigher;
                    cgtHigherRate += taxHigher;
                }

                totalCGT += propertyTax;

                // 4. Mortgage Redemption
                const mortgageBalance = prop.mortgageBalance || 0; // Assuming interest only / fixed balance

                // 5. Net Proceeds
                const netProceeds = saleValue - mortgageBalance - propertyTax;

                eventIncomeNet += netProceeds;
            }
        });

        // Finalize CGT totals for display
        totalCGT = cgtBasicRate + cgtHigherRate;

        // --- 3. Tax Calculation ---
        // All taxable income goes through the unified tax calculator

        let netSalaryIncome = 0;
        let netDividendIncome = 0;
        let netStatePensionIncome = 0;
        let netDBPensionIncome = 0;
        let netRentalIncome = 0;
        let taxBreakdown: Partial<TaxBreakdown> = {};

        if (inputs.isSalaryGross) {
            // Pass all income sources to tax calculator (without withdrawal - not known yet)
            const taxResult = calculateUKNetIncome(
                grossSalary,
                grossDividends + eventDividends,
                grossStatePension,
                grossDBPension,
                grossRentalProfit,
                eventIncomeTaxable,
                0,  // No pension withdrawal known at this point
                0,  // Tax-free percentage not relevant when withdrawal is 0
                inflationMultiplier
            );

            netSalaryIncome = taxResult.netSalary;
            netDividendIncome = taxResult.netDividends;

            // Split pension income for reporting
            const pensionRatio = grossStatePension / ((grossStatePension + grossDBPension) || 1);
            netStatePensionIncome = taxResult.netPensionIncome * pensionRatio;
            netDBPensionIncome = taxResult.netPensionIncome * (1 - pensionRatio);

            netRentalIncome = taxResult.netRentalProfit;
            taxBreakdown = taxResult.breakdown;

            // Add CGT data to breakdown
            taxBreakdown.cgtAllowanceUsed = cgtAllowanceUsed;
            taxBreakdown.cgtBasicRate = cgtBasicRate;
            taxBreakdown.cgtHigherRate = cgtHigherRate;
            taxBreakdown.totalCGT = totalCGT;
            taxBreakdown.totalTaxPaid = (taxBreakdown.totalTaxPaid || 0) + totalCGT;
        } else {
            // Assume input was already net (User selected 'Net' toggle)
            netSalaryIncome = grossSalary + eventIncomeTaxable;
            netDividendIncome = grossDividends + eventDividends;
            netStatePensionIncome = grossStatePension;
            netDBPensionIncome = grossDBPension;
            netRentalIncome = grossRentalProfit;
        }

        // For backward compatibility, keep these names
        const statePensionIncome = netStatePensionIncome;
        const dbPensionIncome = netDBPensionIncome;
        const rentalIncome = netRentalIncome;

        // --- 5. Spending & Expenses ---

        // A. General Spending
        let generalSpending = val(inputs.annualSpending, 0) * inflationMultiplier;
        const taperAge = val(inputs.spendingTaperAge, 75);
        const taperRate = val(inputs.spendingTaperRate, 0);
        // Taper starts AT the specified age (first reduction at taperAge + 1)
        if (age >= taperAge && taperRate > 0) {
            const yearsPastTaper = age - taperAge;
            // Clamp taper rate to prevent negative spending
            const safeTaperRate = Math.min(taperRate, 100) / 100;
            generalSpending = generalSpending * Math.pow(1 - safeTaperRate, yearsPastTaper);
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
                const end = e.endAge || lifeExpectancy;
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
        let pensionTaxRelief = 0;

        if (isWorkingFullTime) {
            contribCashYear = (val(inputs.contribCash, 0) * 12) * inflationMultiplier;
            contribISAYear = (val(inputs.contribISA, 0) * 12) * inflationMultiplier;
            contribGIAYear = (val(inputs.contribGIA, 0) * 12) * inflationMultiplier;

            // Pension contribution with tax relief
            // User enters what they pay (net), we add basic rate relief (25% gross-up)
            // Note: All taxpayers get 20% basic rate relief added to pension pot automatically.
            // Higher/additional rate taxpayers claim extra relief via self-assessment (personal benefit, not pension pot).
            const userPensionContrib = ((val(inputs.contribPension, 0) + val(inputs.contribWorkplacePension, 0) + val(inputs.contribSIPP, 0)) * 12) * inflationMultiplier;
            pensionTaxRelief = userPensionContrib * 0.25; // Basic rate relief (20% of gross = 25% of net)
            contribPensionYear = userPensionContrib + pensionTaxRelief; // Gross amount going into pension
        }

        // UK annual allowances are fixed by law, not inflated
        const annualLimitPension = 60000;
        const annualLimitISA = 20000;

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
        let withdrawalShadowPensionGross = 0;

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

                // Start of New Solver Logic
                // Context for the solver
                const context = {
                    grossSalary,
                    grossDividends: grossDividends + eventDividends,
                    grossStatePension,
                    grossDBPension,
                    grossRentalProfit,
                    otherTaxableIncome: eventIncomeTaxable,
                    pensionTaxFreePct: hasTakenLumpSum ? 0 : (pensionTaxFreeCashVal / 100),
                    inflationMultiplier
                };

                // Calculate SHADOW withdrawal (Benchmark)
                // What we WOULD withdraw if we had the Shadow Pot balance
                // This prevents the Shadow Pot from growing indefinitely if the Actual Pot runs out
                const shadowRes = resolveGrossWithdrawalForTargetNet(
                    remainingDeficit,
                    context,
                    Math.max(0, shadowPensionPot)
                );
                withdrawalShadowPensionGross += shadowRes.gross;

                // Calculate ACTUAL withdrawal
                const { gross, net } = resolveGrossWithdrawalForTargetNet(
                    remainingDeficit,
                    context,
                    available
                );
                withdrawalPensionGross += gross;
                withdrawalPensionNet += net;
                remainingDeficit -= net;
                // End of New Solver Logic
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

        // Use small threshold to handle floating-point rounding (not £1 which hides real shortfalls)
        const shortfall = remainingDeficit > 0.01 ? remainingDeficit : 0;

        // --- 9b. RECALCULATE TAX with pension withdrawal included ---
        // This gives us the accurate tax breakdown for display purposes
        if (inputs.isSalaryGross && withdrawalPensionGross > 0) {
            // Determine the tax-free percentage for this withdrawal
            // If lump sum already taken, all withdrawal is taxable
            // If using drip feed, 25% of each withdrawal is tax-free
            const withdrawalTaxFreePct = hasTakenLumpSum ? 0 : (pensionTaxFreeCashVal / 100);

            const finalTaxResult = calculateUKNetIncome(
                grossSalary,
                grossDividends + eventDividends,
                grossStatePension,
                grossDBPension,
                grossRentalProfit,
                eventIncomeTaxable,
                withdrawalPensionGross,
                withdrawalTaxFreePct,
                inflationMultiplier
            );

            // Update taxBreakdown with the correct values including withdrawal
            taxBreakdown = finalTaxResult.breakdown;

            // Re-add CGT data
            taxBreakdown.cgtAllowanceUsed = cgtAllowanceUsed;
            taxBreakdown.cgtBasicRate = cgtBasicRate;
            taxBreakdown.cgtHigherRate = cgtHigherRate;
            taxBreakdown.totalCGT = totalCGT;
            taxBreakdown.totalTaxPaid = (taxBreakdown.totalTaxPaid || 0) + totalCGT;
        }

        // --- 10. Bed and ISA ---
        let totalTransferToISA = 0;
        if (inputs.maxISAFromGIA) {
            const totalUsed = contribISAYear + surplusToISA + lumpSumToISA;
            const isaHeadroom = Math.max(0, annualLimitISA - totalUsed);

            if (isaHeadroom > 0) {
                const moveFromGIA = Math.min(Math.max(0, potGIA), isaHeadroom);
                if (moveFromGIA > 0) {
                    potGIA -= moveFromGIA;
                    potISA += moveFromGIA;
                    totalTransferToISA += moveFromGIA;
                }
                const remainingHeadroom = isaHeadroom - moveFromGIA;
                if (remainingHeadroom > 0) {
                    const moveFromCash = Math.min(Math.max(0, potCash), remainingHeadroom);
                    if (moveFromCash > 0) {
                        potCash -= moveFromCash;
                        potISA += moveFromCash;
                        totalTransferToISA += moveFromCash;
                    }
                }
            }
        }

        // --- 11. Apply Growth ---
        // Clamp growth factor to minimum 0 to prevent NaN from negative square roots
        const getGrowthFactor = (rate: number | undefined) => Math.max(0, 1 + (val(rate, 0) / 100));
        const getMidYearGrowthFactor = (rate: number | undefined) => Math.sqrt(Math.max(0, 1 + (val(rate, 0) / 100)));

        // Track Start Balances for Growth Calculation
        const startPotCash = potCash;
        const startPotISA = potISA;
        const startPotGIA = potGIA;
        const startPotPension = potPension;

        // Apply Growth & Flows
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

        // Calculate Growth Amounts (EndBalance - StartBalance - NetFlows)
        const netFlowCash = contribCashYear + surplusToCash - withdrawalCash;
        const growthCashAmt = potCash - (startPotCash + netFlowCash);

        const netFlowISA = contribISAYear + surplusToISA - withdrawalISA;
        const growthISAAmt = potISA - (startPotISA + netFlowISA);

        const netFlowGIA = contribGIAYear + surplusToGIA - withdrawalGIA;
        const growthGIAAmt = potGIA - (startPotGIA + netFlowGIA);

        const netFlowPension = contribPensionYear + surplusToPension - withdrawalPensionGross;
        const growthPensionAmt = potPension - (startPotPension + netFlowPension);

        // --- 11a. Benchmark Calculation (Shadow Pot) ---
        // Simulate what the pension would be with Low Cost Fixed Fees (£240/yr)
        const benchmarkFee = 240 * inflationMultiplier;
        const grossPensionGrowth = val(inputs.growthPension, 5); // No % fee deduction

        // Apply same cashflows to benchmark, but different fee structure
        shadowPensionPot = (shadowPensionPot * getGrowthFactor(grossPensionGrowth))
            + (contribPensionYear * getMidYearGrowthFactor(grossPensionGrowth))
            + (surplusToPension * getMidYearGrowthFactor(grossPensionGrowth))
            - (withdrawalShadowPensionGross * getMidYearGrowthFactor(grossPensionGrowth))
            - benchmarkFee;

        // Property Growth
        let totalPropertyValue = 0;
        let totalPropertyGrowth = 0;

        (inputs.investmentProperties || []).forEach(p => {
            // If sold this year or prior, value is 0
            if (p.sellAge && age >= p.sellAge) {
                propertyBalances.set(p.id, 0);
                return;
            }

            let currentVal = propertyBalances.get(p.id) || p.value;
            const gf = getGrowthFactor(p.growthRate);

            const newVal = currentVal * gf;
            const growth = newVal - currentVal;

            propertyBalances.set(p.id, newVal);
            totalPropertyValue += newVal;
            totalPropertyGrowth += growth;
        });

        // Sum Total Annual Investment Growth
        const totalInvestmentGrowth = growthCashAmt + growthISAAmt + growthGIAAmt + growthPensionAmt + totalPropertyGrowth;


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
            totalInvestmentGrowth,
            benchmarkPensionPot: Math.max(0, shadowPensionPot),

            // Tax Transparency Fields
            pensionTaxRelief,
            taxBreakdown: {
                // Ensure all fields are populated with defaults for non-gross mode
                grossSalary: taxBreakdown.grossSalary || grossSalary,
                grossDividends: taxBreakdown.grossDividends || grossDividends,
                grossStatePension: taxBreakdown.grossStatePension || grossStatePension,
                grossDBPension: taxBreakdown.grossDBPension || grossDBPension,
                grossRentalProfit: taxBreakdown.grossRentalProfit || grossRentalProfit,
                grossPensionWithdrawal: taxBreakdown.grossPensionWithdrawal || 0,
                grossOther: taxBreakdown.grossOther || 0,
                totalGrossIncome: taxBreakdown.totalGrossIncome || (grossSalary + grossDividends + grossStatePension + grossDBPension + grossRentalProfit),
                personalAllowanceUsed: taxBreakdown.personalAllowanceUsed || 0,
                dividendAllowanceUsed: taxBreakdown.dividendAllowanceUsed || 0,
                cgtAllowanceUsed: taxBreakdown.cgtAllowanceUsed || 0,
                incomeInBasicBand: taxBreakdown.incomeInBasicBand || 0,
                incomeInHigherBand: taxBreakdown.incomeInHigherBand || 0,
                incomeInAdditionalBand: taxBreakdown.incomeInAdditionalBand || 0,
                basicRateTax: taxBreakdown.basicRateTax || 0,
                higherRateTax: taxBreakdown.higherRateTax || 0,
                additionalRateTax: taxBreakdown.additionalRateTax || 0,
                totalIncomeTax: taxBreakdown.totalIncomeTax || 0,
                niMainRate: taxBreakdown.niMainRate || 0,
                niHigherRate: taxBreakdown.niHigherRate || 0,
                totalNI: taxBreakdown.totalNI || 0,
                dividendBasicTax: taxBreakdown.dividendBasicTax || 0,
                dividendHigherTax: taxBreakdown.dividendHigherTax || 0,
                dividendAdditionalTax: taxBreakdown.dividendAdditionalTax || 0,
                totalDividendTax: taxBreakdown.totalDividendTax || 0,
                cgtBasicRate: taxBreakdown.cgtBasicRate || 0,
                cgtHigherRate: taxBreakdown.cgtHigherRate || 0,
                totalCGT: taxBreakdown.totalCGT || 0,
                totalTaxPaid: taxBreakdown.totalTaxPaid || 0,
                netIncome: taxBreakdown.netIncome || totalIncome,
                effectiveTaxRate: taxBreakdown.effectiveTaxRate || 0,
            } as TaxBreakdown,

            totalTransferToISA,
        });
    }

    return results;
};