import React, { useState, useEffect } from 'react';
import { Product, Category, Brand } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Archive, 
  Check, 
  AlertCircle, 
  Image, 
  Cpu, 
  Zap,
  CheckCircle2
} from 'lucide-react';
import { RichTextEditor } from '../common/RichTextEditor';



export const AdminProducts: React.FC = () => {
  const { authFetch } = useAuth();
  const { formatPrice, language } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [sku, setSku] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(undefined);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(2);
  const [warranty, setWarranty] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionBn, setDescriptionBn] = useState('');
  const [descLanguageTab, setDescLanguageTab] = useState<'en' | 'bn'>('en');
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);

  // Feedback
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        authFetch('/api/admin/products'),
        authFetch('/api/categories'),
        authFetch('/api/brands')
      ]);

      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) {
        const cats = await catRes.json();
        setCategories(cats);
        if (cats.length > 0 && !categoryId) setCategoryId(cats[0].id);
      }
      if (brandRes.ok) {
        const brs = await brandRes.json();
        setBrands(brs);
        if (brs.length > 0 && !brandId) setBrandId(brs[0].id);
      }
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setSku('');
    setNameEn('');
    setNameBn('');
    setCostPrice(0);
    setSellingPrice(0);
    setOriginalPrice(undefined);
    setStockQuantity(0);
    setLowStockThreshold(2);
    setWarranty('');
    setReturnPolicy('');
    setDescriptionEn('');
    setDescriptionBn('');
    setDescLanguageTab('en');
    setImageUrl('');
    setImageError('');
    setSpecs([]);
    setIsFeatured(false);
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };


  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setSku(p.sku);
    setNameEn(p.nameEn);
    setNameBn(p.nameBn);
    setCategoryId(p.categoryId);
    setBrandId(p.brandId);
    setCostPrice(p.costPrice || 0);
    setSellingPrice(p.sellingPrice);
    setOriginalPrice(p.originalPrice);
    setStockQuantity(p.stockQuantity);
    setLowStockThreshold(p.lowStockThreshold);
    setWarranty(p.warranty);
    setReturnPolicy(p.returnPolicy);
    setDescriptionEn(p.descriptionEn || '');
    setDescriptionBn(p.descriptionBn || '');
    setDescLanguageTab('en');
    setImageUrl(p.images[0] || '');
    setImageError('');
    setSpecs(p.specifications || []);
    setIsFeatured(p.isFeatured);
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleAddSpec = () => {
    if (specKey.trim() && specVal.trim()) {
      setSpecs([...specs, { key: specKey.trim(), value: specVal.trim() }]);
      setSpecKey('');
      setSpecVal('');
    }
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!sku.trim() || !nameEn.trim() || !nameBn.trim() || sellingPrice <= 0) {
      setFormError('SKU, English name, Bengali name, and a valid Selling Price are required.');
      return;
    }

    setSaving(true);
    const payload = {
      sku: sku.trim(),
      nameEn: nameEn.trim(),
      nameBn: nameBn.trim(),
      categoryId: categoryId || categories[0]?.id,
      brandId: brandId || brands[0]?.id,
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      stockQuantity: Number(stockQuantity) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 2,
      warranty: warranty.trim(),
      returnPolicy: returnPolicy.trim(),
      descriptionEn: descriptionEn || descriptionBn || '',
      descriptionBn: descriptionBn || descriptionEn || '',
      specifications: specs,
      images: imageUrl.trim() ? [imageUrl.trim()] : [],
      isFeatured
    };

    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setFormSuccess('Product saved to database successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        fetchData();
      }, 500);
    } catch (err: any) {
      setFormError(err.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setCatalogMessage('');
    setCatalogError('');
    try {
      const res = await authFetch(`/api/admin/products/${productToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setCatalogMessage(`Product "${productToDelete.name}" deleted successfully.`);
        setProductToDelete(null);
        fetchData();
      } else {
        const data = await res.json();
        setCatalogError(data.error || 'Failed to delete product');
      }
    } catch {
      setCatalogError('Network error while deleting product');
    }
  };

  const filteredProducts = products.filter(p =>
    p.nameEn.toLowerCase().includes(search.toLowerCase()) ||
    p.nameBn.includes(search) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Product Catalog Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Strict Catalog Rule: Products only appear in the store once added and verified by an administrator.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/20 active:scale-98 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {catalogMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{catalogMessage}</span>
        </div>
      )}

      {catalogError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{catalogError}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs max-w-md">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name, SKU, or brand..."
          className="bg-transparent border-none text-white focus:outline-none w-full placeholder-slate-500"
        />
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs">Loading product catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-3">
            <Cpu className="w-12 h-12 text-slate-700 mx-auto" />
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-bold text-white text-sm">Product Catalog is Currently Empty</h3>
              <p className="text-xs text-slate-500">
                In compliance with the Strict Product Catalog Rule, no fake or placeholder products exist. Click "Add New Product" to populate your authentic inventory.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Cost (BDT)</th>
                  <th className="p-3">Selling (BDT)</th>
                  <th className="p-3">Stock Level</th>
                  <th className="p-3">Warranty</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredProducts.map((p) => {
                  const isLow = p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0;
                  const isOut = p.stockQuantity === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-cyan-400">{p.sku}</td>
                      <td className="p-3">
                        <div className="font-semibold text-white">{p.nameEn}</div>
                        <div className="text-slate-500 text-[11px]">{p.nameBn}</div>
                      </td>
                      <td className="p-3 font-mono tabular-nums text-slate-400">{formatPrice(p.costPrice)}</td>
                      <td className="p-3 font-mono tabular-nums font-bold text-white">{formatPrice(p.sellingPrice)}</td>
                      <td className="p-3 font-mono tabular-nums">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          isOut ? 'bg-rose-950 text-rose-400 border border-rose-900' :
                          isLow ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                          'bg-emerald-950 text-emerald-400'
                        }`}>
                          {p.stockQuantity} units
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{p.warranty}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setProductToDelete({ id: p.id, name: p.nameEn })}
                          className="p-1.5 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 max-h-[92vh] flex flex-col my-auto">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-base font-bold text-white">
                {editingProduct ? 'Edit Product' : 'Add New Hardware Product'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}


            <form onSubmit={handleSaveProduct} className="overflow-y-auto space-y-4 text-xs pr-1">
              
              {/* Row 1: SKU & Names */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">SKU (Unique Code) *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="e.g. GPU-RTX4070-ROG"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Product Title (English) *</label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. ASUS ROG Strix GeForce RTX 4070 Ti 12GB Gaming"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Row 2: Bengali Title */}
              <div>
                <label className="block text-slate-400 mb-1">Product Title (Bengali / বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  placeholder="যেমন: আসুস রোগ স্ট্রিক্স জিফোর্স আরটিএক্স ৪০৭০ টিআই ১২জিবি গেমিং"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Row 3: Category & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameEn} ({c.nameBn})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Brand *</label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Pricing & Stock */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Cost Price (BDT)</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Selling Price (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-400 font-bold font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Low Stock Limit</label>
                  <input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Row 5: Warranty & Return Policy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Warranty Period</label>
                  <input
                    type="text"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    placeholder="e.g. 3 Years Official Replacement Warranty"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Return / Replacement Policy</label>
                  <input
                    type="text"
                    value={returnPolicy}
                    onChange={(e) => setReturnPolicy(e.target.value)}
                    placeholder="e.g. 3 Days DOA Replacement"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Row 6: Image URL or laptop upload */}
              <div>
                <label className="block text-slate-400 mb-1">Product Image URL / Upload from computer</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={imageUrl.startsWith('data:image/') ? '' : imageUrl}
                    onChange={(e) => { setImageUrl(e.target.value); setImageError(''); }}
                    placeholder="Paste a public https:// image URL here"
                    className="min-w-0 flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <label className="px-3 py-2 bg-cyan-600 text-slate-950 font-semibold rounded text-center whitespace-nowrap cursor-pointer hover:bg-cyan-500">
                    Choose Image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
                          setImageError('Please select a JPG, PNG, WEBP, or GIF image.');
                          e.target.value = '';
                          return;
                        }
                        if (file.size > 2 * 1024 * 1024) {
                          setImageError('Image must be 2 MB or smaller.');
                          e.target.value = '';
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setImageUrl(reader.result);
                            setImageError('');
                          }
                        };
                        reader.onerror = () => setImageError('Could not read this image. Please try another file.');
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => { setImageUrl(''); setImageError(''); }}
                    className="px-3 py-2 bg-slate-800 text-slate-300 rounded text-[11px] whitespace-nowrap cursor-pointer hover:text-white"
                  >
                    Clear image
                  </button>
                </div>
                {imageError && <p className="text-red-400 mt-2">{imageError}</p>}
                {imageUrl && <div className="mt-3 flex items-center gap-3">
                  <img src={imageUrl} alt="Product preview" className="h-20 w-20 rounded-lg border border-slate-700 object-contain bg-slate-950" />
                  <span className="text-slate-400 break-all">{imageUrl.startsWith('data:image/') ? 'Selected image ready to save' : 'Image URL preview'}</span>
                </div>}
              </div>

              {/* Row 7: Product Description Rich Text Editor */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">Product Description</span>
                    <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60">
                      Rich Text Editor
                    </span>
                  </div>

                  {/* Dual Language Switcher */}
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setDescLanguageTab('en')}
                      className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                        descLanguageTab === 'en'
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>English</span>
                      {descriptionEn.trim() && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescLanguageTab('bn')}
                      className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                        descLanguageTab === 'bn'
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>বাংলা (Bengali)</span>
                      {descriptionBn.trim() && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  </div>
                </div>

                <RichTextEditor
                  label={descLanguageTab === 'en' ? 'Product Description (English)' : 'Product Description (Bengali / বাংলা)'}
                  placeholder="Enter complete product details, features, specifications, warranty information, package contents, and other relevant information."
                  value={descLanguageTab === 'en' ? descriptionEn : descriptionBn}
                  onChange={(content) => {
                    if (descLanguageTab === 'en') {
                      setDescriptionEn(content);
                    } else {
                      setDescriptionBn(content);
                    }
                  }}
                  minHeight="280px"
                />
                <p className="text-[11px] text-slate-500">
                  Tip: Use headings, bullet lists, bold text, blockquotes, and links to format comprehensive product guides and specs. Fullscreen mode is available in the toolbar.
                </p>
              </div>

              {/* Row 8: Specifications Key/Value */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="font-semibold text-white block">Hardware Specifications</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={specKey}
                    onChange={(e) => setSpecKey(e.target.value)}
                    placeholder="Key (e.g. Memory)"
                    className="w-1/3 bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
                  />
                  <input
                    type="text"
                    value={specVal}
                    onChange={(e) => setSpecVal(e.target.value)}
                    placeholder="Value (e.g. 16GB GDDR6X 256-bit)"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="px-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold rounded cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {specs.map((s, idx) => (
                    <span key={idx} className="bg-slate-950 border border-slate-700 px-2 py-1 rounded text-[11px] flex items-center gap-1.5">
                      <span className="text-slate-400">{s.key}:</span>
                      <span className="text-white">{s.value}</span>
                      <button type="button" onClick={() => handleRemoveSpec(idx)} className="text-rose-400 hover:text-white ml-1">✕</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/20 active:scale-98 cursor-pointer"
                >
                  {saving ? 'Saving...' : (editingProduct ? 'Update Product' : 'Publish Product')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Delete Hardware Product</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to permanently delete <span className="font-semibold text-white">{productToDelete.name}</span> from the catalog? This will remove it from the customer store and inventory audit logs.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
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
