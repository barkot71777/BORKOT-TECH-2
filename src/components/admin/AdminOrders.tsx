import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AdminInvoiceModal } from './AdminInvoiceModal';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Printer, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  FileText,
  Check,
  AlertTriangle
} from 'lucide-react';

interface AdminOrdersProps {
  initialSelectedOrder?: Order | null;
  onClearInitialOrder?: () => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  initialSelectedOrder,
  onClearInitialOrder
}) => {
  const { authFetch } = useAuth();
  const { formatPrice, language } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Selected Order for detail & update modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pending');
  const [statusNote, setStatusNote] = useState('');
  const [courierName, setCourierName] = useState('Pathao Courier');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'all' ? '/api/admin/orders' : `/api/admin/orders?status=${statusFilter}`;
      const res = await authFetch(url);
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  useEffect(() => {
    if (initialSelectedOrder) {
      openOrderDetails(initialSelectedOrder);
      onClearInitialOrder?.();
    }
  }, [initialSelectedOrder]);

  const openOrderDetails = (ord: Order) => {
    setSelectedOrder(ord);
    setSelectedStatus(ord.orderStatus);
    setStatusNote('');
    setCourierName(ord.courierName || 'Pathao Courier');
    setTrackingNumber(ord.trackingNumber || '');
    setActionError('');
    setActionSuccess('');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsUpdating(true);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await authFetch(`/api/admin/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          note: statusNote.trim() || undefined,
          courierName: selectedStatus === 'shipped' ? courierName : undefined,
          trackingNumber: selectedStatus === 'shipped' ? trackingNumber.trim() : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }

      setSelectedOrder(data.order);
      setActionSuccess(`Order status transitioned to "${selectedStatus.toUpperCase()}" successfully.`);
      fetchOrders();
    } catch (err: any) {
      setActionError(err.message || 'Error updating order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVerifyPayment = async (orderId: string, status: 'verified' | 'failed') => {
    setActionError('');
    setActionSuccess('');
    try {
      const res = await authFetch(`/api/admin/orders/${orderId}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: status })
      });
      if (res.ok) {
        const data = await res.json();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
        setActionSuccess(`Payment status updated to "${status.toUpperCase()}".`);
        fetchOrders();
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to update payment status');
      }
    } catch {
      setActionError('Error verifying payment');
    }
  };

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.customerPhone.includes(search)
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Order Processing & Fulfillment</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track status progression, verify mobile payments (bKash/Nagad), and issue official tax invoices.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between text-xs">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order #, customer name, or phone..."
            className="bg-transparent border-none text-white focus:outline-none w-full placeholder-slate-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="text-xs">No orders found matching the criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total Payable</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Order Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-cyan-400">
                      {ord.orderNumber}
                      <span className="block text-[10px] text-slate-500 font-sans">
                        {new Date(ord.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{ord.customerName}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{ord.customerPhone}</div>
                      <div className="text-[11px] text-slate-400">{ord.deliveryAddress.district}, {ord.deliveryAddress.division}</div>
                    </td>
                    <td className="p-3 text-slate-300">
                      {ord.items.length} items
                      <span className="block text-[10px] text-slate-500 truncate max-w-xs">
                        {ord.items.map(i => i.nameEn).join(', ')}
                      </span>
                    </td>
                    <td className="p-3 font-mono tabular-nums font-bold text-white">
                      {formatPrice(ord.totalAmount)}
                    </td>
                    <td className="p-3">
                      <div className="uppercase font-mono text-[10px] text-slate-300">{ord.paymentMethod}</div>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        ord.paymentStatus === 'verified' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        ord.paymentStatus === 'failed' ? 'bg-rose-950 text-rose-400' :
                        'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {ord.paymentStatus}
                      </span>
                    </td>
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
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => openOrderDetails(ord)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-xs font-semibold cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => setInvoiceOrder(ord)}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                        title="Print Tax Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail & Status Transition Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 max-h-[92vh] flex flex-col my-auto space-y-5">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase">Managing Order</span>
                <h2 className="text-base font-bold text-white font-mono">{selectedOrder.orderNumber}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInvoiceOrder(selectedOrder)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Invoice</span>
                </button>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white p-1">
                  ✕
                </button>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {actionSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <div className="overflow-y-auto space-y-5 text-xs pr-1">
              
              {/* Customer & Destination Card */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Customer Contact</span>
                  <div className="font-semibold text-white">{selectedOrder.customerName}</div>
                  <div className="text-slate-400 font-mono">{selectedOrder.customerPhone}</div>
                  {selectedOrder.customerEmail && <div className="text-slate-400">{selectedOrder.customerEmail}</div>}
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Destination Address</span>
                  <p className="text-slate-300 leading-relaxed">{selectedOrder.deliveryAddress.address}</p>
                  <div className="text-slate-400">
                    {selectedOrder.deliveryAddress.upazila}, {selectedOrder.deliveryAddress.district}, {selectedOrder.deliveryAddress.division}
                  </div>
                </div>
              </div>

              {/* Items Card */}
              <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-cyan-400 uppercase">{it.sku}</span>
                      <h4 className="font-semibold text-white">{it.nameEn}</h4>
                      <span className="text-slate-500">{it.quantity} x {formatPrice(it.price)}</span>
                    </div>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {formatPrice(it.price * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Payment Verification Card */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Payment Method & Status</span>
                  <span className="font-mono uppercase text-cyan-400">{selectedOrder.paymentMethod}</span>
                </div>

                {selectedOrder.paymentDetails?.transactionId && (
                  <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-[11px] flex justify-between">
                    <span className="text-slate-400">Transaction ID (TrxID):</span>
                    <span className="text-cyan-300 font-bold">{selectedOrder.paymentDetails.transactionId}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Current Status: <strong className="text-white uppercase">{selectedOrder.paymentStatus}</strong></span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleVerifyPayment(selectedOrder.id, 'verified')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold cursor-pointer"
                    >
                      Verify Received
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyPayment(selectedOrder.id, 'failed')}
                      className="px-3 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded font-semibold cursor-pointer"
                    >
                      Mark Failed
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Transition Form */}
              <form onSubmit={handleUpdateStatus} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Update Fulfillment Status
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">New Order Status *</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing & Packing</option>
                      <option value="shipped">Shipped via Courier</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled (Restores Reserved Stock)</option>
                      <option value="returned">Returned</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Internal Note / Reason</label>
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="e.g. Verified customer by phone call"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {selectedStatus === 'shipped' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Courier Partner *</label>
                      <select
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Pathao Courier">Pathao Courier</option>
                        <option value="Steadfast Courier">Steadfast Courier</option>
                        <option value="RedX Logistics">RedX Logistics</option>
                        <option value="Sundarban Courier Service">Sundarban Courier Service</option>
                        <option value="eCourier">eCourier</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Courier Tracking Code *</label>
                      <input
                        type="text"
                        required
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="e.g. PTH-891024"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    {isUpdating ? 'Saving...' : 'Update Status & Audit Log'}
                  </button>
                </div>
              </form>

              {/* Status Audit Log */}
              <div className="space-y-2">
                <span className="font-bold text-slate-400 uppercase text-[10px] block">Order Event Timeline</span>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {selectedOrder.auditLog.map((log, i) => (
                    <div key={i} className="p-2 bg-slate-950/70 border border-slate-800 rounded flex justify-between">
                      <span className="text-slate-300">
                        [{log.status.toUpperCase()}] {log.note}
                      </span>
                      <span className="text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Invoice Modal Preview & Print */}
      {invoiceOrder && (
        <AdminInvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
      )}

    </div>
  );
};
