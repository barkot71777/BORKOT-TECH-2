import React, { useState, useEffect } from 'react';
import { Coupon } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Tag, Plus, Trash2, Power, Check, AlertCircle } from 'lucide-react';

export const AdminCoupons: React.FC = () => {
  const { authFetch } = useAuth();
  const { formatPrice, language } = useLanguage();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(500);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(5000);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(undefined);
  const [expiryDate, setExpiryDate] = useState('2026-12-31');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [couponToDelete, setCouponToDelete] = useState<{ id: string; code: string } | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/coupons');
      if (res.ok) setCoupons(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || discountValue <= 0 || !expiryDate) {
      setErrorMsg('Code, positive discount value, and expiry date required');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setMsg('');

    try {
      const res = await authFetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          discountType,
          discountValue: Number(discountValue),
          minOrderAmount: Number(minOrderAmount) || 0,
          maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
          expiryDate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create coupon');

      setMsg(`Coupon "${data.code}" created successfully`);
      setCode('');
      setDiscountValue(500);
      fetchCoupons();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCoupon = async (id: string) => {
    setErrorMsg('');
    setMsg('');
    try {
      const res = await authFetch(`/api/admin/coupons/${id}/toggle`, { method: 'PUT' });
      if (res.ok) {
        setMsg('Coupon status updated.');
        fetchCoupons();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to toggle coupon status');
      }
    } catch {
      setErrorMsg('Failed to toggle coupon status');
    }
  };

  const confirmDeleteCoupon = async () => {
    if (!couponToDelete) return;
    setErrorMsg('');
    setMsg('');
    try {
      const res = await authFetch(`/api/admin/coupons/${couponToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg(`Coupon "${couponToDelete.code}" deleted successfully.`);
        setCouponToDelete(null);
        fetchCoupons();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to delete coupon');
      }
    } catch {
      setErrorMsg('Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Coupons & Promotional Campaigns</h1>
        <p className="text-xs text-slate-400 mt-1">
          Create promotional discount codes for marketing campaigns in Bangladesh.
        </p>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Create Coupon Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>Create New Promo / Coupon Code</span>
        </h2>

        <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Coupon Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. EIDTECH2026"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Discount Type *</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="fixed">Fixed BDT Amount (৳)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Discount Value ({discountType === 'percentage' ? '%' : '৳'}) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Min Order Amount (৳)</label>
              <input
                type="number"
                min="0"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Max Discount Cap (Optional)</label>
              <input
                type="number"
                min="0"
                value={maxDiscount || ''}
                onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Unlimited if empty"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Expiration Date *</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-cyan-500/20"
            >
              {saving ? 'Creating...' : 'Publish Coupon'}
            </button>
          </div>
        </form>
      </div>

      {/* Coupons List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-slate-500 text-xs">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No coupons created yet.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-3">Coupon Code</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Min Order</th>
                <th className="p-3">Expiry</th>
                <th className="p-3">Times Used</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200 font-mono text-[11px]">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-cyan-400">{c.code}</td>
                  <td className="p-3 text-white">
                    {c.discountType === 'percentage' ? `${c.discountValue}%` : formatPrice(c.discountValue)}
                  </td>
                  <td className="p-3 text-slate-400">{formatPrice(c.minOrderAmount)}</td>
                  <td className="p-3 text-slate-400">{c.expiryDate}</td>
                  <td className="p-3 text-slate-300">{c.usageCount} times</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      c.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {c.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => handleToggleCoupon(c.id)}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        c.isActive ? 'bg-slate-800 text-slate-300 hover:text-amber-400' : 'bg-slate-800 text-emerald-400 hover:text-emerald-300'
                      }`}
                      title={c.isActive ? 'Disable Coupon' : 'Enable Coupon'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCouponToDelete({ id: c.id, code: c.code })}
                      className="p-1.5 bg-slate-800 text-rose-400 hover:text-rose-300 rounded transition-colors cursor-pointer"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {couponToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Delete Coupon</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete coupon <span className="font-mono text-cyan-400 font-bold">{couponToDelete.code}</span>? Customers will no longer be able to use this promotional code.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCouponToDelete(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCoupon}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
