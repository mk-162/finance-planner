import React, { useState, useEffect, useRef } from 'react';
import { Tooltip } from './Tooltip';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const SimpleFormattedInput: React.FC<any> = ({ value, onChange, className, prefix, suffix, ...props }) => {
  const format = (v: number) => v === undefined || v === null ? '' : Math.round(v).toLocaleString('en-GB');

  const [display, setDisplay] = useState(format(value));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setDisplay(format(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplay(raw);

    // Remove commas for numeric value
    const clean = raw.replace(/,/g, '');
    if (clean === '') {
      onChange(0);
      return;
    }

    const num = parseFloat(clean);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const handleFocus = (e: any) => {
    isFocused.current = true;
    // Strip commas for easier editing
    setDisplay(value?.toString() ?? '');
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e: any) => {
    isFocused.current = false;
    setDisplay(format(value));
    if (props.onBlur) props.onBlur(e);
  };

  return (
    <div className="relative w-full">
      {prefix && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
          <span className="text-slate-500 sm:text-sm">{prefix}</span>
        </div>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={className || `block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${prefix ? 'pl-7' : 'pl-3'} ${suffix ? 'pr-8' : 'pr-3'}`}
        {...props}
      />
      {suffix && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 z-10">
          <span className="text-slate-500 sm:text-sm">{suffix}</span>
        </div>
      )}
    </div>
  );
};

export const NumberInput: React.FC<NumberInputProps> = ({
  label, value, onChange, prefix, suffix, min = 0, max, step = 1
}) => {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
        {label}
      </label>
      <div className="relative rounded-md shadow-sm">
        <SimpleFormattedInput
          value={value}
          onChange={onChange}
          prefix={prefix}
          suffix={suffix}
          min={min}
          max={max}
          step={step}
        />
      </div>
    </div>
  );
};

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (val: number) => string;
  tooltip?: string;
}

export const SliderInput: React.FC<SliderInputProps> = ({
  label, value, onChange, min, max, step = 1, formatValue, tooltip
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

    // Debounce the actual state update
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 150);
  };

  // Cleanup
  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-1">
        <label className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase">
          {label}
          {tooltip && <Tooltip text={tooltip} />}
        </label>
        <span className="text-sm font-bold text-slate-700">
          {formatValue ? formatValue(localValue) : localValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={handleChange}
        className="w-full h-2 bg-slate-200 rounded-sm appearance-none cursor-pointer accent-blue-600 mt-2"
      />
    </div>
  );
};