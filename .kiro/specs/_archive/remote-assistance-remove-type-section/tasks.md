# Remote Assistance Remove Type Section — Tasks

## Task 1: Remove `assistanceInfo` section from form configuration

- [x] 1.1 Delete the `assistanceInfo` section object from the exported array in `remote-assistance-form-sections.ts`
  - Scope: `modify packages/frontend/src/config/remote-assistance-form-sections.ts`
  - Design ref: [Form Configuration Changes](design.md#1-form-configuration-changes)
  - Test ref: [MI-01](tests.md)
  - Covers: RA-RTS-BR-001, RA-RTS-UX-001, RA-RTS-AC-001, RA-RTS-AC-002
  - Done when: The exported array no longer contains a section with key `assistanceInfo`; no field with key `tipoAssistencia` exists in any section

## Task 2: Remove `tipoAssistencia` from shared validation

- [x] 2.1 Remove `tipoAssistencia` validation block from `validateRemoteAssistanceCreation()`
  - Scope: `modify packages/shared/src/types/remote-assistance/validation.ts`
  - Design ref: [Shared Validation Changes](design.md#4-shared-validation-changes)
  - Test ref: [MI-05](tests.md)
  - Covers: RA-RTS-BR-001
  - Done when: `validateRemoteAssistanceCreation()` does not check or reject payloads missing `tipoAssistencia`

- [x] 2.2 Remove `tipoAssistencia` validation block from `validateRemoteAssistanceUpdate()`
  - Scope: `modify packages/shared/src/types/remote-assistance/validation.ts`
  - Design ref: [Shared Validation Changes](design.md#4-shared-validation-changes)
  - Test ref: [MI-05](tests.md)
  - Covers: RA-RTS-BR-001
  - Done when: `validateRemoteAssistanceUpdate()` does not check or reject payloads missing `tipoAssistencia`

- [x] 2.3 Remove `assistanceType` from `getRemoteAssistanceSummary()` return value
  - Scope: `modify packages/shared/src/types/remote-assistance/validation.ts`
  - Design ref: [Shared Validation Changes](design.md#4-shared-validation-changes)
  - Covers: RA-RTS-BR-001
  - Done when: `getRemoteAssistanceSummary()` no longer includes `assistanceType` in its returned object

## Task 3: Remove `tipoAssistencia` from backend search index

- [x] 3.1 Remove `tipoAssistencia` from `createRemoteAssistanceSearchText()`
  - Scope: `modify packages/backend/src/routes/remote-assistance.ts`
  - Design ref: [Backend Search Index Cleanup](design.md#3-backend-search-index-cleanup)
  - Test ref: [MI-04](tests.md)
  - Covers: RA-RTS-AC-004, RA-RTS-BR-002
  - Done when: `createRemoteAssistanceSearchText()` output does not include `tipoAssistencia` values

- [x] 3.2 Remove `tipoAssistencia` from `extractIndexFields()`
  - Scope: `modify packages/backend/src/routes/remote-assistance.ts`
  - Design ref: [Backend Search Index Cleanup](design.md#3-backend-search-index-cleanup)
  - Test ref: [MI-04](tests.md)
  - Covers: RA-RTS-AC-004, RA-RTS-BR-002
  - Done when: `extractIndexFields()` returned object has no `tipoAssistencia` key

## Task 4: Remove `tipoAssistencia` from RemoteAssistanceCreateView

- [x] 4.1 Remove `tipoAssistencia` from payload construction in `validateCreateForm`
  - Scope: `modify packages/frontend/src/views/remote-assistance/RemoteAssistanceCreateView.vue`
  - Design ref: [Frontend View Changes — CreateView](design.md#21-remoteassistancecreateviewvue)
  - Test ref: [MI-02](tests.md)
  - Covers: RA-RTS-AC-001
  - Depends on: 2.1
  - Done when: `RemoteAssistanceCreationData` payload does not include `tipoAssistencia`

- [x] 4.2 Remove `tipoAssistencia` validation checks from `validateCreateForm`
  - Scope: `modify packages/frontend/src/views/remote-assistance/RemoteAssistanceCreateView.vue`
  - Design ref: [Frontend View Changes — CreateView](design.md#21-remoteassistancecreateviewvue)
  - Test ref: [MI-02](tests.md)
  - Covers: RA-RTS-AC-001
  - Depends on: 2.1
  - Done when: No validation condition checks `tipoAssistencia` emptiness or valid type

- [x] 4.3 Remove `tipoAssistencia` error mapping from `fieldErrors`
  - Scope: `modify packages/frontend/src/views/remote-assistance/RemoteAssistanceCreateView.vue`
  - Design ref: [Frontend View Changes — CreateView](design.md#21-remoteassistancecreateviewvue)
  - Covers: RA-RTS-AC-001
  - Depends on: 4.2
  - Done when: No `else if` branch maps errors to `fieldErrors.tipoAssistencia`

- [x] 4.4 Remove `tipoAssistencia` from `handleCreateSuccess` payload
  - Scope: `modify packages/frontend/src/views/remote-assistance/RemoteAssistanceCreateView.vue`
  - Design ref: [Frontend View Changes — CreateView](design.md#21-remoteassistancecreateviewvue)
  - Covers: RA-RTS-AC-001
  - Done when: The final payload sent to the API does not include `tipoAssistencia`

## Task 5: Remove `tipoAssistencia` from RemoteAssistanceUpdateView

- [x] 5.1 Remove `tipoAssistencia` from `initialFormData`
  - Scope: `modify packages/frontend/src/views/remote-assistance/RemoteAssistanceUpdateView.vue`
  - Design ref: [Frontend View Changes — UpdateView](design.md#22-remoteassistanceupdateviewvue)
  - Covers: RA-RTS-AC-002
  - Done when: `initialFormData` does not include `tipoAssistencia`

- [x] 5.2 Remove `tipoAssistencia` from payload construction in `validateUpdateForm`
  - Scope: `modify packages/frontend/src/views/remote-assistance/RemoteAssistanceUpdateView.vue`
  - Design ref: [Frontend View Changes — UpdateView](design.md#22-remoteassistanceupdateviewvue)
  - Covers: RA-RTS-AC-002
  - Depends on: 2.2
  - Done when: `RemoteAssistanceUpdateData` payload does not include `tipoAssistencia`

- [x] 5.3 Remove `tipoAssistencia` validation checks from `validateUpdateForm`
  - Scope: `modify packages/frontend/src/views/remote-assistance/RemoteAssistanceUpdateView.vue`
  - Design ref: [Frontend View Changes — UpdateView](design.md#22-remoteassistanceupdateviewvue)
  - Test ref: [MI-03](tests.md)
  - Covers: RA-RTS-AC-002
  - Depends on: 2.2
  - Done when: No validation condition checks `tipoAssistencia` emptiness or valid type

- [x] 5.4 Remove `tipoAssistencia` error mapping from `fieldErrors`
  - Scope: `modify packages/frontend/src/views/remote-assistance/RemoteAssistanceUpdateView.vue`
  - Design ref: [Frontend View Changes — UpdateView](design.md#22-remoteassistanceupdateviewvue)
  - Covers: RA-RTS-AC-002
  - Depends on: 5.3
  - Done when: No `else if` branch maps errors to `fieldErrors.tipoAssistencia`

- [x] 5.5 Remove `tipoAssistencia` from `handleUpdate` payload
  - Scope: `modify packages/frontend/src/views/remote-assistance/RemoteAssistanceUpdateView.vue`
  - Design ref: [Frontend View Changes — UpdateView](design.md#22-remoteassistanceupdateviewvue)
  - Covers: RA-RTS-AC-002
  - Done when: The final payload sent to the API does not include `tipoAssistencia`

## Task 6: Remove `tipoAssistencia` from RemoteAssistanceDetailView

- [x] 6.1 Delete the "Tipo de Assistência" detail-item block from the template
  - Scope: `modify packages/frontend/src/views/remote-assistance/RemoteAssistanceDetailView.vue`
  - Design ref: [Frontend View Changes — DetailView](design.md#23-remoteassistancedetailviewvue)
  - Covers: RA-RTS-AC-003, RA-RTS-UX-001
  - Done when: No `<div class="detail-item">` block renders "Tipo de Assistência"

- [x] 6.2 Remove `getAssistanceTypeClass` helper function
  - Scope: `modify packages/frontend/src/views/remote-assistance/RemoteAssistanceDetailView.vue`
  - Design ref: [Frontend View Changes — DetailView](design.md#23-remoteassistancedetailviewvue)
  - Covers: RA-RTS-AC-003
  - Depends on: 6.1
  - Done when: The `getAssistanceTypeClass` function no longer exists in the file

- [x] 6.3 Remove `tipoAssistencia` from `getRemoteAssistanceSubtitle` in DetailView
  - Scope: `modify packages/frontend/src/views/remote-assistance/RemoteAssistanceDetailView.vue`
  - Design ref: [Frontend View Changes — DetailView](design.md#23-remoteassistancedetailviewvue)
  - Covers: RA-RTS-AC-003
  - Done when: `getRemoteAssistanceSubtitle` does not push `tipoAssistencia` to parts array

## Task 7: Remove `tipoAssistencia` from RemoteAssistanceListView

- [x] 7.1 Remove the assistance-type-badge template block
  - Scope: `modify packages/frontend/src/views/remote-assistance/RemoteAssistanceListView.vue`
  - Design ref: [Frontend View Changes — ListView](design.md#24-remoteassistancelistviewvue)
  - Covers: RA-RTS-BR-002
  - Done when: No template block renders the assistance type badge using `getAssistanceTypeDisplay` or `getAssistanceTypeClass`

- [x] 7.2 Remove `tipoAssistencia` from the local search filter
  - Scope: `modify packages/frontend/src/views/remote-assistance/RemoteAssistanceListView.vue`
  - Design ref: [Frontend View Changes — ListView](design.md#24-remoteassistancelistviewvue)
  - Covers: RA-RTS-BR-002
  - Done when: The search filter condition does not reference `data.tipoAssistencia`

- [x] 7.3 Remove `tipoAssistencia` from `getRemoteAssistanceSubtitle`
  - Scope: `modify packages/frontend/src/views/remote-assistance/RemoteAssistanceListView.vue`
  - Design ref: [Frontend View Changes — ListView](design.md#24-remoteassistancelistviewvue)
  - Covers: RA-RTS-BR-002
  - Done when: `getRemoteAssistanceSubtitle` does not reference `tipoAssistencia` or `getAssistanceTypeDisplay`

- [x] 7.4 Remove `getAssistanceTypeDisplay` and `getAssistanceTypeClass` helper functions
  - Scope: `modify packages/frontend/src/views/remote-assistance/RemoteAssistanceListView.vue`
  - Design ref: [Frontend View Changes — ListView](design.md#24-remoteassistancelistviewvue)
  - Covers: RA-RTS-BR-002
  - Depends on: 7.1, 7.3
  - Done when: Neither `getAssistanceTypeDisplay` nor `getAssistanceTypeClass` functions exist in the file

## Task 8: Verify type-check passes

- [x] 8.1 Run `pnpm type-check` and confirm zero errors
  - Scope: none (verification only)
  - Depends on: 1.1, 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4
  - Covers: RA-RTS-BR-003
  - Done when: `pnpm type-check` exits with code 0 and no TypeScript errors related to `tipoAssistencia`
