# Registo Diário - Client-Activity Link - Tests

## [MI] — Strategy

| ID | Interface | Test type | Key scenarios from design | Mocked dependencies | REQ-ID |
|----|-----------|-----------|--------------------------|---------------------|--------|
| MI-01 | `validateActivity` (clientId rules) | unit | New activity without clientId → error; legacy activity without clientId + no linked doc → valid; edit activity with linked doc but no clientId → error | None (pure function) | DR-BR-001, DR-DEC-003, DR-AC-011, DR-AC-012 |
| MI-02 | `validateDailyRecordCreation` | unit | All activities must have clientId; mixed activities (some with, some without) → errors for missing ones | None (pure function) | DR-DEC-004, DR-BR-001 |
| MI-03 | `validateDailyRecordUpdate` | unit | Legacy activities without client pass; editing legacy with new link requires client | None (pure function) | DR-AC-011, DR-AC-012 |
| MI-04 | Backend `listFiltered` with `clientId` param | integration | Filter returns only items matching clientId; unknown clientId returns empty; combined clientId + search returns intersection | R2 storage (mocked bucket with test index) | DR-AC-003, DR-AC-005, DR-BR-002 |
| MI-05 | `GET /api/content/work-sheets?clientId=X` | integration | Returns only work sheets belonging to client X; empty results for client with no work sheets | R2 storage (mocked) | DR-AC-003, DR-NFR-001 |
| MI-06 | `GET /api/content/remote-assistance?clientId=X` | integration | Returns only remote assistances belonging to client X; empty results for client with no RAs | R2 storage (mocked) | DR-AC-005, DR-NFR-001 |
| MI-07 | ActivityCard client cascade (component) | unit | Client change clears workSheetId + remoteAssistanceId; client change resets auto-populated time; client removal disables link fields; same client re-select does not clear | Vue component (mount with @vue/test-utils), mock useApi | DR-AC-007, DR-AC-008, DR-BR-003, DR-UX-004 |
| MI-08 | ActivityCard field ordering | unit | Client field rendered before Ligação; Ligação disabled when no client; document search hidden when no client | Vue component (mount with @vue/test-utils) | DR-UX-001, DR-UX-002, DR-AC-010 |
| MI-09 | ActivityCard backward compat (legacy) | unit | Legacy activity (has workSheetId, no clientId) renders with link fields enabled; user can edit without client | Vue component (mount with @vue/test-utils) | DR-AC-011, DR-DEC-003 |

## [MA] — Acceptance Tests

| ID | Story | Scenario | Steps | Expected outcome | REQ-ID |
|----|-------|----------|-------|------------------|--------|
| MA-01 | DR-S-001 | Select client then pick Work Sheet | 1. Open new activity form 2. Select a client 3. Choose "Folha de Obra" 4. Search shows only that client's WS 5. Select a WS | workSheetId set, time auto-populated from WS | DR-AC-001, DR-AC-002, DR-AC-003, DR-AC-004 |
| MA-02 | DR-S-002 | Select client then pick Remote Assistance | 1. Open new activity form 2. Select a client 3. Choose "Assistência Remota" 4. Search shows only that client's RAs 5. Select an RA | remoteAssistanceId set, time auto-populated from RA | DR-AC-005, DR-AC-006 |
| MA-03 | DR-S-003 | Change client after linking | 1. Select client A 2. Link to WS from A 3. Change to client B | workSheetId cleared, time reset, search shows B's docs | DR-AC-007, DR-AC-008 |
| MA-04 | DR-S-004 | Client with no documents | 1. Select a client with no WS/RA 2. Choose "Folha de Obra" | Empty results shown, informative empty state message displayed | DR-AC-009 |
| MA-05 | DR-S-004 | No client selected | 1. Open new activity form 2. Do not select client | Ligação disabled, document search hidden | DR-AC-010 |
| MA-06 | DR-S-005 | Edit legacy activity | 1. Open existing activity without clientId but with workSheetId 2. Edit non-link fields | Edit succeeds without requiring client selection | DR-AC-011 |
| MA-07 | DR-S-005 | Change link on legacy activity | 1. Open legacy activity (no clientId, has WS) 2. Try to change linked document | Client selection required before showing filtered results | DR-AC-012 |
