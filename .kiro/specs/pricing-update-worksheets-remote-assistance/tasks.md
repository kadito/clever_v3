# Pricing Update (Worksheets & Remote Assistance) — Tasks

## Task 1: Create Work Sheet Constants and Pricing Function
- [x] 1.1 Add `WORK_SHEET_CONSTANTS` object to `packages/shared/src/types/work-sheets/types.ts`
  - Design ref: [§1 Pricing Constants Centralization](design.md#1-pricing-constants-centralization) — Work Sheet Constants
  - Scope:
    - modify `packages/shared/src/types/work-sheets/types.ts`
  - Covers: PRICE-BR-001, PRICE-BR-002, PRICE-BR-003, PRICE-BR-004, PRICE-BR-005, PRICE-BR-009, PRICE-BR-011
  - Done when: `WORK_SHEET_CONSTANTS` exported with all values matching spec (€55, €70, €0.45, €45, €60, 180km, 1h, 0.23)

- [x] 1.2 Implement `calculateWorkSheetPricing()` function in shared validation
  - Design ref: [§2 Work Sheet Price Calculation](design.md#2-work-sheet-price-calculation)
  - Test ref: MI-02, MI-03, MI-04, MI-05, MI-06, MI-07, MI-08, MI-09
  - Scope:
    - modify `packages/shared/src/types/work-sheets/validation.ts`
  - Depends on: 1.1
  - Covers: PRICE-AC-001, PRICE-AC-002, PRICE-AC-003, PRICE-AC-004, PRICE-AC-005, PRICE-AC-012, PRICE-BR-001, PRICE-BR-002, PRICE-BR-003, PRICE-BR-004, PRICE-BR-005, PRICE-BR-009, PRICE-BR-011
  - Done when: `calculateWorkSheetPricing()` exported, handles all edge cases from design (missing times → zeroed, min 1h, 180km threshold, overnight wrap-around, displacement disabled)

- [x] 1.3 Write unit tests for `WORK_SHEET_CONSTANTS` and `calculateWorkSheetPricing()`
  - Test ref: MI-01, MI-02, MI-03, MI-04, MI-05, MI-06, MI-07, MI-08, MI-09
  - Scope:
    - create `packages/shared/src/types/work-sheets/__tests__/pricing.test.ts`
  - Depends on: 1.1, 1.2
  - Covers: PRICE-BR-001–BR-005, PRICE-BR-009, PRICE-BR-011, PRICE-AC-001–AC-005, PRICE-AC-012
  - Done when: All MI scenarios pass — weekday rate €55, weekend rate €70, min 1h rule, 180km threshold, mileage €0.45/km, missing times → zeroed, overnight wrap-around, displacement disabled, constants match spec

## Task 2: Update Remote Assistance Constants and Pricing Function
- [x] 2.1 Update `REMOTE_ASSISTANCE_CONSTANTS` with new rates and time windows
  - Design ref: [§1 Pricing Constants Centralization](design.md#1-pricing-constants-centralization) — Remote Assistance Constants Updated
  - Scope:
    - modify `packages/shared/src/types/remote-assistance/types.ts`
  - Covers: PRICE-BR-006, PRICE-BR-007, PRICE-BR-008, PRICE-BR-009, PRICE-BR-010
  - Done when: Constants updated: `PRICE_BUSINESS_HOURS=45`, `PRICE_AFTER_HOURS=60`, `BUSINESS_HOURS_START/END` replaced by morning/afternoon minute-based windows, `BILLING_INCREMENT_MINUTES=15`

- [x] 2.2 Implement `calculateRemoteAssistancePricing()` with split billing
  - Design ref: [§3 Remote Assistance Price Calculation — Split Billing](design.md#3-remote-assistance-price-calculation--split-billing), [§6 Contract/Warranty Zero-Cost Handling](design.md#6-contractwarranty-zero-cost-handling)
  - Test ref: MI-11 through MI-20
  - Scope:
    - modify `packages/shared/src/types/remote-assistance/validation.ts`
  - Depends on: 2.1
  - Covers: PRICE-AC-006, PRICE-AC-007, PRICE-AC-008, PRICE-AC-009, PRICE-AC-011, PRICE-BR-006, PRICE-BR-007, PRICE-BR-008, PRICE-BR-009, PRICE-BR-010, PRICE-BR-012
  - Done when: `calculateRemoteAssistancePricing()` exported, implements minute-level split billing with two business windows (09:00-12:30, 14:30-18:00), 15-min rounding on total, Contrato/Garantia → zero cost, weekends → all off-hours

- [x] 2.3 Write unit tests for `REMOTE_ASSISTANCE_CONSTANTS` and `calculateRemoteAssistancePricing()`
  - Test ref: MI-10, MI-11, MI-12, MI-13, MI-14, MI-15, MI-16, MI-17, MI-18, MI-19, MI-20
  - Scope:
    - create `packages/shared/src/types/remote-assistance/__tests__/pricing.test.ts`
  - Depends on: 2.1, 2.2
  - Covers: PRICE-BR-006–BR-010, PRICE-BR-012, PRICE-AC-006–AC-009, PRICE-AC-011
  - Done when: All MI scenarios pass — business hours only €45/h, off-hours only €60/h, lunch gap crossing, afternoon boundary split, full-day crossing, weekend → all off-hours, 15-min rounding, Contrato/Garantia → zero cost, missing times → zeroed, constants match spec

## Task 3: Update Work Sheet Frontend Views
- [x] 3.1 Refactor `WorkSheetsCreateView.vue` — remove inline pricing functions, use shared calculation, always show pricing
  - Design ref: [§4 Frontend — Work Sheet Views](design.md#4-frontend--work-sheet-views-create-update-detail) — Create & Update Views
  - Scope:
    - modify `packages/frontend/src/views/work-sheets/WorkSheetsCreateView.vue`
  - Depends on: 1.1, 1.2
  - Covers: PRICE-AC-001, PRICE-AC-002, PRICE-AC-003, PRICE-AC-004, PRICE-AC-005, PRICE-AC-012, PRICE-UX-003, PRICE-UX-004
  - Done when: Inline `getDisplacementRate`, `getHourlyRate`, `getKmsPrice`, `getLaborPrice`, `getTotalPrice` removed; imports `calculateWorkSheetPricing` + `WORK_SHEET_CONSTANTS`; pricing section (hourly rate + labor) always visible; displacement costs conditional; type-checks pass

- [x] 3.2 Refactor `WorkSheetsUpdateView.vue` — same pattern as CreateView
  - Design ref: [§4 Frontend — Work Sheet Views](design.md#4-frontend--work-sheet-views-create-update-detail) — Create & Update Views
  - Scope:
    - modify `packages/frontend/src/views/work-sheets/WorkSheetsUpdateView.vue`
  - Depends on: 1.1, 1.2
  - Covers: PRICE-AC-001, PRICE-AC-002, PRICE-AC-003, PRICE-AC-004, PRICE-AC-005, PRICE-AC-012, PRICE-UX-003, PRICE-UX-004
  - Done when: Same deletions and pattern as 3.1 applied to UpdateView; pricing always visible; type-checks pass

- [x] 3.3 Refactor `WorkSheetsDetailView.vue` — use shared calculation
  - Design ref: [§4 Frontend — Work Sheet Views](design.md#4-frontend--work-sheet-views-create-update-detail) — Detail View
  - Scope:
    - modify `packages/frontend/src/views/work-sheets/WorkSheetsDetailView.vue`
  - Depends on: 1.1, 1.2
  - Covers: PRICE-AC-001, PRICE-AC-002, PRICE-AC-003, PRICE-AC-004, PRICE-AC-005, PRICE-AC-012, PRICE-UX-003, PRICE-UX-004
  - Done when: Inline pricing functions removed; imports shared calculation; pricing display uses `calculateWorkSheetPricing()` result; type-checks pass

- [x] 3.4 Write integration tests for Work Sheet pricing display
  - Test ref: MI-21, MI-22, MI-23
  - Scope:
    - create `packages/frontend/src/views/work-sheets/__tests__/pricing-display.test.ts`
  - Depends on: 3.1, 3.2, 3.3
  - Covers: PRICE-UX-003, PRICE-UX-004
  - Done when: Tests verify pricing section visible without displacement, displacement costs conditional, rates from constants, total updates reactively

## Task 4: Update Remote Assistance Frontend Views
- [x] 4.1 Refactor `RemoteAssistanceCreateView.vue` — use new unified calculation, update pricing note and labels
  - Design ref: [§5 Frontend — Remote Assistance Views](design.md#5-frontend--remote-assistance-views-create-update-detail) — Create & Update Views
  - Scope:
    - modify `packages/frontend/src/views/remote-assistance/RemoteAssistanceCreateView.vue`
  - Depends on: 2.1, 2.2
  - Covers: PRICE-AC-006, PRICE-AC-007, PRICE-AC-008, PRICE-AC-009, PRICE-AC-010, PRICE-AC-011, PRICE-UX-001, PRICE-UX-002
  - Done when: Imports `calculateRemoteAssistancePricing`; removes `calculateAssistanceValueWithBusinessHours` import; pricing note shows "€45/hora (09:00-12:30, 14:30-18:00) | €60/hora (outras horas) + IVA"; breakdown labels updated; zero-cost notice works; type-checks pass

- [x] 4.2 Refactor `RemoteAssistanceUpdateView.vue` — same pattern as CreateView
  - Design ref: [§5 Frontend — Remote Assistance Views](design.md#5-frontend--remote-assistance-views-create-update-detail) — Create & Update Views
  - Scope:
    - modify `packages/frontend/src/views/remote-assistance/RemoteAssistanceUpdateView.vue`
  - Depends on: 2.1, 2.2
  - Covers: PRICE-AC-006, PRICE-AC-007, PRICE-AC-008, PRICE-AC-009, PRICE-AC-010, PRICE-AC-011, PRICE-UX-001, PRICE-UX-002
  - Done when: Same refactor as 4.1 applied to UpdateView; type-checks pass

- [x] 4.3 Refactor `RemoteAssistanceDetailView.vue` — use unified calculation, update note and labels
  - Design ref: [§5 Frontend — Remote Assistance Views](design.md#5-frontend--remote-assistance-views-create-update-detail) — Detail View
  - Scope:
    - modify `packages/frontend/src/views/remote-assistance/RemoteAssistanceDetailView.vue`
  - Depends on: 2.1, 2.2
  - Covers: PRICE-AC-006, PRICE-AC-007, PRICE-AC-008, PRICE-AC-009, PRICE-AC-010, PRICE-AC-011, PRICE-UX-001, PRICE-UX-002
  - Done when: Imports `calculateRemoteAssistancePricing`; removes `calculateAssistanceValue` import; pricing note updated; breakdown labels show new windows including lunch gap mention; type-checks pass

- [x] 4.4 Write integration tests for Remote Assistance pricing display
  - Test ref: MI-24, MI-25, MI-26
  - Scope:
    - create `packages/frontend/src/views/remote-assistance/__tests__/pricing-display.test.ts`
  - Depends on: 4.1, 4.2, 4.3
  - Covers: PRICE-UX-001, PRICE-UX-002, PRICE-AC-010
  - Done when: Tests verify pricing note shows new text, breakdown labels correct, zero-cost notice on Contrato/Garantia

## Task 5: Update Backend Index Extraction
- [x] 5.1 Update Work Sheet `extractIndexFields` to use `calculateWorkSheetPricing()`
  - Design ref: [Appendix: Backend Index Extraction](design.md#appendix-backend-index-extraction--interface) — Work Sheet extractIndexFields
  - Test ref: [MI — Backend index extraction (WS)](tests.md)
  - Scope:
    - modify `packages/backend/src/routes/work-sheets.ts`
  - Depends on: 1.2
  - Covers: PRICE-BR-001, PRICE-BR-002, PRICE-BR-003, PRICE-BR-004, PRICE-BR-005
  - Done when: `extractIndexFields` calls `calculateWorkSheetPricing()` instead of `calculateWorkSheetTotals()`; index fields populated with new rates; type-checks pass

- [x] 5.2 Update Remote Assistance `extractIndexFields` and calculate-value endpoint
  - Design ref: [Appendix: Backend Index Extraction](design.md#appendix-backend-index-extraction--interface) — Remote Assistance extractIndexFields + /calculate-value endpoint
  - Test ref: [MI — Backend index extraction (RA)](tests.md)
  - Scope:
    - modify `packages/backend/src/routes/remote-assistance.ts`
  - Depends on: 2.2
  - Covers: PRICE-BR-006, PRICE-BR-007, PRICE-BR-008, PRICE-BR-012
  - Done when: `extractIndexFields` uses `calculateRemoteAssistancePricing()`; `/calculate-value` endpoint uses new function; index stores correct new values; type-checks pass

- [x] 5.3 Write unit tests for backend index extraction
  - Test ref: MI-27, MI-28
  - Scope:
    - create `packages/backend/src/__tests__/pricing-index-extraction.test.ts`
  - Depends on: 5.1, 5.2
  - Covers: PRICE-BR-001–BR-008, PRICE-BR-012
  - Done when: Tests verify WS extractIndexFields stores correct breakdown with new rates; RA extractIndexFields stores correct values with new split billing

## Task 6: Remove Old Pricing Functions (Cleanup)
- [x] 6.1 Remove deprecated `calculateWorkSheetTotals()` function if no longer used
  - Design ref: [§2 Work Sheet Price Calculation](design.md#2-work-sheet-price-calculation) — Backward compatibility
  - Scope:
    - modify `packages/shared/src/types/work-sheets/validation.ts`
  - Depends on: 5.1
  - Covers: (cleanup — no new REQ coverage)
  - Done when: `calculateWorkSheetTotals()` removed or deprecated; no remaining imports of old function; type-checks pass

- [x] 6.2 Remove deprecated Remote Assistance pricing functions
  - Design ref: [§3 Remote Assistance Price Calculation](design.md#3-remote-assistance-price-calculation--split-billing) — Deletions
  - Scope:
    - modify `packages/shared/src/types/remote-assistance/validation.ts`
  - Depends on: 4.1, 4.2, 4.3, 5.2
  - Covers: (cleanup — no new REQ coverage)
  - Done when: `calculateAssistanceValueWithBusinessHours()`, `calculateAssistanceValue()`, and `isBusinessHours()` removed; no remaining imports of old functions; `calculateRoundedTotalHours()` and `calculateTotalHours()` kept; type-checks pass

## Task 7: Full Build Verification
- [x] 7.1 Run type-check, lint, and full test suite
  - Scope:
    - (no file modifications — verification only)
  - Depends on: 1.3, 2.3, 3.4, 4.4, 5.3, 6.1, 6.2
  - Covers: (verification — confirms all PRICE-* requirements are implemented and passing)
  - Done when: `pnpm type-check` exits 0, `pnpm test` exits 0 (all new + existing tests pass), no lint errors
