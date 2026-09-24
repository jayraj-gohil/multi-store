# Backend (Fastify + Prisma)

See the [root README](../README.md) for setup and [docs/architecture.md](../docs/architecture.md)
for conventions.

```bash
cp .env.example .env         # then set DATABASE_URL and JWT_SECRET
npm run dev                  # http://localhost:4000 (watch mode)
npm test                     # Vitest (no database needed)
npm run build && npm start   # compiled production server
```

| Script            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `dev`             | Start with `tsx watch`, pretty logs                           |
| `build` / `start` | Compile to `dist/` / run the compiled server                  |
| `typecheck`       | `tsc --noEmit` over src, tests, and configs                   |
| `lint`            | ESLint                                                        |
| `test`            | Vitest (`tests/**/*.test.ts`)                                 |
| `prisma:generate` | Regenerate the client into `src/generated/prisma`             |
| `prisma:migrate`  | `prisma migrate dev`: create and apply a migration (dev only) |
| `prisma:deploy`   | `prisma migrate deploy`: apply committed migrations           |
| `prisma:status`   | Show migration status (also a quick DB connectivity check)    |
| `prisma:studio`   | Browse the database in the browser                            |
