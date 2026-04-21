import React, { useState } from 'react';
import { 
  Users, Search, Filter, Download, 
  MessageCircle, MapPin, TrendingUp, MoreVertical,
  Phone, Mail, Calendar
} from 'lucide-react';
import { exportToCSV } from '../../lib/utils';

interface CustomersProps {
  customers: any[];
  lang: 'dr' | 'ps' | 'en';
  t: any;
  theme: 'light' | 'dark';
}

export default function Customers({ customers, lang, t, theme }: CustomersProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.whatsapp_number.includes(searchTerm)
  );

  const handleExport = () => {
    const data = filteredCustomers.map(c => [
      c.full_name,
      c.whatsapp_number,
      c.address || '',
      c.total_spent
    ]);
    const headers = ['نام مشتری', 'شماره تماس', 'آدرس', 'مجموع خرید (AFN)'];
    exportToCSV('customers_report', [headers, ...data]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-3">
            <Users className="text-indigo-600" size={28} />
            {lang === 'dr' ? 'مدیریت مشتریان' : 'Customer Management'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === 'dr' ? 'بانک اطلاعاتی مشتریان و تاریخچه خرید آن‌ها.' : 'Customer database and their purchase history.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="bg-white dark:bg-slate-800 border dark:border-slate-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all"
          >
            <Download size={18} />
            {lang === 'dr' ? 'خروجی اکسل' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={lang === 'dr' ? 'جستجوی نام یا شماره تماس...' : 'Search name or phone...'} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
            />
          </div>
        </div>
        <div className="bg-indigo-600 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg shadow-indigo-600/20">
          <div>
            <p className="text-[10px] font-black uppercase opacity-80 tracking-widest">مجموع مشتریان</p>
            <p className="text-2xl font-black">{customers.length}</p>
          </div>
          <TrendingUp size={32} className="opacity-20" />
        </div>
      </div>

      {/* Customers Grid/Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-start font-black text-xs text-gray-400 uppercase tracking-widest">{t.colName}</th>
                <th className="px-6 py-4 text-start font-black text-xs text-gray-400 uppercase tracking-widest">{t.colWhatsApp}</th>
                <th className="px-6 py-4 text-start font-black text-xs text-gray-400 uppercase tracking-widest">{t.colAddress}</th>
                <th className="px-6 py-4 text-end font-black text-xs text-gray-400 uppercase tracking-widest">{t.colTotalSpent}</th>
                <th className="px-6 py-4 text-end font-black text-xs text-gray-400 uppercase tracking-widest">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">هیچ مشتری یافت نشد.</td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                          {c.full_name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 dark:text-white text-sm">{c.full_name}</span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Calendar size={10} />
                            عضویت از ۲۰۲۴
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 font-medium">
                        <MessageCircle size={14} className="text-emerald-500" />
                        {c.whatsapp_number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                        <MapPin size={14} />
                        {c.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">{(c.total_spent || 0).toLocaleString()} AFN</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">مجموع خرید</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all">
                          <Phone size={16} />
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
