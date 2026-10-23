import React, { useState } from 'react';
import { Product } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Search, X, Cpu } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct
}) => {
  const { language, formatPrice, t } = useLanguage();
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const results = query.trim()
    ? products.filter(p =>
        p.nameEn.toLowerCase().includes(query.toLowerCase()) ||
        p.nameBn.includes(query) ||
        p.sku.toLowerCase().includes(query.toLowerCase()) ||
        p.specifications?.some(s => s.value.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[75vh]">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-transparent border-none text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white text-xs">
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto p-4 space-y-2 text-xs">
          {!query.trim() ? (
            <div className="text-center py-10 text-slate-500">
              Type product name, SKU, or hardware specifications to search...
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-1">
              <Cpu className="w-8 h-8 text-slate-700 mx-auto" />
              <p>No products matched "{query}".</p>
            </div>
          ) : (
            results.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  onSelectProduct(product);
                  onClose();
                }}
                className="p-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-colors"
              >
                <div>
                  <span className="font-mono text-[10px] text-cyan-400 uppercase font-semibold">{product.sku}</span>
                  <h4 className="text-sm font-semibold text-white">
                    {language === 'bn' ? product.nameBn || product.nameEn : product.nameEn}
                  </h4>
                  <span className="text-[11px] text-slate-400">{product.warranty}</span>
                </div>

                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-cyan-400 tabular-nums">
                    {formatPrice(product.sellingPrice)}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
