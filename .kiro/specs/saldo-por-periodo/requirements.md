# Requirements — Saldo por Período de Contrato

**Spec:** saldo-por-periodo  
**Date:** 2026-11-08  
**Prerequisite:** work-sheet-service-types spec (done)  
**Context:** Complete redesign of the Saldo system from a perpetual accumulator to a
contract-period model. Client decisions recorded in `docs/meetings/2026-09-24-saldo-perguntas-cliente.md`
and `docs/design/saldo-por-periodo-contrato.md`.

---

## Closed client decisions

| # | Decision |
|---|---|
| D1 | Saldo period = contract dates (`inicioContratoCPA/SH` → `fimContratoCPA/SH`) |
| D2 | CPA and S&H each have their own independent period |
| D3 | Renewal is always **manual** — RENOVAR button on the contract detail page. All contract types, including DEBITO_DIRETO |
| D4 | Renewal is **not accumulative** — period opens with the plan's original resource values; leftover from previous period is discarded |
| D5 | RENOVAR keeps the **same dates** as the current contract (no new date input) |
| D6 | Resources are **always annual** — payment recurrence (mensal/semestral/anual) only affects billing |
| D7 | Date that decides the period: **`request.date`** (Data do Pedido) for work sheets; **`dataPedido`** for remote assistance |
| D8 | When no active period exists on the request date → work sheet / remote assistance converts to **debt in euros** |
| D9 | When resources are exhausted but period is still active → also converts to **debt in euros** |
| D10 | User can always select "CONTRATO" payment — balance can go negative (debt) |
| D11 | History: create from the **current contract year only** (no historical period reconstruction) |
| D12 | Balances already corrected — full rebuild from scratch on migration |

---

## REQ-01 — Contract period data model

**REQ-01.1** A new `ContractPeriod` type must be defined in `@clever/shared/balance-types.ts`:

```typescript
interface ContractPeriod {
  uuid: string;                // Period identifier
  clientId: string;
  contractId: string;
  section: 'CPA' | 'SH';      // Which contract section this period belongs to
  periodStart: string;         // ISO date (inclusive) — from inicioContratoCPA/SH
  periodEnd: string;           // ISO date (inclusive) — from fimContratoCPA/SH
  status: 'active' | 'closed';
  // Original plan values — frozen at period-open time, never mutated
  originalResources: ContractPeriodResources;
  // Current remaining resources — decremented by consumption transactions
  remainingResources: ContractPeriodResources;
  openedAt: string;            // ISO timestamp when this period was created
  openedBy: string;            // userId
  closedAt?: string;           // ISO timestamp when RENOVAR was pressed
  closedBy?: string;           // userId
  previousPeriodId?: string;   // UUID of the period this replaced
}

interface ContractPeriodResources {
  manutencoesPorAno: number;   // -1 = unlimited
  deslocacoesPorAno: number;   // -1 = unlimited
  horasAssistenciaAnuais: number; // -1 = unlimited (S&H only; 0 for CPA unless AP CPA horasExtra)
}
```

**REQ-01.2** The old `BalanceIndex`, `ContractUsage`, `BalanceSnapshot` types and all
related helpers (`calculateBalanceFromTransactions`, `applyTransactionToBalance`,
`validateTransactionAgainstBalance`, `hasLowUsage`, `calculateUsagePercentage`,
`isUnlimited`) are **deleted**. No backward compatibility. All old R2 balance data
will be wiped by the migration script before new data is written.

**REQ-01.3** `BalanceTransaction` gains two **required** (non-optional) fields:
- `contractId: string` — the contract the transaction is associated with
- `periodId: string` — the `ContractPeriod.uuid` the transaction belongs to

**REQ-01.4** `TransactionSource` is **replaced** (not extended) with only the new values:

```typescript
export type TransactionSource =
  | 'contract-period-open'
  | 'contract-period-close'
  | 'work-sheet'
  | 'remote-assistance';
```

---

## REQ-02 — R2 storage layout

**REQ-02.1** New R2 key patterns (all under the existing R2 bucket):

```
balance/{clientId}/periods/{periodId}.json      — ContractPeriod document
balance/{clientId}/periods-index.json           — Array of { periodId, contractId, section, status, periodStart, periodEnd }
balance/{clientId}/transactions/{uuid}.json     — BalanceTransaction
balance/{clientId}/transactions-index.json      — Array of { uuid, periodId, source, timestamp, type }
```

**REQ-02.2** The old `balance/{clientId}/index.json` key pattern is **abandoned**.
The migration script deletes all existing `balance/` keys before rebuilding.

**REQ-02.3** `transactions-index.json` is the fix for the long-standing "transaction
history always returns []" bug. Every time a transaction is written, its entry is
appended to this index.

---

## REQ-03 — Period lifecycle

**REQ-03.1** Opening a period:
- Creates a `ContractPeriod` document in R2
- Sets `status: 'active'`, `originalResources` and `remainingResources` from the
  contract's current resource fields for that section
- Creates a `BalanceTransaction` of type `ADD`, source `'contract-period-open'`
- Appends to `periods-index.json`

**REQ-03.2** Closing a period (RENOVAR button pressed):
- Reads the current active period for that `contractId` + `section`
- Sets `status: 'closed'`, `closedAt`, `closedBy`
- Creates a `BalanceTransaction` of type `ADD`, source `'contract-period-close'`
  (records the snapshot of remaining resources at close time)
- Opens a **new** period immediately (REQ-03.1) with `previousPeriodId` pointing to
  the closed one
- Both the close and open are written atomically (write close first, then open; on
  failure the open can be retried safely)

**REQ-03.3** A contract may have **at most one active period per section** at any time.
Opening a second active period for the same `contractId + section` is rejected with an
error: `'Já existe um período ativo para esta secção do contrato'`.

**REQ-03.4** When a contract is first created (POST `/api/content/contracts`), periods
are opened automatically for each active section (CPA if `hasCPAContract`, SH if
`hasSHContract`). This replaces the existing `onContractCreated` balance middleware.

**REQ-03.5** When a contract is updated and resource fields change (the existing
`haveResourcesChanged` logic), the current period is **closed** and a new one opened
with the updated resource values. This replaces `onContractUpdated`.

---

## REQ-04 — Period resolution at transaction time

**REQ-04.1** Before creating a DEBT transaction for a work sheet or remote assistance
with `paymentMethod === 'CONTRATO'`, the system must find the **active period** for the
relevant contract section on the **request date**:

- Work sheet: use `data.request.date` (Data do Pedido)
- Remote assistance: use `data.dataPedido`
- Section determined by `serviceType` (from work-sheet-service-types spec):
  - `'MANUTENÇÃO'` → CPA period
  - `'ASSISTÊNCIA PRESENCIAL CPA'` → CPA period
  - `'ASSISTÊNCIA PRESENCIAL SOFTWARE'` → SH period
  - `'INSTALAÇÃO'` → no period needed (no transaction)

**REQ-04.2** A period is **active on a date** when:
`periodStart ≤ requestDate ≤ periodEnd` AND `status === 'active'`

**REQ-04.3** If **no active period** exists for the required section on the request date:
- Do NOT consume resources
- Instead create a DEBT transaction with `balanceChange = totalPrice` (euros)
- `totalPrice` is from `pricingSnapshot.calculated.totalPrice` for work sheets, or
  `valorAssist` for remote assistance
- This is D8: "fora do período → dívida em euros"

**REQ-04.4** If an active period **exists** but the relevant resource counter is `0`
(exhausted):
- Do NOT consume the resource counter further
- Instead create a DEBT transaction with `balanceChange = totalPrice` (euros)
- This is D9: "recursos esgotados com contrato ativo → dívida em euros"
- Exception: unlimited (`-1`) resources are never exhausted

**REQ-04.5** If an active period exists and resources are available, consume the
resource counter in `remainingResources` and write the DEBT transaction as normal.

**REQ-04.6** For remote assistance `paymentMethod === 'Contrato'` with section SH:
consume `horasAssistenciaAnuais` by the parsed `horasTotais` decimal hours value.
If the remaining hours are less than the requested hours, the full requested hours are
still consumed (going negative is allowed per D10 — debt is tracked at the balance level).

---

## REQ-05 — RENOVAR button (frontend + backend)

**REQ-05.1** A **RENOVAR** button must appear on the contract detail page
(`ContractsDetailView.vue`) for Admin users only (`usePermissions().permissions.canDelete`
is the existing Admin-check pattern).

**REQ-05.2** The button must appear once per active contract section:
- If `hasCPAContract` → show "Renovar CPA"
- If `hasSHContract` → show "Renovar S&H"
- If both → show both buttons independently

**REQ-05.3** Before executing, a confirmation dialog must be shown:
- Title: **"Confirmar Renovação"**
- Message: **"Tem a certeza que pretende renovar o contrato {section}? O período atual será encerrado e os recursos repõem-se aos valores originais do plano."**
- Confirm: **"Renovar"** / Cancel: **"Cancelar"**

**REQ-05.4** A new backend endpoint handles the renewal:
`POST /api/contracts/:uuid/renovar`

Body: `{ section: 'CPA' | 'SH' }`

This endpoint:
1. Reads the contract
2. Validates that the section is active (`hasCPAContract` or `hasSHContract`)
3. Finds the active period for `contractId + section`
4. Closes the period and opens a new one (REQ-03.2)
5. Returns the new `ContractPeriod`

**REQ-05.5** The endpoint is Admin-only (use `requireDeletePermission` middleware — the
same Admin guard used for deletes).

**REQ-05.6** On success, the contract detail view refreshes the balance display. On
error, the error is shown in the detail view (not inside the confirmation dialog).

---

## REQ-06 — Balance display (frontend)

**REQ-06.1** `ClientBalanceDisplay.vue` must be updated to show **active periods** instead
of the old `BalanceIndex`. For each active period:
- Section label (CPA / S&H)
- Period window: `periodStart → periodEnd`
- Remaining resources (manutenções, deslocações, horas)
- Progress indicator: remaining / original for each resource

**REQ-06.2** The new API endpoint for reading a client's active periods:
`GET /api/balance/:clientId/periods` — returns all active `ContractPeriod` documents.

**REQ-06.3** `TransactionHistoryDisplay.vue` must now read from `transactions-index.json`
via `GET /api/balance/:clientId/transactions` (this endpoint already exists but returned
`[]` — it must be fixed to use the index).

**REQ-06.4** Transaction history must be grouped by `periodId` in the UI. Each group
shows the period window as a header, with its transactions listed below.

**REQ-06.5** Closed periods must be shown in history (collapsed by default, expandable).

---

## REQ-07 — Balance routes

**REQ-07.1** New endpoint: `GET /api/balance/:clientId/periods`
- Returns all `ContractPeriod` documents for the client (active + closed)
- Accepts `?status=active` filter to return only active periods

**REQ-07.2** Fix existing endpoint: `GET /api/balance/:clientId/transactions`
- Currently returns `[]`; must now read `transactions-index.json` and return transactions
- Accepts existing query params: `type`, `startDate`, `endDate`, `limit`, `offset`

**REQ-07.3** New endpoint: `POST /api/contracts/:uuid/renovar`
- Described in REQ-05.4
- Lives in `packages/backend/src/routes/contracts.ts` (not in balance-routes)

**REQ-07.4** Fix route ordering bug: `GET /api/balance/report` must be registered
**before** `GET /api/balance/:clientId` so Hono resolves it correctly.

---

## REQ-08 — Migration script

**REQ-08.1** A one-time migration script must be written at
`scripts/migrate-saldo-rebuild.ts`. It is run manually by the admin, not automatically.

**REQ-08.2** Migration steps for each client:

1. Delete all existing balance data: `balance/{clientId}/index.json`,
   `balance/{clientId}/transactions/` (all keys), `balance/{clientId}/periods-index.json`,
   `balance/{clientId}/transactions-index.json`
2. Read all contracts for the client from `indexes/contracts-index.json`
3. For each active contract section (`hasCPAContract` / `hasSHContract`):
   - Open a new period using the contract's **current** resource fields and dates (D11)
4. Read all work sheets for the client from `indexes/work-sheets-index.json`, sorted
   by `request.date` ascending
5. For each work sheet with `paymentMethod === 'CONTRATO'`:
   - Resolve the active period on `request.date` for the relevant section
   - Apply REQ-04 rules (consume or convert to debt)
6. Read all remote assistances for the client from `indexes/remote-assistance-index.json`,
   sorted by `dataPedido` ascending
7. For each remote assistance with `paymentMethod === 'Contrato'`:
   - Resolve the active period on `dataPedido` for section SH
   - Apply REQ-04 rules

**REQ-08.3** The script must be idempotent — running it twice on the same client
produces the same result (step 1 clears all existing data before rebuilding).

**REQ-08.4** The script must process clients one at a time and log each step. On error
for one client, log and continue with the next (do not abort the whole run).

**REQ-08.5** The script reads directly from R2 via the Wrangler REST API or by running
as a Worker script invoked via `wrangler dev` — confirm approach at implementation time.

---

## Out of scope

- Automatic renewal trigger (all renewals are manual — D3)
- Per-client notification when a period is about to expire
- Partial period proration
- Any change to contract creation/update forms beyond the RENOVAR button
