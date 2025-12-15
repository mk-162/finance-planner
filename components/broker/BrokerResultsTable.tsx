import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ExternalLink, Info, Trophy, AlertTriangle } from 'lucide-react';
import { PlatformResult, formatCurrency, formatPercent } from '../../services/brokerFeeCalculator';

interface BrokerResultsTableProps {
    results: PlatformResult[];
    onSelectPlatform?: (result: PlatformResult) => void;
}

type SortField = 'name' | 'year1Fee' | 'totalFeesPaid' | 'opportunityCost' | 'totalFeeDrag' | 'finalValue';
type SortDirection = 'asc' | 'desc';

export const BrokerResultsTable: React.FC<BrokerResultsTableProps> = ({
    results,
    onSelectPlatform,
}) => {
    const [sortField, setSortField] = useState<SortField>('totalFeeDrag');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedResults = [...results].sort((a, b) => {
        let aVal: number | string;
        let bVal: number | string;

        switch (sortField) {
            case 'name':
                aVal = a.platform.name;
                bVal = b.platform.name;
                break;
            case 'year1Fee':
                aVal = a.summary.year1Fee;
                bVal = b.summary.year1Fee;
                break;
            case 'totalFeesPaid':
                aVal = a.summary.totalFeesPaid;
                bVal = b.summary.totalFeesPaid;
                break;
            case 'opportunityCost':
                aVal = a.summary.opportunityCost;
                bVal = b.summary.opportunityCost;
                break;
            case 'totalFeeDrag':
                aVal = a.summary.totalFeeDrag;
                bVal = b.summary.totalFeeDrag;
                break;
            case 'finalValue':
                aVal = a.summary.finalValue;
                bVal = b.summary.finalValue;
                break;
            default:
                aVal = a.summary.totalFeeDrag;
                bVal = b.summary.totalFeeDrag;
        }

        if (typeof aVal === 'string') {
            return sortDirection === 'asc'
                ? aVal.localeCompare(bVal as string)
                : (bVal as string).localeCompare(aVal);
        }
        return sortDirection === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal;
    });

    const cheapest = results[0];
    const mostExpensive = results[results.length - 1];

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    const HeaderButton = ({ field, children, className = '' }: { field: SortField; children: React.ReactNode; className?: string }) => (
        <button
            onClick={() => handleSort(field)}
            className={`flex items-center gap-1 hover:text-white transition ${className}`}
        >
            {children}
            <SortIcon field={field} />
        </button>
    );

    return (
        <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-900/50 border-b border-slate-700">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">
                                <HeaderButton field="name">Name</HeaderButton>
                            </th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">
                                Fees structure
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">
                                <HeaderButton field="totalFeesPaid" className="justify-end ml-auto">
                                    Cumulative Fees
                                </HeaderButton>
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">
                                <HeaderButton field="finalValue" className="justify-end ml-auto">
                                    Final Value
                                </HeaderButton>
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase bg-amber-900/20">
                                <HeaderButton field="totalFeeDrag" className="justify-end ml-auto text-amber-500">
                                    Impact of Fees
                                </HeaderButton>
                            </th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-400 uppercase">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedResults.map((result, index) => {
                            const isCheapest = result.platform.id === cheapest?.platform.id;
                            const isMostExpensive = result.platform.id === mostExpensive?.platform.id && results.length > 1;

                            // Helper to format fee string
                            let feeString = '';
                            if (result.platform.feeType === 'percentage') {
                                // Show first tier rate
                                feeString = (result.platform.feeTiers[0]?.rate * 100).toFixed(2) + '%';
                            } else if (result.platform.feeType === 'flat') {
                                feeString = formatCurrency(result.platform.annualFeeBase) + '/yr';
                            } else {
                                feeString = 'Free';
                            }

                            // Add trading fee if significant
                            if (result.platform.tradingFeeShares > 0) {
                                feeString += ` + ${formatCurrency(result.platform.tradingFeeShares)}/trade`;
                            }

                            return (
                                <tr
                                    key={result.platform.id}
                                    onClick={() => onSelectPlatform?.(result)}
                                    className={`border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer transition ${isCheapest ? 'bg-emerald-900/20' : isMostExpensive ? 'bg-red-900/10' : ''
                                        }`}
                                >
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            {isCheapest && (
                                                <Trophy size={16} className="text-amber-500" />
                                            )}
                                            {isMostExpensive && (
                                                <AlertTriangle size={16} className="text-red-500" />
                                            )}
                                            <div>
                                                <div className="font-medium text-white">
                                                    {result.platform.name}
                                                </div>
                                                {result.platform.restrictions && (
                                                    <div className="text-xs text-slate-400">
                                                        {result.platform.restrictions}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-400">
                                        {feeString}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-sm text-slate-300">
                                        {formatCurrency(result.summary.totalFeesPaid)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-sm text-white font-medium">
                                        {formatCurrency(result.summary.finalValue)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-sm font-semibold bg-amber-900/20">
                                        <div className="flex flex-col items-end">
                                            <span className={isCheapest ? 'text-emerald-400' : isMostExpensive ? 'text-red-400' : 'text-amber-500'}>
                                                {formatCurrency(result.summary.totalFeeDrag)}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-normal">inc. lost growth</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {result.platform.affiliateUrl ? (
                                            <a
                                                href={result.platform.affiliateUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm"
                                            >
                                                Sign Up <ExternalLink size={12} />
                                            </a>
                                        ) : (
                                            <span className="text-slate-600 text-xs">-</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-700 flex items-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                    <Trophy size={12} className="text-amber-500" />
                    <span>Lowest cost</span>
                </div>
                <div className="flex items-center gap-1">
                    <AlertTriangle size={12} className="text-red-500" />
                    <span>Highest cost</span>
                </div>
                <div className="flex items-center gap-1">
                    <Info size={12} className="text-slate-400" />
                    <span>Lost Growth = growth you miss because fees reduced your balance</span>
                </div>
            </div>
        </div>
    );
};
