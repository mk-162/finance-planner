

import React, { useRef, useState, useEffect } from 'react';
import { UserInputs, Scenario } from '../types';
import { calculateProjection } from '../services/calculationEngine'; // Import engine
import { X, Download, Upload, AlertTriangle, CheckCircle, RefreshCw, Plus, Trash2, Edit2, Check, User, Save, List, FileJson, Settings as SettingsIcon } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    scenarios: Scenario[];
    activeScenarioId: string;
    onSelectScenario: (id: string) => void;
    onAddScenario: () => void;
    onDeleteScenario: (id: string) => void;
    onRenameScenario: (id: string, name: string) => void;
    currentBirthYear: number;
    onUpdateBirthYear: (year: number) => void;
    onImport: (scenarios: Scenario[]) => void;
    onResetOnboarding?: () => void;
    initialTab?: 'plan' | 'scenarios' | 'data';
}

// Helper to fill in missing fields from legacy data
const sanitizeInputs = (input: any): UserInputs => {
    // Default structure to fallback on
    const defaults: UserInputs = {
        birthYear: 1984, currentAge: 40, retirementAge: 65, hasSemiRetirement: false, semiRetirementAge: 65,
        semiRetirementIncome: 20000, pensionAccessAge: 57, lifeExpectancy: 90, currentSalary: 60000,
        dividendIncome: 0, hasSideHustle: false, additionalIncome: 0, isSalaryGross: true, salaryGrowth: 2.5,
        statePension: 11502, statePensionAge: 68, housingMode: 'mortgage', mortgageType: 'repayment',
        mortgageRateType: 'fixed', mortgagePayment: 1200, mortgageEndAge: 55, mortgageFinalPayment: 0,
        mortgageInterestRate: 3.5, rentAmount: 1500, rentInflation: 3, savingsCash: 20000, savingsISA: 50000,
        savingsGIA: 10000, savingsPension: 100000, contribCash: 200, contribISA: 500, contribGIA: 200,
        contribPension: 500, surplusAllocationOrder: ['pension', 'isa', 'gia', 'cash'],
        drawdownStrategy: 'tax_efficient_bridge', maxISAFromGIA: false, pensionLumpSumMode: 'drip',
        pensionLumpSumDestination: 'cash', annualSpending: 30000, spendingTaperAge: 75, spendingTaperRate: 1,
        inflation: 2.5, growthCash: 1, growthISA: 5, growthGIA: 5, growthPension: 5, pensionFees: 0.5, pensionTaxFreeCash: 25,
        pensionTaxRate: 20, events: [], loans: [], investmentProperties: [], dbPensions: [], mortgages: []
    };

    return {
        ...defaults,
        ...input,
        // Enforce arrays
        events: Array.isArray(input.events) ? input.events : [],
        loans: Array.isArray(input.loans) ? input.loans : [],
        investmentProperties: Array.isArray(input.investmentProperties) ? input.investmentProperties : [],
        dbPensions: Array.isArray(input.dbPensions) ? input.dbPensions : []
    };
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    scenarios,
    activeScenarioId,
    onSelectScenario,
    onAddScenario,
    onDeleteScenario,
    onRenameScenario,
    currentBirthYear,
    onUpdateBirthYear,
    onImport,
    onResetOnboarding,
    initialTab = 'plan'
}) => {
    const [activeTab, setActiveTab] = useState<'plan' | 'scenarios' | 'data'>('plan');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Rename state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');

    // Sync tab when opened
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    if (!isOpen) return null;

    const handleExport = () => {
        try {
            const exportData = {
                version: 2,
                exportedAt: new Date().toISOString(),
                scenarios: scenarios
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `retire-plan-scenarios-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setSuccess("All scenarios exported successfully!");
            setError(null);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Failed to export data.");
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = e.target?.result as string;
                const parsed = JSON.parse(json);

                let newScenarios: Scenario[] = [];

                // Check format
                if (parsed.scenarios && Array.isArray(parsed.scenarios)) {
                    // Version 2: Multi-scenario file
                    newScenarios = parsed.scenarios.map((s: any) => ({
                        ...s,
                        data: sanitizeInputs(s.data)
                    }));
                } else if (parsed.currentAge !== undefined) {
                    // Version 1: Legacy single file
                    newScenarios = [{
                        id: Math.random().toString(36).substr(2, 9),
                        name: 'Imported Plan',
                        data: sanitizeInputs(parsed),
                        createdAt: Date.now()
                    }];
                } else {
                    throw new Error("Unknown file format");
                }

                if (newScenarios.length === 0) {
                    throw new Error("Invalid data structure");
                }

                onImport(newScenarios);
                setSuccess(`Successfully imported ${newScenarios.length} scenarios!`);
                setError(null);
                setTimeout(() => setSuccess(null), 3000);

                // Reset file input
                if (fileInputRef.current) fileInputRef.current.value = '';
            } catch (err) {
                setError("Invalid JSON file. Please check the file and try again.");
                setSuccess(null);
            }
        };
        reader.readAsText(file);
    };

    const startRename = (scenario: Scenario) => {
        setEditingId(scenario.id);
        setTempName(scenario.name);
    };

    const saveRename = (id: string) => {
        if (tempName.trim()) {
            onRenameScenario(id, tempName.trim());
        }
        setEditingId(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="modal-glass rounded-sm shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center header-gradient text-white">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <SettingsIcon size={20} />
                        Settings
                    </h2>
                    <button onClick={onClose} className="btn-glass p-1.5 rounded-sm">
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex bg-slate-50 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('plan')}
                        className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'plan' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
                    >
                        <User size={16} /> Plan Details
                    </button>
                    <button
                        onClick={() => setActiveTab('scenarios')}
                        className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'scenarios' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
                    >
                        <List size={16} /> Scenarios
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'data' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Save size={16} /> Save / Load
                    </button>
                </div>

                <div className="p-6 overflow-y-auto min-h-[300px]">

                    {/* Tab 1: Personal Details */}
                    {activeTab === 'plan' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-2">Age Settings</h3>
                                <div className="bg-slate-50 p-4 rounded-sm border border-slate-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-semibold text-slate-700">Year of Birth</label>
                                        <span className="font-bold text-blue-600 bg-white shadow-sm border border-blue-100 px-2 py-0.5 rounded text-sm">
                                            {currentBirthYear}
                                        </span>
                                    </div>
                                    <input
                                        type="range" min={1955} max={2005} step={1}
                                        value={currentBirthYear}
                                        onChange={(e) => onUpdateBirthYear(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-sm appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                                        <span>1955</span>
                                        <span>2005</span>
                                    </div>
                                    <div className="text-right text-xs font-semibold text-slate-500 mt-1">
                                        Current Age: {new Date().getFullYear() - currentBirthYear}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    onClick={onResetOnboarding}
                                    className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-sm hover:bg-indigo-100 transition text-indigo-700 text-sm font-bold"
                                >
                                    <RefreshCw size={16} />
                                    Restart Setup Wizard
                                </button>
                                <p className="text-[10px] text-slate-400 text-center mt-2">
                                    Relaunches the welcome survey to reset your baseline.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Scenario Management */}
                    {activeTab === 'scenarios' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-xs text-slate-500">Create multiple plans to compare different retirements.</p>
                                <button
                                    onClick={onAddScenario}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded border border-blue-100"
                                >
                                    <Plus size={14} /> New Scenario
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {scenarios.map(s => (
                                    <div
                                        key={s.id}
                                        className={`flex items-center justify-between p-3 rounded-sm border transition ${s.id === activeScenarioId ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <input
                                                type="radio"
                                                checked={s.id === activeScenarioId}
                                                onChange={() => onSelectScenario(s.id)}
                                                className="text-blue-600 focus:ring-blue-500 flex-shrink-0"
                                            />

                                            {editingId === s.id ? (
                                                <div className="flex items-center gap-1 w-full max-w-[180px]">
                                                    <input
                                                        autoFocus
                                                        className="w-full text-sm px-2 py-1 border border-blue-300 rounded outline-none"
                                                        value={tempName}
                                                        onChange={e => setTempName(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && saveRename(s.id)}
                                                        onBlur={() => saveRename(s.id)}
                                                    />
                                                    <button onClick={() => saveRename(s.id)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check size={14} /></button>
                                                </div>
                                            ) : (
                                                <div className="min-w-0" onClick={() => onSelectScenario(s.id)}>
                                                    <div className="text-sm font-medium text-slate-800 truncate cursor-pointer hover:text-blue-700 transition" title={s.name}>
                                                        {s.name}
                                                    </div>

                                                    {/* Headline Metrics Grid */}
                                                    <div className="grid grid-cols-4 gap-2 mt-2">
                                                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Retire Age</div>
                                                            <div className="text-xs font-bold text-slate-700">{s.data.retirementAge}</div>
                                                        </div>
                                                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Legacy</div>
                                                            <div className="text-xs font-bold text-slate-700">
                                                                {(() => {
                                                                    // Lite calculation for display
                                                                    const res = calculateProjection({ ...s.data, currentAge: new Date().getFullYear() - (s.data.birthYear || 1984) });
                                                                    const last = res[res.length - 1];
                                                                    return last ? `£${(last.totalNetWorth / 1000000).toFixed(1)}m` : '-';
                                                                })()}
                                                            </div>
                                                        </div>
                                                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Income</div>
                                                            <div className="text-xs font-bold text-slate-700">£{(s.data.currentSalary / 1000).toFixed(0)}k</div>
                                                        </div>
                                                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Life Exp</div>
                                                            <div className="text-xs font-bold text-slate-700">{s.data.lifeExpectancy}</div>
                                                        </div>
                                                    </div>

                                                    <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
                                                        <span>Created {new Date(s.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 pl-2">
                                            {editingId !== s.id && (
                                                <button
                                                    onClick={() => startRename(s)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                                    title="Rename"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            )}
                                            {scenarios.length > 1 && (
                                                <button
                                                    onClick={() => onDeleteScenario(s.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Data Management */}
                    {activeTab === 'data' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-3">Backup & Restore</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleExport}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-sm hover:bg-slate-50 transition text-slate-600 text-sm font-medium"
                                    >
                                        <Download size={24} className="text-blue-600" />
                                        Export JSON
                                    </button>

                                    <button
                                        onClick={handleImportClick}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-sm hover:bg-slate-50 transition text-slate-600 text-sm font-medium"
                                    >
                                        <Upload size={24} className="text-green-600" />
                                        Import JSON
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".json"
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-sm border border-slate-100 text-xs text-slate-500">
                                <p className="flex items-center gap-2 font-bold text-slate-600 mb-1">
                                    <FileJson size={14} />
                                    Local Storage
                                </p>
                                Your data is stored securely in your browser's local storage.
                                It never leaves your device unless you export it.
                                Clearing your browser cache will remove this data.
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-sm flex items-center gap-2">
                                    <AlertTriangle size={16} />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-3 bg-green-50 text-green-700 text-sm rounded-sm flex items-center gap-2">
                                    <CheckCircle size={16} />
                                    {success}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};