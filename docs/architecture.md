# Architecture and extension guide

## Backend (Fastify)

### Request flow

```text
HTTP request
  → helmet, CORS
  → route schema (Zod) validates body / querystring / params     → 400 on failure
  → onRequest: [app.authenticate] (only on protected routes)      → 401 on failure
  → route handler (thin: reads input, calls service, wraps with ok())
  → service (business logic, Prisma queries, throws AppError subclasses)
  → error handler turns any thrown error into { success: false, message, errors? }
```

### Why this layout

- **Feature modules instead of global controllers/ and services/ folders.** In Fastify each feature
  is an encapsulated plugin, so a module's routes, schemas, and service stay in one folder and are
  registered with one line. This is the structure Fastify recommends. A separate controller layer is
  optional: add `<feature>.controller.ts` only when handlers grow beyond a few lines.
- **`app.ts` / `server.ts` split.** `buildApp()` returns a ready-to-use instance without listening,
  so tests use `app.inject()` with no network or ports.
- **Plugins wrapped in `fastify-plugin`** (error handler, auth) apply to the whole app instead of
  being scoped to one encapsulation context.

### Adding a feature module (template)

```text
backend/src/modules/<feature>/
├── <feature>.schema.ts    Zod schemas for input and output + inferred types
├── <feature>.service.ts   Business logic and Prisma calls
└── <feature>.routes.ts    Route definitions (a Fastify plugin)
```

```ts
// <feature>.schema.ts
import { z } from 'zod';
export const createItemBody = z.object({ name: z.string().trim().min(1).max(100) });
export const itemParams = z.object({ id: z.uuid() });
export type CreateItemInput = z.infer<typeof createItemBody>;

// <feature>.service.ts
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../common/errors/app-error.js';
export async function getItem(id: string) {
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('Item not found');
  return item;
}

// <feature>.routes.ts
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from '../../common/utils/validation.js';
import { ok } from '../../common/utils/response.js';
export async function itemRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.get('/:id', { schema: { params: itemParams } }, async (req) =>
    ok(await getItem(req.params.id)),
  );
  r.post(
    '/',
    { schema: { body: createItemBody }, onRequest: [app.authenticate] },
    async (req, reply) => reply.status(201).send(ok(await createItem(req.body, req.user.sub))),
  );
}

// modules/index.ts
await app.register(itemRoutes, { prefix: '/items' }); // → /api/v1/items
```

Adding a `response: { 200: schema }` to a route strips any field not in the schema (for example a
password hash) before the response is sent.

### Errors

Throw from anywhere: `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`,
`ConflictError`, or `new AppError(status, message, errors?)`. The error handler also maps:

| Source                          | Status | Message                                            |
| ------------------------------- | ------ | -------------------------------------------------- |
| Zod validation (route schema)   | 400    | `Validation failed` + `errors[]`                   |
| Prisma `P2002` (unique)         | 409    | `Resource already exists`                          |
| Prisma `P2025` (record missing) | 404    | `Resource not found`                               |
| Fastify 4xx (bad JSON, etc.)    | 4xx    | Fastify's message                                  |
| Anything else                   | 500    | Real message in dev, generic in production; logged |

### Authentication foundation

`plugins/auth.plugin.ts` registers `@fastify/jwt` and decorates `app.authenticate`.

- Issue a token (in the future login handler): `app.jwt.sign({ sub: user.id })`
- Protect a route: `onRequest: [app.authenticate]`, then read `request.user.sub`
- Hash and verify passwords: `hashPassword()` / `verifyPassword()` in `common/utils/password.ts` (argon2id)
- To add claims such as a role once the requirements define them, extend `JwtPayload` in
  `common/types/auth.types.ts`. For role checks, add a small `authorize(...roles)` preHandler that
  throws `ForbiddenError`.

Not built yet on purpose: registration, login, refresh tokens, roles. These depend on the requirements.

### Logging

Pino through Fastify. Pretty output in development, JSON in production. Authorization and cookie
headers and any `password` / `token` / `accessToken` / `refreshToken` fields are redacted. Request
bodies are never logged by default. Log with `request.log.info({ itemId }, 'Item created')`, never
by passing whole user objects.

## Frontend (React)

### Data flow

```text
Page (pages/)            composes layout + components, owns page-level state
  ↓
Hook (hooks/)            loading / error / data state for one use case
  ↓
Service (services/)      one function per endpoint, typed request/response
  ↓
api (services/api.ts)    Axios instance: base URL, JSON headers, auth header, timeout
  ↓
Fastify backend
```

### Where things go

| Need                  | Location                                                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| Domain page           | `src/pages/<Feature>Page.tsx` + entry in `src/routes/index.tsx`                                      |
| API calls             | `src/services/<feature>.service.ts` (import `api`, never axios directly)                             |
| Types                 | `src/types/<feature>.ts`; response envelope types are in `src/types/api.ts`                          |
| Forms                 | Controlled components in `src/components/<feature>/`. Add a form library only if the forms are large |
| Client validation     | Plain checks or Zod (add `zod` to the frontend), mirroring backend rules                             |
| Error text for the UI | `getApiErrorMessage(error)` from `services/api.ts`                                                   |
| Auth state            | `src/context/AuthContext.tsx` (create when login exists); call `setAuthToken()` on login/logout      |
| Protected routes      | `src/routes/ProtectedRoute.tsx` rendering `<Outlet />` or `<Navigate to="/login" />`                 |
| Role-based layouts    | `src/layouts/<Role>Layout.tsx` as a parent route element                                             |
| Reusable components   | `src/components/`                                                                                    |
| Pure helpers          | `src/utils/` (create when needed)                                                                    |

No global state library is included. React state plus context covers most test-sized apps; add one
only if the requirements call for it.

### Token storage

`setAuthToken()` keeps the token **in memory**, so it is lost on reload. When the requirements
arrive, choose one of:

1. Keep it in memory and re-login on reload (simplest, safest).
2. Put it in `sessionStorage`/`localStorage` for persistence (readable by XSS; acceptable for a demo).
3. Use an httpOnly cookie set by the backend (most secure; needs `@fastify/cookie` and CSRF consideration).
