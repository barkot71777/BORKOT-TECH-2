import React, { useState, useEffect } from 'react';
import { Category, Brand } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Plus, Tags, Check, AlertCircle } from 'lucide-react';

export const AdminCategoriesBrands: React.FC = () => {
  const { authFetch } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // New Category Form
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameBn, setCatNameBn] = useState('');
  
  // New Brand Form
  const [brandName, setBrandName] = useState('');

  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, bRes] = await Promise.all([
        authFetch('/api/admin/categories'),
        authFetch('/api/brands')
      ]);
      if (cRes.ok) setCategories(await cRes.json());
      if (bRes.ok) setBrands(await bRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameEn.trim() || !catNameBn.trim()) return;
    setMessage('');
    setErrorMessage('');

    try {
      const res = await authFetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameEn: catNameEn.trim(),
          nameBn: catNameBn.trim(),
          displayOrder: categories.length + 1
        })
      });
      if (res.ok) {
        setCatNameEn('');
        setCatNameBn('');
        setMessage('Category created successfully');
        fetchData();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to add category');
      }
    } catch {
      setErrorMessage('Failed to add category due to a network error');
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;
    setMessage('');
    setErrorMessage('');

    try {
      const res = await authFetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: brandName.trim() })
      });
      if (res.ok) {
        setBrandName('');
        setMessage('Brand created successfully');
        fetchData();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to add brand');
      }
    } catch {
      setErrorMessage('Failed to add brand due to a network error');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Categories & Brands Taxonomy</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure product categories and hardware manufacturing brands available in Borkot Tech.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Categories Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Tags className="w-4 h-4 text-cyan-400" />
            <span>Store Categories ({categories.length})</span>
          </h2>

          <form onSubmit={handleAddCategory} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <span className="font-semibold text-slate-300 block">Add New Category</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={catNameEn}
                onChange={(e) => setCatNameEn(e.target.value)}
                placeholder="English Name (e.g. Mechanical Keyboards)"
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              />
              <input
                type="text"
                required
                value={catNameBn}
                onChange={(e) => setCatNameBn(e.target.value)}
                placeholder="বাংলা নাম (যেমন: মেকানিক্যাল কীবোর্ড)"
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded cursor-pointer"
            >
              Add Category
            </button>
          </form>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden max-h-80 overflow-y-auto text-xs">
            {categories.map((c) => (
              <div key={c.id} className="p-3 bg-slate-950 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white">{c.nameEn}</span>
                  <span className="text-slate-500 ml-2">({c.nameBn})</span>
                </div>
                <span className="text-cyan-400 font-mono text-[10px]">{c.slug}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Brands Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Tags className="w-4 h-4 text-cyan-400" />
            <span>Hardware Brands ({brands.length})</span>
          </h2>

          <form onSubmit={handleAddBrand} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <span className="font-semibold text-slate-300 block">Add New Brand</span>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Brand Name (e.g. NZXT, SteelSeries)"
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              />
              <button
                type="submit"
                className="px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded cursor-pointer whitespace-nowrap"
              >
                Add Brand
              </button>
            </div>
          </form>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden max-h-80 overflow-y-auto text-xs">
            {brands.map((b) => (
              <div key={b.id} className="p-3 bg-slate-950 flex items-center justify-between">
                <span className="font-semibold text-white">{b.name}</span>
                <span className="text-slate-500 font-mono text-[10px]">{b.slug}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
