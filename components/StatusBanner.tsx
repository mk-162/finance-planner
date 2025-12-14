import React, { useMemo } from 'react';
import { YearlyResult } from '../types';
import { AlertTriangle, UserCheck, TrendingDown, ArrowRight } from 'lucide-react';

interface StatusBannerProps {
    results: YearlyResult[];
    onReview: () => void;
    annualSpending: number;
    retirementAge?: number;
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
    retirementAge,
    currencyFormatter = formatLargeMoney
}) => {

    const analysis = useMemo(() => {
        if (!results || results.length === 0) return null;

        const finalResult = results[results.length - 1];
        const legacyAmount = finalResult.totalNetWorth;

        const shortfallYears = results
            .filter(r => r.shortfall > 100)
            .map(r => r.age);

        const isTightMargin = shortfallYears.length === 0 && legacyAmount > 0 && legacyAmount < (annualSpending * 3);
        const isCritical = shortfallYears.length > 0;

        return {
            legacyAmount,
            shortfallYears,
            isTightMargin,
            isCritical,
            isHealthy: !isCritical && !isTightMargin,
        };
    }, [results, annualSpending]);

    if (!analysis) return null;

    // Determine colors based on status
    let legacyColorClass = "text-emerald-400";
    let labelColorClass = "text-slate-400";
    const isWealthyButCrunch = analysis.isCritical && analysis.legacyAmount > 0;

    if (analysis.isCritical && !isWealthyButCrunch) {
        legacyColorClass = "text-red-400";
    } else if (analysis.isTightMargin) {
        legacyColorClass = "text-amber-400";
    }

    return (
        <div className="flex items-center gap-6">
            {/* Legacy - Big and prominent */}
            <div className="flex flex-col">
                <span className={`text-xs font-medium uppercase tracking-wide ${labelColorClass}`}>Legacy</span>
                <span className={`text-3xl md:text-4xl font-bold tracking-tight ${legacyColorClass}`}>
                    {currencyFormatter(analysis.legacyAmount)}
                </span>
            </div>

            {/* Shortfall warning if critical */}
            {analysis.isCritical && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-lg border border-red-500/30">
                    <AlertTriangle size={16} className="text-red-400" />
                    <span className="text-xs font-medium text-red-300">
                        Shortfall: {analysis.shortfallYears.length > 5
                            ? `${analysis.shortfallYears[0]}-${analysis.shortfallYears[analysis.shortfallYears.length - 1]}`
                            : analysis.shortfallYears.join(', ')}
                    </span>
                </div>
            )}

            {/* Review button */}
            <button
                onClick={onReview}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium text-sm transition-all"
            >
                <UserCheck size={16} />
                Review
            </button>
        </div>
    );
};
