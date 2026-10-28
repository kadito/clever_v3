# Expiration Date Filter — Executable Acceptance Plan

## [MI] — Strategy

| Interface | Test scope | Mocked dependencies | REQ-ID |
|-----------|-----------|---------------------|--------|
| `listFiltered({ expirationMonth })` — contracts | Backend service — filtra índice de contratos por mês de expiração usando `min(fimContratoCPA, fimContratoSH)`. Testa: match correto, exclusão de items sem data, ambas datas presentes, apenas uma data | R2 bucket (mock com índice em memória) | REQ-03, REQ-04, REQ-08 |
| `listFiltered({ expirationMonth })` — licenses | Backend service — filtra índice de licenças por mês de expiração usando `dataVencimento`. Testa: match correto, exclusão de items sem data | R2 bucket (mock com índice em memória) | REQ-03, REQ-05, REQ-08 |
| `listFiltered({ expirationMonth, search })` — AND logic | Backend service — aplica filtro de expiração em AND com search. Testa: items devem corresponder a ambos os critérios | R2 bucket (mock com índice em memória) | REQ-09 |
| Route handler GET `/` — `expirationMonth` param | Route handler — extrai query param, valida formato `YYYY-MM`, passa ao `listFiltered`. Testa: param válido, param inválido (ignorado), param ausente | Hono test client + R2 mock | REQ-03 |
| `useExpirationFilter()` — `filterOptions` | Composable — gera 12 opções de mês a partir da data atual em locale `pt-PT`. Testa: contagem correta, primeiro/último mês, formato do label | `Date` (mock da data atual) | REQ-02 |
| `useExpirationFilter()` — `filterParams` | Composable — retorna `{ expirationMonth }` quando selecionado, `{}` quando null. Testa: parâmetros corretos para a API | Nenhuma | REQ-03, REQ-06 |
| `ExpirationDateFilter` component | Componente Vue — renderiza select com opções, emite `update:modelValue` na mudança/clear. Testa: renderiza 12 opções + placeholder, emite valores corretos | Nenhuma (componente presentacional) | REQ-01, REQ-02, REQ-06 |

## [MI] — Executable plan

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-01 | `listFiltered` contracts | Contract with both dates — uses earliest, matches selected month | Index: `{ fimContratoCPA: '2026-06-15', fimContratoSH: '2026-08-01' }`, filter: `'2026-06'` | Item included (earliest = June) | REQ-04 (CA-04.1) |
| MI-02 | `listFiltered` contracts | Contract with only `fimContratoCPA` — matches selected month | Index: `{ fimContratoCPA: '2026-06-15' }`, filter: `'2026-06'` | Item included | REQ-04 (CA-04.2) |
| MI-03 | `listFiltered` contracts | Contract with only `fimContratoSH` — matches selected month | Index: `{ fimContratoSH: '2026-06-20' }`, filter: `'2026-06'` | Item included | REQ-04 (CA-04.2) |
| MI-04 | `listFiltered` contracts | Contract with both dates — earliest does NOT match selected month | Index: `{ fimContratoCPA: '2026-07-01', fimContratoSH: '2026-08-01' }`, filter: `'2026-06'` | Item excluded | REQ-04 (CA-04.3) |
| MI-05 | `listFiltered` contracts | Contract with no dates — excluded when filter active | Index: `{}`, filter: `'2026-06'` | Item excluded | REQ-08 (CA-08.1) |
| MI-06 | `listFiltered` contracts | Contract with no dates — included when no filter | Index: `{}`, filter: `undefined` | Item included | REQ-08 (CA-08.2) |
| MI-07 | `listFiltered` licenses | License with `dataVencimento` matching selected month | Index: `{ dataVencimento: '2026-06-10' }`, filter: `'2026-06'` | Item included | REQ-05 (CA-05.1) |
| MI-08 | `listFiltered` licenses | License with `dataVencimento` NOT matching selected month | Index: `{ dataVencimento: '2026-07-01' }`, filter: `'2026-06'` | Item excluded | REQ-05 (CA-05.2) |
| MI-09 | `listFiltered` licenses | License without `dataVencimento` — excluded when filter active | Index: `{}`, filter: `'2026-06'` | Item excluded | REQ-08 (CA-08.1) |
| MI-10 | `listFiltered` licenses | License without `dataVencimento` — included when no filter | Index: `{}`, filter: `undefined` | Item included | REQ-08 (CA-08.2) |
| MI-11 | `listFiltered` AND logic | Filter + search — only items matching both returned | Index: 3 items (A: June + matches search, B: June + no search match, C: July + matches search), filter: `'2026-06'`, search: `'acme'` | Only item A returned | REQ-09 (CA-09.2) |
| MI-12 | `listFiltered` pagination | Pagination total reflects filtered dataset | Index: 10 items, 3 match June, filter: `'2026-06'`, page: 1, limit: 2 | `total: 3`, 2 items returned | REQ-03 (CA-03.3), REQ-09 (CA-09.3) |
| MI-13 | Route handler | Valid `expirationMonth` param passed to `listFiltered` | `GET /?expirationMonth=2026-06&page=1&limit=10` | `listFiltered` called with `{ expirationMonth: '2026-06' }` | REQ-03 (CA-03.1) |
| MI-14 | Route handler | Invalid `expirationMonth` format — silently ignored | `GET /?expirationMonth=invalid&page=1&limit=10` | `listFiltered` called without `expirationMonth` (or `undefined`) | REQ-03 |
| MI-15 | Route handler | Missing `expirationMonth` — no filter applied | `GET /?page=1&limit=10` | Normal listing without expiration filter | REQ-03 |
| MI-16 | `filterOptions` | Generates exactly 12 options | Current date mocked to 2026-03-15 | Array length = 12 | REQ-02 (CA-02.1) |
| MI-17 | `filterOptions` | First option is current month | Current date mocked to 2026-03-15 | `{ value: '2026-03', label: 'Março 2026' }` | REQ-02 (CA-02.2) |
| MI-18 | `filterOptions` | Last option is 11 months ahead | Current date mocked to 2026-03-15 | `{ value: '2027-02', label: 'Fevereiro 2027' }` | REQ-02 (CA-02.3) |
| MI-19 | `filterOptions` | Month names are capitalized Portuguese | Current date mocked to 2026-01-01 | First label = `'Janeiro 2026'` | REQ-02 (CA-02.4) |
| MI-20 | `filterParams` | Returns `{ expirationMonth }` when month selected | `selectedMonth = '2026-06'` | `{ expirationMonth: '2026-06' }` | REQ-03 (CA-03.1) |
| MI-21 | `filterParams` | Returns `{}` when no month selected | `selectedMonth = null` | `{}` | REQ-06 (CA-06.3) |
| MI-22 | `ExpirationDateFilter` | Renders placeholder option | `options: [...], modelValue: null` | `<select>` contains "Data de Expiração" placeholder | REQ-01 (CA-01.3) |
| MI-23 | `ExpirationDateFilter` | Renders all 12 options | `options: 12 FilterOption items` | 12 `<option>` elements + placeholder + clear option | REQ-02 (CA-02.1) |
| MI-24 | `ExpirationDateFilter` | Emits value on selection | User selects "Junho 2026" | `update:modelValue` emitted with `'2026-06'` | REQ-03 |
| MI-25 | `ExpirationDateFilter` | Emits null on clear | User selects "Limpar filtro" | `update:modelValue` emitted with `null` | REQ-06 (CA-06.2) |

## [MA] — Executable plan

| Test ID | CA-ID | Given / When / Then | Data | Pass criterion |
|---------|-------|---------------------|------|----------------|
| MA-01 | CA-01.1 | Given the user is on the Contratos listing / When the page loads / Then an expiration date dropdown is visible | Contratos listing page | Dropdown element present and visible |
| MA-02 | CA-01.2 | Given the user is on the Licenças listing / When the page loads / Then an expiration date dropdown is visible | Licenças listing page | Dropdown element present and visible |
| MA-03 | CA-01.3 | Given the dropdown is visible / When the user reads the label / Then it reads "Data de Expiração" | Any listing page | Label text matches expected Portuguese |
| MA-04 | CA-02.1 | Given the dropdown is open / When the user counts options / Then there are exactly 12 | Current date: any | Option count = 12 |
| MA-05 | CA-02.2 | Given current month is March 2026 / When the user opens the dropdown / Then the first option is "Março 2026" | Date mocked to March 2026 | First option text matches |
| MA-06 | CA-02.3 | Given current month is March 2026 / When the user opens the dropdown / Then the last option is "Fevereiro 2027" | Date mocked to March 2026 | Last option text matches |
| MA-07 | CA-02.4 | Given the dropdown is open / When the user reads any option / Then it shows "Month YYYY" format | Any date | All options match format |
| MA-08 | CA-03.1 | Given the user selects "Junho 2026" / When the frontend sends a list request / Then the request includes `expirationMonth=2026-06` | Contratos or Licenças listing | Request query param present with correct value |
| MA-09 | CA-03.2 | Given the backend receives `expirationMonth=2026-06` / When the backend processes the list / Then the index is filtered before pagination | Index with mixed expiration dates | Only June 2026 items in response |
| MA-10 | CA-03.3 | Given 5 items expire in June 2026 out of 100 total / When the user selects "Junho 2026" / Then pagination total shows 5 | 100 items, 5 in June | `pagination.total = 5` |
| MA-11 | CA-03.4 | Given search "ABC" and expirationMonth "2026-06" both active / When the backend processes / Then only items matching both returned | Mixed items | AND logic applied |
| MA-12 | CA-04.1 | Given a Contrato has `fimContratoCPA`=2026-06-15 and `fimContratoSH`=2026-08-01 / When user selects "Junho 2026" / Then the Contrato is included | Contract with both dates | Earliest date (June) used for match |
| MA-13 | CA-04.2 | Given a Contrato has only `fimContratoSH`=2026-06-20 / When user selects "Junho 2026" / Then the Contrato is included | Contract with one date | Available date used |
| MA-14 | CA-04.3 | Given a Contrato expires in July 2026 / When user selects "Junho 2026" / Then the Contrato is NOT included | Contract expiring July | Item excluded |
| MA-15 | CA-05.1 | Given a Licença has `dataVencimento`=2026-06-10 / When user selects "Junho 2026" / Then the Licença is included | License with dataVencimento | Filter matches field |
| MA-16 | CA-05.2 | Given a Licença has `dataVencimento`=2026-07-01 / When user selects "Junho 2026" / Then the Licença is NOT included | License wrong month | Item excluded |
| MA-17 | CA-06.1 | Given a filter is active / When the user clears the filter / Then all items are displayed (paginated) | Previously filtered list | Full item count restored |
| MA-18 | CA-06.2 | Given a filter is active / When the user clears the filter / Then the dropdown returns to default state | Previously filtered list | Dropdown shows placeholder |
| MA-19 | CA-06.3 | Given a filter is active / When the user clears the filter / Then the request no longer includes `expirationMonth` | Previously filtered list | Param absent from request |
| MA-20 | CA-07.1 | Given no items expire in selected month / When user selects that month / Then empty state message shown | No matching items | Empty state visible |
| MA-21 | CA-07.2 | Given no items expire in selected month / When user selects that month / Then pagination total shows zero | No matching items | `pagination.total = 0` |
| MA-22 | CA-08.1 | Given some items have no expiration date / When user selects a filter month / Then items without expiration are excluded | Mixed items | No-date items hidden |
| MA-23 | CA-08.2 | Given some items have no expiration date / When no filter is active / Then items without expiration are visible | Mixed items | All items shown |
| MA-24 | CA-09.1 | Given a search term is entered / When user also selects an expiration month / Then both filters apply simultaneously | Search + filter | Both active |
| MA-25 | CA-09.2 | Given search and expiration filter active / When user views results / Then only items matching both shown | Search + filter | Intersection of criteria |
| MA-26 | CA-09.3 | Given expiration filter active showing 15 results / When user navigates to page 2 / Then page 2 of filtered dataset displayed | 15 filtered items, limit 10 | Correct page 2 items |
| MA-27 | CA-09.4 | Given user is on page 3 of unfiltered results / When user selects an expiration month / Then view resets to page 1 | Multi-page list | Page reset to 1 |
