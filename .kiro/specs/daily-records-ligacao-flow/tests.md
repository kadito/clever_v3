# Registo Diário — Fluxo de Ligação - Tests

## [MI] — Strategy

| Interface | Test type | Key scenarios from design | Mocked dependencies | REQ-ID |
|-----------|-----------|--------------------------|---------------------|--------|
| ActivityCard — timeFieldsLocked computed | unit | 1. Returns true when timeAutoPopulated=true AND workSheetId set 2. Returns true when timeAutoPopulated=true AND remoteAssistanceId set 3. Returns false when timeAutoPopulated=false 4. Returns false when neither doc ID set | None (pure computed) | DR-LIG-AC-006, DR-LIG-AC-009 |
| ActivityCard — handleWorkSheetSelected | unit | 1. Success: sets horaInicio, horaFim from WS, tempoPausa=0, timeAutoPopulated=true 2. Failure: timeAutoPopulated stays false, fetchError set 3. Null selection: clears workSheetId, resets time if was auto-populated 4. Empty time data: treated as failure (fields editable) | useApi (mock fetchById) | DR-LIG-AC-005, DR-LIG-AC-018, DR-LIG-AC-019 |
| ActivityCard — handleRemoteAssistanceSelected | unit | 1. Success: extracts HH:MM from ISO, sets horaInicio/horaFim, tempoPausa=0 2. Failure: same as WS failure path 3. Null selection: clears remoteAssistanceId, resets time | useApi (mock fetchById) | DR-LIG-AC-008, DR-LIG-AC-018, DR-LIG-AC-019 |
| ActivityCard — handleClientSelected | unit | 1. Client changed: clears workSheetId/remoteAssistanceId, resets time if auto-populated, clears fetchError 2. Client removed: same clearing logic 3. Initial selection (from empty): no clearing | None | DR-LIG-AC-010, DR-LIG-AC-011 |
| ActivityCard — handleLinkTypeChange | unit | 1. To Nenhuma: clears both doc IDs, resets time, clears fetchError 2. To FO: clears remoteAssistanceId 3. To AR: clears workSheetId | None | DR-LIG-AC-001, DR-LIG-AC-002 |
| ActivityCard — disabled states (template) | integration | 1. Ligação disabled when no clientId and not legacy 2. Time inputs disabled when timeFieldsLocked=true 3. Time inputs enabled when timeFieldsLocked=false | @vue/test-utils mount | DR-LIG-AC-003, DR-LIG-AC-006, DR-LIG-AC-009 |
| DailyRecordsListView — collaborator display | integration | 1. Shows technician name when data.technician exists 2. Shows "Não atribuído" when data.technician is null 3. Renders badge before date badge | @vue/test-utils mount, mock useApi | DR-LIG-AC-016, DR-LIG-AC-017 |
| validateActivity (shared) | unit | 1. clientId missing for new → error 2. tipoLigacao empty → error 3. workSheetId missing when FO → error 4. remoteAssistanceId missing when AR → error 5. All valid → no errors | None (pure function) | DR-LIG-AC-012, DR-LIG-AC-013, DR-LIG-AC-014, DR-LIG-AC-015 |

## Correctness Properties

### P-1 — Time lock invariant
**Requirement**: DR-LIG-AC-006, DR-LIG-AC-009 — WHILE a document is selected, time fields SHALL be read-only
**Property**: For any activity state where `timeAutoPopulated === true` AND (`workSheetId !== undefined` OR `remoteAssistanceId !== undefined`), the computed `timeFieldsLocked` SHALL return `true`
**Test approach**: fast-check — generate 100 random activity states (random booleans for timeAutoPopulated, random optional UUIDs for workSheetId/remoteAssistanceId), verify timeFieldsLocked matches expected formula

### P-2 — Client change reset invariant
**Requirement**: DR-LIG-AC-010 — WHEN client changes, linked document SHALL be cleared
**Property**: For any activity state with a selected document (workSheetId or remoteAssistanceId set), WHEN clientId changes to a different value, the resulting state SHALL have workSheetId === undefined AND remoteAssistanceId === undefined AND timeAutoPopulated === false
**Test approach**: fast-check — generate 100 random (previousClientId, newClientId, workSheetId, remoteAssistanceId) tuples where previousClientId !== newClientId, verify post-conditions

### P-3 — Pausa zero on document selection
**Requirement**: DR-LIG-AC-005, DR-LIG-AC-008 — WHEN document selected, tempoPausa SHALL be 0
**Property**: For any successful document selection (timeAutoPopulated becomes true), the resulting tempoPausa SHALL equal 0
**Test approach**: fast-check — generate 100 random WorkSheet/RemoteAssistance objects with valid time data, simulate selection, verify tempoPausa === 0

### P-4 — Validation completeness
**Requirement**: DR-LIG-AC-012 to AC-015 — IF mandatory fields missing, THEN error
**Property**: For any Activity where `isNewRecord === true`, IF clientId is empty THEN errors contains "Cliente é obrigatório"; IF tipoLigacao is empty THEN errors contains appropriate message; IF tipoLigacao === 'Folha de Obra' AND workSheetId is empty THEN errors contains "Folha de obra é obrigatória"
**Test approach**: fast-check — generate 100 random Activity objects with selective field omissions, verify that validateActivity returns expected error messages for each missing field combination


## [MA] — Plan de tests d'acceptation

| MA-ID | Scenario | Preconditions | Steps | Expected result | REQ-ID |
|-------|----------|---------------|-------|-----------------|--------|
| MA-01 | Create activity with Ligação "Nenhuma" | User on create form, client selected | 1. Select "Nenhuma" in Ligação 2. Fill horaInicio, horaFim, tempoPausa manually 3. Fill Assunto 4. Submit | Activity created, all time fields editable | DR-LIG-AC-001, DR-LIG-AC-002 |
| MA-02 | Create activity with Folha de Obra link | User on create form, client selected | 1. Select "Folha de Obra" in Ligação 2. Select a work sheet 3. Verify time fields auto-fill 4. Verify time fields locked 5. Fill Assunto 6. Submit | horaInicio/horaFim populated from WS, tempoPausa=0, fields read-only | DR-LIG-AC-004, DR-LIG-AC-005, DR-LIG-AC-006 |
| MA-03 | Create activity with Assistência Remota link | User on create form, client selected | 1. Select "Assistência Remota" 2. Select a remote assistance 3. Verify time auto-fill and lock 4. Fill Assunto 5. Submit | horaInicio/horaFim populated from RA (HH:MM extracted), tempoPausa=0, fields read-only | DR-LIG-AC-007, DR-LIG-AC-008, DR-LIG-AC-009 |
| MA-04 | Client change clears linked document | Activity has WS selected and time locked | 1. Change client to a different one 2. Verify document cleared 3. Verify time fields editable | workSheetId cleared, time fields reset to editable | DR-LIG-AC-010, DR-LIG-AC-011 |
| MA-05 | Validation blocks submission without client | User on create form, no client selected | 1. Fill other fields 2. Try to submit | Error "Cliente é obrigatório" shown, submission blocked | DR-LIG-AC-012 |
| MA-06 | Validation blocks submission without ligação | Client selected, Ligação empty | 1. Select client 2. Leave Ligação unselected 3. Try to submit | Error "Ligação é obrigatória" shown, submission blocked | DR-LIG-AC-013 |
| MA-07 | Validation blocks submission without document | Ligação = "Folha de Obra", no WS selected | 1. Select FO ligação 2. Don't select a work sheet 3. Submit | Error "Folha de obra é obrigatória" shown | DR-LIG-AC-014, DR-LIG-AC-015 |
| MA-08 | Collaborator visible in list view | Multiple daily records exist with technicians | 1. Navigate to list view 2. Verify each item shows technician name badge | Name badge visible with amber styling, fallback "Não atribuído" for legacy | DR-LIG-AC-016, DR-LIG-AC-017 |
| MA-09 | Document fetch failure — graceful degradation | Network error on fetch | 1. Select "Folha de Obra" 2. Select a work sheet (simulated fetch failure) 3. Verify fields remain editable 4. Verify warning message | Time fields stay editable, warning "Os tempos não puderam ser preenchidos automaticamente" shown | DR-LIG-AC-018, DR-LIG-AC-019 |
