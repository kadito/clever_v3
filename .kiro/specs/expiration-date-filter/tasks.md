# Expiration Date Filter — Tasks

- [x] 1. Add `expirationMonth` filter to `listFiltered` in backend
  - Design ref: [Data model — expiration date extraction](design.md#1-data-model--expiration-date-extraction-from-index), [Backend — listFiltered extension](design.md#2-backend--listfiltered-extension-with-expirationmonth)
  - Covers: REQ-03 (CA-03.2, CA-03.3), REQ-04 (CA-04.1, CA-04.2, CA-04.3), REQ-05 (CA-05.1, CA-05.2), REQ-08 (CA-08.1, CA-08.2), REQ-09 (CA-09.2, CA-09.3)
  - Test ref: [MI-01](tests.md#mi--executable-plan) through [MI-12](tests.md#mi--executable-plan)
  - Done when: `listFiltered` accepts `expirationMonth` in its filters param, applies expiration date extraction per content type (contracts: min of fimContratoCPA/fimContratoSH; licenses: dataVencimento), filters by year-month match, excludes items without expiration when filter active, and pagination total reflects filtered dataset

- [x] 2. Extract `expirationMonth` query parameter in route handler
  - Design ref: [Backend — route handler query parameter extraction](design.md#3-backend--route-handler-query-parameter-extraction)
  - Covers: REQ-03 (CA-03.1, CA-03.4)
  - Test ref: [MI-13](tests.md#mi--executable-plan) through [MI-15](tests.md#mi--executable-plan)
  - Done when: GET `/` handler extracts `expirationMonth` from query params, validates format with `/^\d{4}-\d{2}$/` (ignores invalid), includes it in `hasFilters` condition, and passes it to `listFiltered`

- [x] 3. Refactor `useExpirationFilter` composable for server-side filtering
  - Design ref: [Frontend — useExpirationFilter composable (refactored)](design.md#4-frontend--useexpirationfilter-composable-refactored)
  - Covers: REQ-02 (CA-02.1–CA-02.4), REQ-03 (CA-03.1), REQ-06 (CA-06.2, CA-06.3)
  - Test ref: [MI-16](tests.md#mi--executable-plan) through [MI-21](tests.md#mi--executable-plan)
  - Done when: `getExpirationDate` and `filterItems` exports removed, `contentType` parameter removed, new `filterParams` computed export added (returns `{ expirationMonth }` when selected, `{}` when null), `filterOptions`/`selectedMonth`/`clearFilter` unchanged

- [x] 4. Refactor `ContractsListView` to use server-side expiration filter
  - Design ref: [Frontend — ListView integration](design.md#6-frontend--listview-integration-contracts--licenses)
  - Covers: REQ-01 (CA-01.1), REQ-03 (CA-03.1), REQ-06 (CA-06.1), REQ-09 (CA-09.4)
  - Test ref: [MA-01](tests.md#ma--executable-plan), [MA-12](tests.md#ma--executable-plan), [MA-27](tests.md#ma--executable-plan)
  - Done when: composable call changed to `useExpirationFilter()` (no param), `filterItems` removed from `displayedContracts`, `filterParams` spread into API calls, `watch` on `selectedMonth` triggers re-fetch with page 1

- [x] 5. Refactor `LicensesListView` to use server-side expiration filter
  - Design ref: [Frontend — ListView integration](design.md#6-frontend--listview-integration-contracts--licenses)
  - Covers: REQ-01 (CA-01.2), REQ-03 (CA-03.1), REQ-06 (CA-06.1), REQ-09 (CA-09.4)
  - Test ref: [MA-02](tests.md#ma--executable-plan), [MA-15](tests.md#ma--executable-plan), [MA-27](tests.md#ma--executable-plan)
  - Done when: composable call changed to `useExpirationFilter()` (no param), `filterItems` removed from `displayedLicenses`, `filterParams` spread into API calls, `watch` on `selectedMonth` triggers re-fetch with page 1

- [x] 6. [MI] Integration tests for backend filter, composable, and component
  - Design ref: [Backend — listFiltered extension](design.md#2-backend--listfiltered-extension-with-expirationmonth), [Frontend — useExpirationFilter composable](design.md#4-frontend--useexpirationfilter-composable-refactored), [Frontend — ExpirationDateFilter component](design.md#5-frontend--expirationdatefilter-component-unchanged)
  - Covers: REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-08, REQ-09
  - Test ref: [MI-01](tests.md#mi--executable-plan) through [MI-25](tests.md#mi--executable-plan)
  - Done when: all 25 MI test cases pass in Vitest

- [x] 7. [MA] Acceptance tests for end-to-end filter behavior
  - Design ref: [Frontend — ListView integration](design.md#6-frontend--listview-integration-contracts--licenses), [Error handling and edge cases](design.md#7-error-handling-and-edge-cases)
  - Covers: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09
  - Test ref: [MA-01](tests.md#ma--executable-plan) through [MA-27](tests.md#ma--executable-plan)
  - Done when: all 27 MA test cases pass in Vitest
