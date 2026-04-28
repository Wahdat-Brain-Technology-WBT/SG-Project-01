import React from 'react';
import { Menu, Bell, X, RefreshCw, Moon, Sun } from 'lucide-react';
import Weather from './Weather';
import { useJalaliDate } from '../../hooks/useJalaliDate';

interface HeaderProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  activeTab: string;
  t: any;
  dbStatus: any;
  notifications: any[];
  fetchData: () => void;
  theme: 'light' | 'dark';
  setTheme: (val: 'light' | 'dark') => void;
  lang: 'dr' | 'ps' | 'en';
  setLang: (val: 'dr' | 'ps' | 'en') => void;
  role: string;
  isNotifOpen: boolean;
  setIsNotifOpen: (val: boolean) => void;
  notifRef: React.RefObject<HTMLDivElement>;
}

export default function Header({
  isSidebarOpen, setSidebarOpen, activeTab, t, dbStatus, notifications,
  fetchData, theme, setTheme, lang, setLang, role, isNotifOpen, setIsNotifOpen, notifRef
}: HeaderProps) {
  const isRTL = lang === 'dr' || lang === 'ps';
  const { formattedDate, formattedTime } = useJalaliDate();

  return (
    <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 h-20 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
      
      {/* LEFT SIDE: Title + Notifications + Refresh */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg dark:text-white transition-colors">
            <Menu size={24} />
          </button>
          <h2 className="font-black text-2xl text-slate-800 dark:text-white tracking-tight hidden sm:block">
            {t[activeTab as keyof typeof t] || t.dashboard}
          </h2>

          {/* Notifications */}
          <div className="relative ms-2" ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative text-slate-500 dark:text-slate-400 transition-all active:scale-95"
            >
              <Bell size={24} />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-sm border-2 border-white dark:border-slate-900">
                  {notifications.length}
                </span>
              )}
            </button>
            
            {isNotifOpen && (
              <div className="absolute top-16 start-0 w-80 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-2xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center mb-3 border-b dark:border-slate-800 pb-2">
                  <h4 className="font-bold text-sm dark:text-white">{t.notifications}</h4>
                  <button onClick={() => setIsNotifOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-gray-400">
                      <Bell size={32} className="mb-2 opacity-20" />
                      <p className="text-xs">هیچ اعلانی ندارید</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors cursor-default">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-red-500 dark:text-red-300 mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button 
            onClick={() => fetchData()}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-all active:rotate-180"
            title="Refresh Data"
          >
            <RefreshCw size={24} />
          </button>
        </div>
      </div>

      {/* RIGHT SIDE: Weather, Clock, User Controls */}
      <div className="flex items-center gap-4">
        
        {/* Real-Time Kabul Weather Widget */}
        <div className="hidden lg:block">
          <Weather />
        </div>

        {/* Live Jalali Clock */}
        <div className="hidden lg:flex flex-col justify-center text-right mx-2">
          <span className="text-2xl font-black text-emerald-500 dark:text-emerald-400 tracking-widest leading-none" dir="ltr">
            {formattedTime}
          </span>
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-1.5" dir="rtl">
            {formattedDate}
          </span>
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-2"></div>

        {dbStatus && (
          <div className="hidden xl:flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700">
            <div className={`w-2 h-2 rounded-full ${dbStatus.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {dbStatus.database}
            </span>
          </div>
        )}

        <button 
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
          title={t.theme}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <select 
          value={lang} 
          onChange={(e) => setLang(e.target.value as any)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-shadow"
        >
          <option value="dr">دری</option>
          <option value="ps">پښتو</option>
          <option value="en">EN</option>
        </select>
        
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md border-2 border-white dark:border-slate-800">
          {role === 'CEO_SUPERADMIN' ? 'C' : 'M'}
        </div>
      </div>
    </header>
  );
}
