import React, { useState } from 'react';
import { X, ExternalLink, ShieldCheck, MapPin, AlertTriangle, TrendingUp } from 'lucide-react';

export type AdvisorContext = 'manual' | 'shortfall' | 'surplus';

interface AdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: AdvisorContext;
}

export const AdvisorModal: React.FC<AdvisorModalProps> = ({ isOpen, onClose, context }) => {
  const [postcode, setPostcode] = useState('');

  if (!isOpen) return null;

  const handleSearch = () => {
    const baseUrl = "https://www.unbiased.co.uk/advisers/financial-adviser";
    const url = postcode 
        ? `${baseUrl}?location=${encodeURIComponent(postcode)}` 
        : baseUrl;
    
    window.open(url, '_blank');
    onClose();
  };

  // Dynamic Content Configuration
  const getContent = () => {
    switch (context) {
        case 'shortfall':
            return {
                title: 'Projected Shortfall Warning',
                icon: <AlertTriangle className="text-red-500" size={28} />,
                headerBg: 'bg-red-900',
                accentColor: 'red',
                introText: "Your current scenario suggests your funds may run out earlier than expected. This is a significant risk.",
                introBg: 'bg-red-50 border-red-100 text-red-900'
            };
        case 'surplus':
            return {
                title: 'High Asset Value Alert',
                icon: <TrendingUp className="text-green-400" size={28} />,
                headerBg: 'bg-green-900',
                accentColor: 'green',
                introText: "Your projection shows a substantial legacy. Without planning, you could pay significant tax or hold funds inefficiently.",
                introBg: 'bg-green-50 border-green-100 text-green-900'
            };
        case 'manual':
        default:
            return {
                title: 'Sanity Check',
                icon: <ShieldCheck className="text-orange-500" size={28} />,
                headerBg: 'bg-slate-900',
                accentColor: 'orange',
                introText: "Retirement planning is complex. A regulated Independent Financial Adviser (IFA) can save you tax, optimize your pension, and give you peace of mind.",
                introBg: 'bg-orange-50 border-orange-100 text-orange-900'
            };
    }
  };

  const content = getContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className={`${content.headerBg} p-6 text-white relative overflow-hidden transition-colors duration-300`}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck size={120} />
            </div>
            <div className="relative z-10">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    {content.icon}
                    {content.title}
                </h2>
                <p className="text-slate-300 text-sm mt-1">Get a professional opinion on your numbers.</p>
            </div>
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
                <X size={24} />
            </button>
        </div>
        
        {/* Body */}
        <div className="p-6">
            <div className={`${content.introBg} border rounded-lg p-4 mb-6 transition-colors duration-300`}>
                <p className="text-sm font-medium">
                    {content.introText}
                </p>
            </div>

            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">Find a regulated adviser near you</label>
                
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Enter your postcode"
                            className={`w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-${content.accentColor}-500 focus:border-${content.accentColor}-500 outline-none transition`}
                            value={postcode}
                            onChange={(e) => setPostcode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                </div>

                <button 
                    onClick={handleSearch}
                    className={`w-full bg-${content.accentColor}-600 hover:bg-${content.accentColor}-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]`}
                >
                    Match with an Adviser <ExternalLink size={18} />
                </button>
                
                <div className="text-center pt-2">
                    <p className="text-xs text-slate-400">
                        You will be redirected to <span className="font-semibold text-slate-600">Unbiased.co.uk</span>
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};