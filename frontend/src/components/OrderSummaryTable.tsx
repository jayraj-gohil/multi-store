import { Link } from 'react-router';
import { ProductThumbnail } from './ProductThumbnail';
import type { Order, OrderStatus } from '../types/domain';

const statusTone: Record<OrderStatus, string> = {
  CONFIRMED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

interface OrderSummaryTableProps {
  orders: Order[];
  showCustomer?: boolean;
  /** When provided, shows a "Reorder" button per order (customer context only). */
  onReorder?: (order: Order) => void;
  reorderingOrderId?: string | null;
}

/** Shared order rendering used by both the admin and customer order pages. */
export function OrderSummaryTable({ orders, showCustomer = false, onReorder, reorderingOrderId }: OrderSummaryTableProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-slate-400">
        No orders yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3 text-sm">
            {showCustomer ? (
              <span className="font-mono text-xs text-slate-400">#{order.id.slice(0, 8)}</span>
            ) : (
              <Link to={`/orders/${order.id}`} className="font-mono text-xs text-blue-600 hover:underline">
                #{order.id.slice(0, 8)}
              </Link>
            )}
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusTone[order.status]}`}>
              <span className="size-1.5 rounded-full bg-current" />
              {order.status}
            </span>
            <span className="text-slate-500">{new Date(order.createdAt).toLocaleString()}</span>
            {showCustomer && (
              <span className="font-medium text-slate-700">
                {order.customer.name} <span className="font-normal text-slate-400">({order.customer.email})</span>
              </span>
            )}
          </div>

          <table className="w-full text-sm">
            <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-2">Product</th>
                <th className="px-5 py-2">Qty</th>
                <th className="px-5 py-2">Unit price</th>
                <th className="px-5 py-2">Discount</th>
                <th className="px-5 py-2">Line total</th>
                <th className="px-5 py-2">Allocated from</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-5 py-2">
                    <div className="flex items-center gap-2.5">
                      <ProductThumbnail src={item.product.imageUrl} alt={item.productNameSnapshot} className="size-7" />
                      <span className="font-medium text-slate-900">{item.productNameSnapshot}</span>
                    </div>
                  </td>
                  <td className="px-5 py-2 text-slate-600">
                    {item.quantity}
                    {item.returnedQuantity > 0 && (
                      <span className="ml-1 text-xs text-amber-600">({item.returnedQuantity} returned)</span>
                    )}
                  </td>
                  <td className="px-5 py-2 text-slate-600">₹{Number(item.unitPrice).toFixed(2)}</td>
                  <td className="px-5 py-2 text-slate-600">₹{Number(item.discountAmount).toFixed(2)}</td>
                  <td className="px-5 py-2 font-medium text-slate-900">₹{Number(item.lineTotal).toFixed(2)}</td>
                  <td className="px-5 py-2 text-slate-500">
                    {item.allocations.map((a) => `${a.store.name} (${a.quantity})`).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50 px-5 py-3 text-sm">
            {onReorder ? (
              <button
                type="button"
                onClick={() => onReorder(order)}
                disabled={reorderingOrderId === order.id}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {reorderingOrderId === order.id ? 'Adding to cart…' : 'Reorder'}
              </button>
            ) : (
              <span />
            )}
            <div className="flex flex-wrap items-center justify-end gap-6">
              {Number(order.totalReturnedAmount) > 0 && (
                <span className="text-amber-600">
                  Originally ₹{Number(order.originalTotalAmount).toFixed(2)} · Returned ₹
                  {Number(order.totalReturnedAmount).toFixed(2)}
                </span>
              )}
              <span className="text-slate-500">Subtotal: ₹{Number(order.subtotal).toFixed(2)}</span>
              <span className="text-slate-500">
                Discount ({order.discountType ?? 'none'}): −₹{Number(order.discountAmount).toFixed(2)}
              </span>
              <span className="font-semibold text-slate-900">Total: ₹{Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
