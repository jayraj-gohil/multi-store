import { useEffect, useMemo, useState } from 'react';
import { ErrorMessage } from '../../components/ErrorMessage';
import { BoxIcon, SlashCircleIcon } from '../../components/icons';
import { Loader } from '../../components/Loader';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { ProductThumbnail } from '../../components/ProductThumbnail';
import { StatCard } from '../../components/StatCard';
import { useCart } from '../../context/CartContext';
import { usePagination } from '../../hooks/usePagination';
import { getApiErrorMessage } from '../../services/api';
import { listAvailableProducts } from '../../services/products.service';
import type { AvailableProduct } from '../../types/domain';

const LOW_STOCK_THRESHOLD = 10;

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Sort: Default' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

export function CustomerProductsPage() {
  const [products, setProducts] = useState<AvailableProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [added, setAdded] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('default');
  const { lines, addItem } = useCart();

  useEffect(() => {
    listAvailableProducts()
      .then(setProducts)
      .catch((err: unknown) => setError(getApiErrorMessage(err)));
  }, []);

  const visibleProducts = useMemo(() => {
    if (!products) return [];
    const term = search.trim().toLowerCase();
    const filtered = term
      ? products.filter(
          (p) => p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term),
        )
      : products;
    const sorted = [...filtered];
    if (sort === 'price-asc') sorted.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === 'price-desc') sorted.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === 'name-asc') sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [products, search, sort]);

  const pagination = usePagination(visibleProducts, 9);

  const inCartQuantity = (productId: string) =>
    lines.find((l) => l.product.id === productId)?.quantity ?? 0;

  const remainingStock = (product: AvailableProduct) =>
    Math.max(0, product.availableQuantity - inCartQuantity(product.id));

  const onAdd = (product: AvailableProduct) => {
    const remaining = remainingStock(product);
    if (remaining <= 0) return;
    // Never let the cart hold more of a product than is actually in stock.
    const qty = Math.min(quantities[product.id] ?? 1, remaining);
    addItem(product, qty);
    setQuantities({ ...quantities, [product.id]: 1 });
    setAdded(product.id);
    setTimeout(() => setAdded(null), 1200);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Products" subtitle="Browse what's in stock across our stores." />
      {error && <ErrorMessage message={error} />}

      {products && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Available products" value={products.length} icon={<BoxIcon />} />
          <StatCard
            label="Total units in stock"
            value={products.reduce((sum, p) => sum + p.availableQuantity, 0)}
            icon={<BoxIcon />}
            tone="violet"
          />
          <StatCard
            label="Low stock"
            value={products.filter((p) => p.availableQuantity < LOW_STOCK_THRESHOLD).length}
            icon={<SlashCircleIcon />}
            tone="amber"
          />
        </div>
      )}

      {products && products.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              pagination.setPage(1);
            }}
            placeholder="Search by name or description…"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortOption);
              pagination.setPage(1);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {!products && <Loader label="Loading products…" />}
      {products && products.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-slate-400">
          No products available right now.
        </div>
      )}
      {products && products.length > 0 && visibleProducts.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-slate-400">
          No products match "{search}".
        </div>
      )}
      {visibleProducts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pagination.pageItems.map((p) => {
            const remaining = remainingStock(p);
            const inCart = inCartQuantity(p.id);
            const lowStock = p.availableQuantity < LOW_STOCK_THRESHOLD;
            return (
              <div key={p.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
                <ProductThumbnail src={p.imageUrl} alt={p.name} className="mb-3 h-44 w-full" />
                <h2 className="font-semibold text-slate-900">{p.name}</h2>
                {p.description && <p className="mt-1 text-sm text-slate-500">{p.description}</p>}
                <p className="mt-2 text-lg font-bold text-slate-900">₹{Number(p.price).toFixed(2)}</p>
                <p className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className={`size-1.5 rounded-full ${lowStock ? 'bg-amber-500' : 'bg-green-500'}`} />
                  {p.availableQuantity} in stock{inCart > 0 && ` · ${inCart} already in cart`}
                </p>
                <div className="mt-auto flex items-center gap-2 pt-3">
                  <input
                    type="number"
                    min={1}
                    max={remaining || 1}
                    value={Math.min(quantities[p.id] ?? 1, remaining || 1)}
                    disabled={remaining <= 0}
                    onChange={(e) =>
                      setQuantities({
                        ...quantities,
                        [p.id]: Math.min(Math.max(1, Number(e.target.value)), remaining),
                      })
                    }
                    className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => onAdd(p)}
                    disabled={remaining <= 0}
                    className="flex-1 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {remaining <= 0 ? 'All in cart' : added === p.id ? 'Added ✓' : 'Add to cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {visibleProducts.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setPage}
          />
        </div>
      )}
    </div>
  );
}
