# Tasks — KV to R2 Remote Assistance Migration

- [x] 1. Create script scaffolding and environment validation
  - Design ref: [Script Architecture Overview](design.md#1-script-architecture-overview)
  - Covers: REQ-01, REQ-02, REQ-03, REQ-05
  - Test ref: [MI-04](tests.md#mi--executable-plan), [MI-05](tests.md#mi--executable-plan)
  - Done when: `scripts/remote-assistance/migrate-remote-assistance.js` exists with shebang, validates 4 env vars (`CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_KV_NAMESPACE_ID`, `CF_R2_BUCKET_NAME`), exits with error message on any missing var

- [x] 2. Implement client lookup map builder
  - Design ref: [Client Resolution — Clients Index Lookup](design.md#4-client-resolution--clients-index-lookup)
  - Covers: REQ-03, CA-03.1, CA-03.3
  - Test ref: [MI-10](tests.md#mi--executable-plan), [MI-11](tests.md#mi--executable-plan), [MI-12](tests.md#mi--executable-plan), [MI-15](tests.md#mi--executable-plan)
  - Done when: `buildClientLookupMap` reads `indexes/clients-index.json` from R2, builds Map with `nomeComercial` and `nomeEmpresa` (lowercased, trimmed) → uuid, logs warning on duplicate names, exits on read failure

- [x] 3. Implement KV key listing with year-prefix pagination
  - Design ref: [Cloudflare KV API — Read Interface](design.md#2-cloudflare-kv-api--read-interface)
  - Covers: REQ-01, CA-01.1, CA-01.2
  - Test ref: [MI-01](tests.md#mi--executable-plan), [MI-02](tests.md#mi--executable-plan), [MI-03](tests.md#mi--executable-plan), [MI-04](tests.md#mi--executable-plan), [MI-05](tests.md#mi--executable-plan)
  - Done when: `listKvKeys` iterates years 2024–current, uses prefix `assistencias-remotas-{year}-`, handles pagination via cursor, exits on auth/404 errors, returns all key names

- [x] 4. Implement KV value reader
  - Design ref: [Cloudflare KV API — Read Interface](design.md#2-cloudflare-kv-api--read-interface)
  - Covers: REQ-02, CA-02.1, CA-02.2
  - Test ref: [MI-06](tests.md#mi--executable-plan), [MI-07](tests.md#mi--executable-plan), [MI-08](tests.md#mi--executable-plan), [MI-09](tests.md#mi--executable-plan)
  - Done when: `readKvValue` reads single key value, parses JSON, returns error object on HTTP failure or invalid JSON (does not throw)

- [x] 5. Implement client resolver
  - Design ref: [Client Resolution — Clients Index Lookup](design.md#4-client-resolution--clients-index-lookup)
  - Covers: REQ-03, CA-03.1, CA-03.2, CA-03.3
  - Test ref: [MI-10](tests.md#mi--executable-plan), [MI-11](tests.md#mi--executable-plan), [MI-12](tests.md#mi--executable-plan), [MI-13](tests.md#mi--executable-plan), [MI-14](tests.md#mi--executable-plan)
  - Done when: `resolveClientId` validates `cliente` field presence, looks up lowercased/trimmed name in map, returns uuid on match, returns error object on missing field or no match

- [x] 6. Implement data transformation
  - Design ref: [Data Transformation — Legacy → New Schema](design.md#5-data-transformation--legacy--new-schema)
  - Covers: REQ-04, CA-04.1, CA-04.2, CA-04.3, CA-04.4, CA-04.5, CA-04.6, CA-04.7, CA-04.8, CA-04.9
  - Test ref: [MI-16](tests.md#mi--executable-plan) through [MI-28](tests.md#mi--executable-plan)
  - Done when: `transformRecord` maps all fields per design §5 tables — derives `paymentMethod` from `contrato`/`garantia`, converts `tecnicoResponsavel` string to TechnicianUser object, validates `tipoAssistencia`, applies defaults for absent fields, sets hardcoded BaseContent fields, drops legacy-only fields

- [x] 7. Implement R2 record writer
  - Design ref: [Cloudflare R2 API — Write Interface](design.md#3-cloudflare-r2-api--write-interface)
  - Covers: REQ-05, CA-05.1, CA-05.2
  - Test ref: [MI-29](tests.md#mi--executable-plan), [MI-30](tests.md#mi--executable-plan), [MI-31](tests.md#mi--executable-plan), [MI-32](tests.md#mi--executable-plan), [MI-33](tests.md#mi--executable-plan)
  - Done when: `writeR2Object` sends PUT to `content/remote-assistance/{uuid}.json`, throws on fatal 401/403/404, returns error object on other HTTP failures or network errors

- [x] 8. Implement main orchestration loop
  - Design ref: [Script Architecture Overview](design.md#1-script-architecture-overview)
  - Covers: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05
  - Test ref: [MA-01](tests.md#ma--executable-plan), [MA-02](tests.md#ma--executable-plan), [MA-04](tests.md#ma--executable-plan), [MA-06](tests.md#ma--executable-plan), [MA-18](tests.md#ma--executable-plan)
  - Done when: `main` function wires all steps sequentially — validate env → build client map → list keys → for each key: read → resolve client → transform → write → accumulate success/error lists and index items

- [x] 9. Implement index update
  - Design ref: [Index Update — Remote Assistance Index](design.md#6-index-update--remote-assistance-index)
  - Covers: REQ-06, CA-06.1, CA-06.2
  - Test ref: [MI-34](tests.md#mi--executable-plan), [MI-35](tests.md#mi--executable-plan), [MI-36](tests.md#mi--executable-plan), [MI-37](tests.md#mi--executable-plan), [MI-38](tests.md#mi--executable-plan)
  - Done when: `buildIndexItem` creates index entry with all fields including `searchableText`; `updateRemoteAssistanceIndex` reads existing index, merges (preserving non-migrated items, replacing migrated ones), writes back to R2, logs error on failure without throwing

- [x] 10. Implement output files and console summary
  - Design ref: [Output Files & Console Summary](design.md#7-output-files--console-summary)
  - Covers: REQ-07, CA-07.1, CA-07.2, REQ-08, CA-08.1, CA-08.2, REQ-09, CA-09.1
  - Test ref: [MI-39](tests.md#mi--executable-plan), [MI-40](tests.md#mi--executable-plan), [MI-41](tests.md#mi--executable-plan), [MI-42](tests.md#mi--executable-plan), [MI-43](tests.md#mi--executable-plan)
  - Done when: `writeOutputFiles` writes `migration-success.json` and `migration-errors.json` to `scripts/remote-assistance/`; `printSummary` prints total, successes, errors, and file paths to console; both handle empty arrays correctly
