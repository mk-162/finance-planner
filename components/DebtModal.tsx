
import React, { useState } from 'react';
import { Loan } from '../types';
import { X, Plus, Trash2, CreditCard, Calendar, ArrowRight, CheckCircle } from 'lucide-react';

interface DebtModalProps {
    loans: Loan[];
    onChange: (loans: Loan[]) => void;
    isOpen: boolean;
    onClose: () => void;
    currentAge: number;
    editLoan?: Loan | null; // New prop
}

export const DebtModal: React.FC<DebtModalProps> = ({ loans, onChange, isOpen, onClose, currentAge, editLoan }) => {
    const [newLoan, setNewLoan] = useState<Partial<Loan>>({
        name: '',
        balance: 5000,
        interestRate: 5,
        monthlyPayment: 200,
        startAge: currentAge
    });
    const [error, setError] = useState<string | null>(null);

    // Populate form on open/change of editLoan
    React.useEffect(() => {
        if (isOpen) {
            if (editLoan) {
                setNewLoan({ ...editLoan });
            } else {
                // Reset to defaults for add mode
                setNewLoan({
                    name: '',
                    balance: 5000,
                    interestRate: 5,
                    monthlyPayment: 200,
                    startAge: currentAge
                });
            }
        }
    }, [isOpen, editLoan]);

    if (!isOpen) return null;

    const handleAdd = () => {
        if (!newLoan.name || !newLoan.balance || !newLoan.monthlyPayment) {
            setError("Please fill in Name, Balance and Monthly Payment");
            return;
        }

        const loanData: Loan = {
            id: editLoan ? editLoan.id : Math.random().toString(36).substr(2, 9),
            name: newLoan.name,
            balance: newLoan.balance,
            interestRate: newLoan.interestRate || 0,
            monthlyPayment: newLoan.monthlyPayment,
            startAge: newLoan.startAge || currentAge,
        };

        if (editLoan) {
            // Update existing
            onChange(loans.map(l => l.id === editLoan.id ? loanData : l));
            onClose(); // Close on update
        } else {
            // Create new
            onChange([...loans, loanData]);
            // Reset defaults
            setNewLoan({
                name: '',
                balance: 5000,
                interestRate: 5,
                monthlyPayment: 200,
                startAge: currentAge
            });
        }
    };

    const loadPreset = (name: string, balance: number, rate: number, payment: number) => {
        setError(null);
        setNewLoan({
            name,
            balance,
            interestRate: rate,
            monthlyPayment: payment,
            startAge: currentAge
        });
    };

    const handleRemove = (id: string) => {
        onChange(loans.filter(l => l.id !== id));
    };

    // Helper to estimate years to pay off (purely visual estimate)
    const getPayoffYears = (balance: number, rate: number, monthly: number) => {
        if (monthly <= 0) return 'Never';
        const r = rate / 100 / 12;
        if (r === 0) return (balance / monthly / 12).toFixed(1) + ' yrs';
        // n = -log(1 - r*P/A) / log(1+r)
        const numerator = -Math.log(1 - (r * balance) / monthly);
        const denominator = Math.log(1 + r);
        if (isNaN(numerator) || numerator <= 0) return 'Never'; // payment too low to cover interest
        return (numerator / denominator / 12).toFixed(1) + ' yrs';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <CreditCard size={20} className="text-red-500" />
                        Debts & Loans
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">

                    {/* Presets */}
                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Quick Presets</label>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => loadPreset('Car Finance', 15000, 7.9, 350)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-xs rounded-full text-slate-700">🚗 Car Loan</button>
                            <button onClick={() => setNewLoan({ name: 'Future Car', balance: 25000, interestRate: 6.5, monthlyPayment: 450, startAge: currentAge + 3 })} className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-xs rounded-full text-indigo-700">🔮 Future Car (+3y)</button>
                            <button onClick={() => setNewLoan({ name: 'Future Maintenance', balance: 10000, interestRate: 0, monthlyPayment: 500, startAge: currentAge + 5 })} className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-xs rounded-full text-emerald-700">🛠 Future Maintenance (+5y)</button>
                            <button onClick={() => loadPreset('Credit Card', 3000, 22.9, 150)} className="px-3 py-1 bg-red-50 hover:bg-red-100 text-xs rounded-full text-red-700">💳 Credit Card</button>
                        </div>
                    </div>

                    {/* Add New Form */}
                    <div className="bg-red-50/50 p-4 rounded-sm mb-6 border border-red-100 shadow-sm relative">

                        {/* Error Message */}
                        {error && (
                            <div className="absolute -top-3 left-4 right-4 bg-red-100 text-red-700 text-xs px-3 py-1.5 rounded-full shadow-sm border border-red-200 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-1">
                                <X size={12} className="cursor-pointer" onClick={() => setError(null)} />
                                <span className="font-bold">Error:</span> {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <input
                                type="text"
                                placeholder="Name (e.g. Car PCP)"
                                className={`col-span-2 text-sm p-2 rounded border focus:ring-2 focus:ring-red-500 outline-none ${error && !newLoan.name ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                                value={newLoan.name}
                                onChange={e => {
                                    setNewLoan({ ...newLoan, name: e.target.value });
                                    if (error) setError(null);
                                }}
                            />

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Total Balance</label>
                                <div className={`flex items-center bg-white border rounded px-2 ${error && !newLoan.balance ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300'}`}>
                                    <span className="text-slate-500 text-xs mr-1 font-bold">£</span>
                                    <input
                                        type="number"
                                        className="w-full text-sm p-2 outline-none"
                                        value={newLoan.balance}
                                        onChange={e => setNewLoan({ ...newLoan, balance: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Interest Rate</label>
                                <div className="flex items-center bg-white border border-slate-300 rounded px-2">
                                    <input
                                        type="number"
                                        step={0.1}
                                        className="w-full text-sm p-2 outline-none"
                                        value={newLoan.interestRate}
                                        onChange={e => setNewLoan({ ...newLoan, interestRate: Number(e.target.value) })}
                                    />
                                    <span className="text-slate-500 text-xs ml-1 font-bold">%</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Monthly Payment</label>
                                <div className={`flex items-center bg-white border rounded px-2 ${error && !newLoan.monthlyPayment ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300'}`}>
                                    <span className="text-slate-500 text-xs mr-1 font-bold">£</span>
                                    <input
                                        type="number"
                                        className="w-full text-sm p-2 outline-none"
                                        value={newLoan.monthlyPayment}
                                        onChange={e => setNewLoan({ ...newLoan, monthlyPayment: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Start Age</label>
                                <input
                                    type="number"
                                    className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-red-500 outline-none"
                                    value={newLoan.startAge}
                                    onChange={e => setNewLoan({ ...newLoan, startAge: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-500 mb-3 px-1">
                            <span>Est. Time to Pay Off:</span>
                            <span className="font-bold">
                                {newLoan.balance && newLoan.monthlyPayment
                                    ? getPayoffYears(newLoan.balance, newLoan.interestRate || 0, newLoan.monthlyPayment)
                                    : '-'
                                }
                            </span>
                        </div>

                        <button
                            onClick={handleAdd}
                            className={`w-full text-white text-sm font-medium py-2 rounded transition flex items-center justify-center gap-2 mt-2 ${editLoan ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                        >
                            {editLoan ? <CheckCircle size={16} /> : <Plus size={16} />}
                            {editLoan ? 'Update Loan' : 'Add Loan'}
                        </button>
                    </div>

                    {/* List */}
                    <div className="space-y-2">
                        {loans.length === 0 && (
                            <p className="text-center text-slate-400 text-sm py-4">No debts added.</p>
                        )}
                        {loans.map(loan => (
                            <div key={loan.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-sm shadow-sm">
                                <div>
                                    <div className="font-medium text-slate-800 text-sm flex items-center gap-2">
                                        {loan.name}
                                        {loan.startAge > currentAge && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Future (Age {loan.startAge})</span>}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        Balance: £{loan.balance.toLocaleString()} • Rate: {loan.interestRate}%
                                    </div>
                                    <div className="text-xs font-semibold text-red-600 mt-0.5">
                                        -£{loan.monthlyPayment}/mo
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemove(loan.id)}
                                    className="text-slate-400 hover:text-red-500 p-2"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Close Button */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-900 text-white py-2.5 rounded-sm font-medium hover:bg-slate-800 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
