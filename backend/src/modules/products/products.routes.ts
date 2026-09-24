import type { FastifyInstance } from 'fastify';
import { BadRequestError } from '../../common/errors/app-error.js';
import { ok } from '../../common/utils/response.js';
import type { ZodTypeProvider } from '../../common/utils/validation.js';
import { saveProductImage } from './image-upload.service.js';
import {
  createProduct,
  listAvailableProducts,
  listProductsAdmin,
  updateProduct,
} from './products.service.js';
import { createProductBody, productParams, updateProductBody } from './products.schema.js';

export async function productAdminRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const guard = { onRequest: [app.authenticate, app.authorize('ADMIN')] };

  r.get('/', guard, async () => ok(await listProductsAdmin()));

  // multipart, so it's registered without the { body: ... } Zod schema the JSON routes use.
  r.post('/upload-image', guard, async (req, reply) => {
    const file = await req.file();
    if (!file) throw new BadRequestError('No image file was provided.');
    const publicOrigin = `${req.protocol}://${req.headers.host}`;
    const url = await saveProductImage(file, publicOrigin);
    return reply.status(201).send(ok({ url }));
  });

  r.post('/', { ...guard, schema: { body: createProductBody } }, async (req, reply) =>
    reply.status(201).send(ok(await createProduct(req.body))),
  );

  r.patch(
    '/:id',
    { ...guard, schema: { params: productParams, body: updateProductBody } },
    async (req) => ok(await updateProduct(req.params.id, req.body)),
  );
}

export async function productPublicRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.get('/', async () => ok(await listAvailableProducts()));
}
