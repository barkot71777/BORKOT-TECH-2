import React from 'react';
import { Order } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { BorkotTechLogo } from '../common/BorkotTechLogo';
import { X, Printer } from 'lucide-react';

interface AdminInvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const AdminInvoiceModal: React.FC<AdminInvoiceModalProps> = ({ order, onClose }) => {
  const { formatPrice, language } = useLanguage();

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl p-8 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        
        {/* Controls - Hidden in print */}
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-200 no-print">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Invoice / Cash Memo Preview
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="overflow-y-auto space-y-6 text-xs p-2">
          
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b border-slate-300 pb-6">
            <div>
              <BorkotTechLogo variant="full" theme="light" subtitle="bn" />
              <p className="mt-2 text-slate-600 max-w-sm text-[11px] leading-relaxed">
                Store address: Configure your real business address in Admin Settings.
              </p>
              <p className="text-slate-600 text-[11px] font-mono">
                Contact: Configure your real phone number and email in Admin Settings.
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold mt-1">
                VAT/BIN: Add your verified registration number if applicable
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-900 font-bold rounded text-xs tracking-wider uppercase">
                INVOICE
              </span>
              <div className="font-mono text-sm font-bold text-slate-900 pt-1">
                {order.orderNumber}
              </div>
              <div className="text-slate-500 text-[11px]">
                Date: {new Date(order.createdAt).toLocaleDateString('en-GB')}
              </div>
              <div className="text-[11px]">
                <span className="text-slate-500">Payment: </span>
                <span className="font-bold uppercase">{order.paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Customer & Delivery Information */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="block font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-1">
                Billed To:
              </span>
              <div className="font-semibold text-slate-900 text-sm">{order.customerName}</div>
              <div className="text-slate-600 font-mono text-[11px]">{order.customerPhone}</div>
              {order.customerEmail && <div className="text-slate-600 text-[11px]">{order.customerEmail}</div>}
            </div>

            <div>
              <span className="block font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-1">
                Delivery Destination:
              </span>
              <div className="text-slate-800 text-[11px] leading-relaxed">
                {order.deliveryAddress.address}
              </div>
              <div className="text-slate-600 font-semibold text-[11px]">
                {order.deliveryAddress.upazila}, {order.deliveryAddress.district}, {order.deliveryAddress.division}
                {order.deliveryAddress.postalCode ? ` - ${order.deliveryAddress.postalCode}` : ''}
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-600 text-[11px] uppercase font-bold">
                <th className="py-2">SL</th>
                <th className="py-2">SKU</th>
                <th className="py-2">Product Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Total (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {order.items.map((item, index) => (
                <tr key={index} className="py-2">
                  <td className="py-2.5 font-mono text-slate-500">{index + 1}</td>
                  <td className="py-2.5 font-mono font-semibold text-cyan-800">{item.sku}</td>
                  <td className="py-2.5 font-medium">{item.nameEn}</td>
                  <td className="py-2.5 text-center font-mono">{item.quantity}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{formatPrice(item.price)}</td>
                  <td className="py-2.5 text-right font-mono font-semibold tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="flex justify-end pt-4 border-t border-slate-300">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono tabular-nums font-semibold">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono tabular-nums">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge:</span>
                <span className="font-mono tabular-nums">{formatPrice(order.deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t-2 border-slate-800 pt-2">
                <span>Grand Total:</span>
                <span className="font-mono text-base tabular-nums">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Warranty Terms & Authorized Signatures */}
          <div className="pt-8 grid grid-cols-2 gap-8 items-end border-t border-slate-200 text-[10px] text-slate-500">
            <div>
              <p className="font-bold uppercase text-slate-700 mb-1">Warranty & Return Terms:</p>
              <p>Refer to the warranty and return policy configured by the store and shown on the product details.</p>
              <p>Keep this invoice for your order records.</p>
            </div>

            <div className="text-center pt-8">
              <div className="border-t border-slate-400 w-48 mx-auto pt-1 font-semibold text-slate-800">
                Authorized Signatory & Seal
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">Borkot Tech (বরকত টেক)</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
