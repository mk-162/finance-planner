
import React, { useState, useEffect } from 'react';
import { UserInputs } from '../types';
import { AssetInput } from './AssetInput';
import { SmartInput } from './SmartInput';
import { calculateProjection, getStatePensionAge } from '../services/calculationEngine';
import { ChevronRight, ChevronLeft, Check, Target, Wallet, TrendingUp, Home, Calendar, CreditCard, Building, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { NumberInput, SimpleFormattedInput, SliderInput } from './InputSection';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialInputs: UserInputs;
    onComplete: (inputs: UserInputs) => void;
}

const FULL_STATE_PENSION = 11502;

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, initialInputs, onComplete }) => {
    const [step, setStep] = useState(0);
    const [data, setData] = useState<UserInputs>(initialInputs);
    const [paysFullNI, setPaysFullNI] = useState(true);

    // Tab states for complex sections
    const [incomeTab, setIncomeTab] = useState<'salary' | 'rental' | 'other' | 'db'>('salary');

    // Local state for new entries
    const [newDB, setNewDB] = useState({ name: '', amount: 0, age: 65 });
    const [newRental, setNewRental] = useState({
        name: '',
        value: 200000,
        rent: 1000,
        hasMortgage: false,
        mortgageBalance: 150000,
        mortgageRate: 4.5,
        mortgagePayment: 800,
        mortgageType: 'interest_only' as 'repayment' | 'interest_only'
    });

    const [newMortgage, setNewMortgage] = useState({
        name: 'Main Home',
        balance: 200000,
        payment: 1000,
        rate: 4.5,
        endAge: 65,
        type: 'repayment' as 'repayment' | 'interest_only'
    });

    const [newDebt, setNewDebt] = useState({
        name: '',
        balance: 0,
        payment: 0,
        endYear: new Date().getFullYear() + 1
    });

    useEffect(() => {
        if (isOpen) {
            setData(initialInputs);
            setStep(0);
            setPaysFullNI(initialInputs.statePension >= 11000);
        }
    }, [isOpen, initialInputs]);


    if (!isOpen) return null;

    const update = (key: keyof UserInputs, value: any) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    // Helper for adding simple items to lists
    const addMortgage = () => {
        const newM = {
            id: Math.random().toString(36).substr(2, 9),
            name: 'Main Home',
            balance: 200000,
            monthlyPayment: 1000,
            interestRate: 4.5,
            type: 'repayment' as const,
            endAge: data.retirementAge
        };
        const list = data.mortgages || [];
        update('mortgages', [...list, newM]);
    };

    const removeMortgage = (id: string) => {
        update('mortgages', (data.mortgages || []).filter(m => m.id !== id));
    };

    const addDebt = () => {
        const newD = {
            id: Math.random().toString(36).substr(2, 9),
            name: 'Credit Card',
            balance: 2000,
            monthlyPayment: 100,
            interestRate: 19.9,
            startAge: data.currentAge
        };
        const list = data.loans || [];
        update('loans', [...list, newD]);
    };

    const removeDebt = (id: string) => {
        update('loans', (data.loans || []).filter(l => l.id !== id));
    };


    const steps = [
        {
            id: 'welcome',
            title: 'Welcome to RetirePlan',
            icon: Target,
            content: (
                <div className="text-center space-y-4">

                    <h3 className="text-xl font-bold text-slate-800">Let's build your financial picture</h3>
                    <p className="text-slate-600 max-w-sm mx-auto text-sm">
                        We'll guide you through setting up your profile. Don't worry, you can change everything later.
                    </p>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left max-w-sm mx-auto mt-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">How to use this app:</h4>
                        <ul className="space-y-2 text-sm text-slate-700">
                            <li className="flex gap-2">
                                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                                <span>Enter your <strong>Income & Assets</strong> first.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                                <span>Use the <strong>Sliders</strong> to test retirement ages.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                                <span>Check the <strong>Cashflow Chart</strong> to see if you run out of money.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0">4</span>
                                <span>Save your data by <strong>downloading</strong> onto your machine.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-green-50/50 border border-green-100 p-3 rounded-xl flex gap-3 text-left max-w-sm mx-auto">
                        <div className="bg-green-100 p-2 rounded-full h-fit text-green-700">
                            <ShieldCheck size={16} />
                        </div>
                        <div className="text-xs text-green-800">
                            <strong>Privacy Guarantee:</strong> Your personal data never leaves your browser. We do not save or store any data centrally. Delete your browser data if others are using this device.
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'timeline',
            title: 'Your Timeline',
            icon: Calendar,
            content: (
                <div className="space-y-6">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-semibold text-slate-700">Year of Birth</label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">Age: {new Date().getFullYear() - (data.birthYear || 1984)}</span>
                                <span className="font-bold text-blue-600 bg-white border border-blue-100 px-2 py-0.5 rounded text-sm shadow-sm">{data.birthYear || 1984}</span>
                            </div>
                        </div>
                        <input
                            type="range" min={1955} max={2005} step={1}
                            value={data.birthYear || 1984}
                            onChange={(e) => {
                                const year = Number(e.target.value);
                                update('birthYear', year);
                                update('statePensionAge', getStatePensionAge(year));
                            }}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-semibold text-slate-700">Target Retirement Age</label>
                            <span className="font-bold text-green-600 bg-white border border-slate-200 px-2 py-0.5 rounded text-sm shadow-sm">{data.retirementAge}</span>
                        </div>
                        <input
                            type="range" min={50} max={80}
                            value={data.retirementAge}
                            onChange={(e) => update('retirementAge', Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                        />
                        <p className="text-xs text-slate-500 mt-2 text-center">
                            Working Years Remaining: <strong className="text-slate-800">{Math.max(0, data.retirementAge - (new Date().getFullYear() - (data.birthYear || 1984)))}</strong>
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'income',
            title: 'Income Sources',
            icon: TrendingUp,
            content: (
                <div className="space-y-4">

                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-100 rounded-lg mb-2 overflow-x-auto">
                        <button onClick={() => setIncomeTab('salary')} className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-md transition whitespace-nowrap ${incomeTab === 'salary' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Salary</button>
                        <button onClick={() => setIncomeTab('rental')} className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-md transition whitespace-nowrap ${incomeTab === 'rental' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Rental</button>
                        <button onClick={() => setIncomeTab('other')} className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-md transition whitespace-nowrap ${incomeTab === 'other' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Dividends</button>
                        <button onClick={() => setIncomeTab('db')} className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-md transition whitespace-nowrap ${incomeTab === 'db' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Pensions (DB)</button>
                    </div>

                    {incomeTab === 'salary' && (
                        <div className="mobile-touch-target space-y-4 animate-in fade-in slide-in-from-right-2">
                            <SmartInput
                                label="Annual Salary"
                                subLabel="Gross Income"
                                value={data.currentSalary}
                                onChange={(v) => {
                                    update('currentSalary', v);
                                    update('isSalaryGross', true);
                                }}
                                min={0} max={200000} step={1000} prefix="£"
                            />
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-xs font-bold text-slate-600">State Pension</div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={paysFullNI} onChange={e => {
                                            setPaysFullNI(e.target.checked);
                                            if (e.target.checked) update('statePension', FULL_STATE_PENSION);
                                        }} className="rounded text-blue-600" />
                                        <span className="text-[10px] text-slate-500">I pay full NI</span>
                                    </label>
                                </div>
                                {!paysFullNI && (
                                    <NumberInput label="Amount" value={data.statePension} onChange={v => update('statePension', v)} prefix="£" />
                                )}
                                {paysFullNI && <div className="text-[10px] text-slate-400">Assuming full amount (~£11.5k)</div>}
                            </div>
                        </div>
                    )}

                    {incomeTab === 'rental' && (
                        <div className="animate-in fade-in slide-in-from-right-2">
                            <div className="space-y-2 mb-4">
                                {data.investmentProperties && data.investmentProperties.map((p, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-2 border rounded shadow-sm">
                                        <div>
                                            <div className="text-sm font-bold text-slate-700">{p.name}</div>
                                            <div className="text-[10px] text-slate-500">Value: £{p.value.toLocaleString()}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm font-bold text-green-600">+£{p.monthlyRent}/mo</div>
                                            <button onClick={() => {
                                                const newList = data.investmentProperties.filter((_, i) => i !== idx);
                                                update('investmentProperties', newList);
                                            }} className="text-slate-300 hover:text-red-400"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Add Rental Property</h4>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Property Name"
                                        className="col-span-2 text-xs p-2 border rounded outline-none w-full"
                                        value={newRental.name}
                                        onChange={e => setNewRental({ ...newRental, name: e.target.value })}
                                    />
                                    <div className="flex items-center bg-white border rounded">
                                        <span className="pl-2 text-xs text-slate-400">Val £</span>
                                        <input
                                            type="number"
                                            placeholder="Value"
                                            className="w-full text-xs p-2 outline-none"
                                            value={newRental.value || ''}
                                            onChange={e => setNewRental({ ...newRental, value: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="flex items-center bg-white border rounded">
                                        <span className="pl-2 text-xs text-slate-400">Rent £</span>
                                        <input
                                            type="number"
                                            placeholder="Monthly Rent"
                                            className="w-full text-xs p-2 outline-none"
                                            value={newRental.rent || ''}
                                            onChange={e => setNewRental({ ...newRental, rent: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                {/* Mortgage Toggle */}
                                <div className="mb-2">
                                    <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={newRental.hasMortgage}
                                            onChange={e => setNewRental({ ...newRental, hasMortgage: e.target.checked })}
                                            className="rounded text-blue-600"
                                        />
                                        <span className="text-xs font-bold text-slate-600">Property has a Mortgage?</span>
                                    </label>

                                    {newRental.hasMortgage && (
                                        <div className="mt-2 space-y-2 pl-2 border-l-2 border-slate-200">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex items-center bg-white border rounded">
                                                    <span className="pl-2 text-xs text-slate-400">Bal £</span>
                                                    <input
                                                        type="number"
                                                        className="w-full text-xs p-2 outline-none"
                                                        placeholder="Balance"
                                                        value={newRental.mortgageBalance || ''}
                                                        onChange={e => setNewRental({ ...newRental, mortgageBalance: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="flex items-center bg-white border rounded">
                                                    <span className="pl-2 text-xs text-slate-400">Pay £</span>
                                                    <input
                                                        type="number"
                                                        className="w-full text-xs p-2 outline-none"
                                                        placeholder="Payment"
                                                        value={newRental.mortgagePayment || ''}
                                                        onChange={e => setNewRental({ ...newRental, mortgagePayment: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="flex items-center bg-white border rounded">
                                                    <span className="pl-2 text-xs text-slate-400">Rate %</span>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        className="w-full text-xs p-2 outline-none"
                                                        placeholder="Rate"
                                                        value={newRental.mortgageRate || ''}
                                                        onChange={e => setNewRental({ ...newRental, mortgageRate: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <select
                                                    className="text-xs p-2 border rounded bg-white outline-none"
                                                    value={newRental.mortgageType}
                                                    onChange={e => setNewRental({ ...newRental, mortgageType: e.target.value as any })}
                                                >
                                                    <option value="interest_only">Interest Only</option>
                                                    <option value="repayment">Repayment</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => {
                                        if (!newRental.name || !newRental.rent) return;
                                        const entry = {
                                            id: Math.random().toString(),
                                            name: newRental.name,
                                            value: newRental.value || 0,
                                            monthlyRent: newRental.rent || 0,
                                            growthRate: 3,
                                            hasMortgage: newRental.hasMortgage,
                                            mortgageBalance: newRental.hasMortgage ? newRental.mortgageBalance : undefined,
                                            interestRate: newRental.hasMortgage ? newRental.mortgageRate : undefined,
                                            monthlyPayment: newRental.hasMortgage ? newRental.mortgagePayment : undefined,
                                            isInterestOnly: newRental.hasMortgage ? newRental.mortgageType === 'interest_only' : undefined,
                                            endAge: data.retirementAge // default end age
                                        };
                                        update('investmentProperties', [...(data.investmentProperties || []), entry]);
                                        setNewRental(prev => ({ ...prev, name: '', rent: 0, hasMortgage: false }));
                                    }}
                                    disabled={!newRental.name || !newRental.rent}
                                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                                >
                                    + Add Property
                                </button>
                                <p className="text-[10px] text-slate-400 mt-2 text-center">Rental income is taxable.</p>
                            </div>
                        </div>
                    )}

                    {incomeTab === 'other' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                            <SmartInput
                                label="Dividend Income"
                                value={data.dividendIncome || 0}
                                onChange={(v) => update('dividendIncome', v)}
                                min={0} max={100000} step={1000} prefix="£"
                                colorClass="purple"
                            />
                            <SmartInput
                                label="Side Hustle / Other"
                                value={data.additionalIncome || 0}
                                onChange={(v) => {
                                    update('additionalIncome', v);
                                    update('hasSideHustle', v > 0);
                                }}
                                min={0} max={100000} step={1000} prefix="£"
                                colorClass="emerald"
                            />
                        </div>
                    )}

                    {incomeTab === 'db' && (
                        <div className="animate-in fade-in slide-in-from-right-2">
                            <div className="text-sm text-slate-500 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                Add <strong>Final Salary</strong> or <strong>Defined Benefit</strong> pensions here. Do not add pot-based pensions (save those for the Assets step).
                            </div>
                            <div className="space-y-2">
                                {data.dbPensions && data.dbPensions.map((db, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-2 border rounded shadow-sm">
                                        <div>
                                            <div className="text-sm font-bold text-slate-700">{db.name}</div>
                                            <div className="text-[10px] text-slate-500">Starts Age {db.startAge}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm font-bold text-green-600">£{db.annualIncome.toLocaleString()}/yr</div>
                                            <button onClick={() => {
                                                const newDB = data.dbPensions.filter((_, i) => i !== idx);
                                                update('dbPensions', newDB);
                                            }} className="text-slate-300 hover:text-red-400"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}

                                {/* DB Add Form */}
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Name (e.g. NHS)"
                                            className="col-span-2 text-xs p-2 border rounded outline-none w-full"
                                            value={newDB.name}
                                            onChange={e => setNewDB({ ...newDB, name: e.target.value })}
                                        />
                                        <div className="flex items-center bg-white border rounded">
                                            <span className="pl-2 text-xs text-slate-400">£</span>
                                            <input
                                                type="number"
                                                placeholder="Annual"
                                                className="w-full text-xs p-2 outline-none"
                                                value={newDB.amount || ''}
                                                onChange={e => setNewDB({ ...newDB, amount: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="flex items-center bg-white border rounded">
                                            <span className="pl-2 text-xs text-slate-400">Age</span>
                                            <input
                                                type="number"
                                                placeholder="Start Age"
                                                className="w-full text-xs p-2 outline-none"
                                                value={newDB.age || ''}
                                                onChange={e => setNewDB({ ...newDB, age: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (!newDB.name || !newDB.amount) return;
                                            const entry = { id: Math.random().toString(), name: newDB.name, annualIncome: newDB.amount, startAge: newDB.age, inflationLinked: true };
                                            update('dbPensions', [...(data.dbPensions || []), entry]);
                                            setNewDB({ name: '', amount: 0, age: 65 });
                                        }}
                                        disabled={!newDB.name || !newDB.amount}
                                        className="w-full py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 disabled:opacity-50"
                                    >
                                        + Add Pension
                                    </button>
                                </div>
                                <div className="text-[10px] text-slate-400 text-center mt-1">Inflation linked.</div>
                            </div>
                        </div>
                    )}
                </div>
            )
        },
        {
            id: 'assets',
            title: 'Your Savings',
            icon: Wallet,
            content: (
                <div className="space-y-2">
                    <AssetInput
                        label="Pension Pot"
                        balance={data.savingsPension}
                        contribution={data.contribPension}
                        growth={data.growthPension}
                        onUpdateBalance={(v) => update('savingsPension', v)}
                        onUpdateContribution={(v) => update('contribPension', v)}
                        onUpdateGrowth={(v) => update('growthPension', v)}
                        type="pension"
                        currentSalary={data.currentSalary}
                        colorClass="yellow"
                    />
                    <AssetInput
                        label="ISAs"
                        balance={data.savingsISA}
                        contribution={data.contribISA}
                        growth={data.growthISA}
                        onUpdateBalance={(v) => update('savingsISA', v)}
                        onUpdateContribution={(v) => update('contribISA', v)}
                        onUpdateGrowth={(v) => update('growthISA', v)}
                        type="isa"
                        colorClass="indigo"
                    />
                    <AssetInput
                        label="Cash / Bank"
                        balance={data.savingsCash}
                        contribution={data.contribCash}
                        growth={data.growthCash}
                        onUpdateBalance={(v) => update('savingsCash', v)}
                        onUpdateContribution={(v) => update('contribCash', v)}
                        onUpdateGrowth={(v) => update('growthCash', v)}
                        type="standard"
                        colorClass="lime"
                    />
                    <AssetInput
                        label="GIA / Stocks"
                        balance={data.savingsGIA}
                        contribution={data.contribGIA}
                        growth={data.growthGIA}
                        onUpdateBalance={(v) => update('savingsGIA', v)}
                        onUpdateContribution={(v) => update('contribGIA', v)}
                        onUpdateGrowth={(v) => update('growthGIA', v)}
                        type="standard"
                        colorClass="emerald"
                    />
                </div>
            )
        },
        {
            id: 'liabilities',
            title: 'Debts',
            icon: CreditCard,
            content: (
                <div className="space-y-4">
                    <p className="text-sm text-slate-500 mb-2">Add credit cards, personal loans, or car finance. < span className="font-bold text-slate-700" > Do not include Mortgages here.</span></p >

                    <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
                        {(data.loans || []).map(loan => (
                            <div key={loan.id} className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
                                <div>
                                    <div className="font-bold text-sm text-slate-700">{loan.name}</div>
                                    <div className="text-xs text-slate-500">£{loan.balance.toLocaleString()}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="font-bold text-red-600 text-sm">-£{loan.monthlyPayment}</div>
                                        <div className="text-[10px] text-slate-400">/mo</div>
                                    </div>
                                    <button onClick={() => removeDebt(loan.id)} className="text-slate-300 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(!data.loans || data.loans.length === 0) && (
                            <div className="text-center text-slate-400 text-xs py-2 italic bg-slate-50 rounded border border-slate-100">
                                No debts added yet.
                            </div>
                        )}
                    </div>

                    {/* Add Debt Form */}
                    < div className="bg-slate-50 p-3 rounded-xl border border-slate-200" >
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="col-span-2">
                                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Debt Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Car Loan"
                                    className="w-full text-xs p-2 border rounded outline-none"
                                    value={newDebt.name}
                                    onChange={e => setNewDebt({ ...newDebt, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Balance</label>
                                <div className="relative">
                                    <span className="absolute left-2 top-1.5 text-xs text-slate-400">£</span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full text-xs p-2 pl-5 border rounded outline-none"
                                        value={newDebt.balance || ''}
                                        onChange={e => setNewDebt({ ...newDebt, balance: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Monthly Cost</label>
                                <div className="relative">
                                    <span className="absolute left-2 top-1.5 text-xs text-slate-400">£</span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full text-xs p-2 pl-5 border rounded outline-none"
                                        value={newDebt.payment || ''}
                                        onChange={e => setNewDebt({ ...newDebt, payment: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Target Payoff Year</label>
                                <input
                                    type="number"
                                    placeholder={new Date().getFullYear() + 1 + ""}
                                    className="w-full text-xs p-2 border rounded outline-none"
                                    value={newDebt.endYear || ''}
                                    onChange={e => setNewDebt({ ...newDebt, endYear: Number(e.target.value) })}
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    {newDebt.endYear > new Date().getFullYear()
                                        ? `Ends at age ${data.currentAge + (newDebt.endYear - new Date().getFullYear())}`
                                        : 'Enter the year the debt will be cleared'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                if (!newDebt.name || !newDebt.balance) return;
                                const currentYear = new Date().getFullYear();
                                const yearsUntilEnd = newDebt.endYear - currentYear;
                                const endAge = data.currentAge + Math.max(0, yearsUntilEnd);

                                const entry = {
                                    id: Math.random().toString(),
                                    name: newDebt.name,
                                    balance: newDebt.balance,
                                    monthlyPayment: newDebt.payment,
                                    interestRate: 0, // Not captured in this simplified form
                                    startAge: data.currentAge,
                                    endAge: endAge
                                };
                                update('loans', [...(data.loans || []), entry]);
                                setNewDebt({ name: '', balance: 0, payment: 0, endYear: currentYear + 1 });
                            }}
                            disabled={!newDebt.name || !newDebt.balance || !newDebt.payment}
                            className="w-full py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 disabled:opacity-50 transition"
                        >
                            + Add Debt
                        </button>
                    </div >
                </div>
            )
        },
        {
            id: 'expenses',
            title: 'Living & Housing',
            icon: Home,
            content: (
                <div className="space-y-6">

                    <SmartInput
                        label="Annual Spending"
                        subLabel="Lifestyle (Food, Bills, Holidays)"
                        value={data.annualSpending}
                        onChange={(v) => update('annualSpending', v)}
                        min={10000} max={100000} step={500} prefix="£"
                    >
                        <p className="text-[10px] text-slate-400">Exclude housing costs (Rent/Mortgage).</p>
                    </SmartInput>

                    {/* Housing Mode Switch */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex justify-center gap-4 mb-4 bg-white p-1 rounded-lg border border-slate-100 shadow-sm">
                            <button
                                onClick={() => update('housingMode', 'mortgage')}
                                className={`flex-1 py-1.5 px-4 rounded font-bold text-xs transition ${data.housingMode === 'mortgage' ? 'bg-blue-50 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Own / Mortgage
                            </button>
                            <button
                                onClick={() => update('housingMode', 'rent')}
                                className={`flex-1 py-1.5 px-4 rounded font-bold text-xs transition ${data.housingMode === 'rent' ? 'bg-blue-50 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Rent
                            </button>
                        </div>

                        {data.housingMode === 'rent' ? (
                            <div className="animate-in fade-in">
                                <SmartInput
                                    label="Monthly Rent"
                                    value={data.rentAmount}
                                    onChange={v => update('rentAmount', v)}
                                    min={0} max={5000} step={50} prefix="£"
                                />
                            </div>
                        ) : (
                            <div className="animate-in fade-in space-y-3">
                                {/* Mortgage List */}
                                {(data.mortgages || []).map(m => (
                                    <div key={m.id} className="bg-white border-l-4 border-blue-500 rounded p-3 shadow-sm flex justify-between items-center text-xs">
                                        <div className="flex-1">
                                            <div className="font-bold text-slate-800">{m.name}</div>
                                            <div className="text-slate-500 mt-1 flex gap-3">
                                                <span>Ends Age: <strong className="text-slate-700">{m.endAge}</strong></span>
                                                <span>Bal: <strong className="text-slate-700">£{(m.balance / 1000).toFixed(0)}k</strong></span>
                                                <span>Rate: <strong className="text-slate-700">{m.interestRate}%</strong></span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-0.5 capitalize">{m.type.replace('_', ' ')} Mortgage</div>
                                        </div>
                                        <div className="flex items-center gap-3 pl-3 border-l border-slate-100 ml-3">
                                            <div className="text-right">
                                                <div className="font-bold text-slate-800">£{m.monthlyPayment.toLocaleString()}</div>
                                                <div className="text-[10px] text-slate-400">/mo</div>
                                            </div>
                                            <button onClick={() => removeMortgage(m.id)} className="text-slate-300 hover:text-red-500 transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Add Mortgage Form */}
                                <div className="bg-white p-3 rounded-lg border border-slate-200 mt-2">
                                    <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Add Mortgage</h4>

                                    <div className="space-y-2 mb-3">
                                        <input
                                            type="text"
                                            placeholder="Mortgage Name (e.g. Main Home)"
                                            className="w-full text-xs p-2 border rounded outline-none"
                                            value={newMortgage.name}
                                            onChange={e => setNewMortgage({ ...newMortgage, name: e.target.value })}
                                        />

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex items-center bg-slate-50 border rounded">
                                                <span className="pl-2 text-xs text-slate-400">Bal £</span>
                                                <input
                                                    type="number"
                                                    className="w-full text-xs p-2 bg-transparent outline-none"
                                                    placeholder="Balance"
                                                    value={newMortgage.balance || ''}
                                                    onChange={e => setNewMortgage({ ...newMortgage, balance: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className="flex items-center bg-slate-50 border rounded">
                                                <span className="pl-2 text-xs text-slate-400">Pay £</span>
                                                <input
                                                    type="number"
                                                    className="w-full text-xs p-2 bg-transparent outline-none"
                                                    placeholder="Monthly"
                                                    value={newMortgage.payment || ''}
                                                    onChange={e => setNewMortgage({ ...newMortgage, payment: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className="flex items-center bg-slate-50 border rounded">
                                                <span className="pl-2 text-xs text-slate-400">Rate %</span>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    className="w-full text-xs p-2 bg-transparent outline-none"
                                                    placeholder="Rate"
                                                    value={newMortgage.rate || ''}
                                                    onChange={e => setNewMortgage({ ...newMortgage, rate: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className="flex items-center bg-slate-50 border rounded">
                                                <span className="pl-2 text-xs text-slate-400">End Age</span>
                                                <input
                                                    type="number"
                                                    className="w-full text-xs p-2 bg-transparent outline-none"
                                                    placeholder="End Age"
                                                    value={newMortgage.endAge || ''}
                                                    onChange={e => setNewMortgage({ ...newMortgage, endAge: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>

                                        <select
                                            className="w-full text-xs p-2 border rounded bg-slate-50 outline-none"
                                            value={newMortgage.type}
                                            onChange={e => setNewMortgage({ ...newMortgage, type: e.target.value as any })}
                                        >
                                            <option value="repayment">Repayment Mortgage</option>
                                            <option value="interest_only">Interest Only</option>
                                        </select>
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (!newMortgage.name || !newMortgage.balance) return;
                                            const newM = {
                                                id: Math.random().toString(36).substr(2, 9),
                                                name: newMortgage.name,
                                                balance: newMortgage.balance,
                                                monthlyPayment: newMortgage.payment,
                                                interestRate: newMortgage.rate,
                                                type: newMortgage.type,
                                                endAge: newMortgage.endAge
                                            };
                                            update('mortgages', [...(data.mortgages || []), newM]);
                                            // Reset Defaults
                                            setNewMortgage({ name: 'Buy to Let', balance: 150000, payment: 750, rate: 4.5, endAge: 65, type: 'interest_only' });
                                        }}
                                        disabled={!newMortgage.name || !newMortgage.balance}
                                        className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        + Add Mortgage
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div >
            )
        }
    ];

    const currentStepData = steps[step];
    const isLastStep = step === steps.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            onComplete(data);
        } else {
            setStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(prev => prev - 1);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col min-h-[500px] max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <currentStepData.icon size={20} />
                        </div>
                        <h2 className="font-bold text-slate-800">{currentStepData.title}</h2>
                    </div>
                    <div className="flex gap-1">
                        {steps.map((_, i) => (
                            <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto bg-slate-50/30">
                    <div key={step} className="animate-in fade-in slide-in-from-right-4 duration-300">
                        {currentStepData.content}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center flex-shrink-0">
                    <button
                        onClick={handleBack}
                        disabled={step === 0}
                        className={`flex items-center gap-1 text-slate-500 font-medium hover:text-slate-800 px-3 py-2 rounded transition ${step === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                        <ChevronLeft size={18} /> Back
                    </button>

                    <button
                        onClick={handleNext}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {isLastStep ? 'Complete Setup' : 'Next Step'}
                        {isLastStep ? <Check size={18} /> : <ChevronRight size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};
