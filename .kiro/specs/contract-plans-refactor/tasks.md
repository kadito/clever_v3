# Contract Plans Refactor — Tasks

## Task 1: Update shared types — remove CPA_1500, remove discount, add price fields

- [x] 1.1 Update `ContractPlanConfig` to remove `CPA_1500` key and add new typed plan interfaces (`CPAPlan`, `SHPlan`, `PlanBaseParameters`, `PlanScheduleInfo`, `CPAPlanParameters`, `SHPlanParameters`)
- [x] 1.2 Remove `cpaContractType` and `distanceCPA` fields from `ContractData`
- [x] 1.3 Remove `desconto` from `ContractEquipment`
- [x] 1.4 Add `precoCPA?: number` and `precoSH?: number` to `ContractData`
- [x] 1.5 Update `ContractCreationData` and `ContractUpdateData` to reflect removals/additions
- [x] 1.6 Update `modalidadePagamentoCPA` type to remove `'TRIMESTRAL'` (CPA only has Mensal/Semestral/Anual per design)
- [x] 1.7 Update `modalidadePagamentoSH` type to remove `'TRIMESTRAL'` and `'SEMESTRAL'` (S&H only has Mensal/Anual per design)

**Design ref:** [Section 1.1 — New Plan Data Schema](design.md#11-new-plan-data-schema) (L1-130), [Section 2.1 — Contract Data Type Changes](design.md#21-contract-data-type-changes) (L210-240), [Section 3.3 — Pricing Model Change](design.md#33-pricing-model-change--remove-discount-per-equipment) (L340-380), [Section 3.4 — Contract Price Field](design.md#34-contract-price-field) (L380-400)
**Test ref:** —
**Scope:**
- modify `packages/shared/src/types/contracts/types.ts`

**Depends on:** —
**Covers:** PLANS-DEC-001, PLANS-BR-003, PLANS-BR-010, PLANS-AC-014, PLANS-AC-019
**Done when:** `pnpm --filter @clever/shared type-check` passes (downstream packages may have errors — expected until tasks 2-6 fix consumers)

---

## Task 2: Replace `contract-plans.json` with new data structure

- [x] 2.1 Replace `contract-plans.json` content with new structure matching `ContractPlanConfig` (CPA flat pricing, S&H distance-based, schedule info, updated values from Excel sources)

**Design ref:** [Section 1.2 — New contract-plans.json Data Values](design.md#12-new-contract-plansjson-data-values) (L130-210)
**Test ref:** —
**Scope:**
- modify `packages/frontend/src/config/contract-plans.json`

**Depends on:** Task 1
**Covers:** PLANS-AC-012, PLANS-AC-013, PLANS-BR-004, PLANS-BR-011, PLANS-DEC-002
**Done when:** JSON is valid and matches the typed `ContractPlanConfig` interface from Task 1

---

## Task 3: Update `planSelection.ts` service and delete `usePlanData.ts`

- [ ] 3.1 Remove `CPA_1500` from `ContractType` union — now `'CPA' | 'S&H'`
- [x] 3.2 Update `requiresDistance()` — returns `false` for CPA, `true` for S&H only
- [x] 3.3 Update `shouldShowPriceTable()` — CPA always shows prices when plan selected (no distance check)
- [x] 3.4 Update `getPlanDetails()` return type to match new plan interfaces
- [x] 3.5 Delete `packages/frontend/src/composables/usePlanData.ts`
- [x] 3.6 Simplify `usePlanSelection.ts` composable — remove CPA_1500 handling

**Design ref:** [Section 1.3 — Files to Delete](design.md#13-files-to-delete) (L210-215), [Section 1.4 — Files to Modify](design.md#14-files-to-modify) (L215-225), [Section 2.2 — Plan Service Changes](design.md#22-plan-service-changes) (L240-265)
**Test ref:** [MI-01 through MI-04](tests.md) — `planSelection.ts` unit tests
**Scope:**
- modify `packages/frontend/src/services/planSelection.ts`
- delete `packages/frontend/src/composables/usePlanData.ts`
- modify `packages/frontend/src/composables/usePlanSelection.ts`

**Depends on:** Task 1, Task 2
**Covers:** PLANS-DEC-001, PLANS-AC-012, PLANS-AC-013, PLANS-AC-019, PLANS-AC-020, PLANS-BR-010
**Done when:** MI-01 through MI-04 tests pass

---

## Task 4: Update validation logic

- [ ] 4.1 Remove `cpaContractType` required check from `validateContractCreation`
- [x] 4.2 Remove `distanceCPA` required check
- [x] 4.3 Remove `desconto` validation from `validateContractEquipment` (range check, first equip 0%)
- [x] 4.4 Add multi-equipment price validation: when `cpaEquipments.length >= 2`, `precoCPA` required > 0
- [x] 4.5 Add multi-equipment parameter validation for CPA: `deslocacoesPorAnoCPA` + `manutencoesPorAnoCPA` required
- [x] 4.6 Add multi-equipment price validation: when `shEquipments.length >= 2`, `precoSH` required > 0
- [x] 4.7 Add multi-equipment parameter validation for S&H: `deslocacoesPorAnoSH` + `horasAssistenciaAnualSH` required
- [x] 4.8 Add single-equipment validation: plan required when 1 equipment exists
- [x] 4.9 Update `validateContractUpdate` with same changes
- [x] 4.10 Remove always-required `horasAssistenciaAnualCPA`/`deslocacoesPorAnoCPA`/`manutencoesPorAnoCPA` validation for single-equipment (they come from plan, not user)

**Design ref:** [Section 5 — Validation Updates](design.md#5-validation-updates) (L500-620)
**Test ref:** [MI-05 through MI-09](tests.md) — validation unit tests
**Scope:**
- modify `packages/shared/src/types/contracts/validation.ts`

**Depends on:** Task 1
**Covers:** PLANS-AC-016, PLANS-AC-017, PLANS-AC-018, PLANS-BR-003, PLANS-DEC-001
**Done when:** MI-05 through MI-09 tests pass

---

## Task 5: Refactor `CPAContractSection.vue` — unified CPA type

- [x] 5.1 Remove "TIPO DE CONTRATO CPA" dropdown and `handleContractTypeChange()` function
- [x] 5.2 Remove "DISTÂNCIA" dropdown (CPA has flat pricing)
- [x] 5.3 Update plan selector — show unified plan list directly (no `cpaContractType` dependency)
- [x] 5.4 Update POS package checkbox condition: show for `cpa_premium` plan (not CPA_1500-dependent)
- [x] 5.5 Update POS package text to "+200€/ano" (was +100€)
- [x] 5.6 Update layout from 3-column grid to single plan selector
- [x] 5.7 Remove `cpaContractType` references from computed properties and template

**Design ref:** [Section 2.3 — CPAContractSection Component Changes](design.md#23-cpacontractsection-component-changes) (L265-310), [Section 6.4 — CPA Section Component Hierarchy](design.md#64-cpa-section-component-hierarchy-after-refactor) (L770-785)
**Test ref:** [MI-13](tests.md) — CPAContractSection unified type integration test
**Scope:**
- modify `packages/frontend/src/components/contracts/CPAContractSection.vue`

**Depends on:** Task 1, Task 3
**Covers:** PLANS-AC-019, PLANS-AC-020, PLANS-AC-022, PLANS-DEC-001, PLANS-BR-009
**Done when:** MI-13 test passes; component renders without CPA_1500 subtype selector

---

## Task 6: Remove discount from equipment components

- [x] 6.1 Remove `showDiscount` prop and discount input field from `EquipmentCard.vue`
- [x] 6.2 Remove default discount assignment and discount info callout from `CPAEquipmentManager.vue`
- [x] 6.3 Remove `desconto: 0` mapping in `SHContractSection.vue` `shEquipmentsForPricing` computed

**Design ref:** [Section 3.3 — Pricing Model Change](design.md#33-pricing-model-change--remove-discount-per-equipment) (L340-380), [Section 3.7 — Files to Modify](design.md#37-files-to-modify) (L440-460)
**Test ref:** [MI-09](tests.md) — validateContractEquipment no discount test
**Scope:**
- modify `packages/frontend/src/components/contracts/EquipmentCard.vue`
- modify `packages/frontend/src/components/contracts/CPAEquipmentManager.vue`
- modify `packages/frontend/src/components/contracts/SHContractSection.vue`

**Depends on:** Task 1
**Covers:** PLANS-BR-003, PLANS-AC-014, PLANS-AC-015
**Done when:** EquipmentCard no longer renders discount field; CPAEquipmentManager no longer sets default discount

---

## Task 7: Refactor `BenefitFieldsGroup.vue` — mode-aware + conditional fields

- [x] 7.1 Add `mode: 'auto' | 'manual'` prop and `contractType: 'CPA' | 'S&H'` prop
- [x] 7.2 Implement conditional field visibility: CPA shows manutenções + deslocações (hide horas); S&H shows horas + deslocações (hide manutenções)
- [x] 7.3 Implement mode behavior: `auto` → fields disabled with `bg-gray-100` + info text "Valores preenchidos automaticamente pelo plano selecionado"; `manual` → fields editable, empty, required with banner "Com múltiplos equipamentos, os valores devem ser especificados manualmente"
- [x] 7.4 Add CSS transition on background-color and border-color (200ms ease) for mode transitions
- [x] 7.5 Add `showErrors?: boolean` prop for manual mode validation display on save attempt

**Design ref:** [Section 4.2 — BenefitFieldsGroup Component Refactor](design.md#42-benefitfieldsgroup-component-refactor) (L470-500), [Section 4.3 — UX Visual Feedback](design.md#43-ux-visual-feedback) (L500-520)
**Test ref:** [MI-11, MI-12](tests.md) — BenefitFieldsGroup field visibility + mode behavior integration tests
**Scope:**
- modify `packages/frontend/src/components/contracts/BenefitFieldsGroup.vue`

**Depends on:** Task 1
**Covers:** PLANS-BR-005, PLANS-BR-006, PLANS-UX-001, PLANS-UX-002, PLANS-UX-003
**Done when:** MI-11 and MI-12 tests pass

---

## Task 8: Refactor `DynamicPlanDetails.vue` — simplified pricing

- [x] 8.1 Remove `calculateEquipmentCosts()` function and equipment discount logic
- [x] 8.2 Remove `equipments` prop (no longer needed for pricing calculation)
- [x] 8.3 Update `requiresDistanceForPricing` — CPA never requires distance (flat pricing)
- [x] 8.4 Update `paymentOptions` computed to handle new CPA flat pricing structure (`mensal/semestral/anual` keys instead of `monthly/quarterly/semiannual/annual`)
- [x] 8.5 Update `paymentOptions` computed for S&H — only `mensal/anual` (2 modalities per design)
- [x] 8.6 Update POS package price display from 100€ to 200€
- [x] 8.7 Add schedule info display section (read-only, from `plan.schedule`)

**Design ref:** [Section 4.4 — Price Field Component](design.md#44-price-field-component) (L520-540), [Section 4.5 — Schedule Info Display](design.md#45-schedule-info-display) (L540-560), [Section 8 — DynamicPlanDetails simplification](design.md#37-files-to-modify)
**Test ref:** [MI-14](tests.md) — DynamicPlanDetails simplified pricing integration test
**Scope:**
- modify `packages/frontend/src/components/contracts/DynamicPlanDetails.vue`

**Depends on:** Task 1, Task 2
**Covers:** PLANS-BR-001, PLANS-AC-002, PLANS-BR-010
**Done when:** MI-14 test passes; no equipment cost calculation exists in component

---

## Task 9: Implement equipment count reactive logic in contract sections

- [x] 9.1 Add equipment count mode logic to `CPAContractSection.vue`: compute `mode` as `'auto'` (1 equip) or `'manual'` (2+ equip)
- [x] 9.2 Implement Auto → Manual transition: clear auto-populated parameter values and price when equipment count goes from 1 to 2+
- [x] 9.3 Implement Manual → Auto transition: restore plan base values when equipment count goes from 2+ back to 1
- [x] 9.4 Implement plan change in Auto mode: re-populate parameters from new plan
- [x] 9.5 Implement plan change in Manual mode: do NOT clear manual values; update schedule info only
- [x] 9.6 Pass `mode` prop to `BenefitFieldsGroup`
- [x] 9.7 Add manual price input field (visible only in manual mode): label "PREÇO DO CONTRATO (€)", type number, required
- [x] 9.8 Apply same logic to `SHContractSection.vue` (identical behavior per PLANS-BR-012)
- [x] 9.9 Update `SHContractSection.vue` plan options to use `getPlanOptions('S&H')` from service (currently hardcoded)

**Design ref:** [Section 3.1 — Mode Definition](design.md#31-mode-definition) (L290-310), [Section 3.2 — Mode Transitions](design.md#32-mode-transitions) (L310-340), [Section 3.6 — Reactive Watcher Logic](design.md#36-reactive-watcher-logic-composable) (L420-440), [Section 6.1-6.3 — Component Flow](design.md#61-plan-selection-flow-single-equipment--auto-mode) (L630-770)
**Test ref:** [MI-10](tests.md) — Equipment count mode logic unit test
**Scope:**
- modify `packages/frontend/src/components/contracts/CPAContractSection.vue`
- modify `packages/frontend/src/components/contracts/SHContractSection.vue`

**Depends on:** Task 5, Task 6, Task 7, Task 8
**Covers:** PLANS-BR-001, PLANS-BR-002, PLANS-BR-007, PLANS-BR-008, PLANS-BR-012, PLANS-AC-001, PLANS-AC-003, PLANS-AC-004, PLANS-AC-005, PLANS-AC-006, PLANS-AC-007, PLANS-AC-008, PLANS-AC-009, PLANS-AC-010, PLANS-AC-011, PLANS-DEC-003
**Done when:** MI-10 test passes; form transitions between auto/manual mode based on equipment count

---

## Task 10: Update parent form views (Create/Update) to wire new data flow

- [x] 10.1 Update contract Create view: remove `cpaContractType` and `distanceCPA` from form data initialization
- [x] 10.2 Add `precoCPA` and `precoSH` to form data initialization
- [x] 10.3 Remove discount-related initialization from equipment creation
- [x] 10.4 Update contract Update view with same changes
- [x] 10.5 Ensure equipment count watcher emits correct field updates for parameters

**Design ref:** [Section 3.7 — Files to Modify](design.md#37-files-to-modify) (L440-460), [Section 6.6 — Data Flow Diagram](design.md#66-data-flow-diagram) (L790-830)
**Test ref:** —
**Scope:**
- modify `packages/frontend/src/views/contracts/ContractCreateView.vue`
- modify `packages/frontend/src/views/contracts/ContractUpdateView.vue`

**Depends on:** Task 9
**Covers:** PLANS-AC-001, PLANS-AC-007, PLANS-AC-011, PLANS-DEC-001
**Done when:** Contract create and update forms render without errors; form data initialization excludes removed fields and includes new fields

---

## Task 11: Write unit tests for planSelection service

- [x] 11.1 Write MI-01: `getAvailablePlans()` — returns CPA plans for 'CPA', S&H plans for 'S&H', empty for invalid type
- [x] 11.2 Write MI-02: `requiresDistance()` — returns `false` for 'CPA', `true` for 'S&H'
- [x] 11.3 Write MI-03: `getPlanDetails()` — returns correct plan by ID, null for unknown
- [x] 11.4 Write MI-04: `getPlanOptions()` — returns 3 options for CPA, 6 for S&H, empty for unknown

**Design ref:** [Section 1.1](design.md#11-new-plan-data-schema), [Section 2.2](design.md#22-plan-service-changes)
**Test ref:** [MI-01, MI-02, MI-03, MI-04](tests.md)
**Scope:**
- create `packages/frontend/src/services/__tests__/planSelection.test.ts`

**Depends on:** Task 3
**Covers:** PLANS-AC-012, PLANS-AC-013, PLANS-AC-019, PLANS-AC-020, PLANS-AC-021, PLANS-BR-010
**Done when:** All 4 test suites pass with `pnpm --filter @clever/frontend test`

---

## Task 12: Write unit tests for validation

- [x] 12.1 Write MI-05: `validateContractCreation()` single equipment — plan required, passes when plan selected, fails without plan
- [x] 12.2 Write MI-06: `validateContractCreation()` multi equipment CPA — price required, parameters required, passes when all provided
- [x] 12.3 Write MI-07: `validateContractCreation()` multi equipment S&H — price required, horas + deslocações required, passes when all provided
- [x] 12.4 Write MI-08: `validateContractCreation()` CPA unified — no cpaContractType validation, no distanceCPA required
- [x] 12.5 Write MI-09: `validateContractEquipment()` no discount — does not validate discount field

**Design ref:** [Section 5](design.md#5-validation-updates)
**Test ref:** [MI-05, MI-06, MI-07, MI-08, MI-09](tests.md)
**Scope:**
- create `packages/shared/src/types/contracts/__tests__/validation.test.ts`

**Depends on:** Task 4
**Covers:** PLANS-AC-016, PLANS-AC-017, PLANS-AC-018, PLANS-AC-019, PLANS-BR-003, PLANS-DEC-001
**Done when:** All 5 test suites pass with `pnpm --filter @clever/shared test`

---

## Task 13: Write unit test for equipment count mode logic

- [x] 13.1 Write MI-10: Equipment count mode logic — 1→2 equips clears values, 2→1 restores plan values, plan change in auto mode repopulates

**Design ref:** [Section 3.2 — Mode Transitions](design.md#32-mode-transitions), [Section 3.6 — Reactive Watcher Logic](design.md#36-reactive-watcher-logic-composable)
**Test ref:** [MI-10](tests.md)
**Scope:**
- create `packages/frontend/src/components/contracts/__tests__/equipmentModeLogic.test.ts`

**Depends on:** Task 9
**Covers:** PLANS-BR-007, PLANS-BR-008, PLANS-AC-007, PLANS-AC-011
**Done when:** MI-10 test passes with `pnpm --filter @clever/frontend test`

---

## Task 14: Write integration tests for BenefitFieldsGroup and CPAContractSection

- [x] 14.1 Write MI-11: BenefitFieldsGroup field visibility — CPA shows manutenções + deslocações (no horas), S&H shows horas + deslocações (no manutenções)
- [x] 14.2 Write MI-12: BenefitFieldsGroup mode behavior — auto mode: fields disabled + populated; manual mode: fields editable + empty
- [x] 14.3 Write MI-13: CPAContractSection unified type — no subtype selector rendered, plan dropdown shows 3 unified plans, POS only for premium
- [x] 14.4 Write MI-14: DynamicPlanDetails simplified pricing — shows flat prices for CPA (no distance), distance-based for S&H, no equipment cost calculation

**Design ref:** [Section 4.2](design.md#42-benefitfieldsgroup-component-refactor), [Section 2.3](design.md#23-cpacontractsection-component-changes), [Section 4.4](design.md#44-price-field-component)
**Test ref:** [MI-11, MI-12, MI-13, MI-14](tests.md)
**Scope:**
- create `packages/frontend/src/components/contracts/__tests__/BenefitFieldsGroup.test.ts`
- create `packages/frontend/src/components/contracts/__tests__/CPAContractSection.test.ts`
- create `packages/frontend/src/components/contracts/__tests__/DynamicPlanDetails.test.ts`

**Depends on:** Task 7, Task 5, Task 8
**Covers:** PLANS-BR-005, PLANS-BR-006, PLANS-UX-001, PLANS-UX-002, PLANS-UX-003, PLANS-AC-019, PLANS-AC-020, PLANS-AC-022, PLANS-BR-001, PLANS-AC-002
**Done when:** All 4 integration test suites pass with `pnpm --filter @clever/frontend test`

---

## Task 15: Final type-check and build verification

- [x] 15.1 Run `pnpm type-check` — resolve any remaining type errors across all packages
- [x] 15.2 Run `pnpm build` — verify successful production build
- [x] 15.3 Run `pnpm test` — verify all tests pass (existing + new)

**Design ref:** [Section 6.8 — Performance Considerations](design.md#68-performance-considerations) (L840-860)
**Test ref:** All MI tests
**Scope:**
- modify any files with remaining type errors

**Depends on:** Task 10, Task 11, Task 12, Task 13, Task 14
**Covers:** PLANS-NFR-001
**Done when:** `pnpm check-all` exits 0; `pnpm build` exits 0; `pnpm test` exits 0
