# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Duplicate Requests and Missing Pagination
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate both bugs exist
  - **Scoped PBT Approach**: Use fast-check to generate content types from `['clients', 'contracts', 'licenses', 'work-sheets', 'daily-records', 'remote-assistance']` and pagination scenarios with `total > limit`
  - **Test file**: `packages/frontend/src/views/__tests__/listview-bug-condition.test.ts`
  - **Test setup**: Mount each `*ListView.vue` component with mocked `useApi` composable, mocked `vue-router`, and `@vue/test-utils`
  - **Bug 1 test**: For any content type, mount the list view component, verify `fetchList` is called exactly once. On unfixed code, `loadX()` has no `hasFetched` guard, so component recreation calls it multiple times. Assert `fetchList` call count === 1
  - **Bug 2 test**: For any content type with mock API returning `{ page: 1, limit: 50, total: N }` where N > 50, mount the list view and verify `ContentListTemplate` receives `:show-pagination="true"`, `:current-page`, `:total-pages`, and `:total-count` props. On unfixed code, these props are never passed (showPagination defaults to false)
  - **Bug 2 page change test**: Simulate `@page-change` event on `ContentListTemplate`, verify `fetchList` is called with `{ page: 2 }`. On unfixed code, no handler exists
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bugs exist)
  - Document counterexamples found: e.g., "fetchList called 2 times during single mount", "showPagination prop is false even when total=120 > limit=50", "no pageChange handler wired"
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Sort Order, Search, Navigation, and UI States
  - **IMPORTANT**: Follow observation-first methodology
  - **Test file**: `packages/frontend/src/views/__tests__/listview-preservation.test.ts`
  - **Test setup**: Mount each `*ListView.vue` with mocked `useApi` and `vue-router`, using `@vue/test-utils`
  - **Observe on UNFIXED code first, then write property-based tests**:
  - Observe: ClientsListView sorts items alphabetically by `nomeComercial || nomeEmpresa` using `localeCompare('pt-PT')`
  - Observe: ContractsListView (and other non-client views) sorts by `createdAt` date descending
  - Observe: Typing in search bar filters `displayedX` computed locally without calling `fetchList` again
  - Observe: Clicking a list item emits `itemClick` which calls `router.push('/clients/{uuid}')` etc.
  - Observe: Clicking create button emits `create` which calls `router.push('/clients/criar')` etc.
  - Observe: Error state renders `ErrorComponent` when `error` ref is set
  - Observe: Loading state renders skeleton when `isLoading` is true
  - **Property test 1 - Sort order**: For all generated arrays of client items with random `nomeComercial`/`nomeEmpresa` values, verify `displayedClients` is sorted alphabetically via `localeCompare('pt-PT')`. For non-client types, verify items sorted by `createdAt` descending
  - **Property test 2 - Search filtering**: For all generated search queries and item arrays, verify client-side filtering matches expected substring matching on relevant fields, and no additional `fetchList` calls are made
  - **Property test 3 - Navigation routes**: For all generated content types and UUIDs, verify item click navigates to `/{type}/{uuid}` and create click navigates to `/{type}/criar`
  - Verify all tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix for duplicate requests and missing pagination across all list views

  - [x] 3.1 Add `hasFetched` guard to prevent duplicate requests in all list views
    - In each `*ListView.vue`, add `const hasFetched = ref(false)` alongside existing state refs
    - In each `loadX()` function, add `if (hasFetched.value) return` as the first line
    - Set `hasFetched.value = true` immediately after the guard check, before the fetch call
    - This prevents duplicate `onMounted()` calls from component recreation during Clerk auth initialization
    - Apply to: `ClientsListView.vue`, `ContractsListView.vue`, `LicensesListView.vue`, `WorkSheetsListView.vue`, `DailyRecordsListView.vue`, `RemoteAssistanceListView.vue`
    - _Bug_Condition: isBugCondition(input) where input.event = 'page-navigation' AND componentMountCount > 1_
    - _Expected_Behavior: requestCount = 1 for any single page navigation_
    - _Preservation: Sort order, search, navigation, error/loading states unchanged_
    - _Requirements: 1.1, 2.1_

  - [x] 3.2 Wire pagination props and page change handler in all list views
    - In each `*ListView.vue`, pass pagination props from `api.pagination` to `ContentListTemplate`:
      - `:current-page="api.pagination.value.page"`
      - `:total-pages="api.pagination.value.totalPages"`
      - `:total-count="api.pagination.value.total"`
      - `:show-pagination="api.pagination.value.totalPages > 1"`
    - Add `handlePageChange(page: number)` function that calls `api.fetchList({ page })` and re-assigns the local items ref from `api.items.value` with existing sort logic
    - Listen to `@page-change="handlePageChange"` on `ContentListTemplate`
    - `ContentListTemplate.vue` already has pagination UI, props (`currentPage`, `totalPages`, `totalCount`, `showPagination`), events (`pageChange`), and handlers (`handlePreviousPage`, `handleNextPage`) built in — no changes needed there
    - Apply to: `ClientsListView.vue`, `ContractsListView.vue`, `LicensesListView.vue`, `WorkSheetsListView.vue`, `DailyRecordsListView.vue`, `RemoteAssistanceListView.vue`
    - _Bug_Condition: isBugCondition(input) where input.event = 'pagination-interaction' AND totalItems > pageLimit AND paginationControlsVisible = false_
    - _Expected_Behavior: paginationVisible = (total > limit), currentPage = expectedPage, fetchList called with { page: X }_
    - _Preservation: Sort order, search, navigation, error/loading states unchanged_
    - _Requirements: 1.2, 1.3, 2.2, 2.3_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Duplicate Requests and Missing Pagination
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Sort Order, Search, Navigation, and UI States
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
