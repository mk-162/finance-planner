import React, { useState, useEffect } from 'react';
import { InvestmentProperty } from '../types';
import { X, Plus, Trash2, Building, CheckCircle } from 'lucide-react';

interface PropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    properties: InvestmentProperty[];
    onUpdate: (props: InvestmentProperty[]) => void;
    editProperty?: InvestmentProperty | null; // New prop
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
    isOpen, onClose, properties, onUpdate, editProperty
}) => {
    const [newProp, setNewProp] = useState<Partial<InvestmentProperty>>({
        name: '', value: 250000, monthlyRent: 1200, monthlyCost: 0, growthRate: 3
    });

    const [displayMode, setDisplayMode] = useState<'monthly' | 'yearly'>('monthly');

    // Populate / Reset
    useEffect(() => {
        if (isOpen) {
            if (editProperty) {
                setNewProp({ ...editProperty });
            } else {
                setNewProp({ name: '', value: 250000, monthlyRent: 1200, monthlyCost: 0, growthRate: 3 });
            }
        }
    }, [isOpen, editProperty]);

    if (!isOpen) return null;

    const handleAdd = () => {
        if (!newProp.name || !newProp.value) return;

        const propData: InvestmentProperty = {
            id: editProperty ? editProperty.id : Math.random().toString(36).substr(2, 9),
            name: newProp.name,
            value: newProp.value,
            monthlyRent: newProp.monthlyRent || 0,
            monthlyCost: newProp.monthlyCost || 0,
            growthRate: newProp.growthRate || 0,
            sellAge: newProp.sellAge,
            sellPrice: newProp.sellPrice
        };

        if (editProperty) {
            onUpdate(properties.map(p => p.id === editProperty.id ? propData : p));
            onClose();
        } else {
            onUpdate([...properties, propData]);
            setNewProp({ name: '', value: 250000, monthlyRent: 1200, monthlyCost: 0, growthRate: 3 });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-blue-600 text-white">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Building size={20} />
                        Investment Properties
                    </h2>
                    <button onClick={onClose} className="text-blue-200 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <p className="text-sm text-slate-600 mb-4">
                        Add buy-to-let or investment properties. Rental income (net of costs) will be included in your projections.
                    </p>

                    <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 shadow-sm space-y-4">

                        {/* Core Details */}
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="Name (e.g. London Flat)"
                                className="col-span-2 text-sm p-2.5 rounded-sm border border-slate-300 outline-none focus:ring-2 focus:ring-blue-100"
                                value={newProp.name}
                                onChange={e => setNewProp({ ...newProp, name: e.target.value })}
                            />
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Property Value</label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                                    <input
                                        type="number"
                                        className="w-full text-sm p-2.5 pl-6 border border-slate-300 rounded-sm outline-none focus:ring-2 focus:ring-blue-100"
                                        value={newProp.value}
                                        onChange={e => setNewProp({ ...newProp, value: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Growth Rate</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step={0.1}
                                        className="w-full text-sm p-2.5 pr-6 border border-slate-300 rounded-sm outline-none focus:ring-2 focus:ring-blue-100"
                                        value={newProp.growthRate}
                                        onChange={e => setNewProp({ ...newProp, growthRate: Number(e.target.value) })}
                                    />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Income & Costs */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Income & Costs</label>
                                <div className="flex bg-slate-200/50 rounded-lg p-0.5">
                                    <button
                                        onClick={() => setDisplayMode('monthly')}
                                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${displayMode === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        / Monthly
                                    </button>
                                    <button
                                        onClick={() => setDisplayMode('yearly')}
                                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${displayMode === 'yearly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        / Yearly
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400">
                                        {displayMode === 'monthly' ? 'Monthly Rent' : 'Annual Rent'}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                                        <input
                                            type="number"
                                            className="w-full text-sm p-2.5 pl-6 border border-slate-300 rounded-sm outline-none focus:ring-2 focus:ring-blue-100"
                                            value={displayMode === 'monthly' ? (newProp.monthlyRent || 0) : (newProp.monthlyRent || 0) * 12}
                                            onChange={e => {
                                                const val = Number(e.target.value);
                                                setNewProp({ ...newProp, monthlyRent: displayMode === 'monthly' ? val : val / 12 });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400">
                                        {displayMode === 'monthly' ? 'Monthly Costs' : 'Annual Costs'}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                                        <input
                                            type="number"
                                            className="w-full text-sm p-2.5 pl-6 border border-slate-300 rounded-sm outline-none focus:ring-2 focus:ring-blue-100"
                                            value={displayMode === 'monthly' ? (newProp.monthlyCost || 0) : (newProp.monthlyCost || 0) * 12}
                                            onChange={e => {
                                                const val = Number(e.target.value);
                                                setNewProp({ ...newProp, monthlyCost: displayMode === 'monthly' ? val : val / 12 });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="col-span-2 text-right text-xs font-semibold text-slate-500">
                                    Net Income: <span className="text-emerald-600">£{(((newProp.monthlyRent || 0) - (newProp.monthlyCost || 0)) * (displayMode === 'monthly' ? 1 : 12)).toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400 font-normal ml-0.5">/{displayMode === 'monthly' ? 'mo' : 'yr'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Planned Disposal */}
                        <div className="pt-2 border-t border-slate-200">
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">Planned Disposal (Optional)</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Sell at Age</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 65"
                                        className="w-full text-sm p-2.5 border border-slate-300 rounded-sm outline-none focus:ring-2 focus:ring-blue-100"
                                        value={newProp.sellAge || ''}
                                        onChange={e => setNewProp({ ...newProp, sellAge: e.target.value ? Number(e.target.value) : undefined })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Target Sale Value</label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                                        <input
                                            type="number"
                                            placeholder="Auto-calculated"
                                            className="w-full text-sm p-2.5 pl-6 border border-slate-300 rounded-sm outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
                                            value={newProp.sellPrice || ''}
                                            onChange={e => setNewProp({ ...newProp, sellPrice: e.target.value ? Number(e.target.value) : undefined })}
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2 text-[10px] text-slate-400 italic">
                                    Unspecified sale value defaults to current value + growth rate.
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleAdd}
                            className={`w-full text-white text-sm font-medium py-2.5 rounded-sm transition flex items-center justify-center gap-2 ${editProperty ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {editProperty ? <CheckCircle size={16} /> : <Plus size={16} />}
                            {editProperty ? 'Update Property' : 'Add Property'}
                        </button>
                    </div>

                    <p className="text-[10px] text-slate-400 text-center mt-3">
                        Note: Property appreciation, rent, and expenses are automatically mapped to inflation in the projection.
                    </p>

                </div>

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
