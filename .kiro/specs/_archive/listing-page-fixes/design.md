# Listing Page Fixes Bugfix Design

## Overview

Two bugs affect all content listing pages. First, navigating to any listing page fires two identical GET requests instead of one — the component mounts, calls `loadX()` in `onMounted()`, then gets destroyed and recreated (likely due to Clerk's `addListener(updateAuthState)` triggering an auth state change that causes the router guard to re-evaluate or the `v-if`/`v-else` in `App.vue` to toggle), firing `onMounted()` a second time. Second, the backend already returns pagination metadata and `useApi.ts` stores it in a `pagination` ref, but no listing page passes pagination props to `ContentListTemplate` — so users see only the first page of results with no way to navigate further.

The fix will: (1) add a guard in each list view's `onMounted` to prevent duplicate fetches, and (2) wire the existing `pagination` ref from `useApi` through each list view into `ContentListTemplate`, which already has pagination UI built in but never activated.

## Glossary

- **Bug_Condition (C)**: The conditions that trigger the two bugs — (C1) component recreation causing duplicate GET requests on mount, and (C2) listing pages not passing pagination data to `ContentListTemplate`
- **Property (P)**: The desired behavior — (P1) exactly one GET request per page navigation, and (P2) pagination controls visible and functional when total items exceed page limit
- **Preservation**: Existing behaviors that must remain unchanged — sort order, client-side search, item click navigation, create button, error/loading states
- **`useApi<T>`**: The composable in `packages/frontend/src/composables/useApi.ts` that wraps `apiService` with reactive state for items, pagination, loading, and error
- **`ContentListTemplate`**: The shared list component in `packages/frontend/src/components/common/ContentListTemplate.vue` that renders items with built-in (but currently unused) pagination UI
- **`loadX()`**: The data loading function in each list view (e.g., `loadClients`, `loadContracts`) called from `onMounted()`

## Bug Details

### Bug Condition

The bugs manifest in two independent conditions:

**Bug 1 — Duplicate Requests**: When a user navigates to any listing page, the list view component mounts and calls `loadX()` via `onMounted()`. However, Clerk's `addListener(updateAuthState)` callback fires after initial load, updating the auth store. This can cause the router guard to re-evaluate (the `while (!authStore.isLoaded)` loop) or the `v-if`/`v-else` toggle in `App.vue` (based on `route.meta.hideLayout`) to switch branches, destroying and recreating the `<RouterView>` subtree. The recreated component calls `onMounted()` again, firing a second identical GET request.

**Bug 2 — Missing Pagination**: The backend returns `{ page, limit, total }` in every list response. `useApi.fetchList()` stores this in `pagination` ref. But no list view reads `api.pagination` or passes `currentPage`, `totalPages`, `totalCount`, or `showPagination` props to `ContentListTemplate`. The template's pagination section is gated by `v-if="showPagination && totalPages > 1"` which defaults to `showPagination: false`.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { event: 'page-navigation' | 'pagination-interaction', contentType: string }
  OUTPUT: boolean

  // Bug 1: Duplicate request on navigation
  IF input.event = 'page-navigation' THEN
    RETURN componentMountCount(input.contentType) > 1
           AND getRequestCount(input.contentType) > 1
  END IF

  // Bug 2: Missing pagination controls
  IF input.event = 'pagination-interaction' THEN
    RETURN totalItems(input.contentType) > pageLimit
           AND paginationControlsVisible() = false
  END IF

  RETURN false
END FUNCTION
```

### Examples

- Navigate to `/clients` with 120 clients in the database → Network tab shows 2x `GET /api/content/clients` (expected: 1x), and only 50 clients displayed with no pagination controls (expected: pagination showing "1 de 3")
- Navigate to `/contracts` with 10 contracts → Network tab shows 2x `GET /api/content/contracts` (expected: 1x), but pagination not needed since 10 < 50
- Navigate to `/licenses` with 75 licenses → 2x `GET /api/content/licenses`, only first 50 shown, no way to see remaining 25
- User clicks "next page" → No button exists to click (expected: button navigates to page 2 with `?page=2&limit=50`)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Items displayed in correct sort order (alphabetical for clients via `localeCompare('pt-PT')`, date-based for others)
- Client-side search/filter continues to work locally without additional API requests
- Clicking a list item navigates to the detail view (`/clients/{uuid}`, etc.)
- Create button navigates to the create view (`/clients/criar`, etc.)
- Error state displays via `ErrorComponent` when API fails
- Loading skeleton animation shows during data fetch
- Mobile FAB button for create action on small screens
- All existing custom template slots (itemIcon, itemMeta) continue rendering

**Scope:**
All inputs that do NOT involve page navigation mount lifecycle or pagination interaction should be completely unaffected by this fix. This includes:
- Client-side search filtering
- Item click navigation
- Create/edit button actions
- Error clearing
- Loading state display

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Component Recreation During Auth Initialization**: In `main.ts`, `clerk.addListener(updateAuthState)` fires after Clerk loads, calling `authStore.setAuthState()`. This reactive change propagates to `App.vue`'s `hideLayout` computed (via `route.meta`), potentially toggling the `v-if`/`v-else` branches and destroying/recreating the `<RouterView>` subtree. The recreated list view component calls `onMounted()` again, triggering a second `loadX()` call.

2. **No Mount Guard**: Each list view's `loadX()` function has no protection against being called multiple times. There's no `isLoading` check at the start, no abort controller to cancel previous requests, and no flag to track whether data has already been fetched.

3. **Pagination Props Never Wired**: Each list view calls `api.fetchList()` which populates `api.pagination`, but no list view reads this ref. `ContentListTemplate` receives default props (`showPagination: false`, `currentPage: 1`, `totalPages: 1`, `totalCount: null`), so the pagination section never renders.

4. **No Page Change Handler**: Even if pagination props were passed, no list view implements a `pageChange` event handler to call `api.fetchList({ page: newPage })` when the user clicks next/previous.

## Correctness Properties

Property 1: Bug Condition - Single Request Per Navigation

_For any_ navigation to a content listing page, the fixed list view SHALL make exactly one GET request to `GET /api/content/{type}` during the mount lifecycle, regardless of component recreation events.

**Validates: Requirements 2.1**

Property 2: Bug Condition - Pagination Controls Visible When Needed

_For any_ listing page where the backend returns `total > limit` in the pagination response, the fixed list view SHALL display pagination controls showing current page, total pages, and next/previous navigation buttons.

**Validates: Requirements 2.2**

Property 3: Bug Condition - Page Navigation Triggers Single Request

_For any_ pagination interaction (clicking next/previous page), the fixed list view SHALL make exactly one GET request with the appropriate `?page=X&limit=Y` query parameters and update the displayed items with the response.

**Validates: Requirements 2.3**

Property 4: Preservation - Sort Order Unchanged

_For any_ content listing page load, the fixed list view SHALL produce the same item sort order as the original — alphabetical for clients, date-descending for others — preserving existing sorting behavior.

**Validates: Requirements 3.1**

Property 5: Preservation - Client-Side Search Unchanged

_For any_ search interaction on a listing page, the fixed list view SHALL continue to filter displayed items locally without making additional API requests, preserving existing search behavior.

**Validates: Requirements 3.2**

Property 6: Preservation - Navigation and Actions Unchanged

_For any_ item click, create button click, or edit button click on a listing page, the fixed list view SHALL continue to navigate to the correct route, preserving existing navigation behavior.

**Validates: Requirements 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `packages/frontend/src/views/clients/ClientsListView.vue` (and all other `*ListView.vue` files)

**Function**: `loadClients()` / `loadContracts()` / etc. + `onMounted()`

**Specific Changes**:

1. **Add Fetch Guard**: Add a `hasFetched` ref initialized to `false`. In `loadX()`, check `if (hasFetched.value) return` at the top, and set `hasFetched.value = true` before the fetch call. This prevents duplicate requests from component recreation.

2. **Wire Pagination Props**: Read `api.pagination` and pass computed props to `ContentListTemplate`:
   - `:current-page="api.pagination.value.page"`
   - `:total-pages="api.pagination.value.totalPages"`
   - `:total-count="api.pagination.value.total"`
   - `:show-pagination="api.pagination.value.totalPages > 1"`

3. **Add Page Change Handler**: Implement a `handlePageChange(page: number)` function that calls `api.fetchList({ page })` and updates the local items ref from the response. Listen to `@page-change="handlePageChange"` on `ContentListTemplate`.

4. **Update Items Assignment on Page Change**: After `api.fetchList({ page })`, re-assign `items.value` from `api.items.value` with the same sorting logic already in place.

5. **Apply to All List Views**: Repeat changes 1-4 for all content type list views:
   - `ClientsListView.vue`
   - `ContractsListView.vue`
   - `LicensesListView.vue`
   - `WorkSheetsListView.vue`
   - `DailyRecordsListView.vue`
   - `RemoteAssistanceListView.vue`

**File**: `packages/frontend/src/components/common/ContentListTemplate.vue`

**No changes needed** — the template already has pagination UI, props, events, and handlers built in. It just needs the parent to pass the right props and listen to `pageChange`.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate component mount lifecycle and verify request counts, and tests that check pagination prop wiring. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **Duplicate Mount Test**: Mount a list view component, verify `fetchList` is called exactly once (will fail on unfixed code — called twice)
2. **Pagination Props Test**: Mount a list view with mock API returning `total: 120, limit: 50`, verify `ContentListTemplate` receives `showPagination: true` (will fail on unfixed code — receives `false`)
3. **Page Change Test**: Simulate `pageChange` event on `ContentListTemplate`, verify `fetchList` is called with `{ page: 2 }` (will fail on unfixed code — no handler)
4. **Multiple Content Types Test**: Repeat tests for contracts, licenses, etc. (will fail on unfixed code)

**Expected Counterexamples**:
- `fetchList` called 2 times during single mount lifecycle
- `showPagination` prop is `false` even when `total > limit`
- Possible causes: component recreation from auth state change, missing pagination prop wiring

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  IF input.event = 'page-navigation' THEN
    result := mountListView(input.contentType)
    ASSERT requestCount(result) = 1
  END IF

  IF input.event = 'pagination-interaction' THEN
    result := renderListView(input.contentType, { total: N, limit: L })
    ASSERT paginationVisible(result) = (N > L)
    ASSERT currentPage(result) = expectedPage
  END IF
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT listView_original(input) = listView_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for search, navigation, and display, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Sort Order Preservation**: Verify clients are sorted alphabetically and other types by date, both before and after fix
2. **Search Preservation**: Verify client-side filtering produces same results for arbitrary search queries
3. **Navigation Preservation**: Verify item clicks, create clicks, and edit clicks route to correct paths
4. **Error/Loading Preservation**: Verify error and loading states display correctly

### Unit Tests

- Test `hasFetched` guard prevents duplicate `fetchList` calls on remount
- Test pagination props are correctly computed from `api.pagination`
- Test `handlePageChange` calls `fetchList` with correct page parameter
- Test edge cases: 0 items, exactly `limit` items, `limit + 1` items

### Property-Based Tests

- Generate random item counts and page limits, verify pagination visibility is correct (`total > limit` → visible)
- Generate random page numbers within valid range, verify `fetchList` receives correct `{ page }` param
- Generate random search queries, verify client-side filtering produces same results before and after fix

### Integration Tests

- Test full navigation flow: home → listing page → verify single request in network
- Test pagination flow: load page 1 → click next → verify page 2 loads with correct items
- Test that pagination controls show correct Portuguese labels ("Mostrando X a Y de Z resultados")
