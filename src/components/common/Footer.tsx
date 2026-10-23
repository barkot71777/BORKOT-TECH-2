import React from 'react';
import { BorkotTechLogo } from './BorkotTechLogo';
import { useLanguage } from '../../context/LanguageContext';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  RotateCcw 
} from 'lucide-react';

interface FooterProps {
  onNavigateCatalog: () => void;
  onOpenTrackOrder: () => void;
  onOpenSupport: () => void;
  onNavigateAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateCatalog,
  onOpenTrackOrder,
  onOpenSupport,
  onNavigateAdmin
}) => {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-300 pt-14 pb-10 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Trust Badges Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 mb-12 border-b border-slate-800/80 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">{t.heroBadgeOriginal}</h4>
              <p className="text-slate-400 mt-0.5">{language === 'bn' ? '১০০% আসল ও আমদানিকৃত পণ্য' : 'Authentic brands & authorized distributors'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">{t.heroBadgeDelivery}</h4>
              <p className="text-slate-400 mt-0.5">{language === 'bn' ? 'ঢাকা ও ৬৪ জেলায় দ্রুততম ডেলিভারি' : 'Reliable delivery across all 64 districts'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">{t.heroBadgePayment}</h4>
              <p className="text-slate-400 mt-0.5">{language === 'bn' ? 'ক্যাশ অন ডেলিভারি ও মোবাইল ব্যাংকিং' : 'bKash, Nagad, Rocket & Cash on Delivery'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">{t.heroBadgeWarranty}</h4>
              <p className="text-slate-400 mt-0.5">{language === 'bn' ? 'সহজ ওয়ারেন্টি ও রিপ্লেসমেন্ট সাপোর্ট' : 'Official distributor warranty coverage'}</p>
            </div>
          </div>
        </div>

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Col 1: Brand & Bio */}
          <div className="space-y-4 md:col-span-1">
            <BorkotTechLogo variant="full" theme="dark" subtitle="bn" />
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.trustStatement}
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{language === 'bn' ? 'অনলাইন অর্ডার গ্রহণ সক্রিয়' : 'Accepting Online Orders 24/7'}</span>
            </div>
          </div>

          {/* Col 2: Showroom & Contacts */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide">
              {t.showroomTitle}
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{t.showroomAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-mono">{t.officialHelpline}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{t.officialEmail}</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{t.workingHours}</span>
              </div>
            </div>
          </div>

          {/* Col 3: Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide">
              {language === 'bn' ? 'জরুরি লিংক' : 'Quick Navigation'}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={onNavigateCatalog} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  {t.navStore}
                </button>
              </li>
              <li>
                <button onClick={onOpenTrackOrder} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  {t.navTrackOrder}
                </button>
              </li>
              <li>
                <button onClick={onOpenSupport} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  {t.navSupport}
                </button>
              </li>
              <li>
                <button onClick={onNavigateAdmin} className="text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1">
                  <span>{t.navAdminPortal}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Staff</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Payment & Courier Support */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide">
              {language === 'bn' ? 'পেমেন্ট ও ডেলিভারি' : 'Payment & Courier Partners'}
            </h4>
            <div className="text-xs text-slate-400 space-y-3">
              <div>
                <span className="block text-[11px] text-slate-500 uppercase font-semibold mb-1">
                  {language === 'bn' ? 'সমর্থিত পেমেন্ট' : 'Accepted Payments'}
                </span>
                <div className="flex flex-wrap gap-1.5 font-medium text-slate-300">
                  <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">bKash</span>
                  <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">Nagad</span>
                  <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">Rocket</span>
                  <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">COD</span>
                  <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">Bank</span>
                </div>
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 uppercase font-semibold mb-1">
                  {language === 'bn' ? 'লজিস্টিক পার্টনার' : 'Courier Network'}
                </span>
                <div className="flex flex-wrap gap-1.5 text-slate-400">
                  <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-[11px]">Pathao</span>
                  <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-[11px]">Steadfast</span>
                  <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-[11px]">RedX</span>
                  <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-[11px]">Sundarban</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>{t.copyright}</p>
          <div className="flex items-center gap-4">
            <span>Bangladesh Standard Time (BST)</span>
            <span>·</span>
            <span>VAT / BIN Registered</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
