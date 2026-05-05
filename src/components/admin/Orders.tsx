import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Search,
  X,
  FileText,
  Clock,
  ShoppingBag,
  Printer,
  Pencil
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApi } from '../../hooks/useApi';
import InvoiceBuilder from './InvoiceBuilder';

// ==========================================
// 1. Utilities
// ==========================================

const toEnglishDigits = (str: string) => {
  if (!str) return '';
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.toString().replace(/[۰-۹]/g, (w) => persianNumbers.indexOf(w).toString());
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fa-AF').format(amount) + ' ؋';
};

import { API_URL } from '../../config';

// ==========================================
// 2. Main Component: Orders Module
// ==========================================

interface OrdersProps {
  orders?: any[]; // Kept for compatibility, but we fetch our own
  onConfirmOrder?: (orderId: number) => Promise<void>;
  onAddSale?: () => void;
  lang: 'dr' | 'ps' | 'en';
  t: any;
  theme: 'light' | 'dark';
  initialSearchTerm?: string;
}

export default function Orders({ lang, t, theme, initialSearchTerm = '' }: OrdersProps) {
  // Fetching Relational Data
  const { data: orders, mutate: mutateOrders, isLoading: loadingOrders } = useApi<any[]>('/api/orders');
  const { data: customers } = useApi<any[]>('/api/customers');
  const { data: products } = useApi<any[]>('/api/products');

  const [isCreating, setIsCreating] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  const handleCreateOrder = async (payload: any) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('admin_token');

      let url = `${API_URL}/api/orders/direct`;
      let method = 'POST';

      if (editingOrder) {
         url = `${API_URL}/api/orders/${editingOrder.id}`;
         method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'خطا در ثبت سفارش');
      }

      toast.success(editingOrder ? 'بیل با موفقیت ویرایش شد' : 'بیل با موفقیت ثبت شد');
      setIsCreating(false);
      setEditingOrder(null);
      mutateOrders();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!confirmingOrderId) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/orders/${confirmingOrderId}/confirm`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'خطا در تایید سفارش');
      }

      toast.success('بیل تایید شد. سیستم با موفقیت تنظیم گردید.');
      setConfirmingOrderId(null);
      mutateOrders();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = orders?.filter(o => {
    const searchStr = searchTerm.toLowerCase();
    return o.Customer?.full_name?.toLowerCase().includes(searchStr) || o.id.toString().includes(searchStr);
  }) || [];

  if (isCreating || editingOrder) {
    return (
      <InvoiceBuilder
        customers={customers || []}
        products={products || []}
        onSave={handleCreateOrder}
        onCancel={() => { setIsCreating(false); setEditingOrder(null); }}
        lang={lang}
        initialData={editingOrder}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-3">
            <ShoppingCart className="text-blue-600" size={28} />
            {lang === 'dr' ? 'مدیریت فروشات و مستردات' : 'Sales & Invoices'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">سیستم پیشرفته صدور بیل، مستردات، مدیریت طلبات مشتریان، ویرایش بل‌ها.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={20} />
          صدور بیل جدید (فروش / مستردات)
        </button>
      </div>

      {/* Order Creation Form is handled by InvoiceBuilder above when isCreating is true */}

      {/* Orders Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="text-gray-500" size={24} />
            لیست بیل‌های سیستم
          </h2>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="جستجوی شماره بیل یا نام مشتری..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4 pr-10 py-2 border dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-400 text-sm">
              <tr>
                <th className="p-4 font-bold">شماره بیل</th>
                <th className="p-4 font-bold">نوعیت</th>
                <th className="p-4 font-bold">مشتری</th>
                <th className="p-4 font-bold">مبلغ کل</th>
                <th className="p-4 font-bold">تاریخ ثبت</th>
                <th className="p-4 font-bold">وضعیت</th>
                <th className="p-4 font-bold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {loadingOrders ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">در حال بارگذاری اطلاعات...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">هیچ سفارشی یافت نشد.</td></tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono text-gray-600 dark:text-gray-300">INV-{order.id.toString().padStart(4, '0')}</td>
                    <td className="p-4 font-bold">
                      {order.order_type === 'RETURN' ? (
                        <span className="text-red-500 bg-red-50 dark:bg-red-900/40 px-2 py-1 rounded text-xs select-none">مستردات</span>
                      ) : (
                        <span className="text-blue-500 bg-blue-50 dark:bg-blue-900/40 px-2 py-1 rounded text-xs select-none">فروش</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-gray-800 dark:text-white">{order.Customer?.full_name || 'مشتری نامشخص'}</td>
                    <td className="p-4 font-bold text-gray-800 dark:text-white" dir="ltr">{formatCurrency(order.total_amount)}</td>
                    <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">
                      {new Date(order.date || order.createdAt).toLocaleDateString('fa-AF')}
                    </td>
                    <td className="p-4">
                      {order.status === 'COMPLETED' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                          <CheckCircle size={14} /> تکمیل شده
                        </span>
                      )}
                      {order.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                          <Clock size={14} /> در انتظار تایید
                        </span>
                      )}
                      {order.status === 'CANCELLED' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold">
                          <X size={14} /> لغو شده
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          if (!printWindow) return toast.error('مرورگر شما اجازه باز شدن صفحه جدید را نداد.');
                          const isReturn = order.order_type === 'RETURN';
                          const themeColor = isReturn ? '#ef4444' : '#1e40af';
                          const themeBg = isReturn ? '#fef2f2' : '#eff6ff';
                          const docTitle = isReturn ? 'بیل مستردات' : 'بیل فروش';

                          printWindow.document.write(`
                            <html dir="rtl" lang="fa">
                              <head>
                                <title>${docTitle} #${order.id}</title>
                                <style>
                                  @page { size: A4 portrait; margin: 0; }
                                  body { font-family: Tahoma, Arial, sans-serif; padding: 40px; margin: 0; background: #fff; }
                                  .bill-container { max-width: 800px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px; }
                                  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid ${themeColor}; padding-bottom: 15px; margin-bottom: 25px; }
                                  .title { font-size: 26px; font-weight: 900; color: ${themeColor}; margin: 0 0 5px 0; }
                                  .badge { display: inline-block; background: ${themeColor}; color: white; padding: 6px 16px; border-radius: 4px; font-weight: bold; font-size: 18px; margin-bottom: 20px; }
                                  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 14px; }
                                  .info-box { background: ${themeBg}; padding: 15px; border-radius: 6px; border: 1px solid ${themeColor}33; }
                                  .info-box div { margin-bottom: 8px; }
                                  .info-box div:last-child { margin-bottom: 0; }
                                  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
                                  .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: center; }
                                  .items-table th { background-color: ${themeColor}; color: white; font-weight: bold; }
                                  .items-table tr:nth-child(even) { background-color: #f9f9f9; }
                                  .footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 20px; }
                                  .total-box { border: 2px solid ${themeColor}; border-radius: 8px; padding: 15px; text-align: left; }
                                  .total-box div { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 16px; font-weight: bold; }
                                  .total-box .grand { font-size: 20px; color: ${themeColor}; border-top: 1px solid #eee; padding-top: 8px; margin-top: 8px; }
                                  .signatures { display: flex; justify-content: space-between; margin-top: 50px; font-size: 12px; color: #555; text-align: center; }
                                  .sig-line { width: 150px; border-top: 1px dashed #999; padding-top: 8px; }
                                  .print-btn { display: none; }
                                </style>
                              </head>
                              <body>
                                <div class="bill-container">
                                  <div class="header">
                                    <div>
                                      <h1 class="title">شرکت تولیدی شین غزی بابا</h1>
                                      <p style="margin:0; font-size: 13px; color: #666; font-weight: bold;">تولید کننده انواع لوله و اتصالات PPRC و PVC</p>
                                      <p style="margin:5px 0 0 0; font-size: 12px; color: #888;">آدرس: شهرک صنعتی، کابل | تلفن: ۰۷۰۱۱۱۱۱۱</p>
                                    </div>
                                    <div style="text-align: left;">
                                      <div class="badge">${docTitle}</div>
                                    </div>
                                  </div>

                                  <div class="info-grid">
                                    <div class="info-box">
                                      <div><strong>اسم مشتری:</strong> ${order.Customer?.full_name || 'مشتری نقدی'}</div>
                                    </div>
                                    <div class="info-box" style="text-align: left;">
                                      <div><strong>شماره بیل:</strong> <span style="font-family: monospace; font-size: 16px;">#${order.id.toString().padStart(4, '0')}</span></div>
                                      <div><strong>تاریخ:</strong> ${new Date(order.date || order.createdAt).toLocaleDateString('fa-AF')}</div>
                                    </div>
                                  </div>

                                  <table class="items-table">
                                    <thead>
                                      <tr>
                                        <th style="width: 50px;">شماره</th>
                                        <th style="text-align: right;">تفصیل جنس</th>
                                        <th style="width: 80px;">تعداد</th>
                                        <th style="width: 120px;">قیمت یک دانه</th>
                                        <th style="width: 80px;">تخفیف %</th>
                                        <th style="width: 140px;">مجموعه</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      ${order.items?.map((item: any, i: number) => {
                                        const total = item.quantity * item.unit_price;
                                        const discountAmt = total * ((item.discount || 0) / 100);
                                        const cTotal = total - discountAmt;
                                        return `
                                        <tr>
                                          <td style="color: #666; font-weight: bold;">${i + 1}</td>
                                          <td style="text-align: right; font-weight: bold;">${item.Product?.name || 'کالا'} ${item.Product?.size ? `(${item.Product.size})` : ''}</td>
                                          <td style="font-family: monospace; font-size: 15px; font-weight: bold;">${item.quantity}</td>
                                          <td style="font-family: monospace;">${item.unit_price.toLocaleString()}</td>
                                          <td style="font-family: monospace; color: red;">${item.discount || 0}%</td>
                                          <td style="font-family: monospace; font-weight: bold; font-size: 15px;">${cTotal.toLocaleString()}</td>
                                        </tr>
                                      `}).join('') || '<tr><td colspan="6">اقلام در دسترس نیست</td></tr>'}
                                    </tbody>
                                  </table>

                                  <div class="footer-grid">
                                    <div>
                                      <!-- notes area -->
                                    </div>
                                    <div class="total-box">
                                      <div class="grand">
                                        <span>مجموعه کل:</span>
                                        <span dir="ltr">${formatCurrency(order.total_amount)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div class="signatures">
                                    <div class="sig-line">امضا تحویل دهنده</div>
                                    <div class="sig-line">امضا خریدار</div>
                                  </div>
                                </div>
                                <script>
                                  window.onload = function() { window.print(); window.close(); }
                                </script>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }}
                        className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                        title="چاپ بیل A4"
                      >
                        <Printer size={18} />
                      </button>

                      <button
                        onClick={() => setEditingOrder(order)}
                        className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                        title="ویرایش بیل"
                      >
                        <Pencil size={18} />
                      </button>

                      {order.status === 'PENDING' ? (
                        <button
                          onClick={() => setConfirmingOrderId(order.id)}
                          className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                          تایید و تکمیل
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">تکمیل شده</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmingOrderId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 border dark:border-slate-800">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-2">تایید نهایی بیل</h3>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-6 leading-relaxed bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30">
              <strong className="text-amber-800 dark:text-amber-500 block mb-1">هشدار سیستم:</strong>
              با تایید این بیل، موجودی گدام به‌روزرسانی شده و حسابات روزنامچه/مشتری تنظیم خواهد شد. آیا مطمئن هستید؟
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingOrderId(null)}
                disabled={isSubmitting}
                className="flex-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {isSubmitting ? 'در حال پردازش...' : 'بله، تایید شود'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
