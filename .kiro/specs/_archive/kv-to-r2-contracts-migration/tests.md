# Tests — KV to R2 Contracts Migration

## [MI] — Strategy

| Interface | Test scope | Mocked dependencies | REQ-ID |
|-----------|-----------|---------------------|--------|
| `listKvKeys()` | Pagination handling, prefix filtering, empty namespace | Cloudflare KV API (HTTP responses) | REQ-01 |
| `readKvValue()` | JSON parsing, read failures, invalid data | Cloudflare KV API (HTTP responses) | REQ-02 |
| `transformRecord()` | Field mapping, equipment array construction, service detail assignment, default values, validation failures | None (pure function) | REQ-03 |
| `writeR2Object()` | Successful write, write failures, key format | Cloudflare R2 API (HTTP responses) | REQ-04 |
| `buildContractIndex()` | Index item construction, searchable text, merge with existing | Cloudflare R2 API (HTTP responses) | REQ-05 |
| `updateClientContratoId()` | Client read/update, missing client, update failure | Cloudflare R2 API (HTTP responses) | REQ-06 |
| `writeOutputFiles()` | Success file, error file, empty arrays | File system (`fs/promises`) | REQ-07, REQ-08 |
| `printSummary()` | Console output format, all counters | Console (stdout) | REQ-09 |
| `migrateContracts()` (orchestrator) | End-to-end flow: env validation, fatal errors, per-record error resilience, output always written | All external APIs | REQ-01 through REQ-09 |

## [MI] — Executable plan

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-IT-01 | `listKvKeys()` | Single page of keys returned | KV API returns 5 keys, no cursor | Array of 5 key names | REQ-01 |
| MI-IT-02 | `listKvKeys()` | Paginated keys — two pages | KV API returns 1000 keys + cursor, then 3 keys + empty cursor | Array of 1003 key names | REQ-01 |
| MI-IT-03 | `listKvKeys()` | Empty namespace | KV API returns 0 keys | Empty array | REQ-01 |
| MI-IT-04 | `listKvKeys()` | KV API returns non-200 | KV API returns HTTP 403 | Throws error (fatal) | REQ-01 |
| MI-IT-05 | `readKvValue()` | Valid JSON record | KV API returns valid JSON string | Parsed object | REQ-02 |
| MI-IT-06 | `readKvValue()` | Invalid JSON | KV API returns non-JSON string | `{ error: true, reason: "invalid JSON: ..." }` | REQ-02 |
| MI-IT-07 | `readKvValue()` | Read failure (HTTP error) | KV API returns HTTP 500 | `{ error: true, reason: "read failed: HTTP 500" }` | REQ-02 |
| MI-IT-08 | `transformRecord()` | Nominal CPA-only record | Legacy record with `hasCPAContract: true`, non-empty equipment, shared service details | `BaseContent<ContractData>` with CPA fields populated, S&H service details = 0, `cpaEquipments` single-item array | REQ-03 |
| MI-IT-09 | `transformRecord()` | Nominal S&H-only record | Legacy record with `hasSHContract: true`, non-empty equipment, shared service details | `BaseContent<ContractData>` with S&H fields populated, CPA service details = 0, `shEquipments` single-item array | REQ-03 |
| MI-IT-10 | `transformRecord()` | Both contract types active | Legacy record with both `hasCPAContract: true` and `hasSHContract: true` | Shared service details assigned to S&H (primary), CPA service details = 0 | REQ-03 |
| MI-IT-11 | `transformRecord()` | `temCPA` fallback | Legacy record with `temCPA: true` but no `hasCPAContract` | `hasCPAContract` resolved to `true` | REQ-03 |
| MI-IT-12 | `transformRecord()` | Empty equipment fields | Legacy record with `hasCPAContract: true` but `modeloCPA: ''`, `numeroSerieCPA: ''` | `cpaEquipments` = empty array | REQ-03 |
| MI-IT-13 | `transformRecord()` | Missing required field `id` | Legacy record without `id` | Error: `"required field missing: id"` | REQ-03 |
| MI-IT-14 | `transformRecord()` | Missing required field `clienteId` | Legacy record without `clienteId` | Error: `"required field missing: clienteId"` | REQ-03 |
| MI-IT-15 | `transformRecord()` | No active contract type | Legacy record with `hasCPAContract: false`, `hasSHContract: false` | Error: `"no active contract type"` | REQ-03 |
| MI-IT-16 | `transformRecord()` | Default values for absent optional fields | Legacy record missing optional string/numeric fields | Strings default to `''`, numbers default to `0` | REQ-03 |
| MI-IT-17 | `transformRecord()` | BaseContent wrapper fields | Any valid legacy record | `contentType: 'contracts'`, `version: 1`, `isDeleted: false`, `createdBy: 'migration'`, `updatedBy: 'migration'` | REQ-03 |
| MI-IT-18 | `writeR2Object()` | Successful write | Valid transformed record | R2 PUT to `content/contracts/{uuid}.json` returns 200 | REQ-04 |
| MI-IT-19 | `writeR2Object()` | Write failure | R2 API returns HTTP 500 | `{ error: true, reason: "write failed: HTTP 500" }` | REQ-04 |
| MI-IT-20 | `buildContractIndex()` | Build index items from migrated records | Array of 3 successful records | Array of 3 index items with `searchableText`, correct fields | REQ-05 |
| MI-IT-21 | `buildContractIndex()` | Merge with existing index | Existing index with 2 items, 3 new migrated records (1 overlapping UUID) | Merged index with 4 items (deduped), sorted by `createdAt` desc | REQ-05 |
| MI-IT-22 | `buildContractIndex()` | Existing index not found (404) | R2 GET returns 404 | Start with empty array, write new index with migrated records only | REQ-05 |
| MI-IT-23 | `updateClientContratoId()` | Successful client update | Valid `clientId`, client exists in R2 | Client record updated with `contratoId` and refreshed `updatedAt` | REQ-06 |
| MI-IT-24 | `updateClientContratoId()` | Client not found | `clientId` points to non-existent client (R2 404) | Returns warning: `"client update failed: client not found"` | REQ-06 |
| MI-IT-25 | `updateClientContratoId()` | Client update write fails | Client read succeeds, write returns HTTP 500 | Returns warning: `"client update failed: HTTP 500"` | REQ-06 |
| MI-IT-26 | `writeOutputFiles()` | Success file with records | Array of 3 success objects | `migration-success.json` written with 3 items | REQ-07 |
| MI-IT-27 | `writeOutputFiles()` | Empty success file | Empty array | `migration-success.json` written with `[]` | REQ-07 |
| MI-IT-28 | `writeOutputFiles()` | Error file with records | Array of 2 error objects | `migration-errors.json` written with 2 items | REQ-08 |
| MI-IT-29 | `writeOutputFiles()` | Empty error file | Empty array | `migration-errors.json` written with `[]` | REQ-08 |
| MI-IT-30 | `printSummary()` | Full summary output | Counters: total=10, successes=8, errors=2, clientUpdates=7 | Console output includes all counters and file paths | REQ-09 |
| MI-IT-31 | `migrateContracts()` | Missing env var | `CF_API_TOKEN` not set | Script exits immediately, no output files | REQ-01–REQ-09 |
| MI-IT-32 | `migrateContracts()` | End-to-end with mixed results | 3 records: 1 valid CPA, 1 valid S&H, 1 missing `id` | 2 successes, 1 error, output files written, summary printed | REQ-01–REQ-09 |
| MI-IT-33 | `migrateContracts()` | Zero records found | KV returns empty key list | Empty output files, summary shows 0/0/0 | REQ-01–REQ-09 |

## [MA] — Executable plan

| Test ID | CA-ID | Given / When / Then | Data | Pass criterion |
|---------|-------|---------------------|------|----------------|
| MA-AT-01 | CA-01.1 | Given KV has 5 contract records / When script runs / Then all 5 keys retrieved before transformation | 5 KV keys with prefix `contratos-` | Key count = 5, all keys collected before first transform call |
| MA-AT-02 | CA-01.2 | Given KV has no contract keys / When script runs / Then script completes with 0 successes, 0 errors | Empty KV namespace | Success file = `[]`, error file = `[]` |
| MA-AT-03 | CA-02.1 | Given a valid contract key / When system reads it / Then full JSON object returned | Valid KV key pointing to JSON record | Parsed object matches stored JSON |
| MA-AT-04 | CA-02.2 | Given a key with invalid JSON / When system reads it / Then record added to errors, processing continues | KV key with value `"not json"` | Error list contains entry with reason, next record still processed |
| MA-AT-05 | CA-03.1 | Given legacy record with `id: "abc-123"` / When transformed / Then `uuid = "abc-123"` | `{ id: "abc-123", ... }` | `result.uuid === "abc-123"` |
| MA-AT-06 | CA-03.2 | Given legacy record with timestamps / When transformed / Then timestamps preserved | `{ createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-06-01T00:00:00Z" }` | `result.createdAt` and `result.updatedAt` match input |
| MA-AT-07 | CA-03.3 | Given legacy record with `clienteId: "cli-1"` / When transformed / Then `data.clientId = "cli-1"` | `{ clienteId: "cli-1" }` | `result.data.clientId === "cli-1"` |
| MA-AT-08 | CA-03.4 | Given CPA contract with non-empty equipment / When transformed / Then single-item `cpaEquipments` array | `{ hasCPAContract: true, modeloCPA: "M1", numeroSerieCPA: "S1" }` | `cpaEquipments.length === 1`, fields match, has generated `id` |
| MA-AT-09 | CA-03.5 | Given no CPA contract / When transformed / Then `cpaEquipments = []` | `{ hasCPAContract: false }` | `cpaEquipments.length === 0` |
| MA-AT-10 | CA-03.6 | Given S&H contract with non-empty equipment / When transformed / Then single-item `shEquipments` array | `{ hasSHContract: true, modeloPSO: "M2", numeroSeriePSO: "S2", softwarePSO: "SW1" }` | `shEquipments.length === 1`, fields match including `software` |
| MA-AT-11 | CA-03.7 | Given no S&H contract / When transformed / Then `shEquipments = []` | `{ hasSHContract: false }` | `shEquipments.length === 0` |
| MA-AT-12 | CA-03.8 | Given S&H-only contract with shared service details / When transformed / Then details mapped to S&H fields | `{ hasSHContract: true, hasCPAContract: false, horasAssistenciaAnual: 10 }` | `horasAssistenciaAnualSH === 10`, `horasAssistenciaAnualCPA === 0` |
| MA-AT-13 | CA-03.9 | Given CPA-only contract with shared service details / When transformed / Then details mapped to CPA fields | `{ hasCPAContract: true, hasSHContract: false, horasAssistenciaAnual: 10 }` | `horasAssistenciaAnualCPA === 10`, `horasAssistenciaAnualSH === 0` |
| MA-AT-14 | CA-03.10 | Given both contract types active / When transformed / Then shared details go to S&H, CPA = 0 | `{ hasCPAContract: true, hasSHContract: true, deslocacoesPorAno: 5 }` | `deslocacoesPorAnoSH === 5`, `deslocacoesPorAnoCPA === 0` |
| MA-AT-15 | CA-03.11 | Given any valid legacy record / When transformed / Then BaseContent wrapper fields set | Any valid record | `contentType === 'contracts'`, `version === 1`, `isDeleted === false`, `createdBy === 'migration'`, `updatedBy === 'migration'` |
| MA-AT-16 | CA-03.12 | Given legacy record with `temCPA: true` but no `hasCPAContract` / When transformed / Then `hasCPAContract = true` | `{ temCPA: true }` (no `hasCPAContract`) | `result.data.hasCPAContract === true` |
| MA-AT-17 | CA-03.13 | Given legacy record with empty string optional fields / When transformed / Then empty strings preserved | `{ distanceCPA: "", modalidadePagamentoCPA: "" }` | `data.distanceCPA === ""`, `data.modalidadePagamentoCPA === ""` |
| MA-AT-18 | CA-04.1 | Given transformed record / When written to R2 / Then stored at correct key | Record with `uuid: "abc-123"` | R2 PUT called with key `content/contracts/abc-123.json` |
| MA-AT-19 | CA-04.2 | Given R2 write fails / When error caught / Then record added to errors, processing continues | R2 returns HTTP 500 | Error list contains entry, next record processed |
| MA-AT-20 | CA-05.1 | Given 3 contracts migrated / When index updated / Then index contains those 3 | 3 successful records | Index has 3 items with correct fields |
| MA-AT-21 | CA-05.2 | Given index update fails / When error caught / Then operator notified, output files still written | R2 index write returns 500 | Console error logged, both output files exist |
| MA-AT-22 | CA-06.1 | Given contract written with valid `clientId` / When client updated / Then `contratoId` set and `updatedAt` refreshed | Contract `uuid: "c1"`, client exists | Client `data.contratoId === "c1"`, `updatedAt` is recent |
| MA-AT-23 | CA-06.2 | Given `clientId` points to non-existent client / When update attempted / Then failure logged, contract still success | `clientId: "missing"` | Warning in errors list, contract in success list |
| MA-AT-24 | CA-06.3 | Given client update write fails / When error caught / Then failure logged, contract still success | Client read OK, write fails | Warning in errors list, contract in success list |
| MA-AT-25 | CA-07.1 | Given 3 contracts migrated / When script completes / Then success file has 3 objects | 3 successful migrations | File contains array of 3 objects with `uuid`, `clientId`, contract types |
| MA-AT-26 | CA-07.2 | Given 0 contracts migrated / When script completes / Then success file has empty array | No successful migrations | File contains `[]` |
| MA-AT-27 | CA-08.1 | Given 2 records failed / When script completes / Then error file has 2 objects | 2 failed records | File contains array of 2 objects with `id` and `reason` |
| MA-AT-28 | CA-08.2 | Given 0 records failed / When script completes / Then error file has empty array | No failures | File contains `[]` |
| MA-AT-29 | CA-09.1 | Given script completes with mixed results / When summary printed / Then all counters shown | total=5, successes=3, errors=2, clientUpdates=3 | Console output includes all 4 counters + 2 file paths |
