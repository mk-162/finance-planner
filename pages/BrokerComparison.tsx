
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, AlertTriangle, Trophy, TrendingDown, ExternalLink, Info } from 'lucide-react';
import { UserInputs, Scenario } from '../types';
import { BROKER_PLATFORMS, BrokerPlatform } from '../data/brokerPlatforms';
import {
    CalculatorInputs,
    PlatformResult,
    compareAllPlatforms,
    getRecommendations,
    formatCurrency,
    calculateSavings,
    calculateFeeDrag,
} from '../services/brokerFeeCalculator';
import { BrokerCalculatorInputs } from '../components/broker/BrokerCalculatorInputs';
import { BrokerResultsTable } from '../components/broker/BrokerResultsTable';
import { BrokerFeeDragChart } from '../components/broker/BrokerFeeDragChart';

interface BrokerComparisonProps {
    userInputs: UserInputs;
    onBack: () => void;
    scenarios: Scenario[];
    activeScenarioId: string;
    onScenarioChange: (id: string) => void;
}

export const BrokerComparison: React.FC<BrokerComparisonProps> = ({
    userInputs,
    onBack,
    scenarios,
    activeScenarioId,
    onScenarioChange,
}) => {
    // Pre-populate from user's Finance Planner data
    const getPrePopulatedInputs = (): CalculatorInputs => {
        const currentYear = new Date().getFullYear();
        const currentAge = currentYear - userInputs.birthYear;
        const yearsToEnd = Math.max(10, userInputs.lifeExpectancy - currentAge);

        // Calculate Investable Assets (Exclude Cash)
        const isa = userInputs.savingsISA || 0;
        const pension = (userInputs.savingsPension || 0) + (userInputs.savingsWorkplacePension || 0) + (userInputs.savingsSIPP || 0);
        const gia = userInputs.savingsGIA || 0;

        const startingPortfolio = isa + pension + gia;

        // Weighted Average Return
        let weightedReturn = 7;
        if (startingPortfolio > 0) {
            const growthISA = userInputs.growthISA || 7;
            const growthPension = userInputs.growthPension || 7;
            const growthGIA = userInputs.growthGIA || 7;

            weightedReturn = (
                (isa * growthISA) +
                (pension * growthPension) +
                (gia * growthGIA)
            ) / startingPortfolio;
        } else {
            weightedReturn = userInputs.growthPension || 7;
        }

        // Calculate monthly contributions (Exclude Cash)
        const monthlyContribution =
            (userInputs.contribISA || 0) +
            (userInputs.contribPension || 0) +
            (userInputs.contribWorkplacePension || 0) +
            (userInputs.contribSIPP || 0) +
            (userInputs.contribGIA || 0);

        // Determine account types based on balances/contributions
        const accountTypes: ('isa' | 'sipp' | 'trading')[] = [];
        if (isa > 0 || (userInputs.contribISA || 0) > 0) {
            accountTypes.push('isa');
        }
        if (pension > 0 || (userInputs.contribPension || 0) > 0 || (userInputs.contribWorkplacePension || 0) > 0 || (userInputs.contribSIPP || 0) > 0) {
            accountTypes.push('sipp');
        }
        if (gia > 0 || (userInputs.contribGIA || 0) > 0) {
            accountTypes.push('trading');
        }

        return {
            startingPortfolio: startingPortfolio,
            monthlyContribution: monthlyContribution,
            expectedReturn: Number(weightedReturn.toFixed(1)),
            years: Math.min(yearsToEnd, 40),
            tradesPerYear: 12,
            investmentType: 'mixed',
            internationalTrading: false,
            accountTypes: accountTypes.length > 0 ? accountTypes : ['isa'],
            currentFeePercentage: userInputs.currentFeePercentage || 0.75,
        };
    };

    const [inputs, setInputs] = useState<CalculatorInputs>(getPrePopulatedInputs);
    const [selectedPlatform, setSelectedPlatform] = useState<PlatformResult | null>(null);

    // Update inputs when scenario (userInputs) changes
    useEffect(() => {
        setInputs(getPrePopulatedInputs());
    }, [userInputs]);

    // Calculate results whenever inputs change
    const results = useMemo(() => {
        return compareAllPlatforms(BROKER_PLATFORMS, inputs);
    }, [inputs]);

    const referenceLines = useMemo(() => {
        // Create synthetic platforms for comparison
        const currentPlatform: BrokerPlatform = {
            id: 'current-fee-reference',
            name: 'Current Fees',
            feeType: 'percentage',
            annualFeeBase: 0,
            annualFeeNotes: '',
            feeTiers: [{ start: 0, end: Infinity, rate: (inputs.currentFeePercentage || 0.75) / 100 }],
            feeCap: null,
            tradingFeeFunds: 0,
            tradingFeeETFs: 0,
            tradingFeeShares: 0,
            regularInvestingFee: 0,
            fxFeeRate: 0,
            fxFeeNotes: '',
            accounts: inputs.accountTypes,
            goodFor: '',
            restrictions: '',
            entryFee: 0,
            exitFee: 0,
        };

        const industryPlatform: BrokerPlatform = {
            id: 'industry-avg-reference',
            name: 'Industry Average',
            feeType: 'percentage',
            annualFeeBase: 0,
            annualFeeNotes: '',
            feeTiers: [{ start: 0, end: Infinity, rate: 0.005 }], // 0.5%
            feeCap: null,
            tradingFeeFunds: 0,
            tradingFeeETFs: 0,
            tradingFeeShares: 0,
            regularInvestingFee: 0,
            fxFeeRate: 0,
            fxFeeNotes: '',
            accounts: inputs.accountTypes,
            goodFor: '',
            restrictions: '',
            entryFee: 0,
            exitFee: 0,
        };

        return {
            currentFee: calculateFeeDrag(currentPlatform, inputs),
            industryAverage: calculateFeeDrag(industryPlatform, inputs),
        };
    }, [inputs]);

    const recommendations = useMemo(() => {
        if (results.length === 0) return null;
        return getRecommendations(results, inputs);
    }, [results, inputs]);

    const savings = useMemo(() => {
        if (!recommendations) return 0;
        return calculateSavings(recommendations.cheapest, recommendations.mostExpensive);
    }, [recommendations]);

    return (
        <div className="h-screen overflow-y-scroll bg-slate-900 text-slate-200 light-scrollbar">
            {/* Header */}
            <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 text-slate-400 hover:text-white transition"
                            >
                                <ArrowLeft size={20} />
                                <span>Back to Planner</span>
                            </button>
                            <div className="h-6 w-px bg-slate-700" />
                            <h1 className="text-xl font-bold text-white hidden md:block">
                                Lifetime Fee Impact Calculator
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Disclaimer Banner */}
                <div className="bg-amber-900/20 border border-amber-800/50 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-amber-200 text-sm">For illustration only</p>
                            <p className="text-xs text-amber-400/80 mt-1">
                                Based on published platform rates as of December 2024. Does not include fund OCFs,
                                stamp duty, bid-ask spreads. Verify fees on platform websites before investing.
                                Capital at risk when investing. Past performance doesn't guarantee future results.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Graph Summary Header */}
                <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">Projected Impact of Fees</h2>
                            <p className="text-slate-300 max-w-2xl text-sm leading-relaxed">
                                The graph below projects how your portfolio (Capital + Growth) is reduced by fees over {inputs.years} years.
                                We compare your <span className="text-amber-400 font-bold">Current Fees ({(inputs.currentFeePercentage || 0.75).toFixed(2)}%)</span> against
                                the market's <span className="text-blue-400 font-bold"> Lowest</span> and
                                <span className="text-red-400 font-bold"> Highest</span> cost platforms, plus an
                                <span className="text-slate-400 font-bold"> Industry Average (0.5%)</span> benchmark.
                            </p>
                        </div>
                        {recommendations && (
                            <div className="text-right">
                                <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Max Potential Savings</div>
                                <div className="text-3xl font-bold text-emerald-400">
                                    {formatCurrency(savings)}
                                </div>
                                <div className="text-xs text-slate-500">vs most expensive option</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Calculator Inputs */}
                    <div className="lg:col-span-1">
                        <h3 className="text-lg font-bold text-white mb-4">Calculator Inputs</h3>

                        {/* Import Banner */}
                        <BrokerCalculatorInputs
                            inputs={inputs}
                            onChange={setInputs}
                            scenarios={scenarios}
                            activeScenarioId={activeScenarioId}
                            onScenarioChange={onScenarioChange}
                        />

                        {/* Info Card */}
                        <div className="mt-4 bg-slate-800 border border-slate-700 rounded-xl p-4">
                            <div className="flex items-start gap-2">
                                <Info size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-slate-300">
                                    <p className="font-semibold mb-1 text-white">What is Fee Drag?</p>
                                    <p>
                                        Fee drag is the total impact of platform fees on your portfolio.
                                        It includes both the fees you pay AND the growth you lose because
                                        those fees reduced your invested balance.
                                    </p>
                                    <p className="mt-2">
                                        A 0.45% fee doesn't just cost 0.45% - it compounds over time,
                                        potentially costing you tens of thousands in lost growth.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Results */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Chart */}
                        <BrokerFeeDragChart results={results} referenceLines={referenceLines} />

                        {/* Results Table */}
                        <BrokerResultsTable
                            results={results}
                            onSelectPlatform={setSelectedPlatform}
                        />
                    </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="mt-8 text-center text-xs text-slate-500">
                    <p>
                        This tool is for educational purposes only and does not constitute financial advice.
                        Always verify fee structures directly with platforms and consider seeking professional advice.
                    </p>
                    <p className="mt-2">
                        Data sources: Monevator UK Broker Comparison, Platform websites (December 2024)
                    </p>
                </div>
            </div>

            {/* Platform Detail Modal */}
            {selectedPlatform && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setSelectedPlatform(null)}
                >
                    <div
                        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-slate-800 bg-slate-800/50">
                            <h2 className="text-lg font-bold text-white">
                                {selectedPlatform.platform.name}
                            </h2>
                            <p className="text-sm text-slate-400">
                                {selectedPlatform.platform.goodFor}
                            </p>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Fee Summary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                                    <div className="text-xs text-slate-500 uppercase">Year 1 Fee</div>
                                    <div className="text-lg font-bold text-white">
                                        {formatCurrency(selectedPlatform.summary.year1Fee)}
                                    </div>
                                </div>
                                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                                    <div className="text-xs text-slate-500 uppercase">Total Fees ({inputs.years}y)</div>
                                    <div className="text-lg font-bold text-white">
                                        {formatCurrency(selectedPlatform.summary.totalFeesPaid)}
                                    </div>
                                </div>
                                <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-800/30">
                                    <div className="text-xs text-amber-500 uppercase">Lost Growth</div>
                                    <div className="text-lg font-bold text-amber-400">
                                        {formatCurrency(selectedPlatform.summary.opportunityCost)}
                                    </div>
                                </div>
                                <div className="bg-red-900/20 p-3 rounded-lg border border-red-800/30">
                                    <div className="text-xs text-red-500 uppercase">Total Fee Drag</div>
                                    <div className="text-lg font-bold text-red-400">
                                        {formatCurrency(selectedPlatform.summary.totalFeeDrag)}
                                    </div>
                                </div>
                            </div>

                            {/* Final Value */}
                            <div className="bg-emerald-900/20 border border-emerald-800/30 p-4 rounded-lg text-center">
                                <div className="text-xs text-emerald-500 uppercase">Projected Final Value</div>
                                <div className="text-2xl font-bold text-emerald-300">
                                    {formatCurrency(selectedPlatform.summary.finalValue)}
                                </div>
                                <div className="text-xs text-emerald-500 mt-1">
                                    vs {formatCurrency(selectedPlatform.summary.finalValueNoFees)} without fees
                                </div>
                            </div>

                            {/* Platform Details */}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Fee Type</span>
                                    <span className="text-white capitalize">{selectedPlatform.platform.feeType}</span>
                                </div>
                                {selectedPlatform.platform.annualFeeNotes && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Notes</span>
                                        <span className="text-slate-200 text-right max-w-[60%]">
                                            {selectedPlatform.platform.annualFeeNotes}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Accounts</span>
                                    <span className="text-slate-200">
                                        {selectedPlatform.platform.accounts.map(a => a.toUpperCase()).join(', ')}
                                    </span>
                                </div>
                                {selectedPlatform.platform.restrictions && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Restrictions</span>
                                        <span className="text-amber-500">{selectedPlatform.platform.restrictions}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-800 bg-slate-800/50 flex gap-3">
                            <button
                                onClick={() => setSelectedPlatform(null)}
                                className="flex-1 bg-slate-700 text-white py-2.5 rounded-lg font-medium hover:bg-slate-600 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
