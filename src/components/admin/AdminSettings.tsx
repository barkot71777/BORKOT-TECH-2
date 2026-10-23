import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Settings, Save, Check, AlertCircle } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { authFetch } = useAuth();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/settings');
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update settings');
      }
    } catch {
      setError('Network error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="text-center py-12 text-slate-500 text-xs">Loading store configuration...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Store Configuration & Policies</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure business contacts, Dhaka showroom details, shipping rates, and mobile banking numbers.
        </p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>Store settings saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        
        {/* Contact & Showroom */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Showroom & Contact Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Official Hotline Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Official Sales Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Dhaka Showroom Address (English)</label>
            <input
              type="text"
              value={settings.showroomAddressEn}
              onChange={(e) => setSettings({ ...settings, showroomAddressEn: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Dhaka Showroom Address (Bengali / বাংলা)</label>
            <input
              type="text"
              value={settings.showroomAddressBn}
              onChange={(e) => setSettings({ ...settings, showroomAddressBn: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>
        </div>

        {/* Shipping Rates */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Shipping Charges (BDT)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Inside Dhaka City (৳)</label>
              <input
                type="number"
                value={settings.shippingInsideDhaka}
                onChange={(e) => setSettings({ ...settings, shippingInsideDhaka: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Outside Dhaka / Nationwide (৳)</label>
              <input
                type="number"
                value={settings.shippingOutsideDhaka}
                onChange={(e) => setSettings({ ...settings, shippingOutsideDhaka: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Free Delivery Threshold (৳)</label>
              <input
                type="number"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Payment Gateways */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Payment Gateways & Merchant Wallets
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">bKash Merchant Wallet</label>
              <input
                type="text"
                value={settings.bkashMerchantNumber}
                onChange={(e) => setSettings({ ...settings, bkashMerchantNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Nagad Merchant Wallet</label>
              <input
                type="text"
                value={settings.nagadMerchantNumber}
                onChange={(e) => setSettings({ ...settings, nagadMerchantNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Bank Transfer Details</label>
            <input
              type="text"
              value={settings.bankDetails}
              onChange={(e) => setSettings({ ...settings, bankDetails: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>
        </div>

        {/* Policies */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Warranty & DOA Return Policies
          </h2>

          <div>
            <label className="block text-slate-400 mb-1">Official Warranty Policy (English)</label>
            <textarea
              rows={2}
              value={settings.warrantyPolicyEn}
              onChange={(e) => setSettings({ ...settings, warrantyPolicyEn: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Official Warranty Policy (Bengali / বাংলা)</label>
            <textarea
              rows={2}
              value={settings.warrantyPolicyBn}
              onChange={(e) => setSettings({ ...settings, warrantyPolicyBn: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/20 active:scale-98 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
