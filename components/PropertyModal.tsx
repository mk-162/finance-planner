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
            growthRate: newProp.growthRate || 0
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

                    <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 shadow-sm">
                        <div className="grid grid-cols-2 gap-3 mb-3">
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

                            {/* Growth Rate moved here to balance grid */}
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

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Monthly Rent</label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                                    <input
                                        type="number"
                                        className="w-full text-sm p-2.5 pl-6 border border-slate-300 rounded-sm outline-none focus:ring-2 focus:ring-blue-100"
                                        value={newProp.monthlyRent}
                                        onChange={e => setNewProp({ ...newProp, monthlyRent: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Monthly Costs</label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                                    <input
                                        type="number"
                                        className="w-full text-sm p-2.5 pl-6 border border-slate-300 rounded-sm outline-none focus:ring-2 focus:ring-blue-100"
                                        value={newProp.monthlyCost}
                                        onChange={e => setNewProp({ ...newProp, monthlyCost: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 text-right text-xs font-semibold text-slate-500">
                                Net Income: <span className="text-emerald-600">£{((newProp.monthlyRent || 0) - (newProp.monthlyCost || 0)).toLocaleString()}</span>/mo
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
