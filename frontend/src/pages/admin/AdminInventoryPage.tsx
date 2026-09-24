import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ErrorMessage } from '../../components/ErrorMessage';
import { BoxIcon, LayersIcon, SlashCircleIcon } from '../../components/icons';
import { Loader } from '../../components/Loader';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { StatCard } from '../../components/StatCard';
import { usePagination } from '../../hooks/usePagination';
import { getApiErrorMessage } from '../../services/api';
import { listInventory, setInventory } from '../../services/inventory.service';
import { listProductsAdmin } from '../../services/products.service';
import { listStores } from '../../services/stores.service';
import type { InventoryRow, Product, Store } from '../../types/domain';

export function AdminInventoryPage() {
  const [rows, setRows] = useState<InventoryRow[] | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ storeId: '', productId: '', quantity: '' });
  const [submitting, setSubmitting] = useState(false);

  const visibleRows = useMemo(() => {
    if (!rows) return [];
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) => r.store.name.toLowerCase().includes(term) || r.product.name.toLowerCase().includes(term),
    );
  }, [rows, search]);
  const pagination = usePagination(visibleRows, 8);

  const load = () => {
    listInventory()
      .then(setRows)
      .catch((err: unknown) => setError(getApiErrorMessage(err)));
  };

  useEffect(() => {
    load();
    listStores().then(setStores).catch(() => undefined);
    listProductsAdmin().then(setProducts).catch(() => undefined);
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await setInventory(form.storeId, form.productId, Number(form.quantity));
      setForm({ storeId: '', productId: '', quantity: '' });
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const totalUnits = rows?.reduce((sum, r) => sum + r.quantity, 0) ?? 0;
  const outOfStockCount = rows?.filter((r) => r.quantity === 0).length ?? 0;
  // Inactive stores/products are never orderable, so don't offer them when assigning new stock.
  const activeStores = stores.filter((s) => s.isActive);
  const activeProducts = products.filter((p) => p.isActive);

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" subtitle="Stock levels for each product at each store." />
      {error && <ErrorMessage message={error} />}

      {rows && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Inventory records" value={rows.length} icon={<LayersIcon />} />
          <StatCard label="Total units" value={totalUnits} icon={<BoxIcon />} tone="violet" />
          <StatCard label="Out of stock" value={outOfStockCount} icon={<SlashCircleIcon />} tone="amber" />
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Set stock quantity</p>
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <select
            required
            value={form.storeId}
            onChange={(e) => setForm({ ...form, storeId: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select store…</option>
            {activeStores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            required
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
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
            min="0"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Set quantity
          </button>
        </form>
      </div>

      {rows && rows.length > 0 && (
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            pagination.setPage(1);
          }}
          placeholder="Search by store or product…"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm sm:max-w-xs"
        />
      )}

      {!rows && <Loader label="Loading inventory…" />}
      {rows && rows.length > 0 && visibleRows.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-slate-400">
          No inventory matches "{search}".
        </div>
      )}
      {rows && (visibleRows.length > 0 || rows.length === 0) && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Store</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {pagination.pageItems.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-700">{r.store.name}</td>
                  <td className="px-5 py-3 text-slate-700">{r.product.name}</td>
                  <td className="px-5 py-3 font-medium text-slate-900">{r.quantity}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-slate-400">
                    No inventory set yet.
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
