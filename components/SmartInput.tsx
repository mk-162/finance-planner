import React, { useState, useEffect, useRef } from 'react';
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
    // Debouncing for slider
    const [localValue, setLocalValue] = useState(value);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => { setLocalValue(value); }, [value]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value);
        setLocalValue(newValue);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => onChange(newValue), 150);
    };

    useEffect(() => {
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, []);

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-3">
            {/* Header Row: Label + Inputs */}
            <div className="flex justify-between items-start mb-3">
                {/* Left: Label + Sub-label */}
                <div>
                    <div className="text-sm font-semibold text-slate-800">{label}</div>
                    {subLabel && <div className="text-xs text-slate-400">{subLabel}</div>}
                </div>

                {/* Right: Input Fields */}
                <div className="flex items-center gap-2">
                    {/* Main Value Input */}
                    <SimpleFormattedInput
                        value={localValue}
                        onChange={onChange}
                        prefix={prefix}
                        className="w-24 text-right text-sm font-bold bg-slate-50 border border-slate-200 rounded-md p-1.5 text-slate-700"
                    />

                    {/* Secondary Input (e.g. Growth %) */}
                    {rightLabel && onRightChange && (
                        <div className="flex items-center gap-0.5 bg-slate-50 rounded-md p-1.5 border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-medium mr-1">{rightLabel}</span>
                            <div className="w-12">
                                <input
                                    type="number"
                                    min={0}
                                    max={15}
                                    step={0.1}
                                    value={rightValue}
                                    onChange={e => onRightChange(Number(e.target.value))}
                                    className="w-full text-right text-xs font-bold bg-transparent outline-none text-slate-700"
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
                    value={localValue}
                    onChange={handleSliderChange}
                    className={`w-full h-1.5 bg-slate-100 rounded-sm appearance-none cursor-pointer accent-${colorClass}-600 focus:outline-none focus:ring-2 focus:ring-${colorClass}-100`}
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
