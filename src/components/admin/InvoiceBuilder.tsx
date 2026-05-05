import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, Printer, ArrowRight, Upload } from 'lucide-react';
import { toEnglishDigits } from '../../utils/magicUx';
import toast from 'react-hot-toast';

interface InvoiceBuilderProps {
  customers: any[];
  products: any[];
  onSave: (payload: any) => Promise<void>;
  onCancel: () => void;
  lang: 'dr' | 'ps' | 'en';
  initialData?: any;
}

export default function InvoiceBuilder({ customers, products, onSave, onCancel, lang, initialData }: InvoiceBuilderProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialData?.CustomerId?.toString() || '');
  const [customerName, setCustomerName] = useState(initialData?.CustomerName || '');
  const [exchangeRate, setExchangeRate] = useState('72'); // Default AFN/USD
  const [currency, setCurrency] = useState<'AFN' | 'USD'>('AFN');
  const [orderType, setOrderType] = useState<'SALE' | 'RETURN'>(initialData?.order_type || 'SALE');
  const [printTheme, setPrintTheme] = useState<'COLOR' | 'BW'>('BW');

  const [items, setItems] = useState<Array<{ productId: string, name: string, quantity: string, unitPrice: string, maxStock: number, discount: string }>>(
    initialData?.items?.length ?
      initialData.items.map((i: any) => ({
        productId: i.ProductId?.toString() || '',
        name: i.Product?.name || '',
        quantity: i.quantity?.toString() || '1',
        unitPrice: i.unit_price?.toString() || '0',
        discount: i.discount?.toString() || '0',
        maxStock: 0
      })) :
      [{ productId: '', name: '', quantity: '1', unitPrice: '', maxStock: 0, discount: '0' }]
  );

  const [receivedAmount, setReceivedAmount] = useState(initialData?.received_amount?.toString() || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [logo, setLogo] = useState<string | null>(null);

  // Focus management
  const itemRefs = useRef<Array<{
    product: HTMLInputElement | null;
    quantity: HTMLInputElement | null;
    price: HTMLInputElement | null;
    discount: HTMLInputElement | null;
  }>>([{ product: null, quantity: null, price: null, discount: null }]);

  useEffect(() => {
    const savedLogo = localStorage.getItem('company_logo');
    if (savedLogo) setLogo(savedLogo);
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogo(base64);
        localStorage.setItem('company_logo', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const ensureRefs = (index: number) => {
    while (itemRefs.current.length <= index) {
      itemRefs.current.push({ product: null, quantity: null, price: null, discount: null });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, field: 'product' | 'quantity' | 'price' | 'discount') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ensureRefs(index);

      if (field === 'product') {
        itemRefs.current[index]?.quantity?.focus();
        itemRefs.current[index]?.quantity?.select();
      } else if (field === 'quantity') {
        itemRefs.current[index]?.price?.focus();
        itemRefs.current[index]?.price?.select();
      } else if (field === 'price') {
        itemRefs.current[index]?.discount?.focus();
        itemRefs.current[index]?.discount?.select();
      } else if (field === 'discount') {
        // If last item, add new
        if (index === items.length - 1) {
          setItems([...items, { productId: '', name: '', quantity: '1', unitPrice: '', maxStock: 0, discount: '0' }]);
          setTimeout(() => {
            ensureRefs(index + 1);
            itemRefs.current[index + 1]?.product?.focus();
          }, 50);
        } else {
          itemRefs.current[index + 1]?.product?.focus();
        }
      }
    }
  };

  // Auto-fill price when product selected
  const handleProductSelect = (index: number, productId: string) => {
    const product = products?.find(p => p.id.toString() === productId);
    const newItems = [...items];
    if (product) {
      newItems[index] = {
        ...newItems[index],
        productId,
        unitPrice: product.current_price.toString(),
        maxStock: product.stock_quantity,
        name: product.name
      };
    } else {
      newItems[index] = { productId: '', name: '', quantity: '1', unitPrice: '', maxStock: 0, discount: '0' };
    }
    setItems(newItems);
  };


  const calculateItemTotal = (item: any) => {
    const qty = parseFloat(toEnglishDigits(item.quantity) || '0');
    const price = parseFloat(toEnglishDigits(item.unitPrice) || '0');
    const discount = parseFloat(toEnglishDigits(item.discount) || '0');
    const total = qty * price;
    return total - (total * (discount / 100));
  };

  const grandTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  }, [items]);

  const totalDiscount = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(toEnglishDigits(item.quantity) || '0');
      const price = parseFloat(toEnglishDigits(item.unitPrice) || '0');
      const discount = parseFloat(toEnglishDigits(item.discount) || '0');
      const total = qty * price;
      return sum + (total * (discount / 100));
    }, 0);
  }, [items]);

  const remainingBalance = grandTotal - parseFloat(toEnglishDigits(receivedAmount) || '0');

  const handlePrint = () => {
    window.print();
  };

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const submitFinal = async (password?: string) => {
    if (!selectedCustomerId && !customerName.trim()) return toast.error('مشتری را انتخاب نمایید');

    // Check if there's any typed item that is not actually selected from the dropdown
    const invalidItems = items.filter(i => i.name.trim() && !i.productId);
    if (invalidItems.length > 0) {
      return toast.error('لطفا اجناس را دقیقا از لیست کشویی (Dropdown) انتخاب کنید. جنس وارد شده نامعتبر است.');
    }

    if (!items.some(i => i.productId)) return toast.error('حداقل یک جنس باید انتخاب شود');

    const payload = {
      CustomerId: selectedCustomerId ? parseInt(selectedCustomerId, 10) : undefined,
      CustomerName: !selectedCustomerId ? customerName : undefined,
      notes,
      received_amount: parseFloat(toEnglishDigits(receivedAmount) || '0'),
      order_type: orderType,
      admin_password: password,
      items: items.filter(i => i.productId).map(item => ({
        ProductId: parseInt(item.productId, 10),
        quantity: parseInt(toEnglishDigits(item.quantity), 10),
        unit_price: parseFloat(toEnglishDigits(item.unitPrice)),
        discount: parseFloat(toEnglishDigits(item.discount))
      }))
    };
    await onSave(payload);
    setShowPasswordDialog(false);
  };

  const handleSave = () => {
    // If it's an edit (initialData exists), require boss password
    const isAdmin = typeof window !== 'undefined' && localStorage.getItem('admin_role') === 'ADMIN';
    if (initialData && !isAdmin) {
      setShowPasswordDialog(true);
    } else {
      submitFinal();
    }
  };

  return (
    <>
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2 text-center">تاییدیه مقام صلاحیت‌دار</h3>
            <p className="text-sm text-center text-gray-500 mb-6 font-bold">برای ویرایش بیل (مستردات)، لطفاً رمز عبور رییس شرکت را وارد کنید.</p>
            <input
              type="password"
              placeholder="رمز عبور..."
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full bg-gray-100 dark:bg-slate-800 p-3 rounded-xl mb-4 outline-none text-center font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={() => submitFinal(adminPassword)}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700"
              >
                تایید و ویرایش
              </button>
              <button
                onClick={() => setShowPasswordDialog(false)}
                className="flex-1 bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-300"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    <div className="flex flex-col xl:flex-row gap-6 bg-gray-50 dark:bg-slate-950 min-h-screen p-4 xl:p-8 animate-in fade-in">

      {/* Right Side: Data Entry Form */}
      <div className="w-full xl:w-[400px] flex-shrink-0 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border dark:border-slate-800 flex flex-col print:hidden">
        <div className={`rounded-t-3xl p-4 flex justify-between items-center text-white ${orderType === 'RETURN' ? 'bg-red-600' : 'bg-blue-600'}`}>
          <h2 className="font-black text-lg">{orderType === 'SALE' ? 'بیل فروش' : 'بیل مستردات'}</h2>
          <button onClick={onCancel} className="hover:bg-white/20 p-2 rounded-xl transition-colors">
            <ArrowRight size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Toggles */}
          <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border dark:border-slate-700">
             <div className="flex space-x-1 space-x-reverse bg-gray-200 dark:bg-slate-900 mx-auto rounded-lg p-1 w-full max-w-xs">
                <button
                  onClick={() => setOrderType('SALE')}
                  className={`flex-1 py-1 px-3 text-sm font-bold rounded-md transition-colors ${orderType === 'SALE' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white dark:hover:bg-slate-800'}`}
                >فروش</button>
                <button
                  onClick={() => setOrderType('RETURN')}
                  className={`flex-1 py-1 px-3 text-sm font-bold rounded-md transition-colors ${orderType === 'RETURN' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white dark:hover:bg-slate-800'}`}
                >مستردات</button>
             </div>
          </div>
          <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border dark:border-slate-700 mt-2">
             <div className="flex space-x-1 space-x-reverse bg-gray-200 dark:bg-slate-900 mx-auto rounded-lg p-1 w-full max-w-xs">
                <button
                  onClick={() => setPrintTheme('COLOR')}
                  className={`flex-1 py-1 px-3 text-sm font-bold rounded-md transition-colors ${printTheme === 'COLOR' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white dark:hover:bg-slate-800'}`}
                >بیل پروژه‌ای (رنگی)</button>
                <button
                  onClick={() => setPrintTheme('BW')}
                  className={`flex-1 py-1 px-3 text-sm font-bold rounded-md transition-colors ${printTheme === 'BW' ? 'bg-white text-gray-800 shadow-sm border border-gray-300 dark:bg-slate-700 dark:text-white dark:border-slate-600' : 'text-gray-500 hover:text-gray-700 hover:bg-white dark:hover:bg-slate-800'}`}
                >بیل عادی (سیاه و سفید)</button>
             </div>
          </div>

          {/* Customer */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">مشتری را جستجو یا تایپ نمایید</label>
            <input
              list="customer-list"
              placeholder="جستجو یا وارد کردن نام مشتری..."
              value={customers?.find(c => c.id.toString() === selectedCustomerId)?.full_name || customerName}
              onChange={e => {
                const c = customers?.find(c => c.full_name === e.target.value || c.id.toString() === e.target.value);
                if (c) {
                  setSelectedCustomerId(c.id.toString());
                  setCustomerName(c.full_name);
                } else {
                  setSelectedCustomerId('');
                  setCustomerName(e.target.value);
                }
              }}
              className="w-full border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
            <datalist id="customer-list">
              {customers?.map(c => (
                <option key={c.id} value={c.full_name}>{c.company_name || 'بدون شرکت'} ({c.whatsapp_number})</option>
              ))}
            </datalist>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">واحد پولی</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as 'AFN' | 'USD')}
                className="w-full border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
              >
                <option value="AFN">افغانی (AFN)</option>
                <option value="USD">دالر (USD)</option>
              </select>
            </div>
            {currency === 'USD' && (
              <div className="flex-1 space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">نرخ تبادله</label>
                <input
                  type="text"
                  value={exchangeRate}
                  onChange={e => setExchangeRate(toEnglishDigits(e.target.value))}
                  className="w-full border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-center"
                />
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-4 pt-4 border-t dark:border-slate-800">
            {items.map((item, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl space-y-4 relative group border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-all">
                {items.length > 1 && (
                  <button onClick={() => setItems(items.filter((_, i) => i !== index))} className="absolute -top-3 -right-3 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
                    <Trash2 size={16} />
                  </button>
                )}

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">جنس را انتخاب نمایید (با جستجو)</label>
                  <input
                    ref={el => { ensureRefs(index); itemRefs.current[index].product = el; }}
                    onKeyDown={e => handleKeyDown(e, index, 'product')}
                    list="product-list"
                    placeholder="جستجو یا انتخاب جنس..."
                    value={products?.find(p => p.id.toString() === item.productId)?.name || item.name}
                    onChange={e => {
                      const p = products?.find(p => p.name === e.target.value || p.id.toString() === e.target.value);
                      if (p) {
                         handleProductSelect(index, p.id.toString());
                      } else {
                         const newItems = [...items];
                         newItems[index].productId = '';
                         newItems[index].name = e.target.value;
                         setItems(newItems);
                      }
                    }}
                    className="w-full border-2 border-white dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <datalist id="product-list">
                    {products?.map(p => (
                      <option key={p.id} value={p.name}>موجودی: {p.stock_quantity}</option>
                    ))}
                  </datalist>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-gray-500 block mb-1">تعداد فروش</label>
                    <input
                      ref={el => { ensureRefs(index); itemRefs.current[index].quantity = el; }}
                      onKeyDown={e => handleKeyDown(e, index, 'quantity')}
                      type="text"
                      value={item.quantity}
                      onChange={e => {
                        const newItems = [...items];
                        newItems[index].quantity = toEnglishDigits(e.target.value);
                        setItems(newItems);
                      }}
                      className="w-full border-2 border-white dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono text-sm"
                    />
                  </div>
                  <div className="flex-2">
                    <label className="text-[10px] font-bold text-gray-500 block mb-1">قیمت فی دانه ({currency})</label>
                    <input
                      ref={el => { ensureRefs(index); itemRefs.current[index].price = el; }}
                      onKeyDown={e => handleKeyDown(e, index, 'price')}
                      type="text"
                      value={item.unitPrice}
                      onChange={e => {
                        const newItems = [...items];
                        newItems[index].unitPrice = toEnglishDigits(e.target.value);
                        setItems(newItems);
                      }}
                      className="w-full border-2 border-white dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-bold text-gray-500 block mb-1">تخفیف به فیصد (%)</label>
                   <input
                      ref={el => { ensureRefs(index); itemRefs.current[index].discount = el; }}
                      onKeyDown={e => handleKeyDown(e, index, 'discount')}
                      type="text"
                      value={item.discount}
                      onChange={e => {
                        const newItems = [...items];
                        newItems[index].discount = toEnglishDigits(e.target.value);
                        setItems(newItems);
                      }}
                      className="w-full border-2 border-white dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono text-sm"
                    />
                </div>
              </div>
            ))}

            <button
              onClick={() => setItems([...items, { productId: '', name: '', quantity: '1', unitPrice: '', maxStock: 0, discount: '0' }])}
              className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              اضافه کردن جنس جدید
            </button>
          </div>

        </div>

        <div className="p-6 bg-gray-50 dark:bg-slate-950 rounded-b-3xl border-t dark:border-slate-800 space-y-4">
           {/* Direct Payment */}
           <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                {orderType === 'RETURN' ? `مبلغ بازپرداخت شده/مسترد نقدی به مشتری (${currency})` : `مبلغ دریافت شده (${currency})`}
              </label>
              <input
                  type="text"
                  value={receivedAmount}
                  onChange={e => setReceivedAmount(toEnglishDigits(e.target.value))}
                  placeholder="0"
                  className="w-full border-2 border-gray-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono text-center text-xl font-black text-emerald-600 dark:text-emerald-400"
              />
           </div>

           <div className="flex gap-2">
             <button onClick={handleSave} className={`flex-1 ${orderType==='RETURN'? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'} text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2`}>
               <Save size={20} />
               ثبت بیل
             </button>
             <button onClick={handlePrint} className="w-14 bg-gray-200 hover:bg-gray-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-white rounded-xl flex items-center justify-center transition-colors">
               <Printer size={20} />
             </button>
           </div>
        </div>
      </div>

      {/* Left Side: A4 Live Preview */}
      <div className="flex-1 flex justify-center items-start overflow-y-auto print:overflow-visible print:block">

        {/* A4 Paper Dimensions: 210mm x 297mm. Aspect ratio ~ 1 : 1.414. We use typical pixel dimensions like 794x1123 for web preview */}
        <div className={`bg-white text-black w-full max-w-[794px] min-h-[1123px] shadow-2xl print:shadow-none print:w-full print:max-w-none print:h-auto mx-auto p-10 flex flex-col relative ${printTheme === 'BW' ? 'grayscale' : ''}`} style={{ direction: 'rtl' }}>

          {/* Header */}
          <div className={`flex justify-between items-center border-b-2 pb-6 mb-6 ${printTheme === 'BW' ? 'border-gray-800' : (orderType === 'RETURN' ? 'border-red-800' : 'border-blue-800')}`}>
            <div className="flex flex-col gap-2">
               <h1 className={`text-3xl font-black tracking-tighter ${printTheme === 'BW' ? 'text-black' : (orderType === 'RETURN' ? 'text-red-800' : 'text-blue-800')}`}>شرکت تولیدی شین غزی بابا</h1>
               <p className="text-gray-600 font-bold text-sm">تولید کننده انواع لوله و اتصالات PPRC و PVC</p>
               <p className="text-gray-500 text-xs">آدرس: شهرک صنعتی، کابل، افغانستان | تلفن: ۰۷۰۱۱۱۱۱۱</p>
            </div>
            <label className="relative cursor-pointer group">
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-white font-black text-3xl shrink-0 overflow-hidden border-2 hover:border-gray-400 group-hover:opacity-90 ${printTheme === 'BW' ? 'bg-gray-800 border-gray-800' : (orderType === 'RETURN' ? 'bg-red-800 border-red-800' : 'bg-blue-800 border-blue-800')}`}>
                 {logo ? <img src={logo} alt="Logo" className={`w-full h-full object-contain ${printTheme === 'BW' ? 'bg-white mix-blend-luminosity' : 'bg-white'}`} /> : "SG"}
              </div>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden print:hidden" />
              <div className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 rounded-2xl print:hidden pointer-events-none transition-opacity text-xs text-center font-bold">
                 <Upload size={16} className="mb-1" />
                 تغییر<br/>لوگو
              </div>
            </label>
          </div>

          <div className={`text-center text-white py-2 rounded-lg mb-6 w-1/3 mx-auto font-black text-lg ${printTheme === 'BW' ? 'bg-gray-800 text-white print:border print:border-gray-800 print:text-black print:bg-white shadow-none' : (orderType === 'RETURN' ? 'bg-red-800 shadow-md print:shadow-none' : 'bg-blue-800 shadow-md print:shadow-none')}`}>
             {orderType === 'SALE' ? 'خلاصه بیل فروش' : 'بیل مستردات (برگشتی)'}
          </div>

          {/* Metadata */}
          <div className="flex justify-between items-end mb-6 text-sm font-bold">
            <div className="space-y-3">
               <div><span className="text-gray-500 w-24 inline-block">اسم مشتری:</span> <span className={`text-lg px-3 py-1 rounded ${printTheme === 'BW' ? 'border border-gray-300' : 'bg-gray-100'}`}>{customers?.find(c => c.id.toString() === selectedCustomerId)?.full_name || customerName || '__________'}</span></div>
               <div><span className="text-gray-500 w-24 inline-block">تاریخ فروش:</span> <span className={`px-3 py-1 rounded ${printTheme === 'BW' ? 'border border-gray-300' : 'bg-gray-100'}`} dir="ltr">{new Intl.DateTimeFormat('fa-AF').format(new Date())}</span></div>
            </div>
            <div className="text-left space-y-1">
               <p>شماره بیل: <span className={`font-mono ${printTheme === 'BW' ? 'text-black font-black' : 'text-red-600'}`}>#{(Math.floor(Math.random() * 90000) + 10000).toString()}</span></p>
               <p>واحد پولی: {currency}</p>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-center border-collapse text-sm mb-8 relative z-10">
            <thead className={`text-white font-black ${printTheme === 'BW' ? 'bg-gray-800 text-white print:bg-gray-200 print:text-black' : (orderType === 'RETURN' ? 'bg-red-800' : 'bg-blue-800')}`}>
              <tr>
                <th className={`py-3 px-2 border w-12 ${printTheme === 'BW' ? 'border-gray-800 print:border-gray-400' : (orderType === 'RETURN' ? 'border-red-900' : 'border-blue-900')}`}>شماره</th>
                <th className={`py-3 px-2 border text-right ${printTheme === 'BW' ? 'border-gray-800 print:border-gray-400' : (orderType === 'RETURN' ? 'border-red-900' : 'border-blue-900')}`}>تفصیل جنس</th>
                <th className={`py-3 px-2 border w-20 ${printTheme === 'BW' ? 'border-gray-800 print:border-gray-400' : (orderType === 'RETURN' ? 'border-red-900' : 'border-blue-900')}`}>تعداد</th>
                <th className={`py-3 px-2 border ${printTheme === 'BW' ? 'border-gray-800 print:border-gray-400' : (orderType === 'RETURN' ? 'border-red-900' : 'border-blue-900')}`}>قیمت فی دانه</th>
                <th className={`py-3 px-2 border w-20 ${printTheme === 'BW' ? 'border-gray-800 print:border-gray-400' : (orderType === 'RETURN' ? 'border-red-900' : 'border-blue-900')}`}>تخفیف %</th>
                <th className={`py-3 px-2 border ${printTheme === 'BW' ? 'border-gray-800 print:border-gray-400' : (orderType === 'RETURN' ? 'border-red-900' : 'border-blue-900')}`}>مجموعه</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className={`${printTheme === 'BW' ? 'even:bg-gray-50' : (orderType === 'RETURN' ? 'odd:bg-red-50/50' : 'odd:bg-blue-50/50')}`}>
                  <td className="py-3 px-2 border border-gray-300 font-bold text-gray-500">{idx + 1}</td>
                  <td className="py-3 px-2 border border-gray-300 text-right font-bold text-gray-800">{item.name || '-'}</td>
                  <td className="py-3 px-2 border border-gray-300 font-mono font-bold">{item.quantity || 0}</td>
                  <td className="py-3 px-2 border border-gray-300 font-mono">{Number(item.unitPrice || 0).toLocaleString()}</td>
                  <td className="py-3 px-2 border border-gray-300 font-mono text-red-600">{item.discount || 0}%</td>
                  <td className="py-3 px-2 border border-gray-300 font-mono font-bold">{calculateItemTotal(item).toLocaleString()}</td>
                </tr>
              ))}
              {/* Empty Rows Fill */}
              {Array.from({ length: Math.max(0, 10 - items.length) }).map((_, i) => (
                <tr key={'empty'+i}>
                   <td className="py-4 border border-gray-300"></td><td className="border border-gray-300"></td><td className="border border-gray-300"></td><td className="border border-gray-300"></td><td className="border border-gray-300"></td><td className="border border-gray-300"></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer Calculations */}
          <div className="mt-auto grid grid-cols-3 gap-8 relative z-10">
             <div className="col-span-1 space-y-2">
                <label className="text-gray-500 text-xs font-bold">ملاحظات و یادداشت:</label>
                <textarea
                  className={`w-full border-2 dashed rounded block p-2 text-sm h-24 outline-none resize-none ${printTheme === 'BW' ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'}`}
                  placeholder="نوشتن یادداشت..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
             </div>

             <div className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-4 text-sm font-bold">
                <div className={`flex flex-col p-2 rounded border ${printTheme === 'BW' ? 'border-gray-400 bg-white' : 'border-gray-200 bg-gray-50'}`}>
                  <span className="text-gray-500 text-xs">مجموعه قیمت به ({currency})</span>
                  <span className="text-xl font-mono text-gray-800">{grandTotal.toLocaleString()}</span>
                </div>
                <div className={`flex flex-col p-2 rounded border ${printTheme === 'BW' ? 'border-gray-400 bg-white' : 'border-gray-200 bg-gray-50'}`}>
                  <span className="text-gray-500 text-xs">مجموعه تخفیف</span>
                  <span className={`text-lg font-mono ${printTheme === 'BW' ? 'text-black' : 'text-red-500'}`}>{totalDiscount.toLocaleString()}</span>
                </div>

                <div className={`flex flex-col p-2 rounded border ${printTheme === 'BW' ? 'border-gray-800 bg-white' : (orderType === 'RETURN' ? 'border-orange-200 bg-orange-50' : 'border-emerald-200 bg-emerald-50')}`}>
                  <span className={`text-xs text-center ${printTheme === 'BW' ? 'text-gray-800' : (orderType === 'RETURN' ? 'text-orange-700' : 'text-emerald-700')}`}>
                     {orderType === 'RETURN' ? 'مبلغ پرداختی به مشتری (مسترد)' : 'مبلغ دریافت شده'}
                  </span>
                  <span className={`text-xl font-mono text-center ${printTheme === 'BW' ? 'text-black' : (orderType === 'RETURN' ? 'text-orange-700' : 'text-emerald-700')}`}>{Number(receivedAmount || 0).toLocaleString()}</span>
                </div>

                <div className={`flex flex-col p-2 rounded border ${printTheme === 'BW' ? 'border-gray-800 bg-white' : 'border-red-200 bg-red-50'}`}>
                  <span className={`text-xs text-center ${printTheme === 'BW' ? 'text-gray-800' : 'text-red-700'}`}>مبلغ باقی مانده</span>
                  <span className={`text-xl font-mono text-center ${printTheme === 'BW' ? 'text-black font-black' : 'text-red-700'}`} dir="ltr">{remainingBalance.toLocaleString()}</span>
                </div>
             </div>
          </div>

          <div className="mt-12 flex justify-between items-center text-xs text-gray-400 font-bold mb-4 relative z-10">
             <div className={`text-center w-32 border-t-2 pt-2 ${printTheme === 'BW' ? 'border-gray-800 text-gray-800' : 'border-gray-300'}`}>امضا تحویل دهنده</div>
             <div className={`text-center w-32 border-t-2 pt-2 ${printTheme === 'BW' ? 'border-gray-800 text-gray-800' : 'border-gray-300'}`}>امضا خریدار</div>
          </div>

        </div>

      </div>

      {/* Print Styles Global Override */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:hidden { display: none !important; }
          .print\\:block { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: block !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
    </>
  );
}
