import React, { useState, useMemo } from 'react';
import {
  Search, Edit, Trash2, PlusCircle, AlertCircle,
  X, Check, Package, AlertTriangle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  category?: string;
  size: string;
  color: string;
  qty_per_carton?: number;
  current_price: number;
  stock_quantity: number;
  updated_at: string;
}

interface InventoryProps {
  theme: 'light' | 'dark';
  lang: 'dr' | 'ps' | 'en';
}

// Utility: Convert Persian/Arabic digits to English digits
const toEnglishDigits = (str: string | number): string => {
  if (str === null || str === undefined) return '';
  let result = str.toString();
  const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicNumbers  = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  for (let i = 0; i < 10; i++) {
    result = result.replace(persianNumbers[i], i.toString()).replace(arabicNumbers[i], i.toString());
  }
  return result;
};

// Utility: Format numbers with English digits only
const formatNumber = (val: number | string) => {
  const num = Number(val);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

export default function Inventory({ theme, lang }: InventoryProps) {
  // 1. Fetch Data
  const { data: products, isLoading, mutate } = useApi<Product[]>('/api/products');

  // 2. State Management
  const [searchTerm, setSearchTerm] = useState('');

  // Quick Edit State
  const [quickEditId, setQuickEditId] = useState<number | null>(null);
  const [quickEditData, setQuickEditData] = useState({ current_price: '', stock_quantity: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', size: '', color: '', current_price: '', stock_quantity: '', qty_per_carton: '', code: '', price: '', quantity: '' });
  const [isAdding, setIsAdding] = useState(false);

  // Delete Modal State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 3. Derived Data (Search & Filter)
  const safeProducts = Array.isArray(products) ? products : [];
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return safeProducts;
    const term = searchTerm.toLowerCase();
    return safeProducts.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.size.toLowerCase().includes(term) ||
      p.id.toString().includes(term)
    );
  }, [safeProducts, searchTerm]);

  // 4. Handlers
  const handleQuickEditStart = (product: Product) => {
    setQuickEditId(product.id);
    setQuickEditData({
      current_price: product.current_price.toString(),
      stock_quantity: product.stock_quantity.toString()
    });
  };

  const handleQuickEditSave = async (id: number) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

      const payload = {
        current_price: Number(toEnglishDigits(quickEditData.current_price)) || 0,
        stock_quantity: Number(toEnglishDigits(quickEditData.stock_quantity)) || 0
      };

      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        let errorMessage = 'Failed to update product';

        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = "Validation Error: " + errorData.detail.map((err: any) =>
              `'${err.loc[err.loc.length - 1]}' ${err.msg}`
            ).join(', ');
          } else {
            errorMessage = errorData.detail;
          }
        } else if (errorData.error) {
            errorMessage = errorData.error;
        }

        throw new Error(errorMessage);
      }

      await mutate(); // Refresh SWR cache instantly
      toast.success(lang === 'en' ? 'Product updated successfully' : 'محصول با موفقیت بروزرسانی شد');
      setQuickEditId(null);
    } catch (error: any) {
      console.error("Update Error:", error);
      toast.error(error.message || (lang === 'en' ? 'Error updating product' : 'خطا در بروزرسانی محصول'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const token = localStorage.getItem('admin_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

      const payload = {
        name: newProduct.name,
        product_code: newProduct.code || "N/A",
        category: newProduct.category || "عمومی",
        size: newProduct.size,
        color: newProduct.color || "-",
        qty_per_carton: Number(toEnglishDigits(newProduct.qty_per_carton)) || 0,
        current_price: Number(toEnglishDigits(newProduct.price)) || 0,
        stock_quantity: Number(toEnglishDigits(newProduct.quantity)) || 0
      };

      console.log("Sending Payload:", payload);

      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        let errorMessage = 'Failed to add product';

        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = "Validation Error: " + errorData.detail.map((err: any) =>
              `'${err.loc[err.loc.length - 1]}' ${err.msg}`
            ).join(', ');
          } else {
            errorMessage = errorData.detail;
          }
        } else if (errorData.error) {
            errorMessage = errorData.error;
        }

        throw new Error(errorMessage);
      }

      await mutate();
      toast.success(lang === 'en' ? 'Product added successfully' : 'محصول جدید با موفقیت اضافه شد');
      setIsAddOpen(false);
      setNewProduct({ name: '', category: '', size: '', color: '', current_price: '', stock_quantity: '', qty_per_carton: '', code: '', price: '', quantity: '' });
    } catch (error: any) {
      console.error("Save Error:", error);
      toast.error(error.message || (lang === 'en' ? 'Error adding product' : 'خطا در ثبت محصول'));
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/products/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to delete product');

      await mutate();
      toast.success(lang === 'en' ? 'Product deleted successfully' : 'محصول با موفقیت حذف شد');
      setDeleteId(null);
    } catch (error) {
      console.error(error);
      toast.error(lang === 'en' ? 'Error deleting product' : 'خطا در حذف محصول');
    } finally {
      setIsDeleting(false);
    }
  };

  // 5. UI Helpers
  const getStatusBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-200 dark:border-red-800/50">
          <AlertCircle size={12} />
          {lang === 'en' ? 'Out of Stock' : 'ناموجود'}
        </span>
      );
    }
    if (stock > 0 && stock <= 50) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-800/50">
          <AlertTriangle size={12} />
          {lang === 'en' ? 'Low Stock' : 'رو به اتمام'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800/50">
        <Check size={12} />
        {lang === 'en' ? 'In Stock' : 'موجود'}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
            <Package className="text-blue-500" />
            {lang === 'en' ? 'Inventory Management' : 'مدیریت گدام'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {lang === 'en' ? 'Real-time stock and pricing control' : 'کنترل زنده موجودی و قیمت‌گذاری اجناس'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 dark:bg-slate-800 dark:border-slate-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-all"
              placeholder={lang === 'en' ? 'Search by name or size...' : 'جستجو بر اساس نام یا سایز...'}
            />
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-blue-600/20"
          >
            <PlusCircle size={18} />
            {lang === 'en' ? 'Add Product' : 'ثبت جنس جدید'}
          </button>
        </div>
      </div>

      {/* Enterprise Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-start text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-800/50 dark:text-gray-300 border-b dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4 font-bold">ID</th>
                <th scope="col" className="px-6 py-4 font-bold">{lang === 'en' ? 'Product Name' : 'نام محصول'}</th>
                <th scope="col" className="px-6 py-4 font-bold">{lang === 'en' ? 'Size & Color' : 'مشخصات'}</th>
                <th scope="col" className="px-6 py-4 font-bold">{lang === 'en' ? 'Current Price' : 'قیمت فعلی'}</th>
                <th scope="col" className="px-6 py-4 font-bold">{lang === 'en' ? 'Stock' : 'موجودی گدام'}</th>
                <th scope="col" className="px-6 py-4 font-bold">{lang === 'en' ? 'Status' : 'وضعیت'}</th>
                <th scope="col" className="px-6 py-4 font-bold text-end">{lang === 'en' ? 'Actions' : 'عملیات'}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Loader2 className="animate-spin mb-2" size={24} />
                      <p>{lang === 'en' ? 'Loading inventory data...' : 'در حال بارگذاری اطلاعات گدام...'}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {lang === 'en' ? 'No products found.' : 'هیچ محصولی یافت نشد.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="bg-white border-b dark:bg-slate-900 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500" dir="ltr">
                      #{formatNumber(product.id)}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {product.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono" dir="ltr">{product.size}</span>
                        <span className="text-xs text-gray-500">{product.color}</span>
                      </div>
                    </td>

                    {/* Price Column (Quick Edit or Display) */}
                    <td className="px-6 py-4">
                      {quickEditId === product.id ? (
                        <div className="relative w-32" dir="ltr">
                          <input
                            type="text"
                            value={quickEditData.current_price}
                            onChange={(e) => setQuickEditData({...quickEditData, current_price: toEnglishDigits(e.target.value)})}
                            className="bg-white border border-blue-500 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 dark:bg-slate-950 dark:border-blue-500 dark:text-white font-mono"
                            placeholder="Price"
                          />
                          <span className="absolute inset-y-0 end-0 flex items-center pe-3 text-xs text-gray-400 pointer-events-none">AFN</span>
                        </div>
                      ) : (
                        <span className="font-black text-gray-900 dark:text-white" dir="ltr">
                          {formatNumber(product.current_price)} <span className="text-xs text-gray-500 font-normal">AFN</span>
                        </span>
                      )}
                    </td>

                    {/* Stock Column (Quick Edit or Display) */}
                    <td className="px-6 py-4">
                      {quickEditId === product.id ? (
                        <div className="w-24" dir="ltr">
                          <input
                            type="text"
                            value={quickEditData.stock_quantity}
                            onChange={(e) => setQuickEditData({...quickEditData, stock_quantity: toEnglishDigits(e.target.value)})}
                            className="bg-white border border-blue-500 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 dark:bg-slate-950 dark:border-blue-500 dark:text-white font-mono text-center"
                            placeholder="Qty"
                          />
                        </div>
                      ) : (
                        <span className="font-black text-gray-900 dark:text-white" dir="ltr">
                          {formatNumber(product.stock_quantity)}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {getStatusBadge(product.stock_quantity)}
                    </td>

                    <td className="px-6 py-4 text-end">
                      {quickEditId === product.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleQuickEditSave(product.id)}
                            disabled={isSaving}
                            className="p-1.5 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-lg transition-colors"
                            title={lang === 'en' ? 'Save' : 'ذخیره'}
                          >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                          </button>
                          <button
                            onClick={() => setQuickEditId(null)}
                            disabled={isSaving}
                            className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title={lang === 'en' ? 'Cancel' : 'انصراف'}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleQuickEditStart(product)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title={lang === 'en' ? 'Quick Edit' : 'ویرایش سریع'}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteId(product.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title={lang === 'en' ? 'Delete' : 'حذف'}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border dark:border-slate-800 w-full max-w-lg overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b dark:border-slate-800">
                <h3 className="text-xl font-black text-gray-800 dark:text-white">
                  {lang === 'en' ? 'Add New Product' : 'ثبت محصول جدید'}
                </h3>
                <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddSave} className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-bold text-gray-900 dark:text-white">
                      {lang === 'en' ? 'Product Name' : 'نام محصول'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-bold text-gray-900 dark:text-white">
                      {lang === 'en' ? 'Product Code' : 'کد محصول'}
                    </label>
                    <input
                      type="text"
                      value={newProduct.code}
                      onChange={e => setNewProduct({...newProduct, code: e.target.value})}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-bold text-gray-900 dark:text-white">
                      {lang === 'en' ? 'Category' : 'دسته‌بندی'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newProduct.category}
                      onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-bold text-gray-900 dark:text-white">
                      {lang === 'en' ? 'Size' : 'سایز'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newProduct.size}
                      onChange={e => setNewProduct({...newProduct, size: toEnglishDigits(e.target.value)})}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-bold text-gray-900 dark:text-white">
                      {lang === 'en' ? 'Color' : 'رنگ'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newProduct.color}
                      onChange={e => setNewProduct({...newProduct, color: e.target.value})}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-bold text-gray-900 dark:text-white">
                      {lang === 'en' ? 'Price (AFN)' : 'قیمت (افغانی)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newProduct.price}
                      onChange={e => setNewProduct({...newProduct, price: toEnglishDigits(e.target.value)})}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-bold text-gray-900 dark:text-white">
                      {lang === 'en' ? 'Initial Stock' : 'موجودی اولیه'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newProduct.quantity}
                      onChange={e => setNewProduct({...newProduct, quantity: toEnglishDigits(e.target.value)})}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-bold text-gray-900 dark:text-white">
                      {lang === 'en' ? 'Qty / Carton' : 'تعداد در کارتن'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newProduct.qty_per_carton}
                      onChange={e => setNewProduct({...newProduct, qty_per_carton: toEnglishDigits(e.target.value)})}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    {lang === 'en' ? 'Cancel' : 'انصراف'}
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-70"
                  >
                    {isAdding ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    {lang === 'en' ? 'Save Product' : 'ثبت محصول'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border dark:border-slate-800 w-full max-w-sm overflow-hidden p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2">
                {lang === 'en' ? 'Are you sure?' : 'آیا مطمئن هستید؟'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                {lang === 'en'
                  ? 'This action cannot be undone. This will permanently delete the product from the database.'
                  : 'این عملیات غیرقابل بازگشت است. محصول برای همیشه از دیتابیس حذف خواهد شد.'}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={isDeleting}
                  className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 rounded-xl transition-colors w-full"
                >
                  {lang === 'en' ? 'Cancel' : 'انصراف'}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors w-full disabled:opacity-70"
                >
                  {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  {lang === 'en' ? 'Delete' : 'حذف'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
