# Requirements — KV to R2 Work Sheets Migration

## 1. Context and Actors

**Actors:**
- **Operator**: administrator who runs the migration script manually

**Trigger:** The company has a legacy storage system containing work sheet records (Folhas de Obra) organized by year that need to be transferred to the new storage system with an updated data schema. The legacy records use a semi-structured format with `client`, `request`, `displacement`, and `otherData` sub-objects, while the new schema uses the `BaseContent` wrapper with typed `WorkSheetData`.

**Nominal result:** All work sheet records are read from the legacy storage (iterating years 2024–current), transformed to the new schema (including client ID resolution from R2), and written to the new storage. The work-sheets search index is updated. A JSON file listing all successful migrations and a JSON file listing all errors are produced.

**Error result:** Any work sheet that fails to migrate is recorded in a separate JSON file with the reason for failure. The script continues processing remaining records.

---

## 2. Scope

### Included
- Reading all work sheet records from the legacy storage (account `98dfed939a59dca09770880eab939b79`, namespace `clever-clever-kv`) using year-based prefixes `folhas-obra-{year}-` for years 2024 through current year
- Transforming each record from the legacy semi-structured schema to the new `BaseContent` + `WorkSheetData` schema
- Resolving `clientId` by looking up the client in R2 using `client.commercialName` from the legacy record
- Dropping legacy displacement price fields (`roundTripKm`, `totalCalculatedHours`, `displacementCost`, `laborCost`, `totalCostWithTax`, `clientContract`, `totalToPay`)
- Preserving the technician field as a plain string (backward compatible)
- Writing each transformed record to the new storage system
- Updating the work-sheets search index after all records are written
- Producing a `migration-success.json` file listing all successfully migrated work sheets
- Producing a `migration-errors.json` file listing all failed work sheets with error details

### Excluded
- Migration of any content type other than work sheets
- Deletion or modification of records in the legacy storage
- Rollback of already-migrated records
- Duplicate detection (if a work sheet already exists in the new storage, it is overwritten)
- User interface — script only
- Conversion of technician string to `TechnicianUser` object — preserved as-is
- Price recalculation — prices are calculated dynamically in the views, not stored
- Client signature image processing — base64 data preserved as-is

---

## 3. Constraints

- The script must be executable as a standalone Node.js script (no server required)
- The script must use the Cloudflare API to read from the legacy KV namespace
- The script must use the Cloudflare API to write to the new R2 storage
- The script must iterate year-based prefixes (`folhas-obra-2024-`, `folhas-obra-2025-`, `folhas-obra-2026-`) to discover all records
- The script must not stop on individual record errors — it must process all records
- Output files (`migration-success.json`, `migration-errors.json`) must be written to `scripts/work-sheets/` in the project directory
- The operator must provide a Cloudflare API token with read access to KV and read/write access to R2
- Client resolution requires reading the existing clients index from R2 to build a lookup map by `commercialName`
- The technician field must be preserved as a plain string for backward compatibility

---

## 4. Requirements (EARS format)

### REQ-01 — List all legacy work sheets
**WHEN** the operator runs the migration script, **the system SHALL** retrieve all work sheet keys from the legacy KV namespace by iterating year-based prefixes `folhas-obra-{year}-` for years 2024 through the current year.

**Acceptance criteria:**
- CA-01.1: Given the legacy KV namespace contains N work sheet records across multiple years, when the script runs, then all N keys across all year prefixes are retrieved before any transformation begins.
- CA-01.2: Given a year prefix returns no keys, when the script processes that year, then it moves to the next year without error.
- CA-01.3: Given no year prefix returns any keys, when the script completes, then it finishes with zero successes and zero errors.

---

### REQ-02 — Read each legacy work sheet record
**WHEN** a work sheet key is retrieved, **the system SHALL** read the full value of that key from the legacy KV namespace.

**Acceptance criteria:**
- CA-02.1: Given a valid work sheet key, when the system reads it, then the full JSON object is returned.
- CA-02.2: Given a work sheet key whose value cannot be read or parsed as JSON, when the system attempts to read it, then the record is added to the errors list with a descriptive reason and processing continues with the next record.

---

### REQ-03 — Build client lookup map
**WHEN** the migration script starts, **the system SHALL** read the clients index from R2 (`indexes/clients-index.json`) and build a lookup map keyed by `commercialName` (case-insensitive) to resolve `clientId` for each work sheet.

**Acceptance criteria:**
- CA-03.1: Given the clients index contains M clients, when the lookup map is built, then each client's `commercialName` maps to its `uuid`.
- CA-03.2: Given the clients index cannot be read, when the script starts, then the script exits immediately with a clear error message.
- CA-03.3: Given two clients share the same `commercialName` (case-insensitive), when the lookup map is built, then the last one wins and a warning is logged.

---

### REQ-04 — Resolve clientId for each work sheet
**WHEN** a legacy work sheet record is successfully read, **the system SHALL** resolve the `clientId` by looking up `client.commercialName` in the client lookup map.

**Acceptance criteria:**
- CA-04.1: Given a legacy record with `client.commercialName` matching a client in the lookup map, when the resolution runs, then `clientId` is set to the matched client's `uuid`.
- CA-04.2: Given a legacy record with `client.commercialName` not found in the lookup map, when the resolution runs, then the record is added to the errors list with reason "client not found: {commercialName}" and processing continues.

---

### REQ-05 — Transform legacy record to new schema
**WHEN** a legacy work sheet record has a resolved `clientId`, **the system SHALL** transform it to the new work sheet schema by mapping fields into the `request`, `displacement`, and `otherData` sections, dropping legacy price fields, and preserving the technician as a plain string.

**Acceptance criteria:**
- CA-05.1: Given a legacy record with `id`, when transformed, then the new record uses the same value as `uuid`.
- CA-05.2: Given a legacy record with `createdAt` and `updatedAt`, when transformed, then the new record preserves those timestamps.
- CA-05.3: Given a legacy record with `request` sub-object, when transformed, then all request fields (`date`, `receivedBy`, `assistanceDate`, `reason`, `arrivalTime`, `departureTime`, `totalHours`) are mapped to `data.request`.
- CA-05.4: Given a legacy record with `displacement` sub-object, when transformed, then only the core fields (`hasDisplacement`, `weekendHoliday`, `oneWayKms`, `totalKms`, `paymentMethod`) are mapped to `data.displacement`. Legacy price fields are dropped.
- CA-05.5: Given a legacy record with `otherData` sub-object, when transformed, then all fields are mapped to `data.otherData`, with `technician` preserved as a plain string.
- CA-05.6: Given a legacy record with `otherData.serviceType` having a value not in the new schema enum (e.g., "ASSISTÊNCIA REMOTA"), when transformed, then the value is preserved as-is.
- CA-05.7: Given a legacy record with `otherData.clientSignature` containing base64 data, when transformed, then the signature is preserved as-is in `data.otherData.clientSignature`.
- CA-05.8: Given any legacy record, when transformed, the new record SHALL include: `contentType: 'work-sheets'`, `version: 1`, `isDeleted: false`, `createdBy: 'migration'`, `updatedBy: 'migration'`.

---

### REQ-06 — Write transformed record to new storage
**WHEN** a legacy work sheet record is successfully transformed, **the system SHALL** write the new record to the new storage system under the key `content/work-sheets/{uuid}.json`.

**Acceptance criteria:**
- CA-06.1: Given a successfully transformed record, when written to new storage, then the record is stored at `content/work-sheets/{uuid}.json`.
- CA-06.2: Given a write operation that fails, when the error is caught, then the record is added to the errors list with the error reason and processing continues with the next record.

---

### REQ-07 — Update the work-sheets search index
**WHEN** all individual work sheet records have been processed, **the system SHALL** update the work-sheets search index at `indexes/work-sheets-index.json` to include all successfully migrated work sheets.

**Acceptance criteria:**
- CA-07.1: Given N work sheets were successfully migrated, when the index is updated, then `indexes/work-sheets-index.json` contains exactly those N work sheets (plus any pre-existing non-deleted work sheets already in the index).
- CA-07.2: Given the index update fails, when the error is caught, then the operator is notified with a clear error message and the success/error output files are still written.

---

### REQ-08 — Produce success output file
**WHEN** the migration script completes, **the system SHALL** write a `scripts/work-sheets/migration-success.json` file listing all successfully migrated work sheets.

**Acceptance criteria:**
- CA-08.1: Given M work sheets were successfully migrated, when the script completes, then `scripts/work-sheets/migration-success.json` contains an array of M objects each with at minimum `uuid`, `clientId`, `clientName`, `assistanceDate`, and `technician`.
- CA-08.2: Given zero work sheets were successfully migrated, when the script completes, then `scripts/work-sheets/migration-success.json` contains an empty array.

---

### REQ-09 — Produce error output file
**WHEN** the migration script completes, **the system SHALL** write a `scripts/work-sheets/migration-errors.json` file listing all records that failed to migrate.

**Acceptance criteria:**
- CA-09.1: Given E records failed during migration, when the script completes, then `scripts/work-sheets/migration-errors.json` contains an array of E objects each with at minimum the original `id` (or key), and a `reason` string describing the failure.
- CA-09.2: Given zero records failed, when the script completes, then `scripts/work-sheets/migration-errors.json` contains an empty array.

---

### REQ-10 — Report migration summary to operator
**WHEN** the migration script completes, **the system SHALL** print a summary to the console showing the total number of records processed, the number of successes, the number of errors, and the number of years scanned.

**Acceptance criteria:**
- CA-10.1: Given the script completes, when the summary is printed, then it includes: total records found, total successes, total errors, years scanned, and the paths of the two output files.

---

## 5. Field Mapping — Legacy KV to New Schema

### BaseContent wrapper fields

| Legacy field | New field | Notes |
|---|---|---|
| `id` | `uuid` (BaseContent) | Moved to wrapper level |
| `createdAt` | `createdAt` (BaseContent) | Preserved from legacy |
| `updatedAt` | `updatedAt` (BaseContent) | Preserved from legacy |
| _(absent)_ | `contentType` | Set to `'work-sheets'` |
| _(absent)_ | `version` | Set to `1` |
| _(absent)_ | `isDeleted` | Set to `false` |
| _(absent)_ | `createdBy` | Set to `'migration'` |
| _(absent)_ | `updatedBy` | Set to `'migration'` |

### Client relationship

| Legacy field | New field | Notes |
|---|---|---|
| `client.commercialName` | `data.clientId` | Resolved via client lookup map (commercialName → uuid) |
| `clientName` | _(dropped)_ | Resolved through relations at display time |
| `client.socialName` | _(dropped)_ | Resolved through relations at display time |
| `client.taxNumber` | _(dropped)_ | Resolved through relations at display time |
| `client.address` | _(dropped)_ | Resolved through relations at display time |
| `client.location` | _(dropped)_ | Resolved through relations at display time |
| `date` | _(dropped)_ | Redundant with `request.assistanceDate` |
| `number` | _(dropped)_ | Legacy sequential number — not used in new schema |

### Request data

| Legacy field | New field | Notes |
|---|---|---|
| `request.date` | `data.request.date` | Direct mapping (ISO date string) |
| `request.receivedBy` | `data.request.receivedBy` | Direct mapping |
| `request.assistanceDate` | `data.request.assistanceDate` | Direct mapping (ISO date string) |
| `request.reason` | `data.request.reason` | Direct mapping |
| `request.arrivalTime` | `data.request.arrivalTime` | Direct mapping (HH:MM format) |
| `request.departureTime` | `data.request.departureTime` | Direct mapping (HH:MM format) |
| `request.totalHours` | `data.request.totalHours` | Direct mapping (HH:MM:SS format) |

### Displacement data

| Legacy field | New field | Notes |
|---|---|---|
| `displacement.hasDisplacement` | `data.displacement.hasDisplacement` | Direct mapping (boolean) |
| `displacement.weekendHoliday` | `data.displacement.weekendHoliday` | Direct mapping (boolean) |
| `displacement.oneWayKms` | `data.displacement.oneWayKms` | Direct mapping (number) |
| `displacement.totalKms` | `data.displacement.totalKms` | Direct mapping (number) |
| `displacement.paymentMethod` | `data.displacement.paymentMethod` | Direct mapping |
| `displacement.roundTripKm` | _(dropped)_ | Legacy price field — prices calculated dynamically |
| `displacement.totalCalculatedHours` | _(dropped)_ | Legacy price field |
| `displacement.displacementCost` | _(dropped)_ | Legacy price field |
| `displacement.laborCost` | _(dropped)_ | Legacy price field |
| `displacement.totalCostWithTax` | _(dropped)_ | Legacy price field |
| `displacement.clientContract` | _(dropped)_ | Legacy field — redundant with payment method |
| `displacement.totalToPay` | _(dropped)_ | Legacy price field |

### Other data

| Legacy field | New field | Notes |
|---|---|---|
| `otherData.serviceType` | `data.otherData.serviceType` | Direct mapping — values preserved as-is (may include legacy values like "ASSISTÊNCIA REMOTA") |
| `otherData.technician` | `data.otherData.technician` | Preserved as plain string (backward compatible) |
| `otherData.serviceObservations` | `data.otherData.serviceObservations` | Direct mapping |
| `otherData.warranty` | `data.otherData.warranty` | Direct mapping (boolean) |
| `otherData.contract` | `data.otherData.contract` | Direct mapping (boolean) |
| `otherData.contractYear` | `data.otherData.contractYear` | Direct mapping (string) |
| `otherData.materialUsed` | `data.otherData.materialUsed` | Direct mapping (boolean) |
| `otherData.materialDetails` | `data.otherData.materialDetails` | Direct mapping |
| `otherData.equipment` | `data.otherData.equipment` | Direct mapping (boolean) |
| `otherData.equipmentDetails` | `data.otherData.equipmentDetails` | Direct mapping |
| `otherData.totallyResolved` | `data.otherData.totallyResolved` | Direct mapping (boolean) |
| `otherData.resolutionIssues` | `data.otherData.resolutionIssues` | Direct mapping |
| `otherData.dumpReading` | `data.otherData.dumpReading` | Direct mapping (boolean) |
| `otherData.backup` | `data.otherData.backup` | Direct mapping (boolean) |
| `otherData.remoteAccessCheck` | `data.otherData.remoteAccessCheck` | Direct mapping (boolean) |
| `otherData.anydesk` | `data.otherData.anydesk` | Direct mapping (boolean) |
| `otherData.serviceReport` | `data.otherData.serviceReport` | Direct mapping |
| `otherData.clientSignature` | `data.otherData.clientSignature` | Direct mapping — base64 PNG preserved as-is |

---

## 6. Business Rules

| RB-ID | Condition | Action | Error |
|---|---|---|---|
| RB-01 | Legacy record missing `id` | Skip record, add to errors | "required field missing: id" |
| RB-02 | Legacy record value is not valid JSON | Skip record, add to errors | "invalid JSON: {parseError}" |
| RB-03 | Legacy record missing `client.commercialName` | Skip record, add to errors | "required field missing: client.commercialName" |
| RB-04 | `client.commercialName` not found in client lookup map | Skip record, add to errors | "client not found: {commercialName}" |
| RB-05 | Write to new storage fails | Skip record, add to errors | "write failed: {errorMessage}" |
| RB-06 | Legacy displacement price fields present (`roundTripKm`, `totalCalculatedHours`, etc.) | Drop these fields during transformation | — |
| RB-07 | `otherData.technician` is a string | Preserve as-is (backward compatible) | — |
| RB-08 | `otherData.serviceType` has a value not in the new schema enum | Preserve as-is | — |
| RB-09 | `otherData.clientSignature` is empty string | Preserve as empty string | — |
| RB-10 | Optional string fields absent in legacy record | Default to empty string `''` | — |
| RB-11 | Optional boolean fields absent in legacy record | Default to `false` | — |
| RB-12 | Optional numeric fields absent in legacy record | Default to `0` | — |
| RB-13 | Index update fails after all records processed | Log error to console, still write output files | "index update failed: {errorMessage}" |
| RB-14 | `request` sub-object absent in legacy record | Skip record, add to errors | "required field missing: request" |
| RB-15 | `displacement` sub-object absent in legacy record | Use defaults: `hasDisplacement: false`, `weekendHoliday: false`, `oneWayKms: 0`, `totalKms: 0`, `paymentMethod: 'PENDENTE'` | — |

---

## 7. Error Scenarios

| Trigger | Behavior | Result |
|---|---|---|
| Cloudflare API token missing or invalid | Script exits immediately with clear error message | No output files written |
| KV namespace not found or inaccessible | Script exits immediately with clear error message | No output files written |
| R2 bucket not found or inaccessible | Script exits immediately with clear error message | No output files written |
| Clients index not found or unreadable in R2 | Script exits immediately with clear error message | No output files written |
| Individual record read fails | Record added to errors list, script continues | Record appears in `scripts/work-sheets/migration-errors.json` |
| Individual record JSON parse fails | Record added to errors list, script continues | Record appears in `scripts/work-sheets/migration-errors.json` |
| Individual record missing required fields (`id`, `client.commercialName`) | Record added to errors list, script continues | Record appears in `scripts/work-sheets/migration-errors.json` |
| Client not found in lookup map | Record added to errors list, script continues | Record appears in `scripts/work-sheets/migration-errors.json` |
| Individual record write fails | Record added to errors list, script continues | Record appears in `scripts/work-sheets/migration-errors.json` |
| Index update fails | Error logged to console, output files still written | Operator must re-run index update manually |
| Output file write fails | Error logged to console | Operator notified |

---

## 8. [MA] Mirror — Acceptance Criteria Table

| REQ-ID | CA-ID | Given | When | Then | Priority |
|---|---|---|---|---|---|
| REQ-01 | CA-01.1 | Legacy KV contains N work sheet records across years | Script runs | All N keys across all year prefixes are retrieved | High |
| REQ-01 | CA-01.2 | A year prefix returns no keys | Script processes that year | Moves to next year without error | Medium |
| REQ-01 | CA-01.3 | No year prefix returns any keys | Script completes | Script finishes with 0 successes, 0 errors | Medium |
| REQ-02 | CA-02.1 | Valid work sheet key exists | System reads it | Full JSON object is returned | High |
| REQ-02 | CA-02.2 | Work sheet key value is unreadable or invalid JSON | System attempts to read it | Record added to errors, processing continues | High |
| REQ-03 | CA-03.1 | Clients index contains M clients | Lookup map is built | Each commercialName maps to its uuid | High |
| REQ-03 | CA-03.2 | Clients index cannot be read | Script starts | Script exits immediately with clear error | High |
| REQ-03 | CA-03.3 | Two clients share same commercialName | Lookup map is built | Last one wins, warning logged | Low |
| REQ-04 | CA-04.1 | Legacy record commercialName matches a client | Resolution runs | clientId set to matched client uuid | High |
| REQ-04 | CA-04.2 | Legacy record commercialName not found | Resolution runs | Record added to errors with "client not found" | High |
| REQ-05 | CA-05.1 | Legacy record has `id` field | Transformation runs | New record `uuid` equals legacy `id` | High |
| REQ-05 | CA-05.2 | Legacy record has `createdAt` and `updatedAt` | Transformation runs | Timestamps preserved in new record | High |
| REQ-05 | CA-05.3 | Legacy record has `request` sub-object | Transformation runs | All request fields mapped to `data.request` | High |
| REQ-05 | CA-05.4 | Legacy record has `displacement` with price fields | Transformation runs | Core fields mapped, price fields dropped | High |
| REQ-05 | CA-05.5 | Legacy record has `otherData` with string technician | Transformation runs | Technician preserved as plain string | High |
| REQ-05 | CA-05.6 | Legacy record has non-enum serviceType | Transformation runs | Value preserved as-is | Medium |
| REQ-05 | CA-05.7 | Legacy record has base64 clientSignature | Transformation runs | Signature preserved as-is | Medium |
| REQ-05 | CA-05.8 | Any legacy record | Transformation runs | `contentType: 'work-sheets'`, `version: 1`, `isDeleted: false`, `createdBy: 'migration'`, `updatedBy: 'migration'` | High |
| REQ-06 | CA-06.1 | Successfully transformed record | Written to new storage | Stored at `content/work-sheets/{uuid}.json` | High |
| REQ-06 | CA-06.2 | Write operation fails | Error caught | Record added to errors, processing continues | High |
| REQ-07 | CA-07.1 | N work sheets successfully migrated | Index updated | `indexes/work-sheets-index.json` contains those N work sheets | High |
| REQ-07 | CA-07.2 | Index update fails | Error caught | Operator notified, output files still written | Medium |
| REQ-08 | CA-08.1 | M work sheets successfully migrated | Script completes | `scripts/work-sheets/migration-success.json` contains M objects with `uuid`, `clientId`, `clientName`, `assistanceDate`, `technician` | High |
| REQ-08 | CA-08.2 | Zero work sheets successfully migrated | Script completes | `scripts/work-sheets/migration-success.json` contains empty array | Medium |
| REQ-09 | CA-09.1 | E records failed | Script completes | `scripts/work-sheets/migration-errors.json` contains E objects with `id`/key and `reason` | High |
| REQ-09 | CA-09.2 | Zero records failed | Script completes | `scripts/work-sheets/migration-errors.json` contains empty array | Medium |
| REQ-10 | CA-10.1 | Script completes | Summary printed | Console shows total processed, successes, errors, years scanned, output file paths | Medium |

---

## 9. Glossary

| Term | Definition |
|---|---|
| Legacy storage | The old KV namespace (`clever-clever-kv`) on Cloudflare account `98dfed939a59dca09770880eab939b79` |
| New storage | The R2 bucket used by the current CLEVER dashboard |
| Legacy schema | The semi-structured JSON format used in the old KV with `client`, `request`, `displacement`, `otherData` sub-objects and legacy price fields |
| New schema | The `BaseContent` wrapper structure with `WorkSheetData` containing typed `request`, `displacement`, and `otherData` sections |
| Migration script | A standalone Node.js script run manually by the operator |
| Operator | The administrator who runs the migration script |
| Success record | A work sheet that was read, client resolved, transformed, and written without errors |
| Error record | A work sheet that failed at any stage (read, parse, client resolution, transform, write) |
| Client lookup map | An in-memory map built from the R2 clients index, keyed by `commercialName` (case-insensitive), mapping to client `uuid` |
| Year-based prefix | The KV key pattern `folhas-obra-{year}-` used to organize work sheets by year in the legacy storage |
| Legacy price fields | Fields in the `displacement` sub-object (`roundTripKm`, `totalCalculatedHours`, `displacementCost`, `laborCost`, `totalCostWithTax`, `clientContract`, `totalToPay`) that are dropped during migration because prices are calculated dynamically |
| Backward compatible technician | The technician field preserved as a plain string instead of being converted to a `TechnicianUser` object |
