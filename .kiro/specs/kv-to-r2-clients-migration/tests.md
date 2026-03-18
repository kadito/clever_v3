
---

## [MI] — Executable plan

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-IT-01 | `listKvKeys` | Returns all keys from single page | Namespace with 3 `clientes-` keys, no cursor | Array of 3 key names | REQ-01 |
| MI-IT-02 | `listKvKeys` | Paginates across multiple pages | Namespace with 1500 keys (2 pages) | Array of 1500 key names | REQ-01 |
| MI-IT-03 | `listKvKeys` | Returns empty array when no matching keys | Namespace with 0 `clientes-` keys | Empty array `[]` | REQ-01 |
| MI-IT-04 | `listKvKeys` | Exits on HTTP 401 | KV API returns 401 | Throws fatal error "KV namespace not accessible: HTTP 401" | REQ-01 |
| MI-IT-05 | `listKvKeys` | Exits on HTTP 403 | KV API returns 403 | Throws fatal error "KV namespace not accessible: HTTP 403" | REQ-01 |
| MI-IT-06 | `listKvKeys` | Exits on HTTP 404 | KV API returns 404 | Throws fatal error "KV namespace not found" | REQ-01 |
| MI-IT-07 | `listKvKeys` | Exits on network error | fetch throws network error | Throws fatal error "Network error listing KV keys: {message}" | REQ-01 |
| MI-IT-08 | `readKvValue` | Returns parsed JSON on success | Valid JSON string in KV | Parsed JavaScript object | REQ-02 |
| MI-IT-09 | `readKvValue` | Returns error record on HTTP 4xx | KV returns 404 for key | Error object with `reason: "read failed: HTTP 404"` | REQ-02 |
| MI-IT-10 | `readKvValue` | Returns error record on HTTP 5xx | KV returns 500 for key | Error object with `reason: "read failed: HTTP 500"` | REQ-02 |
| MI-IT-11 | `readKvValue` | Returns error record on invalid JSON | KV returns non-JSON string | Error object with `reason` starting "invalid JSON:" | REQ-02 |
| MI-IT-12 | `readKvValue` | Returns error record on network error | fetch throws for key | Error object with `reason` starting "read failed:" | REQ-02 |
| MI-IT-13 | `transformRecord` | Maps all fields correctly | Full legacy record with all fields | New record with `uuid`, `contentType: 'clients'`, `version: 1`, `isDeleted: false`, `createdBy: 'migration'`, `updatedBy: 'migration'`, all data fields mapped | REQ-03 |
| MI-IT-14 | `transformRecord` | Preserves `id` as `uuid` | Legacy record with `id: 'abc-123'` | New record with `uuid: 'abc-123'` | REQ-03 |
| MI-IT-15 | `transformRecord` | Preserves timestamps | Legacy record with `createdAt` and `updatedAt` | New record with same timestamps | REQ-03 |
| MI-IT-16 | `transformRecord` | Defaults missing booleans to false | Legacy record without boolean flags | All boolean flags set to `false` | REQ-03 |
| MI-IT-17 | `transformRecord` | Defaults missing `softwares` to empty array | Legacy record without `softwares` field | `data.softwares: []` | REQ-03 |
| MI-IT-18 | `transformRecord` | Returns error for missing `nomeEmpresa` | Legacy record without `nomeEmpresa` | Error object with `reason: "required field missing: nomeEmpresa"` | REQ-03 |
| MI-IT-19 | `transformRecord` | Returns error for missing `nomeComercial` | Legacy record without `nomeComercial` | Error object with `reason: "required field missing: nomeComercial"` | REQ-03 |
| MI-IT-20 | `transformRecord` | Returns error for missing `id` | Legacy record without `id` | Error object with `reason: "required field missing: id"` | REQ-03 |
| MI-IT-21 | `transformRecord` | Preserves legacy boolean flags | Legacy record with `vectron: true`, `dreamSoft: false` | New record with same flag values in `data` | REQ-03 |
| MI-IT-22 | `transformRecord` | Coerces non-boolean flag values | Legacy record with `vectron: 1` | `data.vectron: true` (Boolean coercion) | REQ-03 |
| MI-IT-23 | `writeR2Object` | Writes record at correct key | Transformed record with `uuid: 'abc-123'` | PUT to `content/clients/abc-123.json`, returns success | REQ-04 |
| MI-IT-24 | `writeR2Object` | Returns error record on HTTP 4xx write | R2 returns 422 for PUT | Error object with `reason: "write failed: HTTP 422"` | REQ-04 |
| MI-IT-25 | `writeR2Object` | Returns error record on HTTP 5xx write | R2 returns 503 for PUT | Error object with `reason: "write failed: HTTP 503"` | REQ-04 |
| MI-IT-26 | `writeR2Object` | Exits on HTTP 401 | R2 returns 401 | Throws fatal error "R2 bucket not accessible: HTTP 401" | REQ-04 |
| MI-IT-27 | `writeR2Object` | Exits on HTTP 404 on first write | R2 returns 404 on first write | Throws fatal error "R2 bucket not found" | REQ-04 |
| MI-IT-28 | `writeR2Object` | Returns error record on network error | fetch throws for PUT | Error object with `reason` starting "write failed:" | REQ-04 |
| MI-IT-29 | `buildIndexItem` | Produces correct index item shape | New client record with all fields | Index item with `uuid`, `contentType`, `createdAt`, `updatedAt`, `isDeleted`, `searchableText`, `nomeEmpresa`, `nomeComercial`, `softwareNames`, `softwareProducts` | REQ-05 |
| MI-IT-30 | `buildIndexItem` | Applies field defaults for optional fields | New record with missing optional fields | Index item with empty strings for optional fields, `false` for boolean flags | REQ-05 |
| MI-IT-31 | `buildIndexItem` | Extracts software names and products | New record with 2 softwares | `softwareNames` and `softwareProducts` arrays populated correctly | REQ-05 |
| MI-IT-32 | `writeR2Index` | Writes correct index JSON | Accumulator with 3 items | PUT to `indexes/clients-index.json` with `contentType: 'clients'`, `lastUpdated`, `items` array of 3 | REQ-05 |
| MI-IT-33 | `writeR2Index` | Logs error and continues on HTTP failure | R2 returns 500 for index PUT | Logs "index update failed: HTTP 500", does not throw | REQ-05 |
| MI-IT-34 | `writeR2Index` | Logs error and continues on network error | fetch throws for index PUT | Logs "index update failed: {message}", does not throw | REQ-05 |
| MI-IT-35 | `writeOutputFiles` | Writes success file with correct shape | 2 success records | `migration-success.json` contains array of 2 objects each with `uuid`, `nomeEmpresa`, `nomeComercial` | REQ-06 |
| MI-IT-36 | `writeOutputFiles` | Writes empty success file when no successes | 0 success records | `migration-success.json` contains `[]` | REQ-06 |
| MI-IT-37 | `writeOutputFiles` | Writes error file with correct shape | 2 error records | `migration-errors.json` contains array of 2 objects each with `id` and `reason` | REQ-07 |
| MI-IT-38 | `writeOutputFiles` | Writes empty error file when no errors | 0 error records | `migration-errors.json` contains `[]` | REQ-07 |
| MI-IT-39 | `writeOutputFiles` | Logs error and continues on FS write failure | fs.writeFile throws | Logs error message, does not throw | REQ-06, REQ-07 |
| MI-IT-40 | `printSummary` | Prints all required summary lines | total=10, successes=8, errors=2 | Console output includes total, successes, errors, and both file paths | REQ-08 |
| MI-IT-41 | `run()` | Processes all records end-to-end | 3 valid KV records | All 3 written to R2, index written, both output files written, summary printed | REQ-01 through REQ-08 |
| MI-IT-42 | `run()` | Continues after per-record errors | 3 records: 1 valid, 1 invalid JSON, 1 missing required field | 1 success, 2 errors, output files written with correct counts | REQ-02, REQ-03 |
| MI-IT-43 | `run()` | Writes output files even when index fails | 2 valid records, R2 index PUT returns 500 | Output files written with 2 successes, 0 errors | REQ-05, REQ-06, REQ-07 |
| MI-IT-44 | `run()` | Exits immediately on missing env vars | `CF_API_TOKEN` not set | Process exits with "Missing required env var: CF_API_TOKEN" | REQ-01 |
| MI-IT-45 | `run()` | Exits immediately on KV auth failure | KV list returns 401 | Process exits with fatal error, no output files written | REQ-01 |

---

## [MA] — Executable plan

| Test ID | CA-ID | Given / When / Then | Data | Pass criterion |
|---------|-------|---------------------|------|----------------|
| MA-AT-01 | CA-01.1 | Given KV has N `clientes-` keys / When script runs / Then all N keys retrieved before any write | KV namespace with 5 client records | All 5 keys collected; R2 write count equals 5 |
| MA-AT-02 | CA-01.2 | Given KV has no `clientes-` keys / When script runs / Then completes with 0 successes and 0 errors | Empty KV namespace | `migration-success.json` = `[]`, `migration-errors.json` = `[]`, summary shows 0/0/0 |
| MA-AT-03 | CA-02.1 | Given valid client key exists / When system reads it / Then full JSON object returned | KV key with valid JSON value | Parsed object returned, no error record added |
| MA-AT-04 | CA-02.2 | Given key value is invalid JSON / When system reads it / Then record added to errors, processing continues | KV key with non-JSON value | Error record in `migration-errors.json` with reason starting "invalid JSON:", remaining records processed |
| MA-AT-05 | CA-03.1 | Given legacy record has `id` / When transformed / Then new record `uuid` equals legacy `id` | Legacy record with `id: 'test-uuid-1'` | New record `uuid === 'test-uuid-1'` |
| MA-AT-06 | CA-03.2 | Given legacy record has `createdAt` and `updatedAt` / When transformed / Then timestamps preserved | Legacy record with specific timestamps | New record has identical `createdAt` and `updatedAt` |
| MA-AT-07 | CA-03.3 | Given legacy record has `nomeEmpresa` and `nomeComercial` / When transformed / Then fields mapped directly | Legacy record with both fields | New record `data.nomeEmpresa` and `data.nomeComercial` match legacy values |
| MA-AT-08 | CA-03.4 | Given legacy record has `softwares` array / When transformed / Then array preserved as-is | Legacy record with 2 software entries | New record `data.softwares` has same 2 entries |
| MA-AT-09 | CA-03.5 | Given legacy record missing `nomeEmpresa` / When transformed / Then error record added, processing continues | Legacy record without `nomeEmpresa` | Error in `migration-errors.json` with reason "required field missing: nomeEmpresa" |
| MA-AT-10 | CA-03.6 | Given legacy record has boolean flags / When transformed / Then flags preserved in new schema | Legacy record with `vectron: true`, `pix: false` | New record `data.vectron === true`, `data.pix === false` |
| MA-AT-11 | CA-03.7 | Given any legacy record / When transformed / Then new record has required metadata fields | Any valid legacy record | New record has `contentType: 'clients'`, `version: 1`, `isDeleted: false`, `createdBy: 'migration'`, `updatedBy: 'migration'` |
| MA-AT-12 | CA-04.1 | Given successfully transformed record / When written to R2 / Then stored at correct key | Transformed record with `uuid: 'abc-123'` | R2 PUT called with key `content/clients/abc-123.json` |
| MA-AT-13 | CA-04.2 | Given R2 write fails / When error caught / Then record added to errors, processing continues | R2 returns 500 for one record | Error in `migration-errors.json`, remaining records processed |
| MA-AT-14 | CA-05.1 | Given N clients successfully migrated / When index updated / Then index contains those N clients | 3 valid records migrated | `indexes/clients-index.json` `items` array has 3 entries |
| MA-AT-15 | CA-05.2 | Given index update fails / When error caught / Then operator notified, output files still written | R2 index PUT returns 500 | Error logged to console, `migration-success.json` and `migration-errors.json` still written |
| MA-AT-16 | CA-06.1 | Given M clients successfully migrated / When script completes / Then success file has M objects | 3 successful migrations | `migration-success.json` has 3 objects each with `uuid`, `nomeEmpresa`, `nomeComercial` |
| MA-AT-17 | CA-06.2 | Given zero clients migrated / When script completes / Then success file has empty array | All records fail | `migration-success.json` = `[]` |
| MA-AT-18 | CA-07.1 | Given E records failed / When script completes / Then error file has E objects | 2 records fail | `migration-errors.json` has 2 objects each with `id` and `reason` |
| MA-AT-19 | CA-07.2 | Given zero records failed / When script completes / Then error file has empty array | All records succeed | `migration-errors.json` = `[]` |
| MA-AT-20 | CA-08.1 | Given script completes / When summary printed / Then includes all required fields | Any run | Console output contains total processed, successes, errors, and paths to both output files |
