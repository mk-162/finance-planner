

import React, { useState, useMemo, useEffect } from 'react';
import { UserInputs, FinancialEvent, Scenario } from './types';
import { calculateProjection } from './services/calculationEngine';
import { ResultsChart, AssetVisibility } from './components/ResultsChart';
import { SliderInput, NumberInput, SimpleFormattedInput } from './components/InputSection';
import { SmartInput } from './components/SmartInput';
import { EventModal } from './components/EventModal';
import { SettingsModal } from './components/SettingsModal';
import { AdvisorModal, AdvisorContext } from './components/AdvisorModal';
import { StrategyModal } from './components/StrategyModal';
import { OnboardingModal } from './components/OnboardingModal';
import { DebtModal } from './components/DebtModal';
import { PropertyModal } from './components/PropertyModal';
import { MortgageModal } from './components/MortgageModal';
import { DBPensionModal } from './components/DBPensionModal';
import { AdditionalIncomeModal } from './components/AdditionalIncomeModal';
import { AssetInput } from './components/AssetInput';
import {
    ChevronRight,
    ChevronDown,
    Wallet,
    TrendingUp,
    Calendar,
    AlertTriangle,
    Home,
    BarChart2,
    LineChart,
    Settings,
    Edit3,
    PieChart,
    UserCheck,
    Layers,
    Activity,
    Landmark,
    Building,
    Key,
    ArrowRight,
    ShieldCheck,
    Compass,
    ArrowUpRight,
    Briefcase,
    Sunset,
    CreditCard,
    Pencil,
    Plus,
    X
} from 'lucide-react';

// --- Accordion Component ---
const AccordionItem = ({ title, icon: Icon, children, isOpen, onToggle }: any) => {
    return (
        <div className="border-b border-slate-200 last:border-0">
            <button
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition"
                onClick={onToggle}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-md text-slate-600">
                        <Icon size={18} />
                    </div>
                    <span className="font-semibold text-slate-700">{title}</span>
                </div>
                {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
            </button>
            {isOpen && (
                <div className="p-4 bg-slate-50/50">
                    {children}
                </div>
            )}
        </div>
    );
};

const DEFAULT_INPUTS: UserInputs = {
    birthYear: 1984,
    currentAge: 40,
    retirementAge: 65,

    hasSemiRetirement: false,
    semiRetirementAge: 65,
    semiRetirementIncome: 20000,

    pensionAccessAge: 57,
    lifeExpectancy: 90,

    currentSalary: 60000,
    dividendIncome: 0,
    hasSideHustle: false,
    additionalIncome: 0,
    isSalaryGross: true,
    salaryGrowth: 2.5,

    statePension: 11502,
    statePensionAge: 68,

    // Housing Defaults
    housingMode: 'mortgage',
    mortgages: [], // New
    mortgageType: 'repayment',
    mortgageRateType: 'fixed',
    mortgagePayment: 1200,
    mortgageEndAge: 55,
    mortgageFinalPayment: 0,
    mortgageInterestRate: 3.5,
    rentAmount: 1500,
    rentInflation: 3,

    savingsCash: 20000,
    savingsISA: 50000,
    savingsGIA: 10000,
    savingsPension: 100000,

    // Contributions (Monthly)
    contribCash: 200,
    contribISA: 500,
    contribGIA: 200,
    contribPension: 500,

    // Strategy
    surplusAllocationOrder: ['pension', 'isa', 'gia', 'cash'],
    drawdownStrategy: 'tax_efficient_bridge',
    maxISAFromGIA: false,

    pensionLumpSumMode: 'drip',
    pensionLumpSumDestination: 'cash',

    annualSpending: 30000,
    spendingTaperAge: 75,
    spendingTaperRate: 1,

    inflation: 2.5,
    growthCash: 1,
    growthISA: 5,
    growthGIA: 5,
    growthPension: 5,

    pensionTaxFreeCash: 25,
    pensionTaxRate: 20,

    events: [],
    loans: [],

    investmentProperties: [],
    dbPensions: []
};

const FULL_STATE_PENSION = 11502;

const formatLargeMoney = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(2)}m`;
    if (value >= 10000) return `£${(value / 1000).toFixed(0)}k`;
    if (value >= 1000) return `£${(value / 1000).toFixed(1)}k`;
    return `£${value.toFixed(0)}`;
};

// Storage Key
const SCENARIOS_KEY = 'retireplan_scenarios_v2';

const App: React.FC = () => {
    // Scenario Management State
    const [scenarios, setScenarios] = useState<Scenario[]>(() => {
        // Auto-Load on startup
        try {
            const saved = localStorage.getItem(SCENARIOS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // DATA MIGRATION: Convert single mortgage to array if missing
                    return parsed.map((s: Scenario) => {
                        if (!s.data.mortgages && s.data.housingMode === 'mortgage' && s.data.mortgagePayment > 0) {
                            // Create a default mortgage from legacy data
                            s.data.mortgages = [{
                                id: 'legacy-1',
                                name: 'Main Home',
                                balance: (s.data.mortgagePayment * 12) * 15, // Rough estimate if balance missing
                                monthlyPayment: s.data.mortgagePayment,
                                interestRate: s.data.mortgageInterestRate || 3.5,
                                type: s.data.mortgageType || 'repayment',
                                endAge: s.data.mortgageEndAge || 60
                            }];
                        } else if (!s.data.mortgages) {
                            s.data.mortgages = [];
                        }
                        return s;
                    });
                }
            }
        } catch (e) { console.error("Failed to load scenarios", e); }
        return [{ id: '1', name: 'Master Plan', data: DEFAULT_INPUTS, createdAt: Date.now() }];
    });
    const [activeScenarioId, setActiveScenarioId] = useState<string>(scenarios[0].id);

    // Auto-Save Effect
    useEffect(() => {
        localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
    }, [scenarios]);

    // UI State
    const [activeSection, setActiveSection] = useState<string>('income');
    const [isEventModalOpen, setEventModalOpen] = useState(false);
    const [isDebtModalOpen, setDebtModalOpen] = useState(false);
    const [isPropertyModalOpen, setPropertyModalOpen] = useState(false);
    const [isMortgageModalOpen, setMortgageModalOpen] = useState(false); // New
    const [isAdditionalIncomeModalOpen, setAdditionalIncomeModalOpen] = useState(false); // New
    const [isDBPensionModalOpen, setDBPensionModalOpen] = useState(false);

    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'plan' | 'scenarios' | 'data'>('plan');
    const [isAdvisorModalOpen, setAdvisorModalOpen] = useState(false);
    const [isStrategyModalOpen, setStrategyModalOpen] = useState(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [advisorContext, setAdvisorContext] = useState<AdvisorContext>('manual');

    // Input UI Toggles
    const [paysFullNI, setPaysFullNI] = useState(true);

    // Mobile Navigation State
    const [mobileTab, setMobileTab] = useState<'inputs' | 'results'>('results');

    // Chart State
    const [chartMode, setChartMode] = useState<'cashflow' | 'assets'>('cashflow');
    const [isStacked, setIsStacked] = useState(true);
    const [assetVisibility, setAssetVisibility] = useState<AssetVisibility>({
        pension: true,
        isa: true,
        gia: true,
        cash: true,
        total: true
    });

    // Warnings State
    const [warningDismissed, setWarningDismissed] = useState(false);

    // Derived State
    const activeScenario = useMemo(() =>
        scenarios.find(s => s.id === activeScenarioId) || scenarios[0],
        [scenarios, activeScenarioId]);

    const inputs = activeScenario.data;

    // Calculate Current Age dynamically based on birthYear
    const calculatedAge = useMemo(() => {
        return new Date().getFullYear() - (inputs.birthYear || 1984);
    }, [inputs.birthYear]);

    // Merge Calculated Age into Inputs for the engine
    const engineInputs = useMemo(() => ({
        ...inputs,
        currentAge: calculatedAge,
        // If Semi-retirement is unchecked, ensure variables reflect that (same age as retirement)
        semiRetirementAge: inputs.hasSemiRetirement ? inputs.semiRetirementAge : inputs.retirementAge,
        // If Side Hustle is unchecked, ensure it's 0 for calc
        additionalIncome: inputs.hasSideHustle ? inputs.additionalIncome : 0
    }), [inputs, calculatedAge]);

    // Recalculate whenever inputs change
    const results = useMemo(() => calculateProjection(engineInputs), [engineInputs]);

    // Calculate summary stats
    const finalResult = results[results.length - 1];
    const totalNetWorthEnd = finalResult ? finalResult.totalNetWorth : 0;

    const shortfallYear = results.find(r => r.shortfall > 100);
    const fundsRunOutAge = shortfallYear ? shortfallYear.age : null;

    // Check NI status on load
    useEffect(() => {
        setPaysFullNI(inputs.statePension >= 11000);
    }, [activeScenarioId]);

    // --- Effects ---

    // Onboarding Trigger Check
    useEffect(() => {
        const hasOnboarded = localStorage.getItem('retireplan_has_onboarded_v2');
        if (!hasOnboarded) {
            const t = setTimeout(() => setIsOnboardingOpen(true), 500);
            return () => clearTimeout(t);
        }
    }, []);

    // MIGRATION: Additional Income Single -> Array
    useEffect(() => {
        if (inputs.additionalIncome > 0 && (!inputs.additionalIncomes || inputs.additionalIncomes.length === 0)) {
            // Migrate legacy field to new array
            const newIncome = {
                id: 'migrated-1',
                name: 'Side Income',
                amount: inputs.additionalIncome,
                startAge: inputs.additionalIncomeStartAge || inputs.retirementAge,
                endAge: inputs.additionalIncomeEndAge || (inputs.retirementAge + 5),
                inflationLinked: true
            };
            // Use updateInput but locally to avoid infinite loop or just set it
            // We need to commit this to the scenario
            const updatedIncomes = [newIncome];

            // We update the scenario directly, but we need to also clear the old field to prevent double counting 
            // (Though engine handles preference for array, safer to clear)
            setScenarios(prev => prev.map(s => {
                if (s.id === activeScenarioId) {
                    return {
                        ...s,
                        data: {
                            ...s.data,
                            additionalIncomes: updatedIncomes,
                            additionalIncome: 0 // Clear legacy
                        }
                    };
                }
                return s;
            }));
        }
    }, [inputs.additionalIncome, inputs.additionalIncomes, activeScenarioId]);

    // --- Actions ---

    const updateInput = (key: keyof UserInputs, value: any) => {
        setScenarios(prev => prev.map(s => {
            if (s.id === activeScenarioId) {
                return { ...s, data: { ...s.data, [key]: value } };
            }
            return s;
        }));
    };

    const handleOnboardingComplete = (newInputs: UserInputs) => {
        setScenarios(prev => prev.map(s => {
            if (s.id === activeScenarioId) {
                return { ...s, data: newInputs };
            }
            return s;
        }));
        setIsOnboardingOpen(false);
        localStorage.setItem('retireplan_has_onboarded_v2', 'true');
        setWarningDismissed(false);
    };

    const addScenario = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        const newScenario: Scenario = {
            id: newId,
            name: `${activeScenario.name} (Copy)`,
            data: { ...activeScenario.data }, // Deep copy inputs
            createdAt: Date.now()
        };
        setScenarios(prev => [...prev, newScenario]);
        setActiveScenarioId(newId);
    };

    const deleteScenario = (id: string) => {
        if (scenarios.length <= 1) return; // Prevent deleting last one
        const newScenarios = scenarios.filter(s => s.id !== id);
        setScenarios(newScenarios);
        // If we deleted the active one, switch to the first available
        if (id === activeScenarioId) {
            setActiveScenarioId(newScenarios[0].id);
        }
    };

    const renameScenario = (id: string, name: string) => {
        setScenarios(prev => prev.map(s =>
            s.id === id ? { ...s, name: name } : s
        ));
    };

    const toggleSection = (section: string) => {
        setActiveSection(activeSection === section ? '' : section);
    };

    const toggleAssetVisibility = (key: keyof AssetVisibility) => {
        setAssetVisibility(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const openManualAdvisor = () => {
        setAdvisorContext('manual');
        setAdvisorModalOpen(true);
    };

    // --- Render Components ---

    const renderSidebarContent = () => (
        <>
            <div className="flex-1 overflow-y-auto pb-20 md:pb-0">

                {/* PILLAR 1: INCOME */}
                <AccordionItem
                    title="Income & Earnings"
                    icon={TrendingUp}
                    isOpen={activeSection === 'income'}
                    onToggle={() => toggleSection('income')}
                >
                    <div className="space-y-3">
                        {/* Salary */}
                        <SmartInput
                            label="Employment Salary"
                            subLabel="Annual gross income"
                            value={inputs.currentSalary}
                            onChange={(v) => updateInput('currentSalary', v)}
                            min={0}
                            max={200000}
                            step={1000}
                            prefix="£"
                            rightLabel="Growth"
                            rightValue={inputs.salaryGrowth ?? 0}
                            onRightChange={(v) => updateInput('salaryGrowth', v)}
                            colorClass="blue"
                        >
                            <p className="text-[10px] text-slate-400">Stops at retirement age {inputs.retirementAge}</p>
                        </SmartInput>

                        {/* Dividend Income */}
                        <SmartInput
                            label="Dividend Income"
                            subLabel="Directors / Business owners"
                            value={inputs.dividendIncome || 0}
                            onChange={(v) => updateInput('dividendIncome', v)}
                            min={0}
                            max={100000}
                            step={1000}
                            prefix="£"
                            colorClass="purple"
                        >
                            <p className="text-[10px] text-slate-400">Taxed at dividend rates</p>
                        </SmartInput>

                        {/* Retirement Age Slider (Moved from Pensions) */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <SliderInput
                                label="Target Retirement Age"
                                min={45} max={80}
                                value={inputs.retirementAge}
                                onChange={v => {
                                    updateInput('retirementAge', v);
                                    if (v > inputs.semiRetirementAge && inputs.hasSemiRetirement) {
                                        updateInput('semiRetirementAge', v);
                                    }
                                    // Default end of additional income to retirement if not set
                                    if (!inputs.additionalIncomeEndAge) updateInput('additionalIncomeEndAge', v);
                                }}
                            />
                            <p className="text-[10px] text-slate-400 mt-2">Age when main salary stops.</p>
                        </div>

                        {/* Additional Income / Semi-Retirement */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-sm text-slate-800">Additional Income</div>
                                    <div className="text-[10px] text-slate-400">Side hustles, consulting, etc.</div>
                                </div>
                                <div className="text-right">
                                    {(inputs.additionalIncomes && inputs.additionalIncomes.length > 0) ? (
                                        <div className="font-bold text-lg text-emerald-600">
                                            £{inputs.additionalIncomes.reduce((acc, i) => acc + i.amount, 0).toLocaleString()}
                                        </div>
                                    ) : (
                                        <div className="font-bold text-lg text-slate-300">£0</div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setAdditionalIncomeModalOpen(true)}
                                className="w-full mt-2 text-xs text-blue-600 font-medium hover:bg-blue-50 py-1.5 rounded-lg transition border border-blue-100"
                            >
                                {inputs.additionalIncomes?.length > 0 ? 'Manage Incomes' : '+ Add Additional Income'}
                            </button>
                        </div>

                        {/* Rental Income */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-sm text-slate-800">Rental Income</div>
                                    <div className="text-[10px] text-slate-400">From investment properties</div>
                                </div>
                                <div className="text-right">
                                    {inputs.investmentProperties && inputs.investmentProperties.length > 0 ? (
                                        <div className="font-bold text-lg text-green-600">
                                            £{(inputs.investmentProperties.reduce((acc, p) => acc + (p.monthlyRent * 12), 0)).toLocaleString()}
                                        </div>
                                    ) : (
                                        <div className="font-bold text-lg text-slate-300">£0</div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setPropertyModalOpen(true)}
                                className="w-full mt-2 text-xs text-blue-600 font-medium hover:bg-blue-50 py-1.5 rounded-lg transition border border-blue-100"
                            >
                                {inputs.investmentProperties?.length > 0 ? 'Manage Properties' : '+ Add Rental Property'}
                            </button>
                        </div>

                        {/* Pension Drawdown - only show if over 57 */}
                        {calculatedAge >= inputs.pensionAccessAge && (
                            <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-start gap-3">
                                    <div className="bg-yellow-100 p-2 rounded-lg">
                                        <Landmark size={16} className="text-yellow-700" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm text-yellow-800">Pension Drawdown Available</div>
                                        <div className="text-[10px] text-yellow-700 mt-0.5">
                                            You can access your pension pot (£{(inputs.savingsPension / 1000).toFixed(0)}k).
                                            Configure withdrawals in the Strategy section.
                                        </div>
                                        <button
                                            onClick={() => setStrategyModalOpen(true)}
                                            className="text-xs text-yellow-800 font-bold mt-2 underline"
                                        >
                                            Configure Drawdown Strategy →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DB Pensions Summary */}
                        {inputs.dbPensions && inputs.dbPensions.length > 0 && (
                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-sm text-slate-800">Final Salary Pensions</div>
                                        <div className="text-[10px] text-slate-400">{inputs.dbPensions.length} pension(s) configured</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-lg text-green-600">
                                            £{inputs.dbPensions.reduce((acc, db) => acc + db.annualIncome, 0).toLocaleString()}
                                        </div>
                                        <div className="text-[10px] text-slate-400">per year</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDBPensionModalOpen(true)}
                                    className="w-full mt-2 text-xs text-blue-600 font-medium hover:bg-blue-50 py-1.5 rounded-lg transition border border-blue-100"
                                >
                                    Manage DB Pensions
                                </button>
                            </div>
                        )}
                    </div>
                </AccordionItem>

                {/* PILLAR 2: PENSIONS & RETIREMENT */}
                < AccordionItem
                    title="Pensions & Retirement"
                    icon={Sunset}
                    isOpen={activeSection === 'pension'}
                    onToggle={() => toggleSection('pension')}
                >
                    <SliderInput
                        label="Access Private Pension Age"
                        min={55} max={65}
                        value={inputs.pensionAccessAge}
                        onChange={v => updateInput('pensionAccessAge', v)}
                    />

                    {/* State Pension */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-600 uppercase">State Pension</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400">Full Amount?</span>
                                <input type="checkbox" checked={paysFullNI} onChange={e => {
                                    setPaysFullNI(e.target.checked);
                                    if (e.target.checked) updateInput('statePension', FULL_STATE_PENSION);
                                }} className="rounded text-blue-600" title="Full NI Contribution" />
                            </div>
                        </div>
                        {!paysFullNI ? (
                            <SmartInput
                                label="Expected Amount"
                                value={inputs.statePension}
                                onChange={(v) => updateInput('statePension', v)}
                                min={0} max={15000} step={500}
                                prefix="£"
                            />
                        ) : (
                            <div className="text-xs text-slate-500 italic">Assuming full amount (~£11.5k/yr) from age {inputs.statePensionAge}</div>
                        )}
                    </div>

                    {/* Private Pension Pots */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Pension Pots</p>

                        <div className="mb-4">
                            <AssetInput
                                label="Workplace Pension"
                                balance={inputs.savingsWorkplacePension ?? inputs.savingsPension}
                                contribution={inputs.contribWorkplacePension ?? inputs.contribPension}
                                growth={inputs.growthPension}
                                onUpdateBalance={(v) => {
                                    updateInput('savingsWorkplacePension', v);
                                    // Clear legacy to avoid double count if we move fully to new
                                    // But engine handles sum, so just setting new fields is enough
                                    if (v !== inputs.savingsPension) updateInput('savingsPension', 0);
                                }}
                                onUpdateContribution={(v) => {
                                    updateInput('contribWorkplacePension', v);
                                    if (v !== inputs.contribPension) updateInput('contribPension', 0);
                                }}
                                onUpdateGrowth={(v) => updateInput('growthPension', v)}
                                type="pension"
                                currentSalary={inputs.currentSalary}
                                colorClass="yellow"
                            />
                        </div>

                        <AssetInput
                            label="SIPP / Personal Pension"
                            balance={inputs.savingsSIPP ?? 0}
                            contribution={inputs.contribSIPP ?? 0}
                            growth={inputs.growthPension}
                            onUpdateBalance={(v) => updateInput('savingsSIPP', v)}
                            onUpdateContribution={(v) => updateInput('contribSIPP', v)}
                            onUpdateGrowth={(v) => updateInput('growthPension', v)}
                            type="pension"
                            colorClass="orange" // Distinguish visual
                        />

                        {/* 25% Tax Free Lump Sum Config */}
                        <div className="bg-yellow-50/50 border border-yellow-100 rounded-lg p-3 mt-2 flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-yellow-800">Tax Free Cash Strategy</div>
                                <div className="text-[10px] text-yellow-700">Take 25% tax free at {Math.max(inputs.retirementAge, inputs.pensionAccessAge)}?</div>
                            </div>
                            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                                <button
                                    onClick={() => updateInput('pensionLumpSumMode', 'drip')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${inputs.pensionLumpSumMode === 'drip' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Drip Feed
                                </button>
                                <button
                                    onClick={() => updateInput('pensionLumpSumMode', 'upfront')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${inputs.pensionLumpSumMode === 'upfront' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    All at Once
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Defined Benefit Pensions */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Final Salary (DB)</span>
                            <button
                                onClick={() => setDBPensionModalOpen(true)}
                                className="text-xs text-blue-600 font-medium hover:underline"
                            >
                                {inputs.dbPensions.length > 0 ? 'Manage DB Pensions' : '+ Add DB Pension'}
                            </button>
                        </div>

                        {inputs.dbPensions.length > 0 ? (
                            <div className="space-y-2 mb-2">
                                {inputs.dbPensions.map(db => (
                                    <div key={db.id} className="bg-white border border-slate-200 rounded-lg p-2 flex justify-between items-center text-xs shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-green-600" />
                                            <span className="font-semibold text-slate-700">{db.name}</span>
                                        </div>
                                        <div className="font-mono text-green-700">+£{(db.annualIncome / 1000).toFixed(1)}k/yr</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 italic">No Final Salary pensions</div>
                        )}
                    </div>
                </AccordionItem>

                {/* PILLAR 3: SAVINGS & DEBTS */}
                <AccordionItem
                    title="Assets & Liabilities"
                    icon={Wallet}
                    isOpen={activeSection === 'assets'}
                    onToggle={() => toggleSection('assets')}
                >
                    <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Liquid Assets</p>
                        {/* Note: Pension removed from here */}

                        <AssetInput
                            label="Tax-Free Savings (ISA)"
                            balance={inputs.savingsISA}
                            contribution={inputs.contribISA}
                            growth={inputs.growthISA}
                            onUpdateBalance={(v) => updateInput('savingsISA', v)}
                            onUpdateContribution={(v) => updateInput('contribISA', v)}
                            onUpdateGrowth={(v) => updateInput('growthISA', v)}
                            type="isa"
                            colorClass="indigo"
                        />

                        <AssetInput
                            label="Cash Savings"
                            balance={inputs.savingsCash}
                            contribution={inputs.contribCash}
                            growth={inputs.growthCash}
                            onUpdateBalance={(v) => updateInput('savingsCash', v)}
                            onUpdateContribution={(v) => updateInput('contribCash', v)}
                            onUpdateGrowth={(v) => updateInput('growthCash', v)}
                            type="standard"
                            colorClass="lime"
                        />

                        <AssetInput
                            label="Investment Account (GIA)"
                            subLabel="Stocks, funds, trading accounts"
                            balance={inputs.savingsGIA}
                            contribution={inputs.contribGIA}
                            growth={inputs.growthGIA}
                            onUpdateBalance={(v) => updateInput('savingsGIA', v)}
                            onUpdateContribution={(v) => updateInput('contribGIA', v)}
                            onUpdateGrowth={(v) => updateInput('growthGIA', v)}
                            type="standard"
                            colorClass="emerald"
                        />
                    </div>

                    {/* Fixed Assets (Properties) */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Fixed Assets</span>
                            <button
                                onClick={() => setPropertyModalOpen(true)}
                                className="text-xs text-blue-600 font-medium hover:underline"
                            >
                                {inputs.investmentProperties.length > 0 ? 'Manage Properties' : '+ Add Property'}
                            </button>
                        </div>

                        {inputs.investmentProperties.length > 0 ? (
                            <div className="space-y-2 mb-2">
                                {inputs.investmentProperties.map(p => (
                                    <div key={p.id} className="bg-white border border-slate-200 rounded-lg p-2 flex justify-between items-center text-xs shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <Building size={14} className="text-blue-500" />
                                            <span className="font-semibold text-slate-700">{p.name}</span>
                                        </div>
                                        <div className="font-mono text-slate-800">£{(p.value / 1000).toFixed(0)}k</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 italic">No investment properties</div>
                        )}
                    </div>

                    {/* Liabilities (Debts) */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Liabilities (Debt)</span>
                            <button
                                onClick={() => setDebtModalOpen(true)}
                                className="text-xs text-blue-600 font-medium hover:underline"
                            >
                                {inputs.loans.length > 0 ? 'Manage Debts' : '+ Add Debt'}
                            </button>
                        </div>

                        <div className="space-y-2">
                            {inputs.housingMode === 'mortgage' && (
                                <div className="bg-white border border-slate-200 rounded-lg p-2 flex justify-between items-center text-xs shadow-sm opacity-70">
                                    <div className="flex items-center gap-2">
                                        <Home size={14} className="text-slate-500" />
                                        <span className="font-semibold text-slate-700">Mortgage</span>
                                    </div>
                                    <div className="font-mono text-slate-800">See Spending</div>
                                </div>
                            )}
                            {inputs.loans.map(l => (
                                <div key={l.id} className="bg-white border border-slate-200 rounded-lg p-2 flex justify-between items-center text-xs shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <CreditCard size={14} className="text-red-500" />
                                        <span className="font-semibold text-slate-700">{l.name}</span>
                                    </div>
                                    <div className="font-mono text-red-600">-£{(l.balance / 1000).toFixed(1)}k</div>
                                </div>
                            ))}
                            {inputs.loans.length === 0 && inputs.housingMode !== 'mortgage' && (
                                <div className="text-xs text-slate-400 italic">Debt free</div>
                            )}
                        </div>
                    </div>
                </AccordionItem >

                {/* PILLAR 4: LIFE & SPENDING */}
                < AccordionItem
                    title="Spending & Lifestyle"
                    icon={Home}
                    isOpen={activeSection === 'spending'}
                    onToggle={() => toggleSection('spending')}
                >

                    {/* Housing Costs */}
                    < div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4" >
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                {inputs.housingMode === 'mortgage' ? <Building size={16} className="text-slate-500" /> : <Key size={16} className="text-slate-500" />}
                                <span className="text-xs font-bold text-slate-700 uppercase">Housing Cost</span>
                            </div>
                            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                                <button
                                    onClick={() => updateInput('housingMode', 'mortgage')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${inputs.housingMode === 'mortgage' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Mortgage
                                </button>
                                <button
                                    onClick={() => updateInput('housingMode', 'rent')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${inputs.housingMode === 'rent' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Rent
                                </button>
                            </div>
                        </div>

                        {
                            inputs.housingMode === 'mortgage' ? (
                                <div className="space-y-1">
                                    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">Mortgages</div>
                                                <div className="text-[10px] text-slate-400">
                                                    {inputs.mortgages?.length || 0} active mortgage(s)
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-red-600">
                                                    -£{(inputs.mortgages?.reduce((acc, m) => acc + m.monthlyPayment, 0) || 0).toLocaleString()}
                                                </div>
                                                <div className="text-[10px] text-slate-400">/mo</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setMortgageModalOpen(true)}
                                            className="w-full text-xs bg-slate-50 text-slate-600 font-medium hover:bg-slate-100 py-2 rounded-lg transition border border-slate-100"
                                        >
                                            {inputs.mortgages && inputs.mortgages.length > 0 ? 'Manage Mortgages' : '+ Add Mortgage'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <SmartInput
                                        label="Monthly Rent"
                                        value={inputs.rentAmount || 1500}
                                        onChange={v => updateInput('rentAmount', v)}
                                        min={0}
                                        max={5000}
                                        step={50}
                                        prefix="£"
                                        rightLabel="Inflation"
                                        rightValue={inputs.rentInflation || 3}
                                        onRightChange={v => updateInput('rentInflation', v)}
                                    />
                                </>
                            )
                        }
                    </div >

                    <SmartInput
                        label="Lifestyle Spending"
                        subLabel="(Excl. Housing)"
                        value={inputs.annualSpending}
                        onChange={v => updateInput('annualSpending', v)}
                        min={10000}
                        max={100000}
                        step={500}
                        prefix="£"
                    >
                        <p className="text-[10px] text-slate-500">General spending in today's money.</p>
                    </SmartInput>

                    {/* Timeline of Events */}
                    <div className="flex justify-between items-center mb-2 mt-6 pt-4 border-t border-slate-100">
                        <span className="text-xs font-semibold text-slate-600">Timeline of Events</span>
                        <button
                            onClick={() => setEventModalOpen(true)}
                            className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
                        >
                            <Plus size={14} /> Add Event
                        </button>
                    </div>

                    {
                        inputs.events.length > 0 ? (
                            <div className="space-y-2">
                                {inputs.events.map(e => (
                                    <div key={e.id} className="text-xs flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                                        <div>
                                            <span className="font-semibold text-slate-700">{e.name}</span>
                                            <span className="text-slate-400 ml-2">Age {e.age}</span>
                                        </div>
                                        <span className={e.type === 'income' ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                                            {e.type === 'income' ? '+' : '-'}£{(e.amount / 1000).toFixed(1)}k
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 italic text-center py-2 border border-dashed border-slate-200 rounded">
                                No major life events (Weddings, Uni, etc.)
                            </div>
                        )
                    }
                </AccordionItem >

                {/* PILLAR 5: FINE-TUNING */}
                < AccordionItem
                    title="Fine-Tune Your Plan"
                    icon={Settings}
                    isOpen={activeSection === 'config'}
                    onToggle={() => toggleSection('config')}
                >
                    {/* Strategy Widget */}
                    < div className="mb-6" >
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                            Flow & Drawdown
                        </label>

                        <button
                            onClick={() => setStrategyModalOpen(true)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:border-blue-300 hover:shadow-md transition text-left group"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-slate-800">Configure Flow</span>
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold group-hover:bg-blue-100">
                                    Edit
                                </span>
                            </div>
                            <div className="text-xs text-slate-500">
                                Allocation & Withdrawal Order
                            </div>
                        </button>
                    </div >

                    <SliderInput
                        label="Inflation Assumption"
                        min={0} max={10} step={0.5}
                        value={inputs.inflation}
                        onChange={v => updateInput('inflation', v)}
                        formatValue={v => `${v}%`}
                    />

                    <div className="my-4 border-t border-b border-slate-100 py-2">
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-3">Asset Growth Rates</label>

                        <SliderInput
                            label="Cash Growth"
                            min={0} max={10} step={0.25}
                            value={inputs.growthCash}
                            onChange={v => updateInput('growthCash', v)}
                            formatValue={v => `${v}%`}
                        />
                        <SliderInput
                            label="ISA / GIA Growth"
                            min={0} max={12} step={0.25}
                            value={inputs.growthISA}
                            onChange={v => {
                                updateInput('growthISA', v);
                                updateInput('growthGIA', v);
                            }}
                            formatValue={v => `${v}%`}
                        />
                        <SliderInput
                            label="Pension Growth"
                            min={0} max={12} step={0.25}
                            value={inputs.growthPension}
                            onChange={v => updateInput('growthPension', v)}
                            formatValue={v => `${v}%`}
                        />
                    </div>

                    {/* Optimization Checkbox */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <div className="mt-0.5">
                                <input
                                    type="checkbox"
                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    checked={inputs.maxISAFromGIA}
                                    onChange={e => updateInput('maxISAFromGIA', e.target.checked)}
                                />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                                    Maximize ISA Allowance
                                </span>
                                <p className="text-[10px] text-indigo-800 leading-tight mt-1">
                                    Move funds from GIA/Cash to ISA annually.
                                </p>
                            </div>
                        </label>
                    </div>

                </AccordionItem >

                {/* Mobile Spacer */}
                < div className="h-16 md:hidden" ></div >
            </div >
        </>
    );

    return (
        <div className="flex flex-col md:flex-row h-screen w-full bg-slate-100 overflow-hidden">

            {/* --- Mobile Header --- */}
            <div className="md:hidden bg-white border-b border-slate-200 p-4 flex flex-col gap-3 flex-shrink-0 z-20">
                <div className="flex justify-between items-center">
                    <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm">R</span>
                        RetirePlan
                    </h1>
                    <button
                        onClick={() => {
                            setSettingsTab('plan');
                            setSettingsOpen(true);
                        }}
                        className="p-2 text-slate-400"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* --- Mobile Impact Bar --- */}
            {mobileTab === 'inputs' && (
                <div className={`md:hidden bg-slate-800 text-white px-4 py-2 flex items-center justify-between text-xs sticky top-0 z-10 shadow-md ${fundsRunOutAge ? 'bg-red-900' : 'bg-green-900'}`}>
                    <div className="flex flex-col">
                        <span className="opacity-70 text-[10px]">Projected Legacy:</span>
                        <span className="font-bold">{formatLargeMoney(totalNetWorthEnd)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="opacity-70 text-[10px]">Run Out:</span>
                        <div className="font-bold flex items-center gap-1">
                            {fundsRunOutAge ? (
                                <>
                                    <AlertTriangle size={14} className="text-red-400" />
                                    <span>Age {fundsRunOutAge}</span>
                                </>
                            ) : (
                                <span>Safe (90+)</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- Sidebar (Inputs) --- */}
            <div className={`
        md:w-[400px] md:flex-shrink-0 md:border-r md:border-slate-200 md:flex md:flex-col md:relative md:h-full md:shadow-lg md:z-10
        w-full h-full bg-white absolute inset-0 md:static overflow-hidden flex flex-col
        ${mobileTab === 'inputs' ? 'z-10 flex' : 'hidden md:flex'}
      `}>
                {/* Desktop Header */}
                <div className="hidden md:flex p-5 border-b border-slate-100 bg-white justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-lg">R</span>
                            RetirePlan
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">MVP Scenario Projector</p>
                    </div>
                    <button
                        onClick={() => {
                            setSettingsTab('plan');
                            setSettingsOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>
                </div>

                {renderSidebarContent()}

                {/* Desktop Disclaimer */}
                <div className="hidden md:block p-4 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 leading-tight">
                    Not financial advice. Calculations are approximations based on simplified assumptions.
                </div>
            </div>

            {/* --- Main Dashboard (Right) --- */}
            <div className={`
        flex-1 flex flex-col h-full relative overflow-hidden bg-slate-100
        ${mobileTab === 'results' ? 'flex' : 'hidden md:flex'}
      `}>

                {/* Traffic Light Status Banner */}
                {(() => {
                    const yearsToShortfall = fundsRunOutAge ? fundsRunOutAge - calculatedAge : null;
                    const legacyPerYear = totalNetWorthEnd / Math.max(1, inputs.lifeExpectancy - inputs.retirementAge);

                    // Determine status
                    let status: 'green' | 'amber' | 'red' = 'green';
                    let statusMessage = '';
                    let statusSubtext = '';

                    if (fundsRunOutAge && yearsToShortfall && yearsToShortfall < 30) {
                        status = 'red';
                        statusMessage = "Let's look at some options";
                        statusSubtext = `Your funds may run out at age ${fundsRunOutAge}. Small changes can make a big difference.`;
                    } else if (legacyPerYear < inputs.annualSpending * 0.5) {
                        status = 'amber';
                        statusMessage = "You're getting there";
                        statusSubtext = "A few tweaks could give you more security in retirement.";
                    } else {
                        status = 'green';
                        statusMessage = "You're on track";
                        statusSubtext = `Projected to have ${formatLargeMoney(totalNetWorthEnd)} at ${inputs.lifeExpectancy}. That's ${formatLargeMoney(legacyPerYear)}/year of retirement.`;
                    }

                    const statusColors = {
                        green: 'bg-emerald-50 border-emerald-200 text-emerald-800',
                        amber: 'bg-amber-50 border-amber-200 text-amber-800',
                        red: 'bg-red-50 border-red-200 text-red-800'
                    };

                    const iconColors = {
                        green: 'bg-emerald-500',
                        amber: 'bg-amber-500',
                        red: 'bg-red-500'
                    };

                    if (warningDismissed) return null;

                    return (
                        <div className={`${statusColors[status]} border-b px-4 md:px-6 py-3 flex items-center gap-3 relative`}>
                            <div className={`${iconColors[status]} w-3 h-3 rounded-full flex-shrink-0 animate-pulse`} />
                            <div className="flex-1 min-w-0 pr-8">
                                <span className="font-bold text-sm md:text-base">{statusMessage}</span>
                                <span className="text-xs md:text-sm opacity-80 ml-2 hidden sm:inline">{statusSubtext}</span>
                                <p className="text-xs opacity-80 sm:hidden truncate">{statusSubtext}</p>
                            </div>

                            <div className="flex items-center gap-3">
                                {status !== 'green' && (
                                    <button
                                        onClick={() => {
                                            setAdvisorContext(status === 'red' ? 'shortfall' : 'manual');
                                            setAdvisorModalOpen(true);
                                        }}
                                        className="text-xs font-bold underline flex-shrink-0 hover:opacity-70"
                                    >
                                        Get help
                                    </button>
                                )}
                                <button
                                    onClick={() => setWarningDismissed(true)}
                                    className="p-1 hover:bg-black/5 rounded-full transition text-inherit opacity-60 hover:opacity-100"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })()}

                {/* Stats Header */}
                <div className="bg-white border-b border-slate-200 p-4 md:p-6 flex flex-col md:flex-row md:items-start justify-between z-10 gap-4 md:gap-0">
                    <div className="flex justify-between w-full md:w-auto md:block">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                                Your Future
                                <span className="text-base font-normal text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                    Age {calculatedAge} → {inputs.lifeExpectancy}
                                </span>
                            </h2>

                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                <span className="font-medium">{activeScenario.name}</span>
                                <button
                                    onClick={() => {
                                        setSettingsTab('scenarios');
                                        setSettingsOpen(true);
                                    }}
                                    className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-slate-50 transition"
                                    title="Change Scenario"
                                >
                                    <Pencil size={14} />
                                </button>
                                {scenarios.length === 1 && (
                                    <button
                                        onClick={addScenario}
                                        className="text-xs text-blue-500 font-medium hover:underline ml-1"
                                    >
                                        (New Scenario)
                                    </button>
                                )}
                                <span>• Retire at {inputs.retirementAge}</span>
                            </div>
                        </div>
                        {/* Mobile Sanity Check Button */}
                        <button
                            onClick={openManualAdvisor}
                            className="md:hidden p-2 text-orange-600 bg-orange-50 rounded-lg"
                        >
                            <UserCheck size={20} />
                        </button>
                    </div>

                    <div className="flex gap-2 md:gap-4 w-full md:w-auto items-start">
                        <button
                            onClick={openManualAdvisor}
                            className="hidden md:flex items-center gap-2 px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold rounded-xl border border-orange-200 transition-colors mr-2"
                        >
                            <UserCheck size={18} />
                            <span>Sanity Check!</span>
                        </button>

                        {/* Funds Last Alert Widget */}
                        <button
                            onClick={() => {
                                if (fundsRunOutAge) {
                                    setAdvisorContext('shortfall');
                                    setAdvisorModalOpen(true);
                                }
                            }}
                            disabled={!fundsRunOutAge}
                            className={`flex-1 md:flex-none px-3 py-2 md:px-5 md:py-3 rounded-xl border transition-all duration-300 flex flex-col items-center min-w-[100px] md:min-w-[120px] relative overflow-hidden group ${fundsRunOutAge
                                ? 'bg-red-50 border-red-200 cursor-pointer hover:shadow-lg hover:bg-red-100 hover:scale-105 ring-2 ring-transparent hover:ring-red-200'
                                : 'bg-green-50 border-green-100 cursor-default'
                                }`}
                        >
                            <span className={`text-[10px] md:text-xs font-bold uppercase z-10 ${fundsRunOutAge ? 'text-red-700' : 'text-green-600'}`}>Funds Last</span>

                            <div className="flex items-center gap-1 mt-1 z-10">
                                {fundsRunOutAge ? (
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1">
                                            <span className="text-lg md:text-2xl font-bold text-red-700">Age {fundsRunOutAge}</span>
                                            <AlertTriangle size={18} className="text-red-600 animate-pulse hidden md:block" />
                                        </div>
                                        <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 flex items-center gap-1 shadow-sm group-hover:bg-red-700 transition-colors animate-pulse">
                                            <span>⚠️ Fix Shortfall</span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-lg md:text-2xl font-bold text-green-700">{inputs.lifeExpectancy}+</span>
                                )}
                            </div>
                            {fundsRunOutAge && (
                                <div className="absolute inset-0 bg-red-400/5 group-hover:bg-red-400/10 transition-colors" />
                            )}
                        </button>

                        {/* Legacy Balance */}
                        <div className="flex-1 md:flex-none px-3 py-2 md:px-5 md:py-3 rounded-xl border border-slate-200 bg-white flex flex-col items-center min-w-[100px] md:min-w-[140px]">
                            <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">At Age {inputs.lifeExpectancy}</span>
                            <span className="text-lg md:text-2xl font-bold text-slate-800 mt-0.5">
                                {formatLargeMoney(totalNetWorthEnd)}
                            </span>
                            <span className="text-[9px] md:text-[10px] text-slate-400 mt-0.5">
                                {totalNetWorthEnd > 0 ? (
                                    `≈ ${formatLargeMoney(totalNetWorthEnd / Math.max(1, inputs.lifeExpectancy - inputs.retirementAge))}/yr`
                                ) : 'depleted'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Chart View Config */}
                <div className="px-4 md:px-6 pt-4 pb-2 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 gap-3 md:gap-0">
                    <div className="flex p-1 bg-white border border-slate-200 rounded-lg shadow-sm w-full md:w-auto">
                        <button
                            onClick={() => setChartMode('cashflow')}
                            className={`flex-1 md:flex-none justify-center px-3 py-1.5 text-xs md:text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${chartMode === 'cashflow' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <BarChart2 size={16} /> Cash Flow
                        </button>
                        <button
                            onClick={() => setChartMode('assets')}
                            className={`flex-1 md:flex-none justify-center px-3 py-1.5 text-xs md:text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${chartMode === 'assets' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <LineChart size={16} /> Asset Growth
                        </button>
                    </div>

                    {chartMode === 'assets' && (
                        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <div className="flex items-center gap-3 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-sm whitespace-nowrap min-w-max">
                                <button
                                    onClick={() => setIsStacked(!isStacked)}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 transition shadow-sm mr-2"
                                >
                                    {isStacked ? <Layers size={14} className="text-blue-600" /> : <Activity size={14} className="text-blue-600" />}
                                    {isStacked ? 'Stacked' : 'Lines'}
                                </button>
                                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                <span className="text-xs font-bold text-slate-400 uppercase mr-1">Show:</span>
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 select-none">
                                    <input type="checkbox" checked={assetVisibility.total} onChange={() => toggleAssetVisibility('total')} className="rounded text-slate-800 focus:ring-slate-800" hidden={isStacked} />
                                    <span className={isStacked ? "hidden" : "block"}>Total Wealth</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-yellow-600 select-none">
                                    <input type="checkbox" checked={assetVisibility.pension} onChange={() => toggleAssetVisibility('pension')} className="rounded text-yellow-600 focus:ring-yellow-600" />
                                    Pension
                                </label>
                                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-indigo-600 select-none">
                                    <input type="checkbox" checked={assetVisibility.isa} onChange={() => toggleAssetVisibility('isa')} className="rounded text-indigo-600 focus:ring-indigo-600" />
                                    ISA
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-emerald-600 select-none">
                                    <input type="checkbox" checked={assetVisibility.gia} onChange={() => toggleAssetVisibility('gia')} className="rounded text-emerald-600 focus:ring-emerald-600" />
                                    GIA
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-lime-600 select-none">
                                    <input type="checkbox" checked={assetVisibility.cash} onChange={() => toggleAssetVisibility('cash')} className="rounded text-lime-600 focus:ring-lime-600" />
                                    Cash
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Chart Area */}
                <div className="flex-1 px-2 md:px-6 pb-20 md:pb-6 pt-2 relative bg-slate-50/50">
                    {fundsRunOutAge && (
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-12 z-20 pointer-events-none">
                            <div className="bg-red-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 pointer-events-auto animate-in fade-in slide-in-from-top-4 hover:scale-105 transition-transform cursor-pointer border-2 border-white/20"
                                onClick={() => {
                                    setAdvisorContext('shortfall');
                                    setAdvisorModalOpen(true);
                                }}
                            >
                                <div className="bg-white/20 p-2 rounded-full">
                                    <AlertTriangle size={20} className="text-white" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm">Funds Run Out at Age {fundsRunOutAge}</div>
                                    <div className="text-xs text-red-100 font-medium flex items-center gap-1">
                                        View Professional Solutions <ChevronRight size={12} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="absolute inset-x-2 md:inset-x-6 inset-y-2 bottom-20 md:bottom-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-2 md:p-4">
                        <ResultsChart
                            data={results}
                            mode={chartMode}
                            assetVisibility={assetVisibility}
                            pensionAccessAge={inputs.pensionAccessAge}
                            retirementAge={inputs.retirementAge}
                            mortgageEndAge={inputs.housingMode === 'mortgage' ? inputs.mortgageEndAge : 0}
                            events={inputs.events}
                            stacked={isStacked}
                        />
                    </div>
                </div>
            </div>

            {/* --- Mobile Bottom Nav --- */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50 pb-safe">
                <button
                    onClick={() => setMobileTab('inputs')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg w-full ${mobileTab === 'inputs' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                >
                    <Edit3 size={20} />
                    <span className="text-[10px] font-medium">Edit Plan</span>
                </button>
                <button
                    onClick={() => setMobileTab('results')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg w-full ${mobileTab === 'results' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                >
                    <PieChart size={20} />
                    <span className="text-[10px] font-medium">Projection</span>
                </button>
            </div>

            {/* --- Modals --- */}
            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setEventModalOpen(false)}
                events={inputs.events}
                onChange={(updated) => updateInput('events', updated)}
            />

            <DebtModal
                isOpen={isDebtModalOpen}
                onClose={() => setDebtModalOpen(false)}
                loans={inputs.loans || []}
                onChange={(updated) => updateInput('loans', updated)}
                currentAge={calculatedAge}
            />

            <MortgageModal
                isOpen={isMortgageModalOpen}
                onClose={() => setMortgageModalOpen(false)}
                mortgages={inputs.mortgages || []}
                onChange={(updated) => updateInput('mortgages', updated)}
                currentAge={calculatedAge}
            />

            <PropertyModal
                isOpen={isPropertyModalOpen}
                onClose={() => setPropertyModalOpen(false)}
                properties={inputs.investmentProperties || []}
                onUpdate={(updated) => updateInput('investmentProperties', updated)}
            />

            <DBPensionModal
                isOpen={isDBPensionModalOpen}
                onClose={() => setDBPensionModalOpen(false)}
                pensions={inputs.dbPensions || []}
                onUpdate={(updated) => updateInput('dbPensions', updated)}
                currentAge={calculatedAge}
            />

            <AdditionalIncomeModal
                isOpen={isAdditionalIncomeModalOpen}
                onClose={() => setAdditionalIncomeModalOpen(false)}
                incomes={inputs.additionalIncomes || []}
                onChange={(updated) => updateInput('additionalIncomes', updated)}
                currentAge={calculatedAge}
                retirementAge={inputs.retirementAge}
            />

            <StrategyModal
                isOpen={isStrategyModalOpen}
                onClose={() => setStrategyModalOpen(false)}
                inputs={inputs}
                onUpdate={updateInput}
            />

            <OnboardingModal
                isOpen={isOnboardingOpen}
                onClose={() => setIsOnboardingOpen(false)}
                initialInputs={inputs}
                onComplete={handleOnboardingComplete}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setSettingsOpen(false)}

                scenarios={scenarios}
                activeScenarioId={activeScenarioId}
                onSelectScenario={setActiveScenarioId}
                onAddScenario={addScenario}
                onDeleteScenario={deleteScenario}
                onRenameScenario={renameScenario}

                currentBirthYear={inputs.birthYear || 1984}
                onUpdateBirthYear={(y) => updateInput('birthYear', y)}

                onImport={(importedScenarios) => {
                    setScenarios(importedScenarios);
                    setActiveScenarioId(importedScenarios[0].id);
                    setSettingsOpen(false);
                }}
                onResetOnboarding={() => {
                    setIsOnboardingOpen(true);
                    setSettingsOpen(false);
                }}
                initialTab={settingsTab}
            />

            <AdvisorModal
                isOpen={isAdvisorModalOpen}
                onClose={() => setAdvisorModalOpen(false)}
                context={advisorContext}
            />

        </div>
    );
};

export default App;