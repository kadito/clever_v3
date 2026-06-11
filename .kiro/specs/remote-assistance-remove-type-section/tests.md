# Remote Assistance Remove Type Section — Tests

## [MI] — Strategy

| ID | Interface | Test type | Key scenarios from design | Mocked dependencies | REQ-ID |
|----|-----------|-----------|--------------------------|---------------------|--------|
| MI-01 | Form config (`remote-assistance-form-sections.ts`) | unit | Section array does not contain `assistanceInfo` key; no field with key `tipoAssistencia` exists in any section | None | RA-RTS-BR-001, RA-RTS-UX-001 |
| MI-02 | Create validation (`RemoteAssistanceCreateView`) | unit | Validation passes without `tipoAssistencia` in payload; no error message references "tipo de assistência" | None | RA-RTS-AC-001 |
| MI-03 | Update validation (`RemoteAssistanceUpdateView`) | unit | Validation passes without `tipoAssistencia` in payload; no error message references "tipo de assistência" | None | RA-RTS-AC-002 |
| MI-04 | Backend search index (`remote-assistance.ts`) | unit | `createRemoteAssistanceSearchText()` output does not contain tipoAssistencia values; `extractIndexFields()` result has no `tipoAssistencia` key | Mocked R2 storage | RA-RTS-AC-004, RA-RTS-BR-002 |
| MI-05 | Shared validation (`validation.ts`) | unit | `validateRemoteAssistanceCreation()` returns no errors when `tipoAssistencia` is empty/missing; same for update | None | RA-RTS-BR-001 |

## [MA] — Acceptance

| ID | Scenario | Steps | Expected result | REQ-ID |
|----|----------|-------|-----------------|--------|
| MA-01 | Form renders without assistanceInfo section | Open Remote Assistance Create view | Form displays without "Informação da Assistência" section | RA-RTS-AC-001, RA-RTS-UX-001 |
| MA-02 | Create succeeds without tipoAssistencia | Fill all required fields (except tipoAssistencia) and submit | Record created successfully; no validation error about "tipo de assistência" | RA-RTS-AC-001, RA-RTS-BR-001 |
| MA-03 | Update view renders without the section | Open an existing Remote Assistance record for editing | Form displays without "Informação da Assistência" section | RA-RTS-AC-002 |
| MA-04 | Detail view hides tipoAssistencia | Open an existing record that has tipoAssistencia stored | Detail view does not show "Tipo de Assistência" field | RA-RTS-AC-003 |
| MA-05 | Search index omits tipoAssistencia on new records | Create a new record and inspect its index entry | Index entry does not contain `tipoAssistencia` field | RA-RTS-AC-004 |
| MA-06 | Type-check passes | Run `pnpm type-check` | Zero TypeScript errors — backward compat preserved | RA-RTS-BR-003 |
