import React, { useState, useEffect } from 'react';
import { RefreshCw, Users, Clock, AlertCircle, CheckCircle2, TrendingDown, XCircle, LogOut, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API_URL } from '../../config';
import { toEnglishDigits } from '../../utils/magicUx';
import { toast } from 'react-hot-toast';
import jalaali from 'jalaali-js';

interface AttendanceRecord {
  id: number;
  EmployeeId: number;
  status: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  delay_minutes: number;
  penalty_amount: number;
  Employee: {
    full_name: string;
    zkteco_id?: number | null;
  };
}

interface AttendanceProps {
  theme: 'light' | 'dark';
  lang: 'dr' | 'ps' | 'en';
}

const Attendance: React.FC<AttendanceProps> = ({ theme, lang }) => {
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({ total_staff: 0, present: 0, absent: 0, late: 0, penalties: 0 });
  const token = localStorage.getItem('admin_token');

  const fetchData = async () => {
    try {
      const authHeader = { 'Authorization': `Bearer ${token}` };
      const [listRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/attendance/list`, { headers: authHeader }),
        fetch(`${API_URL}/api/attendance/stats`, { headers: authHeader })
      ]);

      if (listRes.ok) setData(await listRes.json());
      else console.error("Error in listRes:", await listRes.text());

      if (statsRes.ok) setStats(await statsRes.json());
      else console.error("Error in statsRes:", await statsRes.text());
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    const syncToast = toast.loading('در حال اتصال به دستگاه ZKTeco...');
    try {
      const res = await fetch(`${API_URL}/api/attendance/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || 'همگام‌سازی با موفقیت انجام شد', { id: syncToast });
        fetchData();
      } else {
        toast.error(result.detail || 'اتصال به دستگاه ناموفق بود', { id: syncToast });
      }
    } catch (err) {
      toast.error('خطا در ارتباط با سرور', { id: syncToast });
    } finally {
      setSyncing(false);
    }
  };

  const toJalaali = (dateStr: string) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      const j = jalaali.toJalaali(d);
      return `${j.jy}/${j.jm}/${j.jd}`;
    } catch { return dateStr; }
  };

  const formatNumber = (num: any) => new Intl.NumberFormat('en-US').format(num || 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
             <Clock className="text-indigo-600" size={32} />
             مدیریت حاضری و بیومتریک (ZKTeco)
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold">
             تاریخچه کامل ورود و خروج به همراه جریمه‌های محاسبه شده سیستم
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-3 active:scale-95 disabled:opacity-70"
        >
          <RefreshCw className={syncing ? 'animate-spin' : ''} size={20} />
          {syncing ? 'در حال دریافت...' : 'همگام‌سازی با دستگاه'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'کل پرسنل', val: stats.total_staff, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'حاضرین امروز', val: stats.present, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'غایبین امروز', val: stats.absent, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'مجموع جریمه‌ها', val: `${formatNumber(stats.penalties)} AFN`, icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-center gap-4"
          >
             <div className={`p-3 ${stat.bg} ${stat.color} rounded-xl`}>
                <stat.icon size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <h4 className="text-xl font-black text-slate-800 dark:text-white font-sans">{toEnglishDigits(stat.val.toString())}</h4>
             </div>
          </motion.div>
        ))}
      </div>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">کارمند</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">تاریخ شمسی</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">ساعت ورود</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">ساعت خروج</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">وضعیت</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">جریمه (AFN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold">در حال بارگزاری...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold">هیچ رکوردی یافت نشد.</td></tr>
              ) : (
                data.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-black">{r.Employee?.full_name?.charAt(0)}</div>
                        <div>
                           <div className="text-sm font-black text-slate-800 dark:text-white uppercase leading-none">{r.Employee?.full_name}</div>
                           <div className="text-[9px] text-slate-400 mt-1 font-mono tracking-tighter">ZK ID: #{r.Employee?.zkteco_id || 'manual'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{toJalaali(r.date)}</div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg font-sans text-xs font-black border border-emerald-100 dark:border-emerald-800/50">
                         {r.check_in || '---'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-lg font-sans text-xs font-black border border-amber-100 dark:border-amber-800/50">
                         {r.check_out || '---'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          r.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                          r.status === 'LATE' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                       }`}>
                         {r.status === 'PRESENT' ? 'حاضر' : r.status === 'LATE' ? `تاخیر (${r.delay_minutes}m)` : 'غایب'}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       {r.penalty_amount > 0 ? (
                         <div className="text-rose-600 font-sans font-black text-xs">
                           -{toEnglishDigits(formatNumber(r.penalty_amount))}
                         </div>
                       ) : <span className="text-slate-300">---</span>}
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
};

export default Attendance;
