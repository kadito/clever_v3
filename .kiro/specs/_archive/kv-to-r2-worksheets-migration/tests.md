# Tests — KV to R2 Work Sheets Migration

## [MI] — Strategy

| Interface | Test scope | Mocked dependencies | REQ-ID |
|-----------|-----------|---------------------|--------|
| `listKvKeys(year)` | KV key listing with year-based prefix pagination — collects all keys across multiple pages and years | Cloudflare KV API (HTTP responses) | REQ-01 |
| `readKvValue(key)` | Single KV value read — returns parsed JSON or error object | Cloudflare KV API (HTTP responses) | REQ-02 |
| `buildClientLookupMap(indexItems)` | Client lookup map construction — case-insensitive commercialName → uuid mapping, duplicate handling | R2 read (clients index JSON) | REQ-03 |
| `resolveClientId(record, lookupMap)` | Client ID resolution — matches commercialName in lookup map or returns error | Client lookup map (in-memory) | REQ-04 |
| `transformRecord(legacyRecord, clientId)` | Full record transformation — BaseContent wrapper, field mapping, defaults, dropped fields, technician as string | None (pure function) | REQ-05 |
| `writeR2Object(record)` | Single R2 object write — puts transformed record at correct key path | Cloudflare R2 API (HTTP responses) | REQ-06 |
| `updateWorkSheetsIndex(successItems, existingIndex)` | Index merge — accumulates items, merges with existing, writes once | R2 read/write (index JSON) | REQ-07 |
| `buildSuccessEntry(record, legacyRecord)` | Success output entry construction — extracts uuid, clientId, clientName, assistanceDate, technician | None (pure function) | REQ-08 |
| `buildErrorEntry(key, reason)` | Error output entry construction — captures id/key and reason string | None (pure function) | REQ-09 |
| `printSummary(stats)` | Console summary output — total, successes, errors, years, file paths | Console (stdout) | REQ-10 |
| `main()` | End-to-end orchestration — env validation, client lookup, KV iteration, transform pipeline, index update, output files | All external APIs (KV, R2, filesystem) | REQ-01 through REQ-10 |

## [MI] — Executable plan

### listKvKeys

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-01 | `listKvKeys(year)` | Nominal — single page of keys for one year | API returns 3 keys with `count < 1000` | Array of 3 key names | REQ-01 |
| MI-02 | `listKvKeys(year)` | Pagination — multiple pages for one year | First page returns 1000 keys + cursor, second page returns 5 keys | Array of 1005 key names | REQ-01 |
| MI-03 | `listKvKeys(year)` | Empty year — no keys for prefix | API returns 0 keys | Empty array, no error | REQ-01 |
| MI-04 | `listKvKeys(year)` | API error — HTTP 401/403 | API returns HTTP 403 | Throws error with descriptive message | REQ-01 |
| MI-05 | `listKvKeys(year)` | API error — HTTP 404 namespace not found | API returns HTTP 404 | Throws error "KV namespace not found" | REQ-01 |

### readKvValue

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-06 | `readKvValue(key)` | Nominal — valid JSON value | API returns valid JSON string | Parsed JSON object | REQ-02 |
| MI-07 | `readKvValue(key)` | Error — HTTP error on read | API returns HTTP 500 | Error object `{ error: true, reason: "read failed: HTTP 500" }` | REQ-02 |
| MI-08 | `readKvValue(key)` | Error — invalid JSON value | API returns non-JSON string | Error object `{ error: true, reason: "invalid JSON: ..." }` | REQ-02 |
| MI-09 | `readKvValue(key)` | Error — network failure | Fetch throws network error | Error object `{ error: true, reason: "read failed: ..." }` | REQ-02 |

### buildClientLookupMap

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-10 | `buildClientLookupMap(indexItems)` | Nominal — unique commercialNames | 3 clients with distinct names | Map with 3 entries, keys lowercased | REQ-03 |
| MI-11 | `buildClientLookupMap(indexItems)` | Duplicate commercialName (case-insensitive) | 2 clients with same name different case | Map has 1 entry (last wins), warning logged | REQ-03 |
| MI-12 | `buildClientLookupMap(indexItems)` | Empty index | Empty items array | Empty map | REQ-03 |

### resolveClientId

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-13 | `resolveClientId(record, lookupMap)` | Nominal — client found | Record with `client.commercialName` matching map entry | Resolved uuid string | REQ-04 |
| MI-14 | `resolveClientId(record, lookupMap)` | Case-insensitive match | Record with "ACME Corp", map has "acme corp" | Resolved uuid string | REQ-04 |
| MI-15 | `resolveClientId(record, lookupMap)` | Client not found | Record with commercialName not in map | Error object with reason "client not found: {name}" | REQ-04 |

### transformRecord

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-16 | `transformRecord(legacyRecord, clientId)` | Nominal — full record with all fields | Complete legacy record + clientId | BaseContent wrapper with all fields mapped, `contentType: 'work-sheets'`, `version: 1`, `isDeleted: false`, `createdBy: 'migration'`, `updatedBy: 'migration'` | REQ-05 |
| MI-17 | `transformRecord(legacyRecord, clientId)` | UUID mapping | Legacy record with `id: "abc123"` | New record with `uuid: "abc123"` | REQ-05 |
| MI-18 | `transformRecord(legacyRecord, clientId)` | Timestamp preservation | Legacy record with `createdAt` and `updatedAt` | Same timestamps in new record | REQ-05 |
| MI-19 | `transformRecord(legacyRecord, clientId)` | Request fields mapping | Legacy record with full `request` sub-object | All 7 request fields mapped to `data.request` | REQ-05 |
| MI-20 | `transformRecord(legacyRecord, clientId)` | Displacement — core fields kept, price fields dropped | Legacy record with displacement including `roundTripKm`, `displacementCost`, etc. | Core 5 fields mapped to `data.displacement`, price fields absent | REQ-05 |
| MI-21 | `transformRecord(legacyRecord, clientId)` | Displacement absent — defaults applied | Legacy record without `displacement` sub-object | `data.displacement` with defaults: `hasDisplacement: false`, `weekendHoliday: false`, `oneWayKms: 0`, `totalKms: 0`, `paymentMethod: 'PENDENTE'` | REQ-05 |
| MI-22 | `transformRecord(legacyRecord, clientId)` | OtherData — technician preserved as string | Legacy record with `otherData.technician: "João Silva"` | `data.otherData.technician: "João Silva"` (plain string, not TechnicianUser) | REQ-05 |
| MI-23 | `transformRecord(legacyRecord, clientId)` | OtherData — non-enum serviceType preserved | Legacy record with `otherData.serviceType: "ASSISTÊNCIA REMOTA"` | `data.otherData.serviceType: "ASSISTÊNCIA REMOTA"` | REQ-05 |
| MI-24 | `transformRecord(legacyRecord, clientId)` | OtherData — clientSignature base64 preserved | Legacy record with base64 clientSignature | Same base64 string in `data.otherData.clientSignature` | REQ-05 |
| MI-25 | `transformRecord(legacyRecord, clientId)` | Optional string fields default to empty string | Legacy record with missing optional string fields | Missing strings default to `''` | REQ-05 |
| MI-26 | `transformRecord(legacyRecord, clientId)` | Optional boolean fields default to false | Legacy record with missing optional boolean fields | Missing booleans default to `false` | REQ-05 |
| MI-27 | `transformRecord(legacyRecord, clientId)` | Optional number fields default to 0 | Legacy record with missing optional number fields | Missing numbers default to `0` | REQ-05 |

### writeR2Object

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-28 | `writeR2Object(record)` | Nominal — successful write | Valid transformed record | Success (HTTP 200) | REQ-06 |
| MI-29 | `writeR2Object(record)` | Correct key path | Record with `uuid: "abc123"` | PUT to `content/work-sheets/abc123.json` | REQ-06 |
| MI-30 | `writeR2Object(record)` | Error — HTTP error on write | API returns HTTP 500 | Error object `{ error: true, reason: "write failed: HTTP 500" }` | REQ-06 |

### updateWorkSheetsIndex

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-31 | `updateWorkSheetsIndex(successItems, existingIndex)` | Nominal — merge with existing index | 3 new items + existing index with 2 items | Merged index with 5 items | REQ-07 |
| MI-32 | `updateWorkSheetsIndex(successItems, existingIndex)` | Overwrite existing uuid | New item with same uuid as existing | Existing item overwritten, total count unchanged | REQ-07 |
| MI-33 | `updateWorkSheetsIndex(successItems, existingIndex)` | No existing index | 3 new items, no existing index | New index with 3 items | REQ-07 |
| MI-34 | `updateWorkSheetsIndex(successItems, existingIndex)` | Searchable text construction | Item with reason, serviceType, technician | `searchableText` contains all terms lowercased | REQ-07 |
| MI-35 | `updateWorkSheetsIndex(successItems, existingIndex)` | Index write failure | R2 write returns error | Error logged, function returns error indicator | REQ-07 |

### buildSuccessEntry

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-36 | `buildSuccessEntry(record, legacyRecord)` | Nominal — all fields extracted | Transformed record + legacy record | Object with `uuid`, `clientId`, `clientName`, `assistanceDate`, `technician` | REQ-08 |
| MI-37 | `buildSuccessEntry(record, legacyRecord)` | Missing optional fields | Record with missing assistanceDate/technician | Fields default to empty string | REQ-08 |

### buildErrorEntry

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-38 | `buildErrorEntry(key, reason)` | Nominal — error entry construction | Key `"folhas-obra-2024-abc"`, reason `"client not found: ACME"` | `{ id: "folhas-obra-2024-abc", reason: "client not found: ACME" }` | REQ-09 |

### printSummary

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-39 | `printSummary(stats)` | Nominal — all counters displayed | `{ total: 10, successes: 8, errors: 2, years: [2024, 2025] }` | Console output with all fields from design §6 format | REQ-10 |

### main (orchestration)

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-40 | `main()` | Fatal — missing env vars | `CF_API_TOKEN` not set | Process exits with error, no output files | REQ-01–10 |
| MI-41 | `main()` | Fatal — clients index unreadable | R2 returns 404 for clients index | Process exits with error, no output files | REQ-03 |
| MI-42 | `main()` | Nominal — full pipeline with mixed results | 3 KV records: 2 valid, 1 with missing client | 2 successes, 1 error, index updated, both output files written, summary printed | REQ-01–10 |
| MI-43 | `main()` | Edge — zero records found | All year prefixes return empty | Empty output files, summary shows 0/0/0 | REQ-01–10 |
| MI-44 | `main()` | Index update failure — output files still written | Index write fails | Error logged, success/error files still written | REQ-07 |

## [MA] — Executable plan

| Test ID | CA-ID | Given / When / Then | Data | Pass criterion |
|---------|-------|---------------------|------|----------------|
| MA-01 | CA-01.1 | Given KV has 5 records across 2024 and 2025 / When script runs / Then all 5 keys retrieved before transformation | 3 keys in 2024, 2 keys in 2025 | All 5 keys collected in single array |
| MA-02 | CA-01.2 | Given year 2025 has no keys / When script processes 2025 / Then moves to 2026 without error | Empty result for 2025 prefix | No error thrown, next year processed |
| MA-03 | CA-01.3 | Given no year has any keys / When script completes / Then 0 successes, 0 errors | All year prefixes return empty | Output files contain empty arrays |
| MA-04 | CA-02.1 | Given valid KV key / When system reads it / Then full JSON returned | Key `folhas-obra-2024-abc` with valid JSON value | Parsed object matches stored value |
| MA-05 | CA-02.2 | Given KV key with invalid JSON / When system reads it / Then added to errors, processing continues | Key with value `"not json {"` | Error entry with reason containing "invalid JSON", next record processed |
| MA-06 | CA-03.1 | Given clients index with 3 clients / When lookup map built / Then each commercialName maps to uuid | 3 clients with distinct names | Map has 3 entries, correct uuid for each |
| MA-07 | CA-03.2 | Given clients index unreadable / When script starts / Then exits immediately | R2 returns HTTP 404 | Process exits, no output files |
| MA-08 | CA-03.3 | Given 2 clients with same commercialName / When map built / Then last wins, warning logged | "ACME" appears twice with different uuids | Map has 1 entry with second uuid, console warning |
| MA-09 | CA-04.1 | Given record with matching commercialName / When resolution runs / Then clientId set to uuid | Record with "ACME", map has "acme" → "uuid-1" | `clientId: "uuid-1"` |
| MA-10 | CA-04.2 | Given record with unknown commercialName / When resolution runs / Then added to errors | Record with "Unknown Corp" not in map | Error with reason "client not found: Unknown Corp" |
| MA-11 | CA-05.1 | Given legacy record with `id: "abc"` / When transformed / Then `uuid: "abc"` | Legacy `id` field | New record `uuid` equals legacy `id` |
| MA-12 | CA-05.2 | Given legacy record with timestamps / When transformed / Then timestamps preserved | `createdAt: "2024-01-15T10:00:00Z"` | Same value in new record |
| MA-13 | CA-05.3 | Given legacy record with request sub-object / When transformed / Then all request fields mapped | Full request with 7 fields | All 7 fields present in `data.request` |
| MA-14 | CA-05.4 | Given legacy displacement with price fields / When transformed / Then core fields kept, price fields dropped | Displacement with `roundTripKm`, `displacementCost`, etc. | 5 core fields in `data.displacement`, no price fields |
| MA-15 | CA-05.5 | Given legacy otherData with string technician / When transformed / Then preserved as string | `technician: "João Silva"` | `data.otherData.technician: "João Silva"` |
| MA-16 | CA-05.6 | Given legacy serviceType "ASSISTÊNCIA REMOTA" / When transformed / Then preserved as-is | Non-enum value | Same value in `data.otherData.serviceType` |
| MA-17 | CA-05.7 | Given legacy clientSignature with base64 / When transformed / Then preserved as-is | Base64 PNG string | Same string in `data.otherData.clientSignature` |
| MA-18 | CA-05.8 | Given any legacy record / When transformed / Then wrapper fields set | Any valid record | `contentType: 'work-sheets'`, `version: 1`, `isDeleted: false`, `createdBy: 'migration'`, `updatedBy: 'migration'` |
| MA-19 | CA-06.1 | Given transformed record / When written / Then stored at correct path | Record with `uuid: "abc"` | R2 PUT to `content/work-sheets/abc.json` |
| MA-20 | CA-06.2 | Given write fails / When error caught / Then added to errors, continues | R2 returns HTTP 500 | Error entry, next record processed |
| MA-21 | CA-07.1 | Given 3 successful migrations / When index updated / Then index contains those 3 | 3 transformed records | `indexes/work-sheets-index.json` has 3 items |
| MA-22 | CA-07.2 | Given index update fails / When error caught / Then operator notified, output files written | R2 index write fails | Console error, both output files exist |
| MA-23 | CA-08.1 | Given 2 successful migrations / When script completes / Then success file has 2 entries | 2 records migrated | `migration-success.json` has 2 objects with `uuid`, `clientId`, `clientName`, `assistanceDate`, `technician` |
| MA-24 | CA-08.2 | Given 0 successes / When script completes / Then success file has empty array | No records migrated | `migration-success.json` contains `[]` |
| MA-25 | CA-09.1 | Given 1 record failed / When script completes / Then error file has 1 entry | 1 failed record | `migration-errors.json` has 1 object with `id` and `reason` |
| MA-26 | CA-09.2 | Given 0 errors / When script completes / Then error file has empty array | All records succeeded | `migration-errors.json` contains `[]` |
| MA-27 | CA-10.1 | Given script completes / When summary printed / Then all counters shown | Mixed results | Console shows total, successes, errors, years scanned, file paths |
