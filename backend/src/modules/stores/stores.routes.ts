import type { FastifyInstance } from 'fastify';
import { ok } from '../../common/utils/response.js';
import type { ZodTypeProvider } from '../../common/utils/validation.js';
import { createStore, listStores, updateStore } from './stores.service.js';
import { createStoreBody, storeParams, updateStoreBody } from './stores.schema.js';

export async function storeAdminRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const guard = { onRequest: [app.authenticate, app.authorize('ADMIN')] };

  r.get('/', guard, async () => ok(await listStores()));

  r.post('/', { ...guard, schema: { body: createStoreBody } }, async (req, reply) =>
    reply.status(201).send(ok(await createStore(req.body))),
  );

  r.patch(
    '/:id',
    { ...guard, schema: { params: storeParams, body: updateStoreBody } },
    async (req) => ok(await updateStore(req.params.id, req.body)),
  );
}
