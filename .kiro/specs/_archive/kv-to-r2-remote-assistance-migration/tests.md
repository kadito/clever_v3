# Tests — KV to R2 Remote Assistance Migration

## [MI] — Strategy

| Interface | Test scope | Mocked dependencies | REQ-ID |
|-----------|-----------|---------------------|--------|
| KV key listing | List keys by year prefix, pagination, empty namespace | Cloudflare KV REST API (fetch mock) | REQ-01 |
| KV value reading | Read single key, JSON parse, error handling | Cloudflare KV REST API (fetch mock) | REQ-02 |
| Client resolution | Lookup map construction, name matching (case-insensitive), missing client, duplicate names | R2 clients index (in-memory fixture) | REQ-03 |
| Data transformation | Field mapping, paymentMethod derivation, tecnicoResponsavel conversion, tipoAssistencia validation, defaults | None (pure function) | REQ-04 |
| R2 record writing | Write single record, error handling | Cloudflare R2 REST API (fetch mock) | REQ-05 |
| Index update | Index item construction, merge with existing, searchableText building | Cloudflare R2 REST API (fetch mock) | REQ-06 |
| Success output | File structure, correct fields per record, empty array case | Local filesystem (fs mock) | REQ-07 |
| Error output | File structure, correct fields per error, empty array case | Local filesystem (fs mock) | REQ-08 |
| Console summary | Summary format, correct counts, file paths | Console (spy) | REQ-09 |

## [MI] — Executable plan

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-01 | KV key listing | Nominal — keys found for multiple years | KV with 3 keys in 2024, 2 in 2025 | Returns 5 key names, yearsScanned includes both years | REQ-01 |
| MI-02 | KV key listing | Pagination — more than 1000 keys | KV returns cursor on first page | Follows cursor, returns all keys | REQ-01 |
| MI-03 | KV key listing | Empty namespace — no matching keys | KV returns empty result for all years | Returns 0 keys | REQ-01 |
| MI-04 | KV key listing | API auth error (401/403) | KV returns HTTP 401 | Throws fatal error, script exits | REQ-01 |
| MI-05 | KV key listing | Namespace not found (404) | KV returns HTTP 404 | Throws fatal error, script exits | REQ-01 |
| MI-06 | KV value reading | Nominal — valid JSON | KV returns valid JSON string | Parsed object returned | REQ-02 |
| MI-07 | KV value reading | Invalid JSON | KV returns non-JSON string | Returns error object with "invalid JSON: {parseError}" | REQ-02 |
| MI-08 | KV value reading | HTTP error on read | KV returns HTTP 500 | Returns error object with "read failed: HTTP 500" | REQ-02 |
| MI-09 | KV value reading | Network error | fetch throws network error | Returns error object with "read failed: {message}" | REQ-02 |
| MI-10 | Client resolution | Nominal — exact match on nomeComercial | `cliente: "Restaurante Raposeira"`, map has matching entry | Returns matching uuid | REQ-03 |
| MI-11 | Client resolution | Case-insensitive match | `cliente: "restaurante raposeira"` (lowercase) | Returns matching uuid | REQ-03 |
| MI-12 | Client resolution | Match on nomeEmpresa | `cliente` matches nomeEmpresa but not nomeComercial | Returns matching uuid | REQ-03 |
| MI-13 | Client resolution | Client not found | `cliente: "Unknown Client"` | Returns error with "client not found: Unknown Client" | REQ-03 |
| MI-14 | Client resolution | Missing cliente field | Record without `cliente` | Returns error with "required field missing: cliente" | REQ-03 |
| MI-15 | Client resolution | Duplicate names in map | Two clients with same nomeComercial | First entry kept, warning logged | REQ-03 |
| MI-16 | Data transformation | Nominal — all fields present | Full legacy record with all fields | Correct BaseContent wrapper + RemoteAssistanceData | REQ-04 |
| MI-17 | Data transformation | paymentMethod — contrato true | `contrato: true, garantia: false` | `paymentMethod: 'Contrato'` | REQ-04 |
| MI-18 | Data transformation | paymentMethod — garantia true | `contrato: false, garantia: true` | `paymentMethod: 'Garantia'` | REQ-04 |
| MI-19 | Data transformation | paymentMethod — both false | `contrato: false, garantia: false` | `paymentMethod: 'Faturação'` | REQ-04 |
| MI-20 | Data transformation | tecnicoResponsavel — multi-word | `"João Bernardino"` | `{ userId: 'migration', firstName: 'João', lastName: 'Bernardino', userType: 'Admin' }` | REQ-04 |
| MI-21 | Data transformation | tecnicoResponsavel — single word | `"João"` | `{ userId: 'migration', firstName: 'João', lastName: '', userType: 'Admin' }` | REQ-04 |
| MI-22 | Data transformation | tecnicoResponsavel — empty string | `""` | `{ userId: 'migration', firstName: '', lastName: '', userType: 'Admin' }` | REQ-04 |
| MI-23 | Data transformation | tipoAssistencia — valid value | `"REMOTA"` | Preserved as `'REMOTA'` | REQ-04 |
| MI-24 | Data transformation | tipoAssistencia — invalid value | `"PRESENCIAL"` | Defaults to `''` | REQ-04 |
| MI-25 | Data transformation | Default values — absent optional fields | Record missing `resolvido`, `valorAssist`, `relatorio` | `resolvido: false`, `valorAssist: 0`, `relatorio: ''` | REQ-04 |
| MI-26 | Data transformation | Hardcoded fields | Any legacy record | `contentType: 'remote-assistance'`, `version: 1`, `isDeleted: false`, `createdBy: 'migration'`, `updatedBy: 'migration'` | REQ-04 |
| MI-27 | Data transformation | Timestamps preserved | Legacy with `createdAt`, `updatedAt` | Both preserved as-is in BaseContent wrapper | REQ-04 |
| MI-28 | Data transformation | Dropped fields not present | Legacy with `quemAtendeu`, `contratoValor`, `totalComIva`, `pertenceAnoContrato` | None of these appear in output | REQ-04 |
| MI-29 | R2 record writing | Nominal — write success | Valid transformed record | HTTP PUT to correct URL, returns success | REQ-05 |
| MI-30 | R2 record writing | Correct URL and headers | Record with uuid `abc-123` | URL ends with `content/remote-assistance/abc-123.json`, Content-Type: application/json | REQ-05 |
| MI-31 | R2 record writing | Write fails — HTTP error | R2 returns HTTP 500 | Returns error object with "write failed: HTTP 500" | REQ-05 |
| MI-32 | R2 record writing | Write fails — network error | fetch throws | Returns error object with "write failed: {message}" | REQ-05 |
| MI-33 | R2 record writing | Fatal — bucket not accessible (401/403) | R2 returns HTTP 403 on first write | Throws fatal error | REQ-05 |
| MI-34 | Index update | Index item construction | Transformed record | Index item has all required fields: uuid, contentType, searchableText, clientId, etc. | REQ-06 |
| MI-35 | Index update | searchableText construction | Record with clienteName, tecnicoResponsavel, motivoPedido | searchableText contains all terms lowercased | REQ-06 |
| MI-36 | Index update | Merge — preserve existing non-migrated items | Existing index with 2 items, 3 new migrated items | Merged index has 5 items | REQ-06 |
| MI-37 | Index update | Merge — overwrite existing migrated items | Existing index has item with same uuid as migrated | Merged index replaces old item, total count correct | REQ-06 |
| MI-38 | Index update | Index write fails | R2 returns HTTP 500 on index PUT | Error logged to console, does not throw | REQ-06 |
| MI-39 | Success output | Nominal — M records | 3 successful records | JSON array with 3 objects, each with uuid, cliente, tipoAssistencia, dataAssistencia | REQ-07 |
| MI-40 | Success output | Empty — zero records | No successful records | JSON file contains `[]` | REQ-07 |
| MI-41 | Error output | Nominal — E records | 2 failed records | JSON array with 2 objects, each with id, cliente, reason | REQ-08 |
| MI-42 | Error output | Empty — zero errors | No failed records | JSON file contains `[]` | REQ-08 |
| MI-43 | Console summary | Correct format and counts | 10 total, 8 successes, 2 errors | Console output includes all counts and file paths | REQ-09 |

## [MA] — Executable plan

| Test ID | CA-ID | Given / When / Then | Data | Pass criterion |
|---------|-------|---------------------|------|----------------|
| MA-01 | CA-01.1 | Given KV has N remote assistance records for 2024–current / When script runs / Then all N keys retrieved before transformation | KV with 5 records across 2024–2025 | 5 keys returned, all with prefix `assistencias-remotas-` |
| MA-02 | CA-01.2 | Given KV has no matching keys / When script runs / Then completes with 0 successes, 0 errors | Empty KV namespace | success=0, errors=0, both output files contain `[]` |
| MA-03 | CA-02.1 | Given a valid remote assistance key / When system reads it / Then full JSON object returned | Valid KV key with JSON value | Parsed object matches stored value |
| MA-04 | CA-02.2 | Given a key with invalid JSON / When system reads it / Then record added to errors, processing continues | KV key with `"not json"` value | Error list contains entry with "invalid JSON", remaining records still processed |
| MA-05 | CA-03.1 | Given `cliente` matches one client's nomeComercial / When lookup runs / Then matching uuid used as clientId | `cliente: "Restaurante Raposeira"`, index has matching client | Transformed record has correct clientId |
| MA-06 | CA-03.2 | Given `cliente` matches no client / When lookup runs / Then record added to errors | `cliente: "Nonexistent Client"` | Error entry with "client not found: Nonexistent Client" |
| MA-07 | CA-03.3 | Given `cliente` matches multiple clients / When lookup runs / Then first match used, warning logged | Two clients with same nomeComercial | First uuid used, console.warn called |
| MA-08 | CA-04.1 | Given legacy record with `id` / When transformed / Then `uuid` equals legacy `id` | `id: "abc-123"` | `record.uuid === "abc-123"` |
| MA-09 | CA-04.2 | Given legacy record with timestamps / When transformed / Then timestamps preserved | `createdAt: "2025-01-01T00:00:00Z"` | `record.createdAt === "2025-01-01T00:00:00Z"` |
| MA-10 | CA-04.3 | Given `contrato: true` / When transformed / Then `paymentMethod: 'Contrato'` | `contrato: true, garantia: false` | `data.paymentMethod === 'Contrato'` |
| MA-11 | CA-04.4 | Given `garantia: true` / When transformed / Then `paymentMethod: 'Garantia'` | `contrato: false, garantia: true` | `data.paymentMethod === 'Garantia'` |
| MA-12 | CA-04.5 | Given both false / When transformed / Then `paymentMethod: 'Faturação'` | `contrato: false, garantia: false` | `data.paymentMethod === 'Faturação'` |
| MA-13 | CA-04.6 | Given `tecnicoResponsavel` as string / When transformed / Then TechnicianUser object created | `"João Bernardino"` | `{ userId: 'migration', firstName: 'João', lastName: 'Bernardino', userType: 'Admin' }` |
| MA-14 | CA-04.7 | Given `valorAssist` present / When transformed / Then value preserved as-is | `valorAssist: 6.25` | `data.valorAssist === 6.25` |
| MA-15 | CA-04.8 | Given any legacy record / When transformed / Then hardcoded fields set | Any record | `contentType === 'remote-assistance'`, `version === 1`, `isDeleted === false`, `createdBy === 'migration'`, `updatedBy === 'migration'` |
| MA-16 | CA-04.9 | Given invalid `tipoAssistencia` / When transformed / Then defaults to `''` | `tipoAssistencia: "PRESENCIAL"` | `data.tipoAssistencia === ''` |
| MA-17 | CA-05.1 | Given transformed record / When written to R2 / Then stored at correct key | Record with `uuid: "abc-123"` | PUT to `content/remote-assistance/abc-123.json` |
| MA-18 | CA-05.2 | Given write fails / When error caught / Then record added to errors, continues | R2 returns HTTP 500 | Error entry with "write failed", next record still processed |
| MA-19 | CA-06.1 | Given N records migrated / When index updated / Then index contains N records plus pre-existing | 3 migrated + 2 existing | Index has 5 items total |
| MA-20 | CA-06.2 | Given index update fails / When error caught / Then operator notified, output files still written | R2 returns HTTP 500 on index PUT | Console error logged, success/error files written |
| MA-21 | CA-07.1 | Given M records succeeded / When script completes / Then success file has M objects | 3 successes | `migration-success.json` has 3 objects with uuid, cliente, tipoAssistencia, dataAssistencia |
| MA-22 | CA-07.2 | Given zero successes / When script completes / Then success file has empty array | 0 successes | `migration-success.json` contains `[]` |
| MA-23 | CA-08.1 | Given E records failed / When script completes / Then error file has E objects | 2 failures | `migration-errors.json` has 2 objects with id, cliente, reason |
| MA-24 | CA-08.2 | Given zero failures / When script completes / Then error file has empty array | 0 failures | `migration-errors.json` contains `[]` |
| MA-25 | CA-09.1 | Given script completes / When summary printed / Then includes all counts and paths | 10 total, 8 success, 2 errors | Console shows total, successes, errors, file paths |