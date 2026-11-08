# Design — Saldo por Período de Contrato

**Spec:** saldo-por-periodo  
**Date:** 2026-11-08

---

## 1. Changed / new files

| File | Change |
|---|---|
| `packages/shared/src/balance-types.ts` | Add `ContractPeriod`, `ContractPeriodResources`; extend `BalanceTransaction`; extend `TransactionSource` |
| `packages/shared/src/balance-extraction.ts` | Update `extractWorkSheetDebtTransaction` and `extractRemoteAssistanceDebtTransaction` to accept an optional active period and apply D8/D9 rules |
| `packages/shared/src/index.ts` | Export new types |
| `packages/backend/src/services/balance-service.ts` | Add period read/write/open/close methods; fix `getTransactionHistory` to use index; add `BalancePeriodService` class |
| `packages/backend/src/middleware/balance-middleware.ts` | Replace `onContractCreated`/`onContractUpdated` with period-aware versions; update work-sheet and remote-assistance hooks to resolve period first |
| `packages/backend/src/routes/balance-routes.ts` | Add `GET /:clientId/periods`; fix `GET /:clientId/transactions`; fix route order (report before :clientId) |
| `packages/backend/src/routes/contracts.ts` | Add `POST /:uuid/renovar` endpoint |
| `packages/frontend/src/components/balance/ClientBalanceDisplay.vue` | Rewrite to show active periods with per-resource progress |
| `packages/frontend/src/components/balance/TransactionHistoryDisplay.vue` | Fix to use real transaction data, grouped by period |
| `packages/frontend/src/views/contracts/ContractsDetailView.vue` | Add RENOVAR button(s) |
| `scripts/migrate-saldo-rebuild.ts` | New migration script |

---

## 2. Type additions (`balance-types.ts`)

### Deleted types (no longer exist)

The following types and all their associated helpers are **deleted** from `balance-types.ts`
and `balance-utils.ts`:

- `BalanceIndex`
- `ContractUsage`
- `BalanceSnapshot`
- All functions in `balance-utils.ts` (`calculateBalanceFromTransactions`,
  `applyTransactionToBalance`, `validateTransactionAgainstBalance`, `hasLowUsage`,
  `calculateUsagePercentage`, `isUnlimited`)
- `BalanceSummary`, `ClientBalanceReport` (shared types — the reporting service defines
  its own local versions)
- `FailedTransaction`, `BalanceError` (unused)

The file `packages/shared/src/balance-utils.ts` is **deleted entirely**.

### New: `ContractPeriodResources`

```typescript
export interface ContractPeriodResources {
  manutencoesPorAno: number;      // -1 = unlimited
  deslocacoesPorAno: number;      // -1 = unlimited
  horasAssistenciaAnuais: number; // -1 = unlimited
}
```

### New: `ContractPeriod`

```typescript
export interface ContractPeriod {
  uuid: string;
  clientId: string;
  contractId: string;
  section: 'CPA' | 'SH';
  periodStart: string;            // ISO date string (inclusive)
  periodEnd: string;              // ISO date string (inclusive)
  status: 'active' | 'closed';
  originalResources: ContractPeriodResources;
  remainingResources: ContractPeriodResources;
  openedAt: string;               // ISO timestamp
  openedBy: string;               // userId
  closedAt?: string;
  closedBy?: string;
  previousPeriodId?: string;
}
```

### New: `PeriodsIndexEntry`

```typescript
export interface PeriodsIndexEntry {
  periodId: string;
  contractId: string;
  section: 'CPA' | 'SH';
  status: 'active' | 'closed';
  periodStart: string;
  periodEnd: string;
}
```

### New: `TransactionsIndexEntry`

```typescript
export interface TransactionsIndexEntry {
  uuid: string;
  periodId?: string;
  contractId?: string;
  source: TransactionSource;
  type: TransactionType;
  timestamp: string;
}
```

### Extended: `BalanceTransaction`

Replace optional `contractId?` / `periodId?` with **required** fields:

```typescript
contractId: string;   // was optional — now required
periodId: string;     // was optional — now required
```

### Replaced: `TransactionSource`

```typescript
export type TransactionSource =
  | 'contract-period-open'
  | 'contract-period-close'
  | 'work-sheet'
  | 'remote-assistance';
```

Old values (`'contract'`, `'contract-renovation'`) are removed.

---

## 3. Balance extraction changes (`balance-extraction.ts`)

Both extraction functions receive a **required** `activePeriod: ContractPeriod | null`
parameter. The old optional-parameter fallback is removed — callers always pass the
resolved period. The old fallback logic (treat all CONTRATO work sheets as consuming
1 manutenção + 1 deslocação regardless) is deleted.

---

## 4. `BalancePeriodService` (new class in `balance-service.ts`)

Separate class from the existing `BalanceService` to keep responsibilities clear.

```typescript
export class BalancePeriodService {
  constructor(private r2Bucket: StorageBucket) {}

  // Read periods-index for a client
  async getPeriodsIndex(clientId: string): Promise<PeriodsIndexEntry[]>

  // Read a single period document
  async getPeriod(clientId: string, periodId: string): Promise<ContractPeriod | null>

  // Find the active period for a contract section on a given date
  async getActivePeriodForDate(
    clientId: string,
    contractId: string,
    section: 'CPA' | 'SH',
    date: string  // ISO date string
  ): Promise<ContractPeriod | null>

  // Open a new period
  async openPeriod(
    clientId: string,
    contractId: string,
    section: 'CPA' | 'SH',
    resources: ContractPeriodResources,
    periodStart: string,
    periodEnd: string,
    userId: string,
    previousPeriodId?: string
  ): Promise<ContractPeriod>

  // Close an existing period (used by RENOVAR)
  async closePeriod(
    clientId: string,
    periodId: string,
    userId: string
  ): Promise<ContractPeriod>

  // Read transactions-index for a client
  async getTransactionsIndex(clientId: string): Promise<TransactionsIndexEntry[]>

  // Append a transaction to the index
  async appendTransactionIndex(
    clientId: string,
    entry: TransactionsIndexEntry
  ): Promise<void>
}
```

**Period search logic** in `getActivePeriodForDate`:
1. Read `periods-index.json`
2. Filter to entries where `contractId` matches and `section` matches and `status === 'active'`
3. For each match, check if `periodStart ≤ date ≤ periodEnd`
4. Return the first match, or `null`

---

## 5. Balance middleware changes (`balance-middleware.ts`)

### `onContractCreated` — replace with period open

```typescript
async onContractCreated(contract: Contract, userId: string): Promise<void> {
  if (contract.data.hasCPAContract) {
    await periodService.openPeriod(
      contract.data.clientId,
      contract.uuid,
      'CPA',
      extractCPAResources(contract),  // reads manutencoesPorAnoCPA etc.
      contract.data.inicioContratoCPA,
      contract.data.fimContratoCPA,
      userId
    );
  }
  if (contract.data.hasSHContract) {
    await periodService.openPeriod(...'SH'...);
  }
}
```

### `onContractUpdated` — close + reopen when resources changed

Keep the existing `haveResourcesChanged` check. When true:
```typescript
// close CPA period if hasCPAContract and resources changed for CPA
// close SH period if hasSHContract and resources changed for SH
// open new period with updated resource values
```

### `onWorkSheetCreated` — resolve period before extracting

```typescript
async onWorkSheetCreated(workSheet: WorkSheet, userId: string): Promise<void> {
  const section = getSectionForServiceType(workSheet.data.otherData.serviceType);
  if (!section) return; // INSTALAÇÃO — no transaction

  const requestDate = workSheet.data.request.date;
  const activePeriod = await periodService.getActivePeriodForDate(
    clientId, contractId, section, requestDate
  );

  const changes = extractWorkSheetDebtTransaction(workSheet, activePeriod);
  // ... create transaction, update period remainingResources if consumption
}
```

Helper:
```typescript
function getSectionForServiceType(
  serviceType: string
): 'CPA' | 'SH' | null {
  if (serviceType === 'MANUTENÇÃO' || serviceType === 'ASSISTÊNCIA PRESENCIAL CPA') return 'CPA';
  if (serviceType === 'ASSISTÊNCIA PRESENCIAL SOFTWARE') return 'SH';
  return null; // INSTALAÇÃO
}
```

After a consumption transaction, update `remainingResources` in the period document.

### `onRemoteAssistanceCreated` — same pattern as work sheet

Use `dataPedido` as the request date, section is always `SH` for remote assistance.

---

## 6. Backend routes

### `contracts.ts` — add `POST /:uuid/renovar`

```typescript
contractsRouter.post('/:uuid/renovar', requireDeletePermission, async (c) => {
  const { section } = await c.req.json(); // 'CPA' | 'SH'
  // 1. Read contract
  // 2. Validate section is active on contract
  // 3. Find active period
  // 4. Close period, open new period with same dates + current resource values
  // 5. Return { closedPeriod, newPeriod }
});
```

### `balance-routes.ts` — fixes and additions

Move `GET /report` to the **top** of the router (before `/:clientId`) to fix the route
ordering bug.

Add `GET /:clientId/periods`:
```typescript
balanceRouter.get('/:clientId/periods', requireAuth, async (c) => {
  const status = c.req.query('status'); // optional 'active' filter
  // Read periods-index, optionally filter, return ContractPeriod[]
});
```

Fix `GET /:clientId/transactions`:
```typescript
// Read transactions-index.json
// Apply filters (type, startDate, endDate, limit, offset)
// Fetch only the matching transaction documents
// Return BalanceTransaction[]
```

---

## 7. Frontend — `ClientBalanceDisplay.vue`

Replace the single `GET /api/balance/:clientId` call with `GET /api/balance/:clientId/periods?status=active`.

Display per active period:
```
┌──────────────────────────────────────┐
│ CPA  •  01/01/2026 → 31/12/2026      │
│  Manutenções    ██████░░░░  6 / 10   │
│  Deslocações    ████░░░░░░  4 / 12   │
│  Horas          ──────────  Ilimitado│
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ S&H  •  01/06/2026 → 31/05/2027      │
│  Manutenções    ██████████  12 / 12  │
│  Deslocações    ████████░░  8 / 10   │
│  Horas          ████░░░░░░  12 / 30  │
└──────────────────────────────────────┘
```

Progress bars: `remaining / original`. Unlimited (-1) shows "Ilimitado" with no bar.

If a resource is at `0`, show it in red.

---

## 8. Frontend — `TransactionHistoryDisplay.vue`

Replace the stub `GET /api/balance/:clientId/transactions` call with the fixed endpoint.

Group transactions by `periodId`. Period group header shows section + date range.
Closed periods collapsed by default, with a "Ver histórico" expand control.

---

## 9. Frontend — `ContractsDetailView.vue` — RENOVAR button

Add below the contract section details (CPA and/or S&H):

- Admin only (`v-if="permissions.canDelete"`)
- One button per active section
- Uses `ConfirmationDialog` with the message from REQ-05.3
- On confirm: `POST /api/contracts/:uuid/renovar` with `{ section }`
- On success: refresh the page / reload contract data
- On error: show `ErrorComponent` in the view

Button placement: in the section's action area, next to the section header. Mobile:
follows the existing fixed-bottom-action-bar pattern.

---

## 10. Migration script (`scripts/migrate-saldo-rebuild.ts`)

The script runs via `pnpm tsx scripts/migrate-saldo-rebuild.ts` and requires a local
`.env` or env-injected R2 credentials. It uses the Cloudflare R2 S3-compatible API
(or the existing `@cloudflare/workers-types` R2 binding through a local Wrangler proxy).

Approach: run the script as a Worker invoked via `wrangler dev` + a fetch to a
`/admin/migrate` route that is only registered in dev. This avoids credential complexity.

Steps (per client, from `indexes/clients-index.json`):
1. Delete `balance/{clientId}/index.json` (old BalanceIndex)
2. Delete `balance/{clientId}/periods-index.json` and `transactions-index.json` if present
3. List and delete all `balance/{clientId}/transactions/` keys
4. List and delete all `balance/{clientId}/periods/` keys
5. For each active contract (`hasCPAContract` / `hasSHContract`): open period
6. For each work sheet (sorted by `request.date` asc): apply extraction with period resolution
7. For each remote assistance (sorted by `dataPedido` asc): apply extraction

Log format per client:
```
[migrate] client abc123: 2 periods opened, 47 work-sheets processed (41 consumed, 6 debt), 12 remote-assistances processed
```
