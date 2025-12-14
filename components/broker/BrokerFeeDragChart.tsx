import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    ComposedChart,
} from 'recharts';
import { PlatformResult, formatCurrency } from '../../services/brokerFeeCalculator';

interface BrokerFeeDragChartProps {
    results: PlatformResult[];
    showPlatforms?: string[]; // Platform IDs to show, defaults to top 5 + worst
}

const COLORS = [
    '#10b981', // green - no fees baseline
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#ef4444', // red - worst
];

export const BrokerFeeDragChart: React.FC<BrokerFeeDragChartProps> = ({
    results,
    showPlatforms,
}) => {
    const chartData = useMemo(() => {
        if (results.length === 0) return [];

        // Get baseline (no fees) from first result
        const baseline = results[0];
        const years = baseline.yearlyBreakdown.length;

        // Determine which platforms to show
        let platformsToShow: PlatformResult[];
        if (showPlatforms) {
            platformsToShow = results.filter(r => showPlatforms.includes(r.platform.id));
        } else {
            // Default: top 4 cheapest + most expensive
            const cheapest = results.slice(0, 4);
            const mostExpensive = results[results.length - 1];
            platformsToShow = [...cheapest];
            if (!cheapest.includes(mostExpensive)) {
                platformsToShow.push(mostExpensive);
            }
        }

        // Build chart data
        const data = [];
        for (let i = 0; i < years; i++) {
            const year = i + 1;
            const row: Record<string, number | string> = {
                year,
                noFees: baseline.yearlyBreakdown[i].endBalanceNoFees,
            };

            platformsToShow.forEach(result => {
                row[result.platform.id] = result.yearlyBreakdown[i].endBalance;
            });

            data.push(row);
        }

        return { data, platforms: platformsToShow };
    }, [results, showPlatforms]);

    if (results.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-80 flex items-center justify-center">
                <p className="text-slate-500">No data to display</p>
            </div>
        );
    }

    const { data, platforms } = chartData as { data: Record<string, number | string>[]; platforms: PlatformResult[] };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload) return null;

        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                <p className="font-semibold text-slate-800 mb-2">Year {label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-slate-600">{entry.name}:</span>
                        <span className="font-mono font-medium">{formatCurrency(entry.value)}</span>
                    </div>
                ))}
            </div>
        );
    };

    const formatYAxis = (value: number) => {
        if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
        return `£${value}`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Portfolio Growth Over Time</h3>
                    <p className="text-sm text-slate-500">Green line shows growth without fees (baseline)</p>
                </div>
            </div>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="year"
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            axisLine={{ stroke: '#cbd5e1' }}
                            label={{ value: 'Years', position: 'bottom', fill: '#64748b', fontSize: 12 }}
                        />
                        <YAxis
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            axisLine={{ stroke: '#cbd5e1' }}
                            tickFormatter={formatYAxis}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="top"
                            height={36}
                            formatter={(value) => {
                                if (value === 'noFees') return 'No Fees (Baseline)';
                                const platform = platforms.find(p => p.platform.id === value);
                                return platform?.platform.name || value;
                            }}
                        />

                        {/* Baseline - no fees */}
                        <Line
                            type="monotone"
                            dataKey="noFees"
                            stroke={COLORS[0]}
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            dot={false}
                            name="noFees"
                        />

                        {/* Platform lines */}
                        {platforms.map((platform, index) => (
                            <Line
                                key={platform.platform.id}
                                type="monotone"
                                dataKey={platform.platform.id}
                                stroke={index === platforms.length - 1 && platforms.length > 1 ? COLORS[6] : COLORS[index + 1]}
                                strokeWidth={2}
                                dot={false}
                                name={platform.platform.id}
                            />
                        ))}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Fee Drag Summary */}
            <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {platforms.slice(0, 4).map((result, index) => {
                        const savings = results[results.length - 1].summary.totalFeeDrag - result.summary.totalFeeDrag;
                        return (
                            <div key={result.platform.id} className="text-center">
                                <div className="text-xs text-slate-500 uppercase">{result.platform.name}</div>
                                <div className="text-lg font-bold text-slate-800">
                                    {formatCurrency(result.summary.finalValue)}
                                </div>
                                {index === 0 && savings > 0 && (
                                    <div className="text-xs text-green-600">
                                        Save {formatCurrency(savings)} vs worst
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
