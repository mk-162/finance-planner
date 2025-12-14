
import React, { useState } from 'react';
import { Mortgage } from '../types';
import { X, Plus, Trash2, Home, Building } from 'lucide-react';

interface MortgageModalProps {
    mortgages: Mortgage[];
    onChange: (mortgages: Mortgage[]) => void;
    isOpen: boolean;
    onClose: () => void;
    currentAge: number;
}

export const MortgageModal: React.FC<MortgageModalProps> = ({ mortgages, onChange, isOpen, onClose, currentAge }) => {
    const [newMortgage, setNewMortgage] = useState<Partial<Mortgage>>({
        name: 'Main Home',
        balance: 200000,
        interestRate: 4.5,
        monthlyPayment: 1200,
        type: 'repayment',
        endAge: currentAge + 25
    });

    if (!isOpen) return null;

    const handleAdd = () => {
        // Validate
        if (!newMortgage.name || !newMortgage.balance || !newMortgage.monthlyPayment) return;

        const mortgage: Mortgage = {
            id: Math.random().toString(36).substr(2, 9),
            name: newMortgage.name,
            balance: newMortgage.balance,
            interestRate: newMortgage.interestRate || 0,
            monthlyPayment: newMortgage.monthlyPayment,
            type: newMortgage.type || 'repayment',
            endAge: newMortgage.endAge || (currentAge + 25)
        };
        onChange([...mortgages, mortgage]);

        // Reset defaults (for next entry)
        setNewMortgage({
            name: 'Second Property',
            balance: 150000,
            interestRate: 5,
            monthlyPayment: 900,
            type: 'interest_only',
            endAge: currentAge + 20
        });
    };

    const handleRemove = (id: string) => {
        onChange(mortgages.filter(m => m.id !== id));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Home size={20} className="text-blue-600" />
                        Manage Mortgages
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">

                    {/* Add New Form */}
                    <div className="bg-blue-50/50 p-4 rounded-xl mb-6 border border-blue-100 shadow-sm">
                        <div className="text-xs font-bold text-blue-800 uppercase mb-3 flex items-center gap-2">
                            <Plus size={14} /> Add New Mortgage
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            {/* Name */}
                            <input
                                type="text"
                                placeholder="Name (e.g. Main Home)"
                                className="col-span-2 text-sm p-2 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newMortgage.name}
                                onChange={e => setNewMortgage({ ...newMortgage, name: e.target.value })}
                            />

                            {/* Balance */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Outstanding Balance</label>
                                <div className="flex items-center bg-white border border-slate-300 rounded px-2">
                                    <span className="text-slate-500 text-xs mr-1 font-bold">£</span>
                                    <input
                                        type="number"
                                        className="w-full text-sm p-2 outline-none"
                                        value={newMortgage.balance}
                                        onChange={e => setNewMortgage({ ...newMortgage, balance: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {/* Interest Rate */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Interest Rate</label>
                                <div className="flex items-center bg-white border border-slate-300 rounded px-2">
                                    <input
                                        type="number"
                                        step={0.1}
                                        className="w-full text-sm p-2 outline-none"
                                        value={newMortgage.interestRate}
                                        onChange={e => setNewMortgage({ ...newMortgage, interestRate: Number(e.target.value) })}
                                    />
                                    <span className="text-slate-500 text-xs ml-1 font-bold">%</span>
                                </div>
                            </div>

                            {/* Monthly Payment */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Monthly Payment</label>
                                <div className="flex items-center bg-white border border-slate-300 rounded px-2">
                                    <span className="text-slate-500 text-xs mr-1 font-bold">£</span>
                                    <input
                                        type="number"
                                        className="w-full text-sm p-2 outline-none"
                                        value={newMortgage.monthlyPayment}
                                        onChange={e => setNewMortgage({ ...newMortgage, monthlyPayment: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {/* End Age */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">End Age</label>
                                <input
                                    type="number"
                                    className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newMortgage.endAge}
                                    onChange={e => setNewMortgage({ ...newMortgage, endAge: Number(e.target.value) })}
                                />
                                <span className="text-[9px] text-slate-400">Paid off/Ends</span>
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
                        </div>

                        <button
                            onClick={handleAdd}
                            className="w-full bg-slate-900 text-white text-sm font-medium py-2 rounded hover:bg-slate-800 transition flex items-center justify-center gap-2 mt-2 shadow-lg"
                        >
                            <Plus size={16} /> Add Mortgage
                        </button>
                    </div>

                    {/* List */}
                    <div className="space-y-3">
                        {mortgages.length === 0 && (
                            <p className="text-center text-slate-400 text-sm py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                No mortgages configured.
                            </p>
                        )}
                        {mortgages.map(m => (
                            <div key={m.id} className="relative group bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition p-3">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-blue-50 p-1.5 rounded text-blue-600">
                                            <Building size={16} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">{m.name}</div>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{m.type.replace('_', ' ')}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-bold text-slate-700">£{m.balance.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-400">Outstanding</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs bg-slate-50 rounded p-2 text-slate-600">
                                    <div>
                                        <span className="font-bold">£{m.monthlyPayment}</span><span className="text-[10px]">/mo</span>
                                    </div>
                                    <div>
                                        <span className="font-bold">{m.interestRate}%</span> Interest
                                    </div>
                                    <div>
                                        Ends Age <span className="font-bold">{m.endAge}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleRemove(m.id)}
                                    className="absolute -top-2 -right-2 bg-white text-slate-400 hover:text-red-500 p-1.5 rounded-full shadow border border-slate-100 opacity-0 group-hover:opacity-100 transition"
                                    title="Remove Mortgage"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
