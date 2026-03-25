# Tasks — KV to R2 Licenses Migration

- [x] 1. Create migration script scaffold with environment validation
  - Design ref: [Script Architecture Overview](design.md#1-script-architecture-overview)
  - Covers: REQ-01, REQ-10
  - Test ref: [MI-48](tests.md#main-orchestration)
  - Done when: `scripts/licenses/migrate-licenses.js` exists with env var validation (`CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_KV_NAMESPACE_ID`, `CF_R2_BUCKET_NAME`), exits immediately on missing vars, and has the `main()` orchestration skeleton

- [x] 2. Implement client lookup map construction from R2 clients index
  - Design ref: [Transformation Logic — Client lookup map construction](design.md#3-transformation-logic)
  - Design ref: [Cloudflare API Contracts — Read clients index from R2](design.md#4-cloudflare-api-contracts)
  - Covers: REQ-03, CA-03.1, CA-03.2, CA-03.3
  - Test ref: [MI-11](tests.md#buildclientlookupmap), [MI-12](tests.md#buildclientlookupmap), [MI-13](tests.md#buildclientlookupmap), [MI-14](tests.md#buildclientlookupmap), [MA-06](tests.md#ma--executable-plan), [MA-07](tests.md#ma--executable-plan), [MA-08](tests.md#ma--executable-plan)
  - Done when: `buildClientLookupMap` reads `indexes/clients-index.json` from R2 via REST API, builds case-insensitive `nomeComercial → uuid` map, logs warning on duplicates (last wins), exits immediately if index unreadable

- [x] 3. Implement KV key listing with year-based prefix pagination
  - Design ref: [Cloudflare API Contracts — List KV keys endpoint, Pagination rules](design.md#4-cloudflare-api-contracts)
  - Covers: REQ-01, CA-01.1, CA-01.2, CA-01.3
  - Test ref: [MI-01](tests.md#listkvkeys) through [MI-06](tests.md#listkvkeys), [MA-01](tests.md#ma--executable-plan), [MA-02](tests.md#ma--executable-plan), [MA-03](tests.md#ma--executable-plan)
  - Done when: `listKvKeys` iterates prefixes `licencas-2021-` through `licencas-{currentYear}-`, handles pagination via cursor, collects all keys across all years, skips empty years without error, throws fatal on 401/403/404

- [x] 4. Implement KV value reading with error handling
  - Design ref: [Cloudflare API Contracts — Read single KV value endpoint, Error handling](design.md#4-cloudflare-api-contracts)
  - Covers: REQ-02, CA-02.1, CA-02.2
  - Test ref: [MI-07](tests.md#readkvvalue) through [MI-10](tests.md#readkvvalue), [MA-04](tests.md#ma--executable-plan), [MA-05](tests.md#ma--executable-plan)
  - Done when: `readKvValue` reads a single KV value, parses JSON, returns error object `{ error: true, reason }` on HTTP error, invalid JSON, or network failure

- [x] 5. Implement pre-transformation validation and clientId resolution
  - Design ref: [Transformation Logic — Pre-transformation validation, Client resolution](design.md#3-transformation-logic)
  - Covers: REQ-04, CA-04.1, CA-04.2, CA-04.3, CA-04.4
  - Test ref: [MI-15](tests.md#resolveclientid) through [MI-19](tests.md#resolveclientid), [MA-09](tests.md#ma--executable-plan) through [MA-12](tests.md#ma--executable-plan)
  - Done when: `resolveClientId` implements two-step strategy (use clientId directly if present, else lookup cliente in map), returns error for missing/unresolved clients

- [x] 6. Implement record transformation (legacy schema to BaseContent + LicenseData)
  - Design ref: [Data Models](design.md#2-data-models--legacy-kv-schema--new-r2-schema), [Transformation Logic — Field mapping](design.md#3-transformation-logic)
  - Covers: REQ-05, CA-05.1, CA-05.2, CA-05.3, CA-05.4, CA-05.5, CA-05.6, CA-05.7, CA-05.8
  - Test ref: [MI-20](tests.md#transformrecord) through [MI-29](tests.md#transformrecord), [MA-13](tests.md#ma--executable-plan) through [MA-20](tests.md#ma--executable-plan)
  - Done when: `transformRecord` maps all fields per design — BaseContent wrapper fields, `data.software` with defaults, `data.invoices` preserved as-is, license period fields with defaults, drops `tipoSoftware` and `cliente`, sets fixed fields (`contentType`, `version`, `isDeleted`, `createdBy`, `updatedBy`)

- [x] 7. Implement R2 object writing
  - Design ref: [Cloudflare API Contracts — Write R2 object endpoint](design.md#4-cloudflare-api-contracts)
  - Covers: REQ-06, CA-06.1, CA-06.2
  - Test ref: [MI-30](tests.md#writer2object) through [MI-33](tests.md#writer2object), [MA-21](tests.md#ma--executable-plan), [MA-22](tests.md#ma--executable-plan)
  - Done when: `writeR2Object` PUTs transformed record to `content/licenses/{uuid}.json` via R2 REST API, returns error object on non-fatal failure, throws on 401/403/404

- [x] 8. Implement licenses index update with merge strategy and status calculation
  - Design ref: [Index Update Strategy](design.md#5-index-update-strategy)
  - Covers: REQ-07, CA-07.1, CA-07.2, CA-07.3
  - Test ref: [MI-34](tests.md#updatelicensesindex) through [MI-41](tests.md#calculatelicensestatus), [MA-23](tests.md#ma--executable-plan) through [MA-25](tests.md#ma--executable-plan)
  - Done when: script reads existing index from R2, merges migrated items (overwrite on same uuid, preserve untouched), calculates license status from `dataVencimento` (expired/expiring/active), builds `searchableText`, writes merged index once, logs error on failure without stopping output file writing

- [x] 9. Implement output file writing and console summary
  - Design ref: [Output Files & Summary](design.md#6-output-files--summary)
  - Covers: REQ-08, CA-08.1, CA-08.2, REQ-09, CA-09.1, CA-09.2, REQ-10, CA-10.1
  - Test ref: [MI-42](tests.md#buildsuccessentry) through [MI-47](tests.md#printsummary), [MA-26](tests.md#ma--executable-plan) through [MA-30](tests.md#ma--executable-plan)
  - Done when: script writes `scripts/licenses/migration-success.json` (array of `{ uuid, clientId, clientName, software, modalidade, dataVencimento }`), `scripts/licenses/migration-errors.json` (array of `{ id, reason }`), and prints summary to console per design §6 format

- [x] 10. Wire main() orchestration and end-to-end flow
  - Design ref: [Script Architecture Overview — Execution flow](design.md#1-script-architecture-overview), [Error Handling](design.md#7-error-handling)
  - Covers: REQ-01 through REQ-10
  - Test ref: [MI-48](tests.md#main-orchestration) through [MI-50](tests.md#main-orchestration)
  - Done when: `main()` calls all functions in sequence per design §1 flow table (validate env → read clients index → build map → list keys → for each: read → validate → resolve → transform → write → accumulate → update index → write output files → print summary), handles fatal vs per-record errors correctly
