

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Line,
    LineChart,
    ComposedChart,
    AreaChart,
    Area,
    ReferenceLine
} from 'recharts';
import { YearlyResult, FinancialEvent } from '../types';
import { ArrowUp, ArrowDown } from 'lucide-react';

export interface AssetVisibility {
    pension: boolean;
    isa: boolean;
    gia: boolean;
    cash: boolean;
    total: boolean;
}

interface ResultsChartProps {
    data: YearlyResult[];
    mode: 'cashflow' | 'assets';
    assetVisibility: AssetVisibility;
    pensionAccessAge: number;
    retirementAge: number;
    mortgageEndAge: number;
    events: FinancialEvent[];
    stacked?: boolean;
    onToggleVisibility?: (key: keyof AssetVisibility) => void;
    onToggleStacked?: () => void;
}

const COLORS = {
    salary: '#3b82f6', // blue-500
    dividend: '#a855f7', // purple-500 (New)
    statePension: '#f59e0b', // amber-500
    dbPension: '#d97706', // amber-600
    rentalIncome: '#059669', // emerald-600
    otherIncome: '#0ea5e9', // sky-500

    drawdownPension: '#eab308', // yellow-500
    drawdownISA: '#6366f1', // indigo-500
    drawdownGIA: '#10b981', // emerald-500
    drawdownCash: '#a3e635', // lime-400

    savedPension: '#fcd34d', // amber-300
    savedISA: '#818cf8', // indigo-400
    savedGIA: '#34d399', // emerald-400
    savedCash: '#bef264', // lime-300

    shortfall: '#ef4444', // red-500
    expenseLine: '#1e293b' // slate-800
};


const formatCurrency = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(2)}m`;
    if (value >= 10000) return `£${(value / 1000).toFixed(0)}k`; // 10k+ -> 10k
    if (value >= 1000) return `£${(value / 1000).toFixed(1)}k`; // 1k-10k -> 9.5k
    return `£${value.toFixed(0)}`;
};

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: number;
    events: FinancialEvent[];
    retirementAge: number;
    mortgageEndAge: number;
    mode: 'cashflow' | 'assets' | 'freedom';
    fullData: YearlyResult[];
}

const TooltipRow = ({ label, value, color, isNegative = false, bold = false }: { label: string, value: number, color?: string, isNegative?: boolean, bold?: boolean }) => (
    <div className={`flex justify-between text-xs items-center ${bold ? 'font-bold' : ''}`}>
        <div className="flex items-center gap-2">
            {color && <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>}
            <span className="text-slate-600">{label}</span>
        </div>
        <span className={`font-mono ${isNegative ? 'text-red-600' : 'text-slate-700'}`}>
            {isNegative ? '-' : ''}{formatCurrency(value)}
        </span>
    </div>
);

const AssetTooltipRow = ({ label, value, prevValue, color }: { label: string, value: number, prevValue: number | undefined, color: string }) => {
    let change = 0;
    const hasPrev = prevValue !== undefined;

    if (hasPrev) {
        if (prevValue === 0) {
            change = value > 0 ? 100 : 0;
        } else {
            change = ((value - prevValue!) / prevValue!) * 100;
        }
    }

    const isPositive = change >= 0;
    const isZero = Math.abs(change) < 0.1;

    return (
        <div className="flex justify-between items-center mb-1.5 last:mb-0">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }}></div>
                <span className="text-slate-600 font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-3">
                {hasPrev && !isZero && Math.round(value) > 0 && (
                    <div className={`flex items-center text-[10px] font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                        {Math.abs(change).toFixed(1)}%
                    </div>
                )}
                <span className="font-mono text-slate-700 font-semibold text-xs">{formatCurrency(value)}</span>
            </div>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label, events, retirementAge, mortgageEndAge, mode, fullData }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        const currentAge = label || 0;
        const data = payload[0].payload as YearlyResult; // Access full data object

        // Find active events for this year
        const currentEvents = events.filter(e => {
            if (e.isRecurring) {
                const end = e.endAge || e.age;
                return currentAge >= e.age && currentAge <= end;
            }
            return e.age === currentAge;
        });

        const isRetirementYear = currentAge === retirementAge;
        const isMortgageEndYear = mortgageEndAge > 0 && currentAge === mortgageEndAge;
        const hasAnnotations = currentEvents.length > 0 || isRetirementYear || isMortgageEndYear;

        // -- ASSET MODE TOOLTIP --
        if (mode === 'assets') {
            const currentIndex = fullData.findIndex(d => d.age === currentAge);
            const prevData = currentIndex > 0 ? fullData[currentIndex - 1] : undefined;

            return (
                <div className="bg-white/95 backdrop-blur-md p-4 border border-slate-200 shadow-xl rounded-sm text-sm z-50 min-w-[280px]">
                    <div className="border-b border-slate-100 pb-2 mb-3 flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-lg">Age {currentAge}</span>
                        <span className="text-slate-400 text-xs font-mono">{data.year}</span>
                    </div>

                    {/* Total Wealth */}
                    <div className="bg-slate-50 p-2 rounded-sm border border-slate-100 mb-3">
                        <AssetTooltipRow
                            label="Total Wealth"
                            value={data.totalNetWorth}
                            prevValue={prevData?.totalNetWorth}
                            color="#1e293b"
                        />
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Asset Breakdown</p>

                        {data.propertyValue > 0 && (
                            <AssetTooltipRow
                                label="Property (Inv)"
                                value={data.propertyValue}
                                prevValue={prevData?.propertyValue}
                                color="#3b82f6"
                            />
                        )}
                        {data.balancePension > 0 && (
                            <AssetTooltipRow
                                label="Pension"
                                value={data.balancePension}
                                prevValue={prevData?.balancePension}
                                color={COLORS.drawdownPension}
                            />
                        )}
                        {data.balanceISA > 0 && (
                            <AssetTooltipRow
                                label="ISA"
                                value={data.balanceISA}
                                prevValue={prevData?.balanceISA}
                                color={COLORS.drawdownISA}
                            />
                        )}
                        {data.balanceGIA > 0 && (
                            <AssetTooltipRow
                                label="Trading (GIA)"
                                value={data.balanceGIA}
                                prevValue={prevData?.balanceGIA}
                                color={COLORS.drawdownGIA}
                            />
                        )}
                        {data.balanceCash > 0 && (
                            <AssetTooltipRow
                                label="Cash"
                                value={data.balanceCash}
                                prevValue={prevData?.balanceCash}
                                color={COLORS.drawdownCash}
                            />
                        )}
                    </div>
                </div>
            );
        }

        // -- FREEDOM MODE TOOLTIP --
        if (mode === 'freedom') {
            const gains = data.totalInvestmentGrowth || 0;
            const expense = data.totalExpense;
            const isFreedom = gains > expense;

            return (
                <div className="bg-white/95 backdrop-blur-md p-4 border border-slate-200 shadow-xl rounded-sm text-sm z-50 min-w-[280px]">
                    <div className="border-b border-slate-100 pb-2 mb-3 flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-lg">Age {currentAge}</span>
                        <span className="text-slate-400 text-xs font-mono">{data.year}</span>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Passive Income</p>
                            <TooltipRow label="Investment Gains" value={gains} color="#10b981" bold />
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Lifestyle Cost</p>
                            <TooltipRow label="Total Expenses" value={expense} color={COLORS.expenseLine} />
                        </div>

                        <div className={`p-3 rounded-lg border mt-2 ${isFreedom ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex justify-between items-center mb-1">
                                <p className={`text-[10px] font-bold uppercase ${isFreedom ? 'text-emerald-600' : 'text-slate-500'}`}>
                                    {isFreedom ? 'Financial Freedom Achieved' : 'Gap to Freedom'}
                                </p>
                            </div>
                            <div className={`text-xl font-bold font-mono py-1 ${isFreedom ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {isFreedom ? 'Surplus ' : 'Gap '}{formatCurrency(Math.abs(gains - expense))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // -- CASHFLOW MODE TOOLTIP --
        const totalDrawdown = data.withdrawalPension + data.withdrawalISA + data.withdrawalGIA + data.withdrawalCash;
        const totalIncome = data.salaryIncome + data.dividendIncome + data.statePensionIncome + data.dbPensionIncome + data.rentalIncome + data.otherIncome + totalDrawdown;

        return (
            <div className="bg-white/95 backdrop-blur-md p-4 border border-slate-200 shadow-xl rounded-sm text-sm z-50 min-w-[280px]">
                <div className="border-b border-slate-100 pb-2 mb-3 flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-lg">Age {currentAge}</span>
                    <span className="text-slate-400 text-xs font-mono">{data.year}</span>
                </div>

                {/* Annotations Section */}
                {hasAnnotations && (
                    <div className="mb-4 space-y-1.5 bg-slate-50 p-2 rounded-sm border border-slate-100">
                        {isRetirementYear && (
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-100/50 px-2 py-1 rounded">
                                <span>🎉 Retirement</span>
                            </div>
                        )}
                        {isMortgageEndYear && (
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-100/50 px-2 py-1 rounded">
                                <span>🏠 Mortgage Free</span>
                            </div>
                        )}
                        {currentEvents.map(e => (
                            <div key={e.id} className="flex items-center justify-between text-xs">
                                <span className="font-medium text-slate-700">{e.name}</span>
                                <span className={`font-mono ${e.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {e.type === 'income' ? '+' : '-'}£{e.amount.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- Cashflow Statement View --- */}
                <div className="space-y-4">

                    {/* Cash In */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Cash In</p>
                        <div className="space-y-1">
                            {data.salaryIncome > 0 && <TooltipRow label="Salary (Net)" value={data.salaryIncome} color={COLORS.salary} />}
                            {data.dividendIncome > 0 && <TooltipRow label="Dividends (Net)" value={data.dividendIncome} color={COLORS.dividend} />}
                            {data.statePensionIncome > 0 && <TooltipRow label="State Pension" value={data.statePensionIncome} color={COLORS.statePension} />}
                            {data.dbPensionIncome > 0 && <TooltipRow label="Final Salary Pension" value={data.dbPensionIncome} color={COLORS.dbPension} />}
                            {data.rentalIncome > 0 && <TooltipRow label="Rental Income" value={data.rentalIncome} color={COLORS.rentalIncome} />}
                            {data.otherIncome > 0 && <TooltipRow label="Other Income" value={data.otherIncome} color={COLORS.otherIncome} />}

                            {/* Drawdowns */}
                            {data.withdrawalPension > 0 && <TooltipRow label="From Pension" value={data.withdrawalPension} color={COLORS.drawdownPension} />}
                            {data.withdrawalISA > 0 && <TooltipRow label="From ISA" value={data.withdrawalISA} color={COLORS.drawdownISA} />}
                            {data.withdrawalGIA > 0 && <TooltipRow label="From GIA" value={data.withdrawalGIA} color={COLORS.drawdownGIA} />}
                            {data.withdrawalCash > 0 && <TooltipRow label="From Cash" value={data.withdrawalCash} color={COLORS.drawdownCash} />}
                        </div>
                        <div className="border-t border-slate-100 mt-1 pt-1">
                            <TooltipRow label="Total Cash In" value={totalIncome} bold />
                        </div>
                    </div>

                    {/* Cash Out */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Cash Out</p>
                        <div className="space-y-1">
                            <TooltipRow label="Regular Outgoings" value={data.generalSpending} isNegative />
                            {data.housingExpense > 0 && <TooltipRow label="Housing" value={data.housingExpense} isNegative />}
                            {data.debtRepayments > 0 && <TooltipRow label="Debt Repayment" value={data.debtRepayments} isNegative />}
                            {data.oneOffExpense > 0 && <TooltipRow label="Events/One-offs" value={data.oneOffExpense} isNegative />}
                        </div>
                        <div className="border-t border-slate-100 mt-1 pt-1 flex justify-between text-xs font-bold items-center">
                            <div className="flex items-center gap-2">
                                {/* Dashed line indicator to match chart */}
                                <div className="w-6 h-0 border-t-2 border-dashed border-slate-800"></div>
                                <span className="text-slate-700">Total Expenses</span>
                            </div>
                            <span className="text-slate-800">-{formatCurrency(data.totalExpense)}</span>
                        </div>
                    </div>

                    {/* Net Result - Prominent Display */}
                    {(data.totalSavedToISA > 0 || data.totalSavedToPension > 0 || data.totalSavedToGIA > 0 || data.totalSavedToCash > 0 || data.shortfall > 0) && (
                        <div className={`p-3 rounded-lg border mt-2 ${data.shortfall > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                            <div className="flex justify-between items-center mb-1">
                                <p className={`text-[10px] font-bold uppercase ${data.shortfall > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                    {data.shortfall > 0 ? 'Shortfall' : 'Net Position (Saved)'}
                                </p>
                            </div>

                            <div className={`text-2xl font-bold font-mono py-1 ${data.shortfall > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {data.shortfall > 0 ? '-' : '+'}{formatCurrency(data.shortfall > 0 ? data.shortfall : (totalIncome - data.totalExpense))}
                            </div>

                            <div className="space-y-1 mt-2 pt-2 border-t border-black/5">
                                {data.totalSavedToPension > 0 && <TooltipRow label="Pension" value={data.totalSavedToPension} color={COLORS.savedPension} />}

                                {(data.totalSavedToISA > 0 || (data.totalTransferToISA && data.totalTransferToISA > 0)) && (
                                    <>
                                        {data.totalSavedToISA > 0 && <TooltipRow label="ISA" value={data.totalSavedToISA} color={COLORS.savedISA} />}
                                        {data.totalTransferToISA && data.totalTransferToISA > 0 && (
                                            <TooltipRow label="ISA (Transfer)" value={data.totalTransferToISA} color={COLORS.savedISA} />
                                        )}
                                    </>
                                )}

                                {data.totalSavedToGIA > 0 && <TooltipRow label="GIA" value={data.totalSavedToGIA} color={COLORS.savedGIA} />}
                                {data.totalSavedToCash > 0 && <TooltipRow label="Cash" value={data.totalSavedToCash} color={COLORS.savedCash} />}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

// --- Custom Legend Component ---
const LegendItem = ({ color, label, dashed }: { color: string, label: string, dashed?: boolean }) => (
    <div className="flex items-center gap-1.5 min-w-[70px]">
        {dashed ? (
            <div className="w-5 h-0 border-t-2 border-dashed" style={{ borderColor: color }}></div>
        ) : (
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }}></div>
        )}
        <span className="text-[10px] sm:text-xs text-slate-600 font-medium whitespace-nowrap">{label}</span>
    </div>
);

const CustomCashflowLegend = () => {
    return (
        <div className="mt-4 px-2">
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">

                {/* Row 1: Saved To */}
                <div className="flex items-center justify-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Saved To:</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                    <LegendItem color={COLORS.savedPension} label="Pension" />
                    <LegendItem color={COLORS.savedISA} label="ISA" />
                    <div className="flex items-center gap-1.5 min-w-[70px]">
                        <div className="w-3 h-3 rounded-sm" style={{ background: `repeating-linear-gradient(45deg, ${COLORS.savedISA}, ${COLORS.savedISA} 2px, #fff 2px, #fff 4px)` }}></div>
                        <span className="text-[10px] sm:text-xs text-slate-600 font-medium whitespace-nowrap">Bed & ISA</span>
                    </div>
                    <LegendItem color={COLORS.savedGIA} label="Trading" />
                    <LegendItem color={COLORS.savedCash} label="Cash" />
                </div>

                {/* Row 2: Spent From */}
                <div className="flex items-center justify-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Spent From:</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                    {/* Aligned columns roughly with above */}
                    <LegendItem color={COLORS.drawdownPension} label="Pension Pot" />
                    <LegendItem color={COLORS.drawdownISA} label="ISA" />
                    <LegendItem color={COLORS.drawdownGIA} label="Trading" />
                    <LegendItem color={COLORS.drawdownCash} label="Cash" />

                    {/* Divider for Income Sources */}
                    <div className="hidden sm:block w-px h-3 bg-slate-300 mx-1"></div>
                    <LegendItem color={COLORS.salary} label="Salary" />
                    <LegendItem color={COLORS.dividend} label="Dividends" />
                    <LegendItem color={COLORS.statePension} label="State / DB Pension" />
                    <LegendItem color={COLORS.rentalIncome} label="Rental Income" />
                </div>

                {/* Row 3: Markers */}
                <div className="col-start-2 flex flex-wrap items-center gap-3 sm:gap-6 pt-1">
                    <LegendItem color={COLORS.expenseLine} label="Total Expenses" dashed />
                    <LegendItem color={COLORS.shortfall} label="Shortfall" />
                </div>
            </div>
        </div>
    );
};

// --- Custom Asset Legend Component ---
const CustomAssetLegend = ({
    assetVisibility,
    onToggleVisibility,
    stacked,
    onToggleStacked
}: {
    assetVisibility: AssetVisibility,
    onToggleVisibility?: (key: keyof AssetVisibility) => void,
    stacked: boolean,
    onToggleStacked?: () => void
}) => {
    return (
        <div className="mt-4 px-2 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-slate-100 pt-3">

            {/* Legend Items (Left) */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                {!stacked && <LegendItem color="#1e293b" label="Total Wealth" dashed />}
                <LegendItem color="#eab308" label="Pension" />
                <LegendItem color="#6366f1" label="ISA" />
                <LegendItem color="#10b981" label="Trading" />
                <LegendItem color="#a3e635" label="Cash" />
            </div>

            {/* Link Controls (Right) */}
            {onToggleVisibility && onToggleStacked && (
                <div className="flex items-center gap-3 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-sm whitespace-nowrap overflow-x-auto">
                    <button
                        onClick={onToggleStacked}
                        className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 transition shadow-sm mr-2"
                    >
                        {/* Icons not imported here, reusing text or adding imports if needed, but for now simple text/svg or pass icons? 
                            I will just use text or simple shapes to avoid import mess if icons aren't available in this scope. 
                            Actually lucide-react icons are imported at top.
                        */}
                        <div className={`w-3 h-3 border-2 border-current rounded-sm ${stacked ? 'border-b-4' : ''}`}></div>
                        {stacked ? 'Stacked' : 'Lines'}
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mr-1">Show:</span>

                    {!stacked && (
                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] sm:text-xs font-medium text-slate-700 select-none">
                            <input type="checkbox" checked={assetVisibility.total} onChange={() => onToggleVisibility('total')} className="rounded text-slate-800 focus:ring-slate-800" />
                            <span>Total</span>
                        </label>
                    )}

                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] sm:text-xs font-medium text-yellow-600 select-none">
                        <input type="checkbox" checked={assetVisibility.pension} onChange={() => onToggleVisibility('pension')} className="rounded text-yellow-600 focus:ring-yellow-600" />
                        <span>Pension</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] sm:text-xs font-medium text-indigo-600 select-none">
                        <input type="checkbox" checked={assetVisibility.isa} onChange={() => onToggleVisibility('isa')} className="rounded text-indigo-600 focus:ring-indigo-600" />
                        <span>ISA</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] sm:text-xs font-medium text-emerald-600 select-none">
                        <input type="checkbox" checked={assetVisibility.gia} onChange={() => onToggleVisibility('gia')} className="rounded text-emerald-600 focus:ring-emerald-600" />
                        <span>GIA</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] sm:text-xs font-medium text-lime-600 select-none">
                        <input type="checkbox" checked={assetVisibility.cash} onChange={() => onToggleVisibility('cash')} className="rounded text-lime-600 focus:ring-lime-600" />
                        <span>Cash</span>
                    </label>
                </div>
            )}
        </div>
    );
};

export const ResultsChart: React.FC<ResultsChartProps> = ({
    data,
    mode,
    assetVisibility,
    pensionAccessAge,
    retirementAge,
    mortgageEndAge,
    events,
    stacked = true,
    onToggleVisibility,
    onToggleStacked
}) => {

    const renderReferenceLines = () => (
        <>
            <ReferenceLine x={pensionAccessAge} stroke="#94a3b8" strokeDasharray="3 3" />
            <ReferenceLine x={retirementAge} stroke="#10b981" strokeDasharray="5 5" strokeWidth={1.5} />
            {mortgageEndAge > 0 && mortgageEndAge < 90 && (
                <ReferenceLine x={mortgageEndAge} stroke="#ef4444" strokeDasharray="4 2" />
            )}
            {events.map((e) => (
                <ReferenceLine key={e.id} x={e.age} stroke="#cbd5e1" strokeDasharray="2 2" />
            ))}
        </>
    );

    const tooltipProps = { events, retirementAge, mortgageEndAge, mode, fullData: data };

    if (mode === 'freedom') {
        return (
            <div className="flex flex-col h-full min-h-[400px]">
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="age" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                            <YAxis tickFormatter={formatCurrency} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip {...tooltipProps} />} wrapperStyle={{ zIndex: 1000 }} />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />

                            {renderReferenceLines()}

                            {/* Investment Gains Area/Line */}
                            <defs>
                                <linearGradient id="colorGains" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <Line
                                type="monotone"
                                dataKey="totalInvestmentGrowth"
                                name="Investment Gains (Passive Income)"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={false}
                            />

                            <Line
                                type="step"
                                dataKey="totalExpense"
                                name="Total Expenses"
                                stroke={COLORS.expenseLine}
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Disclaimer Banner */}
                <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="text-xs text-blue-800 space-y-1">
                        <p className="font-bold flex items-center gap-2">
                            <span className="bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-extrabold">NOTE</span>
                            Tax Implications
                        </p>
                        <p>
                            This model shows gross investment growth. It does <strong>not</strong> account for taxes due on disposal (CGT)
                            or withdrawal (Income Tax). Realized gains may be significantly lower.
                        </p>
                    </div>
                    <button className="whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition">
                        Speak to an Advisor
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'assets') {
        const legendProps = { assetVisibility, onToggleVisibility, stacked, onToggleStacked };

        if (stacked) {
            return (
                <div className="w-full h-full min-h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorPension" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#eab308" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="colorISA" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="colorGIA" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a3e635" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#a3e635" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="age" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                            <YAxis tickFormatter={formatCurrency} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip {...tooltipProps} />} wrapperStyle={{ zIndex: 1000 }} />
                            <Legend content={<CustomAssetLegend {...legendProps} />} />

                            {renderReferenceLines()}

                            {assetVisibility.cash && <Area type="monotone" dataKey="balanceCash" name="Cash" stackId="1" stroke="#a3e635" fill="url(#colorCash)" />}
                            {assetVisibility.isa && <Area type="monotone" dataKey="balanceISA" name="ISA" stackId="1" stroke="#6366f1" fill="url(#colorISA)" />}
                            {assetVisibility.gia && <Area type="monotone" dataKey="balanceGIA" name="Trading" stackId="1" stroke="#10b981" fill="url(#colorGIA)" />}
                            {assetVisibility.pension && <Area type="monotone" dataKey="balancePension" name="Pension" stackId="1" stroke="#eab308" fill="url(#colorPension)" />}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            );
        } else {
            return (
                <div className="w-full h-full min-h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="age" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                            <YAxis tickFormatter={formatCurrency} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip {...tooltipProps} />} wrapperStyle={{ zIndex: 1000 }} />
                            <Legend content={<CustomAssetLegend {...legendProps} />} />

                            {renderReferenceLines()}

                            {assetVisibility.total && <Line type="monotone" dataKey="totalNetWorth" name="Total Wealth" stroke="#1e293b" strokeWidth={2} strokeDasharray="5 5" dot={false} />}
                            {assetVisibility.pension && <Line type="monotone" dataKey="balancePension" name="Pension" stroke={COLORS.drawdownPension} strokeWidth={2} dot={false} />}
                            {assetVisibility.isa && <Line type="monotone" dataKey="balanceISA" name="ISA" stroke={COLORS.drawdownISA} strokeWidth={2} dot={false} />}
                            {assetVisibility.gia && <Line type="monotone" dataKey="balanceGIA" name="Trading" stroke={COLORS.drawdownGIA} strokeWidth={2} dot={false} />}
                            {assetVisibility.cash && <Line type="monotone" dataKey="balanceCash" name="Cash" stroke={COLORS.drawdownCash} strokeWidth={2} dot={false} />}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            );
        }
    }

    // Cashflow Mode
    return (
        <div className="w-full h-full min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        <pattern id="diagonalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                            <rect width="4" height="8" transform="translate(0,0)" fill={COLORS.savedISA} opacity="0.4" />
                            <rect width="4" height="8" transform="translate(4,0)" fill={COLORS.savedISA} opacity="0.9" />
                        </pattern>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="age" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis tickFormatter={formatCurrency} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip {...tooltipProps} />} wrapperStyle={{ zIndex: 1000 }} />
                    <Legend content={<CustomCashflowLegend />} />

                    {renderReferenceLines()}

                    {/* 
             STACK GROUP A: SPENDING SOURCES (Below Line) 
             These bars represent money that was SPENT.
             They should stack up to reach the Total Expense line.
          */}
                    <Bar dataKey="spentSalary" name="Salary (Spent)" stackId="a" fill={COLORS.salary} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="dividendIncome" name="Dividends (Spent)" stackId="a" fill={COLORS.dividend} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="spentOther" name="Other Inc (Spent)" stackId="a" fill={COLORS.otherIncome} />
                    <Bar dataKey="spentStatePension" name="State Pension (Spent)" stackId="a" fill={COLORS.statePension} />

                    <Bar dataKey="dbPensionIncome" name="Final Salary Pension" stackId="a" fill={COLORS.dbPension} />
                    <Bar dataKey="rentalIncome" name="Rental Income" stackId="a" fill={COLORS.rentalIncome} />

                    <Bar dataKey="withdrawalPension" name="Pension Drawdown" stackId="a" fill={COLORS.drawdownPension} />
                    <Bar dataKey="withdrawalISA" name="ISA Drawdown" stackId="a" fill={COLORS.drawdownISA} />
                    <Bar dataKey="withdrawalGIA" name="Inv. Drawdown" stackId="a" fill={COLORS.drawdownGIA} />
                    <Bar dataKey="withdrawalCash" name="Cash Drawdown" stackId="a" fill={COLORS.drawdownCash} />

                    <Bar dataKey="shortfall" name="Shortfall" stackId="a" fill={COLORS.shortfall} radius={[4, 4, 0, 0]} />

                    {/* 
             STACK GROUP A (Cont): SAVINGS DESTINATIONS (Above Line)
             These bars represent surplus money that was SAVED.
             They sit on top of the 'Spent' bars.
          */}
                    <Bar dataKey="totalSavedToPension" name="Saved to Pension" stackId="a" fill={COLORS.savedPension} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="totalSavedToISA" name="Saved to ISA" stackId="a" fill={COLORS.savedISA} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="totalTransferToISA" name="ISA Transfer" stackId="a" fill="url(#diagonalHatch)" stroke={COLORS.savedISA} strokeWidth={1} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="totalSavedToGIA" name="Saved to GIA" stackId="a" fill={COLORS.savedGIA} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="totalSavedToCash" name="Saved to Cash" stackId="a" fill={COLORS.savedCash} radius={[2, 2, 0, 0]} />

                    {/* The Expense Line */}
                    <Line
                        type="step"
                        dataKey="totalExpense"
                        name="Total Expenses"
                        stroke={COLORS.expenseLine}
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                    />

                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};