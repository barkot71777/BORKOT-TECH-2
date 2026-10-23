import React, { useState, useEffect } from 'react';
import { Product, Category, Brand } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ProductCard } from './ProductCard';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  ShieldCheck, 
  Cpu, 
  ExternalLink, 
  ChevronDown 
} from 'lucide-react';

interface StoreCatalogProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  loading: boolean;
  onQuickView: (product: Product) => void;
  onNavigateAdmin: () => void;
  initialCategorySlug?: string;
}

export const StoreCatalog: React.FC<StoreCatalogProps> = ({
  products,
  categories,
  brands,
  loading,
  onQuickView,
  onNavigateAdmin,
  initialCategorySlug
}) => {
  const { language, formatPrice, toBengaliDigits, t } = useLanguage();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategorySlug || 'all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');

  useEffect(() => {
    if (initialCategorySlug) {
      setSelectedCategory(initialCategorySlug);
    }
  }, [initialCategorySlug]);

  // Filtering
  const filteredProducts = products.filter((p) => {
    if (inStockOnly && p.stockQuantity <= 0) return false;

    if (selectedCategory !== 'all') {
      const cat = categories.find(c => c.slug === selectedCategory || c.id === selectedCategory);
      if (cat && p.categoryId !== cat.id) return false;
    }

    if (selectedBrand !== 'all') {
      const br = brands.find(b => b.slug === selectedBrand || b.id === selectedBrand);
      if (br && p.brandId !== br.id) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = p.nameEn.toLowerCase().includes(q) || p.nameBn.includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchSpec = p.specifications?.some(s => s.value.toLowerCase().includes(q) || s.key.toLowerCase().includes(q));
      if (!matchName && !matchSku && !matchSpec) return false;
    }

    return true;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_low') return a.sellingPrice - b.sellingPrice;
    if (sortBy === 'price_high') return b.sellingPrice - a.sellingPrice;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setInStockOnly(false);
    setSortBy('newest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Category Tabs Strip */}
      <div className="border-b border-slate-800 pb-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {t.allCategories}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.slug)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === c.slug
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {language === 'bn' ? c.nameBn : c.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between text-xs">
        
        {/* Search Input */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="bg-transparent border-none text-white focus:outline-none w-full placeholder-slate-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-500 hover:text-white">✕</button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">{t.allBrands}</option>
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>{b.name}</option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="newest">{t.sortNewest}</option>
            <option value="price_low">{t.sortPriceLowHigh}</option>
            <option value="price_high">{t.sortPriceHighLow}</option>
          </select>

          {/* In Stock Only Checkbox */}
          <label className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="accent-cyan-400"
            />
            <span>{t.filterInStockOnly}</span>
          </label>

          {(selectedCategory !== 'all' || selectedBrand !== 'all' || inStockOnly || search) && (
            <button
              onClick={resetFilters}
              className="p-2 text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
              title={t.resetFilters}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.resetFilters}</span>
            </button>
          )}

        </div>
      </div>

      {/* Main Content: Products Grid or Empty Catalog State */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">
          Loading hardware catalog...
        </div>
      ) : products.length === 0 ? (
        /* STRICT PRODUCT CATALOG RULE — EMPTY STATE */
        <div className="py-16 px-6 max-w-2xl mx-auto text-center space-y-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="w-16 h-16 bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-cyan-950/50">
            <Cpu className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              <span>{t.bangladeshMarket}</span>
              <span aria-hidden="true">·</span>
              <span>100% Genuine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {t.catalogEmptyTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
              {t.catalogEmptyNotice}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onNavigateAdmin}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/20 active:scale-98 flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t.catalogEmptyAction}</span>
            </button>
          </div>
        </div>
      ) : sortedProducts.length === 0 ? (
        /* No filter results */
        <div className="text-center py-16 text-slate-400 space-y-3">
          <p className="text-sm">{t.catalogNoFilterResults}</p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-semibold rounded-lg border border-slate-800 cursor-pointer"
          >
            {t.resetFilters}
          </button>
        </div>
      ) : (
        /* Grid of authentic products */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      )}

    </div>
  );
};
