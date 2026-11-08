# Tasks — Work Sheet Service Types Expansion

**Spec:** work-sheet-service-types  
**Date:** 2026-11-08  
**Execution order:** top to bottom — each task builds on the previous.

---

## Task 1 — Expand the type definitions in `@clever/shared`

**File:** `packages/shared/src/types/work-sheets/types.ts`

1. Replace the `serviceType` union on `WorkSheetOtherData`:
   - Remove `'ASSISTÊNCIA PRESENCIAL'`
   - Add `'ASSISTÊNCIA PRESENCIAL CPA'` and `'ASSISTÊNCIA PRESENCIAL SOFTWARE'`
   - Keep `'MANUTENÇÃO'`, `'INSTALAÇÃO'`, `''`

2. Add `horasExtra: boolean` to `WorkSheetOtherData` (after the `contract`/`contractYear` block).

3. Update `WorkSheetSearchFilters.serviceType` to use the new union (remove old value).

**Acceptance:** `pnpm type-check` passes with no errors on the shared package.

---

## Task 2 — Update validation in `@clever/shared`

**File:** `packages/shared/src/types/work-sheets/validation.ts`  
(If this file does not exist, create it following the pattern of other content-type
validation files.)

1. Add rule: when `paymentMethod === 'CONTRATO'` and `serviceType === ''`, push error
   `'Tipo de serviço obrigatório quando o pagamento é por contrato'`.

2. Do NOT add `horasExtra` cleanup here — that is a backend concern (Task 4).

**Acceptance:** `pnpm --filter @clever/shared type-check` passes. Validation function
rejects an empty serviceType when paymentMethod is CONTRATO.

---

## Task 3 — Update balance extraction in `@clever/shared`

**File:** `packages/shared/src/balance-extraction.ts`

Replace the body of `extractWorkSheetDebtTransaction` with the switch-based logic from
`design.md` section 4:

- `'MANUTENÇÃO'` + CONTRATO → `manutencoesPorAno: -1, deslocacoesPorAno: -1`
- `'ASSISTÊNCIA PRESENCIAL CPA'` + CONTRATO → `deslocacoesPorAno: -1`; add
  `horasAssistenciaAnuais: -totalHours` when `horasExtra === true`
- `'ASSISTÊNCIA PRESENCIAL'` (legacy) → same as CPA presential (fallback)
- `'ASSISTÊNCIA PRESENCIAL SOFTWARE'` + CONTRATO → `deslocacoesPorAno: -1`
- `'INSTALAÇÃO'` or `''` → empty changes
- Non-CONTRATO payment → unchanged (debt in euros from pricing snapshot)

**Acceptance:** `pnpm --filter @clever/shared type-check` passes. Manual test cases
(no test file required per ownership rules — no tests.md entry):
- MANUTENÇÃO + CONTRATO → both counters -1
- AP CPA + CONTRATO + horasExtra false → only deslocacoes -1
- AP CPA + CONTRATO + horasExtra true + totalHours '2:30' → deslocacoes -1, horas -2.5
- INSTALAÇÃO + CONTRATO → empty changes
- MANUTENÇÃO + DINHEIRO → balanceChange > 0

---

## Task 4 — Add `horasExtra` normalisation in the work-sheet backend route

**File:** `packages/backend/src/routes/work-sheets.ts`

Locate the POST and PUT handler bodies (after validation, before writing to R2). Add:

```typescript
// Normalise horasExtra — only valid for ASSISTÊNCIA PRESENCIAL CPA
if (contentData.otherData.serviceType !== 'ASSISTÊNCIA PRESENCIAL CPA') {
  contentData.otherData.horasExtra = false;
}
```

Apply to both create and update paths.

**Acceptance:** `pnpm type-check` passes. A work sheet with serviceType MANUTENÇÃO and
horasExtra true submitted to the API is stored with horasExtra false.

---

## Task 5 — Update the form config

**File:** `packages/frontend/src/config/work-sheets-form-sections.ts`

1. In the `service` section, replace the `serviceType` options array with the four new
   values (see `design.md` section 5).

2. Add the `horasExtra` switch field immediately after `serviceType` in the same section,
   with a `conditional` rule that shows it only when `serviceType === 'ASSISTÊNCIA PRESENCIAL CPA'`.

**Acceptance:** `pnpm type-check` passes. The form shows `horasExtra` only when
`ASSISTÊNCIA PRESENCIAL CPA` is selected; it is hidden for all other types.

---

## Task 6 — Update the detail view

**File:** `packages/frontend/src/views/work-sheets/WorkSheetDetailView.vue`  
(Or wherever `serviceType` and `otherData` fields are rendered — confirm at implementation.)

1. Verify that `serviceType` renders as stored — new values display without code change.

2. Add a conditional display for `horasExtra`:
   - Only render when `serviceType === 'ASSISTÊNCIA PRESENCIAL CPA'` AND `horasExtra === true`
   - Label: **"Horas Extra: Sim"**
   - Place it adjacent to the `serviceType` display field.

3. Verify that legacy records with `serviceType === 'ASSISTÊNCIA PRESENCIAL'` render
   the string without errors.

**Acceptance:** `pnpm type-check` passes. Detail view shows "Horas Extra: Sim" only for
CPA presential records with the flag set. Legacy records render without crash.

---

## Task 7 — Final type-check and lint

Run in order:

```bash
pnpm type-check
pnpm check-all
```

Fix any type errors or lint warnings introduced by this spec. Do not fix pre-existing
unrelated issues.

**Acceptance:** both commands exit 0.
