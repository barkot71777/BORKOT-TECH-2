import React, { useState } from 'react';
import { Product } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { 
  Cpu, 
  HardDrive, 
  Zap, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  CheckCircle2, 
  HelpCircle 
} from 'lucide-react';

interface PcBuilderProps {
  products: Product[];
  onBackToCatalog: () => void;
  onQuickView: (product: Product) => void;
}

interface RigComponentSlot {
  key: string;
  nameEn: string;
  nameBn: string;
  categorySlug: string;
  icon: any;
  selectedProduct: Product | null;
}

export const PcBuilder: React.FC<PcBuilderProps> = ({
  products,
  onBackToCatalog,
  onQuickView
}) => {
  const { language, formatPrice, toBengaliDigits } = useLanguage();
  const { addToCart } = useCart();

  const [slots, setSlots] = useState<RigComponentSlot[]>([
    { key: 'cpu', nameEn: 'Processor (CPU)', nameBn: 'প্রসেসর', categorySlug: 'cpu-motherboard', icon: Cpu, selectedProduct: null },
    { key: 'motherboard', nameEn: 'Motherboard', nameBn: 'মাদারবোর্ড', categorySlug: 'cpu-motherboard', icon: Cpu, selectedProduct: null },
    { key: 'ram', nameEn: 'RAM Memory', nameBn: 'র‍্যাম মেমোরি', categorySlug: 'ram-storage', icon: HardDrive, selectedProduct: null },
    { key: 'gpu', nameEn: 'Graphics Card (GPU)', nameBn: 'গ্রাফিক্স কার্ড', categorySlug: 'graphics-cards', icon: Zap, selectedProduct: null },
    { key: 'storage', nameEn: 'Storage (NVMe SSD)', nameBn: 'স্টোরেজ ড্রাইভ', categorySlug: 'ram-storage', icon: HardDrive, selectedProduct: null },
    { key: 'psu', nameEn: 'Power Supply Unit (PSU)', nameBn: 'পাওয়ার সাপ্লাই', categorySlug: 'power-cooling', icon: Zap, selectedProduct: null },
    { key: 'casing', nameEn: 'Gaming Casing & Fans', nameBn: 'গেমিং কেসিং', categorySlug: 'power-cooling', icon: HardDrive, selectedProduct: null }
  ]);

  const [activeSlotKey, setActiveSlotKey] = useState<string | null>(null);

  const totalRigPrice = slots.reduce((sum, slot) => sum + (slot.selectedProduct?.sellingPrice || 0), 0);
  const selectedCount = slots.filter(s => s.selectedProduct !== null).length;

  const handleSelectProduct = (slotKey: string, product: Product) => {
    setSlots(prev => prev.map(s => s.key === slotKey ? { ...s, selectedProduct: product } : s));
    setActiveSlotKey(null);
  };

  const handleRemoveProduct = (slotKey: string) => {
    setSlots(prev => prev.map(s => s.key === slotKey ? { ...s, selectedProduct: null } : s));
  };

  const handleAddAllToCart = () => {
    slots.forEach(s => {
      if (s.selectedProduct && s.selectedProduct.stockQuantity > 0) {
        addToCart(s.selectedProduct, 1);
      }
    });
  };

  const activeSlot = slots.find(s => s.key === activeSlotKey);
  const candidateProducts = activeSlot 
    ? products.filter(p => p.stockQuantity > 0) // Allows choosing from available inventory
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-100">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <button
            onClick={onBackToCatalog}
            className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'ক্যাটালগে ফিরে যান' : 'Back to Store Catalog'}</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {language === 'bn' ? 'কাস্টম পিসি কনফিগারেশন বিল্ডার' : 'Borkot Tech Custom PC Rig Builder'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'bn'
              ? 'আপনার চাহিদা অনুযায়ী প্রসেসর, গ্রাফিক্স কার্ড ও অন্যান্য কম্পোনেন্ট নির্বাচন করে সম্পূর্ণ পিসি এক ক্লিকে অর্ডার করুন।'
              : 'Select compatible desktop components from the available catalog and review each product’s warranty details before ordering.'}
          </p>
        </div>

        {/* Summary Card */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between sm:justify-end gap-6 shrink-0">
          <div>
            <span className="block text-[11px] text-slate-400 uppercase font-semibold">
              {language === 'bn' ? 'কনফিগারেশন বিল' : 'Estimated Total'}
            </span>
            <span className="text-xl font-black text-cyan-400 tabular-nums">
              {formatPrice(totalRigPrice)}
            </span>
          </div>

          <button
            onClick={handleAddAllToCart}
            disabled={selectedCount === 0}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/20 disabled:opacity-40 flex items-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{language === 'bn' ? 'কার্টে যোগ করুন' : 'Add Rig to Cart'}</span>
          </button>
        </div>
      </div>

      {/* Component Slots Grid */}
      <div className="grid grid-cols-1 gap-3.5">
        {slots.map((slot) => {
          const Icon = slot.icon;
          const slotTitle = language === 'bn' ? slot.nameBn : slot.nameEn;
          const product = slot.selectedProduct;

          return (
            <div
              key={slot.key}
              className={`p-4 rounded-xl border transition-all ${
                product 
                  ? 'bg-slate-900/90 border-slate-700/80 shadow-sm' 
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Slot Icon & Title */}
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg border shrink-0 ${
                    product 
                      ? 'bg-cyan-950/60 border-cyan-800 text-cyan-400' 
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-mono text-slate-400 tracking-wider">Component Slot</span>
                    <h3 className="text-sm font-bold text-white">{slotTitle}</h3>
                  </div>
                </div>

                {/* Selected Product info or Choose button */}
                {product ? (
                  <div className="flex items-center justify-between sm:justify-end gap-4 flex-1">
                    <div className="text-right">
                      <span className="font-semibold text-xs text-white block">
                        {language === 'bn' ? product.nameBn || product.nameEn : product.nameEn}
                      </span>
                      <span className="text-xs font-mono text-cyan-400 font-bold tabular-nums">
                        {formatPrice(product.sellingPrice)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onQuickView(product)}
                        className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg text-xs cursor-pointer"
                        title="View product details"
                      >
                        Info
                      </button>
                      <button
                        onClick={() => handleRemoveProduct(slot.key)}
                        className="p-2 text-rose-400 hover:text-rose-300 bg-slate-800 rounded-lg text-xs cursor-pointer"
                        title="Remove from rig"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={() => setActiveSlotKey(slot.key)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-xs font-semibold text-cyan-400 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'কম্পোনেন্ট নির্বাচন করুন' : 'Select Hardware'}</span>
                    </button>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

      {/* Component Picker Modal */}
      {activeSlotKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-base font-bold text-white">
                {language === 'bn' ? 'কম্পোনেন্ট নির্বাচন:' : 'Select Hardware for:'} {activeSlot && (language === 'bn' ? activeSlot.nameBn : activeSlot.nameEn)}
              </h3>
              <button
                onClick={() => setActiveSlotKey(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1">
              {candidateProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-3">
                  <HelpCircle className="w-10 h-10 text-slate-700 mx-auto" />
                  <p className="text-xs">
                    {language === 'bn' 
                      ? 'এই ক্যাটাগরিতে বর্তমানে কোনো স্টককৃত পণ্য নেই। অ্যাডমিন প্যানেল থেকে আসল পণ্য যোগ করার পর তা এখানে দেখা যাবে।' 
                      : 'No in-stock hardware components found in this category yet. Once authorized administrators add authentic products, they will appear here.'}
                  </p>
                </div>
              ) : (
                candidateProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4 hover:border-slate-700"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-cyan-400 uppercase">{p.sku}</span>
                      <h4 className="text-xs font-semibold text-white">
                        {language === 'bn' ? p.nameBn || p.nameEn : p.nameEn}
                      </h4>
                      <span className="text-xs font-bold text-cyan-400 tabular-nums">
                        {formatPrice(p.sellingPrice)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSelectProduct(activeSlotKey, p)}
                      className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      {language === 'bn' ? 'নির্বাচন' : 'Choose'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
