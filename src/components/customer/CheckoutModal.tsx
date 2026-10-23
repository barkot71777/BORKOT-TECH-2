import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { 
  BANGLADESH_DIVISIONS, 
  validateBangladeshiPhone, 
  normalizeBangladeshiPhone 
} from '../../data/bangladeshLocations';
import { Order, PaymentMethod, StoreSettings } from '../../types';
import { 
  X, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Printer 
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess
}) => {
  const { items, subtotal, appliedCoupon, couponDiscount, clearCart } = useCart();
  const { language, formatPrice, toBengaliDigits, t } = useLanguage();
  const { user, authFetch } = useAuth();

  // Form Fields
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('Dhanmondi');
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  // Delivery & Payment
  const [deliveryMethod, setDeliveryMethod] = useState<'inside_dhaka' | 'outside_dhaka' | 'express'>('inside_dhaka');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/settings')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load store settings')))
      .then((settings: StoreSettings) => { if (active) setStoreSettings(settings); })
      .catch((error) => console.error('Unable to load store settings:', error));
    return () => { active = false; };
  }, []);

  // Sync logged in user details if available
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerEmail) setCustomerEmail(user.email);
      if (!customerPhone) setCustomerPhone(user.phone);
      if (user.addresses && user.addresses.length > 0) {
        const addr = user.addresses[0];
        setDivision(addr.division);
        setDistrict(addr.district);
        setUpazila(addr.upazila);
        setStreetAddress(addr.address);
        if (addr.postalCode) setPostalCode(addr.postalCode);
      }
    }
  }, [user]);

  // Adjust default delivery method if division changed
  useEffect(() => {
    if (division.toLowerCase() === 'dhaka') {
      if (deliveryMethod === 'outside_dhaka') {
        setDeliveryMethod('inside_dhaka');
      }
    } else {
      setDeliveryMethod('outside_dhaka');
    }
  }, [division]);

  if (!isOpen) return null;

  // Selected Division Data
  const currentDivisionData = BANGLADESH_DIVISIONS.find(d => d.nameEn === division) || BANGLADESH_DIVISIONS[0];
  const currentDistrictData = currentDivisionData.districts.find(d => d.nameEn === district) || currentDivisionData.districts[0];

  // Delivery charge calculation
  let deliveryFee = storeSettings?.shippingOutsideDhaka ?? 0;
  if (deliveryMethod === 'inside_dhaka' || division.toLowerCase() === 'dhaka') {
    deliveryFee = storeSettings?.shippingInsideDhaka ?? 0;
  }
  if (deliveryMethod === 'express') {
    deliveryFee = storeSettings?.shippingInsideDhaka ?? 0;
  }
  const freeShippingThreshold = storeSettings?.freeShippingThreshold ?? 0;
  if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
    deliveryFee = 0;
  }

  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryFee);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation
    if (!customerName.trim()) {
      setErrorMsg(language === 'bn' ? 'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।' : 'Please enter your full name.');
      return;
    }

    if (!validateBangladeshiPhone(customerPhone)) {
      setErrorMsg(
        language === 'bn' 
          ? 'অনুগ্রহ করে একটি সঠিক বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX বা +88017XXXXXXXX)' 
          : 'Please enter a valid Bangladeshi mobile number (e.g., 017XXXXXXXX or +88017XXXXXXXX)'
      );
      return;
    }

    if (!streetAddress.trim()) {
      setErrorMsg(language === 'bn' ? 'অনুগ্রহ করে আপনার বিস্তারিত ঠিকানা লিখুন।' : 'Please enter your full delivery address.');
      return;
    }

    if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && !transactionId.trim()) {
      setErrorMsg(
        language === 'bn' 
          ? 'অনুগ্রহ করে আপনার পেমেন্টের ট্রানজেকশন আইডি (TrxID) দিন।' 
          : 'Please provide the Transaction ID (TrxID) for mobile banking verification.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: normalizeBangladeshiPhone(customerPhone),
        deliveryAddress: {
          division,
          district,
          upazila,
          address: streetAddress.trim(),
          postalCode: postalCode.trim() || undefined
        },
        items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        couponCode: appliedCoupon?.code,
        deliveryMethod,
        paymentMethod,
        paymentDetails: (paymentMethod === 'bkash' || paymentMethod === 'nagad') ? {
          transactionId: transactionId.trim(),
          senderNumber: senderNumber.trim() || customerPhone
        } : undefined,
        notes: orderNotes.trim() || undefined
      };

      const res = await authFetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      setConfirmedOrder(data.order);
      clearCart();
      onOrderSuccess(data.order);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during checkout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {confirmedOrder ? t.orderSuccessTitle : t.checkoutTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6">
          {confirmedOrder ? (
            /* Order Success Receipt View */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">{t.orderSuccessTitle}</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">{t.orderSuccessMsg}</p>
              </div>

              {/* Order Reference Box */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl text-left max-w-md mx-auto space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-sans">{t.orderNumberLabel}:</span>
                  <span className="text-cyan-400 font-bold text-sm">{confirmedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">{language === 'bn' ? 'গ্রাহক:' : 'Customer:'}</span>
                  <span className="text-white">{confirmedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">{language === 'bn' ? 'মোবাইল:' : 'Phone:'}</span>
                  <span className="text-white">{confirmedOrder.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">{language === 'bn' ? 'পেমেন্ট পদ্ধতি:' : 'Payment:'}</span>
                  <span className="text-white uppercase">{confirmedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-sm">
                  <span className="text-slate-200 font-sans">{t.totalAmount}:</span>
                  <span className="text-cyan-400">{formatPrice(confirmedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Instructions */}
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                {language === 'bn'
                  ? 'আমাদের টিম শীঘ্রই আপনার দেওয়া মোবাইল নম্বরে কল করে অর্ডারটি নিশ্চিত করবে। আপনি অর্ডার নম্বর দিয়ে যেকোনো সময় ট্র্যাকিং পেজে স্ট্যাটাস দেখতে পারেন।'
                  : 'Our customer support team will contact your mobile number shortly to verify order details. You can track live delivery status anytime.'}
              </p>

              <div className="pt-2 flex justify-center gap-4">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-cyan-400" />
                  <span>{language === 'bn' ? 'রসিদ প্রিন্ট করুন' : 'Print Receipt'}</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'bn' ? 'কেনাকাটা চালিয়ে যান' : 'Continue Shopping'}
                </button>
              </div>

            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              
              {errorMsg && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Step 1: Customer Contact & Address */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px]">1</span>
                  <span>{t.stepCustomerInfo}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">{t.fullName} *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">{t.mobileNumber} *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">{t.emailAddress}</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="tanvir@example.com (for digital invoice)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Division / District / Upazila Selectors */}
                  <div>
                    <label className="block text-slate-400 mb-1">{t.division} *</label>
                    <select
                      value={division}
                      onChange={(e) => {
                        const newDiv = e.target.value;
                        setDivision(newDiv);
                        const divObj = BANGLADESH_DIVISIONS.find(d => d.nameEn === newDiv);
                        if (divObj && divObj.districts[0]) {
                          setDistrict(divObj.districts[0].nameEn);
                          if (divObj.districts[0].upazilas[0]) {
                            setUpazila(divObj.districts[0].upazilas[0].nameEn);
                          }
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                    >
                      {BANGLADESH_DIVISIONS.map((d) => (
                        <option key={d.nameEn} value={d.nameEn}>
                          {language === 'bn' ? d.nameBn : d.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">{t.district} *</label>
                    <select
                      value={district}
                      onChange={(e) => {
                        const newDist = e.target.value;
                        setDistrict(newDist);
                        const distObj = currentDivisionData.districts.find(d => d.nameEn === newDist);
                        if (distObj && distObj.upazilas[0]) {
                          setUpazila(distObj.upazilas[0].nameEn);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                    >
                      {currentDivisionData.districts.map((dist) => (
                        <option key={dist.nameEn} value={dist.nameEn}>
                          {language === 'bn' ? dist.nameBn : dist.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">{t.upazilaThana} *</label>
                    <select
                      value={upazila}
                      onChange={(e) => setUpazila(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                    >
                      {currentDistrictData.upazilas.map((u) => (
                        <option key={u.nameEn} value={u.nameEn}>
                          {language === 'bn' ? u.nameBn : u.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">{t.postalCode}</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 1205"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">{t.streetAddress} *</label>
                    <textarea
                      required
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="House #, Road #, Sector, Area details..."
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Delivery Method & Payment */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px]">2</span>
                  <span>{t.stepPaymentMethod}</span>
                </h3>

                {/* Delivery Option Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <label className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-colors ${
                    deliveryMethod === 'inside_dhaka' ? 'border-cyan-500 bg-cyan-950/20 text-white' : 'border-slate-800 bg-slate-950/40 text-slate-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        checked={deliveryMethod === 'inside_dhaka'}
                        onChange={() => setDeliveryMethod('inside_dhaka')}
                        className="accent-cyan-400"
                      />
                      <span className="font-semibold text-slate-200">Inside Dhaka</span>
                    </div>
                    <span className="mt-2 font-mono text-cyan-400 tabular-nums">{formatPrice(storeSettings?.shippingInsideDhaka ?? 0)}</span>
                  </label>

                  <label className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-colors ${
                    deliveryMethod === 'outside_dhaka' ? 'border-cyan-500 bg-cyan-950/20 text-white' : 'border-slate-800 bg-slate-950/40 text-slate-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        checked={deliveryMethod === 'outside_dhaka'}
                        onChange={() => setDeliveryMethod('outside_dhaka')}
                        className="accent-cyan-400"
                      />
                      <span className="font-semibold text-slate-200">Outside Dhaka</span>
                    </div>
                    <span className="mt-2 font-mono text-cyan-400 tabular-nums">{formatPrice(storeSettings?.shippingOutsideDhaka ?? 0)}</span>
                  </label>

                  <label className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-colors ${
                    deliveryMethod === 'express' ? 'border-cyan-500 bg-cyan-950/20 text-white' : 'border-slate-800 bg-slate-950/40 text-slate-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        checked={deliveryMethod === 'express'}
                        onChange={() => setDeliveryMethod('express')}
                        className="accent-cyan-400"
                      />
                      <span className="font-semibold text-slate-200">Express Dhaka</span>
                    </div>
                    <span className="mt-2 font-mono text-cyan-400 tabular-nums">{formatPrice(storeSettings?.shippingInsideDhaka ?? 0)}</span>
                  </label>
                </div>

                {/* Payment Method */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-xl border text-center font-semibold transition-colors cursor-pointer ${
                      paymentMethod === 'cod' ? 'border-cyan-500 bg-cyan-950/30 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    COD (ক্যাশ অন)
                  </button>
                  <button
                    type="button"
                    disabled={!storeSettings?.bkashMerchantNumber?.trim()}
                    onClick={() => setPaymentMethod('bkash')}
                    className={`p-3 rounded-xl border text-center font-semibold transition-colors cursor-pointer ${
                      paymentMethod === 'bkash' ? 'border-pink-500 bg-pink-950/30 text-pink-300' : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    bKash বিকাশ{!storeSettings?.bkashMerchantNumber?.trim() ? ' (Not configured)' : ''}
                  </button>
                  <button
                    type="button"
                    disabled={!storeSettings?.nagadMerchantNumber?.trim()}
                    onClick={() => setPaymentMethod('nagad')}
                    className={`p-3 rounded-xl border text-center font-semibold transition-colors cursor-pointer ${
                      paymentMethod === 'nagad' ? 'border-orange-500 bg-orange-950/30 text-orange-300' : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Nagad নগদ{!storeSettings?.nagadMerchantNumber?.trim() ? ' (Not configured)' : ''}
                  </button>
                  <button
                    type="button"
                    disabled={!storeSettings?.bankDetails?.trim()}
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3 rounded-xl border text-center font-semibold transition-colors cursor-pointer ${
                      paymentMethod === 'bank_transfer' ? 'border-cyan-500 bg-cyan-950/30 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Bank Transfer{!storeSettings?.bankDetails?.trim() ? ' (Not configured)' : ''}
                  </button>
                </div>

                {/* Mobile Banking Instructions and TrxID Input */}
                {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                    <p className="text-slate-300">
                      {paymentMethod === 'bkash' ? (
                        <span>
                          {language === 'bn' 
                            ? `বিকাশ মার্চেন্ট নম্বর: ${storeSettings?.bkashMerchantNumber || 'সেট করা নেই'}। পেমেন্টের আগে নম্বরটি যাচাই করুন।`
                            : `bKash merchant number: ${storeSettings?.bkashMerchantNumber || 'not configured'}. Verify it with the store before paying.`}
                        </span>
                      ) : (
                        <span>
                          {language === 'bn'
                            ? `নগদ মার্চেন্ট নম্বর: ${storeSettings?.nagadMerchantNumber || 'সেট করা নেই'}। পেমেন্টের আগে নম্বরটি যাচাই করুন।`
                            : `Nagad merchant number: ${storeSettings?.nagadMerchantNumber || 'not configured'}. Verify it with the store before paying.`}
                        </span>
                      )}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">{t.transactionId} *</label>
                        <input
                          type="text"
                          required
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                          placeholder="e.g. 9B7X2K4A91"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">{t.senderNumber}</label>
                        <input
                          type="tel"
                          value={senderNumber}
                          onChange={(e) => setSenderNumber(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Order Summary & Place Order */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>{t.subtotal} ({items.length} {language === 'bn' ? 'টি পণ্য' : 'items'}):</span>
                  <span className="font-mono text-white tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>{t.discount} ({appliedCoupon?.code}):</span>
                    <span className="font-mono tabular-nums">-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>{t.deliveryCharge}:</span>
                  <span className="font-mono text-white tabular-nums">{formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                  <span>{t.totalAmount}:</span>
                  <span className="font-mono text-cyan-400 text-base tabular-nums">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-98 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                <span>{isSubmitting ? 'Placing Order...' : t.placeOrder}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
