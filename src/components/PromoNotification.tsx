import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity } from 'lucide-react';

export default function PromoNotification({ lang, isRTL }: { lang: string, isRTL: boolean }) {
  const [isVisible, setIsVisible] = useState(false);
  const[videoError, setVideoError] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 20000);
    };
    const initialTimer = setTimeout(() => {
       cycle();
       const interval = setInterval(cycle, 30000);
       return () => clearInterval(interval);
    }, 3000);
    return () => clearTimeout(initialTimer);
  },[]);

  const content = {
    dr: { title: "خط تولید تمام اتوماتیک", desc: "ماشین‌آلات Injection با ظرفیت تولید ۱۰۰٪.", live: "پخش زنده" },
    ps: { title: "بشپړ اتوماتیک تولید", desc: "د نوي انجیکشن ماشینونه د تولید لپاره.", live: "ژوندۍ بڼه" },
    en: { title: "Automated Line", desc: "Advanced injection machinery running.", live: "LIVE FEED" },
  };

  const t = content[lang as keyof typeof content] || content.dr;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          /* قفل در سمت چپ صفحه (دور از چت‌بات) */
          className="fixed bottom-8 left-6 z-[100] max-w-[300px] w-full backdrop-blur-2xl bg-slate-900/80 border border-white/20 p-3.5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex flex-col gap-3 overflow-hidden"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-white/5 pointer-events-none z-0"></div>

          {/* کادر ویدیو */}
          <div className="relative z-10 w-full h-32 rounded-lg overflow-hidden border border-white/10 shadow-inner group bg-slate-950">
             {!videoError && (
               <video
                 src="https://cdn.pixabay.com/video/2021/08/19/85574-590635345_tiny.mp4"
                 autoPlay loop muted playsInline
                 className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-1000"
                 onError={() => setVideoError(true)}
               />
             )}
             {videoError && (
               <img
                 src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80"
                 alt="Factory Feed"
                 className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-1000"
               />
             )}

             <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent flex flex-col justify-end p-2">
               <span className="text-[10px] font-bold text-white flex items-center gap-1.5 bg-black/70 w-fit px-2 py-1 rounded backdrop-blur-md border border-red-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]"></span>
                  {t.live}
               </span>
             </div>
          </div>

          {/* توضیحات تبلیغ */}
          <div className="relative z-10 flex gap-3 items-start px-1">
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(37,99,235,0.5)]">
              <Activity size={14} className="relative z-10" />
            </div>
            <div>
              <h4 className="text-white font-black text-[13px] mb-1 tracking-wide">{t.title}</h4>
              <p className="text-slate-300 text-[11px] leading-relaxed font-medium">{t.desc}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}