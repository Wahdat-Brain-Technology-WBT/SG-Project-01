import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export default function ChatWidget() {
  const[isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'السلام علیکم! من سیستم پیشرفته هوش مصنوعی شین غزی بابا هستم. چطور می‌توانم در خرید پایپ‌های باکیفیت و استاندارد کمکتان کنم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWidgetRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatWidgetRef.current && !chatWidgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsOpen(true);
      if (customEvent.detail?.productName) {
        setInput(`سلام، من می‌خواهم محصول "${customEvent.detail.productName}" را سفارش دهم. لطفاً راهنمایی کنید.`);
      }
    };
    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenChat);
  },[]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev =>[...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: messages }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Network error');

      const data = await response.json();
      setMessages(prev =>[...prev, { role: 'bot', content: data.reply }]);
    } catch (error: any) {
      let errorMessage = 'متاسفانه خطایی رخ داد. لطفا دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.';
      if (error.name === 'AbortError') errorMessage = 'پاسخ سرور خیلی طول کشید.';
      setMessages(prev => [...prev, { role: 'bot', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  // عکس سه‌بعدی روبات پشت کامپیوتر
  const robotImageUrl = "https://cdn3d.iconscout.com/3d/premium/thumb/robot-working-on-laptop-4034871-3337424.png";

  return (
    <div ref={chatWidgetRef} className="fixed bottom-6 right-6 z-[200] flex flex-col items-end">

      {/* پیام حبابی (السلام علیکم! 👋) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
            onClick={() => setIsOpen(true)}
            className="mb-4 backdrop-blur-xl bg-slate-900/90 text-cyan-300 font-black px-6 py-3 rounded-2xl rounded-br-sm shadow-[0_10px_30px_rgba(6,182,212,0.4)] flex items-center gap-2 border border-cyan-500/30 cursor-pointer hover:scale-105 transition-transform"
            dir="rtl"
          >
            <span>السلام علیکم! 👋</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* دکمه با عکس روبات سه‌بعدی */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.6)] flex items-center justify-center transition-all hover:scale-110 border-2 border-cyan-400 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950 ${isOpen ? 'pointer-events-none' : ''}`}
      >
        <span className="absolute inset-0 rounded-full border border-cyan-400 animate-ping opacity-40"></span>
        <img
          src={robotImageUrl}
          alt="AI Robot at Laptop"
          className="w-12 h-12 object-contain relative z-10 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/8649/8649596.png"; }}
        />
      </motion.button>

      {/* پنجره چت */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-0 right-0 w-[380px] h-[600px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border border-blue-500/20 backdrop-blur-3xl"
            dir="rtl"
          >
            {/* هدر چت */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-5 flex justify-between items-center z-10 border-b border-blue-500/20 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/50 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] overflow-hidden">
                  <img src={robotImageUrl} alt="Bot" className="w-10 h-10 object-contain drop-shadow-md" />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-300">مغز هوشمند SG</h3>
                  <p className="text-blue-400 text-xs font-bold flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
                    آنلاین (هوش مصنوعی)
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl transition-all">
                <X size={24} />
              </button>
            </div>

            {/* محیط پیام‌ها */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 dark:bg-slate-950">
              {messages.map((msg, idx) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tl-sm' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tr-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-1 text-slate-600 dark:text-slate-300">
                      <Bot size={16} />
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tr-sm flex items-center gap-2 shadow-sm">
                      <Loader2 size={16} className="animate-spin text-blue-600" />
                      <span className="text-sm text-slate-500 font-medium">در حال نوشتن...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ورودی متن */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <div className="relative flex items-center">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="پیام خود را بنویسید..." className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full py-3 px-5 pe-12 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" dir="rtl" />
                <button type="submit" disabled={!input.trim() || isLoading} className="absolute left-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors">
                  <Send size={16} className="rtl:rotate-180" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}