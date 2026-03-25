# Tests — KV to R2 Licenses Migration

## [MI] — Strategy

| Interface | Test scope | Mocked dependencies | REQ-ID |
|-----------|-----------|---------------------|--------|
| `listKvKeys()` | Paginated KV key listing across year prefixes 2021–current; empty years skipped; all keys collected before processing | Cloudflare KV REST API (fetch mock) | REQ-01 |
| `readKvValue()` | Read single KV value; handle HTTP errors and JSON parse failures | Cloudflare KV REST API (fetch mock) | REQ-02 |
| `buildClientLookupMap()` | Read clients index from R2; build case-insensitive map; handle duplicates (last wins); exit on read failure | Cloudflare R2 REST API (fetch mock) | REQ-03 |
| `resolveClientId()` | Two-step resolution: use `clientId` if present; else lookup `cliente` in map; error on missing/unresolved | Client lookup map (in-memory) | REQ-04 |
| `transformRecord()` | Map legacy flat schema → BaseContent<LicenseData>; software mapping with defaults; drop `tipoSoftware`/`cliente`; preserve invoices as-is | None (pure function) | REQ-05 |
| `writeR2Object()` | Write transformed record to R2 at `content/licenses/{uuid}.json`; handle HTTP errors; fatal on 401/403/404 | Cloudflare R2 REST API (fetch mock) | REQ-06 |
| `updateLicensesIndex()` | Read existing index, merge migrated items, write back; calculate license status from `dataVencimento`; handle write failure gracefully | Cloudflare R2 REST API (fetch mock) | REQ-07 |
| `buildSuccessEntry()` | Produce success entry with uuid, clientId, clientName, software names, modalidade, dataVencimento | None (pure function) | REQ-08 |
| `buildErrorEntry()` | Produce error entry with id/key and reason string | None (pure function) | REQ-09 |
| `writeOutputFiles()` | Write migration-success.json and migration-errors.json to `scripts/licenses/`; handle write failures | Node.js `fs/promises` (fs mock) | REQ-08, REQ-09 |
| `printSummary()` | Print console summary with totals, years scanned, output file paths | Console (spy) | REQ-10 |
| `calculateLicenseStatus()` | Status calculation: expired if past, expiring if ≤30 days, active otherwise; handle empty/absent dates | None (pure function) | REQ-07 |
| `main()` orchestration | End-to-end flow: env validation → client map → list keys → process each → index → output → summary | All external APIs (fetch mock), fs (mock) | REQ-01–REQ-10 |

## [MI] — Executable plan

### listKvKeys

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-01 | `listKvKeys()` | Collects keys across multiple year prefixes | KV returns 2 keys for 2024, 3 keys for 2025 | Array of 5 keys, yearsScanned = [2021..2026] | REQ-01 |
| MI-02 | `listKvKeys()` | Handles pagination within a single year | KV returns 1000 keys + cursor, then 50 keys | Array of 1050 keys | REQ-01 |
| MI-03 | `listKvKeys()` | Skips empty year prefix without error | KV returns 0 keys for 2022, 2 keys for 2024 | Array of 2 keys, no error thrown | REQ-01 |
| MI-04 | `listKvKeys()` | All year prefixes empty | KV returns 0 keys for all years | Empty array, yearsScanned populated | REQ-01 |
| MI-05 | `listKvKeys()` | KV API returns 401/403 | HTTP 401 response | Throws fatal error "API token invalid or insufficient permissions" | REQ-01 |
| MI-06 | `listKvKeys()` | KV API returns 404 | HTTP 404 response | Throws fatal error "KV namespace not found" | REQ-01 |

### readKvValue

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-07 | `readKvValue()` | Reads valid JSON value | Valid license JSON string | Parsed object | REQ-02 |
| MI-08 | `readKvValue()` | HTTP error on read | HTTP 500 response | `{ error: true, reason: "read failed: HTTP 500" }` | REQ-02 |
| MI-09 | `readKvValue()` | Invalid JSON value | Non-JSON string | `{ error: true, reason: "invalid JSON: ..." }` | REQ-02 |
| MI-10 | `readKvValue()` | Network failure | fetch throws | `{ error: true, reason: "read failed: ..." }` | REQ-02 |

### buildClientLookupMap

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-11 | `buildClientLookupMap()` | Builds map from clients index | Index with 3 clients | Map with 3 entries keyed by lowercase nomeComercial | REQ-03 |
| MI-12 | `buildClientLookupMap()` | Duplicate commercialName (last wins) | Index with 2 clients sharing same name | Map has 1 entry (last uuid), warning logged | REQ-03 |
| MI-13 | `buildClientLookupMap()` | Clients index unreadable | HTTP 404 response | Script exits with "Failed to read clients index" | REQ-03 |
| MI-14 | `buildClientLookupMap()` | Case-insensitive key | Client with "Café Quineto" | Map key is "café quineto" | REQ-03 |

### resolveClientId

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-15 | `resolveClientId()` | Record has non-empty clientId | `{ clientId: "uuid-123", cliente: "Foo" }` | Returns "uuid-123" (no lookup) | REQ-04 |
| MI-16 | `resolveClientId()` | Record has no clientId, cliente found in map | `{ cliente: "Café Quineto" }`, map has "café quineto" | Returns mapped uuid | REQ-04 |
| MI-17 | `resolveClientId()` | Record has no clientId, cliente not in map | `{ cliente: "Unknown" }`, map lacks it | Error: "client not found: Unknown" | REQ-04 |
| MI-18 | `resolveClientId()` | Record has neither clientId nor cliente | `{}` | Error: "required field missing: clientId or cliente" | REQ-04 |
| MI-19 | `resolveClientId()` | Record has empty string clientId | `{ clientId: "", cliente: "Foo" }` | Falls through to lookup by cliente | REQ-04 |

### transformRecord

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-20 | `transformRecord()` | Maps id to uuid | `{ id: "abc-123" }` | `{ uuid: "abc-123" }` | REQ-05 |
| MI-21 | `transformRecord()` | Preserves timestamps | `{ createdAt: "2024-01-01", updatedAt: "2024-06-01" }` | Same timestamps in output | REQ-05 |
| MI-22 | `transformRecord()` | Sets fixed BaseContent fields | Any valid record | `contentType: 'licenses'`, `version: 1`, `isDeleted: false`, `createdBy: 'migration'`, `updatedBy: 'migration'` | REQ-05 |
| MI-23 | `transformRecord()` | Maps software object fields | `{ software: { name: ["Zon Soft"], version: "Basic", model: "", ... } }` | `data.software` has all fields mapped | REQ-05 |
| MI-24 | `transformRecord()` | Defaults absent software to empty | Record without `software` key | `data.software = { name: [], model: '', product: '', version: '', licenseType: '', modules: [], nEquipamento: '', versaoLicenca: '' }` | REQ-05 |
| MI-25 | `transformRecord()` | Preserves invoices as-is | `{ invoices: [{ id: 1, ano: "2024" }] }` | `data.invoices` identical to input | REQ-05 |
| MI-26 | `transformRecord()` | Defaults absent invoices to empty array | Record without `invoices` key | `data.invoices = []` | REQ-05 |
| MI-27 | `transformRecord()` | Drops tipoSoftware | `{ tipoSoftware: ["Zon Soft"] }` | No `tipoSoftware` in output | REQ-05 |
| MI-28 | `transformRecord()` | Drops cliente | `{ cliente: "Foo" }` | No `cliente` in output | REQ-05 |
| MI-29 | `transformRecord()` | Maps license period fields with defaults | `{ versao: "1.0", dataInicio: "" }` | `data.versao = "1.0"`, `data.dataInicio = ""`, absent fields default to `''` | REQ-05 |

### writeR2Object

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-30 | `writeR2Object()` | Successful write | Valid transformed record | `{ success: true }`, PUT to `content/licenses/{uuid}.json` | REQ-06 |
| MI-31 | `writeR2Object()` | HTTP 500 on write | Server error | `{ error: true, reason: "write failed: HTTP 500" }` | REQ-06 |
| MI-32 | `writeR2Object()` | HTTP 401/403 on write (fatal) | Auth error | Throws fatal error "R2 bucket not accessible" | REQ-06 |
| MI-33 | `writeR2Object()` | HTTP 404 on write (fatal) | Bucket not found | Throws fatal error "R2 bucket not found" | REQ-06 |

### updateLicensesIndex

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-34 | `updateLicensesIndex()` | Merges migrated items with existing index | 2 existing + 3 migrated | Index has 5 items | REQ-07 |
| MI-35 | `updateLicensesIndex()` | Overwrites existing item with same uuid | Existing item uuid matches migrated | Migrated version replaces existing | REQ-07 |
| MI-36 | `updateLicensesIndex()` | Index write fails gracefully | R2 PUT returns 500 | Error logged, no throw | REQ-07 |
| MI-37 | `updateLicensesIndex()` | No existing index (first migration) | R2 GET returns 404 | Creates new index with migrated items only | REQ-07 |

### calculateLicenseStatus

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-38 | `calculateLicenseStatus()` | Past date → expired | `dataVencimento` = yesterday | `'expired'` | REQ-07 |
| MI-39 | `calculateLicenseStatus()` | Within 30 days → expiring | `dataVencimento` = today + 15 days | `'expiring'` | REQ-07 |
| MI-40 | `calculateLicenseStatus()` | More than 30 days → active | `dataVencimento` = today + 60 days | `'active'` | REQ-07 |
| MI-41 | `calculateLicenseStatus()` | Empty/absent date → active | `dataVencimento` = `''` or undefined | `'active'` | REQ-07 |

### buildSuccessEntry

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-42 | `buildSuccessEntry()` | Produces success entry with all fields | Transformed record + clientName | `{ uuid, clientId, clientName, software, modalidade, dataVencimento }` | REQ-08 |

### buildErrorEntry

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-43 | `buildErrorEntry()` | Produces error entry with id and reason | Record with id + reason string | `{ id, reason }` | REQ-09 |
| MI-44 | `buildErrorEntry()` | Uses KV key when id unavailable | No id, KV key = "licencas-2024-xxx" | `{ id: "licencas-2024-xxx", reason }` | REQ-09 |

### writeOutputFiles

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-45 | `writeOutputFiles()` | Writes both JSON files | 2 successes, 1 error | Two files written to `scripts/licenses/` | REQ-08, REQ-09 |
| MI-46 | `writeOutputFiles()` | Writes empty arrays when no data | 0 successes, 0 errors | Both files contain `[]` | REQ-08, REQ-09 |

### printSummary

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-47 | `printSummary()` | Prints complete summary | 10 found, 8 success, 2 errors, years 2021-2026 | Console output matches design §6 format | REQ-10 |

### main() orchestration

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-48 | `main()` | End-to-end: env validation fails | Missing CF_API_TOKEN | Exits with error, no output files | REQ-01–REQ-10 |
| MI-49 | `main()` | End-to-end: successful migration with mixed results | 3 records: 2 valid, 1 missing client | 2 successes, 1 error, index updated, files written, summary printed | REQ-01–REQ-10 |
| MI-50 | `main()` | End-to-end: zero records found | All year prefixes empty | Empty output files, summary shows 0 | REQ-01–REQ-10 |

## [MA] — Executable plan

| Test ID | CA-ID | Given / When / Then | Data | Pass criterion |
|---------|-------|---------------------|------|----------------|
| MA-01 | CA-01.1 | Given KV contains 5 licenses across 2024 and 2025 / When script runs / Then all 5 keys retrieved before transformation | 3 keys in 2024, 2 keys in 2025 | `keys.length === 5` and all keys present |
| MA-02 | CA-01.2 | Given year 2022 returns no keys / When script processes 2022 / Then moves to 2023 without error | Empty result for 2022 prefix | No error thrown, script continues |
| MA-03 | CA-01.3 | Given no year prefix returns any keys / When script completes / Then 0 successes, 0 errors | All year prefixes return empty | Output files contain `[]`, summary shows 0 |
| MA-04 | CA-02.1 | Given valid license key / When system reads it / Then full JSON object returned | Key `licencas-2024-abc` with valid JSON | Parsed object matches stored value |
| MA-05 | CA-02.2 | Given key with invalid JSON / When system reads it / Then added to errors, processing continues | Key returning `"not json"` | Error entry with "invalid JSON" reason, next record processed |
| MA-06 | CA-03.1 | Given clients index with 3 clients / When lookup map built / Then each commercialName maps to uuid | Index with 3 items | Map size === 3, each name resolves to correct uuid |
| MA-07 | CA-03.2 | Given clients index unreadable / When script starts / Then exits immediately | R2 returns HTTP 500 | Script exits, no output files |
| MA-08 | CA-03.3 | Given two clients share "Café Quineto" / When map built / Then last wins, warning logged | Two items with same nomeComercial | Map has 1 entry, console.warn called |
| MA-09 | CA-04.1 | Given record with `clientId: "uuid-123"` / When resolution runs / Then "uuid-123" used directly | `{ clientId: "uuid-123", cliente: "Foo" }` | Resolved clientId === "uuid-123", no map lookup |
| MA-10 | CA-04.2 | Given record without clientId, cliente "Café Quineto" in map / When resolution runs / Then clientId set to mapped uuid | `{ cliente: "Café Quineto" }`, map has entry | Resolved clientId === map value |
| MA-11 | CA-04.3 | Given record without clientId, cliente "Unknown" not in map / When resolution runs / Then error "client not found: Unknown" | `{ cliente: "Unknown" }` | Error entry with reason "client not found: Unknown" |
| MA-12 | CA-04.4 | Given record with neither clientId nor cliente / When resolution runs / Then error "required field missing" | `{}` | Error entry with reason "required field missing: clientId or cliente" |
| MA-13 | CA-05.1 | Given record with `id: "abc-123"` / When transformed / Then `uuid === "abc-123"` | Legacy record with id | `newRecord.uuid === "abc-123"` |
| MA-14 | CA-05.2 | Given record with timestamps / When transformed / Then timestamps preserved | `{ createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-06-01T00:00:00Z" }` | Same values in output |
| MA-15 | CA-05.3 | Given record with software object / When transformed / Then software fields mapped to data.software | `{ software: { name: ["Zon Soft"], version: "Basic" } }` | `data.software.name === ["Zon Soft"]`, `data.software.version === "Basic"` |
| MA-16 | CA-05.4 | Given record with license period fields / When transformed / Then fields mapped to data | `{ versao: "1.0", numeroSerie: "ABC", dataInicio: "2024-01-01", dataVencimento: "2025-01-01", modalidade: "ANUAL", duracaoContrato: "12" }` | All fields present in `data` |
| MA-17 | CA-05.5 | Given record with invoices / When transformed / Then invoices preserved as-is | `{ invoices: [{ id: 1, ano: "2024" }] }` | `data.invoices` identical to input |
| MA-18 | CA-05.6 | Given record with tipoSoftware / When transformed / Then tipoSoftware dropped | `{ tipoSoftware: ["Zon Soft"] }` | No `tipoSoftware` key in output |
| MA-19 | CA-05.7 | Given record with cliente / When transformed / Then cliente dropped | `{ cliente: "Foo" }` | No `cliente` key in output |
| MA-20 | CA-05.8 | Given any record / When transformed / Then fixed fields set | Any valid record | `contentType === 'licenses'`, `version === 1`, `isDeleted === false`, `createdBy === 'migration'`, `updatedBy === 'migration'` |
| MA-21 | CA-06.1 | Given transformed record / When written / Then stored at correct key | Record with uuid "abc-123" | PUT to `content/licenses/abc-123.json` |
| MA-22 | CA-06.2 | Given write fails / When error caught / Then added to errors, continues | R2 returns HTTP 500 | Error entry with "write failed" reason, next record processed |
| MA-23 | CA-07.1 | Given 3 licenses migrated / When index updated / Then index contains those 3 | 3 successful records | Index items array length >= 3, all 3 uuids present |
| MA-24 | CA-07.2 | Given index update fails / When error caught / Then operator notified, output files still written | R2 PUT returns 500 | Error logged, success/error files exist |
| MA-25 | CA-07.3 | Given license with dataVencimento yesterday / When added to index / Then status = "expired" | `dataVencimento` = yesterday's date | Index item status === "expired" |
| MA-26 | CA-08.1 | Given 2 licenses migrated / When script completes / Then success file has 2 entries | 2 successful migrations | File contains array of 2 objects with uuid, clientId, clientName, software, modalidade, dataVencimento |
| MA-27 | CA-08.2 | Given 0 licenses migrated / When script completes / Then success file has empty array | No successful migrations | File contains `[]` |
| MA-28 | CA-09.1 | Given 1 record failed / When script completes / Then error file has 1 entry | 1 failed record | File contains array of 1 object with id and reason |
| MA-29 | CA-09.2 | Given 0 records failed / When script completes / Then error file has empty array | No failures | File contains `[]` |
| MA-30 | CA-10.1 | Given script completes with 10 found, 8 success, 2 errors / When summary printed / Then all counts shown | Mixed results | Console output includes total, successes, errors, years scanned, file paths |
