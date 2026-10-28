# Bugfix Requirements Document

## Introduction

Two bugs affect all content type listing pages in the CLEVER dashboard. First, navigating to any listing page (e.g. `/clients`) triggers two identical GET requests to the backend instead of one — the `loadX()` function in `onMounted()` calls `api.fetchList()`, but a second request is also fired (likely from component recreation during the auth guard's async wait or from a reactive side-effect). Second, the backend already returns pagination metadata (`{ page, limit, total }`) and the `useApi` composable stores it in a `pagination` ref, but the listing pages never pass pagination props to `ContentListTemplate` and the template's built-in pagination UI is never activated — so users cannot navigate beyond the first page of results.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user navigates to any content listing page (e.g. `/clients`, `/contracts`, `/licenses`) THEN the system makes two identical GET requests to `GET /api/content/{type}` for the same page load

1.2 WHEN the backend returns pagination data `{ page: 1, limit: 50, total: N }` with N > 50 THEN the listing page displays only the first 50 items with no way to navigate to subsequent pages

1.3 WHEN a user is on a listing page with more items than the page limit THEN the system provides no pagination controls, page indicators, or any mechanism to access items beyond the first page

### Expected Behavior (Correct)

2.1 WHEN a user navigates to any content listing page THEN the system SHALL make exactly one GET request to `GET /api/content/{type}` to load the initial data

2.2 WHEN the backend returns pagination data indicating multiple pages (total > limit) THEN the listing page SHALL display pagination controls allowing the user to navigate between pages

2.3 WHEN a user clicks a pagination control (next/previous page) THEN the system SHALL make a single GET request with the appropriate `?page=X&limit=Y` query parameters and update the displayed items

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a content listing page loads successfully THEN the system SHALL CONTINUE TO display items in the correct sort order (alphabetical for clients, date-based for others)

3.2 WHEN a user performs a client-side search/filter on a listing page THEN the system SHALL CONTINUE TO filter the displayed items locally without additional API requests

3.3 WHEN a user clicks on a list item THEN the system SHALL CONTINUE TO navigate to the detail view for that item

3.4 WHEN a user clicks the create button on a listing page THEN the system SHALL CONTINUE TO navigate to the create view for that content type

3.5 WHEN the API returns an error during list loading THEN the system SHALL CONTINUE TO display the error state with the existing ErrorComponent

3.6 WHEN items are loading THEN the system SHALL CONTINUE TO display the loading skeleton animation
