# Requirements — KV to R2 Licenses Migration

## 1. Context and Actors

**Actors:**
- **Operator**: administrator who runs the migration script manually

**Trigger:** The company has a legacy storage system containing license records (Licenças) organized by year that need to be transferred to the new storage system with an updated data schema. The legacy records use a flat structure with `cliente` (client name string), `software` object, `tipoSoftware` array, and license period fields, while the new schema uses the `BaseContent` wrapper with typed `LicenseData`.

**Nominal result:** All license records are read from the legacy storage (iterating years 2021–current), transformed to the new schema (including client ID resolution), and written to the new storage. The licenses search index is updated. A JSON file listing all successful migrations and a JSON file listing all errors are produced.

**Error result:** Any license that fails to migrate is recorded in a separate JSON file with the reason for failure. The script continues processing remaining records.

---

## 2. Scope

### Included
- Reading all license records from the legacy storage (account `98dfed939a59dca09770880eab939b79`, namespace `clever-clever-kv`) using year-based prefixes `licencas-{year}-` for years 2021 through current year
- Transforming each record from the legacy flat schema to the new `BaseContent` + `LicenseData` schema
- Resolving `clientId` using a two-step strategy: if the legacy record already contains a `clientId`, use it directly; otherwise, look up the client in R2 using `cliente` (client name string) from the legacy record
- Mapping the legacy `software` object to the new `LicenseSoftware` interface
- Dropping the redundant `tipoSoftware` array (already represented by `software.name`)
- Dropping the `cliente` field (resolved through relations at display time)
- Calculating license status (`active`, `expiring`, `expired`) from `dataVencimento` for the search index
- Preserving `invoices` array as-is (direct mapping)
- Writing each transformed record to the new storage system
- Updating the licenses search index after all records are written
- Producing a `migration-success.json` file listing all successfully migrated licenses
- Producing a `migration-errors.json` file listing all failed licenses with error details

### Excluded
- Migration of any content type other than licenses
- Deletion or modification of records in the legacy storage
- Rollback of already-migrated records
- Duplicate detection (if a license already exists in the new storage, it is overwritten)
- User interface — script only
- Invoice validation or transformation — invoices are preserved as-is
- Date validation (start date vs expiration date) — preserved as-is from legacy data
- Software configuration validation — preserved as-is from legacy data

---

## 3. Constraints

- The script must be executable as a standalone Node.js script (no server required)
- The script must use the Cloudflare API to read from the legacy KV namespace
- The script must use the Cloudflare API to write to the new R2 storage
- The script must iterate year-based prefixes (`licencas-2021-`, `licencas-2022-`, ..., `licencas-2026-`) to discover all records
- The script must not stop on individual record errors — it must process all records
- Output files (`migration-success.json`, `migration-errors.json`) must be written to `scripts/licenses/` in the project directory
- The operator must provide a Cloudflare API token with read access to KV and read/write access to R2
- Client resolution requires reading the existing clients index from R2 to build a lookup map by `commercialName` (for records without an existing `clientId`)
- License status must be calculated from `dataVencimento` for the search index: expired if past, expiring if ≤30 days, active otherwise

---

## 4. Requirements (EARS format)

### REQ-01 — List all legacy licenses
**WHEN** the operator runs the migration script, **the system SHALL** retrieve all license keys from the legacy KV namespace by iterating year-based prefixes `licencas-{year}-` for years 2021 through the current year.

**Acceptance criteria:**
- CA-01.1: Given the legacy KV namespace contains N license records across multiple years, when the script runs, then all N keys across all year prefixes are retrieved before any transformation begins.
- CA-01.2: Given a year prefix returns no keys, when the script processes that year, then it moves to the next year without error.
- CA-01.3: Given no year prefix returns any keys, when the script completes, then it finishes with zero successes and zero errors.

---

### REQ-02 — Read each legacy license record
**WHEN** a license key is retrieved, **the system SHALL** read the full value of that key from the legacy KV namespace.

**Acceptance criteria:**
- CA-02.1: Given a valid license key, when the system reads it, then the full JSON object is returned.
- CA-02.2: Given a license key whose value cannot be read or parsed as JSON, when the system attempts to read it, then the record is added to the errors list with a descriptive reason and processing continues with the next record.

---

### REQ-03 — Build client lookup map
**WHEN** the migration script starts, **the system SHALL** read the clients index from R2 (`indexes/clients-index.json`) and build a lookup map keyed by `commercialName` (case-insensitive) to resolve `clientId` for licenses that lack one.

**Acceptance criteria:**
- CA-03.1: Given the clients index contains M clients, when the lookup map is built, then each client's `commercialName` maps to its `uuid`.
- CA-03.2: Given the clients index cannot be read, when the script starts, then the script exits immediately with a clear error message.
- CA-03.3: Given two clients share the same `commercialName` (case-insensitive), when the lookup map is built, then the last one wins and a warning is logged.

---

### REQ-04 — Resolve clientId for each license
**WHEN** a legacy license record is successfully read, **the system SHALL** resolve the `clientId` using a two-step strategy: if the record already contains a non-empty `clientId`, use it directly; otherwise, look up `cliente` in the client lookup map.

**Acceptance criteria:**
- CA-04.1: Given a legacy record with a non-empty `clientId` field, when the resolution runs, then that `clientId` is used directly without lookup.
- CA-04.2: Given a legacy record without `clientId` but with `cliente` matching a client in the lookup map, when the resolution runs, then `clientId` is set to the matched client's `uuid`.
- CA-04.3: Given a legacy record without `clientId` and with `cliente` not found in the lookup map, when the resolution runs, then the record is added to the errors list with reason "client not found: {cliente}" and processing continues.
- CA-04.4: Given a legacy record with neither `clientId` nor `cliente`, when the resolution runs, then the record is added to the errors list with reason "required field missing: clientId or cliente" and processing continues.

---

### REQ-05 — Transform legacy record to new schema
**WHEN** a legacy license record has a resolved `clientId`, **the system SHALL** transform it to the new license schema by mapping fields into the `LicenseData` structure, mapping the `software` object to `LicenseSoftware`, preserving `invoices` as-is, and dropping redundant fields (`tipoSoftware`, `cliente`).

**Acceptance criteria:**
- CA-05.1: Given a legacy record with `id`, when transformed, then the new record uses the same value as `uuid`.
- CA-05.2: Given a legacy record with `createdAt` and `updatedAt`, when transformed, then the new record preserves those timestamps.
- CA-05.3: Given a legacy record with `software` object, when transformed, then the `software` fields (`name`, `model`, `product`, `version`, `licenseType`, `modules`, `nEquipamento`, `versaoLicenca`) are mapped to `data.software`.
- CA-05.4: Given a legacy record with `versao`, `numeroSerie`, `dataInicio`, `dataVencimento`, `modalidade`, `duracaoContrato`, when transformed, then these fields are mapped directly to the corresponding `data` fields.
- CA-05.5: Given a legacy record with `invoices` array, when transformed, then the invoices are preserved as-is in `data.invoices`.
- CA-05.6: Given a legacy record with `tipoSoftware` array, when transformed, then `tipoSoftware` is dropped (redundant with `software.name`).
- CA-05.7: Given a legacy record with `cliente` string, when transformed, then `cliente` is dropped (resolved through relations at display time).
- CA-05.8: Given any legacy record, when transformed, the new record SHALL include: `contentType: 'licenses'`, `version: 1`, `isDeleted: false`, `createdBy: 'migration'`, `updatedBy: 'migration'`.

---

### REQ-06 — Write transformed record to new storage
**WHEN** a legacy license record is successfully transformed, **the system SHALL** write the new record to the new storage system under the key `content/licenses/{uuid}.json`.

**Acceptance criteria:**
- CA-06.1: Given a successfully transformed record, when written to new storage, then the record is stored at `content/licenses/{uuid}.json`.
- CA-06.2: Given a write operation that fails, when the error is caught, then the record is added to the errors list with the error reason and processing continues with the next record.

---

### REQ-07 — Update the licenses search index
**WHEN** all individual license records have been processed, **the system SHALL** update the licenses search index at `indexes/licenses-index.json` to include all successfully migrated licenses.

**Acceptance criteria:**
- CA-07.1: Given N licenses were successfully migrated, when the index is updated, then `indexes/licenses-index.json` contains exactly those N licenses (plus any pre-existing non-deleted licenses already in the index).
- CA-07.2: Given the index update fails, when the error is caught, then the operator is notified with a clear error message and the success/error output files are still written.
- CA-07.3: Given a migrated license, when added to the index, then the index entry includes `status` calculated from `dataVencimento` (expired if past, expiring if ≤30 days, active otherwise).

---

### REQ-08 — Produce success output file
**WHEN** the migration script completes, **the system SHALL** write a `scripts/licenses/migration-success.json` file listing all successfully migrated licenses.

**Acceptance criteria:**
- CA-08.1: Given M licenses were successfully migrated, when the script completes, then `scripts/licenses/migration-success.json` contains an array of M objects each with at minimum `uuid`, `clientId`, `clientName`, `software` (names), `modalidade`, and `dataVencimento`.
- CA-08.2: Given zero licenses were successfully migrated, when the script completes, then `scripts/licenses/migration-success.json` contains an empty array.

---

### REQ-09 — Produce error output file
**WHEN** the migration script completes, **the system SHALL** write a `scripts/licenses/migration-errors.json` file listing all records that failed to migrate.

**Acceptance criteria:**
- CA-09.1: Given E records failed during migration, when the script completes, then `scripts/licenses/migration-errors.json` contains an array of E objects each with at minimum the original `id` (or key), and a `reason` string describing the failure.
- CA-09.2: Given zero records failed, when the script completes, then `scripts/licenses/migration-errors.json` contains an empty array.

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
| _(absent)_ | `contentType` | Set to `'licenses'` |
| _(absent)_ | `version` | Set to `1` |
| _(absent)_ | `isDeleted` | Set to `false` |
| _(absent)_ | `createdBy` | Set to `'migration'` |
| _(absent)_ | `updatedBy` | Set to `'migration'` |

### Client relationship

| Legacy field | New field | Notes |
|---|---|---|
| `clientId` | `data.clientId` | Used directly if present and non-empty |
| `cliente` | _(used for lookup)_ | Used to resolve `clientId` via client lookup map when `clientId` is absent; dropped after resolution |

### License period fields

| Legacy field | New field | Notes |
|---|---|---|
| `versao` | `data.versao` | Direct mapping (string) |
| `numeroSerie` | `data.numeroSerie` | Direct mapping (string) |
| `dataInicio` | `data.dataInicio` | Direct mapping (ISO date string) |
| `dataVencimento` | `data.dataVencimento` | Direct mapping (ISO date string) |
| `modalidade` | `data.modalidade` | Direct mapping (ANUAL, SEMESTRAL, TRIMESTRAL, MENSAL) |
| `duracaoContrato` | `data.duracaoContrato` | Direct mapping (string) |

### Software configuration

| Legacy field | New field | Notes |
|---|---|---|
| `software.name` | `data.software.name` | Direct mapping (string array) |
| `software.model` | `data.software.model` | Direct mapping (string, Vectron-specific) |
| `software.product` | `data.software.product` | Direct mapping (string, Pix-specific) |
| `software.version` | `data.software.version` | Direct mapping (string, Zon Soft-specific) |
| `software.licenseType` | `data.software.licenseType` | Direct mapping (string, Pt CERT-specific) |
| `software.modules` | `data.software.modules` | Direct mapping (string array, Pix-specific) |
| `software.nEquipamento` | `data.software.nEquipamento` | Direct mapping (string) |
| `software.versaoLicenca` | `data.software.versaoLicenca` | Direct mapping (string) |

### Invoices

| Legacy field | New field | Notes |
|---|---|---|
| `invoices` | `data.invoices` | Direct mapping (array of invoice objects, preserved as-is) |

### Dropped fields

| Legacy field | Reason |
|---|---|
| `tipoSoftware` | Redundant with `software.name` |
| `cliente` | Resolved through relations at display time |

---

## 6. Business Rules

| RB-ID | Condition | Action | Error |
|---|---|---|---|
| RB-01 | Legacy record missing `id` | Skip record, add to errors | "required field missing: id" |
| RB-02 | Legacy record value is not valid JSON | Skip record, add to errors | "invalid JSON: {parseError}" |
| RB-03 | Legacy record has non-empty `clientId` | Use `clientId` directly, skip name-based lookup | — |
| RB-04 | Legacy record has no `clientId` but has `cliente` matching lookup map | Resolve `clientId` from lookup map | — |
| RB-05 | Legacy record has no `clientId` and `cliente` not found in lookup map | Skip record, add to errors | "client not found: {cliente}" |
| RB-06 | Legacy record has neither `clientId` nor `cliente` | Skip record, add to errors | "required field missing: clientId or cliente" |
| RB-07 | Write to new storage fails | Skip record, add to errors | "write failed: {errorMessage}" |
| RB-08 | `tipoSoftware` array present | Drop during transformation (redundant with `software.name`) | — |
| RB-09 | `cliente` string present | Drop during transformation (resolved through relations) | — |
| RB-10 | `software` object absent in legacy record | Default to empty software: `{ name: [], modules: [] }` | — |
| RB-11 | `invoices` array absent in legacy record | Default to empty array `[]` | — |
| RB-12 | Optional string fields absent in legacy record | Default to empty string `''` | — |
| RB-13 | Index update fails after all records processed | Log error to console, still write output files | "index update failed: {errorMessage}" |
| RB-14 | `dataVencimento` is past date | License status set to `expired` in search index | — |
| RB-15 | `dataVencimento` is within 30 days | License status set to `expiring` in search index | — |
| RB-16 | `dataVencimento` is more than 30 days away or absent | License status set to `active` in search index | — |

---

## 7. Error Scenarios

| Trigger | Behavior | Result |
|---|---|---|
| Cloudflare API token missing or invalid | Script exits immediately with clear error message | No output files written |
| KV namespace not found or inaccessible | Script exits immediately with clear error message | No output files written |
| R2 bucket not found or inaccessible | Script exits immediately with clear error message | No output files written |
| Clients index not found or unreadable in R2 | Script exits immediately with clear error message | No output files written |
| Individual record read fails | Record added to errors list, script continues | Record appears in `scripts/licenses/migration-errors.json` |
| Individual record JSON parse fails | Record added to errors list, script continues | Record appears in `scripts/licenses/migration-errors.json` |
| Individual record missing required field (`id`) | Record added to errors list, script continues | Record appears in `scripts/licenses/migration-errors.json` |
| Client not resolved (no `clientId` and `cliente` not in lookup map) | Record added to errors list, script continues | Record appears in `scripts/licenses/migration-errors.json` |
| No `clientId` and no `cliente` field present | Record added to errors list, script continues | Record appears in `scripts/licenses/migration-errors.json` |
| Individual record write fails | Record added to errors list, script continues | Record appears in `scripts/licenses/migration-errors.json` |
| Index update fails | Error logged to console, output files still written | Operator must re-run index update manually |
| Output file write fails | Error logged to console | Operator notified |

---

## 8. [MA] Mirror — Acceptance Criteria Table

| REQ-ID | CA-ID | Given | When | Then | Priority |
|---|---|---|---|---|---|
| REQ-01 | CA-01.1 | Legacy KV contains N license records across years | Script runs | All N keys across all year prefixes are retrieved | High |
| REQ-01 | CA-01.2 | A year prefix returns no keys | Script processes that year | Moves to next year without error | Medium |
| REQ-01 | CA-01.3 | No year prefix returns any keys | Script completes | Script finishes with 0 successes, 0 errors | Medium |
| REQ-02 | CA-02.1 | Valid license key exists | System reads it | Full JSON object is returned | High |
| REQ-02 | CA-02.2 | License key value is unreadable or invalid JSON | System attempts to read it | Record added to errors, processing continues | High |
| REQ-03 | CA-03.1 | Clients index contains M clients | Lookup map is built | Each commercialName maps to its uuid | High |
| REQ-03 | CA-03.2 | Clients index cannot be read | Script starts | Script exits immediately with clear error | High |
| REQ-03 | CA-03.3 | Two clients share same commercialName | Lookup map is built | Last one wins, warning logged | Low |
| REQ-04 | CA-04.1 | Legacy record has non-empty `clientId` | Resolution runs | That `clientId` is used directly | High |
| REQ-04 | CA-04.2 | Legacy record has no `clientId`, `cliente` matches lookup | Resolution runs | `clientId` set to matched client uuid | High |
| REQ-04 | CA-04.3 | Legacy record has no `clientId`, `cliente` not in lookup | Resolution runs | Record added to errors with "client not found" | High |
| REQ-04 | CA-04.4 | Legacy record has neither `clientId` nor `cliente` | Resolution runs | Record added to errors with "required field missing" | High |
| REQ-05 | CA-05.1 | Legacy record has `id` field | Transformation runs | New record `uuid` equals legacy `id` | High |
| REQ-05 | CA-05.2 | Legacy record has `createdAt` and `updatedAt` | Transformation runs | Timestamps preserved in new record | High |
| REQ-05 | CA-05.3 | Legacy record has `software` object | Transformation runs | Software fields mapped to `data.software` | High |
| REQ-05 | CA-05.4 | Legacy record has license period fields | Transformation runs | Fields mapped directly to `data` | High |
| REQ-05 | CA-05.5 | Legacy record has `invoices` array | Transformation runs | Invoices preserved as-is in `data.invoices` | High |
| REQ-05 | CA-05.6 | Legacy record has `tipoSoftware` array | Transformation runs | `tipoSoftware` is dropped | Medium |
| REQ-05 | CA-05.7 | Legacy record has `cliente` string | Transformation runs | `cliente` is dropped | Medium |
| REQ-05 | CA-05.8 | Any legacy record | Transformation runs | `contentType: 'licenses'`, `version: 1`, `isDeleted: false`, `createdBy: 'migration'`, `updatedBy: 'migration'` | High |
| REQ-06 | CA-06.1 | Successfully transformed record | Written to new storage | Stored at `content/licenses/{uuid}.json` | High |
| REQ-06 | CA-06.2 | Write operation fails | Error caught | Record added to errors, processing continues | High |
| REQ-07 | CA-07.1 | N licenses successfully migrated | Index updated | `indexes/licenses-index.json` contains those N licenses | High |
| REQ-07 | CA-07.2 | Index update fails | Error caught | Operator notified, output files still written | Medium |
| REQ-07 | CA-07.3 | Migrated license has `dataVencimento` | Added to index | Status calculated (expired/expiring/active) | High |
| REQ-08 | CA-08.1 | M licenses successfully migrated | Script completes | `scripts/licenses/migration-success.json` contains M objects with `uuid`, `clientId`, `clientName`, `software`, `modalidade`, `dataVencimento` | High |
| REQ-08 | CA-08.2 | Zero licenses successfully migrated | Script completes | `scripts/licenses/migration-success.json` contains empty array | Medium |
| REQ-09 | CA-09.1 | E records failed | Script completes | `scripts/licenses/migration-errors.json` contains E objects with `id`/key and `reason` | High |
| REQ-09 | CA-09.2 | Zero records failed | Script completes | `scripts/licenses/migration-errors.json` contains empty array | Medium |
| REQ-10 | CA-10.1 | Script completes | Summary printed | Console shows total processed, successes, errors, years scanned, output file paths | Medium |

---

## 9. Glossary

| Term | Definition |
|---|---|
| Legacy storage | The old KV namespace (`clever-clever-kv`) on Cloudflare account `98dfed939a59dca09770880eab939b79` |
| New storage | The R2 bucket used by the current CLEVER dashboard |
| Legacy schema | The flat JSON format used in the old KV with `cliente`, `software`, `tipoSoftware`, and license period fields |
| New schema | The `BaseContent` wrapper structure with `LicenseData` containing typed `software` (`LicenseSoftware`), `invoices`, and license period fields |
| Migration script | A standalone Node.js script run manually by the operator |
| Operator | The administrator who runs the migration script |
| Success record | A license that was read, client resolved, transformed, and written without errors |
| Error record | A license that failed at any stage (read, parse, client resolution, transform, write) |
| Client lookup map | An in-memory map built from the R2 clients index, keyed by `commercialName` (case-insensitive), mapping to client `uuid` |
| Year-based prefix | The KV key pattern `licencas-{year}-` used to organize licenses by year in the legacy storage (years 2021–current) |
| Two-step client resolution | Strategy where `clientId` is used directly if present in the legacy record; otherwise `cliente` (name string) is looked up in the client lookup map |
| License status | Calculated field for the search index: `expired` if `dataVencimento` is past, `expiring` if within 30 days, `active` otherwise |
| `tipoSoftware` | Legacy redundant field (array of software names) that duplicates `software.name` — dropped during migration |
