import React, { useState } from 'react';
import { Product } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { ShoppingBag, Eye, Cpu } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { language, formatPrice, toBengaliDigits } = useLanguage();
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);

  const isInStock = product.stockQuantity > 0;
  const isLowStock = isInStock && product.stockQuantity <= product.lowStockThreshold;

  const displayName = language === 'bn' ? (product.nameBn || product.nameEn) : product.nameEn;
  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <div className="group flex flex-col bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-950/20 text-slate-100">
      
      {/* Product Image Area */}
      <div className="relative aspect-4/3 w-full bg-slate-950/80 flex items-center justify-center overflow-hidden p-4">
        {mainImage && !imageError ? (
          <img
            src={mainImage}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-500">
            <Cpu className="w-12 h-12 text-slate-600 mb-2 stroke-1" />
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{product.sku}</span>
          </div>
        )}

        {/* Quiet Single Unboxed Status Tag (No Pill Enclosures) */}
        <div className="absolute top-3 left-3 text-[11px] font-medium tracking-wide">
          {isInStock ? (
            isLowStock ? (
              <span className="text-amber-400 font-semibold drop-shadow-sm">
                {language === 'bn' ? `সীমিত স্টক (${toBengaliDigits(product.stockQuantity)})` : `Low Stock (${product.stockQuantity})`}
              </span>
            ) : (
              <span className="text-emerald-400 font-medium drop-shadow-sm">
                {language === 'bn' ? 'স্টকে আছে' : 'In Stock'}
              </span>
            )
          ) : (
            <span className="text-rose-400 font-semibold drop-shadow-sm">
              {language === 'bn' ? 'স্টক আউট' : 'Out of Stock'}
            </span>
          )}
        </div>

        {/* Quick View Button on Hover */}
        <button
          onClick={() => onQuickView(product)}
          className="absolute inset-x-4 bottom-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm border border-slate-700/80 flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>{language === 'bn' ? 'বিস্তারিত দেখুন' : 'Quick View'}</span>
        </button>
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Metadata line per zero-pill rules */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <span className="font-mono text-cyan-400/90 text-[11px]">{product.sku}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400 text-[11px]">{product.warranty}</span>
          </div>

          {/* Product Name */}
          <h3 
            onClick={() => onQuickView(product)}
            className="font-semibold text-sm text-slate-100 hover:text-cyan-400 transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {displayName}
          </h3>
        </div>

        {/* Price & Action Row */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-base font-bold text-white tabular-nums tracking-tight">
              {formatPrice(product.sellingPrice)}
            </span>
            {product.originalPrice && product.originalPrice > product.sellingPrice && (
              <span className="text-xs text-slate-500 line-through tabular-nums">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            disabled={!isInStock}
            className={`p-2 sm:px-3 sm:py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              isInStock
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
            title={isInStock ? (language === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart') : (language === 'bn' ? 'স্টক আউট' : 'Out of Stock')}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isInStock ? (language === 'bn' ? 'কিনুন' : 'Add') : (language === 'bn' ? 'স্টক নেই' : 'Unavailable')}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
