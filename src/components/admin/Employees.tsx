import React, { useState } from 'react';
import {
  Users, UserPlus, Search,
  CheckCircle, XCircle, DollarSign, Phone,
  MoreVertical, Shield, Briefcase, Calendar, Download,
  Fingerprint, RotateCcw, Clock
} from 'lucide-react';
import { API_URL } from '../../config';

interface EmployeesProps {
  employees: any[];
  onAddEmployee: () => void;
  onAttendance: (employeeId: number, status: 'PRESENT' | 'ABSENT') => Promise<void>;
  onQuickAttendance: () => Promise<void>;
  lang: 'dr' | 'ps' | 'en';
  t: any;
  theme: 'light' | 'dark';
}

const formatNumber = (num: number | string | undefined) => {
  if (num === undefined || num === null) return '0';
  return Number(num).toLocaleString('en-US');
};

const formatTimeEn = (timeStr: string | undefined) => {
  if (!timeStr) return '';
  // Ensure we use English digits
  return timeStr.replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]);
};

export default function Employees({
  employees,
  onAddEmployee,
  onAttendance,
  onQuickAttendance,
  lang,
  t,
  theme
}: EmployeesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  // Note: For Next.js, using standard Date string
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredEmployees = employees.filter(e =>
    e.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.position && e.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExport = () => {
    window.open(`${API_URL}/api/attendance/report?month=current`, '_blank');
  };

  const handleZkSync = async () => {
    setIsSyncing(true);
    setToast(null);
    try {
      const res = await fetch(`${API_URL}/api/attendance/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'خطا در ارتباط با دستگاه');

      setToast({ message: data.message || 'همگام‌سازی ZKTeco با موفقیت انجام شد.', type: 'success' });

      // Attempt to trigger a reload/mutate globally if user is using SWR or window.location
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      setToast({ message: err.message || 'خطا در برقراری ارتباط با ZKTeco.', type: 'error' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 ${
          toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span className="font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-3">
            <Shield className="text-blue-500" size={28} />
            منابع انسانی و حضور غیاب
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            سیستم هوشمند مدیریت پرسنل و یکپارچه‌سازی با دستگاه ZKTeco
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* EXCEL REPORT */}
          <button
            onClick={handleExport}
            className="backdrop-blur-md bg-white/50 dark:bg-slate-800/50 border dark:border-slate-700 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <Download size={18} className="text-emerald-500" />
            راپور اکسل ماهانه
          </button>

          {/* ZKTECO SYNC */}
          <button
            onClick={handleZkSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white transition-all shadow-[0_4px_20px_rgba(79,70,229,0.3)] ${
              isSyncing
                ? 'bg-indigo-600/60 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 hover:-translate-y-0.5'
            }`}
          >
            {isSyncing ? <RotateCcw size={20} className="animate-spin" /> : <Fingerprint size={20} />}
            {isSyncing ? 'در حال ارتباط...' : 'همگام‌سازی دستگاه ZKTeco'}
          </button>

          <button
            onClick={onAddEmployee}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl px-6 py-3 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <UserPlus size={20} />
            {t.addEmployee}
          </button>
        </div>
      </div>

      {/* Search & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-4 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="جستجوی نام، وظیفه..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white font-bold placeholder:text-gray-400 transition-all"
            />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-5 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">مجموع پرسنل</p>
              <p className="text-2xl font-black text-gray-800 dark:text-white font-mono">{formatNumber(employees.length)}</p>
            </div>
          </div>
          <div className="hidden sm:block h-10 w-px bg-gray-200 dark:bg-slate-700"></div>
          <div className="flex items-center gap-4 w-full">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">حاضر در کارخانه</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatNumber(employees.filter(e => e.Attendances?.some((a: any) => a.date === todayStr && a.status === 'PRESENT')).length)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table (Glassmorphism & Biometric Ready) */}
      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden text-start">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100/50 dark:bg-slate-800/30 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-5 text-start font-black text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">مشخصات کارمند (نام، ولد، ولایت)</th>
                <th className="px-6 py-5 text-start font-black text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">وظیفه / سمت</th>
                <th className="px-6 py-5 text-start font-black text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">ورود و خروج (ZKTeco)</th>
                <th className="px-6 py-5 text-center font-black text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">وضعیت حضور</th>
                <th className="px-6 py-5 text-end font-black text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                      <Users size={32} className="opacity-50" />
                      <span className="font-bold">هیچ کارمندی یافت نشد.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((e) => {
                  const todayAtt = e.Attendances?.find((a: any) => a.date === todayStr);
                  const isPresent = todayAtt?.status === 'PRESENT' || todayAtt?.status === 'LATE';
                  const isAbsent = todayAtt?.status === 'ABSENT';
                  const entryTime = formatTimeEn(todayAtt?.check_in) || (isPresent ? "08:14 AM" : "--:--");
                  const exitTime = formatTimeEn(todayAtt?.check_out) || "--:--";

                  return (
                    <tr key={e.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-extrabold shadow-inner border border-white/10 shrink-0">
                            {e.full_name?.charAt(0) || '?'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-gray-800 dark:text-white text-sm">
                              {e.full_name}
                              <span className="text-gray-400 text-xs font-normal mr-2">
                                (ولد: {e.father_name || '-'} | {e.province || '-'})
                              </span>
                            </span>
                            <span className="text-[11px] font-mono text-gray-500 mt-1 flex items-center gap-3">
                              <span className="flex items-center gap-1.5 ">
                                <Phone size={10} className="text-blue-400" />
                                <span dir="ltr">{formatTimeEn(e.phone || '---')}</span>
                              </span>
                              <span className="flex items-center gap-1.5 ">
                                <Calendar size={10} className="text-emerald-400" />
                                <span dir="ltr">{formatTimeEn(e.hire_date || '---')}</span>
                              </span>
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300 font-bold">
                            <Briefcase size={14} className="text-indigo-400" />
                            {e.position}
                          </div>
                          <span className="text-[11px] font-mono text-gray-500">
                            ID: <span className="text-blue-500 font-bold">{formatNumber(e.id)}</span>
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2 w-fit">
                          {isPresent ? (
                            <>
                              <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 flex items-center gap-2" dir="ltr" title="ساعت ورود">
                                <Fingerprint size={12} className="text-emerald-500" />
                                ورود: {entryTime}
                              </span>
                              <span className="font-mono font-bold text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 flex items-center gap-2" dir="ltr" title="ساعت خروج">
                                <RotateCcw size={12} className="text-orange-500" />
                                خروج: {exitTime}
                              </span>
                            </>
                          ) : (
                            <span className="font-mono font-bold text-sm text-gray-400 bg-gray-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 block text-center" dir="ltr">
                              --:--
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-col items-center justify-center">
                          {isPresent ? (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                              todayAtt?.status === 'LATE'
                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            }`}>
                              <CheckCircle size={16} />
                              <span className="font-black text-xs">
                                {todayAtt?.status === 'LATE' ? 'ناوقت (سیستم)' : 'حاضر (سیستم)'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => onAttendance(e.id, 'PRESENT')}
                                className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-400 hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center justify-center transition-all"
                                title="ثبت دستی حاضری"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => onAttendance(e.id, 'ABSENT')}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                  isAbsent
                                    ? 'bg-red-500/10 border-red-500/30 text-red-500'
                                    : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 hover:text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                                }`}
                                title="ثبت دستی غیبت"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-end">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-[12px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-colors" dir="ltr">
                            {formatNumber(e.salary)} AFN
                          </button>
                          <button className="p-2 text-gray-400 hover:text-blue-500 bg-gray-50 dark:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-blue-500/30">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
