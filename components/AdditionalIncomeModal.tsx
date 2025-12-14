import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, TrendingUp, Calendar, CheckCircle, PiggyBank } from 'lucide-react';
import { AdditionalIncome } from '../types';

interface AdditionalIncomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    incomes: AdditionalIncome[];
    onChange: (updated: AdditionalIncome[]) => void;
    currentAge: number;
    retirementAge: number;
    editIncome?: AdditionalIncome | null;
}

export const AdditionalIncomeModal: React.FC<AdditionalIncomeModalProps> = ({
    isOpen, onClose, incomes, onChange, currentAge, retirementAge, editIncome
}) => {

    // Local State for Form
    const [name, setName] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [startAge, setStartAge] = useState<number>(retirementAge);
    const [endAge, setEndAge] = useState<number>(retirementAge + 5);
    const [taxAsDividend, setTaxAsDividend] = useState(false);

    // Reset/Populate form when modal opens or editIncome changes
    useEffect(() => {
        if (isOpen) {
            if (editIncome) {
                setName(editIncome.name);
                setAmount(editIncome.amount);
                setStartAge(editIncome.startAge);
                setEndAge(editIncome.endAge);
                setTaxAsDividend(editIncome.taxAsDividend || false);
            } else {
                setName('');
                setAmount('');
                setStartAge(retirementAge);
                setEndAge(retirementAge + 5);
                setTaxAsDividend(false);
            }
        }
    }, [isOpen, retirementAge, editIncome]);

    if (!isOpen) return null;

    const handleAdd = () => {
        if (!name || !amount) return;

        const incomeData: AdditionalIncome = {
            id: editIncome ? editIncome.id : Math.random().toString(36).substr(2, 9),
            name,
            amount: Number(amount),
            startAge,
            endAge,
            taxAsDividend
        };

        if (editIncome) {
            // Update Existing
            onChange(incomes.map(i => i.id === editIncome.id ? incomeData : i));
            onClose();
        } else {
            // Add New
            onChange([...incomes, incomeData]);
            // Reset Form (for multiple adds)
            setName('');
            setAmount('');
            setStartAge(retirementAge);
            setEndAge(retirementAge + 5);
        }
    };

    const handlePrepopulate = () => {
        const demo: AdditionalIncome[] = [
            {
                id: 'demo-1',
                name: 'Consulting',
                amount: 15000,
                startAge: retirementAge,
                endAge: retirementAge + 5,
                taxAsDividend: false
            },
            {
                id: 'demo-2',
                name: 'Company Dividends',
                amount: 20000,
                startAge: currentAge,
                endAge: 65,
                taxAsDividend: true
            }
        ];
        onChange([...incomes, ...demo]);
    };

    const removeMaximum = (id: string) => {
        onChange(incomes.filter(i => i.id !== id));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-sm w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <TrendingUp size={20} /> Additional Income Streams
                    </h2>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">

                    {/* Intro */}
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-sm border border-slate-200">
                        Add income sources outside your main salary. Examples: Consulting, side hustles, dividends from shares or business ownership, part-time work, or rental income not tied to a property.
                    </div>

                    {/* Add Form */}
                    <div className="bg-slate-50 p-4 rounded-sm border border-slate-200">
                        <h3 className="text-xs font-bold text-emerald-800 uppercase mb-3">Add New Income Stream</h3>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500">Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Consulting, eBay Sales"
                                    className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:border-emerald-500"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500">Annual Amount (£)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:border-emerald-500"
                                    value={amount}
                                    onChange={e => setAmount(Number(e.target.value))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Start Age</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:border-emerald-500"
                                        value={startAge}
                                        onChange={e => setStartAge(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500">End Age</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:border-emerald-500"
                                        value={endAge}
                                        onChange={e => setEndAge(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Tax Treatment Checkbox */}
                            <label className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-100 rounded cursor-pointer hover:bg-purple-100 transition">
                                <input
                                    type="checkbox"
                                    checked={taxAsDividend}
                                    onChange={e => setTaxAsDividend(e.target.checked)}
                                    className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                                />
                                <div className="flex items-center gap-1.5">
                                    <PiggyBank size={14} className="text-purple-600" />
                                    <span className="text-xs font-medium text-slate-700">Tax as dividend income</span>
                                </div>
                                <span className="text-[10px] text-slate-500 ml-auto">£500 allowance</span>
                            </label>

                            <button
                                onClick={handleAdd}
                                disabled={!name || !amount}
                                className={`w-full py-2 text-white rounded-sm font-bold text-xs disabled:opacity-50 transition shadow-sm mt-2 flex items-center justify-center gap-2 ${editIncome ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                            >
                                {editIncome ? <CheckCircle size={14} /> : <Plus size={14} />}
                                {editIncome ? 'Update Income Stream' : '+ Add Income Stream'}
                            </button>
                        </div>
                    </div>

                    {/* Demo Button */}
                    {incomes.length === 0 && (
                        <button
                            onClick={handlePrepopulate}
                            className="w-full py-2 border border-dashed border-emerald-300 text-emerald-700 rounded-sm text-xs font-medium hover:bg-emerald-50 transition"
                        >
                            + Add Example Income Streams
                        </button>
                    )}



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
