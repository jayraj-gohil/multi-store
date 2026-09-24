import type { FastifyInstance } from 'fastify';
import { ok } from '../../common/utils/response.js';
import type { ZodTypeProvider } from '../../common/utils/validation.js';
import { listInventory, setInventory } from './inventory.service.js';
import { listInventoryQuery, setInventoryBody } from './inventory.schema.js';

export async function inventoryAdminRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const guard = { onRequest: [app.authenticate, app.authorize('ADMIN')] };

  r.get('/', { ...guard, schema: { querystring: listInventoryQuery } }, async (req) =>
    ok(await listInventory(req.query)),
  );

  r.put('/', { ...guard, schema: { body: setInventoryBody } }, async (req) =>
    ok(await setInventory(req.body)),
  );
}
