# Tech Stack

## Package manager

- pnpm >=8.0.0 — always use `pnpm`, never npm/yarn
- Workspace protocol: `workspace:*` for internal deps
- Node.js >=18.0.0

## Packages

| Package            | Role                      |
|--------------------|---------------------------|
| `@clever/shared`   | Types, utils, permissions |
| `@clever/frontend` | Vue 3 SPA                 |
| `@clever/backend`  | Hono API on CF Workers    |

## Frontend

- Vue 3 + Composition API (no Options API, no class components)
- Vue Router 4, Pinia, Vite, Tailwind CSS v3
- Clerk (`@clerk/clerk-js`) for auth
- Testing: Vitest + @vue/test-utils + fast-check (PBT)
- Path alias: `@/` → `packages/frontend/src/`

## Backend

- Hono on Cloudflare Workers
- `@hono/clerk-auth` for JWT verification
- Storage: Cloudflare R2 (JSON docs) + KV (static assets)
- Testing: Vitest + fast-check

## Shared

- Pure TypeScript, no runtime deps
- Exports: types, permissions, utils, relation helpers, balance types

## Commands

```bash
pnpm dev                           # Full-stack (Wrangler, port 8787) — ALWAYS RUNNING, do not restart
pnpm build                         # Build all packages
pnpm test                          # All tests
pnpm --filter @clever/frontend test
pnpm --filter @clever/backend test
pnpm --filter @clever/shared test
pnpm type-check                    # tsc --build across all
pnpm check-all                     # type-check + lint + format:check
pnpm lint:fix
pnpm format
pnpm deploy:test                   # build + wrangler deploy (test env)
pnpm deploy:prod                   # build + wrangler deploy --env production
```

## Dev server

- URL: http://localhost:8787
- API: http://localhost:8787/api/*
- SPA fallback: all non-API routes → Vue Router
- **Do not run `pnpm dev`** — server is already running
