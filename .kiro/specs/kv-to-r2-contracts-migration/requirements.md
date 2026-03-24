# Requirements — KV to R2 Contracts Migration

## 1. Context and Actors

**Actors:**
- **Operator**: administrator who runs the migration script manually

**Trigger:** The company has a legacy storage system containing contract records that need to be transferred to the new storage system with an updated data schema. The legacy contracts use a flat structure with single equipment fields, while the new schema uses structured arrays and per-contract-type service details.

**Nominal result:** All contract records are read from the legacy storage, transformed to the new schema (including equipment array conversion), and written to the new storage. The corresponding client records are updated with the contract reference. A JSON file listing all successful migrations and a JSON file listing all errors are produced.

**Error result:** Any contract that fails to migrate is recorded in a separate JSON file with the reason for failure. The script continues processing remaining contracts.

---

## 2. Scope

### Included
- Reading all contract records from the legacy storage (account `98dfed939a59dca09770880eab939b79`, namespace `clever-clever-kv`)
- Transforming each record from the legacy flat schema to the new `BaseContent` + `ContractData` schema
- Converting single equipment fields to equipment arrays (CPA and S&H)
- Mapping shared service detail fields to the active contract type's specific fields
- Writing each transformed record to the new storage system
- Updating the contract search index after all records are written
- Updating each client record in the new storage to set `contratoId` referencing the migrated contract
- Producing a `migration-success.json` file listing all successfully migrated contracts
- Producing a `migration-errors.json` file listing all failed contracts with error details

### Excluded
- Migration of any content type other than contracts
- Deletion or modification of records in the legacy storage
- Rollback of already-migrated records
- Duplicate detection (if a contract already exists in the new storage, it is overwritten)
- User interface — script only
- Validation of plan IDs against the plan configuration (plans are migrated as-is)
- Price recalculation — pricing data is not stored in legacy records

---

## 3. Constraints

- The script must be executable as a standalone Node.js script (no server required)
- The script must use the Cloudflare API to read from the legacy KV namespace
- The script must use the Cloudflare API to write to the new R2 storage
- The script must not stop on individual record errors — it must process all records
- Output files (`migration-success.json`, `migration-errors.json`) must be written to `scripts/contracts/` in the project directory
- The operator must provide a Cloudflare API token with read access to KV and read/write access to R2
- The legacy KV prefix for contracts is to be determined from the existing data (likely `contratos-`)
- Equipment conversion must handle empty strings as "no equipment present"
- Shared service detail fields (`horasAssistenciaAnual`, `deslocacoesPorAno`, `manutencoesPorAno`) must be assigned to the active contract type only

---

## 4. Requirements (EARS format)

### REQ-01 — List all legacy contracts
**WHEN** the operator runs the migration script, **the system SHALL** retrieve all contract keys from the legacy KV namespace using the contract prefix.

**Acceptance criteria:**
- CA-01.1: Given the legacy KV namespace contains N contract records, when the script runs, then all N keys with the contract prefix are retrieved before any transformation begins.
- CA-01.2: Given the legacy KV namespace contains no keys with the contract prefix, when the script runs, then the script completes with zero successes and zero errors.

---

### REQ-02 — Read each legacy contract record
**WHEN** a contract key is retrieved, **the system SHALL** read the full value of that key from the legacy KV namespace.

**Acceptance criteria:**
- CA-02.1: Given a valid contract key, when the system reads it, then the full JSON object is returned.
- CA-02.2: Given a contract key whose value cannot be read or parsed as JSON, when the system attempts to read it, then the record is added to the errors list with a descriptive reason and processing continues with the next record.

---

### REQ-03 — Transform legacy record to new schema
**WHEN** a legacy contract record is successfully read, **the system SHALL** transform it to the new contract schema by mapping all compatible fields, converting single equipment fields to equipment arrays, and assigning shared service details to the active contract type.

**Acceptance criteria:**
- CA-03.1: Given a legacy record with `id`, when transformed, then the new record uses the same value as `uuid`.
- CA-03.2: Given a legacy record with `createdAt` and `updatedAt`, when transformed, then the new record preserves those timestamps.
- CA-03.3: Given a legacy record with `clienteId`, when transformed, then the new record maps it to `data.clientId`.
- CA-03.4: Given a legacy record with `hasCPAContract: true` and non-empty `modeloCPA`/`numeroSerieCPA`, when transformed, then a single-item `cpaEquipments` array is created with `id` (generated UUID), `modelo: modeloCPA`, `numeroSerie: numeroSerieCPA`, `desconto: 0`, `observacoes: ''`.
- CA-03.5: Given a legacy record with `hasCPAContract: false` or empty CPA equipment fields, when transformed, then `cpaEquipments` is set to an empty array.
- CA-03.6: Given a legacy record with `hasSHContract: true` and non-empty `modeloPSO`/`numeroSeriePSO`, when transformed, then a single-item `shEquipments` array is created with `id` (generated UUID), `modelo: modeloPSO`, `numeroSerie: numeroSeriePSO`, `software: softwarePSO`, `observacoes: ''`.
- CA-03.7: Given a legacy record with `hasSHContract: false` or empty S&H equipment fields, when transformed, then `shEquipments` is set to an empty array.
- CA-03.8: Given a legacy record with `hasSHContract: true`, when transformed, then `horasAssistenciaAnual` maps to `horasAssistenciaAnualSH`, `deslocacoesPorAno` maps to `deslocacoesPorAnoSH`, and `manutencoesPorAno` maps to `manutencoesPorAnoSH`. The CPA equivalents are set to `0`.
- CA-03.9: Given a legacy record with `hasCPAContract: true`, when transformed, then `horasAssistenciaAnual` maps to `horasAssistenciaAnualCPA`, `deslocacoesPorAno` maps to `deslocacoesPorAnoCPA`, and `manutencoesPorAno` maps to `manutencoesPorAnoCPA`. The S&H equivalents are set to `0`.
- CA-03.10: Given a legacy record with both `hasCPAContract: true` and `hasSHContract: true`, when transformed, then the shared service details are assigned to the S&H type (primary) and CPA equivalents are set to `0`.
- CA-03.11: Given any legacy record, when transformed, the new record SHALL include: `contentType: 'contracts'`, `version: 1`, `isDeleted: false`, `createdBy: 'migration'`, `updatedBy: 'migration'`.
- CA-03.12: Given a legacy record with `temCPA` field, when transformed, then `temCPA` is mapped to `hasCPAContract` (boolean coercion).
- CA-03.13: Given a legacy record with empty string values for optional fields (`distanceCPA`, `modalidadePagamentoCPA`, etc.), when transformed, then those fields are preserved as empty strings in the new schema.

---

### REQ-04 — Write transformed record to new storage
**WHEN** a legacy contract record is successfully transformed, **the system SHALL** write the new record to the new storage system under the key `content/contracts/{uuid}.json`.

**Acceptance criteria:**
- CA-04.1: Given a successfully transformed record, when written to new storage, then the record is stored at `content/contracts/{uuid}.json`.
- CA-04.2: Given a write operation that fails, when the error is caught, then the record is added to the errors list with the error reason and processing continues with the next record.

---

### REQ-05 — Update the contract search index
**WHEN** all individual contract records have been processed, **the system SHALL** update the contract search index at `indexes/contracts-index.json` to include all successfully migrated contracts.

**Acceptance criteria:**
- CA-05.1: Given N contracts were successfully migrated, when the index is updated, then `indexes/contracts-index.json` contains exactly those N contracts (plus any pre-existing non-deleted contracts already in the index).
- CA-05.2: Given the index update fails, when the error is caught, then the operator is notified with a clear error message and the success/error output files are still written.

---

### REQ-06 — Update client record with contract reference
**WHEN** a contract record is successfully written to the new storage, **the system SHALL** read the corresponding client record from R2 using `clientId`, set `data.contratoId` to the contract's `uuid`, and write the updated client record back to R2.

**Acceptance criteria:**
- CA-06.1: Given a successfully written contract with `clientId` pointing to an existing client, when the client is updated, then `data.contratoId` equals the contract's `uuid` and `updatedAt` is refreshed.
- CA-06.2: Given a `clientId` that does not correspond to any client in R2, when the update is attempted, then the failure is logged in the errors list but the contract migration itself is still counted as a success.
- CA-06.3: Given the client record update fails for any reason, when the error is caught, then the failure is logged in the errors list with reason "client update failed" but the contract migration is still counted as a success.

---

### REQ-07 — Produce success output file
**WHEN** the migration script completes, **the system SHALL** write a `scripts/contracts/migration-success.json` file listing all successfully migrated contracts.

**Acceptance criteria:**
- CA-07.1: Given M contracts were successfully migrated, when the script completes, then `scripts/contracts/migration-success.json` contains an array of M objects each with at minimum `uuid`, `clientId`, and the active contract types.
- CA-07.2: Given zero contracts were successfully migrated, when the script completes, then `scripts/contracts/migration-success.json` contains an empty array.

---

### REQ-08 — Produce error output file
**WHEN** the migration script completes, **the system SHALL** write a `scripts/contracts/migration-errors.json` file listing all records that failed to migrate.

**Acceptance criteria:**
- CA-08.1: Given E records failed during migration, when the script completes, then `scripts/contracts/migration-errors.json` contains an array of E objects each with at minimum the original `id` (or key), and a `reason` string describing the failure.
- CA-08.2: Given zero records failed, when the script completes, then `scripts/contracts/migration-errors.json` contains an empty array.

---

### REQ-09 — Report migration summary to operator
**WHEN** the migration script completes, **the system SHALL** print a summary to the console showing the total number of records processed, the number of successes, the number of errors, and the number of client updates performed.

**Acceptance criteria:**
- CA-09.1: Given the script completes, when the summary is printed, then it includes: total records found, total successes, total errors, total client updates, and the paths of the two output files.

---

## 5. Field Mapping — Legacy KV to New Schema

### BaseContent wrapper fields

| Legacy field | New field | Notes |
|---|---|---|
| `id` | `uuid` (BaseContent) | Moved to wrapper level |
| `createdAt` | `createdAt` (BaseContent) | Preserved from legacy |
| `updatedAt` | `updatedAt` (BaseContent) | Preserved from legacy |
| _(absent)_ | `contentType` | Set to `'contracts'` |
| _(absent)_ | `version` | Set to `1` |
| _(absent)_ | `isDeleted` | Set to `false` |
| _(absent)_ | `createdBy` | Set to `'migration'` |
| _(absent)_ | `updatedBy` | Set to `'migration'` |

### Client relationship

| Legacy field | New field | Notes |
|---|---|---|
| `clienteId` | `data.clientId` | Direct mapping — required |
| `nome` | _(dropped)_ | Resolved through relations at display time |
| `nomeComercial` | _(dropped)_ | Resolved through relations at display time |
| `nomeSocial` | _(dropped)_ | Resolved through relations at display time |
| `contribuinte` | _(dropped)_ | Resolved through relations at display time |
| `contacto` | _(dropped)_ | Resolved through relations at display time |
| `email` | _(dropped)_ | Resolved through relations at display time |
| `morada` | _(dropped)_ | Resolved through relations at display time |
| `selectedClienteId` | _(dropped)_ | Redundant with `clienteId` |

### CPA contract fields

| Legacy field | New field | Notes |
|---|---|---|
| `hasCPAContract` | `data.hasCPAContract` | Direct mapping (boolean) |
| `temCPA` | `data.hasCPAContract` | Fallback if `hasCPAContract` absent — boolean coercion |
| `planIdCPA` | `data.planIdCPA` | Direct mapping |
| `planoCPA` | _(dropped)_ | Plan description text — derived from plan ID at display time |
| `distanceCPA` | `data.distanceCPA` | Direct mapping |
| `modalidadePagamentoCPA` | `data.modalidadePagamentoCPA` | Direct mapping |
| `inicioContratoCPA` | `data.inicioContratoCPA` | Direct mapping (ISO date string) |
| `fimContratoCPA` | `data.fimContratoCPA` | Direct mapping (ISO date string) |
| `modeloCPA` | `data.cpaEquipments[0].modelo` | Converted to single-item array (if non-empty) |
| `numeroSerieCPA` | `data.cpaEquipments[0].numeroSerie` | Converted to single-item array (if non-empty) |
| _(absent)_ | `data.cpaEquipments[0].id` | Generated UUID |
| _(absent)_ | `data.cpaEquipments[0].desconto` | Default `0` |
| _(absent)_ | `data.cpaEquipments[0].observacoes` | Default `''` |
| _(absent)_ | `data.cpaContractType` | Default `''` — not present in legacy data |
| _(absent)_ | `data.hasPOSPackage` | Default `false` |

### S&H contract fields

| Legacy field | New field | Notes |
|---|---|---|
| `hasSHContract` | `data.hasSHContract` | Direct mapping (boolean) |
| `planIdSH` | `data.planIdSH` | Direct mapping |
| `planoSH` | _(dropped)_ | Plan description text — derived from plan ID at display time |
| `distanceSH` | `data.distanceSH` | Direct mapping |
| `modalidadePagamentoSH` | `data.modalidadePagamentoSH` | Direct mapping |
| `inicioContratoSH` | `data.inicioContratoSH` | Direct mapping (ISO date string) |
| `fimContratoSH` | `data.fimContratoSH` | Direct mapping (ISO date string) |
| `modeloPSO` | `data.shEquipments[0].modelo` | Converted to single-item array (if non-empty) |
| `numeroSeriePSO` | `data.shEquipments[0].numeroSerie` | Converted to single-item array (if non-empty) |
| `softwarePSO` | `data.shEquipments[0].software` | Converted to single-item array (if non-empty) |
| _(absent)_ | `data.shEquipments[0].id` | Generated UUID |
| _(absent)_ | `data.shEquipments[0].observacoes` | Default `''` |

### Service details (shared → per-type)

| Legacy field | New field | Notes |
|---|---|---|
| `horasAssistenciaAnual` | `data.horasAssistenciaAnualSH` or `data.horasAssistenciaAnualCPA` | Assigned to active contract type; other set to `0` |
| `deslocacoesPorAno` | `data.deslocacoesPorAnoSH` or `data.deslocacoesPorAnoCPA` | Assigned to active contract type; other set to `0` |
| `manutencoesPorAno` | `data.manutencoesPorAnoSH` or `data.manutencoesPorAnoCPA` | Assigned to active contract type; other set to `0` |

### Payment method

| Legacy field | New field | Notes |
|---|---|---|
| _(absent)_ | `data.metodoPagamento` | Default `''` — not present in legacy data |

### Dropped legacy fields

| Legacy field | Reason |
|---|---|
| `planoContrato` | Full plan description text — not stored in new schema |
| `planoContratoSoftHard` | Legacy plan text — not stored in new schema |
| `modelo180` | Legacy field — no equivalent in new schema |
| `modeloSoftware` | Legacy field — no equivalent in new schema |
| `temPSO` | Informational only — equipment presence determined by `shEquipments` array |

---

## 6. Business Rules

| RB-ID | Condition | Action | Error |
|---|---|---|---|
| RB-01 | Legacy record missing `id` | Skip record, add to errors | "required field missing: id" |
| RB-02 | Legacy record missing `clienteId` | Skip record, add to errors | "required field missing: clienteId" |
| RB-03 | Legacy record value is not valid JSON | Skip record, add to errors | "invalid JSON: {parseError}" |
| RB-04 | Write to new storage fails | Skip record, add to errors | "write failed: {errorMessage}" |
| RB-05 | CPA equipment fields (`modeloCPA`, `numeroSerieCPA`) are empty strings | Set `cpaEquipments` to empty array | — |
| RB-06 | S&H equipment fields (`modeloPSO`, `numeroSeriePSO`) are empty strings | Set `shEquipments` to empty array | — |
| RB-07 | Both `hasCPAContract` and `hasSHContract` are true | Assign shared service details to S&H (primary); CPA equivalents set to `0` | — |
| RB-08 | Neither `hasCPAContract` nor `hasSHContract` is true | Skip record, add to errors | "no active contract type" |
| RB-09 | `temCPA` present but `hasCPAContract` absent | Use `temCPA` as fallback for `hasCPAContract` | — |
| RB-10 | Index update fails after all records processed | Log error to console, still write output files | "index update failed: {errorMessage}" |
| RB-11 | Client record not found in R2 for `contratoId` update | Log to errors as warning, contract still counted as success | "client update failed: client not found" |
| RB-12 | Client record update fails | Log to errors as warning, contract still counted as success | "client update failed: {errorMessage}" |
| RB-13 | Optional string fields absent in legacy record | Default to empty string `''` | — |
| RB-14 | Optional numeric fields absent in legacy record | Default to `0` | — |

---

## 7. Error Scenarios

| Trigger | Behavior | Result |
|---|---|---|
| Cloudflare API token missing or invalid | Script exits immediately with clear error message | No output files written |
| KV namespace not found or inaccessible | Script exits immediately with clear error message | No output files written |
| R2 bucket not found or inaccessible | Script exits immediately with clear error message | No output files written |
| Individual record read fails | Record added to errors list, script continues | Record appears in `scripts/contracts/migration-errors.json` |
| Individual record JSON parse fails | Record added to errors list, script continues | Record appears in `scripts/contracts/migration-errors.json` |
| Individual record missing required fields (`id`, `clienteId`) | Record added to errors list, script continues | Record appears in `scripts/contracts/migration-errors.json` |
| Individual record has no active contract type | Record added to errors list, script continues | Record appears in `scripts/contracts/migration-errors.json` |
| Individual record write fails | Record added to errors list, script continues | Record appears in `scripts/contracts/migration-errors.json` |
| Client record update fails after contract write | Warning logged in errors, contract counted as success | Warning appears in `scripts/contracts/migration-errors.json` |
| Index update fails | Error logged to console, output files still written | Operator must re-run index update manually |
| Output file write fails | Error logged to console | Operator notified |

---

## 8. [MA] Mirror — Acceptance Criteria Table

| REQ-ID | CA-ID | Given | When | Then | Priority |
|---|---|---|---|---|---|
| REQ-01 | CA-01.1 | Legacy KV contains N contract records | Script runs | All N keys with contract prefix are retrieved | High |
| REQ-01 | CA-01.2 | Legacy KV has no contract keys | Script runs | Script completes with 0 successes, 0 errors | Medium |
| REQ-02 | CA-02.1 | Valid contract key exists | System reads it | Full JSON object is returned | High |
| REQ-02 | CA-02.2 | Contract key value is unreadable or invalid JSON | System attempts to read it | Record added to errors, processing continues | High |
| REQ-03 | CA-03.1 | Legacy record has `id` field | Transformation runs | New record `uuid` equals legacy `id` | High |
| REQ-03 | CA-03.2 | Legacy record has `createdAt` and `updatedAt` | Transformation runs | Timestamps preserved in new record | High |
| REQ-03 | CA-03.3 | Legacy record has `clienteId` | Transformation runs | `data.clientId` equals legacy `clienteId` | High |
| REQ-03 | CA-03.4 | Legacy record has CPA contract with non-empty equipment | Transformation runs | Single-item `cpaEquipments` array created | High |
| REQ-03 | CA-03.5 | Legacy record has no CPA contract or empty equipment | Transformation runs | `cpaEquipments` is empty array | Medium |
| REQ-03 | CA-03.6 | Legacy record has S&H contract with non-empty equipment | Transformation runs | Single-item `shEquipments` array created | High |
| REQ-03 | CA-03.7 | Legacy record has no S&H contract or empty equipment | Transformation runs | `shEquipments` is empty array | Medium |
| REQ-03 | CA-03.8 | Legacy record has `hasSHContract: true` | Transformation runs | Shared service details mapped to S&H fields | High |
| REQ-03 | CA-03.9 | Legacy record has `hasCPAContract: true` | Transformation runs | Shared service details mapped to CPA fields | High |
| REQ-03 | CA-03.10 | Legacy record has both contract types active | Transformation runs | Service details assigned to S&H; CPA set to 0 | Medium |
| REQ-03 | CA-03.11 | Any legacy record | Transformation runs | `contentType: 'contracts'`, `version: 1`, `isDeleted: false`, `createdBy: 'migration'`, `updatedBy: 'migration'` | High |
| REQ-03 | CA-03.12 | Legacy record has `temCPA` but no `hasCPAContract` | Transformation runs | `temCPA` used as fallback for `hasCPAContract` | Medium |
| REQ-03 | CA-03.13 | Legacy record has empty string optional fields | Transformation runs | Empty strings preserved in new schema | Low |
| REQ-04 | CA-04.1 | Successfully transformed record | Written to new storage | Stored at `content/contracts/{uuid}.json` | High |
| REQ-04 | CA-04.2 | Write operation fails | Error caught | Record added to errors, processing continues | High |
| REQ-05 | CA-05.1 | N contracts successfully migrated | Index updated | `indexes/contracts-index.json` contains those N contracts | High |
| REQ-05 | CA-05.2 | Index update fails | Error caught | Operator notified, output files still written | Medium |
| REQ-06 | CA-06.1 | Contract written with valid `clientId` | Client updated | `data.contratoId` set to contract UUID, `updatedAt` refreshed | High |
| REQ-06 | CA-06.2 | `clientId` points to non-existent client | Update attempted | Failure logged, contract still counted as success | Medium |
| REQ-06 | CA-06.3 | Client update fails for any reason | Error caught | Failure logged, contract still counted as success | Medium |
| REQ-07 | CA-07.1 | M contracts successfully migrated | Script completes | `scripts/contracts/migration-success.json` contains M objects with `uuid`, `clientId`, contract types | High |
| REQ-07 | CA-07.2 | Zero contracts successfully migrated | Script completes | `scripts/contracts/migration-success.json` contains empty array | Medium |
| REQ-08 | CA-08.1 | E records failed | Script completes | `scripts/contracts/migration-errors.json` contains E objects with `id`/key and `reason` | High |
| REQ-08 | CA-08.2 | Zero records failed | Script completes | `scripts/contracts/migration-errors.json` contains empty array | Medium |
| REQ-09 | CA-09.1 | Script completes | Summary printed | Console shows total processed, successes, errors, client updates, output file paths | Medium |

---

## 9. Glossary

| Term | Definition |
|---|---|
| Legacy storage | The old KV namespace (`clever-clever-kv`) on Cloudflare account `98dfed939a59dca09770880eab939b79` |
| New storage | The R2 bucket used by the current CLEVER dashboard |
| Legacy schema | The flat JSON structure used in the old KV with single equipment fields and shared service details |
| New schema | The `BaseContent` wrapper structure with `ContractData` containing equipment arrays and per-type service details |
| Migration script | A standalone Node.js script run manually by the operator |
| Operator | The administrator who runs the migration script |
| Success record | A contract that was read, transformed, and written without errors |
| Error record | A contract that failed at any stage (read, parse, transform, write) |
| CPA equipment | Legacy fields `modeloCPA`/`numeroSerieCPA` converted to `cpaEquipments` array |
| S&H equipment | Legacy fields `modeloPSO`/`numeroSeriePSO`/`softwarePSO` converted to `shEquipments` array |
| Shared service details | Legacy fields `horasAssistenciaAnual`, `deslocacoesPorAno`, `manutencoesPorAno` that apply to the active contract type |
| Client sync | The process of updating a client record's `contratoId` field after a contract is successfully migrated |
