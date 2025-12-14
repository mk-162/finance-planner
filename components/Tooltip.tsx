import React, { useState, useRef, useLayoutEffect } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
    text: string;
    className?: string;
    variant?: 'light' | 'dark'; // 'light' for use on light backgrounds, 'dark' for use on dark backgrounds
}

export const Tooltip: React.FC<TooltipProps> = ({ text, className = '', variant = 'light' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [xOffset, setXOffset] = useState(0);

    const iconClass = variant === 'dark'
        ? 'text-white/50 hover:text-white/80 hover:bg-white/10'
        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100';

    useLayoutEffect(() => {
        if (isVisible && tooltipRef.current) {
            const rect = tooltipRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;

            let adjustment = 0;
            const margin = 16; // Minimum distance from screen edge

            // Check left boundary
            if (rect.left < margin) {
                adjustment = margin - rect.left;
            }
            // Check right boundary
            else if (rect.right > viewportWidth - margin) {
                adjustment = (viewportWidth - margin) - rect.right;
            }

            setXOffset(adjustment);
        } else {
            setXOffset(0);
        }
    }, [isVisible]);

    return (
        <div className={`relative inline-flex items-center ${className}`}>
            <button
                type="button"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onFocus={() => setIsVisible(true)}
                onBlur={() => setIsVisible(false)}
                className={`transition-colors p-0.5 rounded-full ${iconClass}`}
                aria-label="More information"
            >
                <Info size={14} />
            </button>

            {isVisible && (
                <div
                    ref={tooltipRef}
                    className="absolute z-50 bottom-full left-1/2 mb-2 w-64 pointer-events-none"
                    style={{ transform: `translateX(calc(-50% + ${xOffset}px))` }}
                >
                    <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg relative">
                        {text}
                        {/* Arrow container - shifts opposite to xOffset to stay centered on icon */}
                        <div
                            className="absolute top-full left-1/2 -mt-1"
                            style={{ transform: `translateX(calc(-50% - ${xOffset}px))` }}
                        >
                            <div className="border-4 border-transparent border-t-slate-800" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
