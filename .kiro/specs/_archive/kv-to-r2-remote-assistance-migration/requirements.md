# Requirements — KV to R2 Remote Assistance Migration

## 1. Context and Actors

**Actors:**
- **Operator**: administrator who runs the migration script manually

**Trigger:** The company has a legacy storage system containing remote assistance records ("Assistências Remotas") that need to be transferred to the new storage system with an updated data schema.

**Nominal result:** All remote assistance records from years 2024 to the current year are read from the legacy storage, transformed to the new schema, and written to the new storage. A JSON file listing all successful migrations and a JSON file listing all errors are produced.

**Error result:** Any record that fails to migrate is recorded in a separate JSON file with the reason for failure. The script continues processing remaining records.

---

## 2. Scope

### Included
- Reading all remote assistance records from the legacy storage (account `98dfed939a59dca09770880eab939b79`, namespace `clever-clever-kv`)
- Filtering records by prefix `assistencias-remotas-` for years 2024 to the current year
- Transforming each record from the legacy flat schema to the new `RemoteAssistanceData` schema wrapped in `BaseContent`
- Deriving the `paymentMethod` field from legacy boolean flags (`contrato`, `garantia`)
- Converting the `tecnicoResponsavel` string into a migration-specific fallback object
- Resolving `cliente` (display name) to a `clientId` by looking up the clients index in the new storage
- Writing each transformed record to the new storage system
- Updating the remote assistance search index after all records are written
- Producing a `migration-success.json` file listing all successfully migrated records
- Producing a `migration-errors.json` file listing all failed records with error details

### Excluded
- Migration of any content type other than remote assistance
- Deletion or modification of records in the legacy storage
- Rollback of already-migrated records
- Duplicate detection (if a record already exists in the new storage, it is overwritten)
- User interface — script only
- Value recalculation — `valorAssist` and `totalComIva` are preserved as-is from legacy data
- Client record creation — if a client name cannot be matched, the record is added to errors

---

## 3. Constraints

- The script must be executable as a standalone Node.js script (no server required)
- The script must use the Cloudflare API to read from the legacy KV namespace
- The script must use the Cloudflare API to write to the new R2 storage
- The script must not stop on individual record errors — it must process all records
- Output files (`migration-success.json`, `migration-errors.json`) must be written to the local filesystem where the script is run
- The operator must provide a Cloudflare API token with read access to KV and write access to R2
- The script must read the existing clients index from R2 to resolve client names to `clientId` values
- The script must filter KV keys by year (2024 to current year) to avoid migrating irrelevant records

---

## 4. Requirements (EARS format)

### REQ-01 — List all legacy remote assistance records
**WHEN** the operator runs the migration script, **the system SHALL** retrieve all remote assistance keys from the legacy KV namespace using the prefix `assistencias-remotas-` filtered to years 2024 through the current year.

**Acceptance criteria:**
- CA-01.1: Given the legacy KV namespace contains N remote assistance records for years 2024 to current, when the script runs, then all N keys with the matching prefix and year range are retrieved before any transformation begins.
- CA-01.2: Given the legacy KV namespace contains no keys matching the prefix and year range, when the script runs, then the script completes with zero successes and zero errors.

---

### REQ-02 — Read each legacy remote assistance record
**WHEN** a remote assistance key is retrieved, **the system SHALL** read the full value of that key from the legacy KV namespace.

**Acceptance criteria:**
- CA-02.1: Given a valid remote assistance key, when the system reads it, then the full JSON object is returned.
- CA-02.2: Given a remote assistance key whose value cannot be read or parsed as JSON, when the system attempts to read it, then the record is added to the errors list with a descriptive reason and processing continues with the next record.

---

### REQ-03 — Resolve client name to client identifier
**WHEN** a legacy remote assistance record is successfully read, **the system SHALL** look up the `cliente` field value against the existing clients index in the new storage to obtain the corresponding `clientId`.

**Acceptance criteria:**
- CA-03.1: Given a legacy record with `cliente` matching exactly one client's `nomeComercial` or `nomeEmpresa` in the clients index, when the lookup runs, then the matching client's `uuid` is used as `clientId`.
- CA-03.2: Given a legacy record with `cliente` matching no client in the clients index, when the lookup runs, then the record is added to the errors list with reason "client not found: {clienteName}" and processing continues.
- CA-03.3: Given a legacy record with `cliente` matching multiple clients in the clients index, when the lookup runs, then the first match is used and a warning is logged to the console.

---

### REQ-04 — Transform legacy record to new schema
**WHEN** a legacy remote assistance record is successfully read and the client is resolved, **the system SHALL** transform it to the new remote assistance schema by mapping all compatible fields, deriving computed fields, and applying default values for required fields absent in the legacy record.

**Acceptance criteria:**
- CA-04.1: Given a legacy record with `id`, when transformed, then the new record uses the same value as `uuid`.
- CA-04.2: Given a legacy record with `createdAt` and `updatedAt`, when transformed, then the new record preserves those timestamps.
- CA-04.3: Given a legacy record with `contrato: true`, when transformed, then `paymentMethod` is set to `'Contrato'`.
- CA-04.4: Given a legacy record with `garantia: true`, when transformed, then `paymentMethod` is set to `'Garantia'`.
- CA-04.5: Given a legacy record with both `contrato: false` and `garantia: false`, when transformed, then `paymentMethod` is set to `'Faturação'`.
- CA-04.6: Given a legacy record with `tecnicoResponsavel` as a string, when transformed, then the field is converted to a migration-specific object with `userId: 'migration'`, `firstName` and `lastName` derived from the string, and `userType: 'Admin'`.
- CA-04.7: Given a legacy record with `valorAssist` and `totalComIva`, when transformed, then both values are preserved as-is (no recalculation).
- CA-04.8: Given any legacy record, when transformed, the new record SHALL include: `contentType: 'remote-assistance'`, `version: 1`, `isDeleted: false`, `createdBy: 'migration'`, `updatedBy: 'migration'`.
- CA-04.9: Given a legacy record with `tipoAssistencia`, when transformed, then the value is preserved if it matches one of `'REMOTA'`, `'TELEFÓNICA'`, `'TELEMÓVEL'`; otherwise it defaults to `''`.

---

### REQ-05 — Write transformed record to new storage
**WHEN** a legacy remote assistance record is successfully transformed, **the system SHALL** write the new record to the new storage system under the key `content/remote-assistance/{uuid}.json`.

**Acceptance criteria:**
- CA-05.1: Given a successfully transformed record, when written to new storage, then the record is stored at `content/remote-assistance/{uuid}.json`.
- CA-05.2: Given a write operation that fails, when the error is caught, then the record is added to the errors list with the error reason and processing continues with the next record.

---

### REQ-06 — Update the remote assistance search index
**WHEN** all individual remote assistance records have been processed, **the system SHALL** update the remote assistance search index at `indexes/remote-assistance-index.json` to include all successfully migrated records.

**Acceptance criteria:**
- CA-06.1: Given N records were successfully migrated, when the index is updated, then `indexes/remote-assistance-index.json` contains those N records (plus any pre-existing non-deleted records already in the index).
- CA-06.2: Given the index update fails, when the error is caught, then the operator is notified with a clear error message and the success/error output files are still written.

---

### REQ-07 — Produce success output file
**WHEN** the migration script completes, **the system SHALL** write a `migration-success.json` file to the local filesystem listing all successfully migrated records.

**Acceptance criteria:**
- CA-07.1: Given M records were successfully migrated, when the script completes, then `migration-success.json` contains an array of M objects each with at minimum `uuid`, `cliente` (original name), `tipoAssistencia`, and `dataAssistencia`.
- CA-07.2: Given zero records were successfully migrated, when the script completes, then `migration-success.json` contains an empty array.

---

### REQ-08 — Produce error output file
**WHEN** the migration script completes, **the system SHALL** write a `migration-errors.json` file to the local filesystem listing all records that failed to migrate.

**Acceptance criteria:**
- CA-08.1: Given E records failed during migration, when the script completes, then `migration-errors.json` contains an array of E objects each with at minimum the original `id` (or key), `cliente` (if available), and a `reason` string describing the failure.
- CA-08.2: Given zero records failed, when the script completes, then `migration-errors.json` contains an empty array.

---

### REQ-09 — Report migration summary to operator
**WHEN** the migration script completes, **the system SHALL** print a summary to the console showing the total number of records processed, the number of successes, and the number of errors.

**Acceptance criteria:**
- CA-09.1: Given the script completes, when the summary is printed, then it includes: total records found, total successes, total errors, and the paths of the two output files.

---

## 5. Field Mapping — Legacy KV to New Schema

| Legacy field | New field | Notes |
|---|---|---|
| `id` | `uuid` (BaseContent) | Moved to wrapper level |
| `cliente` | `data.clientId` | Resolved via clients index lookup (name → uuid) |
| `cliente` | `data.clienteName` | Preserved as-is for display fallback |
| `tipoAssistencia` | `data.tipoAssistencia` | Validated against `'REMOTA'` / `'TELEFÓNICA'` / `'TELEMÓVEL'`; defaults to `''` |
| `tecnicoResponsavel` | `data.tecnicoResponsavel` | String → `TechnicianUser` object: `{ userId: 'migration', firstName, lastName, userType: 'Admin' }` |
| `quemAtendeu` | _(dropped)_ | Not present in new schema |
| `dataPedido` | `data.dataPedido` | Direct mapping — ISO date string |
| `dataAssistencia` | `data.dataAssistencia` | Direct mapping — ISO date string |
| `inicioAssistencia` | `data.inicioAssistencia` | Direct mapping — ISO date string |
| `fimAssistencia` | `data.fimAssistencia` | Direct mapping — ISO date string |
| `motivoPedido` | `data.motivoPedido` | Direct mapping |
| `relatorioAssistencia` | `data.relatorioAssistencia` | Direct mapping |
| `valorAssist` | `data.valorAssist` | Direct mapping — preserved as-is |
| `contratoValor` | _(dropped)_ | Not present in new schema |
| `contrato` + `garantia` | `data.paymentMethod` | Derived: `contrato: true` → `'Contrato'`, `garantia: true` → `'Garantia'`, both false → `'Faturação'` |
| `resolvido` | `data.resolvido` | Direct mapping — boolean |
| `relatorio` | `data.relatorio` | Direct mapping — optional string |
| `anexos` | `data.anexos` | Direct mapping — string |
| `totalComIva` | _(dropped)_ | Not present in new schema; `valorAssist` is the stored value |
| `pertenceAnoContrato` | _(dropped)_ | Not present in new schema |
| `createdAt` | `createdAt` (BaseContent) | Preserved from legacy |
| `updatedAt` | `updatedAt` (BaseContent) | Preserved from legacy |
| _(absent)_ | `contentType` | Set to `'remote-assistance'` |
| _(absent)_ | `version` | Set to `1` |
| _(absent)_ | `isDeleted` | Set to `false` |
| _(absent)_ | `createdBy` | Set to `'migration'` |
| _(absent)_ | `updatedBy` | Set to `'migration'` |
| _(absent)_ | `data.horasTotais` | Not calculated during migration — left undefined |
| _(absent)_ | `data.contractId` | Only set if `paymentMethod` is `'Contrato'` — left undefined for migration (no contract resolution) |

---

## 6. Business Rules

| RB-ID | Condition | Action | Error |
|---|---|---|---|
| RB-01 | Legacy record value is not valid JSON | Skip record, add to errors | "invalid JSON: {parseError}" |
| RB-02 | Legacy record missing `cliente` field | Skip record, add to errors | "required field missing: cliente" |
| RB-03 | `cliente` value does not match any client in the clients index | Skip record, add to errors | "client not found: {clienteName}" |
| RB-04 | `cliente` matches multiple clients in the index | Use first match, log warning to console | — |
| RB-05 | `contrato` is `true` | Set `paymentMethod` to `'Contrato'` | — |
| RB-06 | `garantia` is `true` (and `contrato` is `false`) | Set `paymentMethod` to `'Garantia'` | — |
| RB-07 | Both `contrato` and `garantia` are `false` or absent | Set `paymentMethod` to `'Faturação'` | — |
| RB-08 | `tecnicoResponsavel` is a string with spaces (e.g. "João Bernardino") | Split into `firstName` (first word) and `lastName` (remaining words) for TechnicianUser object | — |
| RB-09 | `tecnicoResponsavel` is a single word or empty | Use the word as `firstName`, set `lastName` to `''` | — |
| RB-10 | `tipoAssistencia` is not one of `'REMOTA'`, `'TELEFÓNICA'`, `'TELEMÓVEL'` | Default to `''` | — |
| RB-11 | `resolvido` field is absent | Default to `false` | — |
| RB-12 | `valorAssist` field is absent | Default to `0` | — |
| RB-13 | Write to new storage fails | Skip record, add to errors | "write failed: {errorMessage}" |
| RB-14 | Index update fails after all records processed | Log error to console, still write output files | "index update failed: {errorMessage}" |

---

## 7. Error Scenarios

| Trigger | Behavior | Result |
|---|---|---|
| Cloudflare API token missing or invalid | Script exits immediately with clear error message | No output files written |
| KV namespace not found or inaccessible | Script exits immediately with clear error message | No output files written |
| R2 bucket not found or inaccessible | Script exits immediately with clear error message | No output files written |
| Clients index not found in R2 | Script exits immediately — cannot resolve client names | No output files written |
| Individual record read fails | Record added to errors list, script continues | Record appears in `migration-errors.json` |
| Individual record JSON parse fails | Record added to errors list, script continues | Record appears in `migration-errors.json` |
| Client name not found in clients index | Record added to errors list, script continues | Record appears in `migration-errors.json` |
| Individual record write fails | Record added to errors list, script continues | Record appears in `migration-errors.json` |
| Index update fails | Error logged to console, output files still written | Operator must re-run index update manually |
| Output file write fails | Error logged to console | Operator notified |

---

## 8. [MA] Mirror — Acceptance Criteria Table

| REQ-ID | CA-ID | Given | When | Then | Priority |
|---|---|---|---|---|---|
| REQ-01 | CA-01.1 | Legacy KV contains N remote assistance records for years 2024–current | Script runs | All N keys with prefix `assistencias-remotas-` and matching year range are retrieved | High |
| REQ-01 | CA-01.2 | Legacy KV has no matching keys | Script runs | Script completes with 0 successes, 0 errors | Medium |
| REQ-02 | CA-02.1 | Valid remote assistance key exists | System reads it | Full JSON object is returned | High |
| REQ-02 | CA-02.2 | Key value is unreadable or invalid JSON | System attempts to read it | Record added to errors, processing continues | High |
| REQ-03 | CA-03.1 | Legacy record `cliente` matches one client in index | Lookup runs | Matching client's `uuid` used as `clientId` | High |
| REQ-03 | CA-03.2 | Legacy record `cliente` matches no client in index | Lookup runs | Record added to errors with "client not found" | High |
| REQ-03 | CA-03.3 | Legacy record `cliente` matches multiple clients | Lookup runs | First match used, warning logged | Medium |
| REQ-04 | CA-04.1 | Legacy record has `id` field | Transformation runs | New record `uuid` equals legacy `id` | High |
| REQ-04 | CA-04.2 | Legacy record has `createdAt` and `updatedAt` | Transformation runs | Timestamps preserved in new record | High |
| REQ-04 | CA-04.3 | Legacy record has `contrato: true` | Transformation runs | `paymentMethod` set to `'Contrato'` | High |
| REQ-04 | CA-04.4 | Legacy record has `garantia: true` | Transformation runs | `paymentMethod` set to `'Garantia'` | High |
| REQ-04 | CA-04.5 | Legacy record has `contrato: false` and `garantia: false` | Transformation runs | `paymentMethod` set to `'Faturação'` | High |
| REQ-04 | CA-04.6 | Legacy record has `tecnicoResponsavel` as string | Transformation runs | Field converted to TechnicianUser object with `userId: 'migration'` | High |
| REQ-04 | CA-04.7 | Legacy record has `valorAssist` and `totalComIva` | Transformation runs | `valorAssist` preserved as-is | Medium |
| REQ-04 | CA-04.8 | Any legacy record | Transformation runs | New record has `contentType: 'remote-assistance'`, `version: 1`, `isDeleted: false`, `createdBy: 'migration'`, `updatedBy: 'migration'` | High |
| REQ-04 | CA-04.9 | Legacy record has `tipoAssistencia` with invalid value | Transformation runs | Value defaults to `''` | Medium |
| REQ-05 | CA-05.1 | Successfully transformed record | Written to new storage | Stored at `content/remote-assistance/{uuid}.json` | High |
| REQ-05 | CA-05.2 | Write operation fails | Error caught | Record added to errors, processing continues | High |
| REQ-06 | CA-06.1 | N records successfully migrated | Index updated | `indexes/remote-assistance-index.json` contains those N records | High |
| REQ-06 | CA-06.2 | Index update fails | Error caught | Operator notified, output files still written | Medium |
| REQ-07 | CA-07.1 | M records successfully migrated | Script completes | `migration-success.json` contains M objects with `uuid`, `cliente`, `tipoAssistencia`, `dataAssistencia` | High |
| REQ-07 | CA-07.2 | Zero records successfully migrated | Script completes | `migration-success.json` contains empty array | Medium |
| REQ-08 | CA-08.1 | E records failed | Script completes | `migration-errors.json` contains E objects with `id`/key, `cliente`, and `reason` | High |
| REQ-08 | CA-08.2 | Zero records failed | Script completes | `migration-errors.json` contains empty array | Medium |
| REQ-09 | CA-09.1 | Script completes | Summary printed | Console shows total processed, successes, errors, output file paths | Medium |

---

## 9. Glossary

| Term | Definition |
|---|---|
| Legacy storage | The old KV namespace (`clever-clever-kv`) on Cloudflare account `98dfed939a59dca09770880eab939b79` |
| New storage | The R2 bucket used by the current CLEVER dashboard |
| Legacy schema | The flat JSON structure used in the old KV (fields like `cliente`, `tecnicoResponsavel`, `contrato`, etc. at root level) |
| New schema | The `BaseContent` wrapper structure with `uuid`, `contentType`, `data` (containing `RemoteAssistanceData`), and audit fields |
| Migration script | A standalone Node.js script run manually by the operator |
| Operator | The administrator who runs the migration script |
| Success record | A remote assistance record that was read, transformed, and written without errors |
| Error record | A remote assistance record that failed at any stage (read, parse, client resolution, transform, write) |
| Clients index | The `indexes/clients-index.json` file in R2 containing all migrated client records, used to resolve `cliente` names to `clientId` values |
| TechnicianUser | The structured object format for technician data (`userId`, `firstName`, `lastName`, `userType`) used in the new schema |
| Payment method | Derived field in the new schema (`'Contrato'`, `'Faturação'`, `'Garantia'`) replacing the legacy boolean flags `contrato` and `garantia` |

