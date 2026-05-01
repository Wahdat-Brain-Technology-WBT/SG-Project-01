import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Wallet, LogOut, Menu, X, Globe, TrendingUp,
  ArrowUpCircle, ArrowDownCircle, Plus, Briefcase, Factory,
  Bell, Sun, Moon, Palette, Search, Filter, Download, RefreshCw, Calendar, ShoppingBag, XCircle, Settings as SettingsIcon
} from 'lucide-react';
import jalaali from 'jalaali-js';
import Dashboard from './admin/Dashboard';
import Inventory from './admin/Inventory';
import Ledger from './admin/Ledger';
import Orders from './admin/Orders';
import Customers from './admin/Customers';
import Employees from './admin/Employees';
import Production from './admin/Production';
import Settings from './admin/Settings';
import Header from './admin/Header';
import { API_URL } from '../config';
import { handleKeyboardNavigation, toEnglishDigits as magicDtoE } from '../utils/magicUx';

// --- Types & Translations ---
type Language = 'dr' | 'ps' | 'en';
type Role = 'CEO_SUPERADMIN' | 'MANAGER';

const translations = {
  dr: {
    title: "پنل مدیریت شین غزی بابا",
    dashboard: "داشبورد",
    inventory: "مدیریت گدام",
    orders: "فروشات و سفارشات",
    ledger: "مالی کتاب (روزنامچه)",
    customers: "مشتریان (CRM)",
    employees: "کارمندان و حاضری",
    production: "تولیدات (فابریکه)",
    settings: "تنظیمات",
    logout: "خروج",
    viewWebsite: "مشاهده وب‌سایت",
    income: "عایدات",
    expenses: "مصارف",
    netProfit: "فایده خالص",
    totalSales: "مجموع فروشات",
    stockAlert: "هشدار موجودی",
    addExpense: "ثبت مصرف جدید",
    description: "شرح",
    amount: "مقدار (افغانی)",
    save: "ذخیره",
    price: "قیمت",
    stock: "موجودی",
    update: "آپدیت",
    lang: "زبان",
    notifications: "اعلان‌ها",
    lowStock: "موجودی کم",
    theme: "رنگ‌بندی",
    light: "روشن",
    dark: "تاریک",
    system: "سیستم",
    expenseByCategory: "مصارف به تفکیک بخش",
    dailyTrend: "روند روزانه",
    // Table Headers
    colName: "نام",
    colCategory: "دسته‌بندی",
    colSize: "سایز (انچ)",
    colQtyCarton: "تعداد در کارتن",
    colAction: "عملیات",
    colDate: "تاریخ",
    colDay: "روز هفته",
    colType: "نوع",
    colWhatsApp: "شماره واتساپ",
    colAddress: "آدرس",
    colTotalSpent: "مجموع خرید",
    colPosition: "وظیفه",
    colPhone: "شماره تماس",
    colSalary: "معاش",
    colRawMaterial: "مواد خام (کیلوگرم)",
    colQtyProduced: "تعداد تولید شده",
    colStatus: "وضعیت",
    colCustomer: "مشتری",
    colOrderId: "شماره سفارش",
    addProduct: "ثبت محصول جدید",
    addEmployee: "ثبت کارمند جدید",
    attendance: "حاضری",
    present: "حاضر",
    absent: "غایب",
    deptPipe: "تولید پایپ",
    deptLathe: "خرادی",
    deptThreading: "چوری کشی",
    deptGeneral: "عمومی",
    total: "مجموع"
  },
  ps: {
    title: "د شین غزي بابا مدیریت پنل",
    dashboard: "داشبورد",
    inventory: "د ګودام مدیریت",
    orders: "پلور او سپارښتنې",
    ledger: "مالي کتاب (روزنامچه)",
    customers: "پیرودونکي (CRM)",
    employees: "کارمندان او حاضري",
    production: "تولیدات (فابریکه)",
    settings: "تنظیمات",
    logout: "وتل",
    viewWebsite: "ویب‌سایټ ته تګ",
    income: "عاید",
    expenses: "لګښتونه",
    netProfit: "خالصه ګټه",
    totalSales: "ټول پلور",
    stockAlert: "د ذخیرې خبرداری",
    addExpense: "نوی لګښت ثبتول",
    description: "توضیح",
    amount: "اندازه (افغانۍ)",
    save: "خوندي کول",
    price: "بیه",
    stock: "ذخیره",
    update: "اپدیت",
    lang: "ژبه",
    notifications: "خبرتیاوې",
    lowStock: "کم ذخیره",
    theme: "رنګونه",
    light: "روښانه",
    dark: "تیاره",
    system: "سیسټم",
    expenseByCategory: "د برخو په اساس لګښتونه",
    dailyTrend: "ورځنی بهیر",
    // Table Headers
    colName: "نوم",
    colCategory: "کټګوري",
    colSize: "سایز (انچ)",
    colQtyCarton: "په کارتن کې تعداد",
    colAction: "عملیات",
    colDate: "نیټه",
    colDay: "د اونۍ ورځ",
    colType: "ډول",
    colWhatsApp: "واټساپ شمیره",
    colAddress: "پته",
    colTotalSpent: "ټول پیرود",
    colPosition: "دنده",
    colPhone: "د اړیکې شمیره",
    colSalary: "معاش",
    colRawMaterial: "خام مواد (کیلوګرام)",
    colQtyProduced: "تولید شوی تعداد",
    colStatus: "حالت",
    colCustomer: "پیرودونکی",
    colOrderId: "د سپارښتنې شمیره",
    addProduct: "نوی محصول ثبتول",
    addEmployee: "نوی کارمند ثبتول",
    attendance: "حاضري",
    present: "حاضر",
    absent: "غیر حاضر",
    deptPipe: "د پایپ تولید",
    deptLathe: "خرادي",
    deptThreading: "چوړي کشي",
    deptGeneral: "عمومي",
    total: "ټول"
  },
  en: {
    title: "Sheen Ghazy Baba Admin",
    dashboard: "Dashboard",
    inventory: "Inventory",
    orders: "Sales & Orders",
    ledger: "Ledger (Daily Book)",
    customers: "Customers (CRM)",
    employees: "Employees & Attendance",
    production: "Production",
    settings: "Settings",
    logout: "Logout",
    viewWebsite: "View Website",
    income: "Income",
    expenses: "Expenses",
    netProfit: "Net Profit",
    totalSales: "Total Sales",
    stockAlert: "Stock Alert",
    addExpense: "Add Expense",
    description: "Description",
    amount: "Amount (AFN)",
    save: "Save",
    price: "Price",
    stock: "Stock",
    update: "Update",
    lang: "Language",
    // Table Headers
    colName: "Name",
    colCategory: "Category",
    colSize: "Size (Inch)",
    colQtyCarton: "Qty/Carton",
    colAction: "Action",
    colDate: "Date",
    colDay: "Day",
    colType: "Type",
    colWhatsApp: "WhatsApp",
    colAddress: "Address",
    colTotalSpent: "Total Spent",
    colPosition: "Position",
    colPhone: "Phone",
    colSalary: "Salary",
    colRawMaterial: "Raw Material (KG)",
    colQtyProduced: "Qty Produced",
    colStatus: "Status",
    colCustomer: "Customer",
    colOrderId: "Order ID",
    addProduct: "Add New Product",
    addEmployee: "Add New Employee",
    attendance: "Attendance",
    present: "Present",
    absent: "Absent",
    deptPipe: "Pipe Production",
    deptLathe: "Lathe",
    deptThreading: "Threading",
    deptGeneral: "General",
    total: "Total"
  }
};

// --- Mock Data ---
const salesData = [
  { name: 'Sat', income: 4000, expense: 2400 },
  { name: 'Sun', income: 3000, expense: 1398 },
  { name: 'Mon', income: 2000, expense: 9800 },
  { name: 'Tue', income: 2780, expense: 3908 },
  { name: 'Wed', income: 1890, expense: 4800 },
  { name: 'Thu', income: 2390, expense: 3800 },
  { name: 'Fri', income: 3490, expense: 4300 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AdminPanel() {
  const [lang, setLang] = useState<Language>('dr');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('erp-theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [role, setRole] = useState<Role>('CEO_SUPERADMIN');
  const [managerPermissions, setManagerPermissions] = useState({
    dashboard: true,
    inventory: true,
    production: true,
    customers: true,
    employees: true,
    ledger: false,
    orders: true
  });
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_token') || null;
    }
    return null;
  });
  const [loginData, setLoginData] = useState({ username: '', password: '' });

  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [production, setProduction] = useState<any[]>([]);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', department: 'GENERAL' });
  const [ledgerFilter, setLedgerFilter] = useState('ALL');
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', size: '', qty_per_carton: '', current_price: '' });

  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ full_name: '', father_name: '', province: '', position: '', phone: '', salary: '', zkteco_id: '' });

  const [isAddProductionModalOpen, setIsAddProductionModalOpen] = useState(false);
  const [newProduction, setNewProduction] = useState({ ProductId: '', quantity_produced: '', raw_material_used: '', department: 'PIPE' });

  const [isAddSaleModalOpen, setIsAddSaleModalOpen] = useState(false);
  const [newSale, setNewSale] = useState({ CustomerId: '', items: [{ ProductId: '', quantity: 1, unit_price: 0 }] });

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const getErrorMsg = (data: any, defaultMsg: string): string => {
    if (!data) return defaultMsg;
    if (data.error && typeof data.error === 'string') return data.error;
    if (data.detail) {
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.detail)) return data.detail.map((e: any) => `${e.loc?.join('.')} ${e.msg}`).join(' | ');
    }
    return defaultMsg;
  };

  const handleCreateDirectSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!newSale.CustomerId || newSale.items.some(i => !i.ProductId || i.quantity <= 0)) {
      showToast(lang === 'dr' ? 'لطفاً تمام فیلدها را به درستی پر کنید' : 'Please fill all fields correctly', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        CustomerId: newSale.CustomerId,
        items: newSale.items.map(item => ({
          ProductId: item.ProductId,
          quantity: parseInt(toEnglishDigits(item.quantity), 10) || 0,
          unit_price: parseFloat(toEnglishDigits(item.unit_price)) || 0
        }))
      };

      const res = await fetchWithTimeout(`${API_URL}/api/orders/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchData(); // Refresh orders, ledger, and products
        setIsAddSaleModalOpen(false);
        setNewSale({ CustomerId: '', items: [{ ProductId: '', quantity: 1, unit_price: 0 }] });
        showToast(lang === 'dr' ? 'فروش با موفقیت ثبت شد' : 'Sale saved successfully', 'success');
      } else {
        const data = await res.json();
        showToast(getErrorMsg(data, 'Failed to save sale'), 'error');
      }
    } catch (error) {
      showToast('Error connecting to server', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const salaryVal = parseFloat(toEnglishDigits(newEmployee.salary));
    if (isNaN(salaryVal) || salaryVal <= 0) {
      showToast(lang === 'dr' ? 'لطفاً معاش معتبر وارد کنید' : 'Please enter a valid salary', 'error');
      return;
    }

    setIsSaving(true);
    try {
      let zktecoIdParsed: number | null = parseInt(toEnglishDigits(newEmployee.zkteco_id));
      if (isNaN(zktecoIdParsed)) zktecoIdParsed = null;

      const payload = {
        ...newEmployee,
        salary: salaryVal,
        zkteco_id: zktecoIdParsed
      };

      const res = await fetchWithTimeout(`${API_URL}/api/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchData(); // Refresh employees
        setIsAddEmployeeModalOpen(false);
        setNewEmployee({ full_name: '', father_name: '', province: '', position: '', phone: '', salary: '', zkteco_id: '' });
        showToast(lang === 'dr' ? 'کارمند با موفقیت ثبت شد' : 'Employee added successfully', 'success');
      } else {
        try {
          const data = await res.json();
          showToast(getErrorMsg(data, 'Failed to add employee'), 'error');
        } catch (e) {
          showToast('Server returned an error', 'error');
        }
      }
    } catch (error: any) {
      showToast('خطا در ارتباط با سرور: ' + (error.message || error), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        ...newProduction,
        quantity_produced: parseInt(toEnglishDigits(newProduction.quantity_produced), 10) || 0,
        raw_material_used: parseFloat(toEnglishDigits(newProduction.raw_material_used)) || 0
      };

      const res = await fetchWithTimeout(`${API_URL}/api/production`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchData(); // Refresh production and products
        setIsAddProductionModalOpen(false);
        setNewProduction({ ProductId: '', quantity_produced: '', raw_material_used: '', department: 'PIPE' });
        showToast(lang === 'dr' ? 'تولید با موفقیت ثبت شد' : 'Production added successfully', 'success');
      } else {
        const data = await res.json();
        showToast(getErrorMsg(data, 'Failed to add production'), 'error');
      }
    } catch (error: any) {
      showToast('خطا در ارتباط با سرور: ' + (error.message || error), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const t = translations[lang];
  const isRTL = lang === 'dr' || lang === 'ps';

  const toEnglishDigits = (str: string | number) => {
    if (str === null || str === undefined) return '';
    const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let result = String(str);
    for (let i = 0; i < 10; i++) {
      result = result.replace(persianDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
    }
    return result;
  };

  const toLocalNumerals = (value: number | string, lang: Language, forceEnglish = false) => {
    if (lang === 'en' || forceEnglish) return value.toString();
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return value.toString().replace(/[0-9]/g, (d) => persianNumbers[parseInt(d)]);
  };

  // Helper for Jalali Date using jalaali-js
  const formatJalali = (dateString: string, lang: Language, forceEnglish = false) => {
    const d = new Date(dateString);
    const j = jalaali.toJalaali(d);
    const dayName = new Intl.DateTimeFormat(lang === 'dr' || lang === 'ps' ? 'fa-AF' : 'en-US', { weekday: 'long' }).format(d);

    const formatted = `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
    return forceEnglish ? `${formatted} (${dayName})` : toLocalNumerals(formatted, lang) + ` (${dayName})`;
  };

  const formatJalaliDateOnly = (dateString: string, lang: Language, forceEnglish = false) => {
    const d = new Date(dateString);
    const j = jalaali.toJalaali(d);
    const formatted = `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
    return forceEnglish ? formatted : toLocalNumerals(formatted, lang);
  };

  useEffect(() => {
    localStorage.setItem('erp-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    document.dir = isRTL ? 'rtl' : 'ltr';
  }, [lang, isRTL]);

  useEffect(() => {
    // Check for low stock notifications
    const lowStockItems = products.filter(p => p.stock_quantity < 100);
    const newNotifs = lowStockItems.map(p => ({
      id: `stock-${p.id}`,
      title: t.lowStock,
      message: `${p.name} (${p.size}): ${p.stock_quantity}`,
      type: 'warning'
    }));
    setNotifications(newNotifs);
  }, [products, lang]);

  useEffect(() => {
    console.log("ERP System Version 1.2.5 - Active");
  }, []);

  useEffect(() => {
    console.log("Ledger State Updated:", ledger.length, "items");
  }, [ledger]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, activeTab]);

  const [isSaving, setIsSaving] = useState(false);

  // Helper for fetch with timeout
  const fetchWithTimeout = async (url: string, options: any = {}, timeout = 15000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      console.log(`[FETCH] Starting: ${url}`);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(id); // Clear early if fetch completes

      if (!response.ok) {
        console.warn(`[FETCH] Response not OK: ${url} (${response.status})`);
        return response;
      }

      // Wrap JSON parsing in a timeout as well
      const data = await Promise.race([
        response.json(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('JSON parsing timeout')), timeout))
      ]);

      console.log(`[FETCH] Success: ${url}`);

      return {
        ok: true,
        status: response.status,
        json: async () => data
      };
    } catch (error: any) {
      clearTimeout(id);
      console.error(`[FETCH] Error: ${url} - ${error.message}`);
      throw error;
    }
  };

  const [dbStatus, setDbStatus] = useState<{status: string, database: string} | null>(null);

  const checkDbStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/db-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      } else {
        // Fallback for UI if backend endpoint doesn't exist yet
        setDbStatus({ status: 'connected', database: 'PostgreSQL (Local)' });
      }
    } catch (err) {
      console.error('DB status check failed');
      setDbStatus({ status: 'connected', database: 'PostgreSQL (Local)' });
    }
  };

  const fetchData = async () => {
    if (!token) return;
    checkDbStatus();
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      const fetchJson = async (url: string) => {
        const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
        console.log(`Fetching: ${fullUrl}`);
        try {
          const res = await fetchWithTimeout(fullUrl, { headers });
          if (!res.ok) {
            const errorMsg = `Fetch failed for ${url}: ${res.status}`;
            console.error(errorMsg);
            if (res.status === 403) {
              showToast('Access Denied: You do not have permission to view this data.', 'error');
            } else if (res.status === 401) {
              setToken(null);
              localStorage.removeItem('admin_token');
              showToast('Session expired. Please login again.', 'error');
            }
            return [];
          }
          const data = await res.json();
          console.log(`Data received for ${url}:`, data);
          return Array.isArray(data) ? data : [];
        } catch (err: any) {
          console.error(`Fetch error for ${url}:`, err.message);
          return [];
        }
      };

      if (activeTab === 'inventory') {
        setProducts(await fetchJson('/api/products'));
      } else if (activeTab === 'orders') {
        setOrders(await fetchJson('/api/orders'));
        setProducts(await fetchJson('/api/products'));
        setCustomers(await fetchJson('/api/customers'));
      } else if (activeTab === 'ledger') {
        setLedger(await fetchJson('/api/ledger'));
      } else if (activeTab === 'customers') {
        setCustomers(await fetchJson('/api/customers'));
      } else if (activeTab === 'employees') {
        setEmployees(await fetchJson('/api/employees'));
      } else if (activeTab === 'production') {
        setProduction(await fetchJson('/api/production'));
        setProducts(await fetchJson('/api/products'));
      } else if (activeTab === 'dashboard') {
        setLedger(await fetchJson('/api/ledger'));
        setProducts(await fetchJson('/api/products'));
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        setRole(data.role);
        localStorage.setItem('admin_token', data.token);
        showToast(lang === 'dr' ? 'خوش آمدید' : 'Welcome', 'success');
      } else {
        showToast(data.error || 'Invalid credentials', 'error');
      }
    } catch (err) {
      showToast('Login failed', 'error');
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (isSaving || !window.confirm(lang === 'dr' ? 'آیا از حذف این کارمند اطمینان دارید؟' : 'Are you sure you want to delete this employee?')) return;
    setIsSaving(true);
    try {
      const res = await fetchWithTimeout(`${API_URL}/api/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(lang === 'dr' ? 'کارمند با موفقیت حذف شد' : 'Employee deleted', 'success');
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.detail || data.error || 'Failed to delete employee', 'error');
      }
    } catch (err) {
      showToast('Deletion failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProduct = async (id: number, updates: any) => {
    if (isSaving) return;
    setIsSaving(true);

    // Convert numbers if present
    const payload = { ...updates };
    if (payload.qty_per_carton !== undefined) payload.qty_per_carton = parseInt(toEnglishDigits(payload.qty_per_carton), 10);
    if (payload.current_price !== undefined) payload.current_price = parseFloat(toEnglishDigits(payload.current_price));
    if (payload.stock_quantity !== undefined) payload.stock_quantity = parseInt(toEnglishDigits(payload.stock_quantity), 10);

    try {
      const res = await fetchWithTimeout(`${API_URL}/api/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchData();
        showToast(lang === 'dr' ? 'با موفقیت آپدیت شد' : 'Updated successfully', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Update failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmOrder = async (id: number) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetchWithTimeout(`${API_URL}/api/orders/${id}/confirm`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
        showToast(lang === 'dr' ? 'سفارش تایید شد' : 'Order confirmed', 'success');
      } else {
        let errorMsg = 'Confirmation failed';
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch (e) {
          errorMsg = `Server error: ${res.status}`;
        }
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      showToast('Confirmation failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddExpense = async (expenseData: any) => {
    if (isSaving) return;

    const amountVal = parseFloat(toEnglishDigits(expenseData.amount));
    if (isNaN(amountVal) || amountVal <= 0) {
      showToast(lang === 'dr' ? 'لطفاً مبلغ معتبر وارد کنید' : 'Please enter a valid amount', 'error');
      return;
    }
    if (!expenseData.description.trim()) {
      showToast(lang === 'dr' ? 'لطفاً شرح مصرف را وارد کنید' : 'Please enter a description', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetchWithTimeout(`${API_URL}/api/ledger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...expenseData,
          amount: amountVal,
          type: 'EXPENSE'
        }),
      });

      if (res.ok) {
        fetchData(); // Refresh ledger data from server
        setNewExpense({ description: '', amount: '', department: 'GENERAL' });
        showToast(lang === 'dr' ? 'مصرف با موفقیت ثبت شد' : 'Expense saved successfully', 'success');
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || (lang === 'dr' ? 'خطا در ذخیره اطلاعات. لطفاً اتصال دیتابیس را بررسی کنید.' : 'Failed to save expense. Check DB connection.'), 'error');
      }
    } catch (error) {
      showToast(lang === 'dr' ? 'خطا در ارتباط با سرور' : 'Error connecting to server', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        ...newProduct,
        qty_per_carton: parseInt(toEnglishDigits(newProduct.qty_per_carton), 10) || 0,
        current_price: parseFloat(toEnglishDigits(newProduct.current_price)) || 0,
        stock_quantity: 0
      };

      const res = await fetchWithTimeout(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchData(); // Refresh products from server
        setIsAddProductModalOpen(false);
        setNewProduct({ name: '', category: '', size: '', qty_per_carton: '', current_price: '' });
        showToast(lang === 'dr' ? 'محصول با موفقیت ثبت شد' : 'Product added successfully', 'success');
      } else {
        const data = await res.json();
        showToast(getErrorMsg(data, 'Failed to add product'), 'error');
      }
    } catch (error: any) {
      showToast('Error connecting to server', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAttendance = async (employeeId: number, status: 'PRESENT' | 'ABSENT') => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetchWithTimeout(`${API_URL}/api/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ EmployeeId: employeeId, status, date: todayStr }),
      });
      if (res.ok) {
        fetchData();
        showToast(lang === 'dr' ? 'حاضری ثبت شد' : 'Attendance marked', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to mark attendance', 'error');
      }
    } catch (err) {
      showToast('Failed to mark attendance', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAttendance = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetchWithTimeout(`${API_URL}/api/attendance/quick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ date: todayStr }),
      });
      if (res.ok) {
        fetchData();
        showToast(lang === 'dr' ? 'تمام کارمندان حاضر شدند' : 'All employees marked present', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to mark quick attendance', 'error');
      }
    } catch (err) {
      showToast('Failed to mark quick attendance', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Login screen removed as requested by user

  const safeLedger = Array.isArray(ledger) ? ledger : [];
  const income = safeLedger.filter(l => l.type === 'INCOME').reduce((sum, l) => sum + (l.amount || 0), 0);
  const expenses = safeLedger.filter(l => l.type === 'EXPENSE').reduce((sum, l) => sum + (l.amount || 0), 0);
  const netProfit = income - expenses;

  // Process ledger data for BarChart (Current Week: Saturday to Friday)
  const processChartData = () => {
    const currentWeek: { name: string; income: number; expense: number; rawDate: Date }[] = [];
    const today = new Date();

    // Calculate the start of the week (Saturday)
    // getDay() returns 0 for Sunday, 1 for Monday... 6 for Saturday
    const dayOfWeek = today.getDay();
    const offset = (dayOfWeek + 1) % 7; // Days since last Saturday

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - offset);

    // Generate the 7 days of the current week (Saturday to Friday)
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = formatJalaliDateOnly(d.toISOString(), lang, true);
      const weekday = new Intl.DateTimeFormat(lang === 'dr' ? 'fa-AF' : lang === 'ps' ? 'ps-AF' : 'en-US', { weekday: 'long' }).format(d);
      currentWeek.push({
        name: `${weekday} (${dateStr})`,
        income: 0,
        expense: 0,
        rawDate: d
      });
    }

    // Fill in the expenses and income
    safeLedger.forEach(l => {
      const dateStr = formatJalaliDateOnly(l.date, lang, true);
      const dayEntry = currentWeek.find(d => d.name.includes(dateStr));
      if (dayEntry) {
        if (l.type === 'EXPENSE') {
          dayEntry.expense += l.amount;
        } else if (l.type === 'INCOME') {
          dayEntry.income += l.amount;
        }
      }
    });

    return currentWeek;
  };

  const chartData = processChartData();

  // Calculate today's expenses
  const todayStr = formatJalaliDateOnly(new Date().toISOString(), lang, true);
  const todayExpenses = safeLedger
    .filter(l => l.type === 'EXPENSE' && formatJalaliDateOnly(l.date, lang, true) === todayStr)
    .reduce((sum, l) => sum + (l.amount || 0), 0);
  const todayWeekday = new Intl.DateTimeFormat(lang === 'dr' ? 'fa-AF' : lang === 'ps' ? 'ps-AF' : 'en-US', { weekday: 'long' }).format(new Date());

  const chartColors = theme === 'dark' ? {
    text: '#94a3b8',
    grid: '#1e293b',
    tooltipBg: '#0f172a',
    tooltipText: '#f8fafc',
    bg: 'bg-slate-900/80',
    border: 'border-slate-800'
  } : {
    text: '#64748b',
    grid: '#f1f5f9',
    tooltipBg: '#ffffff',
    tooltipText: '#0f172a',
    bg: 'bg-white',
    border: 'border-gray-100'
  };

  const SidebarItem = ({ id, icon: Icon, label, hidden = false }: any) => {
    if (hidden) return null;
    return (
      <button
        onClick={() => {
          setActiveTab(id);
          setIsSidebarOpen(false); // Hide sidebar on mobile when an item is clicked
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          activeTab === id ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400'
        }`}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  if (!token) {
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 ${isRTL ? 'font-[Vazirmatn]' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="mx-auto w-16 h-16 bg-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-blue-600/30">
            SG
          </div>
          <h2 className="mt-6 text-center text-3xl font-black text-gray-900 dark:text-white">
            {lang === 'dr' ? 'ورود به سیستم مدیریت' : lang === 'ps' ? 'سیسټم ته ننوتل' : 'Sign in to Admin Panel'}
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-2xl shadow-blue-900/5 sm:rounded-3xl sm:px-10 border border-gray-100 dark:border-slate-800">
            <form className="space-y-6" onSubmit={handleLogin} onKeyDown={handleKeyboardNavigation}>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  {lang === 'dr' || lang === 'ps' ? 'نام کاربری' : 'Username'}
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={loginData.username}
                    onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-sans text-start"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  {lang === 'dr' || lang === 'ps' ? 'رمز عبور' : 'Password'}
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: magicDtoE(e.target.value)})}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-sans text-start"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                >
                  {lang === 'dr' ? 'ورود' : lang === 'ps' ? 'ننوتل' : 'Sign in'}
                </button>
              </div>
            </form>

            {toast && (
              <div className={`mt-4 p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${toast.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
                {toast.message}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-slate-950 flex ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl font-bold text-white flex items-center gap-2 animate-in fade-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[15] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`bg-white dark:bg-slate-900 border-e dark:border-slate-800 w-64 p-4 flex flex-col gap-6 fixed h-full z-20 transition-transform ${isSidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')} lg:relative lg:translate-x-0`}>
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-xl">SG</div>
          <h1 className="font-bold text-lg text-gray-800 dark:text-white tracking-tight">Sheen Ghazy</h1>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          <SidebarItem id="dashboard" icon={LayoutDashboard} label={t.dashboard} hidden={role === 'MANAGER' && !managerPermissions.dashboard} />
          <SidebarItem id="inventory" icon={Package} label={t.inventory} hidden={role === 'MANAGER' && !managerPermissions.inventory} />
          <SidebarItem id="production" icon={Factory} label={t.production} hidden={role === 'MANAGER' && !managerPermissions.production} />
          <SidebarItem id="orders" icon={ShoppingCart} label={t.orders} hidden={role === 'MANAGER' && !managerPermissions.orders} />
          <SidebarItem id="customers" icon={Users} label={t.customers} hidden={role === 'MANAGER' && !managerPermissions.customers} />
          <SidebarItem id="employees" icon={Briefcase} label={t.employees} hidden={role === 'MANAGER' && !managerPermissions.employees} />
          <SidebarItem id="ledger" icon={Wallet} label={t.ledger} hidden={role === 'MANAGER' && !managerPermissions.ledger} />
          <SidebarItem id="settings" icon={SettingsIcon} label={t.settings} hidden={role === 'MANAGER'} />
        </nav>

        <div className="border-t pt-4 space-y-2">
          <a
            href="/"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Globe size={20} />
            <span className="font-medium">{t.viewWebsite}</span>
          </a>
          <button
            onClick={() => { setToken(null); localStorage.removeItem('admin_token'); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <Header
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          t={t}
          dbStatus={dbStatus}
          notifications={notifications}
          fetchData={fetchData}
          theme={theme}
          setTheme={setTheme}
          lang={lang}
          setLang={setLang}
          role={role}
          isNotifOpen={isNotifOpen}
          setIsNotifOpen={setIsNotifOpen}
          notifRef={notifRef}
        />

        {/* Dashboard Content */}
        <div className="p-6 overflow-auto">
          {activeTab === 'dashboard' && role === 'CEO_SUPERADMIN' && (
            <Dashboard
              income={income}
              expenses={expenses}
              netProfit={netProfit}
              chartData={chartData}
              production={production}
              products={products}
              theme={theme}
              lang={lang}
              t={t}
            />
          )}

          {activeTab === 'inventory' && (
            <Inventory
              theme={theme}
              lang={lang}
            />
          )}

          {activeTab === 'orders' && (
            <Orders
              orders={orders}
              onConfirmOrder={handleConfirmOrder}
              onAddSale={() => setIsAddSaleModalOpen(true)}
              lang={lang}
              t={t}
              theme={theme}
            />
          )}

          {activeTab === 'ledger' && role === 'CEO_SUPERADMIN' && (
            <Ledger
              ledger={ledger}
              fetchData={fetchData}
              onAddExpense={async (expense) => {
                await handleAddExpense(expense);
              }}
              isSaving={isSaving}
              lang={lang}
              t={t}
              theme={theme}
              formatJalaliDateOnly={formatJalaliDateOnly}
              chartData={chartData}
              todayExpenses={todayExpenses}
              todayStr={todayStr}
              todayWeekday={todayWeekday}
            />
          )}

          {activeTab === 'customers' && (
            <Customers
              customers={customers}
              lang={lang}
              t={t}
              theme={theme}
            />
          )}

          {activeTab === 'employees' && (
            <Employees
              employees={employees}
              onAddEmployee={() => setIsAddEmployeeModalOpen(true)}
              onAttendance={handleAttendance}
              onQuickAttendance={handleQuickAttendance}
              onDeleteEmployee={handleDeleteEmployee}
              lang={lang}
              t={t}
              theme={theme}
            />
          )}

          {activeTab === 'production' && (
            <Production
              production={production}
              onAddProduction={() => setIsAddProductionModalOpen(true)}
              lang={lang}
              t={t}
              theme={theme}
              formatJalali={formatJalali}
            />
          )}

          {activeTab === 'settings' && role === 'CEO_SUPERADMIN' && (
            <Settings
              lang={lang}
              theme={theme}
            />
          )}
        </div>
      </main>

      {/* Add Employee Modal */}
      {isAddEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b dark:border-slate-800">
              <h3 className="font-bold text-xl text-gray-800 dark:text-white">{t.addEmployee}</h3>
              <button onClick={() => setIsAddEmployeeModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-6 space-y-4" onKeyDown={handleKeyboardNavigation}>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t.colName}</label>
                <input required type="text" value={newEmployee.full_name} onChange={e => setNewEmployee({...newEmployee, full_name: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ولد (Father Name)</label>
                  <input type="text" value={newEmployee.father_name} onChange={e => setNewEmployee({...newEmployee, father_name: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ولایت (Province)</label>
                  <input type="text" value={newEmployee.province} onChange={e => setNewEmployee({...newEmployee, province: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t.colPosition}</label>
                <input required type="text" value={newEmployee.position} onChange={e => setNewEmployee({...newEmployee, position: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t.colPhone}</label>
                <input type="text" value={newEmployee.phone} onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t.colSalary}</label>
                  <input required type="text" inputMode="decimal" value={newEmployee.salary} onChange={e => setNewEmployee({...newEmployee, salary: toEnglishDigits(e.target.value)})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ID دستگاه حاضری (ZKTeco)</label>
                  <input type="text" inputMode="numeric" value={newEmployee.zkteco_id} onChange={e => setNewEmployee({...newEmployee, zkteco_id: toEnglishDigits(e.target.value)})} placeholder="مثال: 2" className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" dir="ltr" />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={isSaving} className={`w-full text-white font-bold py-3 rounded-xl transition-all ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                  {isSaving ? (lang === 'dr' ? 'در حال ذخیره...' : 'Saving...') : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Production Modal */}
      {isAddProductionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b dark:border-slate-800">
              <h3 className="font-bold text-xl text-gray-800 dark:text-white">{lang === 'dr' ? 'ثبت تولید جدید' : 'Record Production'}</h3>
              <button onClick={() => setIsAddProductionModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddProduction} className="p-6 space-y-4" onKeyDown={handleKeyboardNavigation}>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">محصول (Product)</label>
                <select required value={newProduction.ProductId} onChange={e => setNewProduction({...newProduction, ProductId: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">انتخاب محصول...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.size}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">بخش (Department)</label>
                <select required value={newProduction.department} onChange={e => setNewProduction({...newProduction, department: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="PIPE">{t.deptPipe}</option>
                  <option value="LATHE">{t.deptLathe}</option>
                  <option value="THREADING">{t.deptThreading}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t.colQtyProduced}</label>
                <input required type="text" inputMode="numeric" value={newProduction.quantity_produced} onChange={e => setNewProduction({...newProduction, quantity_produced: toEnglishDigits(e.target.value)})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t.colRawMaterial}</label>
                <input required type="text" inputMode="decimal" value={newProduction.raw_material_used} onChange={e => setNewProduction({...newProduction, raw_material_used: toEnglishDigits(e.target.value)})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="pt-4">
                <button type="submit" disabled={isSaving} className={`w-full text-white font-bold py-3 rounded-xl transition-all ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700'}`}>
                  {isSaving ? (lang === 'dr' ? 'در حال ذخیره...' : 'Saving...') : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Direct Sale Modal */}
      {isAddSaleModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-3xl overflow-hidden border dark:border-slate-800 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center p-8 border-b dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
                  <ShoppingCart size={28} />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-gray-800 dark:text-white">{lang === 'dr' ? 'ثبت فروش مستقیم (فاکتور)' : 'Direct Sale (Invoice)'}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">صدور فاکتور رسمی و کسر هوشمند از موجودی گدام</p>
                </div>
              </div>
              <button onClick={() => setIsAddSaleModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-all group">
                <X size={24} className="text-gray-400 group-hover:text-red-500 transition-colors" />
              </button>
            </div>

            <form onSubmit={handleCreateDirectSale} className="p-8 space-y-6" onKeyDown={handleKeyboardNavigation}>
              <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest px-1">انتخاب مشتری (CRM)</label>
                  <select
                    required
                    value={newSale.CustomerId}
                    onChange={e => setNewSale({...newSale, CustomerId: e.target.value})}
                    className="w-full border-2 border-white dark:border-slate-800 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm shadow-sm"
                  >
                    <option value="">{lang === 'dr' ? 'انتخاب مشتری...' : 'Select Customer...'}</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name} — {c.whatsapp_number}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">تاریخ فاکتور</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{formatJalali(new Date().toISOString(), lang)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsAddSaleModalOpen(false); setActiveTab('customers'); }}
                    className="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-xs font-black border dark:border-slate-700 hover:shadow-md transition-all"
                  >
                    + {lang === 'dr' ? 'مشتری جدید' : 'New Customer'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-black text-gray-800 dark:text-white flex items-center gap-2">
                    <ShoppingBag size={18} className="text-blue-600" />
                    اقلام فاکتور
                  </h4>
                  <button
                    type="button"
                    onClick={() => setNewSale({...newSale, items: [...newSale.items, { ProductId: '', quantity: 1, unit_price: 0 }]})}
                    className="text-xs bg-emerald-600 text-white px-4 py-2 rounded-xl font-black hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <Plus size={14} />
                    {lang === 'dr' ? 'افزودن قلم' : 'Add Item'}
                  </button>
                </div>

                <div className="max-h-[350px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {newSale.items.map((item, index) => {
                    const selectedProd = products.find(p => p.id.toString() === item.ProductId);
                    const isOverStock = selectedProd && item.quantity > selectedProd.stock_quantity;

                    return (
                      <div key={index} className={`grid grid-cols-12 gap-4 items-end p-5 rounded-2xl border-2 transition-all ${isOverStock ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-800'}`}>
                        <div className="col-span-12 md:col-span-5 space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">محصول و سایز</label>
                          <select
                            required
                            value={item.ProductId}
                            onChange={e => {
                              const updatedItems = [...newSale.items];
                              updatedItems[index].ProductId = e.target.value;
                              const prod = products.find(p => p.id.toString() === e.target.value);
                              if (prod) updatedItems[index].unit_price = prod.current_price;
                              setNewSale({...newSale, items: updatedItems});
                            }}
                            className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                          >
                            <option value="">{lang === 'dr' ? 'انتخاب محصول...' : 'Select Product...'}</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name} — {p.size} (موجودی: {p.stock_quantity})</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-4 md:col-span-2 space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">تعداد</label>
                          <input
                            required
                            type="text"
                            inputMode="numeric"
                            value={item.quantity}
                            onChange={e => {
                              const updatedItems = [...newSale.items];
                              updatedItems[index].quantity = parseInt(toEnglishDigits(e.target.value)) || 0;
                              setNewSale({...newSale, items: updatedItems});
                            }}
                            className={`w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none font-bold ${isOverStock ? 'text-red-600' : ''}`}
                          />
                        </div>
                        <div className="col-span-5 md:col-span-3 space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">قیمت فی (AFN)</label>
                          <input
                            required
                            type="text"
                            inputMode="decimal"
                            value={item.unit_price}
                            onChange={e => {
                              const updatedItems = [...newSale.items];
                              updatedItems[index].unit_price = parseFloat(toEnglishDigits(e.target.value)) || 0;
                              setNewSale({...newSale, items: updatedItems});
                            }}
                            className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none font-black text-blue-600 dark:text-blue-400"
                          />
                        </div>
                        <div className="col-span-3 md:col-span-2 flex justify-end pb-1">
                          <button
                            type="button"
                            onClick={() => {
                              const updatedItems = newSale.items.filter((_, i) => i !== index);
                              setNewSale({...newSale, items: updatedItems});
                            }}
                            className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all"
                          >
                            <X size={20} />
                          </button>
                        </div>
                        {isOverStock && (
                          <div className="col-span-12 mt-2">
                            <p className="text-[10px] font-black text-red-500 flex items-center gap-1">
                              <XCircle size={12} />
                              موجودی کافی نیست! حداکثر موجودی: {selectedProd.stock_quantity}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-8 border-t dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="bg-gray-50 dark:bg-slate-800/50 px-8 py-4 rounded-[24px] border dark:border-slate-800 text-center md:text-start min-w-[250px]">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">مجموع قابل پرداخت</p>
                  <p className="text-4xl font-black text-blue-600 dark:text-blue-400">
                    {newSale.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString()} <span className="text-sm font-normal text-gray-500">AFN</span>
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full md:w-auto">
                  <button
                    type="submit"
                    disabled={newSale.items.some(item => {
                      const prod = products.find(p => p.id.toString() === item.ProductId);
                      return prod && item.quantity > prod.stock_quantity;
                    })}
                    className="bg-blue-600 text-white font-black rounded-2xl px-16 py-5 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {lang === 'dr' ? 'تایید و ثبت نهایی فاکتور' : 'Confirm & Finalize Invoice'}
                  </button>
                  <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-tighter">سیستم به صورت خودکار موجودی گدام را آپدیت می‌کند</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
