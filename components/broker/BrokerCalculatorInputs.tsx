import React from 'react';
import { Wallet, TrendingUp, Calendar, RefreshCw, Globe } from 'lucide-react';
import { CalculatorInputs } from '../../services/brokerFeeCalculator';
import { CALCULATOR_SCENARIOS, AccountType, InvestmentType } from '../../data/brokerPlatforms';

interface BrokerCalculatorInputsProps {
    inputs: CalculatorInputs;
    onChange: (inputs: CalculatorInputs) => void;
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Calculator Inputs</h2>

            {/* Quick Scenarios */}
            <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Quick Start
                </label>
                <div className="flex flex-wrap gap-2">
                    {CALCULATOR_SCENARIOS.map(scenario => (
                        <button
                            key={scenario.id}
                            onClick={() => handleScenarioClick(scenario.id)}
                            className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            title={scenario.description}
                        >
                            {scenario.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Starting Portfolio */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                        <Wallet size={16} className="text-slate-400" />
                        Starting Portfolio
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                        <input
                            type="text"
                            value={formatNumber(inputs.startingPortfolio)}
                            onChange={(e) => onChange({ ...inputs, startingPortfolio: parseNumber(e.target.value) })}
                            className="w-full pl-7 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Monthly Contribution */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                        <RefreshCw size={16} className="text-slate-400" />
                        Monthly Contribution
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                        <input
                            type="text"
                            value={formatNumber(inputs.monthlyContribution)}
                            onChange={(e) => onChange({ ...inputs, monthlyContribution: parseNumber(e.target.value) })}
                            className="w-full pl-7 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Expected Return */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
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
                            className="w-full pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                    </div>
                </div>

                {/* Time Horizon */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
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
                            className="w-full pr-14 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">years</span>
                    </div>
                </div>

                {/* Trades Per Year */}
                <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Trades Per Year
                    </label>
                    <select
                        value={inputs.tradesPerYear}
                        onChange={(e) => onChange({ ...inputs, tradesPerYear: parseInt(e.target.value) })}
                        className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Investment Type
                    </label>
                    <select
                        value={inputs.investmentType}
                        onChange={(e) => onChange({ ...inputs, investmentType: e.target.value as InvestmentType })}
                        className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Account Types Needed
                </label>
                <div className="flex flex-wrap gap-2">
                    {(['isa', 'sipp', 'trading', 'lisa', 'jisa'] as AccountType[]).map(type => (
                        <button
                            key={type}
                            onClick={() => handleAccountTypeToggle(type)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition ${
                                inputs.accountTypes.includes(type)
                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-400'
                                    : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
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
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <Globe size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-700">Include international/US stocks</span>
                </label>
                <p className="text-xs text-slate-500 ml-6 mt-1">
                    Adds FX conversion fees when buying non-GBP assets
                </p>
            </div>
        </div>
    );
};
