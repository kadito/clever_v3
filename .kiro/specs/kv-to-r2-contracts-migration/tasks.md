# Tasks — KV to R2 Contracts Migration

- [x] 1. Create migration script scaffold with environment validation
  - Design ref: [Script Architecture Overview](design.md#1-script-architecture-overview)
  - Covers: REQ-01, REQ-02, REQ-04, REQ-07, REQ-08, REQ-09
  - Test ref: [MI-IT-31](tests.md#mi--executable-plan)
  - Done when: `scripts/contracts/migrate-contracts.ts` exists, validates `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `R2_BUCKET_NAME`, `KV_NAMESPACE_ID` and exits with error message if any is missing

- [x] 2. Implement `listKvKeys()` with pagination
  - Design ref: [Cloudflare API Contracts — KV Read & R2 Write](design.md#4-cloudflare-api-contracts--kv-read--r2-write)
  - Covers: REQ-01, CA-01.1, CA-01.2
  - Test ref: [MI-IT-01](tests.md#mi--executable-plan), [MI-IT-02](tests.md#mi--executable-plan), [MI-IT-03](tests.md#mi--executable-plan), [MI-IT-04](tests.md#mi--executable-plan)
  - Done when: function lists all KV keys with prefix `contratos-`, handles pagination via cursor, returns empty array for empty namespace, throws on API error

- [x] 3. Implement `readKvValue()` with error handling
  - Design ref: [Cloudflare API Contracts — KV Read & R2 Write](design.md#4-cloudflare-api-contracts--kv-read--r2-write)
  - Covers: REQ-02, CA-02.1, CA-02.2
  - Test ref: [MI-IT-05](tests.md#mi--executable-plan), [MI-IT-06](tests.md#mi--executable-plan), [MI-IT-07](tests.md#mi--executable-plan)
  - Done when: function reads KV value, parses JSON, returns `{ error: true, reason }` on read failure or invalid JSON

- [x] 4. Implement `writeR2Object()` and `readR2Object()` — R2 API layer
  - Design ref: [Cloudflare API Contracts — KV Read & R2 Write](design.md#4-cloudflare-api-contracts--kv-read--r2-write)
  - Covers: REQ-04, CA-04.1, CA-04.2
  - Test ref: [MI-IT-18](tests.md#mi--executable-plan), [MI-IT-19](tests.md#mi--executable-plan)
  - Done when: `writeR2Object()` writes JSON to R2 at a given key, returns `{ error: true, reason }` on failure; `readR2Object()` reads JSON from R2, returns parsed object or error

- [x] 5. Implement `transformRecord()` — field mapping and validation
  - Design ref: [Transformation Logic — Field Mapping & Business Rules](design.md#3-transformation-logic--field-mapping--business-rules)
  - Covers: REQ-03, CA-03.1 through CA-03.13
  - Test ref: [MI-IT-08](tests.md#mi--executable-plan) through [MI-IT-17](tests.md#mi--executable-plan)
  - Done when: pure function transforms legacy record to `BaseContent<ContractData>`, handles `hasCPAContract`/`temCPA` fallback, builds equipment arrays, assigns shared service details to active contract type, validates required fields (`id`, `clienteId`, active contract type), returns error object on validation failure

- [x] 6. Implement contract index build and merge logic
  - Design ref: [Index Update Strategy](design.md#5-index-update-strategy)
  - Covers: REQ-05, CA-05.1, CA-05.2
  - Test ref: [MI-IT-20](tests.md#mi--executable-plan), [MI-IT-21](tests.md#mi--executable-plan), [MI-IT-22](tests.md#mi--executable-plan)
  - Done when: function builds index items from migrated records (with `searchableText`), reads existing index via `readR2Object()` (handles 404 as empty), deduplicates by UUID, sorts by `createdAt` desc, writes merged index via `writeR2Object()`; logs error on failure without blocking output files

- [x] 7. Implement `updateClientContratoId()` — client sync logic
  - Design ref: [Client Sync — contratoId Update](design.md#6-client-sync--contratoid-update)
  - Covers: REQ-06, CA-06.1, CA-06.2, CA-06.3
  - Test ref: [MI-IT-23](tests.md#mi--executable-plan), [MI-IT-24](tests.md#mi--executable-plan), [MI-IT-25](tests.md#mi--executable-plan)
  - Done when: function reads client via `readR2Object()`, sets `data.contratoId` and refreshes `updatedAt`, writes back via `writeR2Object()`; returns warning string on client not found or write failure; never affects contract success count

- [x] 8. Implement output file writers and console summary
  - Design ref: [Error Handling & Output Files](design.md#7-error-handling--output-files)
  - Covers: REQ-07, CA-07.1, CA-07.2, REQ-08, CA-08.1, CA-08.2, REQ-09, CA-09.1
  - Test ref: [MI-IT-26](tests.md#mi--executable-plan) through [MI-IT-30](tests.md#mi--executable-plan)
  - Done when: `writeOutputFiles()` writes `scripts/contracts/migration-success.json` and `scripts/contracts/migration-errors.json` (empty arrays when no records); `printSummary()` prints total, successes, errors, client updates, and file paths

- [x] 9. Wire `migrateContracts()` orchestrator — end-to-end flow
  - Design ref: [Script Architecture Overview](design.md#1-script-architecture-overview)
  - Covers: REQ-01 through REQ-09
  - Test ref: [MI-IT-31](tests.md#mi--executable-plan), [MI-IT-32](tests.md#mi--executable-plan), [MI-IT-33](tests.md#mi--executable-plan)
  - Done when: orchestrator calls all functions in sequence (validate env → list keys → for each: read → transform → write → update client → build index → write output files → print summary), handles fatal errors (exit immediately) vs per-record errors (continue), output files always written

- [x] 10. Integration tests [MI]
  - Design ref: [Script Architecture Overview](design.md#1-script-architecture-overview)
  - Covers: REQ-01 through REQ-09
  - Test ref: [MI-IT-01](tests.md#mi--executable-plan) through [MI-IT-33](tests.md#mi--executable-plan)
  - Done when: all 33 MI test cases pass with mocked Cloudflare API responses, using Vitest + fast-check for property-based tests on `transformRecord()`

- [x] 11. Acceptance tests [MA]
  - Design ref: [Script Architecture Overview](design.md#1-script-architecture-overview)
  - Covers: CA-01.1 through CA-09.1
  - Test ref: [MA-AT-01](tests.md#ma--executable-plan) through [MA-AT-29](tests.md#ma--executable-plan)
  - Done when: all 29 MA test cases pass, verifying end-to-end behavior with mocked external APIs
