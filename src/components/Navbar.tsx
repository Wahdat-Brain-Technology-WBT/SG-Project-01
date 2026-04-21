import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, Globe, ShoppingCart } from 'lucide-react';

export type Language = 'dr' | 'ps' | 'en';

interface NavbarProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: any;
  isRTL: boolean;
}

export default function Navbar({ lang, setLang, t, isRTL }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0 bg-white rounded-full p-0.5 shadow-[0_0_15px_rgba(59,130,246,0.8)]">
              <img src="/sg-logo.jpg" alt="SG Logo" className="w-full h-full object-contain rounded-full" />
            </div>

            {/* Title & Iran Yazd identifier */}
            <div className="hidden sm:flex flex-col">
              <span className="font-black text-lg md:text-xl tracking-tight text-white leading-none">
                {t.name}
              </span>
              <span className="text-[10px] font-bold text-blue-400 tracking-widest mt-1">
                {lang === 'en' ? 'IRAN YAZD' : 'ایران یزد'}
              </span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-2">
            <a href="#home" className="px-3 py-2 rounded-lg font-bold text-sm transition-all text-slate-300 hover:text-blue-400 hover:bg-white/10">{t.home}</a>
            <a href="#products" className="px-3 py-2 rounded-lg font-bold text-sm transition-all text-slate-300 hover:text-blue-400 hover:bg-white/10">{t.products}</a>
            <a href="#vip" className="px-3 py-2 rounded-lg font-bold text-sm transition-all text-slate-300 hover:text-blue-400 hover:bg-white/10">{t.vip}</a>
            <a href="#reviews" className="px-3 py-2 rounded-lg font-bold text-sm transition-all text-slate-300 hover:text-blue-400 hover:bg-white/10">{t.reviews}</a>
            <a href="#contact" className="px-3 py-2 rounded-lg font-bold text-sm transition-all text-slate-300 hover:text-blue-400 hover:bg-white/10">{t.contact}</a>
          </div>

          {/* Language & Actions */}
          <div className="flex items-center gap-4">
            <div className="relative group flex items-center bg-white/5 border border-white/10 rounded-lg px-2 transition-all hover:bg-white/10">
              <Globe size={16} className="ms-2 text-slate-300" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className="appearance-none bg-transparent py-2 px-2 pe-6 text-sm font-bold outline-none cursor-pointer text-white"
                dir="rtl"
              >
                <option value="dr" className="text-slate-900">دری</option>
                <option value="ps" className="text-slate-900">پشتو</option>
                <option value="en" className="text-slate-900">انگلیسی</option>
              </select>
              <ChevronDown size={14} className={`absolute pointer-events-none text-slate-300 ${isRTL ? 'left-2' : 'right-2'}`} />
            </div>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
              className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)]"
            >
              <ShoppingCart size={18} />
              <span>{t.placeOrder}</span>
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-xl transition-colors text-slate-300 hover:bg-white/10 hover:text-white"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-slate-900/80 backdrop-blur-xl border-b border-white/10 shadow-2xl py-4 px-4 flex flex-col gap-2">
          <a href="#home" onClick={() => setIsMenuOpen(false)} className="font-bold text-slate-300 p-3 hover:bg-white/10 hover:text-blue-400 transition-all rounded-lg">{t.home}</a>
          <a href="#products" onClick={() => setIsMenuOpen(false)} className="font-bold text-slate-300 p-3 hover:bg-white/10 hover:text-blue-400 transition-all rounded-lg">{t.products}</a>
          <a href="#vip" onClick={() => setIsMenuOpen(false)} className="font-bold text-slate-300 p-3 hover:bg-white/10 hover:text-blue-400 transition-all rounded-lg">{t.vip}</a>
          <a href="#reviews" onClick={() => setIsMenuOpen(false)} className="font-bold text-slate-300 p-3 hover:bg-white/10 hover:text-blue-400 transition-all rounded-lg">{t.reviews}</a>
          <a href="#contact" onClick={() => setIsMenuOpen(false)} className="font-bold text-slate-300 p-3 hover:bg-white/10 hover:text-blue-400 transition-all rounded-lg">{t.contact}</a>
          <button
            onClick={() => {
              setIsMenuOpen(false);
              window.dispatchEvent(new CustomEvent('open-ai-chat'));
            }}
            className="mt-4 flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-lg font-bold text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            <ShoppingCart size={18} />
            <span>{t.placeOrder}</span>
          </button>
        </div>
      )}
    </nav>
  );
}
