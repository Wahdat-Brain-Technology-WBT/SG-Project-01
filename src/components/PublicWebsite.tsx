import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Clock, Bot, ArrowLeft, ArrowRight,
  Factory, Star, Cpu, Package, AlertCircle, Sparkles, ShoppingCart,
  Phone, Mail, MapPin, Facebook, Linkedin, Twitter
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApi } from '../hooks/useApi';
import ChatWidget from './ChatWidget';
import Navbar, { Language } from './Navbar';
import PromoNotification from './PromoNotification';

const translations = {
  dr: {
    name: "شرکت تولیدی پایپ پلاستیکی شین غزی بابا",
    tagline: "تولیدکننده برتر پایپ‌های صنعتی و ساختمانی در افغانستان",
    subTagline: "ساخته شده با ۱۰۰٪ مواد اولیه وارداتی (Prime Food Grade). کیفیت جهانی، دوام مادام‌العمر.",
    home: "صفحه اصلی",
    products: "محصولات و تولیدات",
    vip: "باشگاه VIP",
    reviews: "نظرات مشتریان",
    contact: "تماس با کارخانه",
    placeOrder: "ثبت سفارش",
    viewLivePrices: "مشاهده محصولات",
    chatWithAI: "ارتباط با هوش مصنوعی فروش",
    trust1Title: "تولید انبوه ۲۴/۷",
    trust2Title: "استاندارد بین‌المللی ISO",
    trust3Title: "سیستم فروش مبتنی بر هوش مصنوعی",
    liveProducts: "نرخنامه زنده محصولات کارخانه",
    price: "قیمت زنده:",
    afn: "افغانی",
    size: "سایز:",
    category: "دسته‌بندی:",
    outOfStock: "ناموجود",
    vipTitle: "خرید بیشتر، سود بیشتر",
    vipDesc: "مشتریانی که مجموع خریدهایشان از ۱,۰۰۰,۰۰۰ افغانی عبور کند، وارد کلاب VIP کارخانه شده و از تخفیفات و هدایای ویژه بهره‌مند می‌شوند.",
    checkVip: "بررسی وضعیت VIP من",
    footerDesc: "پیشرو در صنعت تولید پایپ در افغانستان با استانداردهای جهانی."
  },
  ps: {
    name: "د شین غزي بابا پلاستیکي پایپونو تولیدي شرکت",
    tagline: "په افغانستان کې د صنعتي او ساختماني پایپونو غوره تولید کونکی",
    subTagline: "۱۰۰٪ له وارداتي خامو موادو څخه جوړ شوي (Prime Food Grade). نړیوال کیفیت، د ټول عمر دوام.",
    home: "اصلي پاڼه",
    products: "محصولات او تولیدات",
    vip: "VIP کلب",
    reviews: "د پیرودونکو نظرونه",
    contact: "له فابریکې سره اړیکه",
    placeOrder: "فرمایش ثبت کړئ",
    viewLivePrices: "محصولات وګورئ",
    chatWithAI: "د پلور مصنوعي استخباراتو سره اړیکه",
    trust1Title: "۲۴/۷ ډله ایز تولید",
    trust2Title: "نړیوال ISO معیار",
    trust3Title: "د مصنوعي استخباراتو پر بنسټ د پلور سیسټم",
    liveProducts: "د فابریکې د محصولاتو ژوندۍ بیې",
    price: "ژوندۍ بیه:",
    afn: "افغانۍ",
    size: "سایز:",
    category: "کټګوري:",
    outOfStock: "شتون نلري",
    vipTitle: "ډیر پیرود، ډیره ګټه",
    vipDesc: "هغه پیرودونکي چې د دوی ټول پیرود له ۱,۰۰۰,۰۰۰ افغانیو څخه ډیر وي، د فابریکې VIP کلب ته ننوځي او د ځانګړو تخفیفونو او ډالیو څخه خوند اخلي.",
    checkVip: "زما د VIP حالت وګورئ",
    footerDesc: "په افغانستان کې د نړیوالو معیارونو سره د پایپ تولید صنعت کې مخکښ."
  },
  en: {
    name: "SHEEN GHAZY BABA PLASTIC PIPE MANUFACTURING",
    tagline: "Top Manufacturer of Industrial & Construction Pipes in Afghanistan",
    subTagline: "Made with 100% Imported Raw Materials (Prime Food Grade). Global Quality, Lifetime Durability.",
    home: "Home",
    products: "Products & Production",
    vip: "VIP Club",
    reviews: "Customer Reviews",
    contact: "Contact Factory",
    placeOrder: "Place Order",
    viewLivePrices: "View Products",
    chatWithAI: "Chat with Sales AI",
    trust1Title: "24/7 Mass Production",
    trust2Title: "International ISO Standard",
    trust3Title: "AI-Powered Sales System",
    liveProducts: "Live Factory Pricing",
    price: "Live Price:",
    afn: "AFN",
    size: "Size:",
    category: "Category:",
    outOfStock: "Out of Stock",
    vipTitle: "Buy More, Earn More",
    vipDesc: "Customers whose total purchases exceed 1,000,000 AFN will enter the factory's VIP club and enjoy special discounts and gifts.",
    checkVip: "Check My VIP Status",
    footerDesc: "Leader in piping manufacturing in Afghanistan with global standards."
  }
};

const formatNumber = (val: number | string) => {
  const num = Number(val);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

const ProductCarousel = ({ products, t, isRTL, handleOrderClick }: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setItemsPerView(1);
      else if (window.innerWidth < 1024) setItemsPerView(2);
      else setItemsPerView(3);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  },[]);

  useEffect(() => {
    if (!products || products.length === 0 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= products.length) return 0;
        return prev + 1;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [products, isHovered]);

  if (!products || products.length === 0) {
    return (
      <div className="w-full text-center py-20 text-slate-400 font-medium text-lg backdrop-blur-xl bg-white/5 rounded-2xl border border-dashed border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
        <Package size={48} className="mx-auto mb-4 text-slate-500" />
        هیچ محصولی یافت نشد.
      </div>
    );
  }

  const extendedProducts =[...products, ...products, ...products];

  return (
    <div
      className="relative w-full overflow-hidden py-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      dir="ltr"
    >
      <div className="absolute top-0 bottom-0 left-0 w-16 md:w-32 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute top-0 bottom-0 right-0 w-16 md:w-32 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none"></div>

      <div className="overflow-hidden">
        <motion.div
          className="flex gap-6"
          animate={{
            x: isRTL ? [0, 1032 * 2] :[0, -1032 * 2],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 35,
              ease: "linear",
            },
          }}
          style={{ width: "max-content", x: isHovered ? "var(--x-current, 0)" : undefined }}
        >
          {extendedProducts.map((product, idx) => (
            <div
              key={`${product.id}-${idx}`}
              className="w-[300px] md:w-[350px] shrink-0"
            >
              <div
                dir={isRTL ? 'rtl' : 'ltr'}
                className="h-full backdrop-blur-xl bg-white/5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_0_rgba(59,130,246,0.2)] border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all duration-500 flex flex-col overflow-hidden relative"
              >
                {product.stock_quantity === 0 && (
                  <div className="absolute top-4 end-4 z-10 bg-red-500/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1 border border-red-400/50">
                    <AlertCircle size={14} />
                    {t.outOfStock}
                  </div>
                )}

                <div className="w-full h-56 bg-slate-900 relative overflow-hidden border-b border-white/10">
                  <img
                    src={product.name.includes('PVC') ? 'https://images.unsplash.com/photo-1541888087425-ce81dfe46420?auto=format&fit=crop&q=80&w=600' : 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=600'}
                    alt="Industrial Pipe"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 opacity-80 mix-blend-luminosity hover:mix-blend-normal"
                  />
                  <div className="absolute top-4 start-4 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded text-xs font-bold text-blue-400 uppercase tracking-wider shadow-sm border border-white/10">
                    {product.category || 'صنعتی'}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-4 line-clamp-2">{product.name}</h3>

                  <div className="flex items-center justify-between text-sm text-slate-300 bg-white/5 p-3 rounded-lg mb-4 border border-white/5">
                    <span className="font-medium">{t.size}</span>
                    <span className="font-bold text-white" dir="ltr">{product.size}</span>
                  </div>

                  <div className="flex justify-between items-end mb-6">
                    <span className="text-sm font-bold text-slate-400">{t.price}</span>
                    <span className="text-2xl font-black text-green-400 flex items-baseline gap-1 drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]" dir="ltr">
                      {formatNumber(product.current_price)} <span className="text-sm font-bold text-slate-400">{t.afn}</span>
                    </span>
                  </div>

                  <button
                    onClick={() => handleOrderClick(product.name)}
                    className="mt-auto w-full flex items-center justify-center gap-2 bg-blue-600/80 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] border border-blue-400/30"
                  >
                    <ShoppingCart size={18} />
                    {t.placeOrder}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default function PublicWebsite() {
  const[lang, setLang] = useState<Language>('dr');
  const t = translations[lang] || translations['dr'];
  const isRTL = lang === 'dr' || lang === 'ps';
  const { data: products, isLoading } = useApi<any[]>('/api/public/products');

  useEffect(() => {
    document.dir = isRTL ? 'rtl' : 'ltr';
  }, [lang, isRTL]);

  const handleOrderClick = (productName: string) => {
    window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { productName } }));
  };

  return (
    <div className="relative min-h-screen bg-transparent font-sans text-white overflow-x-hidden selection:bg-blue-500/30">

      {/* GLOBAL FIXED BACKGROUND - INDUSTRIAL PIPES & MACHINERY */}
      <div className="fixed inset-0 z-[-10]">
        <img
          src="/bg-machine.jpg"
          alt="Advanced Injection Machinery"
          className="w-full h-full object-cover opacity-60"
          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2000"; }}
        />
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10">
        <ChatWidget />
        <PromoNotification lang={lang} isRTL={isRTL} />
        <Navbar lang={lang} setLang={setLang} t={t} isRTL={isRTL} />

        {/* 2. ULTIMATE GLASSMORPHISM HERO SECTION */}
        <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">

          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center mt-10">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative p-10 md:p-20 rounded-[2.5rem] overflow-hidden group"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] z-0 rounded-[2.5rem]"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-blue-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-0"></div>

              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-slate-900/50 backdrop-blur-md border border-blue-500/30 text-blue-300 font-bold text-sm mb-10 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                >
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </div>
                  {t.trust2Title} - ISO 9001:2000
                </motion.div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tight leading-[1.15] text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-50 to-slate-400 drop-shadow-lg">
                  {t.tagline}
                </h1>

                <p className="text-xl md:text-3xl font-medium mb-12 max-w-4xl mx-auto leading-relaxed text-blue-100/90 text-shadow-sm">
                  {t.subTagline}
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
                    className="w-full sm:w-auto relative group overflow-hidden bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_40px_rgba(59,130,246,0.8)] hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-center justify-center gap-3">
                      <ShoppingCart size={24} className="animate-bounce" />
                      {t.placeOrder}
                    </div>
                  </button>
                  <a
                    href="#products"
                    className="w-full sm:w-auto bg-slate-900/40 hover:bg-slate-800/60 text-white border border-white/20 px-10 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 backdrop-blur-xl hover:-translate-y-1"
                  >
                    {t.viewLivePrices}
                    {isRTL ? <ArrowLeft size={24} /> : <ArrowRight size={24} />}
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center gap-2 text-white/50">
            <div className="w-[1px] h-12 bg-gradient-to-b from-transparent to-white/50"></div>
          </div>
        </section>

        {/* 3. INDUSTRIAL METRICS & TRUST STRIP */}
        <section className="relative z-20 -mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative backdrop-blur-2xl bg-white/5 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] hover:border-blue-400/50 hover:bg-white/10 hover:-translate-y-2 transition-all duration-500 p-8 rounded-3xl flex items-center gap-6 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-16 h-16 bg-blue-900/50 text-blue-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.3)] relative z-10">
                <Factory size={32} />
              </div>
              <h3 className="font-bold text-xl text-white relative z-10">{t.trust1Title}</h3>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative backdrop-blur-2xl bg-white/5 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] hover:border-blue-400/50 hover:bg-white/10 hover:-translate-y-2 transition-all duration-500 p-8 rounded-3xl flex items-center gap-6 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/0 via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-16 h-16 bg-cyan-900/50 text-cyan-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)] relative z-10">
                <ShieldCheck size={32} />
              </div>
              <h3 className="font-bold text-xl text-white relative z-10">{t.trust2Title}</h3>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative backdrop-blur-2xl bg-white/5 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] hover:border-purple-400/50 hover:bg-white/10 hover:-translate-y-2 transition-all duration-500 p-8 rounded-3xl flex items-center gap-6 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-16 h-16 bg-purple-900/50 text-purple-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)] relative z-10">
                <Cpu size={32} />
              </div>
              <h3 className="font-bold text-xl text-white relative z-10">{t.trust3Title}</h3>
            </motion.div>
          </div>
        </section>

        {/* 4. DYNAMIC PRODUCT CAROUSEL */}
        <section id="products" className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-md"
              >
                {t.liveProducts}
              </motion.h2>
              <div className="w-24 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-green-400 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)] backdrop-blur-md">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Live Pricing Active
            </div>
          </div>

          {isLoading ? (
            <div className="relative w-full overflow-hidden py-8 flex group" dir="ltr">
              <div className="flex gap-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="min-w-[300px] md:min-w-[350px] backdrop-blur-xl bg-white/5 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/10 animate-pulse flex flex-col">
                    <div className="w-full h-48 bg-white/10 rounded-xl mb-6"></div>
                    <div className="h-6 bg-white/10 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-white/10 rounded w-1/2 mb-2"></div>
                    <div className="h-10 bg-white/10 rounded w-full mt-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ProductCarousel products={products} t={t} isRTL={isRTL} handleOrderClick={handleOrderClick} />
          )}
        </section>

        {/* 5. VIP REWARD TEASER SECTION */}
        <section id="vip" className="py-24 relative z-10" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="backdrop-blur-xl bg-white/5 border border-yellow-500/30 rounded-[2.5rem] p-12 md:p-20 shadow-[0_0_40px_rgba(234,179,8,0.15)] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/0 via-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="inline-flex items-center justify-center w-24 h-24 bg-yellow-500/10 backdrop-blur-md border border-yellow-500/30 rounded-3xl mb-8 shadow-[0_0_30px_rgba(250,204,21,0.2)] rotate-12"
              >
                <Sparkles size={48} className="text-yellow-400 -rotate-12 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-yellow-400 to-yellow-600 mb-6 tracking-tight drop-shadow-md"
              >
                {t.vipTitle}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-xl md:text-2xl text-slate-300 font-medium mb-12 leading-relaxed max-w-2xl mx-auto"
              >
                {t.vipDesc}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
                  className="inline-flex items-center gap-3 px-10 py-5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-300 hover:text-yellow-200 backdrop-blur-md font-black text-lg rounded-2xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_40px_rgba(234,179,8,0.4)] hover:-translate-y-1"
                >
                  <Star size={24} className="fill-yellow-400 text-yellow-400" />
                  {t.checkVip}
                </button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 6. CUSTOMER TESTIMONIALS */}
        <section id="reviews" className="py-24 relative z-10 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-md"
              >
                {t.reviews}
              </motion.h2>
              <div className="w-24 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] mx-auto"></div>
            </div>
          </div>

          <div className="relative w-full overflow-hidden py-8 pointer-events-auto">
            {/* Gradient overlays for smooth entry/exit */}
            <div className="absolute top-0 bottom-0 left-0 w-16 md:w-32 bg-gradient-to-r from-[#050b1a]/80 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute top-0 bottom-0 right-0 w-16 md:w-32 bg-gradient-to-l from-[#050b1a]/80 to-transparent z-10 pointer-events-none"></div>

            <motion.div
              className="flex gap-6 w-max"
              animate={{
                x: isRTL ? [0, 400 * 8] : [0, -400 * 8],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 40,
                  ease: "linear",
                },
              }}
              whileHover={{ animationPlayState: 'paused' }} // optional pause on hover
            >
              {(() => {
                const customReviews = [
                  { name: "حاجی محمد رفیق", location: "هرات", text: "پایپ‌های شین غزی بابا در فشار بالای آب بی‌نظیر هستند. ما در پروژه‌های آبرسانی هرات فقط از این برند استفاده می‌کنیم و تا به حال هیچ نشتی نداشته‌ایم.", initial: "ح" },
                  { name: "شرکت ساختمانی افغان", location: "کابل", text: "کیفیت مواد اولیه (Prime Food Grade) واقعاً در رنگ و دوام پایپ‌ها مشخص است. ارسال بسیار سریع بود و پشتیبانی فوق‌العاده‌ای داشتند.", initial: "ش" },
                  { name: "انجنیر سید ولی", location: "مزار شریف", text: "سیستم سفارش‌دهی از طریق چت‌بات هوش مصنوعی واقعاً یک انقلاب در صنعت افغانستان است. عالی بود، دقیقاً همان چیزی که نیاز داشتیم.", initial: "س" },
                  { name: "شرکت آبرسانی پامیر", location: "بدخشان", text: "مقاومت پایپ‌های PPRC در برابر یخ‌زدگی در هوای سرد بدخشان فوق‌العاده است. بهترین انتخاب برای مناطق کوهستانی.", initial: "پ" },
                  { name: "حاجی نصرت‌الله", location: "ننگرهار", text: "اتصالات (فیتنگز) شین غزی بابا با کیفیت عالی ساخته شده‌اند و در زمان جوشکاری کاملاً ذوب و یکپارچه می‌شوند.", initial: "ن" },
                  { name: "انجینر ضیاء", location: "قندهار", text: "ما برای سیستم قطره‌ای گلخانه‌های بزرگ خپله فقط از پایپ‌های PVC این شرکت می‌بریم. طول عمرشان بی‌نظیر است.", initial: "ض" },
                  { name: "نمایندگی صالحی", location: "بلخ", text: "مشتریان ما همیشه مارک 'ایران یزد' شین غزی بابا را تقاضا می‌کنند چون نام نیکی در بازار پیدا کرده است.", initial: "ص" },
                  { name: "شرکت مهندسی افق", location: "کابل", text: "بسته‌بندی معیاری، قیمت مناسب تولیدی و خدمات پس از فروش‌شان باعث شده ما پیمانکار دائمی‌شان باشیم.", initial: "ا" }
                ];
                const extendedReviews = [...customReviews, ...customReviews, ...customReviews];

                return extendedReviews.map((review, idx) => (
                  <div key={idx} className="w-[350px] shrink-0 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300">
                    <div className="flex gap-1 mb-6">
                      {[...Array(5)].map((_, i) => <Star key={i} size={20} className="fill-yellow-400 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" />)}
                    </div>
                    <p className="text-slate-300 text-base leading-relaxed mb-8 italic line-clamp-4 min-h-[100px]">
                      "{review.text}"
                    </p>
                    <div className="flex items-center gap-4 border-t border-white/10 pt-6 mt-auto">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-600/30 to-blue-900/30 border border-blue-500/30 rounded-full flex items-center justify-center text-white font-bold text-xl backdrop-blur-md shrink-0">
                        {review.initial}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg line-clamp-1">{review.name}</h4>
                        <div className="flex items-center gap-1 text-blue-400 text-sm mt-1">
                          <MapPin size={14} />
                          {review.location}
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </motion.div>
          </div>
        </section>

        {/* 7. ENTERPRISE FOOTER & CONTACT */}
        <footer id="contact" className="backdrop-blur-xl bg-white/5 border-t border-white/10 pt-20 pb-10 relative z-10" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
              {/* Col 1: Bio */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  {/* Real uploaded logo for Footer */}
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0 bg-white rounded-full p-0.5 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                    <img src="/sg-logo.jpg" alt="SG Logo" className="w-full h-full object-contain rounded-full" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-lg md:text-xl tracking-tight text-white leading-none whitespace-nowrap">
                      {t.name}
                    </span>
                    <span className="text-[10px] font-bold text-blue-400 tracking-widest mt-1 uppercase">
                      {lang === 'en' ? 'IRAN YAZD' : 'ایران یزد'}
                    </span>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {t.footerDesc}
                </p>
              </div>

              {/* Col 2: Contact */}
              <div>
                <h4 className="font-bold text-xl text-white mb-6 border-b border-white/10 pb-2 inline-block">{t.contact}</h4>
                <ul className="space-y-4">
                  <li>
                    <a href="https://wa.me/9399307738" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <Phone size={18} />
                      </div>
                      <span dir="ltr" className="font-medium">+93 993 077 38</span>
                    </a>
                  </li>
                  <li>
                    <a href="mailto:iranyazd.af@gmail.com" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <Mail size={18} />
                      </div>
                      <span dir="ltr" className="font-medium">iranyazd.af@gmail.com</span>
                    </a>
                  </li>
                  <li>
                    <a href="https://maps.google.com/?q=پارکهای+صنعتی+سرک+بگرام+کوچه+4" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <MapPin size={18} />
                      </div>
                      <span className="font-medium">پارکهای صنعتی سرک بگرام کوچه 4</span>
                    </a>
                  </li>
                </ul>
              </div>

              {/* Col 3: Social Media */}
              <div>
                <h4 className="font-bold text-xl text-white mb-6 border-b border-white/10 pb-2 inline-block">شبکه‌های اجتماعی</h4>
                <div className="flex gap-4">
                  <a href="https://www.facebook.com/share/14UwKn38HeF/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                    <Facebook size={20} />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                    <Linkedin size={20} />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                    <Twitter size={20} />
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-8 text-center bg-white/5 mx-[-1rem] md:mx-0 px-4 md:px-0 py-6 md:py-8 rounded-t-3xl md:rounded-t-none mt-12 md:mt-0 backdrop-blur-md">
              <p className="text-slate-300 text-sm font-bold tracking-wider" dir="ltr">
                © 2026 SHEEN GHAZY BABA. Powered by Wahdat Brain Technology (WBT).
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}