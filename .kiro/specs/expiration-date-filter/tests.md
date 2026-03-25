# Expiration Date Filter — Executable Acceptance Plan

## [MA] Acceptance Tests

| Test ID | CA-ID | Given / When / Then | Data | Pass criterion |
|---------|-------|---------------------|------|----------------|
| MA-01 | CA-01.1 | Given the user is on the Contratos listing / When the page loads / Then an expiration date dropdown is visible | Contratos listing with items | Dropdown element present and visible |
| MA-02 | CA-01.2 | Given the user is on the Licenças listing / When the page loads / Then an expiration date dropdown is visible | Licenças listing with items | Dropdown element present and visible |
| MA-03 | CA-01.3 | Given the dropdown is visible / When the user reads the label / Then it reads "Data de Expiração" | Any listing page | Label text matches expected Portuguese |
| MA-04 | CA-02.1 | Given the dropdown is open / When the user counts options / Then there are exactly 12 | Current date: any | Option count = 12 |
| MA-05 | CA-02.2 | Given current month is March 2026 / When the user opens the dropdown / Then the first option is "Março 2026" | Date mocked to March 2026 | First option text matches |
| MA-06 | CA-02.3 | Given current month is March 2026 / When the user opens the dropdown / Then the last option is "Fevereiro 2027" | Date mocked to March 2026 | Last option text matches |
| MA-07 | CA-02.4 | Given the dropdown is open / When the user reads any option / Then it shows "Month YYYY" format | Any date | All options match format |
| MA-08 | CA-03.1 | Given items with expiration dates in June 2026 and other months / When the user selects "Junho 2026" / Then only June 2026 items are shown | Mixed expiration dates | Displayed items all expire in June 2026 |
| MA-09 | CA-03.2 | Given items expiring in various months / When the user selects "Junho 2026" / Then items from other months are hidden | Mixed expiration dates | No items outside June 2026 visible |
| MA-10 | CA-03.3 | Given the dropdown is available / When the user selects a month / Then the list updates immediately | Any items | No manual refresh needed |
| MA-18 | CA-03.4 | Given a Licença has `dataVencimento` in June 2026 / When the user selects "Junho 2026" / Then the Licença is shown | License with dataVencimento | Filter matches dataVencimento field |
| MA-19 | CA-03.5 | Given a Contrato has `fimContratoCPA` in June 2026 and `fimContratoSH` in August 2026 / When the user selects "Junho 2026" / Then the Contrato is shown (soonest date used) | Contract with both end dates | Filter uses soonest of fimContratoCPA/fimContratoSH |
| MA-11 | CA-04.1 | Given a filter is active / When the user clears the filter / Then all items are displayed | Previously filtered list | Full item count restored |
| MA-12 | CA-04.2 | Given a filter is active / When the user clears the filter / Then the dropdown shows default state | Previously filtered list | Dropdown shows placeholder/no selection |
| MA-13 | CA-05.1 | Given no items expire in the selected month / When the user selects that month / Then an empty state message is shown | No items for selected month | Empty state message visible |
| MA-14 | CA-06.1 | Given some items have no expiration date / When the user selects a filter month / Then items without expiration date are hidden | Items with and without expiration | Only items with matching expiration shown |
| MA-15 | CA-06.2 | Given some items have no expiration date / When no filter is active / Then items without expiration date are visible | Items with and without expiration | All items visible |
| MA-16 | CA-07.1 | Given a search term is entered / When the user also selects an expiration month / Then both filters apply | Search + filter active | Results match both criteria |
| MA-17 | CA-07.2 | Given search and expiration filter are active / When the user views results / Then only items matching both are shown | Search + filter active | Intersection of both filters |

## [MI] — Strategy

| Interface | Test scope | Mocked dependencies | REQ-ID |
|-----------|-----------|---------------------|--------|
| `getExpirationDate(item)` | Pure function — extracts expiration date from BaseContent based on contentType. Test: licenses use `dataVencimento`, contracts use soonest of `fimContratoCPA`/`fimContratoSH`, missing fields return `undefined` | None (pure function) | REQ-03, REQ-06 |
| `useExpirationFilter(contentType)` — `filterOptions` | Composable — generates 12 month options from current date in `pt-PT` locale. Test: correct count, correct first/last month, correct label format | `Date` (mock current date) | REQ-02 |
| `useExpirationFilter(contentType)` — `filterItems` | Composable — filters BaseContent array by selected month. Test: matches correct items, excludes no-date items, returns all when no filter | None (operates on in-memory array) | REQ-03, REQ-04, REQ-06, REQ-07 |
| `ExpirationDateFilter` component | Vue component — renders select with options, emits `update:modelValue` on change/clear. Test: renders 12 options + placeholder, emits correct values | None (presentational component) | REQ-01, REQ-02, REQ-04 |

## [MI] — Executable plan

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-01 | `getExpirationDate` | License with `dataVencimento` returns that date | `{ contentType: 'licenses', data: { dataVencimento: '2026-06-15' } }` | `'2026-06-15'` | REQ-03 |
| MI-02 | `getExpirationDate` | License without `dataVencimento` returns `undefined` | `{ contentType: 'licenses', data: {} }` | `undefined` | REQ-06 |
| MI-03 | `getExpirationDate` | Contract with only `fimContratoCPA` returns that date | `{ contentType: 'contracts', data: { fimContratoCPA: '2026-08-01' } }` | `'2026-08-01'` | REQ-03 |
| MI-04 | `getExpirationDate` | Contract with only `fimContratoSH` returns that date | `{ contentType: 'contracts', data: { fimContratoSH: '2026-09-01' } }` | `'2026-09-01'` | REQ-03 |
| MI-05 | `getExpirationDate` | Contract with both dates returns the soonest | `{ contentType: 'contracts', data: { fimContratoCPA: '2026-06-01', fimContratoSH: '2026-08-01' } }` | `'2026-06-01'` | REQ-03 |
| MI-06 | `getExpirationDate` | Contract with neither date returns `undefined` | `{ contentType: 'contracts', data: {} }` | `undefined` | REQ-06 |
| MI-07 | `getExpirationDate` | Malformed date returns `undefined` | `{ contentType: 'licenses', data: { dataVencimento: 'not-a-date' } }` | `undefined` | REQ-06 |
| MI-08 | `filterOptions` | Generates exactly 12 options | Current date mocked to 2026-03-15 | Array length = 12 | REQ-02 |
| MI-09 | `filterOptions` | First option is current month | Current date mocked to 2026-03-15 | `{ value: '2026-03', label: 'Março 2026' }` | REQ-02 |
| MI-10 | `filterOptions` | Last option is 11 months ahead | Current date mocked to 2026-03-15 | `{ value: '2027-02', label: 'Fevereiro 2027' }` | REQ-02 |
| MI-11 | `filterOptions` | Month names are capitalized Portuguese | Current date mocked to 2026-01-01 | First label starts with uppercase `'Janeiro 2026'` | REQ-02 |
| MI-12 | `filterItems` | No filter active returns all items | `selectedMonth = null`, 5 items | All 5 items returned | REQ-04 |
| MI-13 | `filterItems` | Filter matches items in selected month | `selectedMonth = '2026-06'`, items with dates in June and July | Only June items returned | REQ-03 |
| MI-14 | `filterItems` | Items without expiration excluded when filter active | `selectedMonth = '2026-06'`, mix of items with and without dates | Items without dates excluded | REQ-06 |
| MI-15 | `filterItems` | Items without expiration included when no filter | `selectedMonth = null`, items without dates | All items returned including no-date items | REQ-06 |
| MI-16 | `filterItems` | Empty result when no items match | `selectedMonth = '2026-12'`, no items expire in December | Empty array returned | REQ-05 |
| MI-17 | `filterItems` | Works on pre-searched array (coexistence) | `selectedMonth = '2026-06'`, pre-filtered array from search | Only items matching both search and month | REQ-07 |
| MI-18 | `ExpirationDateFilter` | Renders placeholder option | `options: [...], modelValue: null` | `<select>` contains "Data de Expiração" placeholder | REQ-01 |
| MI-19 | `ExpirationDateFilter` | Renders all 12 options | `options: 12 FilterOption items` | 12 `<option>` elements + 1 placeholder | REQ-02 |
| MI-20 | `ExpirationDateFilter` | Emits value on selection | User selects "Junho 2026" | `update:modelValue` emitted with `'2026-06'` | REQ-03 |
| MI-21 | `ExpirationDateFilter` | Emits null on clear (placeholder selected) | User selects placeholder | `update:modelValue` emitted with `null` | REQ-04 |
