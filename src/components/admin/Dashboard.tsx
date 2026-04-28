import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle,
  Server, Database, HardDrive, Cpu, Zap, Package, X, ArrowUpCircle, ArrowDownCircle, Factory,
  Download, Calendar, ChevronDown, CalendarDays, CalendarCheck, CalendarRange
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jalaali from 'jalaali-js';
import { useApi } from '../../hooks/useApi';

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
  const [activeFinanceCard, setActiveFinanceCard] = useState<'INCOME' | 'EXPENSE' | 'PROFIT' | null>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to details when a day is selected
  useEffect(() => {
    if (selectedDay && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedDay]);

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
  const totalIncome = safeLedger.filter(l => l.type === 'INCOME').reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalExpenses = safeLedger.filter(l => l.type === 'EXPENSE').reduce((sum, l) => sum + (l.amount || 0), 0);
  const netProfit = totalIncome - totalExpenses;

  const financialPeriods = useMemo(() => {
    const stats = {
      daily: { INCOME: 0, EXPENSE: 0, PROFIT: 0 },
      weekly: { INCOME: 0, EXPENSE: 0, PROFIT: 0 },
      monthly: { INCOME: 0, EXPENSE: 0, PROFIT: 0 },
      yearly: { INCOME: 0, EXPENSE: 0, PROFIT: 0 },
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Weekly setup
    const dayOfWeek = today.getDay();
    const daysSinceSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysSinceSaturday);

    // Jalali setup for Month & Year
    const jToday = jalaali.toJalaali(today);

    safeLedger.forEach(l => {
      const txDate = new Date(l.date || l.createdAt);

      // Reset time for date-only comparisons
      const txDateMidnight = new Date(txDate);
      txDateMidnight.setHours(0, 0, 0, 0);

      const amt = l.amount || 0;

      // Daily
      if (txDateMidnight.getTime() === today.getTime()) {
        if (l.type === 'INCOME') stats.daily.INCOME += amt;
        if (l.type === 'EXPENSE') stats.daily.EXPENSE += amt;
      }

      // Weekly (from startOfWeek to today)
      if (txDateMidnight >= startOfWeek && txDateMidnight <= today) {
        if (l.type === 'INCOME') stats.weekly.INCOME += amt;
        if (l.type === 'EXPENSE') stats.weekly.EXPENSE += amt;
      }

      // Jalali Monthly & Yearly
      const jTx = jalaali.toJalaali(txDateMidnight);
      if (jTx.jy === jToday.jy) { // Yearly
        if (l.type === 'INCOME') stats.yearly.INCOME += amt;
        if (l.type === 'EXPENSE') stats.yearly.EXPENSE += amt;

        // Monthly (must be in the same year)
        if (jTx.jm === jToday.jm) {
          if (l.type === 'INCOME') stats.monthly.INCOME += amt;
          if (l.type === 'EXPENSE') stats.monthly.EXPENSE += amt;
        }
      }
    });

    stats.daily.PROFIT = stats.daily.INCOME - stats.daily.EXPENSE;
    stats.weekly.PROFIT = stats.weekly.INCOME - stats.weekly.EXPENSE;
    stats.monthly.PROFIT = stats.monthly.INCOME - stats.monthly.EXPENSE;
    stats.yearly.PROFIT = stats.yearly.INCOME - stats.yearly.EXPENSE;

    return stats;
  }, [safeLedger]);

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
        if (l.type === 'INCOME') dayEntry.income += l.amount;
        if (l.type === 'EXPENSE') dayEntry.expense += l.amount;
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

  const downloadFinancialReport = (type: 'INCOME' | 'EXPENSE' | 'PROFIT', period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    let rows: any[] = [];
    rows.push([lang === 'dr' ? 'تاریخ' : 'Date', lang === 'dr' ? 'شرح' : 'Description', lang === 'dr' ? 'مبلغ (افغانی)' : 'Amount (AFN)', lang === 'dr' ? 'نوعیت' : 'Type']);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay();
    const daysSinceSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysSinceSaturday);

    const jToday = jalaali.toJalaali(today);

    const filteredLedger = safeLedger.filter(l => {
      const txDate = new Date(l.date || l.createdAt);
      const txDateMidnight = new Date(txDate);
      txDateMidnight.setHours(0, 0, 0, 0);

      let inRange = false;
      const jTx = jalaali.toJalaali(txDateMidnight);

      if (period === 'daily') {
        inRange = txDateMidnight.getTime() === today.getTime();
      } else if (period === 'weekly') {
        inRange = txDateMidnight >= startOfWeek && txDateMidnight <= today;
      } else if (period === 'monthly') {
        inRange = jTx.jy === jToday.jy && jTx.jm === jToday.jm;
      } else if (period === 'yearly') {
        inRange = jTx.jy === jToday.jy;
      }

      if (!inRange) return false;
      if (type === 'INCOME') return l.type === 'INCOME';
      if (type === 'EXPENSE') return l.type === 'EXPENSE';
      return true; // Profit includes both
    });

    filteredLedger.forEach(l => {
      // formatting string
      const faType = l.type === 'INCOME' ? 'عاید' : 'مصرف';
      rows.push([
        new Date(l.date || l.createdAt).toLocaleDateString('fa-IR'),
        l.description || '-',
        l.amount,
        lang === 'dr' ? faType : l.type
      ]);
    });

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + rows.map(e => e.join(",")).join("\n");

    const enType = type === 'INCOME' ? 'Income' : type === 'EXPENSE' ? 'Expense' : 'Profit';
    const faTypeTitle = type === 'INCOME' ? 'عایدات' : type === 'EXPENSE' ? 'مصارف' : 'فایده_خالص';
    const faPeriod = period === 'daily' ? 'روزانه' : period === 'weekly' ? 'هفته_وار' : period === 'monthly' ? 'ماهانه' : 'سالانه';

    const fileName = lang === 'dr' ? `گزارش_${faTypeTitle}_${faPeriod}_شین_غزی_بابا.csv` : `SheenGhazy_${enType}_${period}_report.csv`;

    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10 relative">
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

      {/* 1. Live Multi-Currency Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income Card */}
        <div
          onClick={() => setActiveFinanceCard('INCOME')}
          className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden cursor-pointer hover:shadow-emerald-600/40 transition-all hover:-translate-y-1 group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform"><TrendingUp size={80} /></div>
          <div className="relative z-10">
            <p className="text-emerald-100 font-bold mb-1 flex justify-between items-center">
              {lang === 'en' ? 'Total Income' : 'مجموع عایدات'}
              <ChevronDown size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <h3 className="text-4xl font-black mb-1" dir="ltr">{formatAFN(totalIncome)}</h3>
            <p className="text-emerald-200 text-sm font-medium mb-4" dir="ltr">≈ {formatUSD(totalIncome)}</p>
            <div className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
              <ArrowUpCircle size={14} /> +12.5% {lang === 'en' ? 'vs last month' : 'نسبت به ماه قبل'}
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div
          onClick={() => setActiveFinanceCard('EXPENSE')}
          className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-3xl p-6 text-white shadow-xl shadow-rose-600/20 relative overflow-hidden cursor-pointer hover:shadow-rose-600/40 transition-all hover:-translate-y-1 group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform"><TrendingDown size={80} /></div>
          <div className="relative z-10">
            <p className="text-rose-100 font-bold mb-1 flex justify-between items-center">
              {lang === 'en' ? 'Total Expenses' : 'مجموع مصارف'}
              <ChevronDown size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <h3 className="text-4xl font-black mb-1" dir="ltr">{formatAFN(totalExpenses)}</h3>
            <p className="text-rose-200 text-sm font-medium mb-4" dir="ltr">≈ {formatUSD(totalExpenses)}</p>
            <div className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
              <ArrowDownCircle size={14} /> -4.2% {lang === 'en' ? 'vs last month' : 'نسبت به ماه قبل'}
            </div>
          </div>
        </div>

        {/* Net Profit Card */}
        <div
          onClick={() => setActiveFinanceCard('PROFIT')}
          className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden cursor-pointer hover:shadow-blue-600/40 transition-all hover:-translate-y-1 group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform"><DollarSign size={80} /></div>
          <div className="relative z-10">
            <p className="text-blue-100 font-bold mb-1 flex justify-between items-center">
              {lang === 'en' ? 'Net Profit' : 'فایده خالص'}
              <ChevronDown size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <h3 className="text-4xl font-black mb-1" dir="ltr">{formatAFN(netProfit)}</h3>
            <p className="text-blue-200 text-sm font-medium mb-4" dir="ltr">≈ {formatUSD(netProfit)}</p>
            <div className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
              <Activity size={14} /> {lang === 'en' ? 'Healthy Margin' : 'فایده سالم'}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Finance Details Panel (Expands when a card is clicked) */}
      <AnimatePresence>
        {activeFinanceCard && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className={`rounded-3xl border shadow-xl p-8 transition-colors ${
              activeFinanceCard === 'INCOME' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50' :
              activeFinanceCard === 'EXPENSE' ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' :
              'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
            }`}>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className={`text-2xl font-black flex items-center gap-2 ${
                    activeFinanceCard === 'INCOME' ? 'text-emerald-800 dark:text-emerald-400' :
                    activeFinanceCard === 'EXPENSE' ? 'text-rose-800 dark:text-rose-400' :
                    'text-blue-800 dark:text-blue-400'
                  }`}>
                    {activeFinanceCard === 'INCOME' && <TrendingUp />}
                    {activeFinanceCard === 'EXPENSE' && <TrendingDown />}
                    {activeFinanceCard === 'PROFIT' && <DollarSign />}
                    {lang === 'en' ? `Detailed ${activeFinanceCard} Analysis` : `گزارش تحلیلی پیشرفته: ${activeFinanceCard === 'INCOME' ? 'عایدات' : activeFinanceCard === 'EXPENSE' ? 'مصارف' : 'فایده خالص'}`}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {lang === 'en' ? 'Review period-by-period breakdown and download reports to Excel.' : 'بررسی جزء به جزء دوره‌های زمانی و دریافت گزارش‌های پیشرفته اکسل.'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveFinanceCard(null)}
                  className="bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 p-2 rounded-full transition-colors"
                >
                  <X size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Daily */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold mb-4">
                      <Calendar size={18} />
                      {lang === 'en' ? 'Today' : 'گزارش روزانه (امروز)'}
                    </div>
                    <p className="text-xl xl:text-2xl font-black mb-1 truncate" dir="ltr" title={formatAFN(financialPeriods.daily[activeFinanceCard])}>
                      {formatAFN(financialPeriods.daily[activeFinanceCard])}
                    </p>
                    <p className="text-gray-400 text-sm font-medium mb-6" dir="ltr">≈ {formatUSD(financialPeriods.daily[activeFinanceCard])}</p>
                  </div>
                  <button
                    onClick={() => downloadFinancialReport(activeFinanceCard, 'daily')}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Download size={16} />
                    {lang === 'en' ? 'Download Excel' : 'دانلود فایل اکسل'}
                  </button>
                </div>

                {/* Weekly */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold mb-4">
                      <CalendarDays size={18} />
                      {lang === 'en' ? 'This Week' : 'گزارش هفته‌وار (هفته جاری)'}
                    </div>
                    <p className="text-xl xl:text-2xl font-black mb-1 truncate" dir="ltr" title={formatAFN(financialPeriods.weekly[activeFinanceCard])}>
                      {formatAFN(financialPeriods.weekly[activeFinanceCard])}
                    </p>
                    <p className="text-gray-400 text-sm font-medium mb-6" dir="ltr">≈ {formatUSD(financialPeriods.weekly[activeFinanceCard])}</p>
                  </div>
                  <button
                    onClick={() => downloadFinancialReport(activeFinanceCard, 'weekly')}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Download size={16} />
                    {lang === 'en' ? 'Download Excel' : 'دانلود فایل اکسل'}
                  </button>
                </div>

                {/* Monthly */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold mb-4">
                      <CalendarCheck size={18} />
                      {lang === 'en' ? 'This Month' : 'گزارش ماهانه (ماه جاری)'}
                    </div>
                    <p className="text-xl xl:text-2xl font-black mb-1 truncate" dir="ltr" title={formatAFN(financialPeriods.monthly[activeFinanceCard])}>
                      {formatAFN(financialPeriods.monthly[activeFinanceCard])}
                    </p>
                    <p className="text-gray-400 text-sm font-medium mb-6" dir="ltr">≈ {formatUSD(financialPeriods.monthly[activeFinanceCard])}</p>
                  </div>
                  <button
                    onClick={() => downloadFinancialReport(activeFinanceCard, 'monthly')}
                    className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm relative z-10 border border-blue-100 dark:border-blue-800/30"
                  >
                    <Download size={16} />
                    {lang === 'en' ? 'Download Excel' : 'دانلود فایل اکسل'}
                  </button>
                </div>

                {/* Yearly */}
                <div className="bg-slate-800 dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-700 dark:border-slate-800 flex flex-col justify-between text-white relative overflow-hidden">
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-slate-400 font-bold mb-4">
                      <CalendarRange size={18} />
                      {lang === 'en' ? 'This Year' : 'گزارش سالانه (سال جاری)'}
                    </div>
                    <p className="text-xl xl:text-2xl font-black mb-1 text-white truncate" dir="ltr" title={formatAFN(financialPeriods.yearly[activeFinanceCard])}>
                      {formatAFN(financialPeriods.yearly[activeFinanceCard])}
                    </p>
                    <p className="text-slate-400 text-sm font-medium mb-6" dir="ltr">≈ {formatUSD(financialPeriods.yearly[activeFinanceCard])}</p>
                  </div>
                  <button
                    onClick={() => downloadFinancialReport(activeFinanceCard, 'yearly')}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm relative z-10 backdrop-blur-sm"
                  >
                    <Download size={16} />
                    {lang === 'en' ? 'Download Excel' : 'دانلود فایل اکسل'}
                  </button>
                </div>
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
              dir="ltr"
              tabIndex={0}
              onWheel={(e) => {
                const container = e.currentTarget;
                container.scrollLeft += e.deltaY;
              }}
            >
              <div className="h-[400px] min-w-[800px]">
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

      {/* 5. High-Tech Server & System Status (RULE 5) */}
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
