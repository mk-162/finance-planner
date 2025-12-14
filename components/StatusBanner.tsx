import React, { useMemo } from 'react';
import { YearlyResult } from '../types';
import { AlertTriangle, ShieldCheck, UserCheck, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface StatusBannerProps {
    results: YearlyResult[];
    onReview: () => void;
    annualSpending: number; // Needed to calculate "Tight Margin" logic (3x spending)
    currencyFormatter?: (value: number) => string;
}

const formatLargeMoney = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(2)}m`;
    if (value >= 10000) return `£${(value / 1000).toFixed(0)}k`;
    if (value >= 1000) return `£${(value / 1000).toFixed(1)}k`;
    return `£${value.toFixed(0)}`;
};

export const StatusBanner: React.FC<StatusBannerProps> = ({
    results,
    onReview,
    annualSpending,
    currencyFormatter = formatLargeMoney
}) => {

    // 1. Analyze Results
    const analysis = useMemo(() => {
        if (!results || results.length === 0) return null;

        const finalResult = results[results.length - 1];
        const legacyAmount = finalResult.totalNetWorth;

        // Find all shortfall years (where shortfall > £100)
        // We filter for distinct consecutive ranges or just list them all if few
        // The prompt asked for "54, 55, 56".
        const shortfallYears = results
            .filter(r => r.shortfall > 100)
            .map(r => r.age);

        const firstShortfallAge = shortfallYears.length > 0 ? shortfallYears[0] : null;

        // "Tight Margin" check: No shortfall, but Legacy < 3x Annual Spending
        const isTightMargin = shortfallYears.length === 0 && legacyAmount > 0 && legacyAmount < (annualSpending * 3);
        const isCritical = shortfallYears.length > 0;

        return {
            legacyAmount,
            shortfallYears,
            firstShortfallAge,
            isTightMargin,
            isCritical,
            isHealthy: !isCritical && !isTightMargin
        };
    }, [results, annualSpending]);

    if (!analysis) return null;

    // 2. Determine Style Theme
    let containerClass = "bg-emerald-50 border-emerald-200";
    let iconClass = "bg-emerald-100 text-emerald-600";
    let textClass = "text-emerald-900";
    let subTextClass = "text-emerald-700";
    let buttonClass = "bg-emerald-600 hover:bg-emerald-700 text-white";
    let statusIcon = <ShieldCheck size={24} />;
    let headline = "Plan on Track";

    if (analysis.isCritical) {
        containerClass = "bg-red-50 border-red-200";
        iconClass = "bg-red-100 text-red-600";
        textClass = "text-red-900";
        subTextClass = "text-red-700";
        buttonClass = "bg-red-600 hover:bg-red-700 text-white shadow-red-200";
        statusIcon = <AlertTriangle size={24} />;
        headline = "Cashflow Crunch Detected";
    } else if (analysis.isTightMargin) {
        containerClass = "bg-amber-50 border-amber-200";
        iconClass = "bg-amber-100 text-amber-600";
        textClass = "text-amber-900";
        subTextClass = "text-amber-700";
        buttonClass = "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200";
        statusIcon = <AlertTriangle size={24} />;
        headline = "Tight Margin";
    }

    // 3. Render
    return (
        <div className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 rounded-2xl border ${containerClass} transition-all duration-300 shadow-sm`}>

            {/* Left: Status & Main Metrics */}
            <div className="flex items-center gap-4 flex-1">
                <div className={`p-3 rounded-xl flex-shrink-0 ${iconClass} shadow-sm`}>
                    {statusIcon}
                </div>

                <div className="flex flex-col justify-center">
                    <h3 className={`font-bold text-sm md:text-base flex items-center gap-2 ${textClass}`}>
                        {headline}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        {/* Logic for Shortfall Display */}
                        {analysis.isCritical ? (
                            <div className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-red-600 bg-white/60 px-2 py-0.5 rounded-md border border-red-100/50">
                                <TrendingDown size={14} />
                                <span>Shortfall: </span>
                                <span className="font-bold">
                                    {analysis.shortfallYears.length > 5
                                        ? `Ages ${analysis.shortfallYears[0]} - ${analysis.shortfallYears[analysis.shortfallYears.length - 1]}`
                                        : analysis.shortfallYears.join(', ')}
                                </span>
                            </div>
                        ) : null}

                        {/* Always show Legacy */}
                        <div className={`flex items-center gap-1.5 text-xs md:text-sm font-medium ${subTextClass} ${analysis.isCritical ? 'opacity-80' : ''}`}>
                            <TrendingUp size={14} />
                            <span>Legacy at 90: </span>
                            <span className="font-bold">{currencyFormatter(analysis.legacyAmount)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Action Button */}
            <button
                onClick={onReview}
                className={`group flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-95 ${buttonClass}`}
            >
                <UserCheck size={18} className="group-hover:scale-110 transition-transform" />
                <span>Review Plan</span>
                <ArrowRight size={16} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </button>
        </div>
    );
};
