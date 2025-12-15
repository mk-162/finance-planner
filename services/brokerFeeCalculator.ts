// Broker Fee Calculator Service
// Calculates platform fees, trading costs, and lifetime fee drag

import { BrokerPlatform, AccountType, InvestmentType } from '../data/brokerPlatforms';

export interface CalculatorInputs {
    startingPortfolio: number;
    monthlyContribution: number;
    expectedReturn: number; // as percentage e.g. 7 for 7%
    years: number;
    tradesPerYear: number;
    investmentType: InvestmentType;
    internationalTrading: boolean;
    accountTypes: AccountType[];
    currentFeePercentage?: number; // New optional field
}

export interface YearlyBreakdown {
    year: number;
    startBalance: number;
    contributions: number;
    platformFee: number;
    tradingFees: number;
    fxFees: number;
    totalFees: number;
    growth: number;
    endBalance: number;
    endBalanceNoFees: number;
    cumulativeFees: number;
    cumulativeOpportunityCost: number;
}

export interface PlatformResult {
    platform: BrokerPlatform;
    yearlyBreakdown: YearlyBreakdown[];
    summary: {
        finalValue: number;
        finalValueNoFees: number;
        totalFeesPaid: number;
        opportunityCost: number;
        totalFeeDrag: number;
        year1Fee: number;
        avgAnnualFee: number;
        effectiveFeeRate: number; // as percentage
    };
}

/**
 * Calculate platform fee for a given portfolio value
 */
export function calculatePlatformFee(
    platform: BrokerPlatform,
    portfolioValue: number,
    investmentType: InvestmentType
): number {
    let fee = 0;

    // Flat fee platforms
    if (platform.feeType === 'flat') {
        fee = platform.annualFeeBase;
    }
    // Trading-only platforms (no platform fee)
    else if (platform.feeType === 'trading') {
        fee = 0;
    }
    // Percentage-based (may be tiered)
    else if (platform.feeType === 'percentage') {
        // If there's a base fee for small portfolios, start with that
        if (platform.annualFeeBase > 0 && platform.feeTiers.length > 0) {
            const firstTier = platform.feeTiers[0];
            if (portfolioValue < firstTier.start || (firstTier.rate === 0 && portfolioValue <= firstTier.end)) {
                fee = platform.annualFeeBase;
            } else {
                // Calculate tiered fee
                fee = calculateTieredFee(platform.feeTiers, portfolioValue);
            }
        } else {
            // Just calculate tiered fee
            fee = calculateTieredFee(platform.feeTiers, portfolioValue);
        }
    }

    // Apply fee cap if exists
    if (platform.feeCap !== null && fee > platform.feeCap) {
        // For some platforms, fee cap only applies to certain investment types
        if (platform.id === 'hl' || platform.id === 'aj-bell') {
            // Fee cap applies to ETFs/shares/ITs only
            if (investmentType === 'etfs' || investmentType === 'shares') {
                fee = platform.feeCap;
            }
        } else {
            fee = platform.feeCap;
        }
    }

    return fee;
}

/**
 * Calculate tiered fee based on portfolio value
 */
function calculateTieredFee(tiers: { start: number; end: number; rate: number }[], value: number): number {
    let totalFee = 0;
    let remaining = value;

    for (const tier of tiers) {
        if (remaining <= 0) break;

        const tierStart = tier.start;
        const tierEnd = tier.end;
        const tierRange = tierEnd - tierStart;

        // Amount that falls into this tier
        const amountInTier = Math.min(remaining, tierRange);

        if (amountInTier > 0 && value > tierStart) {
            const taxableInTier = Math.min(value - tierStart, tierRange);
            totalFee += taxableInTier * tier.rate;
            remaining -= taxableInTier;
        }
    }

    return totalFee;
}

/**
 * Calculate trading fees for a year
 */
export function calculateTradingFees(
    platform: BrokerPlatform,
    tradesPerYear: number,
    investmentType: InvestmentType
): number {
    let feePerTrade = 0;

    switch (investmentType) {
        case 'funds':
            feePerTrade = platform.tradingFeeFunds;
            break;
        case 'etfs':
            feePerTrade = platform.tradingFeeETFs;
            break;
        case 'shares':
            feePerTrade = platform.tradingFeeShares;
            break;
        case 'mixed':
            // Assume 50% ETFs, 50% funds
            feePerTrade = (platform.tradingFeeETFs + platform.tradingFeeFunds) / 2;
            break;
    }

    // Check for regular investing discount
    if (platform.regularInvestingFee >= 0 && tradesPerYear >= 12) {
        // Assume monthly regular investing for most trades
        const regularTrades = 12;
        const adHocTrades = Math.max(0, tradesPerYear - 12);
        return (regularTrades * platform.regularInvestingFee) + (adHocTrades * feePerTrade);
    }

    return tradesPerYear * feePerTrade;
}

/**
 * Calculate FX fees for international trading
 */
export function calculateFXFees(
    platform: BrokerPlatform,
    contributions: number,
    internationalTrading: boolean
): number {
    if (!internationalTrading || platform.fxFeeRate === 0) {
        return 0;
    }

    // Assume 50% of contributions go to international investments
    const internationalAmount = contributions * 0.5;
    return internationalAmount * platform.fxFeeRate;
}

/**
 * Calculate complete lifetime fee impact for a platform
 */
export function calculateFeeDrag(
    platform: BrokerPlatform,
    inputs: CalculatorInputs
): PlatformResult {
    const yearlyBreakdown: YearlyBreakdown[] = [];

    let balanceWithFees = inputs.startingPortfolio;
    let balanceNoFees = inputs.startingPortfolio;
    let cumulativeFees = 0;

    const returnRate = inputs.expectedReturn / 100;
    const annualContributions = inputs.monthlyContribution * 12;

    for (let year = 1; year <= inputs.years; year++) {
        const startBalance = balanceWithFees;
        const startBalanceNoFees = balanceNoFees;

        // Add contributions at start of year
        balanceWithFees += annualContributions;
        balanceNoFees += annualContributions;

        // Calculate fees for this year (based on balance after contributions)
        const platformFee = calculatePlatformFee(platform, balanceWithFees, inputs.investmentType);
        const tradingFees = calculateTradingFees(platform, inputs.tradesPerYear, inputs.investmentType);
        const fxFees = calculateFXFees(platform, annualContributions, inputs.internationalTrading);
        const totalFees = platformFee + tradingFees + fxFees;

        // Deduct fees before growth
        balanceWithFees -= totalFees;
        cumulativeFees += totalFees;

        // Apply growth
        const growthWithFees = balanceWithFees * returnRate;
        const growthNoFees = balanceNoFees * returnRate;

        balanceWithFees += growthWithFees;
        balanceNoFees += growthNoFees;

        // Calculate opportunity cost (what you lost in growth because fees were deducted)
        const cumulativeOpportunityCost = (balanceNoFees - balanceWithFees) - cumulativeFees;

        yearlyBreakdown.push({
            year,
            startBalance,
            contributions: annualContributions,
            platformFee,
            tradingFees,
            fxFees,
            totalFees,
            growth: growthWithFees,
            endBalance: balanceWithFees,
            endBalanceNoFees: balanceNoFees,
            cumulativeFees,
            cumulativeOpportunityCost,
        });
    }

    const finalValue = balanceWithFees;
    const finalValueNoFees = balanceNoFees;
    const totalFeeDrag = finalValueNoFees - finalValue;
    const opportunityCost = totalFeeDrag - cumulativeFees;
    const year1Fee = yearlyBreakdown[0]?.totalFees || 0;
    const avgAnnualFee = cumulativeFees / inputs.years;

    // Effective fee rate = total drag as % of what you would have had
    const effectiveFeeRate = (totalFeeDrag / finalValueNoFees) * 100;

    return {
        platform,
        yearlyBreakdown,
        summary: {
            finalValue,
            finalValueNoFees,
            totalFeesPaid: cumulativeFees,
            opportunityCost,
            totalFeeDrag,
            year1Fee,
            avgAnnualFee,
            effectiveFeeRate,
        },
    };
}

/**
 * Calculate fee drag for all platforms and return sorted by total drag
 */
export function compareAllPlatforms(
    platforms: BrokerPlatform[],
    inputs: CalculatorInputs
): PlatformResult[] {
    // Filter platforms that support required account types
    const compatiblePlatforms = platforms.filter(platform => {
        if (inputs.accountTypes.length === 0) return true;
        return inputs.accountTypes.some(accountType =>
            platform.accounts.includes(accountType)
        );
    });

    // Calculate fee drag for each platform
    const results = compatiblePlatforms.map(platform =>
        calculateFeeDrag(platform, inputs)
    );

    // Sort by total fee drag (lowest first)
    results.sort((a, b) => a.summary.totalFeeDrag - b.summary.totalFeeDrag);

    return results;
}

/**
 * Get platform recommendations based on inputs
 */
export function getRecommendations(
    results: PlatformResult[],
    inputs: CalculatorInputs
): { cheapest: PlatformResult; bestValue: PlatformResult; mostExpensive: PlatformResult } {
    const cheapest = results[0];
    const mostExpensive = results[results.length - 1];

    // "Best value" considers both cost and restrictions
    // For simplicity, we'll pick the cheapest without major restrictions
    const bestValue = results.find(r =>
        !r.platform.restrictions ||
        r.platform.restrictions.length === 0
    ) || cheapest;

    return { cheapest, bestValue, mostExpensive };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
    return `£${Math.round(value).toLocaleString()}`;
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate savings between two platforms
 */
export function calculateSavings(cheapest: PlatformResult, expensive: PlatformResult): number {
    return expensive.summary.totalFeeDrag - cheapest.summary.totalFeeDrag;
}
