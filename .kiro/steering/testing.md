---
inclusion: fileMatch
fileMatchPattern: ["**/__tests__/**", "**/*.test.*", "**/*.spec.*", "**/*.property.test.*"]
---

# Testing

## Stack

- Runner: Vitest ^1.6
- Frontend env: jsdom (globals: true)
- Backend env: node (setupFiles: `test-utils/setup.ts`)
- PBT: fast-check ^4.5
- Component: @vue/test-utils

## Policy

- Tests are written ONLY when defined in a spec's `tasks.md` (V-cycle methodology)
- Outside of spec tasks, focus on rapid implementation without tests
- When spec requires tests: min 100 iterations per PBT property
- Test files live alongside source (`*.test.ts`, `*.property.test.ts`)
- Integration/acceptance tests use descriptive suffixes: `.integration.test.ts`, `.acceptance.test.ts`, `.ma.test.ts`

## PBT conventions

- Use `fc.assert(fc.asyncProperty(...), { numRuns: 100 })` minimum
- Tag properties with spec IDs: `// MI-01`, `// MI-02` etc.
- One describe block per MI entry from `tests.md`
- Arbitraries live in test file unless reused (then extract to `test-helpers/`)

## Test helpers

- Backend: `packages/backend/src/test-helpers/` — shared fixtures, mocks
- Backend: `packages/backend/src/test-utils/setup.ts` — global setup (env vars, mocks)
- Frontend: inline mocks or co-located `.test.ts` files

## Commands

```bash
pnpm test                              # All packages
pnpm --filter @clever/frontend test    # Frontend only
pnpm --filter @clever/backend test     # Backend only
pnpm --filter @clever/shared test      # Shared only
```

## What NOT to do

- No snapshot tests (brittle with Tailwind classes)
- No E2E framework (no Playwright/Cypress — manual browser testing for MA)
- No watch mode in CI — use `vitest run`
- No mocking R2/KV in unit tests — use the `test-utils/setup.ts` stubs
