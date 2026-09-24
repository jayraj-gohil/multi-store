import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health/health.routes.js';

/**
 * Everything registered here is served under /api/v1 (see app.ts).
 * Add each business module with its own prefix, e.g.:
 *
 *   await app.register(userRoutes, { prefix: '/users' });
 */
export async function apiV1Routes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes);
}
