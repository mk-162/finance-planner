import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList
} from 'recharts';
import { PlatformResult, formatCurrency } from '../../services/brokerFeeCalculator';

interface BrokerFeeDragChartProps {
    results: PlatformResult[];
    showPlatforms?: string[]; // Platform IDs to show, defaults to top 5 + worst
    inputs?: any; // CalculatorInputs
    referenceLines?: {
        currentFee?: any; // PlatformResult (Current User Fees)
        industryAverage?: any; // PlatformResult
        highest?: any; // PlatformResult
        lowest?: any; // PlatformResult
    };
}

const COLORS = {
    baseline: '#10b981', // green - no fees
    current: '#f59e0b', // amber - user's current
    industry: '#94a3b8', // slate - average
    lowest: '#3b82f6', // blue - cheapest
    highest: '#ef4444', // red - most expensive
    other: '#8b5cf6', // purple - other
};

export const BrokerFeeDragChart: React.FC<BrokerFeeDragChartProps> = ({
    results,
    referenceLines
}) => {
    const chartData = useMemo(() => {
        if (results.length === 0) return [];

        const dataPoints = [];

        // 1. Cheapest (Lowest)
        if (referenceLines?.lowest) {
            const finalValue = referenceLines.lowest.summary.finalValue;
            dataPoints.push({
                name: 'Cheapest Platform',
                shortName: 'Cheapest',
                value: finalValue,
                color: COLORS.lowest,
                feeDrag: referenceLines.lowest.summary.totalFeeDrag
            });
        } else if (results.length > 0) {
            // Fallback if no reference line passed
            const best = results[0];
            dataPoints.push({
                name: 'Cheapest Platform',
                shortName: 'Cheapest',
                value: best.summary.finalValue,
                color: COLORS.lowest,
                feeDrag: best.summary.totalFeeDrag
            });
        }

        // 2. Current Fees (Target)
        if (referenceLines?.currentFee) {
            dataPoints.push({
                name: 'Current Fees',
                shortName: 'Current',
                value: referenceLines.currentFee.summary.finalValue,
                color: COLORS.current,
                feeDrag: referenceLines.currentFee.summary.totalFeeDrag
            });
        }

        // 3. Industry Average
        if (referenceLines?.industryAverage) {
            dataPoints.push({
                name: 'Industry Average',
                shortName: 'Ind. Avg',
                value: referenceLines.industryAverage.summary.finalValue,
                color: COLORS.industry,
                feeDrag: referenceLines.industryAverage.summary.totalFeeDrag
            });
        }

        // 4. Most Expensive
        if (referenceLines?.highest) {
            dataPoints.push({
                name: 'Most Expensive',
                shortName: 'Expensive',
                value: referenceLines.highest.summary.finalValue,
                color: COLORS.highest,
                feeDrag: referenceLines.highest.summary.totalFeeDrag
            });
        } else if (results.length > 0) {
            const worst = results[results.length - 1];
            dataPoints.push({
                name: 'Most Expensive',
                shortName: 'Expensive',
                value: worst.summary.finalValue,
                color: COLORS.highest,
                feeDrag: worst.summary.totalFeeDrag
            });
        }

        return dataPoints;
    }, [results, referenceLines]);

    if (results.length === 0) {
        return (
            <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6 h-80 flex items-center justify-center">
                <p className="text-slate-400">No data to display</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || !payload.length) return null;

        const data = payload[0].payload;

        return (
            <div className="bg-slate-900 p-3 rounded-lg shadow-lg border border-slate-700 z-50">
                <p className="font-bold text-white mb-1">{data.name}</p>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Final Value:</span>
                        <span className="font-mono text-emerald-400 font-bold">{formatCurrency(data.value)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Lost to Fees:</span>
                        <span className="font-mono text-amber-500">{formatCurrency(data.feeDrag)}</span>
                    </div>
                </div>
            </div>
        );
    };

    const formatYAxis = (value: number) => {
        if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
        return `£${value}`;
    };

    const renderCustomBarLabel = (props: any) => {
        const { x, y, width, value } = props;
        return (
            <text
                x={x + width / 2}
                y={y - 10}
                fill="#fff"
                textAnchor="middle"
                fontSize={12}
                fontWeight="bold"
            >
                {formatYAxis(value)}
            </text>
        );
    };

    return (
        <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white">Projected Final Portfolio Value</h3>
                    <p className="text-sm text-slate-400">Impact of fees on your long-term wealth (Higher is better)</p>
                </div>
            </div>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        barSize={60}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                        <XAxis
                            dataKey="shortName"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: 500 }}
                            dy={10}
                        />
                        <YAxis
                            hide={false}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatYAxis}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff10' }} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            <LabelList dataKey="value" content={renderCustomBarLabel} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Insight Text */}
            <div className="mt-4 pt-4 border-t border-slate-700">
                {chartData.length >= 2 && referenceLines?.currentFee && referenceLines?.lowest && (
                    <div className="bg-emerald-900/10 border border-emerald-900/30 rounded-lg p-3 flex items-start gap-3">
                        <div className="bg-emerald-500/10 p-1.5 rounded-full mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        </div>
                        <div className="text-sm text-slate-300">
                            <span className="text-emerald-400 font-bold block mb-0.5">
                                Potential Benefit: {formatCurrency(referenceLines.lowest.summary.finalValue - referenceLines.currentFee.summary.finalValue)}
                            </span>
                            By switching from current fees to the cheapest platform, your portfolio could be worth significantly more at the end of the term.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


