import React, { useState, useEffect } from 'react';
import { Product, InventoryLog } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Boxes, 
  PlusCircle, 
  MinusCircle, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  AlertCircle 
} from 'lucide-react';

export const AdminInventory: React.FC = () => {
  const { authFetch } = useAuth();
  const { formatPrice, language } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [changeType, setChangeType] = useState<'stock_in' | 'stock_out' | 'manual_adjustment'>('stock_in');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, logRes] = await Promise.all([
        authFetch('/api/admin/products'),
        authFetch('/api/admin/inventory/logs')
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
        if (prodData.length > 0 && !selectedProductId) {
          setSelectedProductId(prodData[0].id);
        }
      }
      if (logRes.ok) {
        setLogs(await logRes.json());
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0 || !reason.trim()) {
      setErrorMsg('Product, positive quantity, and documented reason are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await authFetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          changeType,
          quantity: Number(quantity),
          reason: reason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to adjust stock');
      }

      setSuccessMsg(`Inventory updated successfully for ${data.product.nameEn}. New balance: ${data.product.stockQuantity}`);
      setReason('');
      setQuantity(1);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Stock adjustment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="space-y-8">
      
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Inventory Control & Audit Trails</h1>
        <p className="text-xs text-slate-400 mt-1">
          Perform transaction-safe stock receiving, damaged stock-out, and audit all warehouse movements.
        </p>
      </div>

      {/* Stock Adjustment Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Boxes className="w-4 h-4 text-cyan-400" />
          <span>Record Inventory Movement / Adjustment</span>
        </h2>

        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {products.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            No products found in database. Create products first under "Products & Catalog" to adjust inventory.
          </p>
        ) : (
          <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Target Product *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.nameEn} (Stock: {p.stockQuantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Adjustment Type *</label>
                <select
                  value={changeType}
                  onChange={(e) => setChangeType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="stock_in">Stock-In (New Shipment Received)</option>
                  <option value="stock_out">Stock-Out (Damaged / Return to Distributor)</option>
                  <option value="manual_adjustment">Manual Reconciliation</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Quantity Delta *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Mandatory Operational Reason / Reference *</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Shipment invoice #INV-4921 received from ASUS BD distributor"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {selectedProduct && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-[11px] text-slate-400">
                <span>Current Authoritative Stock: <strong className="text-white font-mono">{selectedProduct.stockQuantity} units</strong></span>
                <span>
                  Expected After Adjustment:{' '}
                  <strong className="text-cyan-400 font-mono">
                    {changeType === 'stock_in' ? selectedProduct.stockQuantity + quantity : Math.max(0, selectedProduct.stockQuantity - quantity)} units
                  </strong>
                </span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/20 active:scale-98 cursor-pointer"
              >
                {submitting ? 'Recording Transaction...' : 'Commit Stock Movement'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Historical Audit Trail Table */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <span>Full Inventory Movement Audit Log</span>
        </h2>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No inventory movements recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Action Type</th>
                    <th className="p-3">Delta</th>
                    <th className="p-3">Before → After</th>
                    <th className="p-3">Reason & Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200 font-mono text-[11px]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="p-3 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-GB')}
                      </td>
                      <td className="p-3 font-bold text-cyan-400">{log.productSku}</td>
                      <td className="p-3 font-sans text-white">{log.productName}</td>
                      <td className="p-3 uppercase text-[10px] text-slate-300">
                        {log.changeType.replace('_', ' ')}
                      </td>
                      <td className={`p-3 font-bold tabular-nums ${log.quantityChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                      </td>
                      <td className="p-3 text-slate-400 tabular-nums">
                        {log.stockBefore} → <span className="text-white font-bold">{log.stockAfter}</span>
                      </td>
                      <td className="p-3 font-sans text-slate-300">
                        <div>{log.reason}</div>
                        <span className="text-[10px] text-slate-500 font-mono">By: {log.adminName}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
