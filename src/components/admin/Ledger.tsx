import React, { useState } from 'react';
import { 
  Wallet, Plus, RefreshCw, Calendar, Filter, 
  ArrowUpCircle, ArrowDownCircle, Download, Search,
  BarChart as BarChartIcon, PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { exportToCSV, toEnglishDigits } from '../../lib/utils';

interface LedgerProps {
  ledger: any[];
  fetchData: () => Promise<void>;
  onAddExpense: (expense: any) => Promise<void>;
  isSaving: boolean;
  lang: 'dr' | 'ps' | 'en';
  t: any;
  theme: 'light' | 'dark';
  formatJalaliDateOnly: (date: string, lang: any, forceEnglish?: boolean) => string;
  chartData: any[];
  todayExpenses: number;
  todayStr: string;
  todayWeekday: string;
}

export default function Ledger({ 
  ledger, 
  fetchData, 
  onAddExpense, 
  isSaving, 
  lang, 
  t, 
  theme,
  formatJalaliDateOnly,
  chartData,
  todayExpenses,
  todayStr,
  todayWeekday
}: LedgerProps) {
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', department: 'GENERAL' });
  const [ledgerFilter, setLedgerFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAdd = async () => {
    await onAddExpense(newExpense);
    setNewExpense({ description: '', amount: '', department: 'GENERAL' });
  };

  const filteredLedger = ledger.filter(l => {
    const matchesDept = ledgerFilter === 'ALL' || l.department === ledgerFilter;
    const matchesSearch = l.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         l.amount.toString().includes(searchTerm);
    return matchesDept && matchesSearch;
  });

  const handleExport = () => {
    const data = filteredLedger.map(l => [
      l.type === 'INCOME' ? 'درآمد' : 'مصرف',
      l.department,
      l.amount,
      l.description,
      new Date(l.createdAt).toLocaleDateString('fa-IR')
    ]);
    const headers = ['نوع', 'بخش', 'مبلغ (AFN)', 'شرح', 'تاریخ'];
    exportToCSV('ledger_report', [headers, ...data]);
  };

  const chartColors = theme === 'dark' ? {
    text: '#94a3b8',
    grid: '#1e293b',
    tooltipBg: '#0f172a',
    tooltipText: '#f8fafc',
    border: 'border-slate-800',
    bg: 'bg-slate-900/80'
  } : {
    text: '#64748b',
    grid: '#f1f5f9',
    tooltipBg: '#ffffff',
    tooltipText: '#0f172a',
    border: 'border-gray-100',
    bg: 'bg-white'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Today's Summary & Industrial Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-950 dark:from-blue-900 dark:to-slate-950 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-0"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-start">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-3 opacity-80">
              <Calendar size={20} className="text-blue-400" />
              <span className="text-lg font-medium tracking-wide">{todayWeekday}، {todayStr}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter flex items-center justify-center md:justify-start gap-4">
              {lang === 'dr' ? 'ترازنامه مالی' : 'Financial Ledger'}
              <button 
                onClick={fetchData} 
                className="p-2.5 hover:bg-white/10 rounded-2xl transition-all active:scale-90"
                title={t.update}
              >
                <RefreshCw size={24} className={isSaving ? 'animate-spin' : ''} />
              </button>
            </h2>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              {lang === 'dr' ? 'مدیریت دقیق جریان نقدینگی و مصارف عملیاتی فابریکه شین غزی بابا.' : 'Precise management of cash flow and operational expenses for Sheen Ghazy Baba Factory.'}
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="bg-white/5 backdrop-blur-xl rounded-[24px] p-6 border border-white/10 text-center min-w-[240px] shadow-inner">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{lang === 'dr' ? 'مجموع مصارف امروز' : 'Today\'s Total Expenses'}</p>
              <p className="text-4xl font-black text-red-400">{todayExpenses.toLocaleString()} <span className="text-sm font-normal text-slate-500">AFN</span></p>
            </div>
            <div className="flex gap-4">
               <button 
                 onClick={handleExport}
                 className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
               >
                 <Download size={18} />
                 {lang === 'dr' ? 'خروجی اکسل' : 'Export Excel'}
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Form - Industrial Card */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
            <Plus size={24} />
          </div>
          <h3 className="font-black text-xl text-gray-800 dark:text-white">{t.addExpense}</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">بخش مربوطه</label>
            <select 
              value={newExpense.department}
              onChange={e => setNewExpense({...newExpense, department: e.target.value})}
              className="w-full border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm"
            >
              <option value="GENERAL">{t.deptGeneral}</option>
              <option value="PIPE">{t.deptPipe}</option>
              <option value="LATHE">{t.deptLathe}</option>
              <option value="THREADING">{t.deptThreading}</option>
            </select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">{t.description}</label>
            <input 
              type="text" 
              placeholder="مثلاً: خرید روغن برای ماشین شماره ۲" 
              value={newExpense.description}
              onChange={e => setNewExpense({...newExpense, description: e.target.value})}
              className="w-full border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">{t.amount}</label>
            <div className="relative">
              <input 
                type="text" 
                inputMode="decimal"
                placeholder="0.00" 
                value={newExpense.amount}
                onChange={e => setNewExpense({...newExpense, amount: toEnglishDigits(e.target.value)})}
                className="w-full border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono font-bold text-lg" 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">AFN</span>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleAdd}
            disabled={isSaving || !newExpense.amount || !newExpense.description}
            className={`bg-slate-900 dark:bg-blue-600 text-white font-black rounded-2xl px-12 py-4 transition-all flex items-center justify-center gap-3 shadow-xl ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
          >
            {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Plus size={20} />}
            {t.save}
          </button>
        </div>
      </div>

      {/* Ledger Table & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b dark:border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-6 bg-gray-50/30 dark:bg-slate-800/20">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto">
            {['ALL', 'PIPE', 'LATHE', 'THREADING', 'GENERAL'].map(dept => (
              <button 
                key={dept}
                onClick={() => setLedgerFilter(dept)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${ledgerFilter === dept ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border dark:border-slate-700 hover:bg-gray-50'}`}
              >
                {dept === 'ALL' ? t.total : t[`dept${dept.charAt(0) + dept.slice(1).toLowerCase()}` as keyof typeof t] || dept}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="جستجو در لیست..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
              <tr>
                <th className="px-8 py-5 text-start font-black text-xs text-gray-400 uppercase tracking-widest">{t.date}</th>
                <th className="px-8 py-5 text-start font-black text-xs text-gray-400 uppercase tracking-widest">{t.department}</th>
                <th className="px-8 py-5 text-start font-black text-xs text-gray-400 uppercase tracking-widest">{t.description}</th>
                <th className="px-8 py-5 text-end font-black text-xs text-gray-400 uppercase tracking-widest">{t.amount}</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-gray-400 italic">هیچ موردی یافت نشد.</td>
                </tr>
              ) : (
                filteredLedger.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-bold text-gray-700 dark:text-slate-300" dir="ltr">{formatJalaliDateOnly(l.date, lang, true)}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{new Intl.DateTimeFormat(lang === 'dr' ? 'fa-AF' : 'en-US', { weekday: 'long' }).format(new Date(l.date))}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 rounded-lg text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border dark:border-slate-700 uppercase tracking-tighter">
                        {t[`dept${l.department?.charAt(0) + l.department?.slice(1).toLowerCase()}` as keyof typeof t] || l.department || t.deptGeneral}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-bold text-gray-800 dark:text-white text-sm">{l.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${l.type === 'INCOME' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{l.type === 'INCOME' ? t.income : t.expenses}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-end">
                      <p className={`text-xl font-black ${l.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} dir="ltr">
                        {l.type === 'INCOME' ? '+' : '-'} {l.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold">AFN</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Chart Section */}
      <div className={`${chartColors.bg} p-8 rounded-[32px] border ${chartColors.border} shadow-xl`}>
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center">
              <BarChartIcon size={24} />
            </div>
            <div>
              <h3 className="font-black text-xl text-gray-800 dark:text-white">{lang === 'dr' ? 'تحلیل مصارف هفتگی' : 'Weekly Expense Analysis'}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">نمودار مقایسه‌ای مصارف در ۷ روز گذشته</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">مصارف عملیاتی</span>
            </div>
          </div>
        </div>
        
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
              <XAxis 
                dataKey="name" 
                stroke={chartColors.text} 
                fontSize={11} 
                tick={{fill: chartColors.text, fontWeight: 'bold'}} 
                axisLine={false} 
                tickLine={false}
                dy={15}
              />
              <YAxis 
                stroke={chartColors.text} 
                fontSize={11} 
                tick={{fill: chartColors.text, fontWeight: 'bold'}} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip 
                cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f8fafc', radius: 12 }}
                contentStyle={{ 
                  backgroundColor: chartColors.tooltipBg, 
                  border: `1px solid ${chartColors.border}`, 
                  borderRadius: '20px', 
                  color: chartColors.tooltipText,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  padding: '16px'
                }}
                formatter={(value: number) => [value.toLocaleString() + ' AFN', lang === 'dr' ? 'مبلغ مصرف' : 'Amount']}
              />
              <Bar 
                dataKey="expense" 
                fill="#ef4444" 
                radius={[10, 10, 0, 0]} 
                barSize={45}
                animationDuration={2000}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name.includes(todayWeekday) ? '#dc2626' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
