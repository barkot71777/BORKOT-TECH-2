import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowRight, ShieldCheck, Zap, Truck, PackageSearch } from 'lucide-react';

interface HeroBannerProps {
  onBrowseCatalog: () => void;
  onOpenTrackOrder: () => void;
  onOpenPcBuilder: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onBrowseCatalog,
  onOpenTrackOrder,
  onOpenPcBuilder
}) => {
  const { language, t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-slate-950 border-b border-slate-800 text-white">
      {/* Background imagery with measured scrim overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/borkot_tech_hero_banner_1792429009151.jpg"
          alt="Borkot Tech Flagship Technology Store Dhaka"
          className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105 transition-transform duration-1000"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Elegant CSS gradient fallback
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/70"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="max-w-2xl space-y-6">
          
          {/* Unboxed editorial kicker per zero-pill discipline */}
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-cyan-400">
            <span>{t.bangladeshMarket}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Dhaka Showroom</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>100% Genuine</span>
          </div>

          {/* Hero Headline with text-wrap: balance */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight" style={{ textWrap: 'balance' }}>
            {t.heroTitle}
          </h1>

          {/* Subtitle with measure */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
            {t.heroSubtitle}
          </p>

          {/* Action buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={onBrowseCatalog}
              className="px-6 py-3 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{t.heroBrowseCatalog}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenPcBuilder}
              className="px-6 py-3 text-sm font-semibold text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>{language === 'bn' ? 'কাস্টম পিসি কনফিগারেশন' : 'Build Custom PC'}</span>
            </button>

            <button
              onClick={onOpenTrackOrder}
              className="px-5 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <PackageSearch className="w-4 h-4 text-slate-400" />
              <span>{t.heroTrackOrder}</span>
            </button>
          </div>

          {/* Highlights Row */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{language === 'bn' ? 'অফিসিয়াল ডিস্ট্রিবিউটর ওয়ারেন্টি' : 'Official Distributor Warranty'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{language === 'bn' ? 'সারাদেশে হোম ডেলিভারি' : 'Fast 64-District Courier'}</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <span className="font-bold text-cyan-400">COD</span>
              <span>{language === 'bn' ? 'ক্যাশ অন ডেলিভারি সুবিধা' : 'Cash on Delivery Available'}</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
