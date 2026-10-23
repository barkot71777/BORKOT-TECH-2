import React, { useState } from 'react';
import { BorkotTechLogo } from './BorkotTechLogo';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { 
  ShoppingBag, 
  User as UserIcon, 
  Search, 
  Menu, 
  X, 
  ShieldCheck, 
  PackageSearch, 
  Headphones 
} from 'lucide-react';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenTrackOrder: () => void;
  onOpenSupport: () => void;
  onNavigateHome: () => void;
  onNavigateCatalog: () => void;
  onNavigateAccount: () => void;
  onNavigateAdmin: () => void;
  onNavigatePcBuilder: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenTrackOrder,
  onOpenSupport,
  onNavigateHome,
  onNavigateCatalog,
  onNavigateAccount,
  onNavigateAdmin,
  onNavigatePcBuilder
}) => {
  const { language, setLanguage, t, toBengaliDigits } = useLanguage();
  const { user, isAdmin } = useAuth();
  const { itemCount, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 text-slate-100 transition-colors">
      {/* Top micro announcement bar */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border-b border-cyan-900/30 text-xs py-1.5 px-4 text-center font-medium text-cyan-200/90 flex items-center justify-between max-w-7xl mx-auto">
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <span>{language === 'bn' ? 'অফিসিয়াল ওয়ারেন্টি ও সারাদেশে দ্রুত ডেলিভারি' : 'Official Bangladesh Warranty & Fast Nationwide Delivery'}</span>
        </div>
        <div className="mx-auto sm:mx-0 flex items-center gap-4 text-[11px] text-slate-300">
          <span>{language === 'bn' ? 'শোরুম: মাল্টিপ্ল্যান সেন্টার, ঢাকা' : 'Showroom: Multiplan Center, Dhaka'}</span>
          <span className="text-slate-600">|</span>
          <button 
            onClick={onOpenTrackOrder}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <PackageSearch className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.navTrackOrder}</span>
          </button>
        </div>
      </div>

      {/* Main Top Bar Contract: Zone 1 (Brand) — Zone 2 (Nav Links) — Zone 3 (Actions) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark & Monogram */}
        <button
          onClick={onNavigateHome}
          className="cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg p-0.5"
          aria-label="Borkot Tech Home"
        >
          <BorkotTechLogo variant="full" theme="dark" subtitle={language === 'bn' ? 'bn' : 'en'} />
        </button>

        {/* Zone 2: Single-line Text Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={onNavigateCatalog}
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.navStore}
          </button>
          <button
            onClick={onNavigatePcBuilder}
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span className="text-cyan-400 font-bold">⚡</span>
            <span>{t.navPcBuilder}</span>
          </button>
          <button
            onClick={onOpenTrackOrder}
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.navTrackOrder}
          </button>
          <button
            onClick={onOpenSupport}
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.navSupport}
          </button>
          {isAdmin && (
            <button
              onClick={onNavigateAdmin}
              className="text-cyan-400 hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>{t.navAdminPortal}</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Interactive Affordances (Search, Language, Cart, Account) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
            title="Search Hardware"
            aria-label="Search Hardware"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Bilingual Language Switcher Button */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs font-semibold">
            <button
              onClick={() => setLanguage('bn')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                language === 'bn' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              বাং
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                language === 'en' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>

          {/* Shopping Cart Button */}
          <button
            onClick={openCart}
            className="relative flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            aria-label={`Cart with ${itemCount} items`}
          >
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">{t.navCart}</span>
            {itemCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-slate-950 bg-cyan-400 rounded-full tabular-nums">
                {language === 'bn' ? toBengaliDigits(itemCount) : itemCount}
              </span>
            )}
          </button>

          {/* Account / Login Trigger */}
          <button
            onClick={onNavigateAccount}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 border border-transparent sm:border-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            aria-label="User Account"
          >
            <UserIcon className="w-4 h-4 text-slate-300" />
            <span className="hidden md:inline">
              {user ? user.name.split(' ')[0] : t.navAccount}
            </span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 lg:hidden text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-3">
          <button
            onClick={() => {
              onNavigateCatalog();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 px-3 text-sm font-medium text-slate-200 hover:bg-slate-900 rounded-md"
          >
            {t.navStore}
          </button>
          <button
            onClick={() => {
              onNavigatePcBuilder();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 px-3 text-sm font-medium text-cyan-400 hover:bg-slate-900 rounded-md"
          >
            ⚡ {t.navPcBuilder}
          </button>
          <button
            onClick={() => {
              onOpenTrackOrder();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 px-3 text-sm font-medium text-slate-200 hover:bg-slate-900 rounded-md"
          >
            {t.navTrackOrder}
          </button>
          <button
            onClick={() => {
              onOpenSupport();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 px-3 text-sm font-medium text-slate-200 hover:bg-slate-900 rounded-md"
          >
            {t.navSupport}
          </button>
          <button
            onClick={() => {
              onNavigateAccount();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 px-3 text-sm font-medium text-slate-200 hover:bg-slate-900 rounded-md"
          >
            {user ? `${t.myAccount} (${user.name})` : t.navLogin}
          </button>
          <button
            onClick={() => {
              onNavigateAdmin();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 px-3 text-sm font-medium text-cyan-400 hover:bg-slate-900 rounded-md flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t.navAdminPortal}</span>
          </button>
        </div>
      )}
    </header>
  );
};
