import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Order, InventoryLog } from '../../types';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  XCircle, 
  Users, 
  ArrowRight, 
  RefreshCw 
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
  onViewOrder: (order: Order) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab, onViewOrder }) => {
  const { authFetch } = useAuth();
  const { formatPrice, language } = useLanguage();

  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
        <span>Loading authoritative store metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Operations & Analytics Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative, real-time database summaries for Borkot Tech Bangladesh.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Sales */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Sales</span>
          <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono tabular-nums">
            {formatPrice(metrics.totalSales)}
          </div>
          <span className="text-[10px] text-slate-500 block">Excluding cancelled orders</span>
        </div>

        {/* Total Orders */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Orders</span>
          <div className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums">
            {metrics.totalOrders}
          </div>
          <div className="text-[10px] text-amber-400 font-medium">
            {metrics.pendingOrders} awaiting processing
          </div>
        </div>

        {/* Catalog Products */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Verified Products</span>
          <div className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums">
            {metrics.totalProducts}
          </div>
          <span className="text-[10px] text-slate-500 block">
            {metrics.activeProducts} active in customer catalog
          </span>
        </div>

        {/* Stock Alerts */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Stock Alerts</span>
          <div className="flex items-center gap-4 pt-1">
            <div className="text-amber-400 font-bold font-mono text-lg">
              {metrics.lowStockCount} <span className="text-[10px] uppercase font-sans text-slate-400">Low</span>
            </div>
            <div className="text-rose-400 font-bold font-mono text-lg">
              {metrics.outOfStockCount} <span className="text-[10px] uppercase font-sans text-slate-400">Out</span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="text-[10px] text-cyan-400 hover:underline pt-0.5"
          >
            Manage inventory →
          </button>
        </div>

      </div>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Recent Customer Orders</h2>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-semibold"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {metrics.recentOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No orders registered yet. New customer orders will show here in real-time.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Destination</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {metrics.recentOrders.map((ord: Order) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-cyan-400">{ord.orderNumber}</td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{ord.customerName}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{ord.customerPhone}</div>
                    </td>
                    <td className="p-3 text-slate-400">{ord.deliveryAddress.district}, {ord.deliveryAddress.division}</td>
                    <td className="p-3 uppercase font-mono text-[11px]">{ord.paymentMethod}</td>
                    <td className="p-3 font-mono tabular-nums font-bold text-white">{formatPrice(ord.totalAmount)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ord.orderStatus === 'delivered' ? 'bg-emerald-950 text-emerald-400' :
                        ord.orderStatus === 'cancelled' ? 'bg-rose-950 text-rose-400' :
                        ord.orderStatus === 'shipped' ? 'bg-cyan-950 text-cyan-400' :
                        'bg-amber-950 text-amber-400'
                      }`}>
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onViewOrder(ord)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Inventory Audit Trail */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Recent Inventory Audit Records</h2>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-semibold"
          >
            <span>Full Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {metrics.recentLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No stock movements recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 text-xs">
              {metrics.recentLogs.map((log: InventoryLog) => (
                <div key={log.id} className="p-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 text-[11px] font-bold">{log.productSku}</span>
                      <span className="text-white font-medium">{log.productName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Reason: <span className="text-slate-300">{log.reason}</span> · By: <span className="text-slate-300">{log.adminName}</span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className={`font-bold tabular-nums ${log.quantityChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      Balance: {log.stockAfter}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
