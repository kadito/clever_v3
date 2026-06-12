---
inclusion: fileMatch
fileMatchPattern: ["**/permissions*", "**/usePermissions*", "**/middleware/permissions*"]
---

# User Permissions Patterns

## Model

- Roles: Admin (full access) / User (restricted)
- Source: Clerk JWT → `userContext.userType`
- Fail closed: null or missing userType → deny all

## Shared logic (`@clever/shared/permissions.ts`)

- `canDelete(userType): boolean` — Admin only
- `getPermissions(userType): Permissions` — returns all flags
- Pure functions, no side effects, no runtime deps

## Frontend (`usePermissions` composable)

- Wraps `getPermissions()` in a reactive computed
- No additional API calls — derives from `useAuth()` state
- Use `v-if` to remove elements from DOM (never `v-show`)

## Backend (`middleware/permissions.ts`)

- `requireDeletePermission` middleware — returns 403 if not Admin
- Runs after auth middleware (`clerk`)
- Logs denials: `console.warn('Delete denied:', JSON.stringify({ userId, userType, path }, null, 2))`

## Current permissions

| Permission | Admin | User |
|------------|-------|------|
| Delete content | ✅ | ❌ |
| View audit trail (Histórico) | ✅ | ❌ |

## Rules

- Never inline permission checks — always use shared utilities
- Never rely on frontend restrictions for security — backend is the authority
- Portuguese error message: "Não tem permissão para eliminar conteúdo" (403)
- No data migration needed — uses existing Clerk userType field
