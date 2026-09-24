import type { FastifyInstance } from 'fastify';
import { ok } from '../../common/utils/response.js';
import type { ZodTypeProvider } from '../../common/utils/validation.js';
import { createOrder, getOrderById, listAllOrders, listOrdersForCustomer } from './orders.service.js';
import { createOrderBody, orderParams } from './orders.schema.js';
import { createReturn, getReturnableItems, listReturnsForOrder } from './returns.service.js';
import { createReturnBody } from './returns.schema.js';

export async function orderCustomerRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const guard = { onRequest: [app.authenticate] };

  r.post('/', { ...guard, schema: { body: createOrderBody } }, async (req, reply) =>
    reply.status(201).send(ok(await createOrder(req.user.sub, req.body))),
  );

  r.get('/', guard, async (req) => ok(await listOrdersForCustomer(req.user.sub)));

  r.get('/:id', { ...guard, schema: { params: orderParams } }, async (req) =>
    ok(await getOrderById(req.params.id, req.user.sub, req.user.role)),
  );

  r.get('/:id/returnable-items', { ...guard, schema: { params: orderParams } }, async (req) =>
    ok(await getReturnableItems(req.params.id, req.user.sub, req.user.role)),
  );

  r.get('/:id/returns', { ...guard, schema: { params: orderParams } }, async (req) =>
    ok(await listReturnsForOrder(req.params.id, req.user.sub, req.user.role)),
  );

  r.post(
    '/:id/returns',
    { ...guard, schema: { params: orderParams, body: createReturnBody } },
    async (req, reply) => reply.status(201).send(ok(await createReturn(req.params.id, req.user.sub, req.body))),
  );
}

export async function orderAdminRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.get('/', { onRequest: [app.authenticate, app.authorize('ADMIN')] }, async () => ok(await listAllOrders()));
}
