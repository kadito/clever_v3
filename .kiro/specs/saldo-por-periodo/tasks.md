# Tasks — Saldo por Período de Contrato

**Spec:** saldo-por-periodo  
**Date:** 2026-11-08  
**Execution order:** top to bottom — each layer depends on the one above it.

---

## Task 1 — Rewrite types in `@clever/shared`

**Files:**
- `packages/shared/src/balance-types.ts` — rewrite
- `packages/shared/src/balance-utils.ts` — **delete this file**
- `packages/shared/src/index.ts` — update exports

### `balance-types.ts` — replace contents

1. **Delete** all old types: `BalanceIndex`, `ContractUsage`, `BalanceSnapshot`,
   `BalanceSummary`, `ClientBalanceReport`, `FailedTransaction`, `BalanceError`,
   `QueryOptions` (move to local backend types if still needed).
   Keep: `BalanceTransaction`, `TransactionType`, `ValidationResult`, `TransactionChanges`,
   `TransactionMetadata`.
2. **Replace** `TransactionSource` with the new 4-value union (no `'contract'` or
   `'contract-renovation'`).
3. **Make required** `contractId: string` and `periodId: string` on `BalanceTransaction`
   (remove `?`).
4. **Add** `ContractPeriodResources`, `ContractPeriod`, `PeriodsIndexEntry`,
   `TransactionsIndexEntry`.

### `balance-utils.ts` — delete

Delete the file. Remove its export from `index.ts`. Fix any import errors that result
(there should be none in new code; old callers in `balance-middleware.ts` and
`balance-service.ts` will be rewritten in Task 3/4).

### `index.ts` — update exports

Remove exports of deleted types. Add exports of new types.

**Acceptance:** `pnpm type-check` passes. `balance-utils.ts` no longer exists.

---

## Task 2 — Rewrite balance extraction in `@clever/shared`

**File:** `packages/shared/src/balance-extraction.ts`

1. Change `extractWorkSheetDebtTransaction` signature to require `activePeriod: ContractPeriod | null`
   as a second parameter (no longer optional).
2. Inside the CONTRATO switch cases, apply D8/D9 rules:
   - `activePeriod === null` → return `{ balanceChange: price }` (D8: no active period)
   - Resource counter at `0` → return `{ balanceChange: price }` (D9: exhausted)
   - Resource available → consume (negative contractUsageChanges)
   - Unlimited (`-1`) is never exhausted
3. Change `extractRemoteAssistanceDebtTransaction` signature identically.
4. Apply D8/D9 for the `Contrato` case using `horasAssistenciaAnuais`.
5. Export `getSectionForServiceType(serviceType: string): 'CPA' | 'SH' | null` helper.
6. Remove the old legacy fallback branch (`'ASSISTÊNCIA PRESENCIAL'` — that type no
   longer exists in the enum and no backward compat is needed).

The `price` used for euro-debt fallback:
- Work sheets: `pricingSnapshot.calculated.totalPrice` (no legacy fallback needed)
- Remote assistance: `valorAssist`

**Acceptance:** `pnpm --filter @clever/shared type-check` passes.

---

## Task 3 — Rewrite `balance-service.ts` in the backend

**File:** `packages/backend/src/services/balance-service.ts`

**Delete** the existing `BalanceService` class and all its methods (the old
accumulator model). Replace the entire file with `BalancePeriodService`:

1. `getPeriodsIndex(clientId)` — reads `balance/{clientId}/periods-index.json`; returns `[]` if not found.
2. `getPeriod(clientId, periodId)` — reads `balance/{clientId}/periods/{periodId}.json`.
3. `getActivePeriodForDate(clientId, contractId, section, date)` — reads index, finds
   the entry where `contractId` + `section` match and `periodStart ≤ date ≤ periodEnd`
   and `status === 'active'`; fetches and returns the full `ContractPeriod` or `null`.
4. `openPeriod(clientId, contractId, section, resources, periodStart, periodEnd, userId, previousPeriodId?)`:
   - Creates a `ContractPeriod` document at `balance/{clientId}/periods/{uuid}.json`
   - Appends to `periods-index.json`
   - Creates a `BalanceTransaction` (type `ADD`, source `contract-period-open`)
   - Appends transaction to `transactions-index.json`
5. `closePeriod(clientId, periodId, userId)`:
   - Reads the period; sets `status: 'closed'`, `closedAt`, `closedBy`; writes back
   - Creates a `BalanceTransaction` (type `ADD`, source `contract-period-close`)
6. `getTransactionsIndex(clientId)` — reads `balance/{clientId}/transactions-index.json`; returns `[]` if not found.
7. `appendTransactionIndex(clientId, entry)` — read-modify-write the transactions index.
8. `writeTransaction(clientId, transaction)` — writes transaction document AND appends to index.
9. `getTransactions(clientId, options)` — reads the index, filters by `type`/date range/limit/offset,
   fetches matching transaction documents. This fixes the "always returns []" bug.
10. `updatePeriodRemainingResources(clientId, periodId, changes)` — reads period,
    applies changes to `remainingResources` (respects `-1` unlimited), writes back.

**Delete** `packages/backend/src/services/balance-cache.ts` — the in-memory cache
was tied to the old `BalanceIndex`. Not needed in the new model.

Export `createBalancePeriodService(r2Bucket): BalancePeriodService`.

**Acceptance:** `pnpm --filter @clever/backend type-check` passes. `balance-cache.ts`
no longer exists.

---

## Task 4 — Rewrite balance middleware

**File:** `packages/backend/src/middleware/balance-middleware.ts`

Delete the existing `BalanceMiddleware` class and replace with a new implementation
that uses only `BalancePeriodService` (drop `BalanceService` entirely):

1. `onContractCreated(contract, userId)`:
   - Open CPA period if `hasCPAContract`
   - Open SH period if `hasSHContract`
   - Guard: if period already exists for that section, skip and log a warning
2. `onContractUpdated(contract, previousContract, userId)`:
   - Keep `haveResourcesChanged` per-section check
   - CPA resources changed: close active CPA period + open new one
   - SH resources changed: close active SH period + open new one
3. `onWorkSheetCreated(workSheet, userId)`:
   - Call `getSectionForServiceType(serviceType)` — return early if `null` (INSTALAÇÃO)
   - Call `getActivePeriodForDate(clientId, contractId, section, request.date)`
   - Call `extractWorkSheetDebtTransaction(workSheet, activePeriod)` — now required param
   - If result has `balanceChange`: write a DEBT transaction (euro debt, no period update)
   - If result has `contractUsageChanges`: write a DEBT transaction AND call
     `updatePeriodRemainingResources`
4. `onRemoteAssistanceCreated(remoteAssistance, userId)`:
   - Section always `SH`
   - Call `getActivePeriodForDate(clientId, contractId, 'SH', dataPedido)`
   - Call `extractRemoteAssistanceDebtTransaction(remoteAssistance, activePeriod)`
   - Same write logic as work sheets

Update `createBalanceMiddleware` factory to accept only `BalancePeriodService`.
Update all callers (`contracts.ts`, `work-sheets.ts`, `remote-assistance.ts`) to pass
`createBalancePeriodService(r2Bucket)` instead of `createBalanceService(r2Bucket)`.

**Acceptance:** `pnpm --filter @clever/backend type-check` passes. No references to
the old `BalanceService` or `balance-cache` remain.

---

## Task 5 — RENOVAR endpoint in contracts route

**File:** `packages/backend/src/routes/contracts.ts`

Add `POST /:uuid/renovar` after the existing CRUD routes:

```typescript
contractsRouter.post('/:uuid/renovar', requireDeletePermission, async (c) => {
  const user = requireUserContext(c);
  const uuid = c.req.param('uuid');
  const { section } = await c.req.json() as { section: 'CPA' | 'SH' };

  // Validate section value
  if (section !== 'CPA' && section !== 'SH') {
    return c.json({ success: false, error: 'Secção inválida. Use "CPA" ou "SH".' }, 400);
  }

  // Read contract from R2
  // Validate contract exists and is not deleted
  // Validate the section is active (hasCPAContract or hasSHContract)
  // Find active period for contractId + section
  // If no active period: return 404 'Sem período ativo para esta secção'
  // Close period + open new period with current resource values + same dates
  // Return { success: true, data: { closedPeriod, newPeriod } }
});
```

Instantiate `BalancePeriodService` from `c.env.R2_BUCKET`.

**Acceptance:** `pnpm --filter @clever/backend type-check` passes. A manual POST to
the endpoint with a valid contract UUID and `{ section: 'CPA' }` closes the active CPA
period and creates a new one.

---

## Task 6 — Fix and extend balance routes

**File:** `packages/backend/src/routes/balance-routes.ts`

1. Move `GET /report` to the **top** of the router (before `GET /:clientId`) — fixes
   the route ordering bug where `/report` was being matched as `clientId = "report"`.

2. Add `GET /:clientId/periods` handler:
   - Reads `periods-index.json` via `BalancePeriodService`
   - Accepts optional `?status=active` query param
   - Fetches each matching `ContractPeriod` document
   - Returns `ContractPeriod[]`

3. Fix `GET /:clientId/transactions` handler:
   - Replace the stub `return []` with: read `transactions-index.json`, apply filters,
     fetch matching transaction documents, return them
   - Existing query params (`type`, `startDate`, `endDate`, `limit`, `offset`) must work

**Acceptance:** `pnpm --filter @clever/backend type-check` passes. `GET /api/balance/report`
no longer returns a 404. `GET /api/balance/:clientId/transactions` returns real data
after migration.

---

## Task 7 — Frontend: `ClientBalanceDisplay.vue`

**File:** `packages/frontend/src/components/balance/ClientBalanceDisplay.vue`

1. Replace the `GET /api/balance/:clientId` call with
   `GET /api/balance/:clientId/periods?status=active`.
2. Display one card per active `ContractPeriod`:
   - Header: section label ("CPA" / "S&H") + period window `dd/mm/yyyy → dd/mm/yyyy`
   - Per resource row: label, progress bar (remaining/original), value text
   - Unlimited (-1): show "Ilimitado", no bar
   - Exhausted (0): show value in red
3. When no active periods: show the existing "no balance" empty state with updated copy:
   **"Sem períodos de contrato ativos"**
4. Show a euro debt total if any DEBT transactions have `balanceChange > 0` — fetch from
   the transactions endpoint filtered by `type=DEBT` and sum `balanceChange` values.

**Acceptance:** `pnpm --filter @clever/frontend type-check` passes. Component renders
period cards with correct resource values from the API.

---

## Task 8 — Frontend: `TransactionHistoryDisplay.vue`

**File:** `packages/frontend/src/components/balance/TransactionHistoryDisplay.vue`

Read the current file first, then:

1. Fix the API call — it calls `GET /api/balance/:clientId/transactions` which now
   returns real data.
2. Group transactions by `periodId`. For each group:
   - Header: section + period window (look up the period from the `/periods` response)
   - List transactions below: timestamp, type badge (ADD/DEBT), source label, amount
3. Closed period groups start collapsed; active period group starts expanded.
4. Show "Sem transações" when the list is empty.

**Acceptance:** `pnpm --filter @clever/frontend type-check` passes. After migration,
transaction history shows real grouped data.

---

## Task 9 — Frontend: `ContractsDetailView.vue` — RENOVAR button

**File:** `packages/frontend/src/views/contracts/ContractsDetailView.vue`

1. Find the CPA section display and add a "Renovar CPA" button (`v-if="permissions.canDelete && item.data.hasCPAContract"`).
2. Find the S&H section display and add a "Renovar S&H" button (`v-if="permissions.canDelete && item.data.hasSHContract"`).
3. Each button opens a `ConfirmationDialog`:
   - Title: `"Confirmar Renovação"`
   - Message: `"Tem a certeza que pretende renovar o contrato {section}? O período atual será encerrado e os recursos repõem-se aos valores originais do plano."`
   - Confirm button: `"Renovar"` / Cancel: `"Cancelar"`
4. On confirm: `POST /api/contracts/:uuid/renovar` with `{ section: 'CPA' | 'SH' }`
5. On success: reload the contract (`loadItem()` or equivalent) + show a brief success toast
6. On error: display via `ErrorComponent` in the view (not inside the dialog)
7. While loading: set `isLoading` on the `ConfirmationDialog`

**Acceptance:** `pnpm --filter @clever/frontend type-check` passes. Button visible to
Admin on a contract that has an active section.

---

## Task 10 — Migration script (wipe + rebuild)

**File:** `packages/backend/src/index.ts` (add admin route, dev-only)

Add a `/admin/migrate-saldo` POST route that only registers when
`env.ENVIRONMENT !== 'production'`, protected by `X-Admin-Token` header.

**Migration logic (per client from `indexes/clients-index.json`):**

1. **Wipe all balance data for this client:**
   - Delete `balance/{clientId}/index.json` (old BalanceIndex, may not exist)
   - List and delete all keys under `balance/{clientId}/transactions/`
   - List and delete all keys under `balance/{clientId}/periods/`
   - Delete `balance/{clientId}/periods-index.json`
   - Delete `balance/{clientId}/transactions-index.json`

2. **Open periods from current contracts:**
   - Read all contracts for this client from `indexes/contracts-index.json`
   - For each non-deleted contract:
     - If `hasCPAContract`: open CPA period with `inicioContratoCPA`/`fimContratoCPA`
       and CPA resource fields
     - If `hasSHContract`: open SH period with `inicioContratoSH`/`fimContratoSH`
       and SH resource fields

3. **Replay work sheets** (sorted by `request.date` ascending):
   - Read all non-deleted work sheets for the client from `indexes/work-sheets-index.json`
   - For each work sheet with `paymentMethod === 'CONTRATO'`:
     - Determine section via `getSectionForServiceType(serviceType)`
     - Find active period for `contractId + section + request.date`
     - Apply extraction + write transaction + update `remainingResources`

4. **Replay remote assistances** (sorted by `dataPedido` ascending):
   - Read all non-deleted remote assistances from `indexes/remote-assistance-index.json`
   - For each with `paymentMethod === 'Contrato'`:
     - Section = `SH`
     - Find active period for `contractId + SH + dataPedido`
     - Apply extraction + write transaction + update `remainingResources`

**Run command:**
```bash
curl -X POST http://localhost:8787/admin/migrate-saldo \
  -H "X-Admin-Token: <ADMIN_MIGRATION_TOKEN from .dev.vars>"
```

**Log output per client:**
```
[migrate] client abc123: CPA period opened (01/01/2026→31/12/2026), SH period opened (01/06/2026→31/05/2027), 47 work-sheets (41 consumed, 6 debt), 12 remote-assistances (10 consumed, 2 debt)
```

**Acceptance:** `pnpm type-check` passes. Running against dev R2 produces correct
periods and transactions with no old `balance/*/index.json` files remaining.

---

## Task 11 — Final type-check and lint

```bash
pnpm type-check
pnpm check-all
```

Fix any errors introduced by this spec. Do not fix pre-existing unrelated issues.

**Acceptance:** `pnpm type-check` exits 0. Zero new lint errors.
