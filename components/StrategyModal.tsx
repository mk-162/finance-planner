import React from 'react';
import { UserInputs, SurplusTarget } from '../types';
import { X, ArrowUp, ArrowDown, Wallet, ShieldCheck, Briefcase, Landmark } from 'lucide-react';

interface StrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputs: UserInputs;
  onUpdate: (key: keyof UserInputs, value: any) => void;
}

export const StrategyModal: React.FC<StrategyModalProps> = ({ isOpen, onClose, inputs, onUpdate }) => {
  if (!isOpen) return null;

  const currentOrder = inputs.surplusAllocationOrder && inputs.surplusAllocationOrder.length > 0
    ? inputs.surplusAllocationOrder
    : ['pension', 'isa', 'gia', 'cash'] as SurplusTarget[];

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...currentOrder];
    if (direction === 'up') {
        if (index === 0) return;
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    } else {
        if (index === newOrder.length - 1) return;
        [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    }
    onUpdate('surplusAllocationOrder', newOrder);
  };

  const getLabel = (target: SurplusTarget) => {
      switch(target) {
          case 'pension': return 'Workplace Pension';
          case 'isa': return 'Tax-Free Savings (ISA)';
          case 'gia': return 'Investment Account (GIA)';
          case 'cash': return 'Cash Savings';
          case 'mortgage': return 'Pay Off Mortgage Faster';
          default: return target;
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Wallet size={20} />
            Financial Strategy
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
            
            {/* Section 1: Surplus Allocation */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-800 uppercase mb-2">1. Where Extra Money Goes</h3>
                <p className="text-xs text-slate-500 mb-4">
                    If you have money left over each month, where should it go first?
                    Drag to reorder your priorities.
                </p>

                <div className="space-y-2">
                    {currentOrder.map((target, index) => (
                        <div key={target} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-sm shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                </div>
                                <span className="text-sm font-medium text-slate-700">{getLabel(target)}</span>
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => moveItem(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 text-slate-500"
                                >
                                    <ArrowUp size={16} />
                                </button>
                                <button 
                                    onClick={() => moveItem(index, 'down')}
                                    disabled={index === currentOrder.length - 1}
                                    className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 text-slate-500"
                                >
                                    <ArrowDown size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Section 2: Withdrawal Strategy */}
            <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase mb-2">2. How to Use Your Savings</h3>
                <p className="text-xs text-slate-500 mb-4">
                    When you stop working, which savings should you use first?
                </p>

                <div className="space-y-3">
                    {/* Strategy C: Simple - shown first for novices */}
                    <label className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition ${inputs.drawdownStrategy === 'standard' || !inputs.drawdownStrategy ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                        <div className="mt-0.5">
                            <input
                                type="radio"
                                name="drawdown"
                                className="text-emerald-600 focus:ring-emerald-500"
                                checked={inputs.drawdownStrategy === 'standard' || !inputs.drawdownStrategy}
                                onChange={() => onUpdate('drawdownStrategy', 'standard')}
                            />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Briefcase size={14} className="text-emerald-600"/> Simple & Straightforward
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Recommended</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Use your cash first, then investments, then pension. Easy to understand and manage.
                            </p>
                        </div>
                    </label>

                    {/* Strategy A: Tax Efficient Bridge */}
                    <label className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition ${inputs.drawdownStrategy === 'tax_efficient_bridge' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                        <div className="mt-0.5">
                            <input
                                type="radio"
                                name="drawdown"
                                className="text-blue-600 focus:ring-blue-500"
                                checked={inputs.drawdownStrategy === 'tax_efficient_bridge'}
                                onChange={() => onUpdate('drawdownStrategy', 'tax_efficient_bridge')}
                            />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <ShieldCheck size={14} className="text-blue-600"/> Pay Less Tax Overall
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Use your pension early when you can, keep your tax-free ISA for later years when you might need it more.
                            </p>
                        </div>
                    </label>

                    {/* Strategy B: Preserve Pension */}
                    <label className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition ${inputs.drawdownStrategy === 'preserve_pension' ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                        <div className="mt-0.5">
                            <input
                                type="radio"
                                name="drawdown"
                                className="text-amber-600 focus:ring-amber-500"
                                checked={inputs.drawdownStrategy === 'preserve_pension'}
                                onChange={() => onUpdate('drawdownStrategy', 'preserve_pension')}
                            />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Landmark size={14} className="text-amber-600"/> Keep Pension Growing
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Leave your pension untouched as long as possible. Good if you want to pass it on to family.
                            </p>
                        </div>
                    </label>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button 
                    onClick={onClose}
                    className="bg-slate-900 text-white px-6 py-2 rounded-sm text-sm font-medium hover:bg-slate-800 transition"
                >
                    Done
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};