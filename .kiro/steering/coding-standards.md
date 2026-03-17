---
inclusion: fileMatch
fileMatchPattern: ["packages/**/*.ts", "packages/**/*.vue"]
---

# Coding Standards

## TypeScript

- Strict mode always on — no `any`, explicit return types
- Small functions, one responsibility per file, max 3 levels nesting
- camelCase variables, PascalCase components, kebab-case routes/files

## Vue

- Composition API only — no Options API, no class components
- `v-if` to remove restricted elements from DOM (not `v-show`)
- Use `usePermissions()` for all permission-gated UI
- Log objects with `JSON.stringify(obj, null, 2)` — never raw object refs

## Promises

- Prefer `await fn().then().catch().finally()` over try/catch blocks

## Content

- All content extends `BaseContent`; UUID-based; soft delete only
- Section order: Basic → Contact → Address → Financial → Services → Configuration → Observations
- Relation IDs stored as `{type}Id`; resolved at display time via `@clever/shared` type guards

## Forms

- Use `useSharedFormData` composable — persists across component recreation
- Multiselect dropdowns over checkbox lists
- Conditional fields via JSON config, not template logic
- Technician fields: auto-assigned from auth context, not manual input

## Delete

- Confirmation dialog always required
- Delete buttons in detail views only — never in list views
- Use `useApi.remove()` — soft delete only
- Navigate to list view on success; show error in detail view (not in dialog)

## Permissions

- All logic in `@clever/shared/permissions.ts` — never inline
- Fail closed: missing userType → deny all
- Backend logs all denials with user + path context

## Testing (dedicated phase only)

- Do not write or run tests during feature development
- When writing tests: Vitest + fast-check (PBT), min 100 iterations per property
