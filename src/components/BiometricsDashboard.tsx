import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Fingerprint, MonitorPlay, CheckCircle2, RotateCcw, AlertTriangle, Users } from 'lucide-react';

export default function BiometricsDashboard({ isRTL = true }: { isRTL?: boolean }) {
  const [deviceIp, setDeviceIp] = useState("192.168.1.201");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');

    try {
      // In production, this will hit your FastAPI Python backend
      // Example: await fetch(`http://127.0.0.1:8000/api/biometrics/sync?device_ip=${deviceIp}`, { method: 'POST' });

      // Simulating API call for preview purposes
      await new Promise(resolve => setTimeout(resolve, 2500));
      setSyncStatus('success');
    } catch (error) {
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      className="max-w-4xl mx-auto p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <Fingerprint size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">مدیریت دستگاه حضور و غیاب</h2>
            <p className="text-slate-400 font-medium mt-1">ZKTeco K40 - ارتباط زنده (TCP/IP)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {/* Settings Column */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 p-5 rounded-2xl">
              <label className="block text-slate-300 font-bold mb-2">آی‌پی دستگاه (IP Address):</label>
              <input
                type="text"
                value={deviceIp}
                onChange={(e) => setDeviceIp(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
                placeholder="192.168.1.201"
                dir="ltr"
              />
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <AlertTriangle size={12} /> پورت پیش‌فرض: 4370
              </p>
            </div>

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] ${
                isSyncing
                  ? 'bg-blue-600/50 cursor-not-allowed text-white/70'
                  : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:-translate-y-1'
              }`}
            >
              {isSyncing ? (
                <>
                  <RotateCcw size={22} className="animate-spin" />
                  در حال ارتباط با ماشین...
                </>
              ) : (
                <>
                  <MonitorPlay size={22} />
                  فراخوانی اطلاعات دیتابیس
                </>
              )}
            </button>

            {syncStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl text-green-400 flex items-center gap-3"
              >
                <CheckCircle2 size={24} />
                <span className="font-bold">همگام‌سازی با موفقیت در دیتابیس PostgreSQL ثبت شد.</span>
              </motion.div>
            )}
          </div>

          {/* Status/Logs Column */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 shadow-inner flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Users size={18} className="text-blue-400" />
                  وضعیت فعلی دستگاه
                </h3>
                <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                </span>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex justify-between text-sm border-b border-white/5 pb-2">
                  <span className="text-slate-400">مدل ماشین:</span>
                  <span className="text-white font-bold">ZKTeco K40 Fingerprint</span>
                </li>
                <li className="flex justify-between text-sm border-b border-white/5 pb-2">
                  <span className="text-slate-400">زمان آخرین سینک:</span>
                  <span className="text-white font-bold" dir="ltr">Today, 08:00 AM</span>
                </li>
                <li className="flex justify-between text-sm border-b border-white/5 pb-2">
                  <span className="text-slate-400">تعداد رکوردهای در انتظار:</span>
                  <span className="text-yellow-400 font-bold">142</span>
                </li>
              </ul>
            </div>

            <div className="text-xs text-slate-500 bg-black/40 p-4 rounded-xl border border-white/5 font-mono leading-relaxed" dir="ltr">
              > {`ssh zkteco@${deviceIp}`}<br/>
              > Initializing connection...<br/>
              > Port 4370 reachable.<br/>
              > Waiting for manual sync trigger...
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
