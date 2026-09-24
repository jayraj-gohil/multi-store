import { useEffect, useState } from 'react';
import { ErrorMessage } from '../../components/ErrorMessage';
import { ClipboardListIcon, RupeeIcon, TagIcon } from '../../components/icons';
import { Loader } from '../../components/Loader';
import { OrderSummaryTable } from '../../components/OrderSummaryTable';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { StatCard } from '../../components/StatCard';
import { usePagination } from '../../hooks/usePagination';
import { getApiErrorMessage } from '../../services/api';
import { listAllOrdersAdmin } from '../../services/orders.service';
import type { Order } from '../../types/domain';

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pagination = usePagination(orders ?? [], 5);

  useEffect(() => {
    listAllOrdersAdmin()
      .then(setOrders)
      .catch((err: unknown) => setError(getApiErrorMessage(err)));
  }, []);

  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.totalAmount), 0) ?? 0;
  const discountedCount = orders?.filter((o) => o.discountType !== null).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="All orders" subtitle="Every order placed across all customers." />
      {error && <ErrorMessage message={error} />}

      {orders && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total orders" value={orders.length} icon={<ClipboardListIcon />} />
          <StatCard label="Total revenue" value={`₹${totalRevenue.toFixed(2)}`} icon={<RupeeIcon />} tone="violet" />
          <StatCard label="Discounted orders" value={discountedCount} icon={<TagIcon />} tone="green" />
        </div>
      )}

      {!orders && <Loader label="Loading orders…" />}
      {orders && (
        <>
          <OrderSummaryTable orders={pagination.pageItems} showCustomer />
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setPage}
          />
        </>
      )}
    </div>
  );
}
