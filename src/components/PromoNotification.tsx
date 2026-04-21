import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity } from 'lucide-react';

export default function PromoNotification({ lang, isRTL }: { lang: string, isRTL: boolean }) {
  const [isVisible, setIsVisible] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;
    let cycleInterval: NodeJS.Timeout;

    const cycle = () => {
      setIsVisible(true);
      // ویدیو ۴۸ ثانیه نمایش داده می‌شود تا ۲ ثانیه آخرش پخش نشود
      hideTimeout = setTimeout(() => setIsVisible(false), 48000);
    };

    const initialTimer = setTimeout(() => {
       cycle();
       // ۴۸ ثانیه نمایش + ۳ ثانیه مخفی بودن = هر ۵۱ ثانیه چرخه تکرار می‌شود
       cycleInterval = setInterval(cycle, 51000);
    }, 4000); // شروع با ۴ ثانیه تاخیر اولیه

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(hideTimeout);
      clearInterval(cycleInterval);
    };
  }, []);

  const content = {
    dr: { title: "شین غزی بابا", desc: "کیفیت، رقابتی است که پایان ندارد!", live: "پخش زنده" },
    ps: { title: "شین غزی بابا", desc: "کیفیت هغه سیالي ده چی پایښت نه لری!", live: "ژوندۍ بڼه" },
    en: { title: "Sheen Ghazy Baba", desc: "Quality is a competition with no limits!", live: "LIVE FEED" },
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
          /* قفل شده در سمت چپ و کوچک‌تر شده */
          className="fixed bottom-6 left-6 z-[100] w-[260px] backdrop-blur-2xl bg-slate-900/80 border border-white/20 p-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex flex-col gap-2.5 overflow-hidden"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-white/5 pointer-events-none z-0"></div>

          {/* کادر ویدیو (کوچک و متناسب) */}
          <div className="relative z-10 w-full h-28 rounded-lg overflow-hidden border border-white/10 shadow-inner group bg-slate-950">
             {!videoError && (
               <video
                 src="/factory.mp4"
                 autoPlay loop muted playsInline preload="auto"
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

             <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent flex flex-col justify-end p-2 pointer-events-none">
             </div>
          </div>

          <div className="relative z-10 flex gap-2.5 items-start px-1">
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(37,99,235,0.5)]">
              <Activity size={14} className="relative z-10" />
            </div>
            <div>
              <h4 className="text-white font-black text-[12px] mb-0.5 tracking-wide leading-tight">{t.title}</h4>
              <p className="text-slate-300 text-[10px] leading-relaxed font-medium">{t.desc}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}