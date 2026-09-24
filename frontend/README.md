# Frontend (React + Vite)

See the [root README](../README.md) for setup and [docs/architecture.md](../docs/architecture.md)
for conventions.

```bash
cp .env.example .env    # VITE_API_BASE_URL=http://localhost:4000/api/v1
npm run dev             # http://localhost:5173 (strict port: fails if it is taken)
npm run build           # type-check + production bundle in dist/
npm run lint
```

If port 5173 is used by another app, run `npm run dev -- --port 5174` and add
`http://localhost:5174` to `CORS_ORIGIN` in `backend/.env`.
