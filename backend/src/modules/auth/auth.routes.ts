import type { FastifyInstance } from 'fastify';
import { ok } from '../../common/utils/response.js';
import type { ZodTypeProvider } from '../../common/utils/validation.js';
import { login, registerCustomer } from './auth.service.js';
import { loginBody, registerBody } from './auth.schema.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post('/register', { schema: { body: registerBody } }, async (req, reply) => {
    const user = await registerCustomer(req.body);
    const token = app.jwt.sign({ sub: user.id, role: user.role });
    return reply.status(201).send(ok({ user, token }));
  });

  r.post('/login', { schema: { body: loginBody } }, async (req) => {
    const user = await login(req.body);
    const token = app.jwt.sign({ sub: user.id, role: user.role });
    return ok({ user, token });
  });
}
