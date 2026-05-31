# Tasks — Daily Record Time Prefill

- [x] 1. Add helper functions and `useApi` instances to `ActivityCard.vue`
  - Design ref: [Time Extraction Logic](design.md#2-time-extraction-logic) + [API Fetch Strategy inside ActivityCard](design.md#5-api-fetch-strategy-inside-activitycard)
  - Scope: modify `packages/frontend/src/components/daily-records/ActivityCard.vue`
  - Covers: DRTP-BR-001, DRTP-BR-002, DRTP-BR-003, DRTP-AC-001, DRTP-AC-002, DRTP-AC-003, DRTP-AC-005, DRTP-AC-006, DRTP-AC-007
  - Test ref: [MI-01](tests.md#mi--executable-plan) to [MI-15](tests.md#mi--executable-plan)
  - Done when: `extractHHMM`, `extractTimeFromWorkSheet`, `extractTimeFromRemoteAssistance` are defined in the component script; `workSheetApi` and `remoteAssistanceApi` composable instances are declared; no existing behaviour is changed

- [x] 2. Modify `handleWorkSheetSelected` and `handleRemoteAssistanceSelected` to fetch and pre-fill times
  - Design ref: [Pre-fill Trigger Flow — Modified handler implementations](design.md#3-pre-fill-trigger-flow)
  - Scope: modify `packages/frontend/src/components/daily-records/ActivityCard.vue`
  - Depends on: 1
  - Covers: DRTP-AC-001, DRTP-AC-002, DRTP-AC-003, DRTP-AC-004, DRTP-AC-005, DRTP-AC-006, DRTP-AC-007, DRTP-AC-008, DRTP-AC-012, DRTP-AC-013, DRTP-BR-001, DRTP-BR-002, DRTP-BR-003, DRTP-BR-004, DRTP-NFR-001
  - Test ref: [MI-16](tests.md#mi--executable-plan) to [MI-21](tests.md#mi--executable-plan), [MI-25](tests.md#mi--executable-plan), [MI-28](tests.md#mi--executable-plan)
  - Done when: `handleWorkSheetSelected(workSheet)` and `handleRemoteAssistanceSelected(remoteAssistance)` accept the document argument, call `fetchById`, write extracted times to `localActivity`, and call `emitUpdate()` in `.finally()`; fetch errors leave times unchanged

- [x] 3. Modify `handleLinkTypeChange` to clear time fields when switching to `Nenhuma`
  - Design ref: [Pre-fill Trigger Flow — Trigger events and their actions](design.md#3-pre-fill-trigger-flow)
  - Scope: modify `packages/frontend/src/components/daily-records/ActivityCard.vue`
  - Depends on: 1
  - Covers: DRTP-AC-009, DRTP-BR-005
  - Test ref: [MI-22](tests.md#mi--executable-plan)
  - Done when: `handleLinkTypeChange` sets `localActivity.value.horaInicio = ''` and `localActivity.value.horaFim = ''` when `tipoLigacao === 'Nenhuma'`; all other branches of `handleLinkTypeChange` are unchanged

- [ ]* 4. Write [MI] integration tests
  - Design ref: [All sections](design.md)
  - Scope: create `packages/frontend/src/components/daily-records/ActivityCard.test.ts`
  - Depends on: 1, 2, 3
  - Covers: DRTP-BR-001, DRTP-BR-002, DRTP-BR-003, DRTP-BR-004, DRTP-BR-005, DRTP-BR-006, DRTP-AC-001 to DRTP-AC-016, DRTP-NFR-001
  - Test ref: [MI-01](tests.md#mi--executable-plan) to [MI-29](tests.md#mi--executable-plan)
  - Done when: All 29 MI tests pass with Vitest

- [ ]* 5. Write [MA] acceptance tests
  - Design ref: [All sections](design.md)
  - Scope: modify `packages/frontend/src/components/daily-records/ActivityCard.test.ts`
  - Depends on: 4
  - Covers: DRTP-AC-001 to DRTP-AC-016
  - Test ref: [MA-01](tests.md#ma--executable-plan) to [MA-14](tests.md#ma--executable-plan)
  - Done when: All 14 MA tests pass with Vitest
