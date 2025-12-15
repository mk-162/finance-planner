

import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { UserInputs, FinancialEvent, Scenario, Loan, AdditionalIncome, InvestmentProperty, DefinedBenefitPension, Mortgage } from './types';
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
import { StatePensionModal, FULL_STATE_PENSION as MODAL_FULL_SP, calculateStatePension as calcSP } from './components/StatePensionModal';
import { AssetInput } from './components/AssetInput';
import { DebouncedSlider } from './components/DebouncedSlider';
import { Tooltip } from './components/Tooltip';
import { ReviewModal } from './components/ReviewModal';
import { StatusBanner } from './components/StatusBanner';
import { TaxBreakdownModal } from './components/TaxBreakdownModal';
import { BrokerComparison } from './pages/BrokerComparison';
import { YearlyResult } from './types';
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
    Save,
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
    X,
    CheckCircle,
    Calculator,
    PiggyBank
} from 'lucide-react';

// --- Icon Badge Color Map - All use primary teal accent ---
const iconBadgeColors: Record<string, string> = {
    'Income': 'icon-badge-teal',
    'Savings, Asset and Debt': 'icon-badge-teal',
    'Pensions & Retirement': 'icon-badge-teal',
    'Housing & Debts': 'icon-badge-teal',
    'Spending & Lifestyle': 'icon-badge-teal',
    'Growth & Strategy': 'icon-badge-teal',
};

// --- Accordion Component ---
const AccordionItem = ({ title, id, icon: Icon, children, isOpen, onToggle }: any) => {
    const badgeColor = iconBadgeColors[title] || 'icon-badge-teal';

    return (
        <div id={id} className={`mb-3 rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'bg-slate-800/50' : ''}`}>
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
    missingNIYears: 0,

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

// State Pension full amount (2024/25 rate)
const FULL_STATE_PENSION = 11502; // £221.20/week * 52

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

                        // Migrate legacy additionalIncome to additionalIncomes array
                        if (!s.data.additionalIncomes || s.data.additionalIncomes.length === 0) {
                            if (s.data.additionalIncome && s.data.additionalIncome > 0) {
                                s.data.additionalIncomes = [{
                                    id: 'legacy-additional-income',
                                    name: 'Additional Income',
                                    amount: s.data.additionalIncome,
                                    startAge: s.data.additionalIncomeStartAge || s.data.retirementAge || 65,
                                    endAge: s.data.additionalIncomeEndAge || ((s.data.retirementAge || 65) + 5),
                                    inflationLinked: true
                                }];
                            } else {
                                s.data.additionalIncomes = [];
                            }
                        }
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
    const [eventToEdit, setEventToEdit] = useState<FinancialEvent | null>(null); // New: Track edit state
    const [loanToEdit, setLoanToEdit] = useState<Loan | null>(null); // New: Track edit state
    const [isDebtModalOpen, setDebtModalOpen] = useState(false);
    const [propertyToEdit, setPropertyToEdit] = useState<InvestmentProperty | null>(null); // New: Track edit state
    const [isPropertyModalOpen, setPropertyModalOpen] = useState(false);
    const [mortgageToEdit, setMortgageToEdit] = useState<Mortgage | null>(null); // New: Track edit state
    const [isMortgageModalOpen, setMortgageModalOpen] = useState(false); // New
    const [dbPensionToEdit, setDBPensionToEdit] = useState<DefinedBenefitPension | null>(null); // New: Track edit state
    const [isAdditionalIncomeModalOpen, setAdditionalIncomeModalOpen] = useState(false); // New
    const [additionalIncomeToEdit, setAdditionalIncomeToEdit] = useState<AdditionalIncome | null>(null); // New: Track edit state
    const [isDBPensionModalOpen, setDBPensionModalOpen] = useState(false);
    const [isStatePensionModalOpen, setStatePensionModalOpen] = useState(false);

    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'plan' | 'scenarios' | 'data'>('plan');
    const [isAdvisorModalOpen, setAdvisorModalOpen] = useState(false);
    const [isStrategyModalOpen, setStrategyModalOpen] = useState(false);
    const [selectedTaxYear, setSelectedTaxYear] = useState<YearlyResult | null>(null);
    const [showTaxYearDropdown, setShowTaxYearDropdown] = useState(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [advisorContext, setAdvisorContext] = useState<AdvisorContext>('manual');
    const [isReviewModalOpen, setReviewModalOpen] = useState(false);
    const [showBrokerComparison, setShowBrokerComparison] = useState(false);

    // Input UI Toggles
    const [paysFullNI, setPaysFullNI] = useState(true);

    // Mobile Navigation State
    const [mobileTab, setMobileTab] = useState<'inputs' | 'results'>('results');

    // Chart State
    const [chartMode, setChartMode] = useState<'cashflow' | 'assets' | 'freedom'>('cashflow');
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
    const totalShortfall = results.reduce((acc, r) => acc + (r.shortfall || 0), 0);

    const shortfallYear = results.find(r => r.shortfall > 100);
    const fundsRunOutAge = shortfallYear ? shortfallYear.age : null;

    // Check NI status on load and when state pension changes
    useEffect(() => {
        setPaysFullNI(inputs.statePension >= 11000);
    }, [activeScenarioId, inputs.statePension]);

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
        const name = window.prompt(
            'Enter a name for your new scenario:\n\n(Tip: You can rename scenarios anytime using the pencil icon)',
            `${activeScenario.name} (Copy)`
        );

        if (!name) return; // User cancelled

        const newId = Math.random().toString(36).substr(2, 9);
        const newScenario: Scenario = {
            id: newId,
            name: name.trim() || `${activeScenario.name} (Copy)`,
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
        const isOpening = activeSection !== section;
        setActiveSection(isOpening ? section : '');

        if (isOpening) {
            setTimeout(() => {
                const el = document.getElementById(`section-${section}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        }
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
                <AccordionItem
                    id="section-quick-controls"
                    title="Key Metrics"
                    icon={SlidersHorizontal}
                    isOpen={activeSection === 'quick-controls'}
                    onToggle={() => toggleSection('quick-controls')}
                >

                    {/* Outgoings Slider */}
                    <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="flex items-center gap-1 text-xs font-medium text-white/60">
                                Annual Spending
                                <Tooltip text="Your annual spending in today's money, excluding housing. We account for inflation and optional spending tapering in old age." variant="dark" />
                            </span>
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
                            <span className="flex items-center gap-1 text-xs font-medium text-white/60">
                                Retirement Age
                                <Tooltip text="The age you stop full-time work. You can add additional income sources after this age if you plan to work part-time or have other income in retirement." variant="dark" />
                            </span>
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

                    {/* Pension Yield Slider */}
                    <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="flex items-center gap-1 text-xs font-medium text-white/60">
                                Pension Growth
                                <Tooltip text="Expected annual investment growth before fees. Global equity funds historically average 7-10%. This is applied to all your pension investments." variant="dark" />
                            </span>
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

                    {/* Pension Fees Slider */}
                    <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="flex items-center gap-1 text-xs font-medium text-white/60">
                                Pension Fees
                                <Tooltip text="The annual fee your pension provider charges. This is deducted from your investment growth each year. High fees significantly reduce your final pot over time." variant="dark" />
                            </span>
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
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="text-[10px] text-red-300 uppercase font-bold mb-1 flex items-center gap-1">
                                            <AlertTriangle size={12} className="text-red-400" />
                                            Fee Warning
                                        </div>
                                        <div className="text-xs text-slate-200 mb-2 leading-relaxed">
                                            These fees could cost you <span className="font-bold text-red-300">{formatLargeMoney(totalOpportunityCost)}</span> in lost growth.
                                        </div>
                                        <div className="text-[10px] text-slate-400 mb-3">
                                            There are multiple UK regulated pension providers that would lower your fees.
                                        </div>
                                        <button
                                            onClick={() => setShowBrokerComparison(true)}
                                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded shadow-sm hover:shadow-md transition-colors"
                                        >
                                            Fix this
                                        </button>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </AccordionItem>

                {/* PILLAR 1: INCOME */}
                <AccordionItem
                    id="section-income"
                    title="Income"
                    icon={TrendingUp}
                    isOpen={activeSection === 'income'}
                    onToggle={() => toggleSection('income')}
                >
                    <div className="space-y-3">
                        {/* Salary */}
                        <SmartInput
                            label="Main Income"
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
                            tooltip="Your primary employment income. Use Gross if you receive salary sacrifice benefits, otherwise use Net (take-home pay)."
                            rightTooltip="Expected annual salary increase or decrease. Can be negative if you expect income to reduce over time."
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

                        {/* Additional Income / Semi-Retirement */}
                        <div className="glass-card p-4 rounded-xl card-hover relative group">
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                    <div className="font-bold text-sm text-slate-800">Additional Income</div>
                                    <div className="text-xs text-slate-400">Part Time, Dividends etc</div>
                                </div>
                                <button
                                    onClick={() => {
                                        setAdditionalIncomeToEdit(null);
                                        setAdditionalIncomeModalOpen(true);
                                    }}
                                    className="text-xs text-emerald-600 font-bold hover:underline"
                                >
                                    + Add Item
                                </button>
                            </div>

                            <div className="space-y-2 mt-3">
                                {inputs.additionalIncomes && inputs.additionalIncomes.map(inc => (
                                    <div
                                        key={inc.id}
                                        onClick={() => {
                                            setAdditionalIncomeToEdit(inc);
                                            setAdditionalIncomeModalOpen(true);
                                        }}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-emerald-50 cursor-pointer border border-transparent hover:border-emerald-100 transition group/item"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="icon-badge-teal p-1.5 rounded-lg text-white">
                                                <TrendingUp size={12} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-xs text-slate-700">{inc.name}</div>
                                                <div className="text-[10px] text-slate-400">
                                                    Age {inc.startAge}-{inc.endAge}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="font-bold text-sm text-emerald-600">£{inc.amount.toLocaleString()}</div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const updated = inputs.additionalIncomes?.filter(i => i.id !== inc.id) || [];
                                                    updateInput('additionalIncomes', updated);
                                                }}
                                                className="opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-red-500 transition"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(!inputs.additionalIncomes || inputs.additionalIncomes.length === 0) && (
                                    <div className="text-center py-2 text-xs text-slate-300 italic">No additional income streams</div>
                                )}
                            </div>
                        </div>

                        {/* Rental Income */}
                        <div className="glass-card p-4 rounded-xl card-hover relative group">
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                    <div className="font-bold text-sm text-slate-800">Rental Income</div>
                                    <div className="text-[10px] text-slate-500">From investment properties</div>
                                </div>
                                <button
                                    onClick={() => {
                                        setPropertyToEdit(null);
                                        setPropertyModalOpen(true);
                                    }}
                                    className="text-xs text-blue-600 font-bold hover:underline"
                                >
                                    + Add Property
                                </button>
                            </div>

                            <div className="space-y-2 mt-3">
                                {inputs.investmentProperties && inputs.investmentProperties.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => {
                                            setPropertyToEdit(p);
                                            setPropertyModalOpen(true);
                                        }}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 cursor-pointer border border-transparent hover:border-blue-100 transition group/item"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                                                <Building size={12} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-xs text-slate-700">{p.name}</div>
                                                <div className="text-[10px] text-slate-400">
                                                    Val: £{(p.value / 1000).toFixed(0)}k | Rent: £{p.monthlyRent}/mo
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="font-bold text-sm text-blue-600">
                                                £{((p.monthlyRent - p.monthlyCost) * 12).toLocaleString()}
                                                <span className="text-[9px] text-slate-400 font-normal ml-0.5">/yr</span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const updated = inputs.investmentProperties?.filter(x => x.id !== p.id) || [];
                                                    updateInput('investmentProperties', updated);
                                                }}
                                                className="opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-red-500 transition"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(!inputs.investmentProperties || inputs.investmentProperties.length === 0) && (
                                    <div className="text-center py-2 text-xs text-slate-300 italic">No investment properties</div>
                                )}
                            </div>
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
                    </div>

                    {/* Guidance Note */}
                    <p className="text-[10px] text-slate-400 italic mt-4 text-center">
                        One-off income such as property sales or inheritance can be added in the Lifestyle Events section.
                    </p>
                </AccordionItem>

                {/* PILLAR 2: PENSIONS & RETIREMENT */}
                < AccordionItem
                    id="section-pensions-retirement"
                    title="Pensions & Retirement"
                    icon={Briefcase}
                    isOpen={activeSection === 'pensions-retirement'}
                    onToggle={() => toggleSection('pensions-retirement')}
                >
                    {/* State Pension (UK) */}
                    <div className="glass-card p-3 rounded-xl card-hover mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-700 uppercase">State Pension</span>
                                <Tooltip text="UK State Pension based on your National Insurance record. You need 35 qualifying years for the full amount. Check your NI record on gov.uk to see your forecast." />
                                <a
                                    href="https://www.gov.uk/check-state-pension"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-teal-600 hover:underline flex items-center gap-0.5"
                                >
                                    Check NI Record <ArrowUpRight size={10} />
                                </a>
                            </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <input
                                type="checkbox"
                                checked={(inputs.missingNIYears || 0) === 0}
                                onChange={e => {
                                    if (e.target.checked) {
                                        updateInput('missingNIYears', 0);
                                        updateInput('statePension', FULL_STATE_PENSION);
                                    } else {
                                        // Default to 1 year missing
                                        const newYears = 1;
                                        updateInput('missingNIYears', newYears);
                                        const newPension = Math.round(FULL_STATE_PENSION * ((35 - newYears) / 35));
                                        updateInput('statePension', newPension);
                                    }
                                }}
                                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 border-slate-300"
                            />
                            <span className="text-xs font-bold text-slate-700">Max. National Insurance contributions (35 years)</span>
                        </label>

                        {(inputs.missingNIYears || 0) > 0 && (
                            <div className="mt-2 pl-6 animate-slide-down">
                                <SliderInput
                                    label="Missing NI Years"
                                    min={1} max={35}
                                    value={inputs.missingNIYears || 0}
                                    onChange={(v) => {
                                        const years = Math.round(v);
                                        const ratio = Math.max(0, (35 - years) / 35);
                                        updateInput('missingNIYears', years);
                                        updateInput('statePension', Math.round(FULL_STATE_PENSION * ratio));
                                    }}
                                />
                                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                                    <AlertTriangle size={12} className="text-amber-500" />
                                    <span>
                                        {(Math.max(0, (35 - (inputs.missingNIYears || 0)) / 35) * 100).toFixed(0)}% of full pension ({inputs.missingNIYears} years missing)
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mb-4 pt-4 border-t border-white/10">
                        <SliderInput
                            label="Access Private Pension Age"
                            min={55} max={65}
                            value={inputs.pensionAccessAge}
                            onChange={v => updateInput('pensionAccessAge', v)}
                            tooltip="The earliest age you can access your private pension. Currently 55, rising to 57 in 2028."
                        />
                    </div>

                    {/* Private Pension Pots */}
                    <div className="mt-4">
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
                        <p className="text-[9px] text-slate-400 mt-3">
                            Enter what you pay. Basic rate tax relief (25% gross-up) is added automatically.
                        </p>
                    </div>

                    {/* Defined Benefit Pensions */}
                    <div className="glass-card p-4 rounded-xl card-hover relative group mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <div className="font-bold text-sm text-slate-800">Defined Benefit Pensions</div>
                                <div className="text-[10px] text-slate-500">Final Salary / Career Average</div>
                            </div>
                            <button
                                onClick={() => {
                                    setDBPensionToEdit(null);
                                    setDBPensionModalOpen(true);
                                }}
                                className="text-xs text-blue-600 font-bold hover:underline"
                            >
                                + Add Pension
                            </button>
                        </div>

                        <div className="space-y-2 mt-3">
                            {inputs.dbPensions && inputs.dbPensions.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => {
                                        setDBPensionToEdit(p);
                                        setDBPensionModalOpen(true);
                                    }}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 cursor-pointer border border-transparent hover:border-blue-100 transition group/item"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 p-1.5 rounded-lg text-green-700">
                                            <ShieldCheck size={12} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-xs text-slate-700">{p.name}</div>
                                            <div className="text-[10px] text-slate-400">
                                                Starts Age {p.startAge} {p.inflationLinked && '• Index Linked'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="font-bold text-sm text-green-700">
                                            £{p.annualIncome.toLocaleString()}
                                            <span className="text-[9px] text-slate-400 font-normal ml-0.5">/yr</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const updated = inputs.dbPensions?.filter(x => x.id !== p.id) || [];
                                                updateInput('dbPensions', updated);
                                            }}
                                            className="opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-red-500 transition"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(!inputs.dbPensions || inputs.dbPensions.length === 0) && (
                                <div className="text-center py-2 text-xs text-slate-300 italic">No DB pensions added</div>
                            )}
                        </div>
                    </div>

                    {/* Spending Tapering in Retirement */}
                    <div className="glass-card p-4 rounded-xl card-hover mt-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-sm text-slate-800">Spending Tapering</span>
                                <Tooltip text="Typically retirees spend less as they get older. At what age do you expect your spending to taper?" />
                            </div>
                            <div className="bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-1 rounded-full border border-amber-200">
                                Optional
                            </div>
                        </div>

                        <div className="space-y-4 mt-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-slate-600">Start Tapering at Age</span>
                                    <span className="text-sm font-bold text-slate-800">{inputs.spendingTaperAge}</span>
                                </div>
                                <input
                                    type="range"
                                    min={60}
                                    max={90}
                                    step={1}
                                    value={inputs.spendingTaperAge}
                                    onChange={(e) => updateInput('spendingTaperAge', Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                    <span>60</span>
                                    <span>90</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-slate-600">Annual Reduction Rate</span>
                                    <span className="text-sm font-bold text-slate-800">{inputs.spendingTaperRate}%</span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={5}
                                    step={0.5}
                                    value={inputs.spendingTaperRate}
                                    onChange={(e) => updateInput('spendingTaperRate', Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                    <span>0%</span>
                                    <span>5%</span>
                                </div>
                            </div>
                        </div>

                        {inputs.spendingTaperRate > 0 && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs text-blue-700">
                                    <span className="font-bold">Effect:</span> Your spending will reduce by {inputs.spendingTaperRate}% per year after age {inputs.spendingTaperAge}.
                                    {(() => {
                                        const yearsOfTaper = inputs.lifeExpectancy - inputs.spendingTaperAge;
                                        if (yearsOfTaper > 0) {
                                            const finalMultiplier = Math.pow(1 - inputs.spendingTaperRate / 100, yearsOfTaper);
                                            const finalSpending = Math.round(inputs.annualSpending * finalMultiplier);
                                            return ` By age ${inputs.lifeExpectancy}, spending would be ~£${finalSpending.toLocaleString()}/yr.`;
                                        }
                                        return '';
                                    })()}
                                </p>
                            </div>
                        )}

                        <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[10px] text-slate-500 italic">
                                <strong>Tip:</strong> If you wish to account for care or medical expenses, add them as events in the Spending section.
                            </p>
                        </div>
                    </div>
                </AccordionItem>

                {/* PILLAR 3: SAVINGS & DEBTS */}
                < AccordionItem
                    id="section-assets"
                    title="Savings, Asset and Debt"
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
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Investment Property</span>
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
                                onClick={() => {
                                    setLoanToEdit(null);
                                    setDebtModalOpen(true);
                                }}
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
                                <div
                                    key={l.id}
                                    onClick={() => {
                                        setLoanToEdit(l);
                                        setDebtModalOpen(true);
                                    }}
                                    className="glass-card p-3 rounded-xl flex justify-between items-center text-xs card-hover border-l-4 border-l-red-400 cursor-pointer group"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="icon-badge-rose p-1.5 rounded-xl text-white">
                                            <CreditCard size={12} />
                                        </div>
                                        <span className="font-semibold text-slate-700">{l.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="font-mono text-red-500 font-bold">-£{(l.balance / 1000).toFixed(1)}k</div>
                                        <button
                                            onClick={(evt) => {
                                                evt.stopPropagation();
                                                const updated = inputs.loans.filter(loan => loan.id !== l.id);
                                                updateInput('loans', updated);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete debt"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
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
                    id="section-spending"
                    title="Spending & Lifestyle"
                    icon={Home}
                    isOpen={activeSection === 'spending'}
                    onToggle={() => toggleSection('spending')}
                >

                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 delay-300">


                        {/* Housing Mode Switch */}
                        <div className="glass-card p-4 rounded-xl card-hover relative group mb-4">
                            <div className="flex justify-center gap-4 mb-4 bg-white/50 p-1 rounded-lg border border-slate-100 shadow-sm relative z-10">
                                <button
                                    onClick={() => updateInput('housingMode', 'mortgage')}
                                    className={`flex-1 py-1.5 px-4 rounded font-bold text-xs transition ${inputs.housingMode === 'mortgage' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Own / Mortgage
                                </button>
                                <button
                                    onClick={() => updateInput('housingMode', 'rent')}
                                    className={`flex-1 py-1.5 px-4 rounded font-bold text-xs transition ${inputs.housingMode === 'rent' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Rent
                                </button>
                            </div>

                            {inputs.housingMode === 'rent' ? (
                                <div className="animate-in fade-in">
                                    <SmartInput
                                        label="Monthly Rent"
                                        value={inputs.rentAmount || 1500}
                                        onChange={v => updateInput('rentAmount', v)}
                                        min={0} max={5000} step={50} prefix="£"
                                        rightLabel="Inflation"
                                        rightValue={inputs.rentInflation || 3}
                                        onRightChange={v => updateInput('rentInflation', v)}
                                        tooltip="Your current monthly rent payment. This will be adjusted for inflation over time."
                                        rightTooltip="Expected annual rent increase. UK average is typically 2-4% per year."
                                    />
                                </div>
                            ) : (
                                <div className="animate-in fade-in space-y-3">
                                    {/* Header / Add Button */}
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="text-[10px] uppercase font-bold text-slate-400">Mortgages</div>
                                        <button
                                            onClick={() => {
                                                setMortgageToEdit(null);
                                                setMortgageModalOpen(true);
                                            }}
                                            className="text-xs text-blue-600 font-bold hover:underline"
                                        >
                                            + Add Mortgage
                                        </button>
                                    </div>

                                    {/* Mortgage List - Clickable */}
                                    <div className="space-y-2">
                                        {inputs.mortgages && inputs.mortgages.map(m => (
                                            <div
                                                key={m.id}
                                                onClick={() => {
                                                    setMortgageToEdit(m);
                                                    setMortgageModalOpen(true);
                                                }}
                                                className="bg-white border-l-4 border-blue-500 rounded-lg p-3 shadow-sm flex justify-between items-center text-xs cursor-pointer hover:bg-blue-50 transition group/item"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-bold text-slate-800">{m.name}</div>
                                                    <div className="text-slate-500 mt-1 flex gap-3">
                                                        <span>Ends Age: <strong className="text-slate-700">{m.endAge}</strong></span>
                                                        <span>Bal: <strong className="text-slate-700">£{(m.balance / 1000).toFixed(0)}k</strong></span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5 capitalize">{m.type ? m.type.replace('_', ' ') : 'repayment'} Mortgage</div>
                                                </div>
                                                <div className="flex items-center gap-3 pl-3 border-l border-slate-100 ml-3">
                                                    <div className="text-right">
                                                        <div className="font-bold text-slate-800">£{m.monthlyPayment.toLocaleString()}</div>
                                                        <div className="text-[10px] text-slate-400">/mo</div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const updated = inputs.mortgages?.filter(x => x.id !== m.id) || [];
                                                            updateInput('mortgages', updated);
                                                        }}
                                                        className="opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-red-500 transition"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!inputs.mortgages || inputs.mortgages.length === 0) && (
                                            <div className="text-center py-2 text-xs text-slate-300 italic">No mortgages added</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <SmartInput
                        label="Lifestyle Spending"
                        subLabel="(Excl. Housing)"
                        value={inputs.annualSpending}
                        onChange={v => updateInput('annualSpending', v)}
                        min={10000}
                        max={200000}
                        step={500}
                        prefix="£"
                        tooltip="Your annual spending in today's money, excluding housing costs. We automatically account for inflation and optional tapering in old age."
                    >
                        <p className="text-[10px] text-slate-500">General spending in today's money.</p>
                    </SmartInput>

                    {/* Timeline of Events */}
                    <div className="flex justify-between items-center mb-3 mt-6 pt-4 border-t border-white/10">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                            Major Life Events / Windfalls
                        </label>
                        <button
                            onClick={() => {
                                setEventToEdit(null); // Clear edit state
                                setEventModalOpen(true);
                            }}
                            className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
                        >
                            <Plus size={14} /> Add Event
                        </button>
                    </div>

                    {/* Healthcare Event Suggestion */}
                    {!inputs.events.some(e => e.name.toLowerCase().includes('health') || e.name.toLowerCase().includes('care') || e.name.toLowerCase().includes('medical')) && (
                        <div className="mb-3 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2">
                                    <div className="bg-rose-100 p-1.5 rounded-lg text-rose-600 mt-0.5">
                                        <AlertTriangle size={14} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-rose-800">Plan for Healthcare Costs?</p>
                                        <p className="text-[10px] text-rose-600 mt-0.5">
                                            Consider adding future healthcare or care home costs.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const healthcareEvent: FinancialEvent = {
                                            id: Math.random().toString(36).substr(2, 9),
                                            name: 'Healthcare / Care Costs',
                                            age: 80,
                                            amount: 15000,
                                            type: 'expense',
                                            isRecurring: true,
                                            endAge: inputs.lifeExpectancy,
                                            taxType: 'tax_free'
                                        };
                                        updateInput('events', [...inputs.events, healthcareEvent]);
                                    }}
                                    className="text-[10px] font-bold text-rose-700 bg-white px-2 py-1 rounded-lg border border-rose-200 hover:bg-rose-100 transition whitespace-nowrap"
                                >
                                    + Add Healthcare
                                </button>
                            </div>
                        </div>
                    )}

                    {
                        inputs.events.length > 0 ? (
                            <div className="space-y-2">
                                {inputs.events.map(e => (
                                    <div
                                        key={e.id}
                                        onClick={() => {
                                            setEventToEdit(e);
                                            setEventModalOpen(true);
                                        }}
                                        className={`glass-card p-3 rounded-xl flex justify-between items-center text-xs card-hover group cursor-pointer ${e.type === 'income' ? 'border-l-4 border-l-emerald-400' : 'border-l-4 border-l-red-400'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`${e.type === 'income' ? 'icon-badge-green' : 'icon-badge-rose'} p-1.5 rounded-xl text-white`}>
                                                <Calendar size={12} />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-700">{e.name}</span>
                                                <span className="text-slate-400 ml-2">Age {e.age}{e.isRecurring && e.endAge ? `- ${e.endAge} ` : ''}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={e.type === 'income' ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                                                {e.type === 'income' ? '+' : '-'}£{(e.amount / 1000).toFixed(1)}k
                                            </span>
                                            <button
                                                onClick={(evt) => {
                                                    evt.stopPropagation(); // Prevent opening modal
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
                </AccordionItem >

                {/* PILLAR 5: FINE-TUNING */}
                < AccordionItem
                    id="section-config"
                    title="Assumptions and Strategy"
                    icon={Settings}
                    isOpen={activeSection === 'config'}
                    onToggle={() => toggleSection('config')}
                >
                    {/* Strategy Widget */}
                    < div className="mb-6" >
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
                                        className={`px - 3 py - 1.5 text - xs font - bold rounded - lg transition ${inputs.pensionLumpSumMode === 'drip' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}
                                    >
                                        Drip Feed
                                    </button>
                                    <button
                                        onClick={() => updateInput('pensionLumpSumMode', 'upfront')}
                                        className={`px - 3 py - 1.5 text - xs font - bold rounded - lg transition ${inputs.pensionLumpSumMode === 'upfront' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}
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
                    </div >

                    <SliderInput
                        label="Inflation Assumption"
                        min={0} max={10} step={0.5}
                        value={inputs.inflation}
                        onChange={v => updateInput('inflation', v)}
                        formatValue={v => `${v}% `}
                    />

                    <div className="my-4 pt-4 border-t border-white/10">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-3">Asset Growth Rates</label>

                        <SliderInput
                            label="Cash Growth"
                            min={0} max={10} step={0.25}
                            value={inputs.growthCash}
                            onChange={v => updateInput('growthCash', v)}
                            formatValue={v => `${v}% `}
                        />
                        <SliderInput
                            label="ISA / GIA Growth"
                            min={0} max={12} step={0.25}
                            value={inputs.growthISA}
                            onChange={v => {
                                updateInput('growthISA', v);
                                updateInput('growthGIA', v);
                            }}
                            formatValue={v => `${v}% `}
                        />
                        <SliderInput
                            label="Pension Growth"
                            min={0} max={12} step={0.25}
                            value={inputs.growthPension}
                            onChange={v => updateInput('growthPension', v)}
                            formatValue={v => `${v}% `}
                        />
                    </div>

                </AccordionItem >

                {/* Mobile Spacer */}
                < div className="h-16 md:hidden" ></div >
            </div >
        </>
    );

    // If showing broker comparison, render that instead of main app
    if (showBrokerComparison) {
        return (
            <BrokerComparison
                userInputs={inputs}
                onBack={() => setShowBrokerComparison(false)}
                scenarios={scenarios}
                activeScenarioId={activeScenarioId}
                onScenarioChange={setActiveScenarioId}
            />
        );
    }

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-900">

            {/* --- Unified Desktop Header (Hidden on Mobile) --- */}
            <header className="hidden md:flex flex-none h-[72px] border-b border-white/10 bg-slate-900 text-white z-20">
                {/* Left: Logo Area (Matches Sidebar Width) */}
                <div className="w-[420px] flex-none px-6 flex items-center border-r border-white/10 bg-slate-900">
                    <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
                        <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center">
                            <Compass size={20} className="text-white" />
                        </div>
                        <span className="text-white tracking-tight">RetirePlan</span>
                    </h1>
                    <p className="text-[10px] text-white/40 mt-1.5 ml-3 font-medium uppercase tracking-wider">v2.0</p>
                </div>

                {/* Right: Global Actions & Status */}
                <div className="flex-1 flex items-center justify-between px-6 bg-slate-900">
                    <div className="flex items-center gap-6">
                        <h2 className="text-xl font-bold text-white tracking-tight">Your Future</h2>

                        {/* Scenario & Age Badge */}
                        <div className="flex items-center gap-3 text-sm">
                            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-medium border border-slate-700">
                                Age {calculatedAge} → {inputs.lifeExpectancy}
                            </span>
                            <div className="h-4 w-px bg-slate-700"></div>

                            <button
                                onClick={() => {
                                    setSettingsTab('scenarios');
                                    setSettingsOpen(true);
                                }}
                                className="flex items-center gap-2 group"
                            >
                                <span className="text-slate-400 font-medium group-hover:text-white transition">{activeScenario.name}</span>
                                <Pencil size={12} className="text-slate-600 group-hover:text-slate-400 transition" />
                            </button>

                            <button
                                onClick={addScenario}
                                className="text-xs text-teal-400 hover:text-teal-300 font-medium hover:underline ml-1"
                            >
                                + New Scenario
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Status Dashboard */}
                        <StatusBanner
                            results={deferredResults}
                            onReview={() => setReviewModalOpen(true)}
                            annualSpending={inputs.annualSpending}
                            retirementAge={inputs.retirementAge}
                        />

                        {/* Global Actions */}
                        <div className="flex items-center gap-1 pl-4 border-l border-white/10">
                            <button
                                onClick={() => {
                                    setSettingsTab('data');
                                    setSettingsOpen(true);
                                }}
                                className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5"
                                title="Import/Export"
                            >
                                <Save size={18} />
                            </button>
                            <button
                                onClick={() => {
                                    setSettingsTab('plan');
                                    setSettingsOpen(true);
                                }}
                                className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5"
                                title="Settings"
                            >
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- Main Body Content --- */}
            <div className="flex flex-1 overflow-hidden md:flex-row flex-col relative">

                {/* --- Mobile Header (Hidden on Desktop) --- */}
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
                    <div className={`md:hidden px - 4 py - 3 flex items - center justify - between text - xs sticky top - 0 z - 10 shadow - lg backdrop - blur - lg ${fundsRunOutAge
                        ? 'bg-red-600 text-white'
                        : 'bg-teal-600 text-white'
                        } `}>
                        <div className="flex flex-col">
                            {fundsRunOutAge ? (
                                <>
                                    <span className="opacity-80 text-[10px] font-medium uppercase tracking-wide text-red-100">Projected Gap</span>
                                    <span className="font-bold text-lg number-display text-white">-{formatLargeMoney(totalShortfall)}</span>
                                </>
                            ) : (
                                <>
                                    <span className="opacity-80 text-[10px] font-medium uppercase tracking-wide">Projected Legacy</span>
                                    <span className="font-bold text-lg number-display">{formatLargeMoney(totalNetWorthEnd)}</span>
                                </>
                            )}
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

                    {/* Navigation Tabs Row (No Header anymore) */}
                    <div className="px-6 pt-4 pb-0 flex items-center justify-between bg-slate-50 border-b border-slate-200/50">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setChartMode('cashflow')}
                                className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all border-b-2 ${chartMode === 'cashflow'
                                    ? 'text-teal-600 border-teal-600 bg-teal-50/50'
                                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'
                                    } `}
                            >
                                <BarChart2 size={16} /> Cash Flow
                            </button>
                            <button
                                onClick={() => setChartMode('assets')}
                                className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all border-b-2 ${chartMode === 'assets'
                                    ? 'text-teal-600 border-teal-600 bg-teal-50/50'
                                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'
                                    } `}
                            >
                                <LineChart size={16} /> Asset Value
                            </button>
                            <button
                                onClick={() => setChartMode('freedom')}
                                className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all border-b-2 ${chartMode === 'freedom'
                                    ? 'text-teal-600 border-teal-600 bg-teal-50/50'
                                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'
                                    } `}
                            >
                                <TrendingUp size={16} /> Net Position
                            </button>
                        </div>

                        {/* Right: Tax Estimate Dropdown */}
                        <div className="flex items-center gap-2 flex-none">
                            <div className="relative">
                                <button
                                    onClick={() => setShowTaxYearDropdown(!showTaxYearDropdown)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm"
                                    title="View tax calculation for a specific year"
                                >
                                    <Calculator size={16} />
                                    <span className="hidden md:inline">Tax Estimate</span>
                                    <ChevronDown size={14} className={`transition-transform ${showTaxYearDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {showTaxYearDropdown && (
                                    <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto min-w-[180px]">
                                        <div className="p-2 border-b border-slate-100">
                                            <p className="text-[10px] text-slate-400 font-medium">Select a year to view tax calculation</p>
                                        </div>
                                        {deferredResults.map((yr, idx) => (
                                            <button
                                                key={`${yr.age}-${idx}`}
                                                onClick={() => {
                                                    setSelectedTaxYear(yr);
                                                    setShowTaxYearDropdown(false);
                                                }}
                                                className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex justify-between items-center"
                                            >
                                                <span className="font-medium text-slate-700">Age {yr.age}</span>
                                                <span className="text-slate-400">{yr.year}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Chart Explainer Text */}
                    <div className="mb-4">
                        {chartMode === 'cashflow' && (
                            <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
                                <span className="font-bold text-slate-800">Cash Flow:</span> Tracks annual money in (<span className="text-emerald-600 font-medium">bars above line</span>) vs. money out (<span className="text-slate-500 font-medium">bars below line</span>). Use this to identify years where expenses might exceed income.
                            </p>
                        )}
                        {chartMode === 'assets' && (
                            <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
                                <span className="font-bold text-slate-800">Asset Value:</span> Shows the projected total value of your assets over time. See how <span className="text-indigo-600 font-medium">compound growth</span> builds your wealth across Pension, ISA, and other pots.
                            </p>
                        )}
                        {chartMode === 'freedom' && (
                            <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
                                <span className="font-bold text-slate-800">Net Position:</span> Your path to Financial Freedom. The <span className="text-emerald-600 font-medium">Green Line</span> shows passive investment growth. When it crosses above <span className="text-slate-800 font-medium">Total Expenses</span>, your assets can support your lifestyle.
                            </p>
                        )}
                    </div>

                    <div className="flex-1 bg-white rounded-xl shadow-xl p-3 md:p-5 min-h-0">
                        <ResultsChart
                            data={deferredResults}
                            mode={chartMode}
                            assetVisibility={assetVisibility}
                            pensionAccessAge={inputs.pensionAccessAge}
                            retirementAge={inputs.retirementAge}
                            mortgageEndAge={inputs.housingMode === 'mortgage' && inputs.mortgages?.length > 0
                                ? Math.max(...inputs.mortgages.map(m => m.endAge || 0))
                                : (inputs.mortgageEndAge || 0)}
                            events={inputs.events}
                            stacked={isStacked}
                            onToggleVisibility={toggleAssetVisibility}
                            onToggleStacked={() => setIsStacked(!isStacked)}
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
                events={inputs.events || []}
                onChange={(updated) => updateInput('events', updated)}
                isOpen={isEventModalOpen}
                onClose={() => setEventModalOpen(false)}
                editEvent={eventToEdit} // Pass editing event
            />

            <DebtModal
                isOpen={isDebtModalOpen}
                onClose={() => setDebtModalOpen(false)}
                loans={inputs.loans || []}
                onChange={(updated) => updateInput('loans', updated)}
                currentAge={calculatedAge}
                editLoan={loanToEdit} // Pass editing loan
            />

            <MortgageModal
                isOpen={isMortgageModalOpen}
                onClose={() => setMortgageModalOpen(false)}
                mortgages={inputs.mortgages || []}
                onChange={(updated) => updateInput('mortgages', updated)}
                currentAge={calculatedAge}
                editMortgage={mortgageToEdit} // Pass editing state
            />

            <PropertyModal
                isOpen={isPropertyModalOpen}
                onClose={() => setPropertyModalOpen(false)}
                properties={inputs.investmentProperties || []}
                onUpdate={(updated) => updateInput('investmentProperties', updated)}
                editProperty={propertyToEdit} // Pass editing state
            />

            <DBPensionModal
                isOpen={isDBPensionModalOpen}
                onClose={() => setDBPensionModalOpen(false)}
                pensions={inputs.dbPensions || []}
                onUpdate={(updated) => updateInput('dbPensions', updated)}
                currentAge={calculatedAge}
                editPension={dbPensionToEdit}
            />

            <StatePensionModal
                isOpen={isStatePensionModalOpen}
                onClose={() => setStatePensionModalOpen(false)}
                missingYears={inputs.missingNIYears ?? 0}
                onMissingYearsChange={(years) => {
                    updateInput('missingNIYears', years);
                    const { annual } = calcSP(years);
                    updateInput('statePension', annual);
                }}
                statePensionAge={inputs.statePensionAge}
            />

            <AdditionalIncomeModal
                isOpen={isAdditionalIncomeModalOpen}
                onClose={() => setAdditionalIncomeModalOpen(false)}
                incomes={inputs.additionalIncomes || []}
                onChange={(updated) => updateInput('additionalIncomes', updated)}
                currentAge={calculatedAge}
                retirementAge={inputs.retirementAge}
                editIncome={additionalIncomeToEdit} // Pass edit state
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

            <TaxBreakdownModal
                isOpen={selectedTaxYear !== null}
                onClose={() => setSelectedTaxYear(null)}
                yearData={selectedTaxYear}
            />

        </div >
    );
};

export default App;