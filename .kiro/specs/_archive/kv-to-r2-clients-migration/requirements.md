# Requirements — KV to R2 Clients Migration

## 1. Context and Actors

**Actors:**
- **Operator**: administrator who runs the migration script manually

**Trigger:** The company has a legacy storage system containing client records that need to be transferred to the new storage system with an updated data schema.

**Nominal result:** All client records are read from the legacy storage, transformed to the new schema, and written to the new storage. A JSON file listing all successful migrations is produced.

**Error result:** Any client that fails to migrate is recorded in a separate JSON file with the reason for failure. The script continues processing remaining clients.

---

## 2. Scope

### Included
- Reading all client records from the legacy storage (account `98dfed939a59dca09770880eab939b79`, namespace `clever-clever-kv`)
- Transforming each record from the legacy schema to the new schema
- Writing each transformed record to the new storage system
- Updating the client search index after all records are written
- Producing a `migration-success.json` file listing all successfully migrated clients
- Producing a `migration-errors.json` file listing all failed clients with error details

### Excluded
- Migration of any content type other than clients (contracts, licenses, work sheets, etc.)
- Deletion or modification of records in the legacy storage
- Rollback of already-migrated records
- Duplicate detection (if a client already exists in the new storage, it is treated as a new record)
- User interface — script only

---

## 3. Constraints

- The script must be executable as a standalone Node.js script (no server required)
- The script must use the Cloudflare API to read from the legacy KV namespace
- The script must use the Cloudflare API to write to the new R2 storage
- The script must not stop on individual record errors — it must process all records
- Output files (`migration-success.json`, `migration-errors.json`) must be written to the local filesystem where the script is run
- The operator must provide a Cloudflare API token with read access to KV and write access to R2

---

## 4. Requirements (EARS format)

### REQ-01 — List all legacy clients
**WHEN** the operator runs the migration script, **the system SHALL** retrieve all client keys from the legacy KV namespace using the prefix `clientes-`.

**Acceptance criteria:**
- CA-01.1: Given the legacy KV namespace contains N client records, when the script runs, then all N keys with prefix `clientes-` are retrieved before any transformation begins.
- CA-01.2: Given the legacy KV namespace is empty or contains no keys with prefix `clientes-`, when the script runs, then the script completes with zero successes and zero errors.

---

### REQ-02 — Read each legacy client record
**WHEN** a client key is retrieved, **the system SHALL** read the full value of that key from the legacy KV namespace.

**Acceptance criteria:**
- CA-02.1: Given a valid client key, when the system reads it, then the full JSON object is returned.
- CA-02.2: Given a client key whose value cannot be read or parsed as JSON, when the system attempts to read it, then the record is added to the errors list with a descriptive reason and processing continues with the next record.

---

### REQ-03 — Transform legacy record to new schema
**WHEN** a legacy client record is successfully read, **the system SHALL** transform it to the new client schema by mapping all compatible fields and applying default values for required fields absent in the legacy record.

**Acceptance criteria:**
- CA-03.1: Given a legacy record with `id`, when transformed, then the new record uses the same value as `uuid`.
- CA-03.2: Given a legacy record with `createdAt` and `updatedAt`, when transformed, then the new record preserves those timestamps.
- CA-03.3: Given a legacy record with `nomeEmpresa` and `nomeComercial`, when transformed, then those fields are mapped directly to the new schema.
- CA-03.4: Given a legacy record with a `softwares` array, when transformed, then the array is preserved as-is in the new schema.
- CA-03.5: Given a legacy record missing `nomeEmpresa` or `nomeComercial`, when transformed, then the record is added to the errors list with reason "required field missing" and processing continues.
- CA-03.6: Given a legacy record with legacy boolean flags (`vectron`, `dreamSoft`, `ptcert`, `pix`, `zsrest`, `contasCertas`, `contrato`, `contratoCPA`, `contratoSoftware`), when transformed, then those flags are preserved in the new schema under the legacy fields section.
- CA-03.7: Given any legacy record, when transformed, the new record SHALL include: `contentType: 'clients'`, `version: 1`, `isDeleted: false`, `createdBy: 'migration'`, `updatedBy: 'migration'`.

---

### REQ-04 — Write transformed record to new storage
**WHEN** a legacy client record is successfully transformed, **the system SHALL** write the new record to the new storage system under the key `content/clients/{uuid}.json`.

**Acceptance criteria:**
- CA-04.1: Given a successfully transformed record, when written to new storage, then the record is stored at `content/clients/{uuid}.json`.
- CA-04.2: Given a write operation that fails, when the error is caught, then the record is added to the errors list with the error reason and processing continues with the next record.

---

### REQ-05 — Update the client search index
**WHEN** all individual client records have been processed, **the system SHALL** update the client search index at `indexes/clients-index.json` to include all successfully migrated clients.

**Acceptance criteria:**
- CA-05.1: Given N clients were successfully migrated, when the index is updated, then `indexes/clients-index.json` contains exactly those N clients (plus any pre-existing non-deleted clients already in the index).
- CA-05.2: Given the index update fails, when the error is caught, then the operator is notified with a clear error message and the success/error output files are still written.

---

### REQ-06 — Produce success output file
**WHEN** the migration script completes, **the system SHALL** write a `migration-success.json` file to the local filesystem listing all successfully migrated clients.

**Acceptance criteria:**
- CA-06.1: Given M clients were successfully migrated, when the script completes, then `migration-success.json` contains an array of M objects each with at minimum `uuid`, `nomeEmpresa`, and `nomeComercial`.
- CA-06.2: Given zero clients were successfully migrated, when the script completes, then `migration-success.json` contains an empty array.

---

### REQ-07 — Produce error output file
**WHEN** the migration script completes, **the system SHALL** write a `migration-errors.json` file to the local filesystem listing all records that failed to migrate.

**Acceptance criteria:**
- CA-07.1: Given E records failed during migration, when the script completes, then `migration-errors.json` contains an array of E objects each with at minimum the original `id` (or key), and a `reason` string describing the failure.
- CA-07.2: Given zero records failed, when the script completes, then `migration-errors.json` contains an empty array.

---

### REQ-08 — Report migration summary to operator
**WHEN** the migration script completes, **the system SHALL** print a summary to the console showing the total number of records processed, the number of successes, and the number of errors.

**Acceptance criteria:**
- CA-08.1: Given the script completes, when the summary is printed, then it includes: total records found, total successes, total errors, and the paths of the two output files.

---

## 5. Field Mapping — Legacy KV to New Schema

| Legacy field | New field (in `data`) | Notes |
|---|---|---|
| `id` | `uuid` (BaseContent) | Moved to wrapper level |
| `nomeEmpresa` | `data.nomeEmpresa` | Direct mapping — required |
| `nomeComercial` | `data.nomeComercial` | Direct mapping — required |
| `contribuinte` | `data.contribuinte` | Direct mapping |
| `morada` | `data.morada` | Direct mapping |
| `codigoPostal` | `data.codigoPostal` | Direct mapping |
| `localidade` | `data.localidade` | Direct mapping |
| `responsavel` | `data.responsavel` | Direct mapping |
| `telefone` | `data.telefone` | Direct mapping |
| `telefoneContato` | `data.telefoneContato` | Direct mapping |
| `email` | `data.email` | Direct mapping |
| `emailContato` | `data.emailContato` | Direct mapping |
| `iban` | `data.iban` | Direct mapping |
| `observacoes` | `data.observacoes` | Direct mapping |
| `softwares` | `data.softwares` | Direct mapping — array preserved |
| `temAnydesk` | `data.temAnydesk` | Direct mapping |
| `manutencao` | `data.manutencao` | Direct mapping |
| `manutencao24` | `data.manutencao24` | Direct mapping |
| `atcud` | `data.atcud` | Direct mapping |
| `dumps` | `data.dumps` | Direct mapping |
| `dumpsLink` | `data.dumpsLink` | Direct mapping |
| `seriesDocumentos` | `data.seriesDocumentos` | Direct mapping |
| `atUsername` | `data.atUsername` | Direct mapping |
| `atPassword` | `data.atPassword` | Direct mapping |
| `vectronConnect` | `data.vectronConnect` | Direct mapping |
| `vectronAddress` | `data.vectronAddress` | Direct mapping |
| `anydeskId` | `data.anydeskId` | Direct mapping (legacy field) |
| `anydeskCPA` | `data.anydeskCPA` | Direct mapping (legacy field) |
| `vectron` | `data.vectron` | Legacy boolean flag — preserved |
| `dreamSoft` | `data.dreamSoft` | Legacy boolean flag — preserved |
| `ptcert` | `data.ptcert` | Legacy boolean flag — preserved |
| `pix` | `data.pix` | Legacy boolean flag — preserved |
| `zsrest` | `data.zsrest` | Legacy boolean flag — preserved |
| `contasCertas` | `data.contasCertas` | Legacy boolean flag — preserved |
| `contrato` | `data.contrato` | Legacy boolean flag — preserved |
| `contratoCPA` | `data.contratoCPA` | Legacy boolean flag — preserved |
| `contratoSoftware` | `data.contratoSoftware` | Legacy boolean flag — preserved |
| `dataInicio` | `data.dataInicio` | Legacy field — preserved |
| `dataTermino` | `data.dataTermino` | Legacy field — preserved |
| `atClient` | `data.atClient` | Legacy field — preserved |
| `anosPesquisa` | `data.anosPesquisa` | Legacy field — preserved |
| `quantMant` | `data.quantMant` | Legacy field — preserved |
| `dataAniversario` | `data.dataAniversario` | Legacy field — preserved |
| `createdAt` | `createdAt` (BaseContent) | Preserved from legacy |
| `updatedAt` | `updatedAt` (BaseContent) | Preserved from legacy |
| _(absent)_ | `contentType` | Set to `'clients'` |
| _(absent)_ | `version` | Set to `1` |
| _(absent)_ | `isDeleted` | Set to `false` |
| _(absent)_ | `createdBy` | Set to `'migration'` |
| _(absent)_ | `updatedBy` | Set to `'migration'` |

---

## 6. Business Rules

| RB-ID | Condition | Action | Error |
|---|---|---|---|
| RB-01 | Legacy record missing `nomeEmpresa` or `nomeComercial` | Skip record, add to errors | "required field missing: {fieldName}" |
| RB-02 | Legacy record value is not valid JSON | Skip record, add to errors | "invalid JSON: {parseError}" |
| RB-03 | Write to new storage fails | Skip record, add to errors | "write failed: {errorMessage}" |
| RB-04 | `softwares` field is absent in legacy record | Default to empty array `[]` | — |
| RB-05 | Boolean service flags absent in legacy record | Default to `false` | — |
| RB-06 | Index update fails after all records processed | Log error to console, still write output files | "index update failed: {errorMessage}" |

---

## 7. Error Scenarios

| Trigger | Behavior | Result |
|---|---|---|
| Cloudflare API token missing or invalid | Script exits immediately with clear error message | No output files written |
| KV namespace not found or inaccessible | Script exits immediately with clear error message | No output files written |
| R2 bucket not found or inaccessible | Script exits immediately with clear error message | No output files written |
| Individual record read fails | Record added to errors list, script continues | Record appears in `migration-errors.json` |
| Individual record JSON parse fails | Record added to errors list, script continues | Record appears in `migration-errors.json` |
| Individual record write fails | Record added to errors list, script continues | Record appears in `migration-errors.json` |
| Index update fails | Error logged to console, output files still written | Operator must re-run index update manually |
| Output file write fails | Error logged to console | Operator notified |

---

## 8. [MA] Mirror — Acceptance Criteria Table

| REQ-ID | CA-ID | Given | When | Then | Priority |
|---|---|---|---|---|---|
| REQ-01 | CA-01.1 | Legacy KV contains N client records | Script runs | All N keys with prefix `clientes-` are retrieved | High |
| REQ-01 | CA-01.2 | Legacy KV has no `clientes-` keys | Script runs | Script completes with 0 successes, 0 errors | Medium |
| REQ-02 | CA-02.1 | Valid client key exists | System reads it | Full JSON object is returned | High |
| REQ-02 | CA-02.2 | Client key value is unreadable or invalid JSON | System attempts to read it | Record added to errors, processing continues | High |
| REQ-03 | CA-03.1 | Legacy record has `id` field | Transformation runs | New record `uuid` equals legacy `id` | High |
| REQ-03 | CA-03.2 | Legacy record has `createdAt` and `updatedAt` | Transformation runs | Timestamps preserved in new record | High |
| REQ-03 | CA-03.3 | Legacy record has `nomeEmpresa` and `nomeComercial` | Transformation runs | Fields mapped directly to new schema | High |
| REQ-03 | CA-03.4 | Legacy record has `softwares` array | Transformation runs | Array preserved as-is | Medium |
| REQ-03 | CA-03.5 | Legacy record missing `nomeEmpresa` or `nomeComercial` | Transformation runs | Record added to errors with "required field missing" | High |
| REQ-03 | CA-03.6 | Legacy record has legacy boolean flags | Transformation runs | Flags preserved in new schema | Medium |
| REQ-03 | CA-03.7 | Any legacy record | Transformation runs | New record has `contentType: 'clients'`, `version: 1`, `isDeleted: false`, `createdBy: 'migration'`, `updatedBy: 'migration'` | High |
| REQ-04 | CA-04.1 | Successfully transformed record | Written to new storage | Stored at `content/clients/{uuid}.json` | High |
| REQ-04 | CA-04.2 | Write operation fails | Error caught | Record added to errors, processing continues | High |
| REQ-05 | CA-05.1 | N clients successfully migrated | Index updated | `indexes/clients-index.json` contains those N clients | High |
| REQ-05 | CA-05.2 | Index update fails | Error caught | Operator notified, output files still written | Medium |
| REQ-06 | CA-06.1 | M clients successfully migrated | Script completes | `migration-success.json` contains M objects with `uuid`, `nomeEmpresa`, `nomeComercial` | High |
| REQ-06 | CA-06.2 | Zero clients successfully migrated | Script completes | `migration-success.json` contains empty array | Medium |
| REQ-07 | CA-07.1 | E records failed | Script completes | `migration-errors.json` contains E objects with `id`/key and `reason` | High |
| REQ-07 | CA-07.2 | Zero records failed | Script completes | `migration-errors.json` contains empty array | Medium |
| REQ-08 | CA-08.1 | Script completes | Summary printed | Console shows total processed, successes, errors, output file paths | Medium |

---

## 9. Glossary

| Term | Definition |
|---|---|
| Legacy storage | The old KV namespace (`clever-clever-kv`) on Cloudflare account `98dfed939a59dca09770880eab939b79` |
| New storage | The R2 bucket used by the current CLEVER dashboard |
| Legacy schema | The flat JSON structure used in the old KV (fields like `id`, `nomeEmpresa`, etc. at root level) |
| New schema | The `BaseContent` wrapper structure with `uuid`, `contentType`, `data`, audit fields |
| Migration script | A standalone Node.js script run manually by the operator |
| Operator | The administrator who runs the migration script |
| Success record | A client that was read, transformed, and written without errors |
| Error record | A client that failed at any stage (read, parse, transform, write) |
