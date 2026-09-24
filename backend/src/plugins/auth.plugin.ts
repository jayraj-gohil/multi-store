import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { UnauthorizedError } from '../common/errors/app-error.js';
import type { AuthUser, JwtPayload } from '../common/types/auth.types.js';
import { env } from '../config/env.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: AuthUser;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    /** Use as `onRequest: [app.authenticate]` to require a valid `Authorization: Bearer <token>`. */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Generic JWT foundation:
 *  - `app.jwt.sign({ sub: user.id })` to issue an access token (e.g. in a login handler)
 *  - `onRequest: [app.authenticate]` to protect a route; `request.user` is then typed
 */
async function authPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  });

  app.decorate('authenticate', async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  });
}

export default fp(authPlugin, { name: 'auth' });
