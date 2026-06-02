# Remote Assistance — Anexos Refactor — Tests

## [MI] — Strategy

| Interface | Test type | Key scenarios from design | Mocked dependencies | REQ-ID |
|-----------|-----------|--------------------------|---------------------|--------|
| `RemoteAssistanceData.anexosFiles` type | unit | field defaults to `[]`; missing field from old record normalizes to `[]`; valid `FileReference[]` passes through | none | BR-001, BR-006 |
| Backend: `validateRemoteAssistanceCreate()` | unit | `anexosFiles` absent → defaults to `[]`; `anexosFiles` present as array → passes through; non-array value → defaults to `[]` | none | BR-001, AC-004 |
| Backend: custom DELETE handler | integration | record with files → soft-delete succeeds + files cleaned; record with files + R2 delete fails → soft-delete still succeeds (best-effort); record with no files → soft-delete only; record not found → 404 | R2 (mocked) | BR-005, AC-014, AC-015 |
| Frontend: Create form upload flow | integration | submit with no files → record saved, no upload call; submit with files → record saved then uploadFiles called; upload partial failure → error shown inline, navigation proceeds | useApi (mocked), useFileUpload (mocked) | AC-003, AC-004, AC-005, BR-009 |
| Frontend: Update form file operations | integration | add new files → uploadFiles called post-save; remove existing file → deleteFile called post-save; delete fails → error shown inline, record still saved; mixed add+remove → both operations executed | useApi (mocked), useFileUpload (mocked) | AC-006, AC-007, AC-008, AC-009 |
| Frontend: Detail view rendering | unit | `anexosFiles` with images → FileDisplay rendered with thumbnails; `anexosFiles` empty → section hidden; legacy record (no field) → section hidden; `anexos` text present → "Notas Anexas" section shown | none (component props) | AC-010, AC-011, AC-013, AC-016 |
| Frontend: FileUploadZone validation | unit | file > 10MB rejected with inline error; unsupported MIME type rejected; valid file accepted and previewed | none (component internal) | BR-002, BR-003, AC-002 |

## [MI] — Executable Plan

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|------------|-----------------|--------|
| MI-01 | `RemoteAssistanceData` type | New field compiles with `FileReference[]` | `{ anexosFiles: [{ key: 'files/remote-assistance/uuid/file.jpg', name: 'photo.jpg', mimeType: 'image/jpeg', size: 1024 }] }` | Object valid, compatible with `RemoteAssistanceData` | BR-001, BR-007 |
| MI-02 | `RemoteAssistanceData` type | Missing field from old record normalizes to `[]` | `data.anexosFiles` is `undefined` | `Array.isArray(data.anexosFiles) ? data.anexosFiles : []` returns `[]` | BR-006 |
| MI-03 | `validateRemoteAssistanceCreate()` | `anexosFiles` absent defaults to `[]` | Request body without `anexosFiles` field | Created data has `anexosFiles: []` | BR-001, AC-004 |
| MI-04 | `validateRemoteAssistanceCreate()` | Non-array `anexosFiles` defaults to `[]` | Request body with `anexosFiles: "old text value"` | Created data has `anexosFiles: []` | BR-006 |
| MI-05 | Custom DELETE handler | Record with files — soft-delete + cleanup | Record with `anexosFiles: [{key: 'files/remote-assistance/uuid/a.jpg', ...}]` | 200 OK, record soft-deleted, R2.delete called for each file | BR-005, AC-014 |
| MI-06 | Custom DELETE handler | R2 delete fails — record still deleted | Record with files, R2.delete throws error | 200 OK, record soft-deleted, error logged but not thrown | AC-015 |
| MI-07 | Custom DELETE handler | Record with no files — soft-delete only | Record with `anexosFiles: []` | 200 OK, record soft-deleted, no R2.delete calls | BR-005 |
| MI-08 | Custom DELETE handler | Record not found — 404 | UUID that does not exist | 404 response | — |
| MI-09 | Create form upload flow | Submit with no files — no upload call | `pendingAnexosFiles: []`, form submitted | `api.create()` called, `uploadFiles` NOT called | AC-004 |
| MI-10 | Create form upload flow | Submit with files — upload after save | `pendingAnexosFiles: [File, File]`, form submitted | `api.create()` called first, then `uploadFiles('remote-assistance', uuid, 'anexosFiles', files)` called | AC-003, AC-005, BR-009 |
| MI-11 | Update form file operations | Add new files — uploadFiles called post-save | `pendingNewFiles: [File]`, `pendingRemovedKeys: []` | `api.update()` called, then `uploadFiles` called | AC-008 |
| MI-12 | Update form file operations | Remove existing file — deleteFile called post-save | `pendingNewFiles: []`, `pendingRemovedKeys: ['fileId.jpg']` | `api.update()` called, then `deleteFile('remote-assistance', uuid, 'fileId.jpg')` called | AC-007 |
| MI-13 | Update form file operations | Delete fails — error shown inline | `deleteFile` returns `false` | Error message displayed inline, navigation still proceeds | AC-009 |
| MI-14 | Detail view rendering | `anexosFiles` with images — FileDisplay rendered | `anexosFiles: [{key: '...', mimeType: 'image/jpeg', ...}]` | `FileDisplay` component rendered with correct props | AC-010 |
| MI-15 | Detail view rendering | `anexosFiles` empty — section hidden | `anexosFiles: []` | FileDisplay NOT rendered, no "Anexos" section visible | AC-011 |
| MI-16 | Detail view rendering | Legacy record — "Notas Anexas" shown | `anexosFiles: undefined`, `anexos: 'some old text'` | FileDisplay NOT rendered, "Notas Anexas" section shown with text | AC-016 |

## [MA] — Executable Plan

| Test ID | AC-ID | Given / When / Then | Data | Pass criterion |
|---------|-------|---------------------|------|----------------|
| MA-01 | AC-001 | Given technician opens Create form / When form loads / Then FileUploadZone visible in "Anexos" section | — | Upload zone rendered with label "Ficheiros", touch target ≥ 44px |
| MA-02 | AC-002 | Given technician in Create form / When selects file > 10MB / Then inline validation error shown | File: 15MB JPEG | Error message displayed, file rejected before upload |
| MA-03 | AC-003 | Given technician selects valid files and submits / When form submitted / Then record saved with file references | 2 valid JPEG files | Record created, files uploaded, references stored in `anexosFiles` |
| MA-04 | AC-004 | Given technician submits form with no files / When form submitted / Then record saved with empty attachments | No files selected | Record saved successfully, `anexosFiles: []` |
| MA-05 | AC-005 | Given files partially fail to upload / When upload error occurs / Then inline error shown, record saved | 1 file succeeds, 1 fails | Error message inline, record exists with successful file reference |
| MA-06 | AC-006 | Given technician opens Update form with existing files / When form loads / Then existing files shown with remove controls | Record with 2 attached files | Files displayed in upload zone, each with individual remove button |
| MA-07 | AC-007 | Given technician marks file for removal and submits / When form submitted / Then file deleted from storage | 1 file marked for removal | File removed from R2, reference removed from record |
| MA-08 | AC-008 | Given technician adds new files in Update form / When form submitted / Then new files uploaded alongside existing | 1 new file added, 1 existing retained | Both files present in record after update |
| MA-09 | AC-009 | Given file removal fails during update / When delete error occurs / Then error shown inline, record saved | R2 delete fails | Error message displayed, record update still saved |
| MA-10 | AC-010, AC-012 | Given user views detail with image attachments / When detail loads / Then images shown as clickable thumbnails | Record with 2 JPEG files | Thumbnails rendered, clicking opens full-size in new tab |
| MA-11 | AC-011 | Given user views detail with no attachments / When detail loads / Then "Anexos" section not rendered | Record with `anexosFiles: []` | No "Anexos" section in DOM |
| MA-12 | AC-014, AC-015 | Given admin deletes record with files / When delete confirmed / Then record deleted, files cleaned up | Record with 3 files | Record soft-deleted, R2 cleanup attempted, deletion not blocked by cleanup failure |
| MA-13 | AC-016 | Given user views legacy record with plain-text anexos / When detail loads / Then no broken UI | Record with `anexos: 'old text'`, no `anexosFiles` | "Notas Anexas" section shown with text, no FileDisplay, no errors |
| MA-14 | AC-017 | Given technician updates legacy record / When form submitted / Then old text replaced with structured data | Record with `anexos: 'old text'`, update adds 1 file | `anexosFiles` contains new file reference, `anexos` text preserved independently |
