# Brief — Work Sheet Service Types Expansion

**Spec:** work-sheet-service-types  
**Date:** 2026-11-08  
**Status:** ready to implement

## What and why

The client defined per-service-type consumption rules for the Saldo redesign. A work
sheet's service type now determines which contract section is charged (CPA vs S&H) and
what is consumed (manutenção + deslocação, or deslocação only, or nothing). The current
`serviceType` enum has a generic `ASSISTÊNCIA PRESENCIAL` that cannot express this
distinction.

This spec expands the enum, adds the `horasExtra` flag for CPA presential work that also
consumes assistance hours, and updates the balance extraction logic to apply the new rules.

## What changes

- `types.ts` — new `serviceType` values; new `horasExtra: boolean` field
- `validation.ts` — serviceType required when paymentMethod is CONTRATO
- `balance-extraction.ts` — per-type consumption switch replaces the current flat logic
- `work-sheets-form-sections.ts` — new options + conditional `horasExtra` toggle
- `WorkSheetDetailView.vue` — shows `horasExtra` when applicable
- `work-sheets.ts` (backend) — normalises `horasExtra` to false for non-CPA-presential types

## What does not change

- R2 storage keys and structure
- Content route template
- Any other content type
- Existing records (backward-compat read handled by fallback in extraction)

## Prerequisite for

The Saldo redesign spec (`saldo-por-periodo-contrato`), which will use `serviceType` to
route consumption to the correct contract section period (CPA or S&H).

## Estimated scope

7 tasks, all in existing files. No new files except possibly
`packages/shared/src/types/work-sheets/validation.ts` if it does not already exist.
