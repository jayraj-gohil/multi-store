import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import { fileURLToPath } from 'node:url';
import { serializerCompiler, validatorCompiler } from './common/utils/validation.js';
import { prisma } from './config/database.js';
import { env } from './config/env.js';
import { loggerOptions } from './config/logger.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { apiV1Routes } from './modules/index.js';
import authPlugin from './plugins/auth.plugin.js';
import errorHandlerPlugin from './plugins/error-handler.plugin.js';

export const uploadsDir = fileURLToPath(new URL('../uploads', import.meta.url));

export interface BuildAppOptions {
  logger?: FastifyServerOptions['logger'];
}

/**
 * Creates a fully configured Fastify instance without starting the HTTP server.
 * Tests call this and use `app.inject()`; server.ts calls it and then `listen()`.
 */
export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? loggerOptions,
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet, {
    // Uploaded images are served here and loaded cross-origin by the frontend (a different
    // port/origin in dev). Helmet's default same-origin resource policy would block that.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  await app.register(errorHandlerPlugin);
  await app.register(authPlugin);
  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5MB, one file per request
  });
  await app.register(staticFiles, { root: uploadsDir, prefix: '/uploads/' });

  // Unversioned infrastructure endpoints (load balancers, uptime checks).
  await app.register(healthRoutes);
  // Versioned API.
  await app.register(apiV1Routes, { prefix: '/api/v1' });

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  return app;
}
