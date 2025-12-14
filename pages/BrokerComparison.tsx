import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, AlertTriangle, Trophy, TrendingDown, ExternalLink, Info } from 'lucide-react';
import { UserInputs } from '../types';
import { BROKER_PLATFORMS } from '../data/brokerPlatforms';
import {
    CalculatorInputs,
    PlatformResult,
    compareAllPlatforms,
    getRecommendations,
    formatCurrency,
    calculateSavings,
} from '../services/brokerFeeCalculator';
import { BrokerCalculatorInputs } from '../components/broker/BrokerCalculatorInputs';
import { BrokerResultsTable } from '../components/broker/BrokerResultsTable';
import { BrokerFeeDragChart } from '../components/broker/BrokerFeeDragChart';

interface BrokerComparisonProps {
    userInputs: UserInputs;
    onBack: () => void;
}

export const BrokerComparison: React.FC<BrokerComparisonProps> = ({
    userInputs,
    onBack,
}) => {
    // Pre-populate from user's Finance Planner data
    const getPrePopulatedInputs = (): CalculatorInputs => {
        const currentYear = new Date().getFullYear();
        const currentAge = currentYear - userInputs.birthYear;
        const yearsToEnd = Math.max(10, userInputs.lifeExpectancy - currentAge);

        // Calculate starting portfolio from all accounts
        const startingPortfolio =
            (userInputs.savingsISA || 0) +
            (userInputs.savingsPension || 0) +
            (userInputs.savingsWorkplacePension || 0) +
            (userInputs.savingsSIPP || 0) +
            (userInputs.savingsGIA || 0) +
            (userInputs.savingsCash || 0);

        // Calculate monthly contributions
        const monthlyContribution =
            (userInputs.contribISA || 0) +
            (userInputs.contribPension || 0) +
            (userInputs.contribWorkplacePension || 0) +
            (userInputs.contribSIPP || 0) +
            (userInputs.contribGIA || 0) +
            (userInputs.contribCash || 0);

        // Determine account types based on balances/contributions
        const accountTypes: ('isa' | 'sipp' | 'trading')[] = [];
        if ((userInputs.savingsISA || 0) > 0 || (userInputs.contribISA || 0) > 0) {
            accountTypes.push('isa');
        }
        if (
            (userInputs.savingsPension || 0) > 0 ||
            (userInputs.savingsWorkplacePension || 0) > 0 ||
            (userInputs.savingsSIPP || 0) > 0 ||
            (userInputs.contribPension || 0) > 0
        ) {
            accountTypes.push('sipp');
        }
        if ((userInputs.savingsGIA || 0) > 0 || (userInputs.contribGIA || 0) > 0) {
            accountTypes.push('trading');
        }

        return {
            startingPortfolio: startingPortfolio || 50000,
            monthlyContribution: monthlyContribution || 500,
            expectedReturn: userInputs.growthPension || 7,
            years: Math.min(yearsToEnd, 40),
            tradesPerYear: 12,
            investmentType: 'mixed',
            internationalTrading: false,
            accountTypes: accountTypes.length > 0 ? accountTypes : ['isa'],
        };
    };

    const [inputs, setInputs] = useState<CalculatorInputs>(getPrePopulatedInputs);
    const [selectedPlatform, setSelectedPlatform] = useState<PlatformResult | null>(null);

    // Calculate results whenever inputs change
    const results = useMemo(() => {
        return compareAllPlatforms(BROKER_PLATFORMS, inputs);
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
        <div className="h-screen overflow-y-scroll bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 light-scrollbar">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
                            >
                                <ArrowLeft size={20} />
                                <span>Back to Planner</span>
                            </button>
                            <div className="h-6 w-px bg-slate-300" />
                            <h1 className="text-xl font-bold text-slate-800">
                                Lifetime Fee Impact Calculator
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Disclaimer Banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-amber-800 text-sm">For illustration only</p>
                            <p className="text-xs text-amber-700 mt-1">
                                Based on published platform rates as of December 2024. Does not include fund OCFs,
                                stamp duty, bid-ask spreads. Verify fees on platform websites before investing.
                                Capital at risk when investing. Past performance doesn't guarantee future results.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Hero Stats */}
                {recommendations && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Cheapest */}
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Trophy size={20} className="text-green-600" />
                                <span className="text-xs font-semibold text-green-700 uppercase">Cheapest</span>
                            </div>
                            <div className="text-xl font-bold text-green-800">
                                {recommendations.cheapest.platform.name}
                            </div>
                            <div className="text-sm text-green-700 mt-1">
                                Fee Drag: {formatCurrency(recommendations.cheapest.summary.totalFeeDrag)}
                            </div>
                            <div className="text-lg font-mono font-semibold text-green-800 mt-2">
                                Final: {formatCurrency(recommendations.cheapest.summary.finalValue)}
                            </div>
                        </div>

                        {/* You Save */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingDown size={20} className="text-blue-600" />
                                <span className="text-xs font-semibold text-blue-700 uppercase">Potential Savings</span>
                            </div>
                            <div className="text-2xl font-bold text-blue-800">
                                {formatCurrency(savings)}
                            </div>
                            <div className="text-sm text-blue-700 mt-1">
                                vs most expensive platform
                            </div>
                            <div className="text-xs text-blue-600 mt-2">
                                Over {inputs.years} years with your inputs
                            </div>
                        </div>

                        {/* Most Expensive */}
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle size={20} className="text-red-600" />
                                <span className="text-xs font-semibold text-red-700 uppercase">Most Expensive</span>
                            </div>
                            <div className="text-xl font-bold text-red-800">
                                {recommendations.mostExpensive.platform.name}
                            </div>
                            <div className="text-sm text-red-700 mt-1">
                                Fee Drag: {formatCurrency(recommendations.mostExpensive.summary.totalFeeDrag)}
                            </div>
                            <div className="text-lg font-mono font-semibold text-red-800 mt-2">
                                Final: {formatCurrency(recommendations.mostExpensive.summary.finalValue)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Calculator Inputs */}
                    <div className="lg:col-span-1">
                        <BrokerCalculatorInputs inputs={inputs} onChange={setInputs} />

                        {/* Info Card */}
                        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <div className="flex items-start gap-2">
                                <Info size={16} className="text-slate-500 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-slate-600">
                                    <p className="font-semibold mb-1">What is Fee Drag?</p>
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
                        <BrokerFeeDragChart results={results} />

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
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setSelectedPlatform(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800">
                                {selectedPlatform.platform.name}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {selectedPlatform.platform.goodFor}
                            </p>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Fee Summary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <div className="text-xs text-slate-500 uppercase">Year 1 Fee</div>
                                    <div className="text-lg font-bold text-slate-800">
                                        {formatCurrency(selectedPlatform.summary.year1Fee)}
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <div className="text-xs text-slate-500 uppercase">Total Fees ({inputs.years}y)</div>
                                    <div className="text-lg font-bold text-slate-800">
                                        {formatCurrency(selectedPlatform.summary.totalFeesPaid)}
                                    </div>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-lg">
                                    <div className="text-xs text-amber-600 uppercase">Lost Growth</div>
                                    <div className="text-lg font-bold text-amber-700">
                                        {formatCurrency(selectedPlatform.summary.opportunityCost)}
                                    </div>
                                </div>
                                <div className="bg-red-50 p-3 rounded-lg">
                                    <div className="text-xs text-red-600 uppercase">Total Fee Drag</div>
                                    <div className="text-lg font-bold text-red-700">
                                        {formatCurrency(selectedPlatform.summary.totalFeeDrag)}
                                    </div>
                                </div>
                            </div>

                            {/* Final Value */}
                            <div className="bg-green-50 p-4 rounded-lg text-center">
                                <div className="text-xs text-green-600 uppercase">Projected Final Value</div>
                                <div className="text-2xl font-bold text-green-800">
                                    {formatCurrency(selectedPlatform.summary.finalValue)}
                                </div>
                                <div className="text-xs text-green-600 mt-1">
                                    vs {formatCurrency(selectedPlatform.summary.finalValueNoFees)} without fees
                                </div>
                            </div>

                            {/* Platform Details */}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Fee Type</span>
                                    <span className="text-slate-800 capitalize">{selectedPlatform.platform.feeType}</span>
                                </div>
                                {selectedPlatform.platform.annualFeeNotes && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Notes</span>
                                        <span className="text-slate-800 text-right max-w-[60%]">
                                            {selectedPlatform.platform.annualFeeNotes}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Accounts</span>
                                    <span className="text-slate-800">
                                        {selectedPlatform.platform.accounts.map(a => a.toUpperCase()).join(', ')}
                                    </span>
                                </div>
                                {selectedPlatform.platform.restrictions && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Restrictions</span>
                                        <span className="text-amber-600">{selectedPlatform.platform.restrictions}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <button
                                onClick={() => setSelectedPlatform(null)}
                                className="flex-1 bg-slate-200 text-slate-800 py-2.5 rounded-lg font-medium hover:bg-slate-300 transition"
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
