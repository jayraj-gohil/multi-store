import type { FastifyInstance } from 'fastify';
import { authRoutes } from './auth/auth.routes.js';
import { discountAdminRoutes } from './discounts/discounts.routes.js';
import { healthRoutes } from './health/health.routes.js';
import { inventoryAdminRoutes } from './inventory/inventory.routes.js';
import { orderAdminRoutes, orderCustomerRoutes } from './orders/orders.routes.js';
import { productAdminRoutes, productPublicRoutes } from './products/products.routes.js';
import { storeAdminRoutes } from './stores/stores.routes.js';

/** Everything registered here is served under /api/v1 (see app.ts). */
export async function apiV1Routes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes);

  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(productPublicRoutes, { prefix: '/products' });
  await app.register(orderCustomerRoutes, { prefix: '/orders' });

  await app.register(storeAdminRoutes, { prefix: '/admin/stores' });
  await app.register(productAdminRoutes, { prefix: '/admin/products' });
  await app.register(inventoryAdminRoutes, { prefix: '/admin/inventory' });
  await app.register(discountAdminRoutes, { prefix: '/admin' });
  await app.register(orderAdminRoutes, { prefix: '/admin/orders' });
}
