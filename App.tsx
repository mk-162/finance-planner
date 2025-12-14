

import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { UserInputs, FinancialEvent, Scenario } from './types';
import { calculateProjection, getStatePensionAge } from './services/calculationEngine';
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
import { DebouncedSlider } from './components/DebouncedSlider';
import { ReviewModal } from './components/ReviewModal';
import { StatusBanner } from './components/StatusBanner';
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
    PlusCircle,
    SlidersHorizontal,
    Trash2,
    X
} from 'lucide-react';

// --- Icon Badge Color Map - All use primary teal accent ---
const iconBadgeColors: Record<string, string> = {
    'Income & Earnings': 'icon-badge-teal',
    'Your Savings': 'icon-badge-teal',
    'Pensions & Retirement': 'icon-badge-teal',
    'Housing & Debts': 'icon-badge-teal',
    'Spending & Lifestyle': 'icon-badge-teal',
    'Growth & Strategy': 'icon-badge-teal',
};

// --- Accordion Component ---
const AccordionItem = ({ title, icon: Icon, children, isOpen, onToggle }: any) => {
    const badgeColor = iconBadgeColors[title] || 'icon-badge-teal';

    return (
        <div className={`mb-3 rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'bg-slate-800/50' : ''}`}>
            <button
                className={`w-full flex items-center justify-between p-3 transition-all duration-300 ${isOpen
                    ? 'bg-slate-700/80'
                    : 'hover:bg-white/5 rounded-xl'
                    }`}
                onClick={onToggle}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg text-white ${badgeColor}`}>
                        <Icon size={16} />
                    </div>
                    <span className="font-semibold text-white/90 text-sm">{title}</span>
                </div>
                <ChevronDown
                    size={18}
                    className={`text-white/60 transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                />
            </button>
            {isOpen && (
                <div className="p-4 animate-slide-down">
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
                        // Ensure new fields are populated by merging with defaults
                        s.data = { ...DEFAULT_INPUTS, ...s.data };

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

                        // Ensure lists are initialized
                        if (!s.data.additionalIncomes) s.data.additionalIncomes = [];
                        if (!s.data.investmentProperties) s.data.investmentProperties = [];

                        return s;
                    });
                }
            }
        } catch (e) { console.error("Failed to load scenarios", e); }
        return [{ id: '1', name: 'Master Plan', data: DEFAULT_INPUTS, createdAt: Date.now() }];
    });
    const [activeScenarioId, setActiveScenarioId] = useState<string>(scenarios[0].id);

    // Auto-Save Effect (throttled for performance)
    useEffect(() => {
        const timeout = setTimeout(() => {
            localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
        }, 500);
        return () => clearTimeout(timeout);
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
    const [isReviewModalOpen, setReviewModalOpen] = useState(false);

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

    // Quick Controls display state (for instant feedback while debouncing heavy recalc)
    const [displaySpending, setDisplaySpending] = useState(inputs.annualSpending);
    const [displayRetirement, setDisplayRetirement] = useState(inputs.retirementAge);
    const [displayPensionGrowth, setDisplayPensionGrowth] = useState(inputs.growthPension);

    // Sync display values when inputs change (e.g., from other controls or initial load)
    useEffect(() => {
        setDisplaySpending(inputs.annualSpending);
        setDisplayRetirement(inputs.retirementAge);
        setDisplayPensionGrowth(inputs.growthPension);
    }, [inputs.annualSpending, inputs.retirementAge, inputs.growthPension]);

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

    // Defer chart updates for smoother slider interaction
    const deferredResults = useDeferredValue(results);

    // Calculate summary stats (using deferred for non-critical display)
    const finalResult = deferredResults[deferredResults.length - 1];
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
                const newData = { ...s.data, [key]: value };

                // Auto-update State Pension Age if birth year changes
                if (key === 'birthYear') {
                    newData.statePensionAge = getStatePensionAge(Number(value));
                }

                return { ...s, data: newData };
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

                {/* Quick Controls - Key Metrics */}
                <div className="mb-4 p-3 rounded-xl bg-slate-800/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="icon-badge-teal p-2 rounded-xl text-white">
                            <SlidersHorizontal size={16} />
                        </div>
                        <span className="text-sm font-bold text-white">Quick Controls</span>
                    </div>

                    {/* Outgoings Slider */}
                    <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-white/60">Annual Spending</span>
                            <span className="text-xs font-bold text-white">£{displaySpending?.toLocaleString()}</span>
                        </div>
                        <DebouncedSlider
                            min={10000}
                            max={100000}
                            step={500}
                            value={inputs.annualSpending}
                            onDrag={setDisplaySpending}
                            onChange={(v) => updateInput('annualSpending', v)}
                        />
                    </div>

                    {/* Retirement Age Slider */}
                    <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-white/60">Retirement Age</span>
                            <span className="text-xs font-bold text-white">{displayRetirement}</span>
                        </div>
                        <DebouncedSlider
                            min={50}
                            max={75}
                            step={1}
                            value={inputs.retirementAge}
                            onDrag={setDisplayRetirement}
                            onChange={(v) => updateInput('retirementAge', v)}
                        />
                    </div>

                    {/* Pension Fees Slider */}
                    <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-white/60">Pension Fees</span>
                            <span className="text-xs font-bold text-white">{inputs.pensionFees || 0}%</span>
                        </div>
                        <DebouncedSlider
                            min={0}
                            max={3}
                            step={0.1}
                            value={inputs.pensionFees || 0}
                            onChange={(v) => updateInput('pensionFees', v)}
                        />
                        {(() => {
                            // Fee Overspend Check (Total Opportunity Cost)
                            const finalRes = deferredResults[deferredResults.length - 1]; // Use deferred for stable UI
                            if (!finalRes || !finalRes.benchmarkPensionPot) return null;

                            const totalOpportunityCost = finalRes.benchmarkPensionPot - finalRes.balancePension;

                            // Threshold: Show if opportunity cost > £10k (material impact)
                            if (totalOpportunityCost > 10000) {
                                return (
                                    <div className="mt-2 p-3 bg-red-400/20 border border-red-500/50 rounded-lg animate-in fade-in slide-in-from-top-2">
                                        <div className="text-[10px] text-red-200 uppercase font-bold mb-1 flex items-center gap-1">
                                            <AlertTriangle size={12} className="text-red-400" />
                                            Fee Warning
                                        </div>
                                        <div className="text-xs text-white mb-2 leading-relaxed">
                                            If you used a cheaper broker, the compound effect of these fees would be <span className="font-bold text-red-300">{formatLargeMoney(totalOpportunityCost)}</span> over duration of this plan.
                                        </div>
                                        <button className="w-full py-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded transition shadow-sm hover:shadow-md">
                                            Compare Platforms
                                        </button>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>

                    {/* Pension Yield Slider */}
                    <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-white/60">Pension Growth</span>
                            <span className="text-xs font-bold text-white">{displayPensionGrowth}%</span>
                        </div>
                        <DebouncedSlider
                            min={0}
                            max={12}
                            step={0.25}
                            value={inputs.growthPension}
                            onDrag={setDisplayPensionGrowth}
                            onChange={(v) => updateInput('growthPension', v)}
                        />
                    </div>
                </div>

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
                            label="Main Income"
                            subLabel={inputs.isSalaryGross ? "Annual gross income" : "Annual net income"}
                            value={inputs.currentSalary}
                            onChange={(v) => updateInput('currentSalary', v)}
                            min={0}
                            max={200000}
                            step={1000}
                            prefix="£"
                            rightLabel="Annual change"
                            rightValue={inputs.salaryGrowth ?? 0}
                            onRightChange={(v) => updateInput('salaryGrowth', v)}
                            colorClass="blue"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-400">Stop work at {inputs.retirementAge}</p>
                                <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                                    <button
                                        onClick={() => updateInput('isSalaryGross', true)}
                                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${inputs.isSalaryGross ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Gross
                                    </button>
                                    <button
                                        onClick={() => updateInput('isSalaryGross', false)}
                                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${!inputs.isSalaryGross ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Net
                                    </button>
                                </div>
                            </div>
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
                            <p className="text-xs text-slate-400">Taxed at dividend rates</p>
                        </SmartInput>

                        {/* Additional Income / Semi-Retirement */}
                        <div className="glass-card p-4 rounded-xl card-hover">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-sm text-slate-800">Additional Income</div>
                                    <div className="text-xs text-slate-400">Side hustles, consulting, etc</div>
                                </div>
                                <div className="text-right">
                                    {(inputs.additionalIncomes && inputs.additionalIncomes.length > 0) ? (
                                        <div className="font-extrabold text-lg text-emerald-600 number-display">
                                            £{inputs.additionalIncomes.reduce((acc, i) => acc + i.amount, 0).toLocaleString()}
                                        </div>
                                    ) : (
                                        <div className="font-bold text-lg text-slate-300">£0</div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setAdditionalIncomeModalOpen(true)}
                                className="w-full mt-3 text-xs text-white font-semibold btn-primary py-2 rounded-xl"
                            >
                                {inputs.additionalIncomes?.length > 0 ? 'Manage Incomes' : '+ Add Additional Income'}
                            </button>
                        </div>

                        {/* Rental Income */}
                        <div className="glass-card p-4 rounded-xl card-hover">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-sm text-slate-800">Rental Income</div>
                                    <div className="text-[10px] text-slate-500">From investment properties</div>
                                </div>
                                <div className="text-right">
                                    {inputs.investmentProperties && inputs.investmentProperties.length > 0 ? (
                                        <div className="font-extrabold text-lg text-emerald-600 number-display">
                                            £{(inputs.investmentProperties.reduce((acc, p) => acc + (p.monthlyRent * 12), 0)).toLocaleString()}
                                        </div>
                                    ) : (
                                        <div className="font-bold text-lg text-slate-300">£0</div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setPropertyModalOpen(true)}
                                className="w-full mt-3 text-xs text-white font-semibold btn-success py-2 rounded-xl"
                            >
                                {inputs.investmentProperties?.length > 0 ? 'Manage Properties' : '+ Add Rental Property'}
                            </button>
                        </div>

                        {/* Pension Drawdown - only show if over 57 */}
                        {calculatedAge >= inputs.pensionAccessAge && (
                            <div className="banner-warning p-4 animate-slide-up">
                                <div className="flex items-start gap-3">
                                    <div className="icon-badge-amber p-2.5 rounded-lg text-white">
                                        <Landmark size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm text-amber-800">Pension Drawdown Available</div>
                                        <div className="text-[10px] text-amber-700 mt-1">
                                            You can access your pension pot (£{(inputs.savingsPension / 1000).toFixed(0)}k).
                                            Configure withdrawals in the Strategy section.
                                        </div>
                                        <button
                                            onClick={() => setStrategyModalOpen(true)}
                                            className="text-xs text-amber-800 font-bold mt-2 flex items-center gap-1 hover:underline"
                                        >
                                            Configure Drawdown Strategy <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DB Pensions Summary */}
                        {inputs.dbPensions && inputs.dbPensions.length > 0 && (
                            <div className="glass-card p-4 rounded-xl card-hover">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-sm text-slate-800">Final Salary Pensions</div>
                                        <div className="text-[10px] text-slate-500">{inputs.dbPensions.length} pension(s) configured</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-extrabold text-lg text-emerald-600 number-display">
                                            £{inputs.dbPensions.reduce((acc, db) => acc + db.annualIncome, 0).toLocaleString()}
                                        </div>
                                        <div className="text-[10px] text-slate-500">per year</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDBPensionModalOpen(true)}
                                    className="w-full mt-3 text-xs text-white font-semibold btn-primary py-2 rounded-xl"
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
                    <div className="glass-card p-4 rounded-xl card-hover mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-700 uppercase">State Pension</span>
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
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-3">Pension Pots</p>

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
                    </div>

                    {/* Defined Benefit Pensions */}
                    <div className="mt-4 pt-4 border-t border-white/10">
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
                                    <div key={db.id} className="glass-card p-3 rounded-xl flex justify-between items-center text-xs card-hover">
                                        <div className="flex items-center gap-2">
                                            <div className="icon-badge-green p-1.5 rounded-xl text-white">
                                                <ShieldCheck size={12} />
                                            </div>
                                            <span className="font-semibold text-slate-700">{db.name}</span>
                                        </div>
                                        <div className="font-mono text-emerald-600 font-bold">+£{(db.annualIncome / 1000).toFixed(1)}k/yr</div>
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
                    title="Your Savings"
                    icon={Wallet}
                    isOpen={activeSection === 'assets'}
                    onToggle={() => toggleSection('assets')}
                >
                    <div className="space-y-2">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-3">Liquid Assets</p>
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
                    <div className="mt-6 pt-4 border-t border-white/10">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Fixed Assets</span>
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
                                    <div key={p.id} className="glass-card p-3 rounded-xl flex justify-between items-center text-xs card-hover">
                                        <div className="flex items-center gap-2">
                                            <div className="icon-badge-teal p-1.5 rounded-xl text-white">
                                                <Building size={12} />
                                            </div>
                                            <span className="font-semibold text-slate-700">{p.name}</span>
                                        </div>
                                        <div className="font-mono text-slate-800 font-bold">£{(p.value / 1000).toFixed(0)}k</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 italic">No investment properties</div>
                        )}
                    </div>

                    {/* Liabilities (Debts) */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Liabilities (Debt)</span>
                            <button
                                onClick={() => setDebtModalOpen(true)}
                                className="text-xs text-blue-600 font-medium hover:underline"
                            >
                                {inputs.loans.length > 0 ? 'Manage Debts' : '+ Add Debt'}
                            </button>
                        </div>

                        <div className="space-y-2">
                            {inputs.housingMode === 'mortgage' && (
                                <div className="glass-card p-3 rounded-xl flex justify-between items-center text-xs opacity-70">
                                    <div className="flex items-center gap-2">
                                        <div className="icon-badge-amber p-1.5 rounded-xl text-white">
                                            <Home size={12} />
                                        </div>
                                        <span className="font-semibold text-slate-700">Mortgage</span>
                                    </div>
                                    <div className="font-mono text-slate-600">See Spending</div>
                                </div>
                            )}
                            {inputs.loans.map(l => (
                                <div key={l.id} className="glass-card p-3 rounded-xl flex justify-between items-center text-xs card-hover border-l-4 border-l-red-400">
                                    <div className="flex items-center gap-2">
                                        <div className="icon-badge-rose p-1.5 rounded-xl text-white">
                                            <CreditCard size={12} />
                                        </div>
                                        <span className="font-semibold text-slate-700">{l.name}</span>
                                    </div>
                                    <div className="font-mono text-red-500 font-bold">-£{(l.balance / 1000).toFixed(1)}k</div>
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
                    <div className="glass-card p-4 rounded-xl card-hover mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <div className={`${inputs.housingMode === 'mortgage' ? 'icon-badge-amber' : 'icon-badge-teal'} p-2 rounded-xl text-white`}>
                                    {inputs.housingMode === 'mortgage' ? <Building size={14} /> : <Key size={14} />}
                                </div>
                                <span className="text-xs font-bold text-slate-700 uppercase">Housing Cost</span>
                            </div>
                            <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200">
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
                                <div className="space-y-2">
                                    <div className="bg-white/60 rounded-xl p-3 border border-slate-100">
                                        <div className="flex justify-between items-center mb-3">
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">Mortgages</div>
                                                <div className="text-[10px] text-slate-500">
                                                    {inputs.mortgages?.length || 0} active mortgage(s)
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-red-500">
                                                    -£{(inputs.mortgages?.reduce((acc, m) => acc + m.monthlyPayment, 0) || 0).toLocaleString()}
                                                </div>
                                                <div className="text-[10px] text-slate-400">/mo</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setMortgageModalOpen(true)}
                                            className="w-full text-xs btn-primary py-2 rounded-xl font-semibold"
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
                    </div>

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
                    <div className="flex justify-between items-center mb-3 mt-6 pt-4 border-t border-white/10">
                        <span className="text-xs font-bold text-slate-500 uppercase">Timeline of Events</span>
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
                                    <div key={e.id} className={`glass-card p-3 rounded-xl flex justify-between items-center text-xs card-hover group ${e.type === 'income' ? 'border-l-4 border-l-emerald-400' : 'border-l-4 border-l-red-400'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`${e.type === 'income' ? 'icon-badge-green' : 'icon-badge-rose'} p-1.5 rounded-xl text-white`}>
                                                <Calendar size={12} />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-700">{e.name}</span>
                                                <span className="text-slate-400 ml-2">Age {e.age}{e.isRecurring && e.endAge ? `-${e.endAge}` : ''}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={e.type === 'income' ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                                                {e.type === 'income' ? '+' : '-'}£{(e.amount / 1000).toFixed(1)}k
                                            </span>
                                            <button
                                                onClick={() => {
                                                    const updated = inputs.events.filter(ev => ev.id !== e.id);
                                                    updateInput('events', updated);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete event"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 italic text-center py-4 border border-dashed border-slate-200 rounded-xl bg-white/50">
                                No major life events (Weddings, Uni, etc.)
                            </div>
                        )
                    }
                </AccordionItem>

                {/* PILLAR 5: FINE-TUNING */}
                <AccordionItem
                    title="Growth & Strategy"
                    icon={Settings}
                    isOpen={activeSection === 'config'}
                    onToggle={() => toggleSection('config')}
                >
                    {/* Strategy Widget */}
                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">
                            Flow & Drawdown
                        </label>

                        <button
                            onClick={() => setStrategyModalOpen(true)}
                            className="w-full glass-card rounded-xl p-4 card-hover text-left group border-l-4 border-l-indigo-400"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-slate-800">Configure Flow</span>
                                <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold group-hover:bg-indigo-200 transition">
                                    Edit
                                </span>
                            </div>
                            <div className="text-xs text-slate-500">
                                Allocation & Withdrawal Order
                            </div>
                        </button>

                        {/* 25% Tax Free Lump Sum Config */}
                        <div className="glass-card p-4 rounded-xl mt-3 card-hover border-l-4 border-l-amber-400">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-slate-800">Tax Free Cash Strategy</div>
                                    <div className="text-xs text-slate-400 mt-0.5">Take 25% tax free at {Math.max(inputs.retirementAge, inputs.pensionAccessAge)}?</div>
                                </div>
                                <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                                    <button
                                        onClick={() => updateInput('pensionLumpSumMode', 'drip')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${inputs.pensionLumpSumMode === 'drip' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Drip Feed
                                    </button>
                                    <button
                                        onClick={() => updateInput('pensionLumpSumMode', 'upfront')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${inputs.pensionLumpSumMode === 'upfront' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        All at Once
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Maximize ISA Allowance */}
                        <div className="glass-card p-4 rounded-xl mt-3 card-hover border-l-4 border-l-emerald-400">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <div className="text-sm font-semibold text-slate-800">Maximize ISA Allowance</div>
                                    <div className="text-xs text-slate-400 mt-0.5">Move funds from GIA/Cash to ISA annually</div>
                                </div>
                                <input
                                    type="checkbox"
                                    className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                                    checked={inputs.maxISAFromGIA}
                                    onChange={e => updateInput('maxISAFromGIA', e.target.checked)}
                                />
                            </label>
                        </div>
                    </div>

                    <SliderInput
                        label="Inflation Assumption"
                        min={0} max={10} step={0.5}
                        value={inputs.inflation}
                        onChange={v => updateInput('inflation', v)}
                        formatValue={v => `${v}%`}
                    />

                    <div className="my-4 pt-4 border-t border-white/10">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-3">Asset Growth Rates</label>

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

                </AccordionItem >

                {/* Mobile Spacer */}
                < div className="h-16 md:hidden" ></div >
            </div >
        </>
    );

    return (
        <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden">

            {/* --- Mobile Header --- */}
            <div className="md:hidden header-gradient p-4 flex flex-col gap-3 flex-shrink-0 z-20">
                <div className="flex justify-between items-center">
                    <h1 className="text-lg font-bold text-white flex items-center gap-3">
                        <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center">
                            <Compass size={20} className="text-white" />
                        </div>
                        <span className="text-white font-extrabold tracking-tight">RetirePlan</span>
                    </h1>
                    <button
                        onClick={() => {
                            setSettingsTab('plan');
                            setSettingsOpen(true);
                        }}
                        className="btn-glass p-2.5 rounded-xl"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* --- Mobile Impact Bar --- */}
            {mobileTab === 'inputs' && (
                <div className={`md:hidden px-4 py-3 flex items-center justify-between text-xs sticky top-0 z-10 shadow-lg backdrop-blur-lg ${fundsRunOutAge
                    ? 'bg-red-600 text-white'
                    : 'bg-teal-600 text-white'
                    }`}>
                    <div className="flex flex-col">
                        <span className="opacity-80 text-[10px] font-medium uppercase tracking-wide">Projected Legacy</span>
                        <span className="font-bold text-lg number-display">{formatLargeMoney(totalNetWorthEnd)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="opacity-80 text-[10px] font-medium uppercase tracking-wide">Funds Last</span>
                        <div className="font-bold text-lg flex items-center gap-2">
                            {fundsRunOutAge ? (
                                <>
                                    <AlertTriangle size={16} className="text-yellow-300 animate-pulse" />
                                    <span>Age {fundsRunOutAge}</span>
                                </>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <ShieldCheck size={16} className="text-emerald-200" />
                                    90+
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- Sidebar (Inputs) --- */}
            <div className={`
        md:w-[420px] md:flex-shrink-0 md:flex md:flex-col md:relative md:h-full md:z-10
        w-full h-full absolute inset-0 md:static overflow-hidden flex flex-col sidebar-gradient
        ${mobileTab === 'inputs' ? 'z-10 flex' : 'hidden md:flex'}
      `}>
                {/* Desktop Header */}
                <div className="hidden md:flex p-6 border-b border-white/10 justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
                                <Compass size={22} className="text-white" />
                            </div>
                            <span className="text-white tracking-tight">RetirePlan</span>
                        </h1>
                        <p className="text-xs text-white/50 mt-1.5 ml-[52px]">Your Financial Future, Visualized</p>
                    </div>
                    <button
                        onClick={() => {
                            setSettingsTab('plan');
                            setSettingsOpen(true);
                        }}
                        className="btn-glass p-2.5 rounded-xl"
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>
                </div>

                {renderSidebarContent()}

                {/* Desktop Disclaimer */}
                <div className="hidden md:block p-4 bg-black/20 border-t border-white/10 text-[10px] text-white/40 leading-relaxed">
                    Not financial advice. Calculations are approximations based on simplified assumptions.
                </div>
            </div>

            {/* --- Main Dashboard (Right) --- */}
            <div className={`
        flex-1 flex flex-col h-full relative overflow-hidden main-panel
        ${mobileTab === 'results' ? 'flex' : 'hidden md:flex'}
      `}>



                {/* Stats Header */}
                <div className="glass-card border-b border-slate-100 p-4 md:p-6 flex flex-col md:flex-row md:items-start justify-between z-10 gap-4 md:gap-0">
                    <div className="flex justify-between w-full md:w-auto md:block">
                        <div>
                            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 flex items-center gap-3">
                                Your Future
                                <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                                    Age {calculatedAge} → {inputs.lifeExpectancy}
                                </span>
                            </h2>

                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                                <span className="font-semibold text-slate-700">{activeScenario.name}</span>
                                <button
                                    onClick={() => {
                                        setSettingsTab('scenarios');
                                        setSettingsOpen(true);
                                    }}
                                    className="text-slate-400 hover:text-primary-600 p-1.5 rounded-xl hover:bg-primary-50 transition"
                                    title="Change Scenario"
                                >
                                    <Pencil size={14} />
                                </button>
                                {scenarios.length === 1 && (
                                    <button
                                        onClick={addScenario}
                                        className="text-xs text-primary-600 font-semibold hover:underline ml-1"
                                    >
                                        + New Scenario
                                    </button>
                                )}
                                <span className="text-slate-300">•</span>
                                <span>Retire at <strong className="text-slate-700">{inputs.retirementAge}</strong></span>
                            </div>
                        </div>
                        {/* Mobile Review Plan Button */}
                        <button
                            onClick={() => setReviewModalOpen(true)}
                            className="md:hidden p-2.5 bg-teal-600 text-white rounded-xl"
                        >
                            <UserCheck size={20} />
                        </button>
                    </div>

                    {/* New Status Dashboard */}
                    <div className="w-full md:w-auto flex-1 md:max-w-xl">
                        <StatusBanner
                            results={deferredResults}
                            onReview={() => setReviewModalOpen(true)}
                            annualSpending={inputs.annualSpending}
                        />
                    </div>

                </div>

                {/* Chart View Config */}
                <div className="px-4 md:px-6 pt-4 pb-2 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 gap-3 md:gap-0">
                    <div className="flex p-1.5 bg-white border border-slate-200 rounded-xl w-full md:w-auto">
                        <button
                            onClick={() => setChartMode('cashflow')}
                            className={`flex-1 md:flex-none justify-center px-4 py-2 text-xs md:text-sm font-semibold rounded-lg flex items-center gap-2 transition-all ${chartMode === 'cashflow' ? 'bg-teal-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <BarChart2 size={16} /> Cash Flow
                        </button>
                        <button
                            onClick={() => setChartMode('assets')}
                            className={`flex-1 md:flex-none justify-center px-4 py-2 text-xs md:text-sm font-semibold rounded-lg flex items-center gap-2 transition-all ${chartMode === 'assets' ? 'bg-teal-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <LineChart size={16} /> Asset Value
                        </button>
                    </div>

                    {chartMode === 'assets' && (
                        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <div className="flex items-center gap-3 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-sm whitespace-nowrap min-w-max">
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
                <div className="flex-1 px-2 md:px-6 pb-20 md:pb-6 pt-2 flex flex-col min-h-0">

                    {/* Fee Warning Banner (>£100k) */}
                    {(() => {
                        const finalRes = deferredResults[deferredResults.length - 1];
                        if (!finalRes || !finalRes.benchmarkPensionPot) return null;
                        const totalOpportunityCost = finalRes.benchmarkPensionPot - finalRes.balancePension;

                        if (totalOpportunityCost > 100000) {
                            return (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between shadow-sm animate-in slide-in-from-top-2 flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
                                            <AlertTriangle size={20} className="text-red-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-red-800">Fee Warning</h4>
                                            <p className="text-xs text-red-700 mt-0.5 max-w-xl">
                                                If you used a cheaper broker, the compound effect of these fees would be <strong>{formatLargeMoney(totalOpportunityCost)}</strong> over duration of this plan.
                                            </p>
                                        </div>
                                    </div>
                                    <button className="hidden sm:block px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition shadow-sm">
                                        Compare Platforms
                                    </button>
                                </div>
                            );
                        }
                    })()}

                    <div className="flex-1 bg-white rounded-xl shadow-xl p-3 md:p-5 min-h-0">
                        <ResultsChart
                            data={deferredResults}
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
            <div className="md:hidden fixed bottom-0 left-0 right-0 mobile-nav-glass flex justify-around p-3 z-50 pb-safe">
                <button
                    onClick={() => setMobileTab('inputs')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl w-full transition-all ${mobileTab === 'inputs' ? 'text-white bg-white/20' : 'text-white/60'}`}
                >
                    <Edit3 size={22} />
                    <span className="text-[10px] font-semibold">Edit Plan</span>
                </button>
                <button
                    onClick={() => setMobileTab('results')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl w-full transition-all ${mobileTab === 'results' ? 'text-white bg-white/20' : 'text-white/60'}`}
                >
                    <PieChart size={22} />
                    <span className="text-[10px] font-semibold">Projection</span>
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

            <ReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                inputs={inputs}
                results={results}
                fundsRunOutAge={fundsRunOutAge}
                finalNetWorth={totalNetWorthEnd}
            />

        </div >
    );
};

export default App;