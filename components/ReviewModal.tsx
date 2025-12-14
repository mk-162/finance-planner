import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { UserInputs, YearlyResult } from '../types';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    inputs: UserInputs;
    results: YearlyResult[];
    fundsRunOutAge: number | null;
    finalNetWorth: number;
}

interface Observation {
    type: 'warning' | 'info' | 'success';
    message: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
    isOpen,
    onClose,
    inputs,
    results,
    fundsRunOutAge,
    finalNetWorth
}) => {
    const [step, setStep] = useState<'disclaimer' | 'feedback'>('disclaimer');

    if (!isOpen) return null;

    // Generate observations based on inputs and results
    const generateObservations = (): Observation[] => {
        const obs: Observation[] = [];

        // Calculate some derived values
        const retirementResult = results.find(r => r.age === inputs.retirementAge);
        const netWorthAtRetirement = retirementResult?.totalNetWorth || 0;
        const yearsInRetirement = inputs.lifeExpectancy - inputs.retirementAge;
        const requiredMultiple = netWorthAtRetirement / Math.max(inputs.annualSpending, 1);

        // 1. Shortfall
        if (fundsRunOutAge) {
            obs.push({
                type: 'warning',
                message: `Your funds may run out at age ${fundsRunOutAge}. Consider reducing spending or increasing savings.`
            });
        }

        // 2. Tight margin (within 10% of £0)
        if (!fundsRunOutAge && finalNetWorth > 0 && finalNetWorth < inputs.annualSpending * 2) {
            obs.push({
                type: 'warning',
                message: 'Your margin is tight. A small change in returns or spending could impact your plan.'
            });
        }

        // 3. Life expectancy
        if (inputs.lifeExpectancy < 85) {
            obs.push({
                type: 'warning',
                message: `Planning to age ${inputs.lifeExpectancy} is optimistic. Consider extending to 90+ for safety.`
            });
        } else if (inputs.lifeExpectancy > 95) {
            obs.push({
                type: 'success',
                message: `Planning to age ${inputs.lifeExpectancy} provides good longevity buffer.`
            });
        }

        // 4. Growth rates
        const growthRates = [
            { name: 'Pension', rate: inputs.growthPension },
            { name: 'ISA', rate: inputs.growthISA },
            { name: 'GIA', rate: inputs.growthGIA },
            { name: 'Cash', rate: inputs.growthCash }
        ];

        growthRates.forEach(({ name, rate }) => {
            if (rate < 2 && name !== 'Cash') {
                obs.push({
                    type: 'info',
                    message: `Your ${name} growth rate (${rate}%) is conservative. Historically, equities average 4-7%.`
                });
            } else if (rate > 8) {
                obs.push({
                    type: 'warning',
                    message: `Your ${name} growth rate (${rate}%) is optimistic. Consider stress-testing with lower returns.`
                });
            }
        });

        // 5. Retirement funding
        if (requiredMultiple > 30) {
            obs.push({
                type: 'info',
                message: 'You may be over-saving. Consider enjoying more now or planning for legacy giving.'
            });
        } else if (requiredMultiple < 15 && requiredMultiple > 0) {
            obs.push({
                type: 'warning',
                message: 'Your savings at retirement may be insufficient. Consider saving more or delaying retirement.'
            });
        }

        // 6. Expenses
        if (inputs.annualSpending > 60000) {
            obs.push({
                type: 'info',
                message: `Your annual spending (£${(inputs.annualSpending / 1000).toFixed(0)}k) is above average. Ensure this is sustainable.`
            });
        } else if (inputs.annualSpending < 15000) {
            obs.push({
                type: 'info',
                message: `Your annual spending (£${(inputs.annualSpending / 1000).toFixed(0)}k) is quite low. Consider if this is realistic.`
            });
        }

        // 7. No life events
        if (!inputs.events || inputs.events.length === 0) {
            obs.push({
                type: 'info',
                message: "You haven't added life events (weddings, university fees, car purchases). Consider adding major expenses."
            });
        }

        // 8. No pension contributions
        const totalPensionContrib = (inputs.contribPension || 0) + (inputs.contribWorkplacePension || 0) + (inputs.contribSIPP || 0);
        if (totalPensionContrib === 0 && inputs.currentSalary > 0) {
            obs.push({
                type: 'warning',
                message: 'No pension contributions detected. Consider maximizing pension for tax efficiency.'
            });
        }

        // 9. Early retirement
        if (inputs.retirementAge < 55) {
            obs.push({
                type: 'warning',
                message: `Retiring at ${inputs.retirementAge} requires careful planning for the gap before pension access at 57.`
            });
        }

        // 10. Large legacy
        if (finalNetWorth > 500000) {
            obs.push({
                type: 'info',
                message: `A legacy over £500k may have inheritance tax implications (40% over £325k threshold).`
            });
        }

        // If no observations, add a positive one
        if (obs.length === 0) {
            obs.push({
                type: 'success',
                message: 'Your plan looks well-balanced. Remember to review it periodically as circumstances change.'
            });
        }

        return obs;
    };

    const observations = generateObservations();

    const handleConfirm = () => {
        setStep('feedback');
    };

    const handleClose = () => {
        setStep('disclaimer');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Info size={20} className="text-teal-600" />
                        {step === 'disclaimer' ? 'Important Notice' : 'Plan Feedback'}
                    </h2>
                    <button onClick={handleClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    {step === 'disclaimer' ? (
                        <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-bold text-amber-800 mb-2">This is not financial advice</h3>
                                        <p className="text-sm text-amber-700 leading-relaxed">
                                            This tool provides simplified financial projections to support your planning.
                                            It should not replace professional financial advice.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    <strong>Tax calculations have been significantly simplified</strong> and may not
                                    accurately reflect your actual tax position. They do not account for personal
                                    allowances, dividend allowances, capital gains allowances, or pension tax relief
                                    complexities.
                                </p>
                            </div>

                            <p className="text-xs text-slate-500 text-center">
                                For accurate financial planning, please consult a qualified financial advisor.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600 mb-4">
                                Based on the values you've provided, here are some observations:
                            </p>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                {observations.map((obs, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-start gap-3 p-3 rounded-xl border ${obs.type === 'warning'
                                                ? 'bg-amber-50 border-amber-200'
                                                : obs.type === 'success'
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-blue-50 border-blue-200'
                                            }`}
                                    >
                                        {obs.type === 'warning' ? (
                                            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                        ) : obs.type === 'success' ? (
                                            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                        )}
                                        <p className={`text-sm ${obs.type === 'warning'
                                                ? 'text-amber-800'
                                                : obs.type === 'success'
                                                    ? 'text-green-800'
                                                    : 'text-blue-800'
                                            }`}>
                                            {obs.message}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Financial Advisor Banner */}
                            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-teal-800 text-sm">Need professional advice?</h4>
                                        <p className="text-xs text-teal-600 mt-0.5">Consider speaking with a qualified financial advisor.</p>
                                    </div>
                                    <a
                                        href="https://www.unbiased.co.uk/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-3 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition"
                                    >
                                        Find Advisor <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    {step === 'disclaimer' ? (
                        <button
                            onClick={handleConfirm}
                            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition"
                        >
                            I understand - view feedback
                        </button>
                    ) : (
                        <button
                            onClick={handleClose}
                            className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
