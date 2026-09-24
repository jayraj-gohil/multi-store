import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ErrorMessage } from '../../components/ErrorMessage';
import { CheckCircleIcon, ClipboardListIcon, RupeeIcon, StoreIcon } from '../../components/icons';
import { Loader } from '../../components/Loader';
import { OrderSummaryTable } from '../../components/OrderSummaryTable';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { StatCard } from '../../components/StatCard';
import { useCart } from '../../context/CartContext';
import { usePagination } from '../../hooks/usePagination';
import { getApiErrorMessage } from '../../services/api';
import { listMyOrders } from '../../services/orders.service';
import { listAvailableProducts } from '../../services/products.service';
import type { Order, OrderStatus } from '../../types/domain';

type StatusFilter = 'ALL' | OrderStatus;
type SortOption = 'recent' | 'oldest' | 'total-desc' | 'total-asc';

function downloadCsv(orders: Order[]) {
  const rows = [
    ['Order ID', 'Date', 'Status', 'Product', 'Qty', 'Unit price', 'Discount', 'Line total', 'Order total'],
  ];
  for (const order of orders) {
    for (const item of order.items) {
      rows.push([
        order.id,
        new Date(order.createdAt).toISOString(),
        order.status,
        item.productNameSnapshot,
        String(item.quantity),
        item.unitPrice,
        item.discountAmount,
        item.lineTotal,
        order.totalAmount,
      ]);
    }
  }
  const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sort, setSort] = useState<SortOption>('recent');
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    listMyOrders()
      .then(setOrders)
      .catch((err: unknown) => setError(getApiErrorMessage(err)));
  }, []);

  const visibleOrders = useMemo(() => {
    if (!orders) return [];
    const term = search.trim().toLowerCase();
    let result = orders.filter((o) => {
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const matchesSearch =
        !term ||
        o.id.toLowerCase().includes(term) ||
        o.items.some((i) => i.productNameSnapshot.toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
    result = [...result];
    if (sort === 'oldest') result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    else if (sort === 'total-desc') result.sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount));
    else if (sort === 'total-asc') result.sort((a, b) => Number(a.totalAmount) - Number(b.totalAmount));
    else result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return result;
  }, [orders, search, statusFilter, sort]);

  const pagination = usePagination(visibleOrders, 5);

  const confirmedCount = orders?.filter((o) => o.status === 'CONFIRMED').length ?? 0;
  const totalSpent = orders?.reduce((sum, o) => sum + Number(o.totalAmount), 0) ?? 0;
  const totalSaved = orders?.reduce((sum, o) => sum + Number(o.discountAmount), 0) ?? 0;
  const storesUsed = new Set(
    orders?.flatMap((o) => o.items.flatMap((i) => i.allocations.map((a) => a.storeId))) ?? [],
  ).size;

  const handleReorder = async (order: Order) => {
    setNotice(null);
    setError(null);
    setReorderingOrderId(order.id);
    try {
      const liveProducts = await listAvailableProducts();
      const byId = new Map(liveProducts.map((p) => [p.id, p]));
      let added = 0;
      let unavailable = 0;
      for (const item of order.items) {
        const product = byId.get(item.productId);
        if (product && product.availableQuantity > 0) {
          addItem(product, Math.min(item.quantity, product.availableQuantity));
          added++;
        } else {
          unavailable++;
        }
      }
      if (added > 0) {
        setNotice(
          `Added ${added} item${added === 1 ? '' : 's'} to your cart.` +
            (unavailable > 0 ? ` ${unavailable} item(s) are no longer available.` : ''),
        );
      } else {
        setError('None of the items in this order are currently available to reorder.');
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setReorderingOrderId(null);
    }
  };

  const statusFilters: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: 'All Orders' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="My orders" subtitle="Everything you've ordered, most recent first.">
        {orders && orders.length > 0 && (
          <button
            type="button"
            onClick={() => downloadCsv(visibleOrders)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
        )}
        <Link
          to="/products"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Shop more products
        </Link>
      </PageHeader>
      {error && <ErrorMessage message={error} />}
      {notice && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {notice}
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total orders" value={orders.length} icon={<ClipboardListIcon />} />
          <StatCard
            label="Confirmed"
            value={confirmedCount}
            sub={`of ${orders.length}`}
            icon={<CheckCircleIcon />}
            tone="green"
          />
          <StatCard label="Total spent" value={`₹${totalSpent.toFixed(2)}`} icon={<RupeeIcon />} tone="violet" />
          <StatCard label="Stores used" value={storesUsed} icon={<StoreIcon />} />
        </div>
      )}
      {totalSaved > 0 && <p className="text-xs text-slate-500">You've saved ₹{totalSaved.toFixed(2)} in discounts across all orders.</p>}

      {orders && orders.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              pagination.setPage(1);
            }}
            placeholder="Search by order ID or item…"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  setStatusFilter(f.value);
                  pagination.setPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  statusFilter === f.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="recent">Sort: Most recent</option>
            <option value="oldest">Sort: Oldest first</option>
            <option value="total-desc">Sort: Highest total</option>
            <option value="total-asc">Sort: Lowest total</option>
          </select>
        </div>
      )}

      {!orders && <Loader label="Loading orders…" />}
      {orders && orders.length > 0 && visibleOrders.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-slate-400">
          No orders match your search or filter.
        </div>
      )}
      {orders && (visibleOrders.length > 0 || orders.length === 0) && (
        <>
          <OrderSummaryTable
            orders={pagination.pageItems}
            onReorder={handleReorder}
            reorderingOrderId={reorderingOrderId}
          />
          {visibleOrders.length > 0 && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
