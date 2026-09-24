import { config as loadDotenv } from 'dotenv';
import { defineConfig } from 'prisma/config';

loadDotenv({ quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Read lazily so `prisma generate` (e.g. on a fresh `npm install`) works without a .env.
    // Commands that touch the database fail with a clear error if this is empty.
    url: process.env.DATABASE_URL ?? '',
  },
});
