import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ErrorMessage } from '../../components/ErrorMessage';
import { MapPinIcon, TrashIcon } from '../../components/icons';
import { PageHeader } from '../../components/PageHeader';
import { ProductThumbnail } from '../../components/ProductThumbnail';
import { useCart } from '../../context/CartContext';
import { getApiErrorMessage } from '../../services/api';
import { placeOrder } from '../../services/orders.service';

export function CartPage() {
  const { lines, removeItem, setQuantity, clear } = useCart();
  const navigate = useNavigate();
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  const estimatedSubtotal = lines.reduce(
    (sum, l) => sum + Number(l.product.price) * l.quantity,
    0,
  );
  // Stock snapshots were taken when the product list loaded, so this is a best-effort client
  // check — the backend always re-validates and is authoritative at checkout regardless.
  const hasOverStockLine = lines.some((l) => l.quantity > l.product.availableQuantity);
  const totalItems = lines.reduce((sum, l) => sum + l.quantity, 0);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLatitude(String(pos.coords.latitude));
      setLongitude(String(pos.coords.longitude));
    });
  };

  const checkout = async () => {
    setError(null);
    if (hasOverStockLine) {
      setError('One or more items in your cart exceed available stock. Reduce the quantity to continue.');
      return;
    }
    if (!latitude || !longitude) {
      setError('Enter your delivery latitude and longitude (or use "Use my location").');
      return;
    }
    setPlacing(true);
    try {
      const order = await placeOrder(
        lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        Number(latitude),
        Number(longitude),
      );
      clear();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Shopping Cart" subtitle="Review your items and delivery location before checkout." />
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-slate-400">
          Your cart is empty.{' '}
          <Link to="/products" className="text-slate-900 hover:underline">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Shopping Cart" subtitle="Review your items and delivery location before checkout." />
      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
              <p className="text-sm font-semibold text-slate-900">Cart Items</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {lines.length} product{lines.length === 1 ? '' : 's'}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Line total</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => {
                  const maxQty = l.product.availableQuantity;
                  const overStock = l.quantity > maxQty;
                  return (
                    <tr key={l.product.id} className="border-t border-slate-100">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <ProductThumbnail src={l.product.imageUrl} alt={l.product.name} className="size-9" />
                          <div>
                            <p className="font-medium text-slate-900">{l.product.name}</p>
                            <p className="text-xs text-green-700">✓ In stock</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">₹{Number(l.product.price).toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <div className="inline-flex items-center rounded-lg border border-slate-300">
                          <button
                            type="button"
                            onClick={() => setQuantity(l.product.id, Math.max(1, l.quantity - 1))}
                            className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-50"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={maxQty}
                            value={l.quantity}
                            onChange={(e) =>
                              setQuantity(l.product.id, Math.min(Math.max(1, Number(e.target.value)), maxQty))
                            }
                            className="w-12 border-x border-slate-300 px-1 py-1.5 text-center text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setQuantity(l.product.id, Math.min(maxQty, l.quantity + 1))}
                            className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-50"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        {overStock && <p className="mt-1 text-xs text-red-600">Only {maxQty} in stock</p>}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        ₹{(Number(l.product.price) * l.quantity).toFixed(2)}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => removeItem(l.product.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <TrashIcon /> Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
              <span>
                Estimated subtotal: <span className="font-medium text-slate-700">₹{estimatedSubtotal.toFixed(2)}</span>.
                Final pricing, discount and store allocation are confirmed by the server when you place the order.
              </span>
              <Link to="/products" className="shrink-0 font-medium text-slate-900 hover:underline">
                Continue shopping
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <MapPinIcon />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Delivery location</p>
                <p className="text-xs text-slate-500">Used to allocate your order from the nearest store.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={useMyLocation}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
              >
                Use my location
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-4 text-sm font-semibold text-slate-900">Order Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items ({totalItems})</span>
                <span>₹{estimatedSubtotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-3 flex justify-between border-t border-slate-100 pt-3">
              <div>
                <p className="font-semibold text-slate-900">Estimated total</p>
                <p className="text-xs text-slate-400">Recalculated by the server at checkout</p>
              </div>
              <p className="text-lg font-bold text-slate-900">₹{estimatedSubtotal.toFixed(2)}</p>
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
              Final pricing, discount and store allocation are confirmed by the server when you place
              the order — never trusted from this page.
            </div>
            <button
              type="button"
              onClick={checkout}
              disabled={placing || hasOverStockLine}
              className="mt-4 w-full rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {placing ? 'Placing order…' : 'Place order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
