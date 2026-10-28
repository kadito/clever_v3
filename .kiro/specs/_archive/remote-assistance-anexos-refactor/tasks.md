# Implementation Plan: Remote Assistance — Anexos Refactor

## Overview

This implementation adds structured file attachments (`anexosFiles: FileReference[]`) to the remote assistance module, integrating the existing FileUploadZone, FileDisplay, and useFileUpload infrastructure. The existing `anexos: string` textarea field is preserved as-is for text notes.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2", "3", "6"] },
    { "wave": 3, "tasks": ["4", "5"] },
    { "wave": 4, "tasks": ["7"] },
    { "wave": 5, "tasks": ["8"] }
  ]
}
```

## Tasks

- [x] 1. Add `anexosFiles` field to RemoteAssistanceData type
  - Add `anexosFiles: FileReference[]` to `RemoteAssistanceData` interface
  - Add `FileReference` import from `../../file-validation`
  - Verify `RemoteAssistanceCreationData` and `RemoteAssistanceUpdateData` propagate the new field automatically
  - Design ref: [Section 1: Data Model](design.md#section-1-data-model)
  - Covers: RA-ANEXOS-BR-001, RA-ANEXOS-BR-004, RA-ANEXOS-BR-007
  - Test ref: [MI-01](tests.md#mi--executable-plan), [MI-02](tests.md#mi--executable-plan)
  - Done when: `RemoteAssistanceData` has `anexosFiles: FileReference[]`, TypeScript compiles without errors across all packages

- [x] 2. Add `anexosFiles` default in backend validation
  - Update `validateRemoteAssistanceCreate()` to include `anexosFiles` with `Array.isArray` guard defaulting to `[]`
  - Update `validateRemoteAssistanceUpdateData()` with same pattern for update path
  - Design ref: [Section 2: Backend — Type Fix & Delete Cleanup](design.md#section-2-backend--type-fix--delete-cleanup) (2.1)
  - Covers: RA-ANEXOS-BR-001, RA-ANEXOS-AC-004, RA-ANEXOS-BR-006
  - Test ref: [MI-03](tests.md#mi--executable-plan), [MI-04](tests.md#mi--executable-plan)
  - Depends on: 1
  - Done when: `anexosFiles` defaults to `[]` in both create and update paths, non-array values normalized to `[]`

- [x] 3. Add custom DELETE handler with best-effort file cleanup
  - Add custom DELETE `/:uuid` handler to remote-assistance route
  - Read record to get `anexosFiles` before soft-delete
  - Soft-delete the record first, then attempt R2 file cleanup
  - Swallow file cleanup errors (log with `console.error` + `JSON.stringify`)
  - Return 404 if record not found or already deleted
  - Design ref: [Section 2: Backend — Type Fix & Delete Cleanup](design.md#section-2-backend--type-fix--delete-cleanup) (2.2)
  - Covers: RA-ANEXOS-BR-005, RA-ANEXOS-AC-014, RA-ANEXOS-AC-015
  - Test ref: [MI-05](tests.md#mi--executable-plan), [MI-06](tests.md#mi--executable-plan), [MI-07](tests.md#mi--executable-plan), [MI-08](tests.md#mi--executable-plan)
  - Depends on: 1
  - Done when: DELETE handler soft-deletes record, attempts file cleanup, never blocks on cleanup failure, returns 404 for missing records

- [x] 4. Integrate FileUploadZone in RemoteAssistanceCreateView
  - Import `FileUploadZone` and `useFileUpload` composable
  - Add `pendingAnexosFiles` ref and `handleAnexosFilesChanged` handler
  - Add FileUploadZone in "Anexos" section after existing form fields
  - After successful record creation, call `uploadFiles` for pending files
  - Show inline error if upload partially fails (navigate anyway — record is saved)
  - Set `anexosFiles: []` in form data defaults
  - Design ref: [Section 3: Frontend — Create Form](design.md#section-3-frontend--create-form)
  - Covers: RA-ANEXOS-AC-001, RA-ANEXOS-AC-002, RA-ANEXOS-AC-003, RA-ANEXOS-AC-004, RA-ANEXOS-AC-005, RA-ANEXOS-BR-009, RA-ANEXOS-NFR-001, UX-RA-ANEXOS-001, UX-RA-ANEXOS-005, UX-RA-ANEXOS-006
  - Test ref: [MI-09](tests.md#mi--executable-plan), [MI-10](tests.md#mi--executable-plan)
  - Depends on: 1, 2
  - Done when: FileUploadZone visible in Create form, files uploaded after record save, partial failure shows inline error, navigation proceeds

- [x] 5. Integrate FileUploadZone in RemoteAssistanceUpdateView
  - Import `FileUploadZone` and `useFileUpload` composable
  - Load existing `anexosFiles` from record on mount (with `Array.isArray` guard)
  - Pass `existingAnexosFiles` to FileUploadZone `:existing-files` prop
  - Track `pendingNewFiles` and `pendingRemovedKeys` from `files-changed` event
  - After successful record update: delete removed files, upload new files
  - Show inline error for failed file operations (navigate after delay)
  - Design ref: [Section 4: Frontend — Update Form](design.md#section-4-frontend--update-form)
  - Covers: RA-ANEXOS-AC-006, RA-ANEXOS-AC-007, RA-ANEXOS-AC-008, RA-ANEXOS-AC-009, RA-ANEXOS-AC-017, UX-RA-ANEXOS-004, UX-RA-ANEXOS-005, UX-RA-ANEXOS-006
  - Test ref: [MI-11](tests.md#mi--executable-plan), [MI-12](tests.md#mi--executable-plan), [MI-13](tests.md#mi--executable-plan)
  - Depends on: 1, 2
  - Done when: Existing files displayed with remove controls, new files uploadable, delete+upload operations execute post-save, errors shown inline, legacy plain-text values replaced on save

- [x] 6. Update RemoteAssistanceDetailView with FileDisplay
  - Import `FileDisplay` component and `FileReference` type
  - Add `anexosFiles` computed with `Array.isArray` guard
  - Replace current `anexos` plain-text display with FileDisplay for files + "Notas Anexas" for text
  - FileDisplay shown only when `anexosFiles.length > 0` (AC-011)
  - Text notes section shown only when `anexos` string is non-empty
  - Design ref: [Section 5: Frontend — Detail View](design.md#section-5-frontend--detail-view)
  - Covers: RA-ANEXOS-AC-010, RA-ANEXOS-AC-011, RA-ANEXOS-AC-012, RA-ANEXOS-AC-013, RA-ANEXOS-AC-016, UX-RA-ANEXOS-002, UX-RA-ANEXOS-003, UX-RA-ANEXOS-006
  - Test ref: [MI-14](tests.md#mi--executable-plan), [MI-15](tests.md#mi--executable-plan), [MI-16](tests.md#mi--executable-plan)
  - Depends on: 1
  - Done when: Images shown as clickable thumbnails, documents as download links, empty array hides section, legacy text-only records show "Notas Anexas" only, unavailable files show indicator

- [x] 7. Write [MI] integration tests
  - Create test files for backend validation defaults, DELETE handler, and frontend views
  - All tests carry MI-XX IDs from tests.md plan
  - Design ref: [Section 2](design.md#section-2-backend--type-fix--delete-cleanup), [Section 3](design.md#section-3-frontend--create-form), [Section 4](design.md#section-4-frontend--update-form), [Section 5](design.md#section-5-frontend--detail-view)
  - Covers: All MI test scenarios
  - Test ref: [MI-01](tests.md#mi--executable-plan) through [MI-16](tests.md#mi--executable-plan)
  - Depends on: 1, 2, 3, 4, 5, 6
  - Done when: All 16 MI tests pass, each test carries its plan ID in the describe/it string

- [x] 8. Write [MA] acceptance tests
  - Create acceptance test files covering end-to-end user flows
  - All tests carry MA-XX IDs from tests.md plan
  - Design ref: [Section 3](design.md#section-3-frontend--create-form), [Section 4](design.md#section-4-frontend--update-form), [Section 5](design.md#section-5-frontend--detail-view), [Section 2](design.md#section-2-backend--type-fix--delete-cleanup)
  - Covers: All MA test scenarios
  - Test ref: [MA-01](tests.md#ma--executable-plan) through [MA-14](tests.md#ma--executable-plan)
  - Depends on: 7
  - Done when: All 14 MA tests pass, each test carries its plan ID in the describe/it string

## Notes

- The existing `anexos: string` field is preserved as-is — it remains a free-text textarea for notes
- The new `anexosFiles: FileReference[]` field is additive — no migration needed
- FileUploadZone, FileDisplay, and useFileUpload are already fully implemented and in use by Installations Programming
- File upload/delete API endpoints (`/api/content/{type}/{uuid}/files`) already support `remote-assistance` — no backend file route changes needed
- Old records without `anexosFiles` are handled by `Array.isArray` guards at every read site
