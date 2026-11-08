# Brief — Saldo por Período de Contrato

**Spec:** saldo-por-periodo  
**Date:** 2026-11-08  
**Status:** ready to implement  
**Prerequisite:** work-sheet-service-types spec (done)

## What and why

The current Saldo system is a single perpetual accumulator per client — it has no notion
of time, contract dates, or renewal. The client requires a contract-period model: resources
(manutenções, deslocações, horas) are valid within a contract's date window and reset to
the plan's original values when the contract renews. This spec is a full redesign of the
balance layer.

## Key decisions (all confirmed with client)

- Period = contract dates (CPA and S&H each have their own independent period)
- Renewal: always manual — RENOVAR button on the contract detail page, all contract types
- Renewal is not accumulative — resets to original plan values
- RENOVAR keeps the same contract dates
- Request date (not assistance date) determines which period a work sheet belongs to
- No active period on the request date → work sheet/remote-assistance converts to euro debt
- Resources exhausted but period still active → also converts to euro debt
- Migration: rebuild all balances from scratch using current contract year only

## What changes

11 files touched across all three packages plus a dev-only migration route. No backward
compatibility — old balance data is wiped and rebuilt from scratch.

**Deleted entirely:**
- `packages/shared/src/balance-utils.ts` — old accumulator helpers, gone
- `packages/backend/src/services/balance-cache.ts` — tied to old BalanceIndex, gone
- Old `BalanceIndex`, `ContractUsage`, `BalanceSnapshot` types and all helpers

**Rewritten:**
- `balance-types.ts` — new `ContractPeriod` model, required `contractId`/`periodId` on transactions
- `balance-extraction.ts` — period-aware with required parameter, no legacy fallback
- `balance-service.ts` — fully replaced with `BalancePeriodService`
- `balance-middleware.ts` — fully replaced, period-aware hooks
- `balance-routes.ts` — route order fix; new `/periods` endpoint; working `/transactions`

**Added:**
- `contracts.ts` — `POST /:uuid/renovar` endpoint
- `ClientBalanceDisplay.vue` — period cards with resource progress bars
- `TransactionHistoryDisplay.vue` — grouped by period, real data
- `ContractsDetailView.vue` — RENOVAR button per section
- `index.ts` (backend) — dev-only `/admin/migrate-saldo` route

## What does not change

- Contract forms and contract data model
- Work-sheet and remote-assistance forms
- R2 content key patterns (`content/{type}/{uuid}.json`)
- Auth and permissions model
- All other content types

## Estimated scope

11 tasks. Tasks 1-3 are shared-layer work (types + extraction + service). Tasks 4-6 are
backend integration. Tasks 7-9 are frontend. Task 10 is the migration script.
Tasks 1-6 can be done in one sitting; tasks 7-9 are UI work in a second sitting.
