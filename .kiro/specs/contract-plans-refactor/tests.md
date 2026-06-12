# Contract Plans Refactor — Tests

## [MI] — Strategy

| ID | Interface | Test type | Key scenarios from design | Mocked dependencies | REQ-ID |
|----|-----------|-----------|--------------------------|---------------------|--------|
| MI-01 | `planSelection.ts` — `getAvailablePlans()` | unit | Returns CPA plans for 'CPA', S&H plans for 'S&H', empty for invalid type | None (static JSON import) | PLANS-AC-012, PLANS-AC-013 |
| MI-02 | `planSelection.ts` — `requiresDistance()` | unit | Returns `false` for 'CPA', `true` for 'S&H' | None | PLANS-AC-021 |
| MI-03 | `planSelection.ts` — `getPlanDetails()` | unit | Returns correct plan by ID, returns null for unknown ID | None | PLANS-AC-001 |
| MI-04 | `planSelection.ts` — `getPlanOptions()` | unit | Returns correct options for CPA (3 plans), S&H (6 plans), empty for unknown type | None | PLANS-AC-019, PLANS-AC-020 |
| MI-05 | `validateContractCreation()` — single equipment | unit | Plan required with 1 equip, passes when plan selected, fails without plan | None | PLANS-AC-018 |
| MI-06 | `validateContractCreation()` — multi equipment CPA | unit | Price required with 2+ equips, parameters required, passes when all provided | None | PLANS-AC-016, PLANS-AC-017 |
| MI-07 | `validateContractCreation()` — multi equipment S&H | unit | Price required with 2+ equips, horas + deslocações required, passes when all provided | None | PLANS-AC-016, PLANS-AC-017 |
| MI-08 | `validateContractCreation()` — CPA unified (no subtype) | unit | No cpaContractType validation, no distanceCPA required | None | PLANS-AC-019, PLANS-DEC-001 |
| MI-09 | `validateContractEquipment()` — no discount | unit | Does not validate discount field, accepts equipment without desconto | None | PLANS-BR-003, PLANS-AC-014 |
| MI-10 | Equipment count mode logic (composable/watcher) | unit | 1→2 equips clears values, 2→1 restores plan values, plan change in auto mode repopulates | Mocked plan data | PLANS-BR-007, PLANS-BR-008, PLANS-AC-007, PLANS-AC-011 |
| MI-11 | `BenefitFieldsGroup` — field visibility | integration | CPA shows manutenções + deslocações (no horas), S&H shows horas + deslocações (no manutenções) | Vue test utils mount | PLANS-BR-005, PLANS-BR-006 |
| MI-12 | `BenefitFieldsGroup` — mode behavior | integration | Auto mode: fields disabled + populated. Manual mode: fields editable + empty | Vue test utils mount | PLANS-UX-001, PLANS-UX-002, PLANS-UX-003 |
| MI-13 | `CPAContractSection` — unified type | integration | No subtype selector rendered, plan dropdown shows 3 unified plans, POS only for premium | Vue test utils mount, mocked planSelection | PLANS-AC-019, PLANS-AC-020, PLANS-AC-022 |
| MI-14 | `DynamicPlanDetails` — simplified pricing | integration | Shows flat prices for CPA (no distance), distance-based for S&H, no equipment cost calculation | Vue test utils mount | PLANS-BR-001, PLANS-AC-002 |

## [MA] — Acceptance Tests

| ID | User story | Scenario | Steps | Expected outcome | REQ-ID |
|----|-----------|----------|-------|-----------------|--------|
| MA-01 | Single Equipment Contract (CPA) | Auto mode populates plan values | 1. Enable CPA toggle 2. Select plan "ESSENTIAL CARE" 3. Add 1 equipment | Price shows €40/mensal; deslocações=1, manutenções=1; fields are read-only | PLANS-AC-001, PLANS-AC-002, PLANS-AC-003, PLANS-AC-004, PLANS-AC-005 |
| MA-02 | Single Equipment Contract (S&H) | Auto mode populates S&H values | 1. Enable S&H toggle 2. Select plan "SIMPLE" 3. Select distance "under180km" 4. Add 1 equipment | Price shows €35/mensal; horas=10, deslocações=2; fields are read-only | PLANS-AC-001, PLANS-AC-006 |
| MA-03 | Multi Equipment Contract | Auto → Manual transition | 1. Start with 1 CPA equipment (auto mode) 2. Add 2nd equipment | Parameter fields become editable + empty; manual price input appears; info banner shown | PLANS-AC-007, PLANS-AC-008, PLANS-AC-009, PLANS-BR-002, PLANS-BR-007 |
| MA-04 | Multi Equipment Contract | Manual → Auto transition | 1. Have 2 CPA equipments (manual mode) 2. Remove 2nd equipment | Plan base values restored; fields become read-only; manual price input hidden | PLANS-AC-011, PLANS-BR-008 |
| MA-05 | CPA Type Unification | No subtype selector | 1. Enable CPA toggle | CPA plan dropdown shows directly (Essential/Professional/Premium); no "TIPO DE CONTRATO CPA" selector; no distance dropdown | PLANS-AC-019, PLANS-AC-020, PLANS-DEC-001 |
| MA-06 | CPA Type Unification | POS package for Premium | 1. Enable CPA 2. Select "PREMIUM CARE" plan | POS checkbox appears with "+200€/ano" text | PLANS-AC-022 |
| MA-07 | Validation — Multi Equipment | Missing price prevents save | 1. Have 2 CPA equipments 2. Fill parameters but leave price empty 3. Attempt save | Validation error: "Por favor, introduza o preço do contrato CPA" | PLANS-AC-016 |
| MA-08 | Validation — Multi Equipment | Missing parameters prevents save | 1. Have 2 S&H equipments 2. Fill price but leave parameters empty 3. Attempt save | Validation errors for each missing parameter | PLANS-AC-017 |
| MA-09 | Validation — Single Equipment | No plan prevents save | 1. Have 1 CPA equipment 2. Do not select a plan 3. Attempt save | Validation error: "Por favor, selecione um plano CPA" | PLANS-AC-018 |
| MA-10 | Plan Data Update | No discount field on equipment | 1. Enable CPA 2. Add 2 equipments | No discount input shown on equipment cards | PLANS-AC-014, PLANS-AC-015, PLANS-BR-003 |
