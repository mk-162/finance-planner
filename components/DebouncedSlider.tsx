import React, { useState, useEffect, useRef } from 'react';

interface DebouncedSliderProps {
    value: number;
    onChange: (value: number) => void;
    onDrag?: (value: number) => void; // Called immediately for display updates
    min: number;
    max: number;
    step?: number;
    debounceMs?: number;
    className?: string;
}

/**
 * A slider that provides instant visual feedback but debounces
 * the actual onChange callback for performance.
 */
export const DebouncedSlider: React.FC<DebouncedSliderProps> = ({
    value,
    onChange,
    onDrag,
    min,
    max,
    step = 1,
    debounceMs = 150,
    className = "w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-400"
}) => {
    const [localValue, setLocalValue] = useState(value);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync local state when external value changes
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value);
        setLocalValue(newValue); // Instant visual update

        // Call onDrag immediately for display value
        if (onDrag) {
            onDrag(newValue);
        }

        // Debounce the actual state update (triggers heavy recalc)
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            onChange(newValue);
        }, debounceMs);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue}
            onChange={handleChange}
            className={className}
        />
    );
};
