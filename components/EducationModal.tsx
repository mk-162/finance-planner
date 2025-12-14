import React, { useState } from 'react';
import { EducationEvent } from '../types';
import { X, Plus, Trash2, GraduationCap } from 'lucide-react';

interface EducationModalProps {
  events: EducationEvent[];
  onChange: (events: EducationEvent[]) => void;
  isOpen: boolean;
  onClose: () => void;
  currentAge: number;
}

export const EducationModal: React.FC<EducationModalProps> = ({ events, onChange, isOpen, onClose, currentAge }) => {
  const [newEvent, setNewEvent] = useState<Partial<EducationEvent>>({
    name: '',
    startAge: currentAge,
    endAge: currentAge + 3,
    annualCost: 15000,
  });

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newEvent.name || !newEvent.annualCost) return;
    const event: EducationEvent = {
      id: Math.random().toString(36).substr(2, 9),
      name: newEvent.name,
      startAge: newEvent.startAge || currentAge,
      endAge: newEvent.endAge || currentAge + 3,
      annualCost: newEvent.annualCost,
    };
    onChange([...events, event]);
    setNewEvent({ name: '', startAge: currentAge, endAge: currentAge + 3, annualCost: 15000 });
  };

  const handleRemove = (id: string) => {
    onChange(events.filter(e => e.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="text-blue-600" />
            Education & Childcare
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Add New Form */}
          <div className="bg-blue-50 p-4 rounded-sm mb-6 border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Add New Cost</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Name (e.g. Uni Fees)"
                className="col-span-2 text-sm p-2 rounded border border-slate-300"
                value={newEvent.name}
                onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
              />

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase text-slate-500 font-bold">From (Your Age)</label>
                <input
                  type="number"
                  className="w-full text-sm p-2 border border-slate-300 rounded outline-none"
                  value={newEvent.startAge}
                  onChange={e => setNewEvent({ ...newEvent, startAge: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase text-slate-500 font-bold">Until (Your Age)</label>
                <input
                  type="number"
                  className="w-full text-sm p-2 border border-slate-300 rounded outline-none"
                  value={newEvent.endAge}
                  onChange={e => setNewEvent({ ...newEvent, endAge: Number(e.target.value) })}
                />
              </div>

              <div className="flex items-center bg-white border border-slate-300 rounded px-2 col-span-2">
                <span className="text-slate-500 text-xs mr-1">£</span>
                <input
                  type="number"
                  placeholder="Annual Cost"
                  className="w-full text-sm p-2 outline-none"
                  value={newEvent.annualCost}
                  onChange={e => setNewEvent({ ...newEvent, annualCost: Number(e.target.value) })}
                />
                <span className="text-slate-400 text-xs ml-1">/yr</span>
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Cost
            </button>
          </div>

          {/* List */}
          <div className="space-y-2">
            {events.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-4">No education costs added yet.</p>
            )}
            {events.map(event => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-sm shadow-sm">
                <div>
                  <div className="font-medium text-slate-800 text-sm">{event.name}</div>
                  <div className="text-xs text-slate-500">
                    Ages {event.startAge} - {event.endAge} • <span className="text-red-600">-£{event.annualCost.toLocaleString()}/yr</span>
                  </div>
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