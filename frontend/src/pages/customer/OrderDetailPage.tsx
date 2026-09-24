import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Loader } from '../../components/Loader';
import { OrderSummaryTable } from '../../components/OrderSummaryTable';
import { PageHeader } from '../../components/PageHeader';
import { ProductThumbnail } from '../../components/ProductThumbnail';
import { getApiErrorMessage } from '../../services/api';
import { createReturn, getOrder, getReturnableItems, listReturns } from '../../services/orders.service';
import type { Order, Return, ReturnableItem } from '../../types/domain';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [returnableItems, setReturnableItems] = useState<ReturnableItem[] | null>(null);
  const [returns, setReturns] = useState<Return[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    Promise.all([getOrder(id), getReturnableItems(id), listReturns(id)])
      .then(([o, ri, rh]) => {
        setOrder(o);
        setReturnableItems(ri);
        setReturns(rh);
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)));
  };

  useEffect(load, [id]);

  const setQuantity = (orderItemId: string, quantity: number, max: number) => {
    const clamped = Math.max(0, Math.min(quantity, max));
    setSelected((prev) => (clamped === 0 ? omit(prev, orderItemId) : { ...prev, [orderItemId]: clamped }));
  };

  const selectedItems = Object.entries(selected).filter(([, qty]) => qty > 0);

  const submitReturn = async () => {
    if (!id || selectedItems.length === 0) return;
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await createReturn(
        id,
        selectedItems.map(([orderItemId, quantity]) => ({ orderItemId, quantity })),
      );
      setSelected({});
      setSuccessMessage(`Return submitted — ₹${Number(result.return.totalReturnAmount).toFixed(2)} of goods returned.`);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const returnableWithStock = returnableItems?.filter((i) => i.returnableQuantity > 0) ?? [];
  const productByOrderItemId = new Map(
    order?.items.map((i) => [i.id, { name: i.productNameSnapshot, imageUrl: i.product.imageUrl }]) ?? [],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Order details" subtitle="Review your order and return items if needed." />
      {error && <ErrorMessage message={error} />}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {successMessage}
        </div>
      )}
      {!order && !error && <Loader label="Loading order…" />}
      {order && <OrderSummaryTable orders={[order]} />}

      {order && order.status === 'CONFIRMED' && returnableWithStock.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Return items</p>
          <p className="mb-4 text-xs text-slate-400">
            Select how many units of each item to return. The order amount and any discount are
            recalculated automatically — this does not process a payment refund.
          </p>
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-2">Product</th>
                <th className="py-2">Purchased</th>
                <th className="py-2">Already returned</th>
                <th className="py-2">Returnable</th>
                <th className="py-2">Return quantity</th>
              </tr>
            </thead>
            <tbody>
              {returnableWithStock.map((item) => (
                <tr key={item.orderItemId} className="border-t border-slate-100">
                  <td className="py-2">
                    <div className="flex items-center gap-2.5">
                      <ProductThumbnail src={item.productImageUrl} alt={item.productName} className="size-7" />
                      <span className="font-medium text-slate-900">{item.productName}</span>
                    </div>
                  </td>
                  <td className="py-2 text-slate-600">{item.purchasedQuantity}</td>
                  <td className="py-2 text-slate-600">{item.returnedQuantity}</td>
                  <td className="py-2 text-slate-600">{item.returnableQuantity}</td>
                  <td className="py-2">
                    <input
                      type="number"
                      min={0}
                      max={item.returnableQuantity}
                      value={selected[item.orderItemId] ?? 0}
                      onChange={(e) => setQuantity(item.orderItemId, Number(e.target.value), item.returnableQuantity)}
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={submitReturn}
            disabled={submitting || selectedItems.length === 0}
            className="mt-4 rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Submitting return…' : 'Submit return'}
          </button>
        </div>
      )}

      {returns && returns.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Return history</p>
          <ul className="divide-y divide-slate-100 text-sm">
            {returns.map((ret) => (
              <li key={ret.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-slate-500">{new Date(ret.createdAt).toLocaleString()}</span>
                  <span className="font-medium text-slate-900">₹{Number(ret.totalReturnAmount).toFixed(2)} returned</span>
                </div>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-500">
                  {ret.items.map((item) => {
                    const product = productByOrderItemId.get(item.orderItemId);
                    return (
                      <li key={item.id} className="flex items-center gap-2">
                        <ProductThumbnail src={product?.imageUrl ?? null} alt={product?.name ?? 'item'} className="size-5" />
                        <span>
                          {item.quantity} × {product?.name ?? 'item'} (₹{Number(item.unitPrice).toFixed(2)} each) —{' '}
                          {item.allocations.map((a) => `${a.store.name} (${a.quantity})`).join(', ')}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function omit<T extends Record<string, number>>(obj: T, key: string): T {
  const { [key]: _omitted, ...rest } = obj;
  return rest as T;
}
