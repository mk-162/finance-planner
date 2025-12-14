import React, { useState } from 'react';
import { InvestmentProperty } from '../types';
import { X, Plus, Trash2, Building } from 'lucide-react';

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: InvestmentProperty[];
  onUpdate: (props: InvestmentProperty[]) => void;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
    isOpen, onClose, properties, onUpdate
}) => {
  const [newProp, setNewProp] = useState<Partial<InvestmentProperty>>({
      name: '', value: 250000, monthlyRent: 1200, growthRate: 3
  });

  if (!isOpen) return null;

  const handleAdd = () => {
      if(!newProp.name || !newProp.value) return;
      onUpdate([...properties, {
          id: Math.random().toString(36).substr(2,9),
          name: newProp.name,
          value: newProp.value,
          monthlyRent: newProp.monthlyRent || 0,
          growthRate: newProp.growthRate || 0
      }]);
      setNewProp({ name: '', value: 250000, monthlyRent: 1200, growthRate: 3 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
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
                Add buy-to-let or investment properties. Rental income will be included in your projections.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200">
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                        type="text"
                        placeholder="Name (e.g. London Flat)"
                        className="col-span-2 text-sm p-2.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-100"
                        value={newProp.name}
                        onChange={e => setNewProp({...newProp, name: e.target.value})}
                    />
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Property Value</label>
                        <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                            <input
                                type="number"
                                className="w-full text-sm p-2.5 pl-6 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                                value={newProp.value}
                                onChange={e => setNewProp({...newProp, value: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Monthly Rent</label>
                        <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                            <input
                                type="number"
                                className="w-full text-sm p-2.5 pl-6 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                                value={newProp.monthlyRent}
                                onChange={e => setNewProp({...newProp, monthlyRent: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Annual Growth Rate</label>
                        <div className="relative">
                            <input
                                type="number"
                                step={0.1}
                                className="w-full text-sm p-2.5 pr-6 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                                value={newProp.growthRate}
                                onChange={e => setNewProp({...newProp, growthRate: Number(e.target.value)})}
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleAdd}
                    className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> Add Property
                </button>
            </div>

            <div className="space-y-2">
                {properties.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-4 border border-dashed border-slate-200 rounded-lg">
                        No investment properties added yet.
                    </p>
                )}
                {properties.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <Building size={16} className="text-blue-600" />
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800 text-sm">{p.name}</div>
                                <div className="text-xs text-slate-500">
                                    £{p.value.toLocaleString()} value • £{p.monthlyRent.toLocaleString()}/mo rent
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => onUpdate(properties.filter(x => x.id !== p.id))}
                            className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
            <button
                onClick={onClose}
                className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};
