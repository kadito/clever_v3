# Pré-Seleção de Contrato no Pagamento — Tasks

## Task list

- [x] 1. Remover guarda condicional em WorkSheetsCreateView
  - Design ref: [§Architecture Overview](design.md#architecture-overview)
  - Test ref: [MI-01, MI-03](tests.md#mi--strategy)
  - Scope:
    - modify `packages/frontend/src/views/work-sheets/WorkSheetsCreateView.vue`
  - Covers: PRESEL-AC-001, AC-002, AC-003, AC-005, AC-006, AC-007
  - Depends on: none
  - Done when: `fetchClientContracts()` assigns `clientContracts.value[0].uuid` to contractId whenever `clientContracts.value.length >= 1` (guard `if (clientContracts.value.length === 1)` removed)

- [x] 2. Remover guarda condicional em RemoteAssistanceCreateView
  - Design ref: [§Architecture Overview](design.md#architecture-overview)
  - Test ref: [MI-02, MI-04](tests.md#mi--strategy)
  - Scope:
    - modify `packages/frontend/src/views/remote-assistance/RemoteAssistanceCreateView.vue`
  - Covers: PRESEL-AC-008, AC-009, AC-010
  - Depends on: none
  - Done when: `fetchClientContracts()` assigns `clientContracts.value[0].uuid` to contractId whenever `clientContracts.value.length >= 1` (guard removed, identical pattern to task 1)

## Property-Based Tests (Optional)

- [ ]* 3. PBT — Pré-seleção seleciona sempre o primeiro contrato (P-1)
  - Design ref: [§Correctness Properties](design.md#correctness-properties)
  - Test ref: —
  - Scope:
    - create `packages/frontend/src/views/work-sheets/__tests__/pbt-contract-preselect.test.ts`
  - Covers: PRESEL-AC-001, AC-003
  - Depends on: 1
  - Done when: fast-check runs 100+ cases with arrays of 1..N contracts, all verify contractId === contracts[0].uuid

- [ ]* 4. PBT — Contratos vazios não produzem seleção (P-2)
  - Design ref: [§Correctness Properties](design.md#correctness-properties)
  - Test ref: —
  - Scope:
    - create `packages/frontend/src/views/work-sheets/__tests__/pbt-contract-empty.test.ts`
  - Covers: PRESEL-AC-006, AC-007
  - Depends on: 1
  - Done when: fast-check runs 100+ cases with empty contract arrays, all verify contractId === ''

- [ ]* 5. PBT — Mudança de cliente re-dispara pré-seleção (P-3)
  - Design ref: [§Correctness Properties](design.md#correctness-properties)
  - Test ref: —
  - Scope:
    - create `packages/frontend/src/views/work-sheets/__tests__/pbt-contract-client-change.test.ts`
  - Covers: PRESEL-AC-009
  - Depends on: 1
  - Done when: fast-check runs 100+ cases with client pairs, all verify contractId updates to new client's contracts[0].uuid
