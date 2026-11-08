# Requirements — Work Sheet Service Types Expansion

**Spec:** work-sheet-service-types  
**Date:** 2026-11-08  
**Context:** Prerequisite for the Saldo redesign. The client defined per-service-type
consumption rules that map to specific contract sections (CPA or S&H). The current
`serviceType` enum (`ASSISTÊNCIA PRESENCIAL | MANUTENÇÃO | INSTALAÇÃO`) cannot express
this mapping. This spec expands the enum and adds the `horasExtra` flag needed for
CPA presential assistance that also consumes hours.

---

## Business rules (from client meeting 2026-09-24)

| Service type | Contract section | Resources consumed |
|---|---|---|
| MANUTENÇÃO | CPA | 1 manutenção + 1 deslocação (always together) |
| ASSISTÊNCIA PRESENCIAL CPA | CPA | 1 deslocação; + hours from `horasTotais` if `horasExtra = true` |
| ASSISTÊNCIA PRESENCIAL SOFTWARE | S&H | 1 deslocação (pattern mirrors CPA presential) |
| INSTALAÇÃO | none | Nothing consumed |

When `paymentMethod !== 'CONTRATO'`, service type has no effect on balance — the rules
above only apply when the work sheet is charged to a contract.

---

## REQ-01 — Service type enum expansion

**REQ-01.1** The `serviceType` field on `WorkSheetOtherData` must accept the following
values (replacing the current set):

- `'MANUTENÇÃO'` — unchanged
- `'ASSISTÊNCIA PRESENCIAL CPA'` — new (replaces generic `'ASSISTÊNCIA PRESENCIAL'` for CPA context)
- `'ASSISTÊNCIA PRESENCIAL SOFTWARE'` — new (for S&H context)
- `'INSTALAÇÃO'` — unchanged
- `''` — empty/unset, unchanged

**REQ-01.2** The old value `'ASSISTÊNCIA PRESENCIAL'` must be removed from the enum.
Legacy records storing `'ASSISTÊNCIA PRESENCIAL'` must continue to display correctly
(backward-compat read path: render as-is without error).

**REQ-01.3** Search filters (`WorkSheetSearchFilters.serviceType`) must accept the new
values and reject the old one in new queries.

---

## REQ-02 — `horasExtra` flag

**REQ-02.1** `WorkSheetOtherData` must gain a boolean field `horasExtra` (default `false`).

**REQ-02.2** `horasExtra` is only meaningful when `serviceType === 'ASSISTÊNCIA PRESENCIAL CPA'`
and `paymentMethod === 'CONTRATO'`. In all other contexts it has no effect.

**REQ-02.3** When `horasExtra = true`, the balance extraction for a CPA presential work
sheet must consume hours from `horasTotais` (the calculated total hours field) in addition
to 1 deslocação.

**REQ-02.4** When `horasExtra = false`, only 1 deslocação is consumed for
`ASSISTÊNCIA PRESENCIAL CPA`.

---

## REQ-03 — Form: service type selector

**REQ-03.1** The service type selector in the Create and Update forms must show the four
new options with Portuguese labels:

| Value | Label shown in form |
|---|---|
| `''` | `--` |
| `'MANUTENÇÃO'` | `MANUTENÇÃO` |
| `'ASSISTÊNCIA PRESENCIAL CPA'` | `ASSISTÊNCIA PRESENCIAL CPA` |
| `'ASSISTÊNCIA PRESENCIAL SOFTWARE'` | `ASSISTÊNCIA PRESENCIAL SOFTWARE` |
| `'INSTALAÇÃO'` | `INSTALAÇÃO` |

**REQ-03.2** The `horasExtra` toggle must appear in the form only when
`serviceType === 'ASSISTÊNCIA PRESENCIAL CPA'` (conditional field, defined in config).

**REQ-03.3** Label for `horasExtra` toggle: **"Horas Extra"** with switch label
**"Incluir horas no desconto do contrato"**.

---

## REQ-04 — Form: contractId field behaviour

**REQ-04.1** The `contractId` field (already present, conditionally shown when
`paymentMethod === 'CONTRATO'`) must remain required when payment method is CONTRATO —
no change to existing behaviour.

**REQ-04.2** No additional contract-section selector is needed in this spec. The balance
extraction will infer the contract section (CPA vs S&H) from `serviceType` alone.

---

## REQ-05 — Validation

**REQ-05.1** When `paymentMethod === 'CONTRATO'`, `serviceType` must not be empty.
Error: `"Tipo de serviço obrigatório quando o pagamento é por contrato"`.

**REQ-05.2** `serviceType === 'INSTALAÇÃO'` with `paymentMethod === 'CONTRATO'` is valid
(user may record an installation under a contract client); it simply generates no balance
transaction.

**REQ-05.3** `horasExtra = true` is only valid when
`serviceType === 'ASSISTÊNCIA PRESENCIAL CPA'`. If any other service type is submitted
with `horasExtra = true`, validation must correct it to `false` silently (no user-facing
error — it's a form state cleanup, not a user mistake).

---

## REQ-06 — Detail and list views

**REQ-06.1** Detail views must display the full new service type label. Legacy records
with `'ASSISTÊNCIA PRESENCIAL'` must render the value as stored without crashing.

**REQ-06.2** List view cards must display the service type label. No display change needed
for the card structure — just the value shown.

**REQ-06.3** `horasExtra` must appear in the detail view only when
`serviceType === 'ASSISTÊNCIA PRESENCIAL CPA'` and its value is `true`. Label:
**"Horas Extra: Sim"**.

---

## REQ-07 — Balance extraction (shared layer)

**REQ-07.1** `extractWorkSheetDebtTransaction` in `@clever/shared/balance-extraction.ts`
must be updated to apply the per-type rules from the business rules table above.

**REQ-07.2** For `'MANUTENÇÃO'` + `paymentMethod === 'CONTRATO'`: consume
`manutencoesPorAno: -1` and `deslocacoesPorAno: -1`.

**REQ-07.3** For `'ASSISTÊNCIA PRESENCIAL CPA'` + `paymentMethod === 'CONTRATO'`:
consume `deslocacoesPorAno: -1`. If `horasExtra = true`, also consume
`horasAssistenciaAnuais` by the negative of the parsed `horasTotais` value
(HH:MM → decimal hours).

**REQ-07.4** For `'ASSISTÊNCIA PRESENCIAL SOFTWARE'` + `paymentMethod === 'CONTRATO'`:
consume `deslocacoesPorAno: -1` from S&H resources. Note: the current `ContractUsage`
model has a single set of counters, not per-section. This extraction rule must be correct
for the current model and will be revisited in the Saldo redesign spec when per-section
periods are introduced.

**REQ-07.5** For `'INSTALAÇÃO'` + any payment method: no transaction (return empty changes).

**REQ-07.6** Legacy records with `serviceType === 'ASSISTÊNCIA PRESENCIAL'` must be
treated identically to `'ASSISTÊNCIA PRESENCIAL CPA'` by the extraction function
(backward-compat fallback).

---

## REQ-08 — Search index

**REQ-08.1** The work-sheet search index entry must store `serviceType` using the new
enum values for new records. No re-indexing of old records is required — legacy values
remain as stored.

---

## Out of scope for this spec

- Per-section CPA/S&H balance tracking (that is the Saldo redesign spec).
- The `RENOVAR` button and contract period model.
- Any change to `contractId` validation beyond what already exists.
- Migration or recalculation of existing balances.
