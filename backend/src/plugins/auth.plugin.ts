import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { ForbiddenError, UnauthorizedError } from '../common/errors/app-error.js';
import type { AuthUser, JwtPayload, Role } from '../common/types/auth.types.js';
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
    /** Use as `onRequest: [app.authenticate, app.authorize('ADMIN')]` to also require a role. */
    authorize: (...roles: Role[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Generic JWT foundation:
 *  - `app.jwt.sign({ sub: user.id, role: user.role })` to issue an access token
 *  - `onRequest: [app.authenticate]` to protect a route; `request.user` is then typed
 *  - `onRequest: [app.authenticate, app.authorize('ADMIN')]` to also restrict by role
 */
async function authPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  });

  app.decorate('authenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  });

  app.decorate('authorize', (...roles: Role[]) => {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
      if (!roles.includes(request.user.role)) {
        throw new ForbiddenError();
      }
    };
  });
}

export default fp(authPlugin, { name: 'auth' });
