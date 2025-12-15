import React from 'react';
import { X, AlertTriangle, ExternalLink } from 'lucide-react';
import { YearlyResult, TaxBreakdown } from '../types';

interface TaxBreakdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    yearData: YearlyResult | null;
}

const formatCurrency = (value: number): string => {
    return `£${Math.round(value).toLocaleString()}`;
};

const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
};

export const TaxBreakdownModal: React.FC<TaxBreakdownModalProps> = ({
    isOpen,
    onClose,
    yearData,
}) => {
    if (!isOpen || !yearData) return null;

    const tb = yearData.taxBreakdown;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Tax Calculation</h2>
                        <p className="text-xs text-slate-500">Age {yearData.age} ({yearData.year})</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-4">
                    {/* DISCLAIMER BANNER - PROMINENT */}
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r">
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-amber-800 text-sm">
                                    Simplified Estimate Only
                                </p>
                                <p className="text-xs text-amber-700 mt-1">
                                    This calculation is a rough approximation. These figures may be inaccurate
                                    and you should seek professional advice from an Independent Financial Adviser (IFA).
                                </p>
                                <a
                                    href="https://www.unbiased.co.uk/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 underline mt-2 inline-flex items-center gap-1"
                                >
                                    Find an IFA using Unbiased <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Gross Income Section */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Gross Income</h3>
                        <div className="space-y-2 text-sm">
                            {tb.grossSalary > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Salary / Earnings</span>
                                    <span className="font-mono text-slate-800">{formatCurrency(tb.grossSalary)}</span>
                                </div>
                            )}
                            {tb.grossDividends > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Dividends</span>
                                    <span className="font-mono text-slate-800">{formatCurrency(tb.grossDividends)}</span>
                                </div>
                            )}
                            {tb.grossStatePension > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">State Pension</span>
                                    <span className="font-mono text-slate-800">{formatCurrency(tb.grossStatePension)}</span>
                                </div>
                            )}
                            {tb.grossDBPension > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">DB Pension</span>
                                    <span className="font-mono text-slate-800">{formatCurrency(tb.grossDBPension)}</span>
                                </div>
                            )}
                            {tb.grossRentalProfit > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Rental Profit</span>
                                    <span className="font-mono text-slate-800">{formatCurrency(tb.grossRentalProfit)}</span>
                                </div>
                            )}
                            {tb.grossPensionWithdrawal > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Pension Withdrawal (taxable)</span>
                                    <span className="font-mono text-slate-800">{formatCurrency(tb.grossPensionWithdrawal)}</span>
                                </div>
                            )}
                            {tb.grossOther > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Other Income</span>
                                    <span className="font-mono text-slate-800">{formatCurrency(tb.grossOther)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-slate-200 font-semibold">
                                <span className="text-slate-700">Total Gross</span>
                                <span className="font-mono text-slate-900">{formatCurrency(tb.totalGrossIncome)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Allowances Section */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Allowances Used</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Personal Allowance</span>
                                <span className="font-mono text-green-600">{formatCurrency(tb.personalAllowanceUsed)}</span>
                            </div>
                            {tb.dividendAllowanceUsed > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Dividend Allowance</span>
                                    <span className="font-mono text-green-600">{formatCurrency(tb.dividendAllowanceUsed)}</span>
                                </div>
                            )}
                            {tb.cgtAllowanceUsed > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">CGT Allowance</span>
                                    <span className="font-mono text-green-600">{formatCurrency(tb.cgtAllowanceUsed)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Income Tax Section */}
                    {tb.totalIncomeTax > 0 && (
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Income Tax</h3>
                            <div className="space-y-2 text-sm">
                                {tb.incomeInBasicBand > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Basic Rate (20%)</span>
                                        <span className="font-mono text-red-600">-{formatCurrency(tb.basicRateTax)}</span>
                                    </div>
                                )}
                                {tb.incomeInHigherBand > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Higher Rate (40%)</span>
                                        <span className="font-mono text-red-600">-{formatCurrency(tb.higherRateTax)}</span>
                                    </div>
                                )}
                                {tb.incomeInAdditionalBand > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Additional Rate (45%)</span>
                                        <span className="font-mono text-red-600">-{formatCurrency(tb.additionalRateTax)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-slate-200">
                                    <span className="text-slate-700 font-semibold">Total Income Tax</span>
                                    <span className="font-mono text-red-600 font-semibold">-{formatCurrency(tb.totalIncomeTax)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* National Insurance Section */}
                    {tb.totalNI > 0 && (
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">National Insurance</h3>
                            <div className="space-y-2 text-sm">
                                {tb.niMainRate > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Main Rate (8%)</span>
                                        <span className="font-mono text-red-600">-{formatCurrency(tb.niMainRate)}</span>
                                    </div>
                                )}
                                {tb.niHigherRate > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Higher Rate (2%)</span>
                                        <span className="font-mono text-red-600">-{formatCurrency(tb.niHigherRate)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-slate-200">
                                    <span className="text-slate-700 font-semibold">Total NI</span>
                                    <span className="font-mono text-red-600 font-semibold">-{formatCurrency(tb.totalNI)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dividend Tax Section */}
                    {tb.totalDividendTax > 0 && (
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Dividend Tax</h3>
                            <div className="space-y-2 text-sm">
                                {tb.dividendBasicTax > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Basic Rate (8.75%)</span>
                                        <span className="font-mono text-red-600">-{formatCurrency(tb.dividendBasicTax)}</span>
                                    </div>
                                )}
                                {tb.dividendHigherTax > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Higher Rate (33.75%)</span>
                                        <span className="font-mono text-red-600">-{formatCurrency(tb.dividendHigherTax)}</span>
                                    </div>
                                )}
                                {tb.dividendAdditionalTax > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Additional Rate (39.35%)</span>
                                        <span className="font-mono text-red-600">-{formatCurrency(tb.dividendAdditionalTax)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-slate-200">
                                    <span className="text-slate-700 font-semibold">Total Dividend Tax</span>
                                    <span className="font-mono text-red-600 font-semibold">-{formatCurrency(tb.totalDividendTax)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CGT Section */}
                    {tb.totalCGT > 0 && (
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Capital Gains Tax</h3>
                            <div className="space-y-2 text-sm">
                                {tb.cgtBasicRate > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Basic Rate (10%)</span>
                                        <span className="font-mono text-red-600">-{formatCurrency(tb.cgtBasicRate)}</span>
                                    </div>
                                )}
                                {tb.cgtHigherRate > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Higher Rate (20%)</span>
                                        <span className="font-mono text-red-600">-{formatCurrency(tb.cgtHigherRate)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-slate-200">
                                    <span className="text-slate-700 font-semibold">Total CGT</span>
                                    <span className="font-mono text-red-600 font-semibold">-{formatCurrency(tb.totalCGT)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Summary Section */}
                    <div className="bg-slate-800 p-4 rounded-lg text-white">
                        <h3 className="text-xs font-bold text-slate-300 uppercase mb-3">Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-300">Gross Income</span>
                                <span className="font-mono">{formatCurrency(tb.totalGrossIncome)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-300">Total Tax Paid</span>
                                <span className="font-mono text-red-400">-{formatCurrency(tb.totalTaxPaid)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-600 font-semibold text-lg">
                                <span>Net Income</span>
                                <span className="font-mono text-green-400">{formatCurrency(tb.netIncome)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400 mt-1">
                                <span>Effective Tax Rate</span>
                                <span className="font-mono">{formatPercent(tb.effectiveTaxRate)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Pension Tax Relief */}
                    {yearData.pensionTaxRelief > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h3 className="text-xs font-bold text-green-700 uppercase mb-2">Pension Tax Relief</h3>
                            <p className="text-sm text-green-800">
                                Your pension received <span className="font-bold">{formatCurrency(yearData.pensionTaxRelief)}</span> in
                                basic rate tax relief this year (25% gross-up on your contributions).
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
