

import React, { useState, useEffect } from 'react';
import { InvestmentProperty, DefinedBenefitPension } from '../types';
import { X, Plus, Trash2, Building, Briefcase } from 'lucide-react';

interface AdvancedAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: InvestmentProperty[];
  dbPensions: DefinedBenefitPension[];
  onUpdateProperties: (props: InvestmentProperty[]) => void;
  onUpdateDBPensions: (dbs: DefinedBenefitPension[]) => void;
  currentAge: number;
  initialTab?: 'property' | 'pension';
}

export const AdvancedAssetsModal: React.FC<AdvancedAssetsModalProps> = ({ 
    isOpen, onClose, properties, dbPensions, onUpdateProperties, onUpdateDBPensions, currentAge, initialTab = 'property' 
}) => {
  const [activeTab, setActiveTab] = useState<'property' | 'pension'>('property');
  
  useEffect(() => {
      if (isOpen) {
          setActiveTab(initialTab);
      }
  }, [isOpen, initialTab]);

  // Property Form State
  const [newProp, setNewProp] = useState<Partial<InvestmentProperty>>({
      name: '', value: 250000, monthlyRent: 1200, growthRate: 3
  });

  // DB Pension Form State
  const [newDB, setNewDB] = useState<Partial<DefinedBenefitPension>>({
      name: '', annualIncome: 10000, startAge: 65, inflationLinked: true
  });

  if (!isOpen) return null;

  const handleAddProperty = () => {
      if(!newProp.name || !newProp.value) return;
      onUpdateProperties([...properties, {
          id: Math.random().toString(36).substr(2,9),
          name: newProp.name,
          value: newProp.value,
          monthlyRent: newProp.monthlyRent || 0,
          growthRate: newProp.growthRate || 0
      }]);
      setNewProp({ name: '', value: 250000, monthlyRent: 1200, growthRate: 3 });
  };

  const handleAddDB = () => {
      if(!newDB.name || !newDB.annualIncome) return;
      onUpdateDBPensions([...dbPensions, {
          id: Math.random().toString(36).substr(2,9),
          name: newDB.name,
          annualIncome: newDB.annualIncome,
          startAge: newDB.startAge || 65,
          inflationLinked: newDB.inflationLinked || true
      }]);
      setNewDB({ name: '', annualIncome: 10000, startAge: 65, inflationLinked: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            Other Assets & Income
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 bg-slate-50 border-b border-slate-200">
             <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                <button 
                    onClick={() => setActiveTab('property')}
                    className={`flex-1 text-xs font-semibold py-2 rounded-md transition flex items-center justify-center gap-2 ${activeTab === 'property' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Building size={14} /> Buy-to-Let / Property
                </button>
                <button 
                        onClick={() => setActiveTab('pension')}
                    className={`flex-1 text-xs font-semibold py-2 rounded-md transition flex items-center justify-center gap-2 ${activeTab === 'pension' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Briefcase size={14} /> Final Salary Pension
                </button>
            </div>
        </div>

        <div className="p-6 overflow-y-auto">
            
            {activeTab === 'property' ? (
                <>
                    <div className="bg-blue-50/50 p-4 rounded-xl mb-6 border border-blue-100">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <input type="text" placeholder="Name (e.g. London Flat)" className="col-span-2 text-sm p-2 rounded border border-slate-300 outline-none"
                                value={newProp.name} onChange={e => setNewProp({...newProp, name: e.target.value})}
                            />
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Value</label>
                                <input type="number" className="w-full text-sm p-2 border border-slate-300 rounded outline-none"
                                    value={newProp.value} onChange={e => setNewProp({...newProp, value: Number(e.target.value)})}
                                />
                            </div>
                             <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Monthly Rent</label>
                                <input type="number" className="w-full text-sm p-2 border border-slate-300 rounded outline-none"
                                    value={newProp.monthlyRent} onChange={e => setNewProp({...newProp, monthlyRent: Number(e.target.value)})}
                                />
                            </div>
                             <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Cap Growth %</label>
                                <input type="number" step={0.1} className="w-full text-sm p-2 border border-slate-300 rounded outline-none"
                                    value={newProp.growthRate} onChange={e => setNewProp({...newProp, growthRate: Number(e.target.value)})}
                                />
                            </div>
                        </div>
                        <button onClick={handleAddProperty} className="w-full bg-slate-900 text-white text-sm font-medium py-2 rounded hover:bg-slate-800 transition flex items-center justify-center gap-2 mt-2">
                            <Plus size={16} /> Add Property
                        </button>
                    </div>

                    <div className="space-y-2">
                         {properties.length === 0 && <p className="text-center text-slate-400 text-xs py-2">No properties added.</p>}
                         {properties.map(p => (
                             <div key={p.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                 <div>
                                     <div className="font-medium text-slate-800 text-sm">{p.name}</div>
                                     <div className="text-xs text-slate-500">Val: £{p.value.toLocaleString()} • Rent: £{p.monthlyRent}/mo</div>
                                 </div>
                                 <button onClick={() => onUpdateProperties(properties.filter(x => x.id !== p.id))} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                             </div>
                         ))}
                    </div>
                </>
            ) : (
                <>
                     <div className="bg-blue-50/50 p-4 rounded-xl mb-6 border border-blue-100">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <input type="text" placeholder="Name (e.g. NHS Pension)" className="col-span-2 text-sm p-2 rounded border border-slate-300 outline-none"
                                value={newDB.name} onChange={e => setNewDB({...newDB, name: e.target.value})}
                            />
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Annual Income</label>
                                <input type="number" className="w-full text-sm p-2 border border-slate-300 rounded outline-none"
                                    value={newDB.annualIncome} onChange={e => setNewDB({...newDB, annualIncome: Number(e.target.value)})}
                                />
                            </div>
                             <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Start Age</label>
                                <input type="number" className="w-full text-sm p-2 border border-slate-300 rounded outline-none"
                                    value={newDB.startAge} onChange={e => setNewDB({...newDB, startAge: Number(e.target.value)})}
                                />
                            </div>
                            <div className="col-span-2 flex items-center gap-2 mt-1">
                                <input type="checkbox" checked={newDB.inflationLinked} onChange={e => setNewDB({...newDB, inflationLinked: e.target.checked})} className="rounded text-blue-600"/>
                                <span className="text-xs text-slate-600">Index Linked (Grows with Inflation)</span>
                            </div>
                        </div>
                        <button onClick={handleAddDB} className="w-full bg-slate-900 text-white text-sm font-medium py-2 rounded hover:bg-slate-800 transition flex items-center justify-center gap-2 mt-2">
                            <Plus size={16} /> Add Pension
                        </button>
                    </div>

                     <div className="space-y-2">
                         {dbPensions.length === 0 && <p className="text-center text-slate-400 text-xs py-2">No pensions added.</p>}
                         {dbPensions.map(d => (
                             <div key={d.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                 <div>
                                     <div className="font-medium text-slate-800 text-sm flex items-center gap-1">
                                         {d.name}
                                         {d.inflationLinked && <span className="bg-green-100 text-green-700 text-[9px] px-1 rounded">Linked</span>}
                                     </div>
                                     <div className="text-xs text-slate-500">£{d.annualIncome.toLocaleString()}/yr • Starts Age {d.startAge}</div>
                                 </div>
                                 <button onClick={() => onUpdateDBPensions(dbPensions.filter(x => x.id !== d.id))} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                             </div>
                         ))}
                    </div>
                </>
            )}
            
        </div>
      </div>
    </div>
  );
};