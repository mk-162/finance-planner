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
            className={`flex items-center gap-1 hover:text-slate-900 transition ${className}`}
        >
            {children}
            <SortIcon field={field} />
        </button>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                                <HeaderButton field="name">Platform</HeaderButton>
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                                <HeaderButton field="year1Fee" className="justify-end ml-auto">
                                    Year 1 Fee
                                </HeaderButton>
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                                <HeaderButton field="totalFeesPaid" className="justify-end ml-auto">
                                    Total Fees
                                </HeaderButton>
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                                <HeaderButton field="opportunityCost" className="justify-end ml-auto">
                                    <span className="flex items-center gap-1">
                                        Lost Growth
                                        <Info size={12} className="text-slate-400" />
                                    </span>
                                </HeaderButton>
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase bg-amber-50">
                                <HeaderButton field="totalFeeDrag" className="justify-end ml-auto text-amber-700">
                                    Fee Drag
                                </HeaderButton>
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                                <HeaderButton field="finalValue" className="justify-end ml-auto">
                                    Final Value
                                </HeaderButton>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedResults.map((result, index) => {
                            const isCheapest = result.platform.id === cheapest?.platform.id;
                            const isMostExpensive = result.platform.id === mostExpensive?.platform.id && results.length > 1;

                            return (
                                <tr
                                    key={result.platform.id}
                                    onClick={() => onSelectPlatform?.(result)}
                                    className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition ${
                                        isCheapest ? 'bg-green-50' : isMostExpensive ? 'bg-red-50' : ''
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
                                                <div className="font-medium text-slate-800">
                                                    {result.platform.name}
                                                </div>
                                                {result.platform.restrictions && (
                                                    <div className="text-xs text-slate-500">
                                                        {result.platform.restrictions}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-sm text-slate-600">
                                        {formatCurrency(result.summary.year1Fee)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-sm text-slate-600">
                                        {formatCurrency(result.summary.totalFeesPaid)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-sm text-red-600">
                                        {formatCurrency(result.summary.opportunityCost)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-sm font-semibold bg-amber-50">
                                        <span className={isCheapest ? 'text-green-600' : isMostExpensive ? 'text-red-600' : 'text-amber-700'}>
                                            {formatCurrency(result.summary.totalFeeDrag)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-sm text-slate-800 font-medium">
                                        {formatCurrency(result.summary.finalValue)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center gap-6 text-xs text-slate-500">
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
