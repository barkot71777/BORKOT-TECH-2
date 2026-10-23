import React, { useState } from 'react';
import { Product, ProductReview } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { 
  X, 
  ShoppingBag, 
  Zap, 
  ShieldCheck, 
  RotateCcw, 
  Truck, 
  Star, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenCheckout: () => void;
  onRequireLogin: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenCheckout,
  onRequireLogin
}) => {
  const { language, formatPrice, toBengaliDigits, t } = useLanguage();
  const { addToCart } = useCart();
  const { user, authFetch } = useAuth();

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'specs' | 'warranty' | 'reviews'>('specs');
  
  // Review submission state
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string>('');
  const [reviewErrorMsg, setReviewErrorMsg] = useState<string>('');

  if (!product) return null;

  const isInStock = product.stockQuantity > 0;
  const isLowStock = isInStock && product.stockQuantity <= product.lowStockThreshold;
  const displayName = language === 'bn' ? (product.nameBn || product.nameEn) : product.nameEn;
  const description = language === 'bn' ? (product.descriptionBn || product.descriptionEn) : product.descriptionEn;

  const handleAddToCart = () => {
    if (!isInStock) return;
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    if (!isInStock) return;
    addToCart(product, quantity);
    onClose();
    onOpenCheckout();
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireLogin();
      return;
    }
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    setReviewErrorMsg('');
    setReviewSuccessMsg('');

    try {
      const res = await authFetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          rating,
          comment: reviewComment
        })
      });
      const data = await res.json();
      if (res.ok) {
        setReviewSuccessMsg(language === 'bn' ? 'আপনার রিভিউটি জমা হয়েছে এবং অনুমোদনের অপেক্ষায় রয়েছে।' : 'Your review has been submitted for moderation.');
        setReviewComment('');
      } else {
        setReviewErrorMsg(data.error || 'Failed to submit review');
      }
    } catch {
      setReviewErrorMsg('Network error while submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImage = images[selectedImageIndex] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-8">
          
          {/* Main Top Split: Gallery & Contiguous Purchase Module */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Gallery Section */}
            <div className="space-y-4">
              <div className="aspect-4/3 w-full bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center p-4 overflow-hidden">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-500 font-mono text-xs">
                    [ BORKOT TECH AUTHENTIC PRODUCT ]
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-16 rounded-lg border overflow-hidden p-1 bg-slate-950 shrink-0 cursor-pointer transition-all ${
                        selectedImageIndex === idx ? 'border-cyan-400 ring-2 ring-cyan-500/20' : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Contiguous Purchase Module */}
            <div className="flex flex-col space-y-5">
              
              {/* Metadata */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-mono text-cyan-400 font-semibold">{product.sku}</span>
                <span aria-hidden="true">·</span>
                <span>{product.warranty}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                {displayName}
              </h2>

              {/* Price & Stock status */}
              <div className="flex items-baseline gap-4 pt-1 border-t border-slate-800">
                <span className="text-2xl font-black text-cyan-400 tabular-nums">
                  {formatPrice(product.sellingPrice)}
                </span>
                {product.originalPrice && product.originalPrice > product.sellingPrice && (
                  <span className="text-sm text-slate-500 line-through tabular-nums">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              <div className="text-xs">
                {isInStock ? (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">
                      {language === 'bn' ? 'স্টকে বিদ্যমান' : 'In Stock'}
                    </span>
                    <span className="text-slate-400">
                      ({language === 'bn' ? toBengaliDigits(product.stockQuantity) : product.stockQuantity} {t.unitsAvailable})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-400 font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    <span>{t.outOfStock}</span>
                  </div>
                )}
              </div>

              {/* Quantity selector */}
              {isInStock && (
                <div className="flex items-center gap-4 pt-2">
                  <span className="text-xs font-semibold text-slate-300">{t.quantity}:</span>
                  <div className="flex items-center border border-slate-700 bg-slate-950 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1.5 text-slate-300 hover:text-white cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 font-mono text-sm tabular-nums text-white">
                      {language === 'bn' ? toBengaliDigits(quantity) : quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                      className="px-3 py-1.5 text-slate-300 hover:text-white cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="pt-3 grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!isInStock}
                  className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isInStock
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 active:scale-95'
                      : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-cyan-400" />
                  <span>{t.addToCart}</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={!isInStock}
                  className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 ${
                    isInStock
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 active:scale-95'
                      : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>{t.buyNow}</span>
                </button>
              </div>

              {/* Delivery & Warranty info */}
              <div className="pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{language === 'bn' ? 'ঢাকা সিটিতে ২৪-৪৮ ঘণ্টা, সারাদেশে ৩-৫ দিন' : '24-48h in Dhaka, 3-5 days across 64 districts'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{product.warranty}</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{product.returnPolicy}</span>
                </div>
              </div>

            </div>

          </div>

          {/* Description & Technical Specifications Tabs */}
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab('specs')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'specs' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.technicalSpecs}
              </button>
              <button
                onClick={() => setActiveTab('warranty')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'warranty' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {language === 'bn' ? 'ওয়ারেন্টি ও শর্তাবলী' : 'Warranty & Policies'}
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'reviews' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {language === 'bn' ? 'রিভিউ ও রেটিং' : 'Customer Reviews'}
              </button>
            </div>

            {/* Specs Tab */}
            {activeTab === 'specs' && (
              <div className="space-y-4">
                {description && (
                  <div
                    className="rich-text-content text-xs sm:text-sm text-slate-300 leading-relaxed border-b border-slate-800/80 pb-5 mb-5"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
                  />
                )}

                {product.specifications && product.specifications.length > 0 ? (
                  <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 text-xs">
                    {product.specifications.map((spec, i) => (
                      <div key={i} className="grid grid-cols-3 p-3 bg-slate-950/40">
                        <span className="font-medium text-slate-400">{spec.key}</span>
                        <span className="col-span-2 text-slate-200 font-mono">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic py-2">
                    {language === 'bn' ? 'অতিরিক্ত স্পেসিফিকেশন অ্যাডমিন প্যানেল থেকে কনফিগার করা যাবে।' : 'Additional technical specs can be configured in the admin panel.'}
                  </div>
                )}
              </div>
            )}

            {/* Warranty & Return Policies */}
            {activeTab === 'warranty' && (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-5 rounded-xl border border-slate-800">
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">{t.warrantyLabel}</h4>
                  <p>{product.warranty}</p>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">{t.returnPolicyLabel}</h4>
                  <p>{product.returnPolicy}</p>
                </div>
                <div className="pt-2 text-slate-400 text-[11px]">
                  {language === 'bn' 
                    ? 'ওয়ারেন্টি সেবা পেতে আসল ক্যাশ মেমো / ইনভয়েস এবং প্রোডাক্টের বক্স সংরক্ষণ করুন।'
                    : 'To claim warranty, please preserve the official Borkot Tech invoice and original product packaging.'}
                </div>
              </div>
            )}

            {/* Customer Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Submit Form */}
                <form onSubmit={handleReviewSubmit} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {language === 'bn' ? 'আপনার মতামত লিখুন' : 'Leave a Verified Review'}
                  </h4>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{language === 'bn' ? 'রেটিং:' : 'Rating:'}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          className="p-1 cursor-pointer"
                        >
                          <Star className={`w-4 h-4 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={language === 'bn' ? 'পণ্যটি সম্পর্কে আপনার বাস্তব অভিজ্ঞতা লিখুন...' : 'Share your genuine hardware performance or delivery experience...'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    rows={3}
                  />

                  {reviewSuccessMsg && <p className="text-xs text-emerald-400">{reviewSuccessMsg}</p>}
                  {reviewErrorMsg && <p className="text-xs text-rose-400">{reviewErrorMsg}</p>}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      {submittingReview ? 'Submitting...' : (language === 'bn' ? 'রিভিউ জমা দিন' : 'Submit Review')}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
