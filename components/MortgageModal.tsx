
import React, { useState, useEffect } from 'react';
import { Mortgage } from '../types';
import { X, Plus, Home, CheckCircle } from 'lucide-react';

interface MortgageModalProps {
    mortgages: Mortgage[];
    onChange: (mortgages: Mortgage[]) => void;
    isOpen: boolean;
    onClose: () => void;
    currentAge: number;
    editMortgage?: Mortgage | null; // New prop for editing
}

export const MortgageModal: React.FC<MortgageModalProps> = ({ mortgages, onChange, isOpen, onClose, currentAge, editMortgage }) => {
    const [newMortgage, setNewMortgage] = useState<Partial<Mortgage>>({
        name: 'Main Home',
        balance: 200000,
        interestRate: 4.5,
        monthlyPayment: 1200,
        type: 'repayment',
        chargeType: 'first',
        endAge: currentAge + 25
    });

    // Populate / Reset
    useEffect(() => {
        if (isOpen) {
            if (editMortgage) {
                setNewMortgage({ ...editMortgage });
            } else {
                setNewMortgage({
                    name: 'Main Home',
                    balance: 200000,
                    interestRate: 4.5,
                    monthlyPayment: 1200, // Default prompt
                    type: 'repayment',
                    chargeType: 'first',
                    endAge: currentAge + 25
                });
            }
        }
    }, [isOpen, editMortgage, currentAge]);

    if (!isOpen) return null;

    const handleAdd = () => {
        // Validate
        if (!newMortgage.name || !newMortgage.balance || !newMortgage.monthlyPayment) return;

        const mortgageData: Mortgage = {
            id: editMortgage ? editMortgage.id : Math.random().toString(36).substr(2, 9),
            name: newMortgage.name,
            balance: newMortgage.balance,
            interestRate: newMortgage.interestRate || 0,
            monthlyPayment: newMortgage.monthlyPayment,
            type: newMortgage.type || 'repayment',
            chargeType: newMortgage.chargeType || 'first',
            endAge: newMortgage.endAge || (currentAge + 25)
        };

        if (editMortgage) {
            // Update existing
            onChange(mortgages.map(m => m.id === editMortgage.id ? mortgageData : m));
            onClose();
        } else {
            // Add new
            onChange([...mortgages, mortgageData]);

            // Reset for next entry
            setNewMortgage({
                name: 'Second Charge Loan',
                balance: 30000,
                interestRate: 6.5,
                monthlyPayment: 200,
                type: 'interest_only',
                chargeType: 'second',
                endAge: currentAge + 15
            });
            onClose();
        }
    };

    // Helper: Calculate Repayment (Opt-In)
    const calculateRepayment = () => {
        const principal = newMortgage.balance || 0;
        const rate = (newMortgage.interestRate || 0) / 100 / 12;
        const years = (newMortgage.endAge || (currentAge + 25)) - currentAge;
        const months = years * 12;

        if (principal <= 0 || months <= 0) return;

        let payment = 0;
        if (newMortgage.type === 'interest_only') {
            payment = (principal * (newMortgage.interestRate || 0) / 100) / 12;
        } else {
            // Mortgage Formula: M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1 ]
            if (rate === 0) {
                payment = principal / months;
            } else {
                payment = principal * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
            }
        }

        setNewMortgage(prev => ({ ...prev, monthlyPayment: Math.round(payment) }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Home size={20} className="text-blue-600" />
                        {editMortgage ? 'Edit Mortgage' : 'Add New Mortgage'}
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="bg-blue-50/50 p-4 rounded-sm border border-blue-100 shadow-sm">
                        <div className="text-xs font-bold text-blue-800 uppercase mb-3 flex items-center gap-2">
                            {editMortgage ? 'Update Details' : 'Enter Details'}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                            {/* Name */}
                            <div className="col-span-2">
                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Mortgage Name</label>
                                <input
                                    type="text"
                                    placeholder="Name (e.g. Main Home)"
                                    className="w-full text-sm p-2 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newMortgage.name}
                                    onChange={e => setNewMortgage({ ...newMortgage, name: e.target.value })}
                                />
                            </div>

                            {/* Balance */}
                            <div className="col-span-2 flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Outstanding Balance</label>
                                <div className="flex items-center bg-white border border-slate-300 rounded px-2 focus-within:ring-2 focus-within:ring-blue-500 ring-offset-1 transition-all">
                                    <span className="text-slate-500 text-lg mr-2 font-bold">£</span>
                                    <input
                                        type="number"
                                        className="w-full text-lg font-bold p-2 outline-none text-slate-700 placeholder-slate-300"
                                        value={newMortgage.balance}
                                        onChange={e => setNewMortgage({ ...newMortgage, balance: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 py-2 border-t border-slate-200 my-1"></div>

                            {/* PRIMARY INPUTS: Payment & End Age */}

                            {/* Monthly Payment */}
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] uppercase font-bold text-slate-700">Monthly Payment</label>
                                </div>
                                <div className="flex items-center bg-white border border-slate-300 rounded px-2 h-10 shadow-sm">
                                    <span className="text-slate-500 text-sm mr-1 font-bold">£</span>
                                    <input
                                        type="number"
                                        className="w-full text-sm font-bold p-2 outline-none text-slate-800"
                                        value={newMortgage.monthlyPayment}
                                        onChange={e => setNewMortgage({ ...newMortgage, monthlyPayment: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {/* End Age */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-700">Mortgage End Age</label>
                                <div className="flex items-center bg-white border border-slate-300 rounded px-2 h-10 shadow-sm relative">
                                    <input
                                        type="number"
                                        className="w-full text-sm font-bold p-2 outline-none text-slate-800"
                                        value={newMortgage.endAge}
                                        onChange={e => setNewMortgage({ ...newMortgage, endAge: Number(e.target.value) })}
                                    />
                                    <span className="text-[10px] text-slate-400 absolute right-2 font-medium bg-slate-50 px-1 rounded">
                                        Term: {Math.max(0, (newMortgage.endAge || 0) - currentAge)}y
                                    </span>
                                </div>
                            </div>

                            {/* Type Toggle */}
                            <div className="col-span-2 flex items-center justify-between bg-white p-2 rounded border border-slate-200 mt-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Type</span>
                                <div className="flex bg-slate-100 rounded p-0.5">
                                    <button
                                        onClick={() => setNewMortgage({ ...newMortgage, type: 'repayment' })}
                                        className={`px-3 py-1 text-[10px] font-bold rounded transition ${newMortgage.type === 'repayment' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Repayment
                                    </button>
                                    <button
                                        onClick={() => setNewMortgage({ ...newMortgage, type: 'interest_only' })}
                                        className={`px-3 py-1 text-[10px] font-bold rounded transition ${newMortgage.type === 'interest_only' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Interest Only
                                    </button>
                                </div>
                            </div>

                            {/* Charge Type Toggle */}
                            <div className="col-span-2 flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Charge</span>
                                <div className="flex bg-slate-100 rounded p-0.5">
                                    <button
                                        onClick={() => setNewMortgage({ ...newMortgage, chargeType: 'first' })}
                                        className={`px-3 py-1 text-[10px] font-bold rounded transition ${newMortgage.chargeType === 'first' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        First
                                    </button>
                                    <button
                                        onClick={() => setNewMortgage({ ...newMortgage, chargeType: 'second' })}
                                        className={`px-3 py-1 text-[10px] font-bold rounded transition ${newMortgage.chargeType === 'second' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Second
                                    </button>
                                </div>
                            </div>

                            {/* Advanced / Optional Rate Section */}
                            <div className="col-span-2 mt-2 pt-2 border-t border-slate-200 bg-slate-50/50 p-2 rounded">
                                <div className="flex justify-between items-end mb-1">
                                    <label className="text-[9px] uppercase font-bold text-slate-400">Interest Rate (Optional Ref)</label>
                                    {/* Helper Button */}
                                    <button
                                        onClick={calculateRepayment}
                                        className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 transition border border-blue-200"
                                        title="Calculate Monthly Payment based on Balance, Rate and End Age"
                                    >
                                        Auto-Calc Payment
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-white border border-slate-200 rounded px-2 h-8 w-24">
                                        <input
                                            type="number"
                                            step={0.1}
                                            className="w-full text-xs p-1 outline-none text-slate-600"
                                            value={newMortgage.interestRate}
                                            onChange={e => setNewMortgage({ ...newMortgage, interestRate: Number(e.target.value) })}
                                        />
                                        <span className="text-slate-400 text-xs ml-1 font-bold">%</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 leading-tight flex-1">
                                        Used for calculations if you click 'Auto-Calc'. Otherwise, manual Payment is used.
                                    </div>
                                </div>
                            </div>

                        </div>

                        <button
                            onClick={handleAdd}
                            className={`w-full text-white text-sm font-medium py-2 rounded transition flex items-center justify-center gap-2 mt-2 shadow-lg ${editMortgage ? 'bg-blue-700 hover:bg-blue-800' : 'bg-slate-900 hover:bg-slate-800'}`}
                        >
                            {editMortgage ? <CheckCircle size={16} /> : <Plus size={16} />}
                            {editMortgage ? 'Update Mortgage' : 'Add Mortgage'}
                        </button>
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
