

import React from 'react';
import { SimpleFormattedInput } from './InputSection';

interface SmartInputProps {
    label: string;
    subLabel?: string;
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
    step?: number;
    prefix?: string;

    // Secondary Right-side Input (e.g. Growth, Interest Rate)
    rightLabel?: string;
    rightValue?: number;
    onRightChange?: (val: number) => void;

    // Footer Content (Toggles etc)
    children?: React.ReactNode;

    colorClass?: string;
}

export const SmartInput: React.FC<SmartInputProps> = ({
    label,
    subLabel,
    value,
    onChange,
    min,
    max,
    step = 1,
    prefix,
    rightLabel,
    rightValue,
    onRightChange,
    children,
    colorClass = 'blue'
}) => {
    return (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-3">
            {/* Header Row: Label + Inputs */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4 mt-1">
                    <div className="font-bold text-sm text-slate-800 leading-tight">{label}</div>
                    {subLabel && <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{subLabel}</div>}
                </div>

                <div className="flex items-center gap-3">
                    {/* Main Value Input */}
                    <div className="relative">
                        <SimpleFormattedInput
                            value={value}
                            onChange={onChange}
                            prefix={prefix}
                            className="w-28 py-1 px-2 text-right font-bold text-slate-800 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-100 outline-none transition-shadow"
                        />
                    </div>

                    {/* Secondary Input (Growth/Rate) */}
                    {onRightChange !== undefined && rightValue !== undefined && (
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 h-8">
                            {rightLabel && <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">{rightLabel}</span>}
                            <div className="relative w-10">
                                <input
                                    type="number"
                                    step={0.1}
                                    value={rightValue}
                                    onChange={e => onRightChange(Number(e.target.value))}
                                    className="w-full text-right text-xs font-bold bg-transparent outline-none"
                                />
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">%</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Slider Row - Explicitly Full Width & Spaced */}
            <div className="mt-3 mb-2 w-full px-1">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={Math.min(Math.max(value, min), max)}
                    onChange={e => onChange(Number(e.target.value))}
                    className={`w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-${colorClass}-600 focus:outline-none focus:ring-2 focus:ring-${colorClass}-100`}
                />
            </div>

            {/* Footer (Toggles etc) */}
            {children && (
                <div className="mt-3 pt-2 border-t border-slate-50">
                    {children}
                </div>
            )}
        </div>
    );
};
