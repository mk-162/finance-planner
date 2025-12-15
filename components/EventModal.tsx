

import React, { useState } from 'react';
import { FinancialEvent } from '../types';
import { X, Plus, Trash2, Calendar, Repeat, ArrowRight, Wallet, CheckCircle } from 'lucide-react';

interface EventModalProps {
    events: FinancialEvent[];
    onChange: (events: FinancialEvent[]) => void;
    isOpen: boolean;
    onClose: () => void;
    editEvent?: FinancialEvent | null; // New prop
}

export const EventModal: React.FC<EventModalProps> = ({ events, onChange, isOpen, onClose, editEvent }) => {
    const [activeTab, setActiveTab] = useState<'one-off' | 'recurring'>('one-off');

    const [newEvent, setNewEvent] = useState<Partial<FinancialEvent>>({
        name: '',
        age: 60,
        endAge: 63,
        amount: 10000,
        type: 'expense',
        taxType: 'tax_free', // Default
        isRecurring: false
    });

    // Populate form on open/change of editEvent
    React.useEffect(() => {
        if (isOpen) {
            if (editEvent) {
                setNewEvent({ ...editEvent });
                setActiveTab(editEvent.isRecurring ? 'recurring' : 'one-off');
            } else {
                // Reset to defaults for add mode
                setNewEvent({
                    name: '',
                    age: 60,
                    endAge: 63,
                    amount: 10000,
                    type: 'expense',
                    taxType: 'tax_free',
                    isRecurring: false
                });
                setActiveTab('one-off');
            }
        }
    }, [isOpen, editEvent]);

    if (!isOpen) return null;

    const handleAdd = () => {
        if (!newEvent.name || !newEvent.amount) return;

        const isRecurring = activeTab === 'recurring';
        const finalEndAge = isRecurring ? (newEvent.endAge || (newEvent.age! + 1)) : undefined;

        const eventData: FinancialEvent = {
            id: editEvent ? editEvent.id : Math.random().toString(36).substr(2, 9), // Keep ID if editing
            name: newEvent.name || '',
            age: newEvent.age || 60,
            endAge: finalEndAge,
            amount: newEvent.amount || 0,
            type: newEvent.type as 'expense' | 'income',
            isRecurring: isRecurring,
            taxType: newEvent.type === 'income' ? (newEvent.taxType || 'tax_free') : undefined
        };

        if (editEvent) {
            // Update existing
            onChange(events.map(e => e.id === editEvent.id ? eventData : e));
        } else {
            // Create new
            onChange([...events, eventData]);
        }

        if (!editEvent) {
            // Only reset if creating (keep form if editing? No, close likely calls parent which closes modal)
            setNewEvent({
                name: '',
                age: 60,
                endAge: 63,
                amount: 10000,
                type: 'expense',
                taxType: 'tax_free',
                isRecurring: false
            });
        }
        // Optional: Close modal automatically on save? The user might want to add multiple. 
        // For edit, we definitely want to close or at least clear edit mode.
        // But App.tsx controls modal state. 
        // Let's assume user manually closes or we rely on parent to close. 
        // Actually, for "Add", we usually reset. For "Update", we usually close.
        if (editEvent) {
            onClose();
        }
    };

    const loadPreset = (name: string, type: 'expense' | 'income', recurring: boolean, years: number = 0, taxType?: 'tax_free' | 'taxable_income' | 'capital_gains' | 'dividend' | 'residential_property') => {
        setActiveTab(recurring ? 'recurring' : 'one-off');
        setNewEvent({
            name: name,
            type: type,
            amount: type === 'expense' ? 15000 : 50000,
            age: 60,
            endAge: 60 + years,
            isRecurring: recurring,
            taxType: taxType || 'tax_free'
        });
    };

    const handleRemove = (id: string) => {
        onChange(events.filter(e => e.id !== id));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Calendar size={20} className="text-blue-600" />
                        Financial Events
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">

                    {/* Presets */}
                    <div className="mb-6 space-y-3">
                        {/* Windfalls Section */}
                        <div>
                            <label className="text-[10px] font-bold text-green-600 uppercase mb-1.5 block flex items-center gap-1">
                                <Wallet size={12} /> Windfalls (Money Coming In)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => loadPreset('Inheritance', 'income', false, 0, 'tax_free')} className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-xs rounded-sm text-green-700 border border-green-100 font-medium">💰 Inheritance</button>
                                <button onClick={() => loadPreset('Sell Property', 'income', false, 0, 'residential_property')} className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-xs rounded-sm text-green-700 border border-green-100 font-medium">🏠 Sell Property</button>
                                <button onClick={() => loadPreset('Sell Shares/Assets', 'income', false, 0, 'capital_gains')} className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-xs rounded-sm text-green-700 border border-green-100 font-medium">📈 Sell Investments</button>
                                <button onClick={() => loadPreset('Downsizing', 'income', false, 0, 'tax_free')} className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-xs rounded-sm text-green-700 border border-green-100 font-medium">🏡 Downsizing</button>
                                <button onClick={() => loadPreset('Bonus / Lump Sum', 'income', false, 0, 'taxable_income')} className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-xs rounded-sm text-green-700 border border-green-100 font-medium">🎁 Bonus</button>
                            </div>
                        </div>

                        {/* Expenses Section */}
                        <div>
                            <label className="text-[10px] font-bold text-red-500 uppercase mb-1.5 block">Big Expenses</label>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => loadPreset('University Fees', 'expense', true, 3)} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs rounded-sm text-slate-700 border border-slate-200 font-medium">🎓 Uni Fees (3yr)</button>
                                <button onClick={() => loadPreset('Wedding', 'expense', false)} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs rounded-sm text-slate-700 border border-slate-200 font-medium">💍 Wedding</button>
                                <button onClick={() => loadPreset('New Car', 'expense', false)} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs rounded-sm text-slate-700 border border-slate-200 font-medium">🚗 New Car</button>
                                <button onClick={() => loadPreset('Home Renovation', 'expense', false)} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs rounded-sm text-slate-700 border border-slate-200 font-medium">🔨 Renovation</button>
                                <button onClick={() => loadPreset('Care Costs', 'expense', true, 5)} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs rounded-sm text-slate-700 border border-slate-200 font-medium">🏥 Care Costs</button>
                            </div>
                        </div>
                    </div>

                    {/* Add New Form */}
                    <div className="bg-slate-50 p-4 rounded-sm mb-6 border border-slate-200 shadow-sm">

                        {/* Tabs */}
                        <div className="flex bg-white p-1 rounded-sm border border-slate-200 mb-4">
                            <button
                                onClick={() => setActiveTab('one-off')}
                                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition ${activeTab === 'one-off' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                One-off
                            </button>
                            <button
                                onClick={() => setActiveTab('recurring')}
                                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition ${activeTab === 'recurring' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Yearly (age range)
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <input
                                type="text"
                                placeholder="Name (e.g. New Car)"
                                className="col-span-2 text-sm p-2 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newEvent.name}
                                onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                            />

                            <select
                                className="text-sm p-2 rounded border border-slate-300 bg-white"
                                value={newEvent.type}
                                onChange={e => setNewEvent({ ...newEvent, type: e.target.value as 'expense' | 'income' })}
                            >
                                <option value="expense">Expense (-)</option>
                                <option value="income">Income (+)</option>
                            </select>

                            <div className="flex items-center bg-white border border-slate-300 rounded px-2">
                                <span className="text-slate-500 text-xs mr-1 font-bold">£</span>
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    className="w-full text-sm p-2 outline-none"
                                    value={newEvent.amount}
                                    onChange={e => setNewEvent({ ...newEvent, amount: Number(e.target.value) })}
                                />
                            </div>

                            {/* Tax Type (Only for Income) */}
                            {newEvent.type === 'income' && (
                                <div className="col-span-2">
                                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Tax Treatment</label>
                                    <select
                                        className="w-full text-sm p-2 rounded border border-slate-300 bg-white"
                                        value={newEvent.taxType}
                                        onChange={e => setNewEvent({ ...newEvent, taxType: e.target.value as any })}
                                    >
                                        <option value="tax_free">Tax Free (Inheritance, Gift, ISA)</option>
                                        <option value="taxable_income">Income Tax (Bonus, Consultancy)</option>
                                        <option value="dividend">Dividend (Business Owner)</option>
                                        <option value="capital_gains">Capital Gains (Asset Disposal)</option>
                                        <option value="residential_property">Residential Property (18%/24%)</option>
                                    </select>
                                </div>
                            )}

                            <div className="col-span-2 grid grid-cols-2 gap-3 items-center">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">
                                        {activeTab === 'recurring' ? 'Start Age' : 'Age'}
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newEvent.age}
                                        onChange={e => setNewEvent({ ...newEvent, age: Number(e.target.value) })}
                                    />
                                </div>

                                {activeTab === 'recurring' && (
                                    <div className="flex flex-col gap-1 relative">
                                        <label className="text-[10px] uppercase font-bold text-slate-500">End Age</label>
                                        <input
                                            type="number"
                                            className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={newEvent.endAge}
                                            onChange={e => setNewEvent({ ...newEvent, endAge: Number(e.target.value) })}
                                        />
                                        <div className="absolute -left-3 top-7 text-slate-300">
                                            <ArrowRight size={14} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleAdd}
                            className={`w-full text-white text-sm font-medium py-2 rounded transition flex items-center justify-center gap-2 mt-2 ${editEvent ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                        >
                            {editEvent ? <CheckCircle size={16} /> : <Plus size={16} />}
                            {editEvent ? 'Update Event' : `Add ${activeTab === 'recurring' ? 'Recurring' : 'Event'}`}
                        </button>
                    </div>

                    {/* List */}
                    <div className="space-y-2">
                        {events.length === 0 && (
                            <p className="text-center text-slate-400 text-sm py-4">No events added yet.</p>
                        )}
                        {events.map(event => (
                            <div key={event.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-sm shadow-sm">
                                <div>
                                    <div className="font-medium text-slate-800 text-sm flex items-center gap-2">
                                        {event.name}
                                        {event.isRecurring && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1"><Repeat size={10} /> Range</span>}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-x-2">
                                        <span>
                                            {event.isRecurring
                                                ? `Ages ${event.age} - ${event.endAge}`
                                                : `Age ${event.age}`
                                            }
                                        </span>
                                        <span className={`font-semibold ${event.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {event.type === 'income' ? '+' : '-'}£{event.amount.toLocaleString()}{event.isRecurring ? '/yr' : ''}
                                        </span>
                                    </div>
                                    {event.type === 'income' && event.taxType && (
                                        <div className="mt-1">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${event.taxType === 'tax_free' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                event.taxType === 'taxable_income' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                    event.taxType === 'dividend' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                        'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                {event.taxType === 'tax_free' ? 'Tax Free' :
                                                    event.taxType === 'taxable_income' ? 'Taxable Income' :
                                                        event.taxType === 'dividend' ? 'Dividend' :
                                                            event.taxType === 'capital_gains' ? 'Capital Gains' :
                                                                'Property Tax'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleRemove(event.id)}
                                    className="text-slate-400 hover:text-red-500 p-2"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
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
        </div>
    );
};