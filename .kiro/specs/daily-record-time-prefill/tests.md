# Daily Record Time Prefill — Tests

## [MI] — Strategy

| Interface | Test type | Key scenarios from design | Mocked dependencies | REQ-ID |
|-----------|-----------|--------------------------|---------------------|--------|
| `extractHHMM(isoString)` | unit | Valid ISO string → correct HH:MM; empty string → `''`; null/undefined → `''`; malformed string → `''`; midnight edge case `00:00`; end-of-day `23:59` | none | DRTP-BR-002, DRTP-BR-003, DRTP-AC-005, DRTP-AC-006, DRTP-AC-007 |
| `extractTimeFromWorkSheet(ws)` | unit | WorkSheet with both times → `{ horaInicio, horaFim }`; WorkSheet with empty `arrivalTime` → `horaInicio: ''`; WorkSheet with empty `departureTime` → `horaFim: ''`; both empty → both `''` | none | DRTP-BR-001, DRTP-BR-003, DRTP-AC-001, DRTP-AC-002, DRTP-AC-003 |
| `extractTimeFromRemoteAssistance(ra)` | unit | RA with both ISO times → correct HH:MM pair; RA with empty `inicioAssistencia` → `horaInicio: ''`; RA with empty `fimAssistencia` → `horaFim: ''`; both empty → both `''` | none | DRTP-BR-002, DRTP-BR-003, DRTP-AC-005, DRTP-AC-006, DRTP-AC-007 |
| `ActivityCard` — WorkSheet pre-fill | integration | Selecting a WorkSheet emits `activity-updated` with `horaInicio = arrivalTime` and `horaFim = departureTime`; selecting a different WorkSheet overwrites previous times; WorkSheet with no times leaves fields empty | `useApi('work-sheets').fetchById` mocked | DRTP-AC-001, DRTP-AC-002, DRTP-AC-003, DRTP-AC-004, DRTP-BR-001 |
| `ActivityCard` — RemoteAssistance pre-fill | integration | Selecting a RemoteAssistance emits `activity-updated` with extracted HH:MM times; selecting a different RA overwrites; RA with no times leaves fields empty | `useApi('remote-assistance').fetchById` mocked | DRTP-AC-005, DRTP-AC-006, DRTP-AC-007, DRTP-AC-008, DRTP-BR-002 |
| `ActivityCard` — link type cleared | integration | Changing `tipoLigacao` to `Nenhuma` after a pre-fill emits `activity-updated` with `horaInicio: ''` and `horaFim: ''` | none | DRTP-AC-009, DRTP-BR-005 |
| `ActivityCard` — manual override preserved | integration | After pre-fill, manually editing `horaInicio` or `horaFim` emits the manually entered value; value is not overwritten until a new document is selected | `useApi` mocked | DRTP-AC-010, DRTP-AC-011, DRTP-BR-006 |
| `ActivityCard` — fetch error graceful degradation | integration | When `fetchById` rejects, `horaInicio` and `horaFim` remain unchanged; `activity-updated` is still emitted | `useApi.fetchById` mocked to reject | DRTP-AC-012, DRTP-BR-003 |
| `ActivityCard` — link type switch (FO → AR) | integration | After pre-fill from WorkSheet, switching to `Assistência Remota` and selecting a RA overwrites times with RA times | `useApi` mocked for both types | DRTP-AC-015, DRTP-S-007 |
| `ActivityCard` — link type switch (AR → FO) | integration | After pre-fill from RemoteAssistance, switching to `Folha de Obra` and selecting a WS overwrites times with WS times | `useApi` mocked for both types | DRTP-AC-016, DRTP-S-007 |
| `ActivityCard` — immediate update (no extra action) | integration | Pre-fill fires without any additional user action after document selection; `activity-updated` emitted in `.finally()` | `useApi` mocked | DRTP-AC-013, DRTP-NFR-001 |
| `ActivityCard` — parity Create/Update | integration | Pre-fill behavior is identical whether `ActivityCard` is rendered inside Create or Update context (same component, same handlers) | `useApi` mocked | DRTP-AC-014, DRTP-S-006 |

## [MI] — Executable Plan

| Test ID | Interface | Behaviour | Input data | Expected result | REQ-ID |
|---------|-----------|-----------|------------|-----------------|--------|
| MI-01 | `extractHHMM` | Valid ISO string returns HH:MM | `"2024-07-14T09:30:00.000Z"` | `"09:30"` (local time) | DRTP-BR-002, DRTP-AC-005 |
| MI-02 | `extractHHMM` | Empty string returns `''` | `""` | `""` | DRTP-BR-003, DRTP-AC-007 |
| MI-03 | `extractHHMM` | `null` returns `''` | `null` | `""` | DRTP-BR-003 |
| MI-04 | `extractHHMM` | `undefined` returns `''` | `undefined` | `""` | DRTP-BR-003 |
| MI-05 | `extractHHMM` | Malformed string returns `''` | `"not-a-date"` | `""` | DRTP-BR-003 |
| MI-06 | `extractHHMM` | Midnight edge case | ISO string for `00:00` local | `"00:00"` | DRTP-BR-002 |
| MI-07 | `extractHHMM` | End-of-day edge case | ISO string for `23:59` local | `"23:59"` | DRTP-BR-002 |
| MI-08 | `extractTimeFromWorkSheet` | Both times present | `ws.data.request.arrivalTime = "08:00"`, `departureTime = "17:00"` | `{ horaInicio: "08:00", horaFim: "17:00" }` | DRTP-BR-001, DRTP-AC-001, DRTP-AC-002 |
| MI-09 | `extractTimeFromWorkSheet` | `arrivalTime` empty | `arrivalTime = ""`, `departureTime = "17:00"` | `{ horaInicio: "", horaFim: "17:00" }` | DRTP-BR-003, DRTP-AC-003 |
| MI-10 | `extractTimeFromWorkSheet` | `departureTime` empty | `arrivalTime = "08:00"`, `departureTime = ""` | `{ horaInicio: "08:00", horaFim: "" }` | DRTP-BR-003, DRTP-AC-003 |
| MI-11 | `extractTimeFromWorkSheet` | Both times empty | `arrivalTime = ""`, `departureTime = ""` | `{ horaInicio: "", horaFim: "" }` | DRTP-BR-003, DRTP-AC-003 |
| MI-12 | `extractTimeFromRemoteAssistance` | Both ISO times present | `inicioAssistencia = "2024-07-14T09:00:00.000Z"`, `fimAssistencia = "2024-07-14T11:30:00.000Z"` | `{ horaInicio: "09:00", horaFim: "11:30" }` (local) | DRTP-BR-002, DRTP-AC-005, DRTP-AC-006 |
| MI-13 | `extractTimeFromRemoteAssistance` | `inicioAssistencia` empty | `inicioAssistencia = ""`, `fimAssistencia = "2024-07-14T11:30:00.000Z"` | `{ horaInicio: "", horaFim: "11:30" }` | DRTP-BR-003, DRTP-AC-007 |
| MI-14 | `extractTimeFromRemoteAssistance` | `fimAssistencia` empty | `inicioAssistencia = "2024-07-14T09:00:00.000Z"`, `fimAssistencia = ""` | `{ horaInicio: "09:00", horaFim: "" }` | DRTP-BR-003, DRTP-AC-007 |
| MI-15 | `extractTimeFromRemoteAssistance` | Both empty | `inicioAssistencia = ""`, `fimAssistencia = ""` | `{ horaInicio: "", horaFim: "" }` | DRTP-BR-003, DRTP-AC-007 |
| MI-16 | `ActivityCard` — WS pre-fill | Selecting a WorkSheet pre-fills times | `fetchById` resolves with `arrivalTime = "08:00"`, `departureTime = "17:00"` | `activity-updated` emitted with `horaInicio: "08:00"`, `horaFim: "17:00"` | DRTP-AC-001, DRTP-AC-002, DRTP-BR-001 |
| MI-17 | `ActivityCard` — WS pre-fill | WorkSheet with no times leaves fields empty | `fetchById` resolves with `arrivalTime = ""`, `departureTime = ""` | `activity-updated` emitted with `horaInicio: ""`, `horaFim: ""` | DRTP-AC-003, DRTP-BR-003 |
| MI-18 | `ActivityCard` — WS pre-fill | Selecting a different WorkSheet overwrites times | First WS: `"08:00"/"17:00"`, second WS: `"09:00"/"18:00"` | After second selection, `activity-updated` emitted with `horaInicio: "09:00"`, `horaFim: "18:00"` | DRTP-AC-004, DRTP-BR-004 |
| MI-19 | `ActivityCard` — RA pre-fill | Selecting a RemoteAssistance pre-fills times | `fetchById` resolves with `inicioAssistencia` ISO for `10:00`, `fimAssistencia` ISO for `12:00` | `activity-updated` emitted with `horaInicio: "10:00"`, `horaFim: "12:00"` | DRTP-AC-005, DRTP-AC-006, DRTP-BR-002 |
| MI-20 | `ActivityCard` — RA pre-fill | RA with no times leaves fields empty | `fetchById` resolves with `inicioAssistencia = ""`, `fimAssistencia = ""` | `activity-updated` emitted with `horaInicio: ""`, `horaFim: ""` | DRTP-AC-007, DRTP-BR-003 |
| MI-21 | `ActivityCard` — RA pre-fill | Selecting a different RA overwrites times | First RA: `"10:00"/"12:00"`, second RA: `"14:00"/"16:00"` | After second selection, `activity-updated` emitted with `horaInicio: "14:00"`, `horaFim: "16:00"` | DRTP-AC-008, DRTP-BR-004 |
| MI-22 | `ActivityCard` — link cleared | Changing to `Nenhuma` clears pre-filled times | `tipoLigacao` changed to `"Nenhuma"` after WS pre-fill | `activity-updated` emitted with `horaInicio: ""`, `horaFim: ""` | DRTP-AC-009, DRTP-BR-005 |
| MI-23 | `ActivityCard` — manual override | Manual edit after pre-fill is preserved | Pre-fill sets `"08:00"/"17:00"`, user types `"09:00"` in `horaInicio` | `activity-updated` emitted with `horaInicio: "09:00"`, `horaFim: "17:00"` | DRTP-AC-010, DRTP-BR-006 |
| MI-24 | `ActivityCard` — manual override | Time fields remain editable while link is active | `tipoLigacao = "Folha de Obra"`, `workSheetId` set | `horaInicio` and `horaFim` inputs are not disabled | DRTP-AC-011, DRTP-BR-006 |
| MI-25 | `ActivityCard` — fetch error | Fetch failure leaves times unchanged | `fetchById` rejects; initial `horaInicio = "07:00"`, `horaFim = "15:00"` | `activity-updated` emitted with `horaInicio: "07:00"`, `horaFim: "15:00"` (unchanged) | DRTP-AC-012, DRTP-BR-003 |
| MI-26 | `ActivityCard` — link switch FO→AR | Switching to RA and selecting overwrites WS times | WS pre-fill: `"08:00"/"17:00"`, then RA selected: `"10:00"/"12:00"` | `activity-updated` emitted with `horaInicio: "10:00"`, `horaFim: "12:00"` | DRTP-AC-015, DRTP-S-007 |
| MI-27 | `ActivityCard` — link switch AR→FO | Switching to WS and selecting overwrites RA times | RA pre-fill: `"10:00"/"12:00"`, then WS selected: `"08:00"/"17:00"` | `activity-updated` emitted with `horaInicio: "08:00"`, `horaFim: "17:00"` | DRTP-AC-016, DRTP-S-007 |
| MI-28 | `ActivityCard` — immediate update | `activity-updated` emitted without extra user action | `fetchById` resolves | `activity-updated` emitted in `.finally()` — no additional interaction required | DRTP-AC-013, DRTP-NFR-001 |
| MI-29 | `ActivityCard` — parity Create/Update | Pre-fill behaves identically in Create and Update context | `ActivityCard` rendered with same props in both contexts; `fetchById` resolves with `arrivalTime = "08:00"`, `departureTime = "17:00"` | `activity-updated` emitted with `horaInicio: "08:00"`, `horaFim: "17:00"` in both cases | DRTP-AC-014, DRTP-S-006 |

## [MA] — Executable Plan

| Test ID | AC-ID | Given / When / Then | Data | Pass criterion |
|---------|-------|---------------------|------|----------------|
| MA-01 | DRTP-AC-001, DRTP-AC-002 | **Given** a Folha de Obra with `arrivalTime = "08:00"` and `departureTime = "17:00"` **When** the user selects it in an activity entry **Then** `Hora Início` shows `"08:00"` and `Hora Fim` shows `"17:00"` | WS with both times | Both fields updated immediately |
| MA-02 | DRTP-AC-003 | **Given** a Folha de Obra with no `arrivalTime` and no `departureTime` **When** the user selects it **Then** `Hora Início` and `Hora Fim` remain empty | WS with empty times | Fields stay empty |
| MA-03 | DRTP-AC-004 | **Given** a first Folha de Obra was selected (times pre-filled) **When** the user selects a different Folha de Obra **Then** `Hora Início` and `Hora Fim` are overwritten with the new document's times | 2 WSs with different times | Fields show second WS times |
| MA-04 | DRTP-AC-005, DRTP-AC-006 | **Given** an Assistência Remota with `inicioAssistencia` at 10:00 and `fimAssistencia` at 12:00 **When** the user selects it **Then** `Hora Início` shows `"10:00"` and `Hora Fim` shows `"12:00"` | RA with both ISO times | Both fields updated immediately |
| MA-05 | DRTP-AC-007 | **Given** an Assistência Remota with no `inicioAssistencia` and no `fimAssistencia` **When** the user selects it **Then** `Hora Início` and `Hora Fim` remain empty | RA with empty times | Fields stay empty |
| MA-06 | DRTP-AC-008 | **Given** a first Assistência Remota was selected (times pre-filled) **When** the user selects a different Assistência Remota **Then** `Hora Início` and `Hora Fim` are overwritten with the new document's times | 2 RAs with different times | Fields show second RA times |
| MA-07 | DRTP-AC-009 | **Given** a Folha de Obra was selected and times were pre-filled **When** the user changes `Ligação` to `"Nenhuma"` **Then** `Hora Início` and `Hora Fim` are cleared | WS pre-fill active | Both fields empty after clearing |
| MA-08 | DRTP-AC-010 | **Given** a Folha de Obra was selected and times were pre-filled **When** the user manually edits `Hora Início` to `"09:00"` and does not change the linked document **Then** `Hora Início` retains `"09:00"` | WS pre-fill + manual edit | Manual value preserved |
| MA-09 | DRTP-AC-011 | **Given** a Folha de Obra is selected and times are pre-filled **When** the user clicks on `Hora Início` or `Hora Fim` **Then** the fields are editable | WS pre-fill active | Fields accept input |
| MA-10 | DRTP-AC-012 | **Given** a linked document with no time data is selected **When** the pre-fill runs **Then** `Hora Início` and `Hora Fim` are not modified | Document with empty times | Fields unchanged |
| MA-11 | DRTP-AC-013 | **Given** the user selects a Folha de Obra **When** the selection is confirmed **Then** `Hora Início` and `Hora Fim` update without any additional user action | WS with times | Fields update immediately |
| MA-12 | DRTP-AC-014 | **Given** the user is creating a new daily record **When** a Folha de Obra is selected in an activity **Then** the pre-fill behaves identically to the update form | Create form context | Same pre-fill behaviour |
| MA-13 | DRTP-AC-015 | **Given** a Folha de Obra was selected (times pre-filled) **When** the user switches `Ligação` to `"Assistência Remota"` and selects an RA **Then** `Hora Início` and `Hora Fim` are overwritten with the RA's times | WS pre-fill → RA selection | Fields show RA times |
| MA-14 | DRTP-AC-016 | **Given** an Assistência Remota was selected (times pre-filled) **When** the user switches `Ligação` to `"Folha de Obra"` and selects a WS **Then** `Hora Início` and `Hora Fim` are overwritten with the WS's times | RA pre-fill → WS selection | Fields show WS times |
