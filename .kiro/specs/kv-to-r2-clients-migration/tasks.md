# Tasks — KV to R2 Clients Migration

## Implementation tasks

- [x] 1. Create migration script entry point with env validation
  - Design ref: [Script Architecture](design.md#1-script-architecture)
  - Covers: REQ-01, REQ-08
  - Test ref: [MI-IT-44](tests.md#mi---executable-plan), [MA-AT-02](tests.md#ma---executable-plan)
  - Done when: `scripts/migrate-clients.js` exists, validates all 4 env vars on startup, exits with descriptive message when any is missing

- [x] 2. Implement `listKvKeys` — paginated KV key listing
  - Design ref: [Cloudflare KV API — Read Interface](design.md#2-cloudflare-kv-api--read-interface)
  - Covers: REQ-01, CA-01.1, CA-01.2
  - Test ref: [MI-IT-01 to MI-IT-07](tests.md#mi---executable-plan), [MA-AT-01](tests.md#ma---executable-plan), [MA-AT-02](tests.md#ma---executable-plan)
  - Done when: function collects all paginated keys with prefix `clientes-`, handles empty namespace, throws fatal errors on 401/403/404/network failure

- [x] 3. Implement `readKvValue` — single key read with error handling
  - Design ref: [Cloudflare KV API — Read Interface](design.md#2-cloudflare-kv-api--read-interface)
  - Covers: REQ-02, CA-02.1, CA-02.2
  - Test ref: [MI-IT-08 to MI-IT-12](tests.md#mi---executable-plan), [MA-AT-03](tests.md#ma---executable-plan), [MA-AT-04](tests.md#ma---executable-plan)
  - Done when: function returns parsed JSON on success, returns error record (not throws) on HTTP error or invalid JSON

- [x] 4. Implement `writeR2Object` — single record write to R2
  - Design ref: [Cloudflare R2 API — Write Interface](design.md#3-cloudflare-r2-api--write-interface)
  - Covers: REQ-04, CA-04.1, CA-04.2
  - Test ref: [MI-IT-23 to MI-IT-28](tests.md#mi---executable-plan), [MA-AT-12](tests.md#ma---executable-plan), [MA-AT-13](tests.md#ma---executable-plan)
  - Done when: function writes to `content/clients/{uuid}.json`, returns error record on HTTP 4xx/5xx/network, throws fatal error on 401/403/404

- [x] 5. Implement `transformRecord` — legacy to new schema mapping
  - Design ref: [Data Transformation — Legacy → New Schema](design.md#4-data-transformation--legacy--new-schema)
  - Covers: REQ-03, CA-03.1, CA-03.2, CA-03.3, CA-03.4, CA-03.5, CA-03.6, CA-03.7
  - Test ref: [MI-IT-13 to MI-IT-22](tests.md#mi---executable-plan), [MA-AT-05 to MA-AT-11](tests.md#ma---executable-plan)
  - Done when: function maps all fields per field mapping table, applies defaults for missing booleans/arrays, returns error object for missing required fields (`id`, `nomeEmpresa`, `nomeComercial`)

- [x] 6. Implement `buildIndexItem` — index item construction
  - Design ref: [Index Update Strategy](design.md#5-index-update-strategy)
  - Covers: REQ-05, CA-05.1
  - Test ref: [MI-IT-29 to MI-IT-31](tests.md#mi---executable-plan), [MA-AT-14](tests.md#ma---executable-plan)
  - Done when: function produces index item with all fields from the index item structure table, calls `createClientSearchText` from `@clever/shared`, applies defaults for optional fields

- [x] 7. Implement `writeR2Index` — index write to R2
  - Design ref: [Index Update Strategy](design.md#5-index-update-strategy)
  - Covers: REQ-05, CA-05.2
  - Test ref: [MI-IT-32 to MI-IT-34](tests.md#mi---executable-plan), [MA-AT-15](tests.md#ma---executable-plan)
  - Done when: function writes full index JSON to `indexes/clients-index.json`, logs error and does not throw on HTTP or network failure

- [x] 8. Implement `writeOutputFiles` — local FS output
  - Design ref: [Output Files Contract](design.md#6-output-files-contract)
  - Covers: REQ-06, REQ-07, CA-06.1, CA-06.2, CA-07.1, CA-07.2
  - Test ref: [MI-IT-35 to MI-IT-39](tests.md#mi---executable-plan), [MA-AT-16 to MA-AT-19](tests.md#ma---executable-plan)
  - Done when: function writes `migration-success.json` and `migration-errors.json` with correct shapes, handles empty arrays, logs error and continues on FS failure

- [x] 9. Implement `printSummary` — console summary output
  - Design ref: [Output Files Contract](design.md#6-output-files-contract)
  - Covers: REQ-08, CA-08.1
  - Test ref: [MI-IT-40](tests.md#mi---executable-plan), [MA-AT-20](tests.md#ma---executable-plan)
  - Done when: function prints all 6 required summary lines (total, successes, errors, both file paths)

- [x] 10. Wire `run()` — orchestrate full execution flow
  - Design ref: [Execution Flow](design.md#8-execution-flow)
  - Covers: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08
  - Test ref: [MI-IT-41 to MI-IT-45](tests.md#mi---executable-plan), [MA-AT-01](tests.md#ma---executable-plan), [MA-AT-02](tests.md#ma---executable-plan)
  - Done when: `run()` executes all 12 steps in order per execution flow table, output files are written regardless of index result, summary always printed

## Test tasks

- [ ] 11. Write unit tests for `listKvKeys`
  - Design ref: [Cloudflare KV API — Read Interface](design.md#2-cloudflare-kv-api--read-interface)
  - Covers: REQ-01
  - Test ref: [MI-IT-01 to MI-IT-07](tests.md#mi---executable-plan)
  - Done when: all 7 MI-IT-01 to MI-IT-07 test cases pass with fetch mocked

- [ ] 12. Write unit tests for `readKvValue`
  - Design ref: [Cloudflare KV API — Read Interface](design.md#2-cloudflare-kv-api--read-interface)
  - Covers: REQ-02
  - Test ref: [MI-IT-08 to MI-IT-12](tests.md#mi---executable-plan)
  - Done when: all 5 MI-IT-08 to MI-IT-12 test cases pass with fetch mocked

- [ ] 13. Write unit tests for `writeR2Object`
  - Design ref: [Cloudflare R2 API — Write Interface](design.md#3-cloudflare-r2-api--write-interface)
  - Covers: REQ-04
  - Test ref: [MI-IT-23 to MI-IT-28](tests.md#mi---executable-plan)
  - Done when: all 6 MI-IT-23 to MI-IT-28 test cases pass with fetch mocked

- [ ] 14. Write unit tests for `transformRecord`
  - Design ref: [Data Transformation — Legacy → New Schema](design.md#4-data-transformation--legacy--new-schema)
  - Covers: REQ-03
  - Test ref: [MI-IT-13 to MI-IT-22](tests.md#mi---executable-plan)
  - Done when: all 10 MI-IT-13 to MI-IT-22 test cases pass with no mocks required

- [ ] 15. Write unit tests for `buildIndexItem` and `writeR2Index`
  - Design ref: [Index Update Strategy](design.md#5-index-update-strategy)
  - Covers: REQ-05
  - Test ref: [MI-IT-29 to MI-IT-34](tests.md#mi---executable-plan)
  - Done when: all MI-IT-29 to MI-IT-31b and MI-IT-32 to MI-IT-34 test cases pass

- [ ] 16. Write unit tests for `writeOutputFiles` and `printSummary`
  - Design ref: [Output Files Contract](design.md#6-output-files-contract)
  - Covers: REQ-06, REQ-07, REQ-08
  - Test ref: [MI-IT-35 to MI-IT-40b](tests.md#mi---executable-plan)
  - Done when: all MI-IT-35 to MI-IT-40b test cases pass with fs mocked

- [ ] 17. Write integration tests for `run()` — [MI] end-to-end
  - Design ref: [Execution Flow](design.md#8-execution-flow)
  - Covers: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08
  - Test ref: [MI-IT-41 to MI-IT-45](tests.md#mi---executable-plan)
  - Done when: all 5 MI-IT-41 to MI-IT-45 integration test cases pass with KV API, R2 API, and fs all mocked

- [ ] 18. Write acceptance tests — [MA] all CAs
  - Design ref: [Execution Flow](design.md#8-execution-flow)
  - Covers: REQ-01 through REQ-08, all CA-IDs
  - Test ref: [MA-AT-01 to MA-AT-20](tests.md#ma---executable-plan)
  - Done when: all 20 MA-AT-01 to MA-AT-20 acceptance test cases pass
