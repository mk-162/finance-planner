import React, { useState } from 'react';
import { DefinedBenefitPension } from '../types';
import { X, Plus, Trash2, ShieldCheck } from 'lucide-react';

interface DBPensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pensions: DefinedBenefitPension[];
  onUpdate: (pensions: DefinedBenefitPension[]) => void;
  currentAge: number;
}

export const DBPensionModal: React.FC<DBPensionModalProps> = ({
    isOpen, onClose, pensions, onUpdate, currentAge
}) => {
  const [newDB, setNewDB] = useState<Partial<DefinedBenefitPension>>({
      name: '', annualIncome: 10000, startAge: 65, inflationLinked: true
  });

  if (!isOpen) return null;

  const handleAdd = () => {
      if(!newDB.name || !newDB.annualIncome) return;
      onUpdate([...pensions, {
          id: Math.random().toString(36).substr(2,9),
          name: newDB.name,
          annualIncome: newDB.annualIncome,
          startAge: newDB.startAge || 65,
          inflationLinked: newDB.inflationLinked ?? true
      }]);
      setNewDB({ name: '', annualIncome: 10000, startAge: 65, inflationLinked: true });
  };

  // Common DB pension presets
  const presets = [
    { name: 'NHS Pension', icon: '🏥' },
    { name: 'Teachers Pension', icon: '📚' },
    { name: 'Civil Service', icon: '🏛️' },
    { name: 'Local Government', icon: '🏢' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-green-600 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck size={20} />
            Final Salary Pensions (DB)
          </h2>
          <button onClick={onClose} className="text-green-200 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
            <p className="text-sm text-slate-600 mb-4">
                Defined Benefit pensions pay a guaranteed income for life. Add any workplace pensions that promise a specific annual amount.
            </p>

            {/* Quick Presets */}
            <div className="mb-4">
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Quick Add</label>
                <div className="flex flex-wrap gap-2">
                    {presets.map(preset => (
                        <button
                            key={preset.name}
                            onClick={() => setNewDB({...newDB, name: preset.name})}
                            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs rounded-lg text-slate-700 border border-slate-200 font-medium"
                        >
                            {preset.icon} {preset.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200">
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                        type="text"
                        placeholder="Pension name"
                        className="col-span-2 text-sm p-2.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-green-100"
                        value={newDB.name}
                        onChange={e => setNewDB({...newDB, name: e.target.value})}
                    />
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Annual Income</label>
                        <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                            <input
                                type="number"
                                className="w-full text-sm p-2.5 pl-6 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-green-100"
                                value={newDB.annualIncome}
                                onChange={e => setNewDB({...newDB, annualIncome: Number(e.target.value)})}
                            />
                        </div>
                        <span className="text-[10px] text-slate-400">per year, before tax</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Starts at Age</label>
                        <input
                            type="number"
                            className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-green-100"
                            value={newDB.startAge}
                            onChange={e => setNewDB({...newDB, startAge: Number(e.target.value)})}
                        />
                        <span className="text-[10px] text-slate-400">when payments begin</span>
                    </div>
                    <div className="col-span-2">
                        <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                            <input
                                type="checkbox"
                                checked={newDB.inflationLinked}
                                onChange={e => setNewDB({...newDB, inflationLinked: e.target.checked})}
                                className="rounded text-green-600 w-4 h-4"
                            />
                            <div>
                                <span className="text-sm font-medium text-slate-700">Index Linked</span>
                                <p className="text-[10px] text-slate-500">Pension increases with inflation each year</p>
                            </div>
                        </label>
                    </div>
                </div>
                <button
                    onClick={handleAdd}
                    className="w-full bg-green-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> Add Pension
                </button>
            </div>

            <div className="space-y-2">
                {pensions.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-4 border border-dashed border-slate-200 rounded-lg">
                        No defined benefit pensions added yet.
                    </p>
                )}
                {pensions.map(d => (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-lg">
                                <ShieldCheck size={16} className="text-green-600" />
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                                    {d.name}
                                    {d.inflationLinked && (
                                        <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                                            Index Linked
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-slate-500">
                                    £{d.annualIncome.toLocaleString()}/year from age {d.startAge}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => onUpdate(pensions.filter(x => x.id !== d.id))}
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
