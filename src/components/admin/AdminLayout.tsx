import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { BorkotTechLogo } from '../common/BorkotTechLogo';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  ShoppingBag, 
  Tags, 
  Tag, 
  MessageSquare, 
  Users, 
  Settings, 
  Database, 
  LogOut, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  UserCheck,
  Menu,
  X,
  RefreshCw
} from 'lucide-react';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onNavigateStorefront: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onNavigateStorefront,
  children
}) => {
  const { user, isAdmin, isSuperAdmin, isLoading, login, logout, setSession, authFetch } = useAuth();
  const { language } = useLanguage();

  // Setup check state
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  const [requiresSetupSecret, setRequiresSetupSecret] = useState(false);
  
  // Setup form fields
  const [setupAdminId, setSetupAdminId] = useState('');
  const [setupName, setSetupName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPhone, setSetupPhone] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState(false);

  // Admin login fields (supports Admin ID, Email, or Mobile Phone)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Owner Recovery Modal State
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [recoveryAction, setRecoveryAction] = useState<'start_fresh_setup' | 'reset_password'>('start_fresh_setup');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveryAdminId, setRecoveryAdminId] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  // Check if initial Super Admin setup is needed on mount
  useEffect(() => {
    let isMounted = true;
    const checkSetup = async () => {
      try {
        const res = await fetch('/api/admin/setup-status');
        const data = await res.json();
        if (isMounted) {
          setSetupRequired(Boolean(data.setupRequired));
          setRequiresSetupSecret(Boolean(data.requiresSetupSecret));
        }
      } catch (err) {
        console.error('Failed to verify admin setup status:', err);
        if (isMounted) {
          setSetupRequired(false);
        }
      }
    };
    checkSetup();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');

    if (setupPassword !== setupConfirmPassword) {
      setSetupError('Passwords do not match. Please ensure both password fields are identical.');
      return;
    }

    if (setupPassword.length < 8) {
      setSetupError('Password must be at least 8 characters long.');
      return;
    }

    setSetupLoading(true);

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: setupAdminId.trim() || undefined,
          name: setupName.trim(),
          email: setupEmail.trim(),
          phone: setupPhone.trim() || undefined,
          password: setupPassword,
          setupSecret: setupSecret.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Setup failed');
      }

      setSetupSuccess(true);
      setSession(data.user, data.token);
      setSetupRequired(false);
    } catch (err: any) {
      setSetupError(err.message || 'Setup error');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (!recoveryKey.trim()) {
      setRecoveryError('Please enter the server recovery authorization key.');
      return;
    }

    if (recoveryAction === 'reset_password') {
      if (!recoveryNewPassword || recoveryNewPassword.length < 8) {
        setRecoveryError('New password must be at least 8 characters long.');
        return;
      }
      if (recoveryNewPassword !== recoveryConfirmPassword) {
        setRecoveryError('New passwords do not match.');
        return;
      }
    }

    setRecoveryLoading(true);

    try {
      const res = await fetch('/api/admin/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoveryKey: recoveryKey.trim(),
          action: recoveryAction,
          adminId: recoveryAdminId.trim() || undefined,
          newPassword: recoveryAction === 'reset_password' ? recoveryNewPassword : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Recovery request rejected.');
      }

      if (recoveryAction === 'start_fresh_setup') {
        setRecoverySuccess(data.message || 'Administrator account cleared. Initial setup is now active.');
        setTimeout(() => {
          setRecoveryModalOpen(false);
          setSetupRequired(true);
          setRecoverySuccess('');
        }, 1200);
      } else {
        setRecoverySuccess('Password reset successfully. Signing you in...');
        if (data.user && data.token) {
          setSession(data.user, data.token);
          setTimeout(() => {
            setRecoveryModalOpen(false);
            setRecoverySuccess('');
          }, 800);
        }
      }
    } catch (err: any) {
      setRecoveryError(err.message || 'Recovery failed.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const loggedUser = await login(loginIdentifier.trim(), loginPassword);
      if (loggedUser.role === 'customer') {
        logout();
        throw new Error('Access denied: This account does not possess administrative privileges.');
      }
      if (window.location.pathname !== '/admin') {
        window.history.pushState(null, '', '/admin');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // 1. Session verification loading state (prevents premature redirect to login screen on refresh)
  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-xs text-slate-400 font-medium">Verifying administrator session...</p>
        </div>
      </div>
    );
  }

  // 2. Initial Setup Screen (when no super admin exists yet in database)
  if (setupRequired === true && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <BorkotTechLogo variant="full" theme="dark" subtitle="bn" className="mx-auto" />
            <h1 className="text-lg font-bold text-white pt-2">Initial Owner & Administrator Setup</h1>
            <p className="text-xs text-slate-400">
              Welcome to Borkot Tech. No active administrator account exists. Create your root Super Admin credentials below to take control of your store.
            </p>
          </div>

          {setupError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{setupError}</span>
            </div>
          )}

          {setupSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Super Admin initialized successfully. Redirecting to dashboard...</span>
            </div>
          )}

          <form onSubmit={handleInitialSetup} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">
                  Custom Admin ID <span className="text-[10px] text-slate-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={setupAdminId}
                  onChange={(e) => setSetupAdminId(e.target.value)}
                  placeholder="e.g. admin-borkot"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">Leave blank to auto-generate</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Owner Full Name *</label>
                <input
                  type="text"
                  required
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  placeholder="e.g. Borkot Hossain"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Official Admin Email *</label>
                <input
                  type="email"
                  required
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  placeholder="admin@borkottech.com.bd"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Official Mobile Phone</label>
                <input
                  type="tel"
                  value={setupPhone}
                  onChange={(e) => setSetupPhone(e.target.value)}
                  placeholder="+88017XXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Secure Password (min 8 chars) *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={setupConfirmPassword}
                  onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {requiresSetupSecret && (
              <div>
                <label className="block text-amber-400 font-semibold mb-1">Server Setup Secret (ADMIN_SETUP_SECRET) *</label>
                <input
                  type="password"
                  required
                  value={setupSecret}
                  onChange={(e) => setSetupSecret(e.target.value)}
                  placeholder="Enter secret from server environment"
                  className="w-full bg-slate-950 border border-amber-500/60 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Required because ADMIN_SETUP_SECRET is enforced on this server.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={setupLoading}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/20 active:scale-98 cursor-pointer"
            >
              {setupLoading ? 'Creating Super Admin...' : 'Create Administrator & Open Dashboard'}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-800">
            <button
              onClick={onNavigateStorefront}
              className="text-xs text-slate-400 hover:text-cyan-400 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              <span>Return to Customer Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Admin Login Screen (if not logged in as staff/admin)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <BorkotTechLogo variant="full" theme="dark" subtitle="bn" className="mx-auto" />
            <h1 className="text-lg font-bold text-white pt-2">Staff & Administrative Portal</h1>
            <p className="text-xs text-slate-400">
              Authorized staff access only. Enter your credentials to manage inventory, orders, and products.
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Admin ID, Staff Email, or Mobile Number</label>
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="e.g. admin-xxx, staff@borkottech.com.bd, or 017xxxxxxxx"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/20 active:scale-98 cursor-pointer"
            >
              {loginLoading ? 'Verifying Credentials...' : 'Sign In to Admin Portal'}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-800 space-y-3">
            <button
              type="button"
              onClick={() => {
                setRecoveryModalOpen(true);
                setRecoveryError('');
                setRecoverySuccess('');
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Forgotten Admin Credentials? / Owner Recovery</span>
            </button>

            <button
              onClick={onNavigateStorefront}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              <span>Return to Customer Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* OWNER RECOVERY MODAL */}
        {recoveryModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-sm font-bold text-white">Owner Account Recovery & Reset</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setRecoveryModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-slate-300 text-xs space-y-1">
                <p className="font-semibold text-cyan-300">Database Safety Guarantee:</p>
                <p className="text-[11px] text-slate-400">
                  Resetting or recovering admin credentials will <strong>never delete</strong> products, catalog items, orders, or customer accounts. An automatic backup is always generated before changes are saved.
                </p>
              </div>

              <div className="flex border-b border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setRecoveryAction('start_fresh_setup')}
                  className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
                    recoveryAction === 'start_fresh_setup' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Start Fresh Admin Setup
                </button>
                <button
                  type="button"
                  onClick={() => setRecoveryAction('reset_password')}
                  className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
                    recoveryAction === 'reset_password' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Reset Password Directly
                </button>
              </div>

              {recoveryError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{recoveryError}</span>
                </div>
              )}

              {recoverySuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{recoverySuccess}</span>
                </div>
              )}

              <form onSubmit={handleRecoverySubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Server Recovery Authorization Key *
                  </label>
                  <input
                    type="password"
                    required
                    value={recoveryKey}
                    onChange={(e) => setRecoveryKey(e.target.value)}
                    placeholder="Enter ADMIN_RECOVERY_KEY or local server key"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Configured via <code className="text-cyan-400 font-mono">ADMIN_RECOVERY_KEY</code> environment variable or checked in terminal via <code className="text-cyan-400 font-mono">npm run admin:tool --key</code>.
                  </p>
                </div>

                {recoveryAction === 'reset_password' && (
                  <div className="space-y-3 pt-1 border-t border-slate-800">
                    <div>
                      <label className="block text-slate-400 mb-1">Admin ID (Optional)</label>
                      <input
                        type="text"
                        value={recoveryAdminId}
                        onChange={(e) => setRecoveryAdminId(e.target.value)}
                        placeholder="Leave blank to keep existing ID"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">New Password (min 8 chars) *</label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={recoveryNewPassword}
                          onChange={(e) => setRecoveryNewPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Confirm New Password *</label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={recoveryConfirmPassword}
                          onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {recoveryAction === 'start_fresh_setup' && (
                  <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    Clicking <strong>Start Fresh Setup</strong> will clear the old forgotten administrator account and activate the First-Admin Setup wizard at <code className="text-cyan-400 font-mono">/admin</code>, allowing you to choose a new Admin ID, Name, Email, and Password.
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRecoveryModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                  >
                    {recoveryLoading ? 'Processing...' : recoveryAction === 'start_fresh_setup' ? 'Authorize Fresh Setup' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Authenticated Admin Dashboard Layout
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'products', label: 'Products & Catalog', icon: Package },
    { key: 'inventory', label: 'Inventory & Audit Logs', icon: Boxes },
    { key: 'orders', label: 'Order Management', icon: ShoppingBag },
    { key: 'categories_brands', label: 'Categories & Brands', icon: Tags },
    { key: 'coupons', label: 'Coupons & Promos', icon: Tag },
    { key: 'support_reviews', label: 'Customer Enquiries & Reviews', icon: MessageSquare },
    ...(isSuperAdmin ? [
      { key: 'staff', label: 'Staff & Roles', icon: Users },
      { key: 'settings', label: 'Store Settings', icon: Settings },
      { key: 'backup', label: 'Database Backup', icon: Database }
    ] : [])
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0">
        
        {/* Mobile Header (Phones & Tablets) */}
        <div className="flex items-center justify-between p-4 md:hidden">
          <BorkotTechLogo variant="full" theme="dark" subtitle="bn" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-cyan-400 uppercase bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60">
              {user?.role ? user.role.replace('_', ' ') : 'Admin'}
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              aria-label="Toggle Admin Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Sidebar & Mobile Dropdown Content */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block p-5 space-y-6`}>
          
          {/* Logo & Role Badge (Desktop only) */}
          <div className="hidden md:block space-y-3">
            <BorkotTechLogo variant="full" theme="dark" subtitle="bn" />
            <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-white">
                  {user?.name ? user.name.split(' ')[0] : (user?.id || 'Admin')}
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60">
                {user?.role ? user.role.replace('_', ' ') : 'Admin'}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onSelectTab(item.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

        </div>

        {/* Bottom Actions */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block p-5 border-t border-slate-800 space-y-2`}>
          <button
            onClick={() => {
              onNavigateStorefront();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <span>View Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {children}
      </main>

    </div>
  );
};
