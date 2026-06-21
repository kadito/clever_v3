# Registo Diário — Fluxo de Ligação — Tasks

## Task list

- [ ] 1. Lock time fields when document is selected
  - Design ref: [§Form Logic — Conditional Fields](design.md#form-logic--conditional-fields)
  - Test ref: [MI — timeFieldsLocked computed, MI — disabled states](tests.md#mi--strategy)
  - Scope:
    - modify `packages/frontend/src/components/daily-records/ActivityCard.vue`
  - Covers: DR-LIG-AC-006, DR-LIG-AC-009, DR-LIG-BR-006
  - Depends on: none
  - Done when: horaInicio, horaFim, tempoPausa inputs have `:disabled="timeFieldsLocked"` attribute; `timeFieldsLocked` computed returns true when `timeAutoPopulated === true` AND (workSheetId OR remoteAssistanceId is set); locked fields show `bg-gray-100 cursor-not-allowed` styling

- [ ] 2. Set tempoPausa=0 on document selection
  - Design ref: [§Form Logic — Conditional Fields](design.md#form-logic--conditional-fields)
  - Test ref: [MI — handleWorkSheetSelected, MI — handleRemoteAssistanceSelected](tests.md#mi--strategy)
  - Scope:
    - modify `packages/frontend/src/components/daily-records/ActivityCard.vue`
  - Covers: DR-LIG-AC-005, DR-LIG-AC-008, DR-LIG-BR-004, DR-LIG-BR-005
  - Depends on: none
  - Done when: `handleWorkSheetSelected` and `handleRemoteAssistanceSelected` set `localActivity.value.tempoPausa = 0` on successful document fetch

- [ ] 3. Add fetchError state and display warning on failure
  - Design ref: [§Error Handling](design.md#error-handling)
  - Test ref: [MI — handleWorkSheetSelected (failure), MI — handleRemoteAssistanceSelected (failure)](tests.md#mi--strategy)
  - Scope:
    - modify `packages/frontend/src/components/daily-records/ActivityCard.vue`
  - Covers: DR-LIG-AC-018, DR-LIG-AC-019
  - Depends on: none
  - Done when: `fetchError` ref exists; on fetch failure it is set to "Os tempos não puderam ser preenchidos automaticamente"; warning message renders below time fields with `text-amber-600 text-xs` styling; on new document selection fetchError is cleared

- [ ] 4. Clear fetchError on client change and link type change
  - Design ref: [§Error Handling — Edge Cases](design.md#error-handling)
  - Test ref: [MI — handleClientSelected, MI — handleLinkTypeChange](tests.md#mi--strategy)
  - Scope:
    - modify `packages/frontend/src/components/daily-records/ActivityCard.vue`
  - Covers: DR-LIG-AC-010, DR-LIG-AC-011
  - Depends on: 3
  - Done when: `handleClientSelected` and `handleLinkTypeChange` both set `fetchError.value = null`

- [ ] 5. Display collaborator name in list view
  - Design ref: [§List View — Collaborator Display](design.md#list-view--collaborator-display)
  - Test ref: [MI — DailyRecordsListView — collaborator display](tests.md#mi--strategy)
  - Scope:
    - modify `packages/frontend/src/views/daily-records/DailyRecordsListView.vue`
  - Covers: DR-LIG-AC-016, DR-LIG-AC-017, DR-LIG-BR-007
  - Depends on: none
  - Done when: each list item shows `data.technician.firstName + ' ' + data.technician.lastName` in a `bg-amber-100 text-amber-800` badge with user icon; shows "Não atribuído" when technician is null/undefined; badge is positioned before date badge in the meta row

- [ ] 6. Unit tests — ActivityCard handlers and computed
  - Design ref: [§Form Logic — Conditional Fields](design.md#form-logic--conditional-fields), [§Error Handling](design.md#error-handling)
  - Test ref: [MI — timeFieldsLocked, MI — handleWorkSheetSelected, MI — handleRemoteAssistanceSelected, MI — handleClientSelected, MI — handleLinkTypeChange](tests.md#mi--strategy)
  - Scope:
    - create `packages/frontend/src/components/daily-records/__tests__/ActivityCard.test.ts`
  - Covers: DR-LIG-AC-001, DR-LIG-AC-002, DR-LIG-AC-005, DR-LIG-AC-006, DR-LIG-AC-008, DR-LIG-AC-009, DR-LIG-AC-010, DR-LIG-AC-011, DR-LIG-AC-018, DR-LIG-AC-019
  - Depends on: 1, 2, 3, 4
  - Done when: all MI scenarios for timeFieldsLocked, handleWorkSheetSelected, handleRemoteAssistanceSelected, handleClientSelected, handleLinkTypeChange pass; tests use mocked useApi

- [ ] 7. Integration tests — disabled states and collaborator display
  - Design ref: [§Form Logic — Conditional Fields](design.md#form-logic--conditional-fields), [§List View — Collaborator Display](design.md#list-view--collaborator-display)
  - Test ref: [MI — disabled states (template), MI — DailyRecordsListView — collaborator display](tests.md#mi--strategy)
  - Scope:
    - create `packages/frontend/src/components/daily-records/__tests__/ActivityCard.integration.test.ts`
    - create `packages/frontend/src/views/daily-records/__tests__/DailyRecordsListView.test.ts`
  - Covers: DR-LIG-AC-003, DR-LIG-AC-006, DR-LIG-AC-009, DR-LIG-AC-016, DR-LIG-AC-017
  - Depends on: 1, 5
  - Done when: mounted component tests verify Ligação disabled when no clientId; time inputs disabled when timeFieldsLocked=true; list renders technician name and fallback; all use @vue/test-utils mount

- [ ] 8. Unit tests — validateActivity (shared)
  - Design ref: [§Validation Rules](design.md#validation-rules)
  - Test ref: [MI — validateActivity (shared)](tests.md#mi--strategy)
  - Scope:
    - create `packages/shared/src/types/daily-records/__tests__/validation.test.ts`
  - Covers: DR-LIG-AC-012, DR-LIG-AC-013, DR-LIG-AC-014, DR-LIG-AC-015
  - Depends on: none
  - Done when: tests cover clientId missing → error, tipoLigacao empty → error, workSheetId missing when FO → error, remoteAssistanceId missing when AR → error, all valid → no errors; all pass

## Property-Based Tests

- [ ]* 9. PBT — Time lock invariant (P-1)
  - Design ref: [§Correctness Properties](tests.md#correctness-properties)
  - Test ref: —
  - Scope:
    - create `packages/frontend/src/components/daily-records/__tests__/pbt-time-lock.test.ts`
  - Covers: DR-LIG-AC-006, DR-LIG-AC-009
  - Depends on: 1
  - Done when: fast-check runs 100+ random activity states; verifies timeFieldsLocked matches `timeAutoPopulated === true && (!!workSheetId || !!remoteAssistanceId)`; all pass

- [ ]* 10. PBT — Client change reset invariant (P-2)
  - Design ref: [§Correctness Properties](tests.md#correctness-properties)
  - Test ref: —
  - Scope:
    - create `packages/frontend/src/components/daily-records/__tests__/pbt-client-reset.test.ts`
  - Covers: DR-LIG-AC-010
  - Depends on: 4
  - Done when: fast-check runs 100+ random (previousClientId, newClientId, workSheetId, remoteAssistanceId) tuples; verifies post-conditions; all pass

- [ ]* 11. PBT — Pausa zero on document selection (P-3)
  - Design ref: [§Correctness Properties](tests.md#correctness-properties)
  - Test ref: —
  - Scope:
    - create `packages/frontend/src/components/daily-records/__tests__/pbt-pausa-zero.test.ts`
  - Covers: DR-LIG-AC-005, DR-LIG-AC-008
  - Depends on: 2
  - Done when: fast-check runs 100+ random document objects; verifies tempoPausa === 0 after selection; all pass

- [ ]* 12. PBT — Validation completeness (P-4)
  - Design ref: [§Correctness Properties](tests.md#correctness-properties)
  - Test ref: —
  - Scope:
    - create `packages/shared/src/types/daily-records/__tests__/pbt-validation.test.ts`
  - Covers: DR-LIG-AC-012, DR-LIG-AC-013, DR-LIG-AC-014, DR-LIG-AC-015
  - Depends on: 8
  - Done when: fast-check runs 100+ random Activity objects with selective field omissions; verifies validateActivity returns expected error messages; all pass
