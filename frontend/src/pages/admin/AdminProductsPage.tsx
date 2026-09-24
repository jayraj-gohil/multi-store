import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { ErrorMessage } from '../../components/ErrorMessage';
import { BoxIcon, CheckCircleIcon, RupeeIcon, SlashCircleIcon } from '../../components/icons';
import { Loader } from '../../components/Loader';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { ProductThumbnail } from '../../components/ProductThumbnail';
import { StatCard } from '../../components/StatCard';
import { Toggle } from '../../components/Toggle';
import { usePagination } from '../../hooks/usePagination';
import { getApiErrorMessage } from '../../services/api';
import { createProduct, listProductsAdmin, updateProduct, uploadProductImage } from '../../services/products.service';
import type { Product } from '../../types/domain';

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', price: '', imageUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const visibleProducts = useMemo(() => {
    if (!products) return [];
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term),
    );
  }, [products, search]);
  const pagination = usePagination(visibleProducts, 8);

  const load = () => {
    listProductsAdmin()
      .then(setProducts)
      .catch((err: unknown) => setError(getApiErrorMessage(err)));
  };

  useEffect(load, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createProduct({
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        imageUrl: form.imageUrl || undefined,
      });
      setForm({ name: '', description: '', price: '', imageUrl: '' });
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setUploadingImage(true);
    setError(null);
    try {
      const url = await uploadProductImage(file);
      setForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleActive = async (product: Product) => {
    setTogglingId(product.id);
    try {
      await updateProduct(product.id, { isActive: !product.isActive });
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  const activeCount = products?.filter((p) => p.isActive).length ?? 0;
  const inactiveCount = (products?.length ?? 0) - activeCount;
  const avgPrice =
    products && products.length > 0
      ? products.reduce((sum, p) => sum + Number(p.price), 0) / products.length
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Products" subtitle="Manage your catalog and pricing." />
      {error && <ErrorMessage message={error} />}

      {products && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total products" value={products.length} icon={<BoxIcon />} />
          <StatCard label="Active" value={activeCount} icon={<CheckCircleIcon />} tone="green" />
          <StatCard label="Inactive" value={inactiveCount} icon={<SlashCircleIcon />} tone="amber" />
          <StatCard label="Average price" value={`₹${avgPrice.toFixed(2)}`} icon={<RupeeIcon />} tone="violet" />
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Quick add product</p>
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <input
            required
            placeholder="Product name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-2">
            <ProductThumbnail src={form.imageUrl || null} alt="" className="size-9" />
            <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-slate-300 px-3 py-2 text-center text-xs text-slate-500 hover:bg-slate-50">
              {uploadingImage ? 'Uploading…' : form.imageUrl ? 'Change image' : 'Upload image'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={onFileSelected}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>
          </div>
          <input
            required
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting || uploadingImage}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            + Add product
          </button>
        </form>
      </div>

      {products && products.length > 0 && (
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            pagination.setPage(1);
          }}
          placeholder="Search by name or description…"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm sm:max-w-xs"
        />
      )}

      {!products && <Loader label="Loading products…" />}
      {products && products.length > 0 && visibleProducts.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-slate-400">
          No products match "{search}".
        </div>
      )}
      {products && (visibleProducts.length > 0 || products.length === 0) && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {pagination.pageItems.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <ProductThumbnail src={p.imageUrl} alt={p.name} className="size-8" />
                      <span className="font-medium text-slate-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{p.description ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-600">₹{Number(p.price).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <Toggle
                      checked={p.isActive}
                      onChange={() => toggleActive(p)}
                      disabled={togglingId === p.id}
                      label={p.isActive ? 'Active' : 'Inactive'}
                    />
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                    No products yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="border-t border-slate-100 px-5 py-3">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
