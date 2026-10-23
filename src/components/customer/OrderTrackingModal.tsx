import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  PackageSearch, 
  CheckCircle2, 
  Clock, 
  Truck, 
  AlertCircle, 
  Search, 
  PackageCheck, 
  FileText 
} from 'lucide-react';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ isOpen, onClose }) => {
  const { language, formatPrice, t } = useLanguage();

  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderData, setOrderData] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setErrorMsg(language === 'bn' ? 'অর্ডার নম্বর এবং মোবাইল নম্বর দুটোই প্রয়োজন।' : 'Both order number and phone number are required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setOrderData(null);

    try {
      const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No matching order found');
      }
      setOrderData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Tracking failed');
    } finally {
      setIsLoading(false);
    }
  };

  const stages = [
    { key: 'pending', labelEn: 'Order Received', labelBn: 'অর্ডার গৃহীত' },
    { key: 'confirmed', labelEn: 'Confirmed', labelBn: 'নিশ্চিত হয়েছে' },
    { key: 'processing', labelEn: 'Packing & QA', labelBn: 'প্যাকিং সম্পন্ন' },
    { key: 'shipped', labelEn: 'Dispatched via Courier', labelBn: 'কুরিয়ারে পাঠানো হয়েছে' },
    { key: 'delivered', labelEn: 'Delivered', labelBn: 'ডেলিভারি সম্পন্ন' }
  ];

  const getStageIndex = (status: string) => {
    const idx = stages.findIndex(s => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  const currentIdx = orderData ? getStageIndex(orderData.orderStatus) : 0;
  const isCancelled = orderData?.orderStatus === 'cancelled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <PackageSearch className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">{t.trackOrderTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          
          {/* Tracking Search Form */}
          <form onSubmit={handleTrack} className="space-y-3">
            <p className="text-xs text-slate-400">
              {t.trackOrderPrompt}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">{t.orderNumberLabel} *</label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. BT-2026-104928"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t.mobileNumber} *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{isLoading ? 'Checking Delivery Status...' : 'Track Order'}</span>
            </button>
          </form>

          {/* Result Card */}
          {orderData && (
            <div className="space-y-6 pt-4 border-t border-slate-800">
              
              {/* Status Header */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-cyan-400">{orderData.orderNumber}</span>
                  <h3 className="text-sm font-bold text-white capitalize">
                    {orderData.orderStatus.replace('_', ' ')}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400">{formatPrice(orderData.totalAmount)}</span>
                  <span className="block text-[10px] text-slate-500 uppercase">{orderData.paymentMethod}</span>
                </div>
              </div>

              {/* Progress Stepper */}
              {isCancelled ? (
                <div className="p-4 bg-rose-950/30 border border-rose-900 rounded-xl text-rose-300 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <h4 className="font-bold">{t.statusCancelled}</h4>
                    <p className="text-[11px] text-rose-300/80 mt-0.5">
                      {language === 'bn' ? 'এই অর্ডারটি বাতিল করা হয়েছে।' : 'This order has been cancelled.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative flex justify-between">
                    <div className="absolute top-3 left-4 right-4 h-0.5 bg-slate-800 -z-0">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-500"
                        style={{ width: `${(currentIdx / (stages.length - 1)) * 100}%` }}
                      />
                    </div>

                    {stages.map((stage, i) => {
                      const isDone = i <= currentIdx;
                      return (
                        <div key={stage.key} className="flex flex-col items-center z-10">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                              isDone ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-500 border border-slate-700'
                            }`}
                          >
                            {isDone ? '✓' : i + 1}
                          </div>
                          <span className={`text-[10px] mt-2 text-center max-w-[60px] leading-tight ${
                            isDone ? 'text-cyan-300 font-semibold' : 'text-slate-500'
                          }`}>
                            {language === 'bn' ? stage.labelBn : stage.labelEn}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Courier Tracking Info if assigned */}
              {orderData.courierName && (
                <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t.courierLabel}:</span>
                    <span className="font-bold text-white">{orderData.courierName}</span>
                  </div>
                  {orderData.trackingNumber && (
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">{t.courierTrackingLabel}:</span>
                      <span className="text-cyan-400 font-semibold">{orderData.trackingNumber}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Delivery Address */}
              <div className="text-xs text-slate-400 border-t border-slate-800 pt-3">
                <span className="font-semibold text-slate-300 block mb-1">
                  {language === 'bn' ? 'ডেলিভারি ঠিকানা:' : 'Delivery Destination:'}
                </span>
                <p>{orderData.deliveryAddress.address}, {orderData.deliveryAddress.upazila}, {orderData.deliveryAddress.district}, {orderData.deliveryAddress.division}</p>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
