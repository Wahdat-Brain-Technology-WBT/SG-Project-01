import React, { useState } from 'react';
import { Shield, Save, Factory, Target, Users, Check, X, Settings as SettingsIcon, LayoutDashboard, Package, ShoppingCart, Wallet, Briefcase } from 'lucide-react';

interface Manager {
  id: number;
  name: string;
  username: string;
  permissions: {
    dashboard: boolean;
    inventory: boolean;
    production: boolean;
    customers: boolean;
    employees: boolean;
    ledger: boolean;
    orders: boolean;
  };
}

export default function Settings({ lang, theme }: { lang: string, theme: string }) {
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Mock State for Managers
  const [managers, setManagers] = useState<Manager[]>([
    {
      id: 1,
      name: 'احمد محمود',
      username: 'ahmad_m',
      permissions: { dashboard: true, inventory: true, production: true, customers: true, employees: false, ledger: false, orders: true }
    },
    {
      id: 2,
      name: 'سید علی',
      username: 'ali_sayed',
      permissions: { dashboard: false, inventory: false, production: true, customers: false, employees: true, ledger: false, orders: false }
    }
  ]);

  // Mock State for General Settings
  const [generalSettings, setGeneralSettings] = useState({
    dailyProductionTarget: '5000',
    factoryName: 'شین غزی بابا',
    taxRate: '4',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleTogglePermission = (managerId: number, permission: keyof Manager['permissions']) => {
    setManagers(prev => prev.map(m => {
      if (m.id === managerId) {
        return {
          ...m,
          permissions: {
            ...m.permissions,
            [permission]: !m.permissions[permission]
          }
        };
      }
      return m;
    }));
  };

  const handleSavePermissions = async () => {
    setIsSaving(true);
    try {
      // 1. Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // 2. Show success toast
      showToast(lang === 'dr' ? 'دسترسی‌ها با موفقیت ذخیره شد (حالت نمایشی)' : 'Permissions Saved (Mock)', 'success');
    } catch (error) {
      showToast('Error', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGeneralSettings = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      showToast(lang === 'dr' ? 'تنظیمات عمومی ذخیره شد (حالت نمایشی)' : 'Settings Saved (Mock)', 'success');
    } catch (error) {
      showToast('Error', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isRTL = lang === 'dr' || lang === 'ps';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl font-bold text-white flex items-center gap-2 animate-in fade-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <Check size={20} /> : <X size={20} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-3">
            <SettingsIcon className="text-blue-600" size={28} />
            {lang === 'dr' ? 'تنظیمات سیستم و مدیریت دسترسی' : 'System Settings & Access Control'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            {lang === 'dr' ? 'مخصوص مدیر عامل (CEO_SUPERADMIN)' : 'Exclusive for CEO_SUPERADMIN'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Manager Access Control (Full Width) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-800 dark:text-white">
                    {lang === 'dr' ? 'مدیریت دسترسی مدیران' : 'Manager Access Control'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {lang === 'dr' ? 'تعیین سطح دسترسی برای هر مدیر به تفکیک ماژول‌ها' : 'Granular access control for each manager'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleSavePermissions}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-70"
              >
                <Save size={18} />
                {isSaving ? (lang === 'dr' ? 'در حال ذخیره...' : 'Saving...') : (lang === 'dr' ? 'ذخیره دسترسی‌ها' : 'Save Permissions')}
              </button>
            </div>

            <div className="p-6 overflow-x-auto">
              <table className="w-full text-sm text-gray-700 dark:text-gray-300 min-w-[1000px]">
                <thead>
                  <tr className="border-b-2 dark:border-slate-800 text-gray-400 dark:text-gray-500">
                    <th className={`pb-4 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>مدیر (Manager)</th>
                    <th className="pb-4 font-bold text-center">
                      <div className="flex flex-col items-center gap-1">
                        <LayoutDashboard size={16} />
                        <span>داشبورد</span>
                      </div>
                    </th>
                    <th className="pb-4 font-bold text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Package size={16} />
                        <span>گدام</span>
                      </div>
                    </th>
                    <th className="pb-4 font-bold text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Factory size={16} />
                        <span>تولیدات</span>
                      </div>
                    </th>
                    <th className="pb-4 font-bold text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Users size={16} />
                        <span>مشتریان</span>
                      </div>
                    </th>
                    <th className="pb-4 font-bold text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Briefcase size={16} />
                        <span>کارمندان</span>
                      </div>
                    </th>
                    <th className="pb-4 font-bold text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Wallet size={16} />
                        <span>مالی/روزنامچه</span>
                      </div>
                    </th>
                    <th className="pb-4 font-bold text-center">
                      <div className="flex flex-col items-center gap-1">
                        <ShoppingCart size={16} />
                        <span>سفارشات</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800/50">
                  {managers.map(manager => (
                    <tr key={manager.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-500 font-bold">
                            <Users size={18} />
                          </div>
                          <div>
                            <p className="font-black text-gray-800 dark:text-white">{manager.name}</p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">@{manager.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 text-center">
                        <ToggleSwitch checked={manager.permissions.dashboard} onChange={() => handleTogglePermission(manager.id, 'dashboard')} />
                      </td>
                      <td className="py-5 text-center">
                        <ToggleSwitch checked={manager.permissions.inventory} onChange={() => handleTogglePermission(manager.id, 'inventory')} />
                      </td>
                      <td className="py-5 text-center">
                        <ToggleSwitch checked={manager.permissions.production} onChange={() => handleTogglePermission(manager.id, 'production')} />
                      </td>
                      <td className="py-5 text-center">
                        <ToggleSwitch checked={manager.permissions.customers} onChange={() => handleTogglePermission(manager.id, 'customers')} />
                      </td>
                      <td className="py-5 text-center">
                        <ToggleSwitch checked={manager.permissions.employees} onChange={() => handleTogglePermission(manager.id, 'employees')} />
                      </td>
                      <td className="py-5 text-center">
                        <ToggleSwitch checked={manager.permissions.ledger} onChange={() => handleTogglePermission(manager.id, 'ledger')} />
                      </td>
                      <td className="py-5 text-center">
                        <ToggleSwitch checked={manager.permissions.orders} onChange={() => handleTogglePermission(manager.id, 'orders')} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* General Factory Settings (Full Width) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b dark:border-slate-800 flex items-center gap-3 bg-gray-50/50 dark:bg-slate-800/50">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
                <Factory size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800 dark:text-white">
                  {lang === 'dr' ? 'تنظیمات عمومی کارخانه' : 'General Factory Settings'}
                </h3>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {lang === 'dr' ? 'نام شرکت / کارخانه' : 'Company Name'}
                </label>
                <input 
                  type="text" 
                  value={generalSettings.factoryName}
                  onChange={e => setGeneralSettings({...generalSettings, factoryName: e.target.value})}
                  className="w-full border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Target size={14} />
                  {lang === 'dr' ? 'هدف تولید روزانه (متر/کیلو)' : 'Daily Production Target'}
                </label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={generalSettings.dailyProductionTarget}
                  onChange={e => setGeneralSettings({...generalSettings, dailyProductionTarget: e.target.value})}
                  className="w-full border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-bold font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {lang === 'dr' ? 'مالیات پیش‌فرض (%)' : 'Default Tax Rate (%)'}
                </label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={generalSettings.taxRate}
                  onChange={e => setGeneralSettings({...generalSettings, taxRate: e.target.value})}
                  className="w-full border-2 border-gray-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-bold font-mono"
                />
              </div>
            </div>
            <div className="p-6 pt-0">
              <button 
                onClick={handleSaveGeneralSettings}
                disabled={isSaving}
                className="w-full md:w-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <Save size={18} />
                {isSaving ? (lang === 'dr' ? 'در حال ذخیره...' : 'Saving...') : (lang === 'dr' ? 'ذخیره تنظیمات' : 'Save Settings')}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Reusable Tailwind CSS Toggle Switch Component
function ToggleSwitch({ checked, onChange }: { checked: boolean, onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
        checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
