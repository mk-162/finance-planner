import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, TrendingUp, Calendar } from 'lucide-react';
import { AdditionalIncome } from '../types';

interface AdditionalIncomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    incomes: AdditionalIncome[];
    onChange: (updated: AdditionalIncome[]) => void;
    currentAge: number;
    retirementAge: number;
}

export const AdditionalIncomeModal: React.FC<AdditionalIncomeModalProps> = ({
    isOpen, onClose, incomes, onChange, currentAge, retirementAge
}) => {

    // Local State for Form
    const [name, setName] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [startAge, setStartAge] = useState<number>(retirementAge);
    const [endAge, setEndAge] = useState<number>(retirementAge + 5);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setStartAge(retirementAge);
            setEndAge(retirementAge + 5);
        }
    }, [isOpen, retirementAge]);

    if (!isOpen) return null;

    const handleAdd = () => {
        if (!name || !amount) return;

        const newIncome: AdditionalIncome = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            amount: Number(amount),
            startAge,
            endAge
        };

        onChange([...incomes, newIncome]);

        // Reset Form
        setName('');
        setAmount('');
        setStartAge(retirementAge);
        setEndAge(retirementAge + 5);
    };

    const handlePrepopulate = () => {
        const demo: AdditionalIncome[] = [
            {
                id: 'demo-1',
                name: 'Consulting',
                amount: 15000,
                startAge: retirementAge,
                endAge: retirementAge + 5
            },
            {
                id: 'demo-2',
                name: 'Board Position',
                amount: 8000,
                startAge: retirementAge + 2,
                endAge: retirementAge + 10
            }
        ];
        onChange([...incomes, ...demo]);
    };

    const removeMaximum = (id: string) => {
        onChange(incomes.filter(i => i.id !== id));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

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
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        Add income sources that happen outside your main salary. Examples: Side hustles, consulting, part-time work, or rental income not tied to a property.
                    </div>

                    {/* Add Form */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
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

                            <button
                                onClick={handleAdd}
                                disabled={!name || !amount}
                                className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm mt-2"
                            >
                                + Add Income Stream
                            </button>
                        </div>
                    </div>

                    {/* Demo Button */}
                    {incomes.length === 0 && (
                        <button
                            onClick={handlePrepopulate}
                            className="w-full py-2 border border-dashed border-emerald-300 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-50 transition"
                        >
                            + Add Example "Semi-Retirement" Portfolio
                        </button>
                    )}

                    {/* List */}
                    <div className="space-y-2">
                        {incomes.map(item => (
                            <div key={item.id} className="bg-white border-l-4 border-emerald-500 rounded p-3 shadow-sm flex justify-between items-center group">
                                <div>
                                    <div className="font-bold text-slate-800">{item.name}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                        <Calendar size={12} /> Age {item.startAge} - {item.endAge}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="font-bold text-emerald-700">£{item.amount.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-400">/year</div>
                                    </div>
                                    <button
                                        onClick={() => removeMaximum(item.id)}
                                        className="text-slate-300 hover:text-red-500 transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};
