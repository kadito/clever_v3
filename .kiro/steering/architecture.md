---
inclusion: fileMatch
fileMatchPattern: ["packages/backend/src/**", "packages/frontend/src/**", "wrangler.toml"]
---

# Architecture

## Request flow

```
Request → /api/* → Hono handlers → R2/KV
Request → other  → KV static assets → Vue SPA (index.html fallback)
```

## Storage

- R2: `content/{type}/{uuid}.json` — JSON documents
- R2: `indexes/{type}-index.json` — search indexes
- KV (ASSETS binding): Vue build artifacts

## BaseContent

```typescript
interface BaseContent {
  uuid: string; contentType: string;
  createdAt: string; createdBy: string;
  updatedAt: string; updatedBy: string;
  version: number; isDeleted: boolean;
  deletedAt?: string; deletedBy?: string;
  data: Record<string, any>;
}
```

## Relations

- Store only `{relationType}Id` in `data` (e.g. `clientId`)
- Resolve at response time — never at write time
- All responses include `relations: Record<string, ResolvedRelation | RelationError>`
- Errors: `{ type: 'error', code: 404 | 500, message: string }`
- Use `isRelationError()` / `isResolvedRelation()` from `@clever/shared`
- Supported: License→Client, Contract→Client, WorkSheet→Client, RemoteAssistance→Client, InstallationsProgramming→Client

## API endpoints

```
GET/POST        /api/content/{type}
GET/PUT/DELETE  /api/content/{type}/{uuid}
GET             /api/balance/report
GET             /api/balance/report/export
```

Content types: clients, contracts, licenses, daily-records, work-sheets, remote-assistance, installations-programming

## Permissions

- Roles: Admin (full) / User (restricted)
- Logic in `@clever/shared/permissions.ts` — never inline
- Frontend: `usePermissions()` composable (reactive, no extra API calls)
- Backend: middleware before route handlers
- Fail closed: null userType → deny all

## Deployment

- test branch → test Worker + R2 bucket
- prod branch → prod Worker + R2 bucket
- `pnpm deploy:test` / `pnpm deploy:prod`
