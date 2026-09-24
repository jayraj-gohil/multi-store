import { useEffect, useState, type FormEvent } from 'react';
import { ErrorMessage } from '../../components/ErrorMessage';
import { CheckCircleIcon, RupeeIcon, TagIcon } from '../../components/icons';
import { Loader } from '../../components/Loader';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { StatCard } from '../../components/StatCard';
import { usePagination } from '../../hooks/usePagination';
import { getApiErrorMessage } from '../../services/api';
import { createPlatformDiscount, createProductDiscount, listDiscounts } from '../../services/discounts.service';
import { listProductsAdmin } from '../../services/products.service';
import type { PlatformDiscount, Product, ProductDiscount } from '../../types/domain';

export function AdminDiscountsPage() {
  const [productDiscounts, setProductDiscounts] = useState<ProductDiscount[] | null>(null);
  const [platformDiscounts, setPlatformDiscounts] = useState<PlatformDiscount[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [productForm, setProductForm] = useState({ productId: '', minimumQuantity: '', discountPercentage: '' });
  const [platformForm, setPlatformForm] = useState({ minimumOrderAmount: '', discountPercentage: '' });
  const [submitting, setSubmitting] = useState(false);
  const productPagination = usePagination(productDiscounts ?? [], 5);
  const platformPagination = usePagination(platformDiscounts ?? [], 5);
  // Configuring a discount for an inactive product isn't useful — it can't be ordered anyway.
  const activeProducts = products.filter((p) => p.isActive);

  const load = () => {
    listDiscounts()
      .then(({ productDiscounts, platformDiscounts }) => {
        setProductDiscounts(productDiscounts);
        setPlatformDiscounts(platformDiscounts);
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err)));
  };

  useEffect(() => {
    load();
    listProductsAdmin().then(setProducts).catch(() => undefined);
  }, []);

  const submitProductDiscount = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createProductDiscount(
        productForm.productId,
        Number(productForm.minimumQuantity),
        Number(productForm.discountPercentage),
      );
      setProductForm({ productId: '', minimumQuantity: '', discountPercentage: '' });
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const submitPlatformDiscount = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createPlatformDiscount(Number(platformForm.minimumOrderAmount), Number(platformForm.discountPercentage));
      setPlatformForm({ minimumOrderAmount: '', discountPercentage: '' });
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const activeProductDiscount = productDiscounts?.filter((d) => d.isActive).length ?? 0;
  const activePlatformDiscount = platformDiscounts?.filter((d) => d.isActive).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discounts"
        subtitle="Product and platform discounts are never combined — whichever saves the customer more is applied."
      />
      {error && <ErrorMessage message={error} />}

      {productDiscounts && platformDiscounts && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Product discounts" value={productDiscounts.length} icon={<TagIcon />} />
          <StatCard label="Platform discounts" value={platformDiscounts.length} icon={<RupeeIcon />} tone="violet" />
          <StatCard
            label="Currently active"
            value={activeProductDiscount + activePlatformDiscount}
            icon={<CheckCircleIcon />}
            tone="green"
          />
        </div>
      )}

      <section className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Product quantity discount</p>
          <form onSubmit={submitProductDiscount} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <select
              required
              value={productForm.productId}
              onChange={(e) => setProductForm({ ...productForm, productId: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select product…</option>
              {activeProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              required
              type="number"
              min="1"
              placeholder="Minimum quantity"
              value={productForm.minimumQuantity}
              onChange={(e) => setProductForm({ ...productForm, minimumQuantity: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              placeholder="Discount %"
              value={productForm.discountPercentage}
              onChange={(e) => setProductForm({ ...productForm, discountPercentage: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Save
            </button>
          </form>
        </div>
        {!productDiscounts && <Loader />}
        {productDiscounts && productDiscounts.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <ul className="divide-y divide-slate-100 text-sm">
              {productPagination.pageItems.map((d) => (
                <li key={d.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-slate-700">
                    <span className="font-medium text-slate-900">{d.product.name}</span>: {d.discountPercentage}%
                    off at {d.minimumQuantity}+ units
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                      d.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${d.isActive ? 'bg-green-600' : 'bg-slate-400'}`} />
                    {d.isActive ? 'Active' : 'Inactive'}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-slate-100 px-5 py-3">
              <Pagination
                page={productPagination.page}
                totalPages={productPagination.totalPages}
                totalItems={productPagination.totalItems}
                pageSize={productPagination.pageSize}
                onPageChange={productPagination.setPage}
              />
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Platform (order-level) discount
          </p>
          <form onSubmit={submitPlatformDiscount} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <input
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="Minimum order amount"
              value={platformForm.minimumOrderAmount}
              onChange={(e) => setPlatformForm({ ...platformForm, minimumOrderAmount: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              placeholder="Discount %"
              value={platformForm.discountPercentage}
              onChange={(e) => setPlatformForm({ ...platformForm, discountPercentage: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Save
            </button>
          </form>
        </div>
        {!platformDiscounts && <Loader />}
        {platformDiscounts && platformDiscounts.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <ul className="divide-y divide-slate-100 text-sm">
              {platformPagination.pageItems.map((d) => (
                <li key={d.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-slate-700">
                    {d.discountPercentage}% off orders ≥ ₹{d.minimumOrderAmount}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                      d.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${d.isActive ? 'bg-green-600' : 'bg-slate-400'}`} />
                    {d.isActive ? 'Active' : 'Inactive'}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-slate-100 px-5 py-3">
              <Pagination
                page={platformPagination.page}
                totalPages={platformPagination.totalPages}
                totalItems={platformPagination.totalItems}
                pageSize={platformPagination.pageSize}
                onPageChange={platformPagination.setPage}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
