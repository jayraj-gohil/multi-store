# Full-Stack Starter

A reusable, production-style full-stack foundation. There is **no business domain yet**: it provides
the infrastructure (server, database, validation, errors, auth primitives, routing, API client) so
that feature work can start immediately.

## Technology stack

| Layer    | Tools                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Backend  | Node.js 22.12+ / 24, TypeScript, Fastify 5, Zod 4, @fastify/jwt, argon2, Pino logging |
| Database | PostgreSQL, Prisma ORM 7 (`@prisma/adapter-pg` driver adapter)                        |
| Frontend | React 19, TypeScript, Vite 8, React Router 8, Axios, Tailwind CSS 4                   |
| Tooling  | npm workspaces, ESLint 10 + typescript-eslint, Prettier, Vitest                       |

## Project structure

```text
.
├── backend/                  Fastify REST API
│   ├── prisma/schema.prisma  Database schema (no models yet)
│   ├── prisma.config.ts      Prisma CLI config (schema path, migrations path, DATABASE_URL)
│   ├── src/
│   │   ├── config/           env.ts (Zod-validated env), database.ts (Prisma client), logger.ts
│   │   ├── plugins/          error-handler.plugin.ts, auth.plugin.ts (JWT + app.authenticate)
│   │   ├── common/           errors/ (AppError classes), types/, utils/ (validation, password, response)
│   │   ├── modules/          Feature modules; index.ts mounts them under /api/v1
│   │   ├── generated/        Prisma client output (git-ignored, created by `prisma generate`)
│   │   ├── app.ts            buildApp() factory — no listen(), used by tests
│   │   └── server.ts         Starts the server, graceful shutdown
│   └── tests/                Vitest tests using app.inject()
├── frontend/                 React SPA
│   └── src/
│       ├── components/       Reusable UI (Loader, ErrorMessage)
│       ├── hooks/            Data hooks (useHealthCheck)
│       ├── layouts/          MainLayout
│       ├── pages/            HomePage, NotFoundPage
│       ├── routes/           Route table (createBrowserRouter)
│       ├── services/         api.ts (Axios instance) + one file per API resource
│       └── types/            Shared TS types (API envelope, env)
└── docs/architecture.md      Conventions and where tomorrow's code goes
```

## Installation

Requires **Node.js 22.12+** (tested on 24) and a running **PostgreSQL** server.

```bash
# From the repo root — installs backend + frontend (npm workspaces) and runs `prisma generate`
npm install
```

To add a package to one side only:

```bash
npm install <pkg> -w backend
npm install <pkg> -w frontend
```

## Environment setup

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Then edit `backend/.env`:

- `DATABASE_URL`: `postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME?schema=public`
  (URL-encode special characters in the password, e.g. `@` → `%40`).
- `JWT_SECRET`: at least 32 random characters. Generate one:

  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
  ```

- `CORS_ORIGIN`: the frontend URL(s), comma-separated. Must match the port Vite runs on (5173).

The backend validates all variables on startup and exits with a clear message (names only, never
values) if something is missing or invalid. `.env` files are git-ignored; only `.env.example` is committed.

## Database setup

1. Create an empty database (any tool; with `psql`):

   ```bash
   psql -U postgres -c "CREATE DATABASE my_app;"
   ```

   On Windows, `psql` is at `C:\Program Files\PostgreSQL\<version>\bin\psql.exe` if it is not on PATH.

2. Put its URL in `backend/.env` and generate the client (also runs automatically on `npm install`):

   ```bash
   npm run prisma:generate -w backend
   ```

3. Verify the connection: start the backend and open `http://localhost:4000/health/ready`
   (or run `npm run prisma:status -w backend`).

**How Prisma connects:** the Prisma CLI (migrate, studio) reads `DATABASE_URL` through
`backend/prisma.config.ts`. At runtime, `src/config/database.ts` creates a `PrismaClient` with the
`@prisma/adapter-pg` driver adapter, which opens a `pg` connection pool lazily on the first query.

## Running the application

Use two terminals from the repo root:

```bash
npm run dev:backend    # http://localhost:4000  (tsx watch, pretty logs)
npm run dev:frontend   # http://localhost:5173  (Vite; fails fast if 5173 is taken)
```

| Task                         | Command                                                                |
| ---------------------------- | ---------------------------------------------------------------------- |
| Generate Prisma client       | `npm run prisma:generate -w backend`                                   |
| Create + apply a migration   | `npm run prisma:migrate -w backend -- --name <change_name>`            |
| Apply migrations (prod / CI) | `npm run prisma:deploy -w backend`                                     |
| Migration status             | `npm run prisma:status -w backend`                                     |
| Browse data (Prisma Studio)  | `npm run prisma:studio -w backend`                                     |
| Type-check everything        | `npm run typecheck`                                                    |
| Lint everything              | `npm run lint`                                                         |
| Format                       | `npm run format` / `npm run format:check`                              |
| Backend tests                | `npm test`                                                             |
| Production build             | `npm run build`, then `npm start -w backend` and serve `frontend/dist` |

### Safe database practices

- `prisma migrate dev` is for local development: it creates migration files and applies them.
  If it detects drift it may **offer to reset** the database. Read the prompt; answer **no** on any
  database whose data matters.
- **Never** run `prisma migrate reset` or `prisma db push --force-reset` against a shared or
  important database. Both drop data.
- Use `prisma migrate deploy` for staging/production: it only applies pending, committed migrations.
- Commit the generated `prisma/migrations/` folder together with the schema change.

## API health check

| Endpoint                     | Purpose                                         |
| ---------------------------- | ----------------------------------------------- |
| `GET /health`                | Liveness: the process is serving requests       |
| `GET /health/ready`          | Readiness: also checks PostgreSQL (503 if down) |
| `GET /api/v1/health[/ready]` | Same, under the versioned API prefix            |

```bash
curl http://localhost:4000/health
# {"success":true,"message":"API is running"}
```

The frontend home page calls `/api/v1/health/ready` and shows **Connected** or the error.

## Response format

```jsonc
// success
{ "success": true, "data": { ... }, "message": "optional" }
// error
{ "success": false, "message": "Validation failed", "errors": [{ "path": "body.email", "message": "Invalid email address" }] }
```

## Adding the real requirements

See [docs/architecture.md](docs/architecture.md) for the full guide. In short:

| What             | Where                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| Prisma models    | `backend/prisma/schema.prisma` → `prisma:migrate -- --name ...`                 |
| Backend module   | `backend/src/modules/<feature>/` (`*.schema.ts`, `*.service.ts`, `*.routes.ts`) |
| Register routes  | `backend/src/modules/index.ts` with a prefix, e.g. `/users`                     |
| Validators       | Zod schemas in `<feature>.schema.ts`, used in the route `schema`                |
| Protected routes | `onRequest: [app.authenticate]`; user in `request.user`                         |
| React pages      | `frontend/src/pages/`, registered in `frontend/src/routes/index.tsx`            |
| API services     | `frontend/src/services/<feature>.service.ts` using `api`                        |
| Frontend types   | `frontend/src/types/<feature>.ts`                                               |
