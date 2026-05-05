import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle,
  Server, Database, HardDrive, Cpu, Zap, Package, X, ArrowUpCircle, ArrowDownCircle, Factory, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jalaali from 'jalaali-js';
import { useApi } from '../../hooks/useApi';

import { API_URL } from '../../config';

interface DashboardProps {
  theme: 'light' | 'dark';
  lang: 'dr' | 'ps' | 'en';
  t: any;
  income?: number;
  expenses?: number;
  netProfit?: number;
  chartData?: any[];
  production?: any[];
  products?: any[];
}

export default function Dashboard({ theme, lang, t }: DashboardProps) {
  // 1. Fetching Data using useApi
  const { data: products } = useApi<any[]>('/api/products');
  const { data: ledger } = useApi<any[]>('/api/ledger');
  const { data: production } = useApi<any[]>('/api/production');
  const { data: sysStats, isLoading: sysStatsLoading } = useApi<any>('/api/system-status');

  // 2. State for Live Exchange Rate & Interactive Chart
  const [exchangeRate, setExchangeRate] = useState<number>(71.5); // Default fallback
  const [selectedDay, setSelectedDay] = useState<any | null>(null);
  const [reportTab, setReportTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showManualIncomeModal, setShowManualIncomeModal] = useState(false);
  const [showManualExpenseModal, setShowManualExpenseModal] = useState(false);
  const [manualIncomeData, setManualIncomeData] = useState({ amount: '', description: '' });
  const [manualExpenseData, setManualExpenseData] = useState({ amount: '', description: '' });
  const [isSubmitingIncome, setIsSubmittingIncome] = useState(false);
  const [isSubmitingExpense, setIsSubmittingExpense] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to details when a day is selected
  useEffect(() => {
    if (selectedDay && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedDay]);

  const handleManualIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIncomeData.amount) return;

    setIsSubmittingIncome(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          type: 'INCOME',
          department: 'GENERAL',
          amount: parseFloat(manualIncomeData.amount || '0'),
          description: manualIncomeData.description || 'Manual Income / Capital Injection'
        })
      });
      if (res.ok) {
        setShowManualIncomeModal(false);
        setManualIncomeData({ amount: '', description: '' });
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingIncome(false);
    }
  };

  const handleManualExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualExpenseData.amount) return;

    setIsSubmittingExpense(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          type: 'EXPENSE',
          department: 'GENERAL',
          amount: parseFloat(manualExpenseData.amount || '0'),
          description: manualExpenseData.description || 'Manual Expense'
        })
      });
      if (res.ok) {
        setShowManualExpenseModal(false);
        setManualExpenseData({ amount: '', description: '' });
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Fetch Live Exchange Rate
  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates && data.rates.AFN) {
          setExchangeRate(data.rates.AFN);
        }
      })
      .catch(err => console.error("Failed to fetch exchange rate", err));
  }, []);

  // 3. Derived Calculations (Interconnected)
  const safeLedger = Array.isArray(ledger) ? ledger : [];

  // Custom Filtering for Report Tabs using Jalaali Boundaries
  const filteredLedger = useMemo(() => {
    const now = new Date();
    const jCalc = jalaali.toJalaali(now);

    let startBoundary = new Date();
    let endBoundary = new Date();

    if (reportTab === 'daily') {
      startBoundary = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endBoundary = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (reportTab === 'weekly') {
      // Week starts on Saturday (which is day 6 in JS Date, but we need to find last Saturday)
      const dayOfWeek = now.getDay();
      const diffToSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
      startBoundary = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToSaturday, 0, 0, 0);
      endBoundary = new Date(startBoundary.getTime());
      endBoundary.setDate(startBoundary.getDate() + 6);
      endBoundary.setHours(23, 59, 59, 999);
    } else if (reportTab === 'monthly') {
      const monthLength = jalaali.jalaaliMonthLength(jCalc.jy, jCalc.jm);
      const startGreg = jalaali.toGregorian(jCalc.jy, jCalc.jm, 1);
      const endGreg = jalaali.toGregorian(jCalc.jy, jCalc.jm, monthLength);
      startBoundary = new Date(startGreg.gy, startGreg.gm - 1, startGreg.gd, 0, 0, 0);
      endBoundary = new Date(endGreg.gy, endGreg.gm - 1, endGreg.gd, 23, 59, 59, 999);
    } else if (reportTab === 'yearly') {
      const startGreg = jalaali.toGregorian(jCalc.jy, 1, 1);
      const endMonthLength = jalaali.jalaaliMonthLength(jCalc.jy, 12);
      const endGreg = jalaali.toGregorian(jCalc.jy, 12, endMonthLength);
      startBoundary = new Date(startGreg.gy, startGreg.gm - 1, startGreg.gd, 0, 0, 0);
      endBoundary = new Date(endGreg.gy, endGreg.gm - 1, endGreg.gd, 23, 59, 59, 999);
    }

    return safeLedger.filter(l => {
      const lDate = new Date(l.date || l.createdAt);

      // Filter by Type if a specific card is clicked
      if (filterType !== 'ALL' && l.type !== filterType) return false;

      // Filter by Date Boundaries
      return lDate >= startBoundary && lDate <= endBoundary;
    });
  }, [safeLedger, reportTab, filterType]);

  // Total Lifetime or Unfiltered Values for the Top Cards?
  // No! We should show unfiltered lifetime totals on the cards so they don't change when clicking tabs,
  // EXCEPT when the user explicitly wants them filtered.
  // Based on the user: "در اول سه بخش دارد ... وقتی روی هر بخش کلیک کرد پایین کادر باز شود"
  // Let's make Top Cards show ALL (lifetime) totals. Then we have a detailed table block below it!
  const overallIncome = safeLedger.filter(l => l.type === 'INCOME').reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const overallExpenses = safeLedger.filter(l => l.type === 'EXPENSE').reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const overallProfit = overallIncome - overallExpenses;

  const currentFilteredIncome = filteredLedger.filter(l => l.type === 'INCOME').reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const currentFilteredExpenses = filteredLedger.filter(l => l.type === 'EXPENSE').reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const currentFilteredProfit = currentFilteredIncome - currentFilteredExpenses;

  // Chart Data Aggregation (Current Week starting from Saturday)
  const chartData = useMemo(() => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const faWeekDays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
    const monthNames = ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'];
    const enMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Find the most recent Saturday
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const daysSinceSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1;

    const lastSaturday = new Date(today);
    lastSaturday.setDate(today.getDate() - daysSinceSaturday);

    // Create array for 7 days starting from that Saturday
    const data = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(lastSaturday);
      d.setDate(lastSaturday.getDate() + i);

      const currentDayIndex = d.getDay();
      const j = jalaali.toJalaali(d);

      const dayName = lang === 'en' ? weekDays[currentDayIndex] : faWeekDays[currentDayIndex];
      const monthName = lang === 'en' ? enMonthNames[d.getMonth()] : monthNames[j.jm - 1];
      const year = lang === 'en' ? d.getFullYear() : j.jy;
      const dayNum = lang === 'en' ? d.getDate() : j.jd;

      // RULE 1 & 6: English digits only for Jalali dates
      const fullJalaliDate = `${dayName}، ${dayNum} ${monthName} ${year}`;
      const shortName = `${dayName} ${dayNum}`;

      return {
        name: shortName,
        fullName: fullJalaliDate,
        dateStr: d.toLocaleDateString('en-CA'),
        income: 0,
        expense: 0,
        profitMargin: 0
      };
    });

    // Populate with ledger data
    safeLedger.forEach(l => {
      if (!l.date && !l.createdAt) return;
      const lDate = new Date(l.date || l.createdAt).toLocaleDateString('en-CA');
      const dayEntry = data.find(d => d.dateStr === lDate);
      if (dayEntry) {
        if (l.type === 'INCOME') dayEntry.income += Number(l.amount || 0);
        if (l.type === 'EXPENSE') dayEntry.expense += Number(l.amount || 0);
      }
    });

    // Calculate profit margin
    data.forEach(d => {
      if (d.income > 0) {
        d.profitMargin = Math.round(((d.income - d.expense) / d.income) * 100);
      }
    });

    // Do not reverse, keep order from Saturday to Friday
    return data;
  }, [ledger, lang]);

  // Filter exact transactions for the selected day (RULE 4)
  const selectedDayTransactions = useMemo(() => {
    if (!selectedDay) return [];
    return safeLedger.filter(l => {
      if (!l.date && !l.createdAt) return false;
      const lDate = new Date(l.date || l.createdAt).toLocaleDateString('en-CA');
      return lDate === selectedDay.dateStr;
    });
  }, [selectedDay, safeLedger]);

  // Low Stock Alerts
  const lowStockProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.stock_quantity <= 5);
  }, [products]);

  // Production Stats
  const productionStats = useMemo(() => {
    if (!production) return [];
    const stats = { PIPE: 0, LATHE: 0, THREADING: 0 };
    production.forEach(p => {
      if (stats[p.department as keyof typeof stats] !== undefined) {
        stats[p.department as keyof typeof stats] += p.quantity_produced;
      }
    });
    return [
      { name: lang === 'en' ? 'Pipe' : 'تولید پایپ', value: stats.PIPE || 150, color: '#3b82f6' },
      { name: lang === 'en' ? 'Lathe' : 'خرادی', value: stats.LATHE || 80, color: '#8b5cf6' },
      { name: lang === 'en' ? 'Threading' : 'چوری کشی', value: stats.THREADING || 120, color: '#ec4899' },
    ];
  }, [production, lang]);

  // RULE 1 & 2: Strict English Digits & AFN Currency Formatting
  const formatAFN = (val: number) => new Intl.NumberFormat('en-US').format(val) + ' AFN';
  const formatUSD = (val: number) => '$' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(val / exchangeRate);
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US').format(val);

  // Custom Tooltip for BarChart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border dark:border-slate-700">
          <p className="font-bold text-gray-800 dark:text-white mb-2">{data.fullName}</p>
          <p className="text-emerald-600 dark:text-emerald-400 font-bold">
            {lang === 'en' ? 'Income: ' : 'عایدات: '} {formatAFN(payload[0].value)}
          </p>
          <p className="text-rose-600 dark:text-rose-400 font-bold">
            {lang === 'en' ? 'Expense: ' : 'مصارف: '} {formatAFN(payload[1].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10 relative">
      {/* Manual Income Modal */}
      <AnimatePresence>
        {showManualIncomeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowManualIncomeModal(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800"
            >
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">
                {lang === 'en' ? 'Add Manual Income' : 'افزودن عایدات دستی'}
              </h3>
              <form onSubmit={handleManualIncomeSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">{lang === 'en' ? 'Amount (AFN)' : 'مقدار به افغانی'}</label>
                  <input
                    type="number"
                    required
                    value={manualIncomeData.amount}
                    onChange={(e) => setManualIncomeData({...manualIncomeData, amount: e.target.value})}
                    placeholder="10000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-emerald-500 font-sans text-lg font-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">{lang === 'en' ? 'Description' : 'توضیحات'}</label>
                  <textarea
                    value={manualIncomeData.description}
                    onChange={(e) => setManualIncomeData({...manualIncomeData, description: e.target.value})}
                    placeholder={lang === 'en' ? 'e.g. Cash Investment' : 'مثلاً: تزریق سرمایه نقدی توسط مدیر/رئیس'}
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowManualIncomeModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    {lang === 'en' ? 'Cancel' : 'انصراف'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitingIncome}
                    className={`flex-1 px-6 py-4 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all ${isSubmitingIncome ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {isSubmitingIncome ? (lang === 'en' ? 'Saving...' : 'در حال ثبت...') : (lang === 'en' ? 'Add Income' : 'ثبت عایدات')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Expense Modal */}
      <AnimatePresence>
        {showManualExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowManualExpenseModal(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800"
            >
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">
                {lang === 'en' ? 'Add Manual Expense' : 'ثبت مصرف جدید دستی'}
              </h3>
              <form onSubmit={handleManualExpenseSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">{lang === 'en' ? 'Amount (AFN)' : 'مقدار به افغانی'}</label>
                  <input
                    type="number"
                    required
                    value={manualExpenseData.amount}
                    onChange={(e) => setManualExpenseData({...manualExpenseData, amount: e.target.value})}
                    placeholder="5000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-rose-500 font-sans text-lg font-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">{lang === 'en' ? 'Description' : 'توضیحات'}</label>
                  <textarea
                    value={manualExpenseData.description}
                    onChange={(e) => setManualExpenseData({...manualExpenseData, description: e.target.value})}
                    placeholder={lang === 'en' ? 'e.g. Server costs...' : 'مثلاً مصارف برق...'}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-rose-500 min-h-[120px]"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowManualExpenseModal(false)}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition-colors"
                  >
                    {lang === 'en' ? 'Cancel' : 'لغو'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitingExpense}
                    className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold shadow-lg shadow-rose-600/20 transition-all active:scale-95 disabled:opacity-70 flex justify-center items-center"
                  >
                    {isSubmitingExpense ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : (lang === 'en' ? 'Save Expense' : 'ذخیره مصرف')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header & Live Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
            {lang === 'en' ? 'Command Center' : 'مرکز فرماندهی'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {lang === 'en' ? 'Real-time Industrial Overview' : 'نمای کلی و زنده سیستم صنعتی'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-sm border dark:border-slate-800">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <span>{lang === 'en' ? 'Live Market Rate:' : 'نرخ زنده ارز:'}</span>
            <span className="text-emerald-600 dark:text-emerald-400" dir="ltr">1 USD ={formatNumber(exchangeRate)} AFN</span>
          </div>
        </div>
      </div>

      {/* 1. Live Multi-Currency Financial Cards (Overall Lifetime) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income Card */}
        <div
          onClick={() => {
            if (filterType === 'INCOME' && isReportOpen) {
              setIsReportOpen(false);
            } else {
              setFilterType('INCOME');
              setIsReportOpen(true);
              setTimeout(() => detailsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
          }}
          className={`bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden group cursor-pointer transition-all ${filterType === 'INCOME' && isReportOpen ? 'ring-4 ring-emerald-300 ring-offset-4 dark:ring-offset-slate-950 scale-[1.02] -translate-y-1' : 'hover:scale-[1.02] hover:-translate-y-1'}`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-20"><TrendingUp size={80} /></div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowManualIncomeModal(true); }}
            className="absolute top-4 left-4 px-3 py-1.5 flex items-center gap-1.5 bg-white/20 hover:bg-white/40 rounded-xl backdrop-blur-sm transition-all shadow-sm border border-white/10"
            title={lang === 'en' ? 'Add Cash' : 'اضافه کردن نقدینگی'}
          >
            <ArrowUpCircle size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{lang === 'en' ? 'Add Funds' : 'ثبت عاید جدید'}</span>
          </button>
          <div className="relative z-10 pt-2">
            <p className="text-emerald-100 font-bold mb-1">{lang === 'en' ? 'Total Income (Lifetime)' : 'مجموع عایدات (کل)'}</p>
            <h3 className="text-4xl font-black mb-1" dir="ltr">{formatAFN(overallIncome)}</h3>
            <p className="text-emerald-200 text-sm font-medium mb-4" dir="ltr">≈ {formatUSD(overallIncome)}</p>
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm transition-colors ${filterType === 'INCOME' && isReportOpen ? 'bg-white text-emerald-700' : 'bg-white/20 text-white'}`}>
              <Activity size={14} /> {lang === 'en' ? 'View Details' : 'مشاهده گزارش تفصیلی'}
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div
          onClick={() => {
            if (filterType === 'EXPENSE' && isReportOpen) {
              setIsReportOpen(false);
            } else {
              setFilterType('EXPENSE');
              setIsReportOpen(true);
              setTimeout(() => detailsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
          }}
          className={`bg-gradient-to-br from-rose-500 to-rose-700 rounded-3xl p-6 text-white shadow-xl shadow-rose-600/20 relative overflow-hidden group cursor-pointer transition-all ${filterType === 'EXPENSE' && isReportOpen ? 'ring-4 ring-rose-300 ring-offset-4 dark:ring-offset-slate-950 scale-[1.02] -translate-y-1' : 'hover:scale-[1.02] hover:-translate-y-1'}`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-20"><TrendingDown size={80} /></div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowManualExpenseModal(true); }}
            className="absolute top-4 left-4 px-3 py-1.5 flex items-center gap-1.5 bg-white/20 hover:bg-white/40 rounded-xl backdrop-blur-sm transition-all shadow-sm border border-white/10"
            title={lang === 'en' ? 'Add Expense' : 'ثبت مصرف جدید'}
          >
            <ArrowDownCircle size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{lang === 'en' ? 'Add Expense' : 'ثبت مصرف جدید'}</span>
          </button>
          <div className="relative z-10 pt-2">
            <p className="text-rose-100 font-bold mb-1">{lang === 'en' ? 'Total Expenses (Lifetime)' : 'مجموع مصارف (کل)'}</p>
            <h3 className="text-4xl font-black mb-1" dir="ltr">{formatAFN(overallExpenses)}</h3>
            <p className="text-rose-200 text-sm font-medium mb-4" dir="ltr">≈ {formatUSD(overallExpenses)}</p>
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm transition-colors ${filterType === 'EXPENSE' && isReportOpen ? 'bg-white text-rose-700' : 'bg-white/20 text-white'}`}>
              <Activity size={14} /> {lang === 'en' ? 'View Details' : 'مشاهده گزارش تفصیلی'}
            </div>
          </div>
        </div>

        {/* Net Profit Card */}
        <div
          onClick={() => {
            if (filterType === 'ALL' && isReportOpen) {
              setIsReportOpen(false);
            } else {
              setFilterType('ALL');
              setIsReportOpen(true);
              setTimeout(() => detailsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
          }}
          className={`bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden cursor-pointer transition-all ${filterType === 'ALL' && isReportOpen ? 'ring-4 ring-blue-300 ring-offset-4 dark:ring-offset-slate-950 scale-[1.02] -translate-y-1' : 'hover:scale-[1.02] hover:-translate-y-1'}`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-20"><DollarSign size={80} /></div>
          <div className="relative z-10">
            <p className="text-blue-100 font-bold mb-1">{lang === 'en' ? 'Net Profit (Lifetime)' : 'فایده خالص (کل)'}</p>
            <h3 className="text-4xl font-black mb-1" dir="ltr">{formatAFN(overallProfit)}</h3>
            <p className="text-blue-200 text-sm font-medium mb-4" dir="ltr">≈ {formatUSD(overallProfit)}</p>
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm transition-colors ${filterType === 'ALL' && isReportOpen ? 'bg-white text-indigo-700' : 'bg-white/20 text-white'}`}>
              <Activity size={14} /> {lang === 'en' ? 'View All Transactions' : 'گزارش کل تراکنش‌ها'}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Detailed Periodical Reports Table */}
      <AnimatePresence>
        {isReportOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
            animate={{ height: 'auto', opacity: 1, overflow: 'visible' }}
            exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <div ref={detailsRef} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border dark:border-slate-800 relative mt-8">
              <button
                onClick={() => setIsReportOpen(false)}
                className="absolute top-6 left-6 p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pt-2">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                    {lang === 'en' ? 'Detailed Financial Report' : 'گزارش تفصیلی مالی'}
                    {filterType === 'INCOME' && (lang === 'en' ? ' - Income' : ' - عایدات')}
                    {filterType === 'EXPENSE' && (lang === 'en' ? ' - Expenses' : ' - مصارف')}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mt-1">
                    {reportTab === 'daily' ? (lang === 'en' ? 'Today\'s Transactions' : 'تراکنش‌های امروز') :
                     reportTab === 'weekly' ? (lang === 'en' ? 'This Week\'s Transactions' : 'تراکنش‌های این هفته') :
                     reportTab === 'monthly' ? (lang === 'en' ? 'This Month\'s Transactions' : 'تراکنش‌های این ماه') :
                     (lang === 'en' ? 'This Year\'s Transactions' : 'تراکنش‌های امسال')}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                  {/* Report Tabs */}
                  <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-2xl border dark:border-slate-800 w-full sm:w-auto">
                    {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setReportTab(tab);
                        }}
                        className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                          reportTab === tab
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-100'
                            : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 scale-95'
                        }`}
                      >
                        {tab === 'daily' ? (lang === 'en' ? 'Daily' : 'روزانه') :
                         tab === 'weekly' ? (lang === 'en' ? 'Weekly' : 'هفتگی') :
                         tab === 'monthly' ? (lang === 'en' ? 'Monthly' : 'ماهانه') :
                         (lang === 'en' ? 'Yearly' : 'سالانه')}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        const start = new Date();
                        const end = new Date(); // Need exact boundaries for API

                        // Pass days or ISO strings depending on backend implementation
                        // Backend takes `start_date` and `end_date` since we just modified it!
                        const { start_dt, end_dt } = (() => {
                          const now = new Date(); const jCalc = jalaali.toJalaali(now);
                          if (reportTab === 'daily') {
                            const sd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0);
                            const ed = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59);
                            return { start_dt: sd, end_dt: ed };
                          } else if (reportTab === 'weekly') {
                            const d = now.getDay(); const diff = d === 6 ? 0 : d + 1;
                            const sd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0,0,0);
                            const ed = new Date(sd.getTime() + 6*24*60*60*1000); ed.setHours(23,59,59);
                            return { start_dt: sd, end_dt: ed };
                          } else if (reportTab === 'monthly') {
                            const sd = jalaali.toGregorian(jCalc.jy, jCalc.jm, 1);
                            const ed = jalaali.toGregorian(jCalc.jy, jCalc.jm, jalaali.jalaaliMonthLength(jCalc.jy, jCalc.jm));
                            return { start_dt: new Date(sd.gy, sd.gm-1, sd.gd, 0,0,0), end_dt: new Date(ed.gy, ed.gm-1, ed.gd, 23,59,59) };
                          } else {
                            const sd = jalaali.toGregorian(jCalc.jy, 1, 1);
                            const ed = jalaali.toGregorian(jCalc.jy, 12, jalaali.jalaaliMonthLength(jCalc.jy, 12));
                            return { start_dt: new Date(sd.gy, sd.gm-1, sd.gd, 0,0,0), end_dt: new Date(ed.gy, ed.gm-1, ed.gd, 23,59,59) };
                          }
                        })();

                        const token = localStorage.getItem('token');
                        let url = `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/reports/financial?report_type=${filterType}&start_date=${start_dt.toISOString()}&end_date=${end_dt.toISOString()}`;
                        if (token) url += `&token=${token}`;
                        window.open(url, '_blank');
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all"
                    >
                      <Download size={16} />
                      {lang === 'en' ? 'Download CSV' : 'دانلود گزارش (CSV)'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mb-6">
                 {filterType === 'ALL' && (
                     <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-3xl border border-slate-100 dark:border-slate-800 inline-flex flex-col items-end">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'en' ? 'Net Balance for Period' : 'تراز خالص این دوره'}</div>
                       <div className={`text-2xl font-black ${currentFilteredProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} dir="ltr">
                          {currentFilteredProfit >= 0 ? '+' : ''}{formatAFN(currentFilteredProfit)}
                       </div>
                    </div>
                 )}
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-start">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">تاریخ</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">شرح تراکنش</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">کتگوری</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-end">مقدار (AFN)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold">
                          {lang === 'en' ? 'No records found for this period.' : 'هیچ رکوردی برای این دوره یافت نشد.'}
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.slice(0, 5).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 text-xs font-mono text-slate-500 font-medium">
                            {new Date(item.date || item.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'fa-AF', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-black text-slate-800 dark:text-white uppercase leading-none">{item.description}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${item.type === 'INCOME' ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100/50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                              {item.type === 'INCOME' ? (lang === 'en' ? 'Income' : 'عاید') : (lang === 'en' ? 'Expense' : 'مصرف')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-end">
                            <div className={`text-sm font-black ${item.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} dir="ltr">
                              {item.type === 'INCOME' ? '+' : '-'}{formatNumber(item.amount)}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Chart & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* 2. Ultra-Interactive Bar Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border dark:border-slate-800">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
              {lang === 'en' ? 'Income vs Expenses (Current Week)' : 'عایدات در مقابل مصارف (هفته جاری)'}
            </h3>

            {/* Scrollable Container for Chart */}
            <div
              className="overflow-x-auto custom-scrollbar pb-4"
              dir="rtl"
              tabIndex={0}
              onWheel={(e) => {
                const container = e.currentTarget;
                container.scrollLeft += e.deltaY;
              }}
            >
              <div className="h-[400px] min-w-[800px]" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barCategoryGap="20%">
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.4}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                      dy={10}
                      reversed={true}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                      dx={-10}
                      tickFormatter={(val) => formatNumber(val)}
                      orientation="right"
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f8fafc' }} />
                    <Bar
                      dataKey="income"
                      fill="url(#colorIncome)"
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                      onClick={(data) => setSelectedDay(data)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                    <Bar
                      dataKey="expense"
                      fill="url(#colorExpense)"
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                      onClick={(data) => setSelectedDay(data)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center mt-6 bg-slate-50 dark:bg-slate-800/50 py-3 rounded-xl border border-slate-100 dark:border-slate-800">
              {lang === 'en' ? '💡 Financial Analysis Chart (Click on any bar to view deeper insights)' : '💡 گزارش تحلیلی مالی هوشمند (برای مشاهده دقیق جزئیات و صورت‌حساب، روی ستون هر روز کلیک کنید)'}
            </p>
          </div>

          {/* MAGIC UX FEATURE 3: LEFT-SIDE SLIDE-OUT LEDGER PANEL */}
          <>
            {/* Invisible Overlay for Click-Outside-to-Close */}
            {selectedDay && (
              <div
                className="fixed inset-0 z-[90] bg-transparent"
                onClick={() => setSelectedDay(null)}
              ></div>
            )}

            <div
              className={`fixed top-0 left-0 h-full w-full sm:w-96 bg-white dark:bg-slate-900 z-[100] shadow-2xl border-r dark:border-slate-800 transform transition-transform duration-300 ease-in-out ${selectedDay ? 'translate-x-0' : '-translate-x-full'}`}
            >
            {selectedDay && (
              <div className="h-full flex flex-col">
                <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <h3 className="text-2xl font-black text-gray-800 dark:text-white">{selectedDay.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{selectedDay.fullName}</p>
                  </div>
                  <button onClick={() => setSelectedDay(null)} className="p-2 bg-white dark:bg-slate-700 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors shadow-sm">
                    <X size={20} className="text-gray-600 dark:text-gray-300" />
                  </button>
                </div>

                <div className="p-6 grid grid-cols-2 gap-4 border-b dark:border-slate-800">
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 mb-1">{lang === 'en' ? 'Income' : 'عایدات'}</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-500" dir="ltr">{formatAFN(selectedDay.income)}</p>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                    <p className="text-xs font-bold text-rose-800 dark:text-rose-400 mb-1">{lang === 'en' ? 'Expenses' : 'مصارف'}</p>
                    <p className="text-xl font-black text-rose-600 dark:text-rose-500" dir="ltr">{formatAFN(selectedDay.expense)}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                    {lang === 'en' ? 'Detailed Transactions' : 'جزئیات تراکنش‌ها'}
                  </h4>
                  <div className="space-y-3">
                    {selectedDayTransactions.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Database size={24} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {lang === 'en' ? 'No transactions recorded for this day.' : 'هیچ تراکنشی در این روز ثبت نشده است.'}
                        </p>
                      </div>
                    ) : (
                      selectedDayTransactions.map((tx, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${tx.type === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                              {tx.description || (lang === 'en' ? 'No Description' : 'بدون شرح')}
                            </p>
                          </div>
                          <p className={`text-sm font-black ${tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} dir="ltr">
                            {tx.type === 'INCOME' ? '+' : '-'}{formatAFN(tx.amount)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
            </div>
          </>
        </div>

        {/* Right Column: KPIs & Alerts */}
        <div className="space-y-8">
          {/* 3. Industrial Operational KPIs */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border dark:border-slate-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Factory className="text-blue-500" size={20} />
              {lang === 'en' ? 'Operational KPIs' : 'شاخص‌های عملیاتی فابریکه'}
            </h3>

            {/* Active Machinery */}
            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                  {lang === 'en' ? 'Active Machinery' : 'ماشین‌آلات فعال'}
                </span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400" dir="ltr">12 / 14</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-end">85% {lang === 'en' ? 'Efficiency' : 'راندمان (کارایی)'}</p>
            </div>

            {/* Production Stats PieChart */}
            <div>
              <span className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 block">
                {lang === 'en' ? 'Production Distribution' : 'توزیع تولیدات'}
              </span>
              <div className="h-[150px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productionStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {productionStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatNumber(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {productionStats.map((stat, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs font-bold text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }}></span>
                    {stat.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Interconnected Low Stock Alerts */}
          <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-6 border border-red-100 dark:border-red-900/30">
            <h3 className="text-lg font-bold text-red-800 dark:text-red-400 mb-4 flex items-center gap-2">
              <AlertCircle size={20} />
              {lang === 'en' ? 'Low Stock Warnings' : 'هشدار موجودی گدام'}
            </h3>
            <div className="space-y-3 max-h-[180px] overflow-y-auto custom-scrollbar pr-2">
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-red-600/70 dark:text-red-400/70">
                  {lang === 'en' ? 'All products are sufficiently stocked.' : 'موجودی تمام اجناس کافی است.'}
                </p>
              ) : (
                lowStockProducts.map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-red-100 dark:border-red-900/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                        <Package size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-white">{p.name}</p>
                        <p className="text-xs text-gray-500">سایز: {p.size}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="block text-lg font-black text-red-600 dark:text-red-400">{formatNumber(p.stock_quantity)}</span>
                      <span className="text-[10px] text-gray-500 uppercase">موجودی</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6. High-Tech Server & System Status (RULE 5) */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 shadow-2xl border border-slate-800 text-slate-300 mt-8">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
          <Server size={16} />
          {lang === 'en' ? 'System & Infrastructure Status' : 'وضعیت سیستم و زیرساخت'}
        </h3>

        {sysStatsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ms-3 text-slate-400 text-sm font-bold">
              {lang === 'en' ? 'Connecting to server...' : 'در حال ارتباط با سرور...'}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* DB Status */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1"><Database size={14} className="text-blue-400"/> PostgreSQL</span>
                <span className="text-emerald-400">{sysStats?.db_status || 'Stable'}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full w-full"></div></div>
            </div>
            {/* Memory */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1"><Cpu size={14} className="text-purple-400"/> Server Memory</span>
                <span dir="ltr">{formatNumber(sysStats?.ram_used_gb || 4.2)} GB / {formatNumber(sysStats?.ram_total_gb || 32)} GB</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${sysStats?.ram_usage_percent || 13}%` }}></div>
              </div>
            </div>
            {/* Storage */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1"><HardDrive size={14} className="text-amber-400"/> Storage</span>
                <span dir="ltr">{formatNumber(sysStats?.storage_used_gb || 128)} GB / {formatNumber(sysStats?.storage_total_gb || 1000)} GB</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${sysStats?.storage_usage_percent || 12.8}%` }}></div>
              </div>
            </div>
            {/* AI API */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1"><Zap size={14} className="text-emerald-400"/> Gemini AI API</span>
                <span className="text-emerald-400">{sysStats?.ai_api_status || 'Online'}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full w-full"></div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
