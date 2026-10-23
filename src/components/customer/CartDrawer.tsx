import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  Tag, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const { 
    items, 
    isCartOpen, 
    closeCart, 
    updateQuantity, 
    removeFromCart, 
    subtotal, 
    itemCount,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon
  } = useCart();
  
  const { language, formatPrice, toBengaliDigits, t } = useLanguage();

  const [couponInput, setCouponInput] = useState('');
  const [couponStatus, setCouponStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  if (!isCartOpen) return null;

  const finalSubtotal = Math.max(0, subtotal - couponDiscount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setIsApplying(true);
    setCouponStatus(null);
    const result = await applyCoupon(couponInput.trim());
    setIsApplying(false);

    if (result.success) {
      setCouponStatus({ message: t.couponApplied, isError: false });
      setCouponInput('');
    } else {
      setCouponStatus({ message: result.message, isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={closeCart} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                {t.shoppingCart} ({language === 'bn' ? toBengaliDigits(itemCount) : itemCount})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-700 stroke-1" />
                <p className="text-sm">{t.cartEmpty}</p>
                <button
                  onClick={closeCart}
                  className="px-4 py-2 text-xs font-semibold text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors cursor-pointer"
                >
                  {t.cartStartShopping}
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => {
                const displayName = language === 'bn' ? (product.nameBn || product.nameEn) : product.nameEn;
                const image = product.images && product.images[0] ? product.images[0] : null;

                return (
                  <div key={product.id} className="flex gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                    <div className="w-16 h-16 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 p-1">
                      {image ? (
                        <img src={image} alt={displayName} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">BT</span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-cyan-400 uppercase">{product.sku}</span>
                          <h4 className="text-xs font-semibold text-white line-clamp-1">{displayName}</h4>
                        </div>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-bold text-white tabular-nums">
                          {formatPrice(product.sellingPrice * quantity)}
                        </span>

                        <div className="flex items-center border border-slate-700 bg-slate-900 rounded">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="px-2 py-0.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-mono tabular-nums text-white">
                            {language === 'bn' ? toBengaliDigits(quantity) : quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            disabled={quantity >= product.stockQuantity}
                            className="px-2 py-0.5 text-xs text-slate-400 hover:text-white disabled:opacity-40 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Area */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-800 bg-slate-950 space-y-4">
              
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-500" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder={language === 'bn' ? 'কুপন কোড' : 'Coupon code'}
                      className="w-full pl-8 pr-2 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white uppercase placeholder:normal-case placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isApplying || !couponInput.trim()}
                    className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isApplying ? '...' : t.applyCoupon}
                  </button>
                </div>

                {couponStatus && (
                  <p className={`text-[11px] flex items-center gap-1 ${couponStatus.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {couponStatus.isError ? <AlertCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    <span>{couponStatus.message}</span>
                  </p>
                )}

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs bg-cyan-950/40 border border-cyan-800/40 p-2 rounded-lg text-cyan-300">
                    <span>
                      {appliedCoupon.code} (-{formatPrice(couponDiscount)})
                    </span>
                    <button onClick={removeCoupon} className="text-slate-400 hover:text-white underline text-[11px] cursor-pointer">
                      Remove
                    </button>
                  </div>
                )}
              </form>

              {/* Subtotal Calculation */}
              <div className="space-y-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span>{t.subtotal}</span>
                  <span className="font-mono text-white tabular-nums">{formatPrice(subtotal)}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>{t.discount}</span>
                    <span className="font-mono tabular-nums">-{formatPrice(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                  <span>{t.totalAmount}</span>
                  <span className="font-mono text-cyan-400 tabular-nums">{formatPrice(finalSubtotal)}</span>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  * {language === 'bn' ? 'ডেলিভারি চার্জ চেকআউটে ঠিকানার ভিত্তিতে যুক্ত হবে।' : 'Delivery charge will be calculated at checkout based on address.'}
                </p>
              </div>

              {/* Checkout Action Button */}
              <button
                onClick={() => {
                  closeCart();
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t.proceedToCheckout}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
