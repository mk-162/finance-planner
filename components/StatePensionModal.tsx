import React from 'react';
import { X, ExternalLink, Info, CheckCircle } from 'lucide-react';

interface StatePensionModalProps {
    isOpen: boolean;
    onClose: () => void;
    missingYears: number;
    onMissingYearsChange: (years: number) => void;
    statePensionAge: number;
}

// State Pension Constants (2024/25 rates)
const FULL_YEARS_REQUIRED = 35;
const FULL_WEEKLY_STATE_PENSION = 221.20;
const FULL_STATE_PENSION = Math.round(FULL_WEEKLY_STATE_PENSION * 52);

// Calculate State Pension from missing NI years
const calculateStatePension = (missingYears: number): { weekly: number; annual: number; qualifyingYears: number } => {
    const clampedMissing = Math.max(0, Math.min(missingYears, FULL_YEARS_REQUIRED));
    const qualifyingYears = FULL_YEARS_REQUIRED - clampedMissing;
    const weekly = (qualifyingYears / FULL_YEARS_REQUIRED) * FULL_WEEKLY_STATE_PENSION;
    const annual = weekly * 52;
    return { weekly: Math.round(weekly * 100) / 100, annual: Math.round(annual), qualifyingYears };
};

export { FULL_STATE_PENSION, calculateStatePension };

export const StatePensionModal: React.FC<StatePensionModalProps> = ({
    isOpen,
    onClose,
    missingYears,
    onMissingYearsChange,
    statePensionAge
}) => {
    if (!isOpen) return null;

    const { weekly, annual, qualifyingYears } = calculateStatePension(missingYears);

    const handleMissingYearsChange = (value: number) => {
        const clamped = Math.max(0, Math.min(35, value || 0));
        onMissingYearsChange(clamped);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">State Pension (UK)</h2>
                        <p className="text-xs text-slate-500">Based on National Insurance contributions</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* GOV.UK Link */}
                    <a
                        href="https://www.gov.uk/check-state-pension"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition"
                    >
                        <ExternalLink size={16} />
                        <div>
                            <div className="font-semibold">Check your State Pension on GOV.UK</div>
                            <div className="text-xs text-blue-600">See your qualifying years and any gaps</div>
                        </div>
                    </a>

                    {/* Missing Years Input */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <label className="text-sm font-semibold text-slate-700 block mb-2">
                            How many qualifying NI years are you missing?
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min={0}
                                max={35}
                                value={missingYears}
                                onChange={e => handleMissingYearsChange(Number(e.target.value))}
                                className="w-20 p-2 text-lg font-bold text-center border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            <span className="text-sm text-slate-500">years (0-35)</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            The full State Pension requires 35 qualifying years.
                        </p>
                    </div>

                    {/* Calculated Output */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-3">
                            Estimated State Pension (today's money)
                        </p>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Qualifying years:</span>
                                <span className="font-bold text-slate-800">{qualifyingYears} / 35</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Weekly amount:</span>
                                <span className="font-bold text-slate-800">£{weekly.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                <span className="text-sm font-semibold text-slate-700">Annual amount:</span>
                                <span className="text-lg font-bold text-green-600">£{annual.toLocaleString()}/yr</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-3 italic">
                            Amounts shown in today's money. Inflation is applied elsewhere in your plan.
                        </p>
                    </div>

                    {/* Info Message */}
                    {missingYears > 0 ? (
                        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-700">
                                <p className="font-semibold mb-1">You have gaps in your National Insurance record.</p>
                                <p>Some people choose to fill gaps voluntarily, depending on their circumstances. You can see your options on the government website.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle size={18} className="text-green-600" />
                            <span className="text-sm text-green-700 font-medium">
                                You are modelled as receiving the full State Pension.
                            </span>
                        </div>
                    )}

                    {/* State Pension Age Info */}
                    <div className="text-xs text-slate-500 text-center">
                        State Pension starts at age <strong>{statePensionAge}</strong> (based on your birth year)
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
