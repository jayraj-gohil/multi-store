import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ErrorMessage } from '../../components/ErrorMessage';
import { CheckCircleIcon, SlashCircleIcon, StoreIcon } from '../../components/icons';
import { Loader } from '../../components/Loader';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { StatCard } from '../../components/StatCard';
import { Toggle } from '../../components/Toggle';
import { usePagination } from '../../hooks/usePagination';
import { getApiErrorMessage } from '../../services/api';
import { createStore, listStores, updateStore } from '../../services/stores.service';
import type { Store } from '../../types/domain';

export function AdminStoresPage() {
  const [stores, setStores] = useState<Store[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', address: '', latitude: '', longitude: '' });
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const visibleStores = useMemo(() => {
    if (!stores) return [];
    const term = search.trim().toLowerCase();
    if (!term) return stores;
    return stores.filter(
      (s) => s.name.toLowerCase().includes(term) || s.address.toLowerCase().includes(term),
    );
  }, [stores, search]);
  const pagination = usePagination(visibleStores, 8);

  const load = () => {
    listStores()
      .then(setStores)
      .catch((err: unknown) => setError(getApiErrorMessage(err)));
  };

  useEffect(load, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createStore({
        name: form.name,
        address: form.address,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      });
      setForm({ name: '', address: '', latitude: '', longitude: '' });
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (store: Store) => {
    setTogglingId(store.id);
    try {
      await updateStore(store.id, { isActive: !store.isActive });
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  const activeCount = stores?.filter((s) => s.isActive).length ?? 0;
  const inactiveCount = (stores?.length ?? 0) - activeCount;

  return (
    <div className="space-y-6">
      <PageHeader title="Stores" subtitle="Manage the physical locations that hold inventory." />
      {error && <ErrorMessage message={error} />}

      {stores && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total stores" value={stores.length} icon={<StoreIcon />} />
          <StatCard label="Active" value={activeCount} icon={<CheckCircleIcon />} tone="green" />
          <StatCard label="Inactive" value={inactiveCount} icon={<SlashCircleIcon />} tone="amber" />
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Add new store</p>
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <input
            required
            placeholder="Store name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-1"
          />
          <input
            required
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="number"
            step="any"
            placeholder="Latitude"
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="number"
            step="any"
            placeholder="Longitude"
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            + Add store
          </button>
        </form>
      </div>

      {stores && stores.length > 0 && (
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            pagination.setPage(1);
          }}
          placeholder="Search by name or address…"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm sm:max-w-xs"
        />
      )}

      {!stores && <Loader label="Loading stores…" />}
      {stores && stores.length > 0 && visibleStores.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-slate-400">
          No stores match "{search}".
        </div>
      )}
      {stores && (visibleStores.length > 0 || stores.length === 0) && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Address</th>
                <th className="px-5 py-3">Lat</th>
                <th className="px-5 py-3">Lng</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {pagination.pageItems.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{s.name}</td>
                  <td className="px-5 py-3 text-slate-600">{s.address}</td>
                  <td className="px-5 py-3 text-slate-500">{s.latitude}</td>
                  <td className="px-5 py-3 text-slate-500">{s.longitude}</td>
                  <td className="px-5 py-3">
                    <Toggle
                      checked={s.isActive}
                      onChange={() => toggleActive(s)}
                      disabled={togglingId === s.id}
                      label={s.isActive ? 'Active' : 'Inactive'}
                    />
                  </td>
                </tr>
              ))}
              {stores.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    No stores yet.
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
