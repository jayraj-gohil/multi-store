import type { FastifyInstance } from 'fastify';
import { ok } from '../../common/utils/response.js';
import { checkDatabaseConnection } from '../../config/database.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  // Liveness: the process is up and serving requests. No external dependencies.
  app.get('/health', async () => ({ success: true, message: 'API is running' }));

  // Readiness: the API can reach PostgreSQL.
  app.get('/health/ready', async (_request, reply) => {
    const databaseConnected = await checkDatabaseConnection();
    if (!databaseConnected) {
      return reply.status(503).send({ success: false, message: 'Database unavailable' });
    }
    return ok({ database: 'connected' }, 'API is ready');
  });
}
