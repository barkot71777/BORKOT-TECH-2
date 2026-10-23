import React, { useState, useEffect } from 'react';
import { Product, Category, Brand, Order } from './types';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';

// Common
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';

// Customer Components
import { HeroBanner } from './components/customer/HeroBanner';
import { StoreCatalog } from './components/customer/StoreCatalog';
import { ProductDetailModal } from './components/customer/ProductDetailModal';
import { CartDrawer } from './components/customer/CartDrawer';
import { CheckoutModal } from './components/customer/CheckoutModal';
import { OrderTrackingModal } from './components/customer/OrderTrackingModal';
import { SupportModal } from './components/customer/SupportModal';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { PcBuilder } from './components/customer/PcBuilder';
import { SearchModal } from './components/customer/SearchModal';

// Admin Components
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminProducts } from './components/admin/AdminProducts';
import { AdminInventory } from './components/admin/AdminInventory';
import { AdminOrders } from './components/admin/AdminOrders';
import { AdminCategoriesBrands } from './components/admin/AdminCategoriesBrands';
import { AdminCoupons } from './components/admin/AdminCoupons';
import { AdminSupportReviews } from './components/admin/AdminSupportReviews';
import { AdminStaff } from './components/admin/AdminStaff';
import { AdminSettings } from './components/admin/AdminSettings';
import { AdminBackup } from './components/admin/AdminBackup';

function MainApp() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { openCart } = useCart();

  // Root Navigation: Storefront vs Admin Portal
  const [viewMode, setViewMode] = useState<'storefront' | 'admin'>(() => {
    return window.location.pathname.startsWith('/admin') ? 'admin' : 'storefront';
  });

  // Storefront Section: 'home' | 'catalog' | 'pc_builder'
  const [storefrontSection, setStorefrontSection] = useState<'home' | 'catalog' | 'pc_builder'>('home');
  const [initialCategorySlug, setInitialCategorySlug] = useState<string>('all');

  // Customer Modals
  const [searchOpen, setSearchOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [trackOrderOpen, setTrackOrderOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [activeDetailProduct, setActiveDetailProduct] = useState<Product | null>(null);

  // Admin Active Tab
  const [adminTab, setAdminTab] = useState<string>('dashboard');
  const [inspectedOrderForAdmin, setInspectedOrderForAdmin] = useState<Order | null>(null);

  // Catalog Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const fetchCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/brands')
      ]);

      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (brandRes.ok) setBrands(await brandRes.json());
    } catch (err) {
      console.error('Failed to load store catalog:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [viewMode]);

  // Synchronize browser history / URL path
  useEffect(() => {
    const handlePopState = () => {
      setViewMode(window.location.pathname.startsWith('/admin') ? 'admin' : 'storefront');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToAdmin = () => {
    window.history.pushState(null, '', '/admin');
    setViewMode('admin');
  };

  const navigateToStorefront = () => {
    window.history.pushState(null, '', '/');
    setViewMode('storefront');
  };

  // --- RENDER ADMIN EXPERIENCE ---
  if (viewMode === 'admin') {
    return (
      <AdminLayout
        currentTab={adminTab}
        onSelectTab={setAdminTab}
        onNavigateStorefront={navigateToStorefront}
      >
        {adminTab === 'dashboard' && (
          <AdminDashboard
            onNavigateTab={setAdminTab}
            onViewOrder={(ord) => {
              setInspectedOrderForAdmin(ord);
              setAdminTab('orders');
            }}
          />
        )}
        {adminTab === 'products' && <AdminProducts />}
        {adminTab === 'inventory' && <AdminInventory />}
        {adminTab === 'orders' && (
          <AdminOrders
            initialSelectedOrder={inspectedOrderForAdmin}
            onClearInitialOrder={() => setInspectedOrderForAdmin(null)}
          />
        )}
        {adminTab === 'categories_brands' && <AdminCategoriesBrands />}
        {adminTab === 'coupons' && <AdminCoupons />}
        {adminTab === 'support_reviews' && <AdminSupportReviews />}
        {adminTab === 'staff' && <AdminStaff />}
        {adminTab === 'settings' && <AdminSettings />}
        {adminTab === 'backup' && <AdminBackup />}
      </AdminLayout>
    );
  }

  // --- RENDER CUSTOMER STOREFRONT ---
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <Navbar
        onOpenSearch={() => setSearchOpen(true)}
        onOpenTrackOrder={() => setTrackOrderOpen(true)}
        onOpenSupport={() => setSupportOpen(true)}
        onNavigateHome={() => {
          setStorefrontSection('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateCatalog={() => {
          setInitialCategorySlug('all');
          setStorefrontSection('catalog');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateAccount={() => setAccountOpen(true)}
        onNavigateAdmin={navigateToAdmin}
        onNavigatePcBuilder={() => {
          setStorefrontSection('pc_builder');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {storefrontSection === 'home' && (
          <>
            <HeroBanner
              onBrowseCatalog={() => {
                setStorefrontSection('catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenTrackOrder={() => setTrackOrderOpen(true)}
              onOpenPcBuilder={() => {
                setStorefrontSection('pc_builder');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Hardware Category Browse Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-slate-800/80">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {language === 'bn' ? 'কম্পিউটার ও গেমিং ক্যাটাগরি' : 'Browse Hardware Categories'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {language === 'bn' ? 'আপনার প্রয়োজনীয় কম্পোনেন্ট ও ডিভাইস বেছে নিন' : 'Official distributor warranty on all components'}
                  </p>
                </div>
                <button
                  onClick={() => setStorefrontSection('catalog')}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  {language === 'bn' ? 'সকল পণ্য দেখুন →' : 'View All →'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {categories.slice(0, 6).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setInitialCategorySlug(cat.slug);
                      setStorefrontSection('catalog');
                    }}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-900 transition-all text-center flex flex-col items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                      {language === 'bn' ? cat.nameBn : cat.nameEn}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Store Catalog Section (Strict Catalog Rule Compliance: clean empty state when 0 products) */}
            <StoreCatalog
              products={products}
              categories={categories}
              brands={brands}
              loading={loadingCatalog}
              onQuickView={(p) => setActiveDetailProduct(p)}
              onNavigateAdmin={navigateToAdmin}
              initialCategorySlug={initialCategorySlug}
            />
          </>
        )}

        {storefrontSection === 'catalog' && (
          <StoreCatalog
            products={products}
            categories={categories}
            brands={brands}
            loading={loadingCatalog}
            onQuickView={(p) => setActiveDetailProduct(p)}
            onNavigateAdmin={navigateToAdmin}
            initialCategorySlug={initialCategorySlug}
          />
        )}

        {storefrontSection === 'pc_builder' && (
          <PcBuilder
            products={products}
            onBackToCatalog={() => setStorefrontSection('catalog')}
            onQuickView={(p) => setActiveDetailProduct(p)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigateCatalog={() => setStorefrontSection('catalog')}
        onOpenTrackOrder={() => setTrackOrderOpen(true)}
        onOpenSupport={() => setSupportOpen(true)}
        onNavigateAdmin={navigateToAdmin}
      />

      {/* Modals & Drawers */}
      <CartDrawer onProceedToCheckout={() => setCheckoutOpen(true)} />

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onOrderSuccess={() => {
          fetchCatalog();
        }}
      />

      <ProductDetailModal
        product={activeDetailProduct}
        onClose={() => setActiveDetailProduct(null)}
        onOpenCheckout={() => setCheckoutOpen(true)}
        onRequireLogin={() => setAccountOpen(true)}
      />

      <OrderTrackingModal
        isOpen={trackOrderOpen}
        onClose={() => setTrackOrderOpen(false)}
      />

      <SupportModal
        isOpen={supportOpen}
        onClose={() => setSupportOpen(false)}
      />

      <CustomerDashboard
        isOpen={accountOpen}
        onClose={() => setAccountOpen(false)}
        onOpenTrackOrder={() => {
          setAccountOpen(false);
          setTrackOrderOpen(true);
        }}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={products}
        onSelectProduct={(p) => setActiveDetailProduct(p)}
      />

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
