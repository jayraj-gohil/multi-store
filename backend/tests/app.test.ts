import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { buildApp } from '../src/app.js';
import { NotFoundError } from '../src/common/errors/app-error.js';
import { ok } from '../src/common/utils/response.js';
import type { ZodTypeProvider } from '../src/common/utils/validation.js';

describe('app foundation', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ logger: false });

    // Throwaway routes that exercise the shared infrastructure.
    const r = app.withTypeProvider<ZodTypeProvider>();
    r.post(
      '/__test/validate',
      { schema: { body: z.object({ email: z.email(), age: z.number().int().positive() }) } },
      async (request) => ok(request.body),
    );
    r.get('/__test/not-found', async () => {
      throw new NotFoundError('Thing not found');
    });
    r.get('/__test/crash', async () => {
      throw new Error('secret internal detail');
    });
    r.get('/__test/protected', { onRequest: [app.authenticate] }, async (request) =>
      ok({ userId: request.user.sub }),
    );

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health reports the API is running', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true, message: 'API is running' });
  });

  it('serves the versioned health check under /api/v1', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(res.statusCode).toBe(200);
  });

  it('returns a consistent 404 for unknown routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/does-not-exist' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      success: false,
      message: 'Route GET /api/v1/does-not-exist not found',
    });
  });

  it('formats Zod validation errors', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/__test/validate',
      payload: { email: 'not-an-email', age: -1 },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe('Validation failed');
    expect(body.errors.map((e: { path: string }) => e.path)).toEqual(['body.email', 'body.age']);
  });

  it('passes valid, parsed input to the handler', async () => {
    const payload = { email: 'a@example.com', age: 30 };
    const res = await app.inject({ method: 'POST', url: '/__test/validate', payload });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true, data: payload });
  });

  it('maps AppError subclasses to their status code', async () => {
    const res = await app.inject({ method: 'GET', url: '/__test/not-found' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ success: false, message: 'Thing not found' });
  });

  it('returns 500 for unexpected errors', async () => {
    const res = await app.inject({ method: 'GET', url: '/__test/crash' });
    expect(res.statusCode).toBe(500);
    expect(res.json().success).toBe(false);
  });

  it('rejects protected routes without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/__test/protected' });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ success: false, message: 'Invalid or expired token' });
  });

  it('accepts protected routes with a valid token', async () => {
    const token = app.jwt.sign({ sub: 'user-123', role: 'CUSTOMER' });
    const res = await app.inject({
      method: 'GET',
      url: '/__test/protected',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true, data: { userId: 'user-123' } });
  });
});
