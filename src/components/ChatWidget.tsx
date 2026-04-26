import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, User, BrainCircuit, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Custom Scalable Robot Avatar
const RobotAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
    <defs>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
    </defs>
    {/* Background */}
    <rect width="100" height="100" fill="url(#bg)" />

    {/* Glow */ }
    <circle cx="50" cy="50" r="45" fill="url(#glow)" />

    {/* Computer Screen Setup in bg */}
    <path d="M 15 25 L 85 25 L 80 80 L 20 80 Z" fill="#1e293b" stroke="#3b82f6" strokeWidth="1" opacity="0.4"/>
    <rect x="45" y="80" width="10" height="10" fill="#334155" />
    <rect x="30" y="90" width="40" height="3" fill="#475569" />

    {/* Headphone Band */}
    <path d="M 21 38 C 21 12, 79 12, 79 38" fill="none" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />

    {/* Robot Head shape */}
    <rect x="25" y="25" width="50" height="45" rx="15" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />

    {/* Headphone Cups */}
    <rect x="15" y="32" width="12" height="28" rx="5" fill="#3b82f6" />
    <rect x="73" y="32" width="12" height="28" rx="5" fill="#3b82f6" />
    <rect x="13" y="38" width="4" height="16" rx="2" fill="#60a5fa" />
    <rect x="83" y="38" width="4" height="16" rx="2" fill="#60a5fa" />

    {/* Cool Black Sunglasses */}
    <path d="M 26 38 Q 50 38, 74 38 L 70 54 Q 50 60, 30 54 Z" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" strokeLinejoin="round" />

    {/* Glasses Reflection */}
    <polygon points="32,41 42,41 35,49" fill="#ffffff" opacity="0.2" />
    <polygon points="58,41 68,41 61,49" fill="#ffffff" opacity="0.2" />

    {/* Little Blue LED lights on robot face (Cheeks) */}
    <circle cx="35" cy="58" r="2" fill="#60a5fa" />
    <circle cx="65" cy="58" r="2" fill="#60a5fa" />

    {/* Cute Mouth */}
    <path d="M 45 61 Q 50 66, 55 61" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
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

  // Handle click outside to close
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

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Listen for custom event from product cards
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
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';

      console.log('Sending chat request to:', `${API_URL}/api/chat`);
      console.log('Payload:', { message: userMessage, history: messages });

      // Create an AbortController to timeout the request if it hangs
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      setMessages(prev => [...prev, { role: 'bot', content: data.reply }]);
    } catch (error: any) {
      console.error('Chat error details:', error);

      let errorMessage = 'متاسفانه خطایی رخ داد. لطفا دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.';

      if (error.name === 'AbortError') {
        errorMessage = 'پاسخ سرور خیلی طول کشید. لطفاً اتصال اینترنت خود را بررسی کنید.';
      } else if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        errorMessage = 'خطا در اتصال به سرور (CORS یا قطعی شبکه). لطفاً بررسی کنید که سرور بک‌اند (FastAPI) روشن باشد.';
      }

      setMessages(prev => [...prev, { role: 'bot', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={chatWidgetRef} className="fixed bottom-6 right-6 z-[200] flex flex-col items-end">
      {/* Floating Toggle Button with Greeting */}
      <div className="relative">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute -top-14 right-0 bg-slate-900 text-white text-sm font-bold px-4 py-2 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.4)] whitespace-nowrap border border-blue-500/30 flex items-center gap-2"
              dir="rtl"
            >
              <Sparkles size={14} className="text-blue-400" />
              السلام علیکم!
              {/* Tooltip triangle */}
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-slate-900 border-b border-l border-blue-500/30 rotate-[-45deg]"></div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: isOpen ? 0 : 1 }}
          onClick={() => setIsOpen(true)}
          className={`w-16 h-16 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.6)] flex items-center justify-center transition-all hover:scale-110 border-2 border-blue-400 overflow-hidden bg-slate-900 ${isOpen ? 'pointer-events-none' : ''}`}
        >
          {/* Custom Robot Avatar representing an AI at a computer */}
          <RobotAvatar />
        </motion.button>
      </div>

      {/* Chat Window */}
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
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-5 flex justify-between items-center z-10 border-b border-blue-500/20 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-800 border border-blue-500/50 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] overflow-hidden">
                  <RobotAvatar />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-300">مغز هوشمند SG</h3>
                  <p className="text-blue-400 text-xs font-bold flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
                    آنلاین (هوش مصنوعی)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 dark:bg-slate-950">
              {messages.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tl-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tr-sm'
                      }`}
                    >
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

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="پیام خود را بنویسید..."
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full py-3 px-5 pe-12 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  dir="rtl"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute left-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                >
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
