import type { FastifyInstance } from 'fastify';
import { ok } from '../../common/utils/response.js';
import type { ZodTypeProvider } from '../../common/utils/validation.js';
import { createPlatformDiscount, createProductDiscount, listDiscounts } from './discounts.service.js';
import { createPlatformDiscountBody, createProductDiscountBody } from './discounts.schema.js';

export async function discountAdminRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const guard = { onRequest: [app.authenticate, app.authorize('ADMIN')] };

  r.get('/discounts', guard, async () => ok(await listDiscounts()));

  r.post(
    '/product-discounts',
    { ...guard, schema: { body: createProductDiscountBody } },
    async (req, reply) => reply.status(201).send(ok(await createProductDiscount(req.body))),
  );

  r.post(
    '/platform-discounts',
    { ...guard, schema: { body: createPlatformDiscountBody } },
    async (req, reply) => reply.status(201).send(ok(await createPlatformDiscount(req.body))),
  );
}
