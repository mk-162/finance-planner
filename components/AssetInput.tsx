

import React, { useState } from 'react';
import { SimpleFormattedInput } from './InputSection';

interface AssetInputProps {
    label: string;
    subLabel?: string;
    balance: number;
    contribution: number;
    growth: number;
    onUpdateBalance: (val: number) => void;
    onUpdateContribution: (val: number) => void;
    onUpdateGrowth: (val: number) => void;
    currentSalary?: number; // Needed for % calculation
    type: 'pension' | 'isa' | 'standard';
    colorClass?: string;
}

export const AssetInput: React.FC<AssetInputProps> = ({
    label,
    subLabel,
    balance,
    contribution,
    growth,
    onUpdateBalance,
    onUpdateContribution,
    onUpdateGrowth,
    currentSalary = 0,
    type,
    colorClass = 'blue'
}) => {
    // UI State for toggles
    const [contribMode, setContribMode] = useState<'amount' | 'percent' | 'annual' | 'monthly'>('amount');

    // Initialize mode based on type
    React.useEffect(() => {
        if (type === 'isa') setContribMode('monthly');
        else if (type === 'pension') setContribMode('percent'); // Default to % for pension
        else setContribMode('amount');
    }, [type]);

    // Dynamic max for slider
    // Dynamic max for slider - Ensures slider always has room to move right if value increases
    const sliderMax = Math.max(balance * 2, 250000);

    // Helper to get display value for input
    const getDisplayContribution = () => {
        if (type === 'pension' && contribMode === 'percent') {
            if (currentSalary <= 0) return 0;
            return parseFloat((((contribution * 12) / currentSalary) * 100).toFixed(1));
        }
        if (type === 'isa' && contribMode === 'annual') {
            return contribution * 12;
        }
        return contribution;
    };

    const handleContribChange = (val: number) => {
        if (type === 'pension' && contribMode === 'percent') {
            const annualAmount = (val / 100) * currentSalary;
            onUpdateContribution(annualAmount / 12);
        } else if (type === 'isa' && contribMode === 'annual') {
            onUpdateContribution(val / 12);
        } else {
            onUpdateContribution(val);
        }
    };

    const getFooterLabel = () => {
        if (type === 'pension') return '(Annual Contribution)';
        return 'Contribution';
    };

    return (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-3">
            {/* Header Row: Label | Balance Input | Yield Input */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4 mt-1">
                    <span className={`font-bold text-sm text-slate-800 block`}>{label}</span>
                    {subLabel && <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{subLabel}</p>}
                </div>

                <div className="flex items-center gap-3">
                    {/* Balance Input (Moved to Header) */}
                    <div className="relative">
                        <SimpleFormattedInput
                            value={balance}
                            onChange={onUpdateBalance}
                            prefix="£"
                            className="w-28 py-1 px-2 text-right font-bold text-slate-800 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-100 outline-none transition-shadow"
                        />
                    </div>

                    {/* Yield Input */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 h-8">
                        <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">Yield</span>
                        <div className="relative w-10">
                            <input
                                type="number"
                                step={0.1}
                                value={growth}
                                onChange={e => onUpdateGrowth(Number(e.target.value))}
                                className="w-full text-right text-xs font-bold bg-transparent outline-none"
                            />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">%</span>
                    </div>
                </div>
            </div>

            {/* Slider Row (Full Width) */}
            <div className="mb-2 w-full px-1">
                <input
                    type="range"
                    min={0}
                    max={sliderMax}
                    step={Math.max(100, sliderMax / 1000)}
                    value={balance}
                    onChange={e => onUpdateBalance(Number(e.target.value))}
                    className={`w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-${colorClass}-600`}
                />
            </div>

            {/* Footer: Contribution Section */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{getFooterLabel()}</span>
                    {/* Toggles */}
                    {type === 'pension' && (
                        <div className="flex bg-slate-100 rounded p-[1px]">
                            <button onClick={() => setContribMode('amount')} className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition ${contribMode === 'amount' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>£</button>
                            <button onClick={() => setContribMode('percent')} className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition ${contribMode === 'percent' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>%</button>
                        </div>
                    )}
                    {type === 'isa' && (
                        <div className="flex bg-slate-100 rounded p-[1px]">
                            <button onClick={() => setContribMode('monthly')} className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition ${contribMode === 'monthly' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>M</button>
                            <button onClick={() => setContribMode('annual')} className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition ${contribMode === 'annual' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Y</button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-28">
                        <SimpleFormattedInput
                            value={getDisplayContribution()}
                            onChange={handleContribChange}
                            prefix={(type !== 'pension' || contribMode === 'amount') ? '£' : undefined}
                            className="w-full pl-4 pr-7 py-1 text-right text-xs font-bold border border-slate-300 rounded focus:border-blue-500 outline-none bg-white"
                        />
                        {/* Percent Suffix */}
                        {(type === 'pension' && contribMode === 'percent') && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <span className="text-xs text-slate-400">%</span>
                            </div>
                        )}
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium w-12 text-right">
                        {type === 'pension'
                            ? (contribMode === 'percent' ? 'of Salary' : '/ mo')
                            : (type === 'isa' ? (contribMode === 'annual' ? '/ yr' : '/ mo') : '/ mo')
                        }
                    </span>
                </div>
            </div>
        </div>
    );
};
