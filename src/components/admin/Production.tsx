import React, { useState } from 'react';
import { 
  Factory, Search, Filter, Download, 
  TrendingUp, Package, Layers, Calendar,
  MoreVertical, Eye, ArrowUpCircle
} from 'lucide-react';
import { exportToCSV } from '../../lib/utils';

interface ProductionProps {
  production: any[];
  onAddProduction: () => void;
  lang: 'dr' | 'ps' | 'en';
  t: any;
  theme: 'light' | 'dark';
  formatJalali: (date: string, lang: any) => string;
}

export default function Production({ 
  production, 
  onAddProduction,
  lang, 
  t, 
  theme,
  formatJalali
}: ProductionProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProduction = production.filter(p => 
    p.Product?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.raw_material_used.toString().includes(searchTerm)
  );

  const totalProduced = production.reduce((acc, curr) => acc + curr.quantity_produced, 0);

  const handleExport = () => {
    const data = filteredProduction.map(p => [
      p.Product?.name || 'نامشخص',
      p.department,
      p.quantity_produced,
      p.raw_material_used,
      new Date(p.createdAt).toLocaleDateString('fa-IR')
    ]);
    const headers = ['نام محصول', 'بخش', 'تعداد تولید شده', 'مواد خام مصرفی (KG)', 'تاریخ'];
    exportToCSV('production_report', [headers, ...data]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-3">
            <Factory className="text-amber-600" size={28} />
            {lang === 'dr' ? 'مدیریت خط تولید' : 'Production Management'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === 'dr' ? 'نظارت بر خروجی فابریکه و مصرف مواد خام.' : 'Monitoring factory output and raw material consumption.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="bg-white dark:bg-slate-800 border dark:border-slate-700 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all"
          >
            <Download size={18} />
          </button>
          <button onClick={onAddProduction} className="bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl px-6 py-3 transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20 active:scale-95">
            <ArrowUpCircle size={20} />
            {lang === 'dr' ? 'ثبت تولید جدید' : 'Record Production'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">مجموع تولیدات</p>
            <p className="text-2xl font-black text-gray-800 dark:text-white">{totalProduced.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">مواد خام مصرفی</p>
            <p className="text-2xl font-black text-gray-800 dark:text-white">
              {production.reduce((acc, curr) => acc + curr.raw_material_used, 0).toLocaleString()} <span className="text-xs font-normal">KG</span>
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">بهره‌وری خط تولید</p>
            <p className="text-2xl font-black text-emerald-600">۹۴٪</p>
          </div>
        </div>
      </div>

      {/* Production List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/30 dark:bg-slate-800/20">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={lang === 'dr' ? 'جستجوی محصول یا مواد خام...' : 'Search product or raw material...'} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm dark:text-white"
            />
          </div>
          <button className="bg-white dark:bg-slate-800 border dark:border-slate-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all">
            <Download size={18} />
            {lang === 'dr' ? 'گزارش تولید' : 'Export Report'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-start font-black text-xs text-gray-400 uppercase tracking-widest">{t.colDate}</th>
                <th className="px-6 py-4 text-start font-black text-xs text-gray-400 uppercase tracking-widest">{t.colName}</th>
                <th className="px-6 py-4 text-start font-black text-xs text-gray-400 uppercase tracking-widest">{t.colQtyProduced}</th>
                <th className="px-6 py-4 text-start font-black text-xs text-gray-400 uppercase tracking-widest">{t.colRawMaterial}</th>
                <th className="px-6 py-4 text-end font-black text-xs text-gray-400 uppercase tracking-widest">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {filteredProduction.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">هیچ سابقه تولیدی یافت نشد.</td>
                </tr>
              ) : (
                filteredProduction.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-bold text-gray-700 dark:text-slate-300" dir="ltr">{formatJalali(p.date, lang)}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                          <Calendar size={10} />
                          ثبت شده
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Package size={16} />
                        </div>
                        <span className="font-bold text-gray-800 dark:text-white text-sm">{p.Product?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-blue-600 dark:text-blue-400 text-sm">+{p.quantity_produced.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">واحد تولیدی</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-sm font-bold text-gray-700 dark:text-slate-300">{p.raw_material_used.toLocaleString()} KG</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg transition-all">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
