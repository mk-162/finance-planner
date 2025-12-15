import React from 'react';
import { Wallet, TrendingUp, Calendar, RefreshCw, Globe, TrendingDown } from 'lucide-react';
import { CalculatorInputs } from '../../services/brokerFeeCalculator';
import { CALCULATOR_SCENARIOS, AccountType, InvestmentType } from '../../data/brokerPlatforms';
import { Scenario } from '../../types';

interface BrokerCalculatorInputsProps {
    inputs: CalculatorInputs;
    onChange: (inputs: CalculatorInputs) => void;
    scenarios: Scenario[];
    activeScenarioId: string;
    onScenarioChange: (id: string) => void;
}

const formatNumber = (value: number): string => {
    return value.toLocaleString();
};

const parseNumber = (value: string): number => {
    return parseInt(value.replace(/,/g, ''), 10) || 0;
};

export const BrokerCalculatorInputs: React.FC<BrokerCalculatorInputsProps> = ({
    inputs,
    onChange,
    scenarios,
    activeScenarioId,
    onScenarioChange,
}) => {
    const handleScenarioClick = (scenarioId: string) => {
        const scenario = CALCULATOR_SCENARIOS.find(s => s.id === scenarioId);
        if (scenario) {
            onChange({
                startingPortfolio: scenario.startingPortfolio,
                monthlyContribution: scenario.monthlyContribution,
                expectedReturn: scenario.expectedReturn,
                years: scenario.years,
                tradesPerYear: scenario.tradesPerYear,
                investmentType: scenario.investmentType,
                internationalTrading: scenario.internationalTrading,
                accountTypes: scenario.accountTypes,
            });
        }
    };

    const handleAccountTypeToggle = (accountType: AccountType) => {
        const newTypes = inputs.accountTypes.includes(accountType)
            ? inputs.accountTypes.filter(t => t !== accountType)
            : [...inputs.accountTypes, accountType];
        onChange({ ...inputs, accountTypes: newTypes });
    };

    return (
        <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Calculator Inputs</h2>

            {/* Import Banner - Merged */}
            <div className="mb-6 bg-teal-900/20 border border-teal-800/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="bg-teal-500/10 p-1.5 rounded-lg">
                        <TrendingDown size={16} className="text-teal-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-teal-300">Values imported from planner</p>
                        <p className="text-[10px] text-teal-400/70">Based on your current scenario inputs</p>
                    </div>
                </div>

                {/* Scenario Selector */}
                <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1.5 border border-teal-800/30">
                    <span className="text-xs text-teal-400/70 font-medium px-2">Scenario:</span>
                    <select
                        value={activeScenarioId}
                        onChange={(e) => onScenarioChange(e.target.value)}
                        className="bg-transparent text-teal-100 text-sm py-1 px-2 w-full rounded border-none focus:ring-0 outline-none [&>option]:bg-slate-900 [&>option]:text-white"
                    >
                        {scenarios.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Starting Portfolio */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1">
                        <Wallet size={16} className="text-slate-400" />
                        Starting Portfolio
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                        <input
                            type="text"
                            value={formatNumber(inputs.startingPortfolio)}
                            onChange={(e) => onChange({ ...inputs, startingPortfolio: parseNumber(e.target.value) })}
                            className="w-full pl-7 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                    </div>
                </div>

                {/* Monthly Contribution */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1">
                        <RefreshCw size={16} className="text-slate-400" />
                        Monthly Contribution
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                        <input
                            type="text"
                            value={formatNumber(inputs.monthlyContribution)}
                            onChange={(e) => onChange({ ...inputs, monthlyContribution: parseNumber(e.target.value) })}
                            className="w-full pl-7 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                    </div>
                </div>

                {/* Expected Return */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1">
                        <TrendingUp size={16} className="text-slate-400" />
                        Expected Return
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={inputs.expectedReturn}
                            onChange={(e) => onChange({ ...inputs, expectedReturn: parseFloat(e.target.value) || 0 })}
                            className="w-full pr-8 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                    </div>
                </div>

                {/* Time Horizon */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1">
                        <Calendar size={16} className="text-slate-400" />
                        Time Horizon
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={inputs.years}
                            onChange={(e) => onChange({ ...inputs, years: parseInt(e.target.value) || 1 })}
                            className="w-full pr-14 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">years</span>
                    </div>
                </div>

                {/* Trades Per Year */}
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">
                        Trades Per Year
                    </label>
                    <select
                        value={inputs.tradesPerYear}
                        onChange={(e) => onChange({ ...inputs, tradesPerYear: parseInt(e.target.value) })}
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                        <option value="1">1 (Annual lump sum)</option>
                        <option value="4">4 (Quarterly)</option>
                        <option value="12">12 (Monthly)</option>
                        <option value="24">24 (Bi-weekly)</option>
                        <option value="52">52 (Weekly)</option>
                    </select>
                </div>

                {/* Investment Type */}
                <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">
                        Investment Type
                    </label>
                    <select
                        value={inputs.investmentType}
                        onChange={(e) => onChange({ ...inputs, investmentType: e.target.value as InvestmentType })}
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                        <option value="funds">Funds only</option>
                        <option value="etfs">ETFs only</option>
                        <option value="shares">Individual shares</option>
                        <option value="mixed">Mixed portfolio</option>
                    </select>
                </div>
            </div>

            {/* Account Types */}
            <div className="mt-4">
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Account Types Needed
                </label>
                <div className="flex flex-wrap gap-2">
                    {(['isa', 'sipp', 'trading', 'lisa', 'jisa'] as AccountType[]).map(type => (
                        <button
                            key={type}
                            onClick={() => handleAccountTypeToggle(type)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition ${inputs.accountTypes.includes(type)
                                ? 'bg-teal-900/40 text-teal-200 border-2 border-teal-500'
                                : 'bg-slate-700 text-slate-400 border-2 border-transparent hover:bg-slate-600'
                                }`}
                        >
                            {type.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* International Trading */}
            <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={inputs.internationalTrading}
                        onChange={(e) => onChange({ ...inputs, internationalTrading: e.target.checked })}
                        className="w-4 h-4 text-teal-500 border-slate-600 rounded bg-slate-700 focus:ring-teal-500 focus:ring-offset-slate-900"
                    />
                    <Globe size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-300">Include international/US stocks</span>
                </label>
                <p className="text-xs text-slate-500 ml-6 mt-1">
                    Adds FX conversion fees when buying non-GBP assets
                </p>
            </div>

            {/* Current Fee Slider */}
            <div className="mt-6 pt-4 border-t border-slate-700">
                <label className="flex items-center justify-between text-sm font-medium text-slate-300 mb-2">
                    <span>Current Annual Fee (For Comparison)</span>
                    <span className="text-teal-400 font-mono font-bold">{(inputs.currentFeePercentage || 0.75).toFixed(2)}%</span>
                </label>
                <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.05"
                    value={inputs.currentFeePercentage || 0.75}
                    onChange={(e) => onChange({ ...inputs, currentFeePercentage: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>0%</span>
                    <span>1.5%</span>
                    <span>3%</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    This line will appear on the chart to show how your current fees compare.
                </p>
            </div>
        </div>
    );
};
