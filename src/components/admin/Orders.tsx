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
  ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApi } from '../../hooks/useApi';

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
}

export default function Orders({ lang, t, theme }: OrdersProps) {
  // Fetching Relational Data
  const { data: orders, mutate: mutateOrders, isLoading: loadingOrders } = useApi<any[]>('/api/orders');
  const { data: customers } = useApi<any[]>('/api/customers');
  const { data: products } = useApi<any[]>('/api/products');

  const [isCreating, setIsCreating] = useState(false);
  const [confirmingOrderId, setConfirmingOrderId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [orderItems, setOrderItems] = useState<Array<{ productId: string, quantity: string, unitPrice: number, maxStock: number, name: string }>>([]);

  const grandTotal = useMemo(() => {
    return orderItems.reduce((total, item) => {
      const qty = parseInt(toEnglishDigits(item.quantity) || '0', 10);
      return total + (qty * (item.unitPrice || 0));
    }, 0);
  }, [orderItems]);

  const handleAddItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: '1', unitPrice: 0, maxStock: 0, name: '' }]);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products?.find(p => p.id.toString() === productId);
    const newItems = [...orderItems];
    if (product) {
      newItems[index] = {
        ...newItems[index],
        productId,
        unitPrice: product.current_price,
        maxStock: product.stock_quantity,
        name: product.name
      };
    } else {
      newItems[index] = { productId: '', quantity: '1', unitPrice: 0, maxStock: 0, name: '' };
    }
    setOrderItems(newItems);
  };

  const handleQuantityChange = (index: number, value: string) => {
    const englishValue = toEnglishDigits(value);
    const qty = parseInt(englishValue || '0', 10);
    const newItems = [...orderItems];

    if (qty > newItems[index].maxStock) {
      toast.error(`موجودی ناکافی! حداکثر موجودی: ${newItems[index].maxStock}`);
      newItems[index].quantity = newItems[index].maxStock.toString();
    } else {
      newItems[index].quantity = englishValue;
    }
    setOrderItems(newItems);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return toast.error('لطفاً یک مشتری انتخاب کنید');
    if (orderItems.length === 0 || !orderItems[0].productId) return toast.error('حداقل یک محصول باید انتخاب شود');

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('admin_token');
      const payload = {
        CustomerId: parseInt(selectedCustomerId, 10),
        items: orderItems.map(item => ({
          ProductId: parseInt(item.productId, 10),
          quantity: parseInt(toEnglishDigits(item.quantity), 10),
          unit_price: item.unitPrice
        }))
      };

      const res = await fetch(`${API_URL}/api/orders/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('خطا در ثبت سفارش');

      toast.success('سفارش با موفقیت ثبت شد');
      setIsCreating(false);
      setOrderItems([]);
      setSelectedCustomerId('');
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

      toast.success('سفارش تایید شد. موجودی کسر و به روزنامچه اضافه گردید.');
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-3">
            <ShoppingCart className="text-blue-600" size={28} />
            {lang === 'dr' ? 'مدیریت فروشات و سفارشات' : 'Sales & Orders'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">سیستم یکپارچه فروش، متصل به گدام و حسابداری</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={20} />
          ثبت سفارش جدید
        </button>
      </div>

      {/* Order Creation Form */}
      {isCreating && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-6 mb-8 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6 border-b dark:border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">فاکتور فروش جدید</h2>
            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleCreateOrder} className="space-y-6">
            {/* Customer Selection */}
            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border dark:border-slate-700">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">انتخاب مشتری (از سیستم CRM)</label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full md:w-1/2 border dark:border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white"
              >
                <option value="">-- جستجو و انتخاب مشتری --</option>
                {customers?.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name} ({c.whatsapp_number})</option>
                ))}
              </select>
            </div>

            {/* Products Selection */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">اقلام فاکتور</label>
                <button type="button" onClick={handleAddItem} className="text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center gap-1 hover:text-blue-800">
                  <Plus size={16} /> افزودن جنس دیگر
                </button>
              </div>

              <div className="space-y-3">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-end bg-white dark:bg-slate-900 p-3 rounded-xl border dark:border-slate-700 shadow-sm">
                    <div className="w-full md:w-2/5">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">جنس (از گدام)</label>
                      <select
                        required
                        value={item.productId}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        className="w-full border dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">انتخاب کنید...</option>
                        {products?.map(p => (
                          <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                            {p.name} - {p.size} {p.stock_quantity <= 0 ? '(ناموجود)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-1/3 md:w-1/6">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">موجودی فعلی</label>
                      <input type="text" readOnly value={item.maxStock || 0} className="w-full bg-gray-100 dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2 text-center text-gray-600 dark:text-gray-300" />
                    </div>

                    <div className="w-1/3 md:w-1/6">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">تعداد</label>
                      <input
                        required
                        type="text"
                        inputMode="numeric"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className="w-full border dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="w-1/3 md:w-1/6">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">قیمت فی دانه</label>
                      <input type="text" readOnly value={formatCurrency(item.unitPrice)} className="w-full bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2 text-center text-gray-600 dark:text-gray-300" dir="ltr" />
                    </div>

                    <div className="w-full md:w-auto flex justify-end">
                      <button type="button" onClick={() => setOrderItems(orderItems.filter((_, i) => i !== index))} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer & Total */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-gray-800 dark:bg-slate-800 text-white p-6 rounded-xl mt-6">
              <div className="text-lg mb-4 md:mb-0">
                مجموع کل فاکتور: <span className="text-2xl font-bold text-emerald-400 mr-2" dir="ltr">{formatCurrency(grandTotal)}</span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || orderItems.length === 0}
                className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? 'در حال ثبت...' : 'ثبت نهایی و صدور فاکتور'}
                <CheckCircle size={20} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Orders Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="text-gray-500" size={24} />
            لیست سفارشات سیستم
          </h2>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="جستجوی فاکتور..."
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
                <th className="p-4 font-bold">شماره فاکتور</th>
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
                    <td className="p-4 text-center">
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
            <h3 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-2">تایید نهایی سفارش</h3>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-6 leading-relaxed bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30">
              <strong className="text-amber-800 dark:text-amber-500 block mb-1">هشدار سیستم:</strong>
              با تایید این سفارش، موجودی از گدام کم شده و پول به روزنامچه اضافه خواهد شد. آیا مطمئن هستید؟
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
