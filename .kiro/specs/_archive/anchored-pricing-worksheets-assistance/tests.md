# Anchored Pricing — Tests

## [MI] — Strategy

| ID | Interface | Test type | Key scenarios from design | Mocked dependencies | REQ-ID |
|----|-----------|-----------|--------------------------|---------------------|--------|
| MI-01 | `calculateWorkSheetPricing()` with `rateOverrides` | unit | 1. Without overrides → uses constants (backward compat) 2. With overrides → uses provided rates 3. Edge case: zero kms, overnight wrap, minimum hours with custom rates | None (pure function) | PRICE-BR-002, PRICE-BR-007, PRICE-AC-010 |
| MI-02 | `calculateRemoteAssistancePricing()` with `rateOverrides` | unit | 1. Without overrides → uses constants 2. With overrides → uses provided rates 3. Weekend/holiday + overrides 4. Contrato/Garantia → zero-cost regardless of rates | None (pure function) | PRICE-BR-002, PRICE-BR-007, PRICE-AC-010 |
| MI-03 | `createWorkSheetPricingSnapshot()` | unit | 1. Captures all 7 current constants in `rates` 2. `calculated` matches what `calculateWorkSheetPricing()` returns with same input 3. Result shape matches `WorkSheetPricingSnapshot` interface | None (pure function) | PRICE-BR-001, PRICE-BR-005 |
| MI-04 | `createRemoteAssistancePricingSnapshot()` | unit | 1. Captures all 7 current constants in `rates` 2. `calculated` matches standalone calculation 3. Zero-cost for Contrato/Garantia | None (pure function) | PRICE-BR-001, PRICE-BR-006 |
| MI-05 | `recalculateWorkSheetPricingSnapshot()` | unit | 1. Uses existing rates (not current constants) 2. Recalculates with new field values 3. `rates` object is preserved unchanged | None (pure function) | PRICE-BR-007, PRICE-AC-009 |
| MI-06 | `recalculateRemoteAssistancePricingSnapshot()` | unit | 1. Uses existing rates 2. Recalculates with new times 3. `rates` preserved | None (pure function) | PRICE-BR-007, PRICE-AC-009 |
| MI-07 | Work Sheet POST handler (snapshot integration) | integration | 1. Created record has `pricingSnapshot` populated 2. `pricingSnapshot.rates` matches current constants 3. Reject creation with NaN result (PRICE-AC-013) | R2 (mocked) | PRICE-BR-001, PRICE-BR-002, PRICE-AC-001, PRICE-AC-002, PRICE-AC-013 |
| MI-08 | Work Sheet PUT handler (recalculation) | integration | 1. Update with snapshot → uses anchored rates 2. Update without snapshot (legacy) → uses current constants 3. `rates` unchanged after update | R2 (mocked) | PRICE-BR-003, PRICE-BR-007, PRICE-AC-009, PRICE-AC-010 |
| MI-09 | Remote Assistance POST handler (snapshot integration) | integration | 1. Created record has `pricingSnapshot` 2. `valorAssist` matches `pricingSnapshot.calculated.totalValue` 3. Reject creation with NaN result | R2 (mocked) | PRICE-BR-001, PRICE-BR-002, PRICE-AC-004, PRICE-AC-005, PRICE-AC-013 |
| MI-10 | Remote Assistance PUT handler (recalculation) | integration | 1. Update with snapshot → uses anchored rates 2. Update without snapshot (legacy) → uses current constants | R2 (mocked) | PRICE-BR-003, PRICE-BR-007, PRICE-AC-009, PRICE-AC-010 |
| MI-11 | `extractWorkSheetDebtTransaction()` | unit | 1. Record with snapshot → reads `totalPrice` from snapshot 2. Record without snapshot → calls deprecated `calculateWorkSheetTotals()` 3. Warranty/Contract paths unchanged | None (pure function) | PRICE-BR-009 |
| MI-12 | Frontend pricing computed (WorkSheet) | unit | 1. Record with snapshot → returns snapshot calculated values 2. Record without snapshot → calls `calculateWorkSheetPricing()` 3. Return shape identical for both paths | None (computed only) | PRICE-BR-004, PRICE-AC-003, PRICE-AC-011, PRICE-AC-012 |
| MI-13 | Frontend pricing computed (RemoteAssistance) | unit | 1. Record with snapshot → returns snapshot calculated values 2. Record without snapshot → calls `calculateRemoteAssistancePricing()` 3. `displayRates` reads from snapshot or constants | None (computed only) | PRICE-BR-004, PRICE-AC-006, PRICE-AC-011, PRICE-AC-012 |

## [MA] — Acceptance Tests

| ID | Scenario | Steps | Expected result | REQ-ID |
|----|----------|-------|-----------------|--------|
| MA-01 | New Work Sheet created with anchored pricing | 1. POST a new Work Sheet with valid times + displacement 2. GET the created record | Record contains `pricingSnapshot` with `rates` matching current `WORK_SHEET_CONSTANTS` and `calculated.totalPrice > 0` | PRICE-AC-001, PRICE-AC-002 |
| MA-02 | New Remote Assistance created with anchored pricing | 1. POST a new Remote Assistance with valid times 2. GET the created record | Record contains `pricingSnapshot` with `rates` matching current `REMOTE_ASSISTANCE_CONSTANTS` and `calculated.totalValue > 0` | PRICE-AC-004, PRICE-AC-005 |
| MA-03 | Work Sheet update recalculates with anchored rates | 1. Create a Work Sheet (stores snapshot with rates X) 2. PUT with different arrival/departure times | `pricingSnapshot.rates` unchanged (still X), `pricingSnapshot.calculated` recalculated with new times using rates X | PRICE-AC-009, PRICE-BR-007 |
| MA-04 | Legacy Work Sheet update uses current constants | 1. Create a mock legacy record (no `pricingSnapshot`) 2. PUT with updated times | A new `pricingSnapshot` is created using current `WORK_SHEET_CONSTANTS` | PRICE-AC-010 |
| MA-05 | Detail view shows anchored price for new record | 1. Create a Work Sheet 2. Open Detail View | Pricing section shows values from `pricingSnapshot.calculated`, not from dynamic calculation | PRICE-AC-003, PRICE-BR-004 |
| MA-06 | Detail view shows calculated price for legacy record | 1. View a legacy record without `pricingSnapshot` | Pricing section shows values from `calculateWorkSheetPricing()` with current constants — no error or warning | PRICE-AC-011, PRICE-AC-012 |
| MA-07 | Balance reads from anchored price | 1. Create a Work Sheet with Faturação payment 2. Check balance extraction | Balance uses `pricingSnapshot.calculated.totalPrice` as debt amount | PRICE-BR-009 |
| MA-08 | NaN pricing rejects creation | 1. POST a Work Sheet with invalid time format (empty strings) that causes NaN in calculation | Returns HTTP 400 with error message | PRICE-AC-013 |
