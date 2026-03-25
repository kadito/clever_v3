# Expiration Date Filter — Tasks

- [x] 1. Create `useExpirationFilter` composable
  - Design ref: [Data model — expiration date extraction](design.md#1-data-model--expiration-date-extraction), [Composable — useExpirationFilter](design.md#2-composable--useexpirationfilter)
  - Covers: REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07
  - Test ref: [MI-01](tests.md#mi--executable-plan) through [MI-17](tests.md#mi--executable-plan)
  - Done when: composable exports `filterOptions`, `selectedMonth`, `clearFilter`, `filterItems` and `getExpirationDate` logic is embedded; file exists at `packages/frontend/src/composables/useExpirationFilter.ts`

- [x] 2. Create `ExpirationDateFilter` component
  - Design ref: [Component — ExpirationDateFilter dropdown](design.md#3-component--expirationdatefilter-dropdown)
  - Covers: REQ-01, REQ-02, REQ-04
  - Test ref: [MI-18](tests.md#mi--executable-plan) through [MI-21](tests.md#mi--executable-plan)
  - Done when: component renders native `<select>` with placeholder "Data de Expiração", accepts `options` and `modelValue` props, emits `update:modelValue`; file exists at `packages/frontend/src/components/common/ExpirationDateFilter.vue`

- [x] 3. Integrate expiration filter in `ContractsListView`
  - Design ref: [Integration — ListView changes](design.md#4-integration--listview-changes)
  - Covers: REQ-01 (CA-01.1), REQ-03 (CA-03.5), REQ-05, REQ-07
  - Test ref: [MA-01](tests.md#ma-acceptance-tests), [MA-08](tests.md#ma-acceptance-tests), [MA-19](tests.md#ma-acceptance-tests)
  - Done when: `ContractsListView.vue` imports composable and component, `displayedContracts` chains `filterItems` after search, dropdown renders above the list

- [x] 4. Integrate expiration filter in `LicensesListView`
  - Design ref: [Integration — ListView changes](design.md#4-integration--listview-changes)
  - Covers: REQ-01 (CA-01.2), REQ-03 (CA-03.4), REQ-05, REQ-07
  - Test ref: [MA-02](tests.md#ma-acceptance-tests), [MA-18](tests.md#ma-acceptance-tests)
  - Done when: `LicensesListView.vue` imports composable and component, `displayedLicenses` chains `filterItems` after search, dropdown renders above the list

- [x] 5. [MI] Integration tests for composable and component
  - Design ref: [Composable — useExpirationFilter](design.md#2-composable--useexpirationfilter), [Component — ExpirationDateFilter dropdown](design.md#3-component--expirationdatefilter-dropdown)
  - Covers: REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07
  - Test ref: [MI-01](tests.md#mi--executable-plan) through [MI-21](tests.md#mi--executable-plan)
  - Done when: all 21 MI test cases pass in Vitest

- [x] 6. [MA] Acceptance tests for end-to-end filter behavior
  - Design ref: [Integration — ListView changes](design.md#4-integration--listview-changes), [Error handling and edge cases](design.md#5-error-handling-and-edge-cases)
  - Covers: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07
  - Test ref: [MA-01](tests.md#ma-acceptance-tests) through [MA-19](tests.md#ma-acceptance-tests)
  - Done when: all 19 MA test cases pass in Vitest
