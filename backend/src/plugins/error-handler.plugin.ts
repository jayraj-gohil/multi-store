import type { FastifyError, FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import { AppError } from '../common/errors/app-error.js';
import type { ApiErrorBody, ValidationIssue } from '../common/types/api.types.js';
import { isProduction } from '../config/env.js';
import { Prisma } from '../generated/prisma/client.js';

function zodIssues(error: ZodError, location?: string): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: [location, ...issue.path].filter((part) => part !== undefined).join('.'),
    message: issue.message,
  }));
}

function errorHandlerPlugin(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    const body: ApiErrorBody = {
      success: false,
      message: `Route ${request.method} ${request.url} not found`,
    };
    return reply.status(404).send(body);
  });

  app.setErrorHandler<FastifyError | Error>((error, request, reply) => {
    const send = (statusCode: number, message: string, errors?: unknown[]) => {
      const body: ApiErrorBody = errors
        ? { success: false, message, errors }
        : { success: false, message };
      return reply.status(statusCode).send(body);
    };

    // Request validation (Zod schemas on routes, or ZodError thrown by a service).
    if (error instanceof ZodError) {
      const location = 'validationContext' in error ? String(error.validationContext) : undefined;
      return send(400, 'Validation failed', zodIssues(error, location));
    }

    if (error instanceof AppError) {
      return send(error.statusCode, error.message, error.errors);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return send(409, 'Resource already exists');
      if (error.code === 'P2025') return send(404, 'Resource not found');
    }

    // Fastify / plugin client errors (malformed JSON, bad content type, invalid JWT, ...).
    const statusCode = 'statusCode' in error && error.statusCode ? error.statusCode : 500;
    if (statusCode < 500) {
      return send(statusCode, error.message);
    }

    request.log.error({ err: error }, 'Unhandled error');
    return send(statusCode, isProduction ? 'Internal server error' : error.message);
  });
}

export default fp(errorHandlerPlugin, { name: 'error-handler' });
