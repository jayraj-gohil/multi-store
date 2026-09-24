import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Deterministic env for tests. These take precedence over backend/.env (dotenv never overrides).
    // The DB URL is never contacted by the foundation tests (Prisma connects lazily).
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
      JWT_SECRET: 'test-only-secret-that-is-at-least-32-characters-long',
      CORS_ORIGIN: 'http://localhost:5173',
    },
  },
});
