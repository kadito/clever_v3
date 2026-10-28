# Implementation Plan

## Overview

Add `clientId` field to the Activity data model so technicians select a client first in each daily record activity, then choose a Work Sheet or Remote Assistance belonging to that client.

## Tasks

- [x] 1. Add `clientId` to Activity type
  - Add `clientId?: string` field with JSDoc comment to the Activity interface
  - Design ref: [Data Model — Activity clientId field](design.md#1-data-model--activity-clientid-field)
  - Scope: `modify` `packages/shared/src/types/daily-records/types.ts`
  - Covers: DR-DEC-002
  - Done when: `Activity` interface has `clientId?: string` field with JSDoc comment; `pnpm type-check` passes

- [x] 2. Update validation logic
  - Add `options?: { isNewRecord?: boolean }` parameter to `validateActivity`
  - New activity without clientId returns error; legacy activity without clientId passes
  - Edit with linked doc but no clientId returns error
  - `validateDailyRecordUpdate` passes `{ isNewRecord: false }`
  - Design ref: [Validation — Mandatory client + backward compatibility](design.md#5-validation--mandatory-client--backward-compatibility)
  - Test ref: [MI-01, MI-02, MI-03](tests.md#mi--strategy)
  - Scope: `modify` `packages/shared/src/types/daily-records/validation.ts`
  - Depends on: 1
  - Covers: DR-BR-001, DR-DEC-003, DR-DEC-004, DR-AC-011, DR-AC-012
  - Done when: `validateActivity` accepts `options?: { isNewRecord?: boolean }` param; new activity without clientId returns error; legacy activity without clientId passes; edit with linked doc but no clientId returns error; `validateDailyRecordUpdate` passes `{ isNewRecord: false }`; `pnpm type-check` passes

- [x] 3. Add `clientId` filter to backend
  - Add `clientId?: string` to `listFiltered` filters parameter
  - Read `clientId` query param in GET handler
  - Include `clientId` in `hasFilters` check
  - Filter index items by `clientId` field
  - Design ref: [Backend — Client-filtered document search](design.md#3-backend--client-filtered-document-search)
  - Test ref: [MI-04, MI-05, MI-06](tests.md#mi--strategy)
  - Scope: `modify` `packages/backend/src/routes/content-route-template.ts`
  - Depends on: 1
  - Covers: DR-AC-003, DR-AC-005, DR-BR-002, DR-NFR-001
  - Done when: `listFiltered` accepts `clientId?: string` in filters; GET handler reads `clientId` query param; `clientId` included in `hasFilters` check; index items filtered by `clientId` field; `pnpm type-check` passes

- [x] 4. Add `clientId` prop to WorkSheetSearchInput
  - Add optional `clientId` prop to the component
  - When provided, include `clientId` in `searchParams` sent to API
  - Preserve existing behavior when prop not provided
  - Design ref: [Backend — Frontend search inputs — prop addition](design.md#3-backend--client-filtered-document-search)
  - Scope: `modify` `packages/frontend/src/components/common/WorkSheetSearchInput.vue`
  - Depends on: 3
  - Covers: DR-AC-003, DR-BR-002
  - Done when: `WorkSheetSearchInput` has optional `clientId` prop; when provided, `clientId` is included in `searchParams` sent to API; existing behavior preserved when prop not provided; `pnpm type-check` passes

- [x] 5. Add `clientId` prop to RemoteAssistanceSearchInput
  - Add optional `clientId` prop to the component
  - When provided, include `clientId` in `searchParams` sent to API
  - Preserve existing behavior when prop not provided
  - Design ref: [Backend — Frontend search inputs — prop addition](design.md#3-backend--client-filtered-document-search)
  - Scope: `modify` `packages/frontend/src/components/common/RemoteAssistanceSearchInput.vue`
  - Depends on: 3
  - Covers: DR-AC-005, DR-BR-002
  - Done when: `RemoteAssistanceSearchInput` has optional `clientId` prop; when provided, `clientId` is included in `searchParams` sent to API; existing behavior preserved when prop not provided; `pnpm type-check` passes

- [x] 6. Integrate ClientSearchInput in ActivityCard
  - Render ClientSearchInput after Tipo Atividade and before Ligação
  - Disable Ligação select when no client selected
  - Hide document search when no client selected
  - Pass `clientId` prop to WorkSheetSearchInput and RemoteAssistanceSearchInput
  - Field order matches DR-DEC-006
  - Design ref: [Frontend — ActivityCard client integration](design.md#2-frontend--activitycard-client-integration)
  - Test ref: [MI-08](tests.md#mi--strategy)
  - Scope: `modify` `packages/frontend/src/components/daily-records/ActivityCard.vue`
  - Depends on: 1, 4, 5
  - Covers: DR-AC-001, DR-AC-002, DR-AC-010, DR-UX-001, DR-UX-002, DR-UX-003, DR-UX-005, DR-DEC-001, DR-DEC-005, DR-DEC-006, DR-BR-004, DR-BR-005, DR-BR-006, DR-BR-007
  - Done when: ClientSearchInput rendered after Tipo Atividade and before Ligação; Ligação select disabled when no client selected; document search hidden when no client selected; `clientId` prop passed to WorkSheetSearchInput and RemoteAssistanceSearchInput; field order matches DR-DEC-006; `pnpm type-check` passes

- [x] 7. Implement client change cascade logic
  - Changing client clears workSheetId/remoteAssistanceId
  - Auto-populated time fields reset on client change
  - `timeAutoPopulated` ref tracks auto-fill origin
  - Same-client re-select does not trigger clearing
  - Manual time preserved when not auto-populated
  - Design ref: [Frontend — Client change cascade logic](design.md#4-frontend--client-change-cascade-logic)
  - Test ref: [MI-07](tests.md#mi--strategy)
  - Scope: `modify` `packages/frontend/src/components/daily-records/ActivityCard.vue`
  - Depends on: 6
  - Covers: DR-AC-007, DR-AC-008, DR-BR-003, DR-UX-004
  - Done when: Changing client clears workSheetId/remoteAssistanceId; auto-populated time fields reset on client change; `timeAutoPopulated` ref tracks auto-fill origin; same-client re-select does not trigger clearing; manual time preserved when not auto-populated; `pnpm type-check` passes

- [x] 8. Implement backward compatibility for legacy activities
  - `isLegacyActivity` computed detects activities with linked doc but no clientId
  - Legacy activities render with link fields enabled
  - Changing linked doc on legacy requires client selection first
  - Design ref: [Frontend — ActivityCard client integration — Backward compatibility](design.md#2-frontend--activitycard-client-integration)
  - Test ref: [MI-09](tests.md#mi--strategy)
  - Scope: `modify` `packages/frontend/src/components/daily-records/ActivityCard.vue`
  - Depends on: 6
  - Covers: DR-AC-011, DR-AC-012, DR-DEC-003
  - Done when: `isLegacyActivity` computed detects activities with linked doc but no clientId; legacy activities render with link fields enabled; changing linked doc on legacy requires client selection first; `pnpm type-check` passes

- [x] 9. Unit tests — validation
  - Test new activity without clientId → error
  - Test legacy without clientId + no doc → valid
  - Test edit with linked doc no clientId → error
  - Test validateDailyRecordCreation enforces clientId
  - Test validateDailyRecordUpdate uses isNewRecord: false
  - Design ref: [Validation — Mandatory client + backward compatibility](design.md#5-validation--mandatory-client--backward-compatibility)
  - Test ref: [MI-01, MI-02, MI-03](tests.md#mi--strategy)
  - Scope: `create` `packages/shared/src/types/daily-records/validation.test.ts`
  - Depends on: 2
  - Covers: DR-BR-001, DR-DEC-003, DR-DEC-004, DR-AC-011, DR-AC-012
  - Done when: Tests MI-01, MI-02, MI-03 pass; `pnpm --filter @clever/shared test` passes

- [x] 10. Unit tests — ActivityCard component
  - Test client change cascade clears doc + time
  - Test field ordering/disabled states
  - Test legacy backward compat
  - Design ref: [Frontend — ActivityCard client integration](design.md#2-frontend--activitycard-client-integration) + [Client change cascade logic](design.md#4-frontend--client-change-cascade-logic)
  - Test ref: [MI-07, MI-08, MI-09](tests.md#mi--strategy)
  - Scope: `create` `packages/frontend/src/components/daily-records/ActivityCard.test.ts`
  - Depends on: 7, 8
  - Covers: DR-AC-001, DR-AC-002, DR-AC-007, DR-AC-008, DR-AC-010, DR-AC-011, DR-UX-001, DR-UX-002, DR-BR-003
  - Done when: Tests MI-07, MI-08, MI-09 pass; `pnpm --filter @clever/frontend test` passes

- [x] 11. Integration tests — backend clientId filter
  - Test listFiltered with clientId returns only matching items
  - Test unknown clientId returns empty
  - Test combined clientId + search returns intersection
  - Test work-sheets endpoint filters by client
  - Test remote-assistance endpoint filters by client
  - Design ref: [Backend — Client-filtered document search](design.md#3-backend--client-filtered-document-search)
  - Test ref: [MI-04, MI-05, MI-06](tests.md#mi--strategy)
  - Scope: `create` `packages/backend/src/routes/content-route-template.test.ts`
  - Depends on: 3
  - Covers: DR-AC-003, DR-AC-005, DR-BR-002, DR-AC-009, DR-NFR-001
  - Done when: Tests MI-04, MI-05, MI-06 pass; `pnpm --filter @clever/backend test` passes

## Notes

- All changes are additive — no existing behavior removed
- Portuguese UI labels, English code
- Mobile-first with 44px touch targets (existing components already comply)
