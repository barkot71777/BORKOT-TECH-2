import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { BANGLADESH_DIVISIONS, validateBangladeshiPhone } from '../../data/bangladeshLocations';
import { Order, BangladeshAddress } from '../../types';
import { 
  User, 
  Package, 
  MapPin, 
  LogOut, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Clock, 
  Plus, 
  Trash2, 
  Printer 
} from 'lucide-react';

interface CustomerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTrackOrder: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ isOpen, onClose }) => {
  const { user, login, register, logout, authFetch } = useAuth();
  const { language, formatPrice, t } = useLanguage();

  // Mode: if not logged in: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile'>('orders');

  // Customer orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [cancelFeedback, setCancelFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Address form modal
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrDivision, setAddrDivision] = useState('Dhaka');
  const [addrDistrict, setAddrDistrict] = useState('Dhaka');
  const [addrUpazila, setAddrUpazila] = useState('Dhanmondi');
  const [addrStreet, setAddrStreet] = useState('');

  // Fetch orders when user logs in or views orders tab
  useEffect(() => {
    if (user && activeTab === 'orders') {
      fetchCustomerOrders();
    }
  }, [user, activeTab]);

  const fetchCustomerOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await authFetch('/api/customer/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await login(email, password);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validateBangladeshiPhone(regPhone)) {
      setErrorMsg(
        language === 'bn' 
          ? 'অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)' 
          : 'Please enter a valid 11-digit Bangladeshi mobile number'
      );
      return;
    }

    setLoading(true);
    try {
      await register(regName, regEmail, regPhone, regPassword);
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;
    setCancelFeedback(null);
    try {
      const res = await authFetch(`/api/customer/orders/${orderToCancel}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Customer requested cancellation from account portal' })
      });
      if (res.ok) {
        setCancelFeedback({
          type: 'success',
          text: language === 'bn' ? 'অর্ডারটি সফলভাবে বাতিল করা হয়েছে।' : 'Order cancelled successfully.'
        });
        setOrderToCancel(null);
        fetchCustomerOrders();
      } else {
        const data = await res.json();
        setCancelFeedback({ type: 'error', text: data.error || 'Failed to cancel order' });
      }
    } catch {
      setCancelFeedback({
        type: 'error',
        text: language === 'bn' ? 'নেটওয়ার্ক ত্রুটির কারণে অর্ডার বাতিল করা যায়নি।' : 'Error cancelling order due to network issue'
      });
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrStreet.trim() || !user) return;

    const newAddress: BangladeshAddress = {
      division: addrDivision,
      district: addrDistrict,
      upazila: addrUpazila,
      address: addrStreet.trim(),
      isDefault: user.addresses?.length === 0
    };

    const currentAddresses = user.addresses || [];
    const updatedAddresses = [...currentAddresses, newAddress];

    try {
      const res = await authFetch('/api/auth/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses: updatedAddresses })
      });
      if (res.ok) {
        setShowAddressForm(false);
        setAddrStreet('');
      }
    } catch (err) {
      console.error('Failed to save address:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {user ? user.name : (authMode === 'login' ? t.navLogin : t.navRegister)}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6">
          {!user ? (
            /* Auth Login / Register Form */
            <div className="max-w-md mx-auto space-y-5">
              
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                  className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                    authMode === 'login' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {t.navLogin}
                </button>
                <button
                  onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
                  className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                    authMode === 'register' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {t.navRegister}
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {authMode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      {language === 'bn' ? 'ইমেইল অথবা মোবাইল নম্বর' : 'Email Address or Mobile Number'}
                    </label>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={language === 'bn' ? 'user@example.com অথবা 017XXXXXXXX' : 'user@example.com or 017XXXXXXXX'}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">
                      {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/20 active:scale-98 cursor-pointer"
                  >
                    {loading ? 'Authenticating...' : t.navLogin}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">{t.fullName} *</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Mahfuz Rahman"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">{t.emailAddress} *</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="mahfuz@example.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">{t.mobileNumber} *</label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">
                      {language === 'bn' ? 'পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)' : 'Password (min 6 characters)'} *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/20 active:scale-98 cursor-pointer"
                  >
                    {loading ? 'Creating Account...' : t.navRegister}
                  </button>
                </form>
              )}

            </div>
          ) : (
            /* Logged In Dashboard */
            <div className="space-y-6">
              
              {/* Account Nav Tabs */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'orders' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>{t.myOrders}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('addresses')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'addresses' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>{t.myAddresses}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'profile' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>{t.profileDetails}</span>
                  </button>
                </div>

                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.navLogout}</span>
                </button>
              </div>

              {/* Tab 1: Orders (Strict Customer Isolation) */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {cancelFeedback && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      cancelFeedback.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    }`}>
                      {cancelFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{cancelFeedback.text}</span>
                    </div>
                  )}

                  {loadingOrders ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      Loading orders...
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 space-y-2">
                      <Package className="w-10 h-10 text-slate-700 mx-auto" />
                      <p className="text-xs">{language === 'bn' ? 'আপনার কোনো পূর্ববর্তী অর্ডার নেই।' : 'You have placed no orders yet.'}</p>
                    </div>
                  ) : (
                    orders.map((ord) => (
                      <div key={ord.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                          <div>
                            <span className="font-mono text-cyan-400 font-bold">{ord.orderNumber}</span>
                            <span className="text-slate-500 ml-2 font-mono text-[11px]">
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-900 border border-slate-700 text-slate-300">
                              {ord.orderStatus}
                            </span>
                            {(ord.orderStatus === 'pending' || ord.orderStatus === 'confirmed') && (
                              <button
                                onClick={() => setOrderToCancel(ord.id)}
                                className="text-rose-400 hover:text-rose-300 underline text-[11px] cursor-pointer"
                              >
                                {t.cancelOrder}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Order Items Summary */}
                        <div className="space-y-1">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-slate-300">
                              <span>{it.quantity}x {language === 'bn' ? it.nameBn : it.nameEn} ({it.sku})</span>
                              <span className="font-mono tabular-nums">{formatPrice(it.price * it.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Totals & Delivery */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-slate-400">
                          <div>
                            <span>{language === 'bn' ? 'গন্তব্য:' : 'Destination:'} {ord.deliveryAddress.district}, {ord.deliveryAddress.division}</span>
                            <span className="ml-2 font-mono uppercase text-[10px]">({ord.paymentMethod})</span>
                          </div>
                          <span className="text-sm font-bold text-cyan-400 font-mono tabular-nums">
                            {formatPrice(ord.totalAmount)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Saved Addresses */}
              {activeTab === 'addresses' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-white uppercase">{t.myAddresses}</h3>
                    <button
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'নতুন ঠিকানা যোগ করুন' : 'Add New Address'}</span>
                    </button>
                  </div>

                  {showAddressForm && (
                    <form onSubmit={handleSaveAddress} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-slate-400 mb-1">{t.division}</label>
                          <select
                            value={addrDivision}
                            onChange={(e) => setAddrDivision(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                          >
                            {BANGLADESH_DIVISIONS.map(d => (
                              <option key={d.nameEn} value={d.nameEn}>{d.nameEn}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">{t.district}</label>
                          <input
                            type="text"
                            value={addrDistrict}
                            onChange={(e) => setAddrDistrict(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">{t.upazilaThana}</label>
                          <input
                            type="text"
                            value={addrUpazila}
                            onChange={(e) => setAddrUpazila(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">{t.streetAddress} *</label>
                        <input
                          type="text"
                          required
                          value={addrStreet}
                          onChange={(e) => setAddrStreet(e.target.value)}
                          placeholder="House/Road/Sector..."
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="px-3 py-1.5 text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-cyan-500 text-slate-950 font-bold rounded"
                        >
                          Save Address
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2">
                    {user.addresses && user.addresses.length > 0 ? (
                      user.addresses.map((addr, idx) => (
                        <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                          <div className="font-semibold text-white">{addr.address}</div>
                          <div className="text-slate-400">{addr.upazila}, {addr.district}, {addr.division}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No saved addresses yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Profile */}
              {activeTab === 'profile' && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">{t.fullName}:</span>
                    <span className="text-white font-semibold">{user.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">{t.emailAddress}:</span>
                    <span className="text-white font-mono">{user.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">{t.mobileNumber}:</span>
                    <span className="text-white font-mono">{user.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Type:</span>
                    <span className="text-cyan-400 font-semibold uppercase">{user.role}</span>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

      {/* Cancel Order Confirmation Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <h3 className="text-sm font-bold text-white">
              {language === 'bn' ? 'অর্ডার বাতিল নিশ্চিতকরণ' : 'Confirm Order Cancellation'}
            </h3>
            <p className="text-xs text-slate-400">
              {t.cancelOrderConfirm}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {language === 'bn' ? 'ফিরে যান' : 'Keep Order'}
              </button>
              <button
                type="button"
                onClick={confirmCancelOrder}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল করুন' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
