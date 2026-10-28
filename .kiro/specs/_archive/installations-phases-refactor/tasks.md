# Programação de Instalações (Phases Refactor) — Tasks

## Task list

- [x] 1. Create software hierarchy config
  - Design ref: §4 — Data Models — Software Hierarchy Config
  - Test ref: MI-03 (validateSoftwareSelection)
  - Scope:
    - create `packages/shared/src/types/installations-programming/software-config.ts`
    - modify `packages/shared/src/types/installations-programming/index.ts`
  - Covers: INST-BR-004, INST-AC-010
  - Depends on: none
  - Done when: `SoftwareHierarchy` type + `SOFTWARE_HIERARCHY` constant exported from `@clever/shared`, tsc passes

- [x] 2. Rewrite phase type interfaces
  - Design ref: §3 — Data Models — Phase Types
  - Test ref: —
  - Scope:
    - modify `packages/shared/src/types/installations-programming/types-seven-phases.ts`
  - Covers: INST-BR-001, INST-BR-002, INST-BR-003, INST-BR-005, INST-BR-006, INST-BR-007
  - Depends on: 1
  - Done when: `Phase2RececaoData`, `Phase3ProgramacaoData`, `Phase4PreparacaoData`, `Phase6TestesData` match design §3.2–3.5; `installationTypes: InstallationType[]` in main interface; tsc passes

- [x] 3. Rewrite phase validation functions
  - Design ref: §3 — Data Models — Phase Types, §4 — Software Hierarchy Config
  - Test ref: MI-01, MI-02, MI-03, MI-04, MI-05, MI-06, MI-07
  - Scope:
    - modify `packages/shared/src/types/installations-programming/validation-seven-phases.ts`
  - Covers: INST-AC-001, INST-AC-002, INST-AC-005, INST-AC-006, INST-AC-009, INST-AC-010–016, INST-AC-017–022, INST-AC-023–025, INST-AC-026–028
  - Depends on: 2
  - Done when: `validatePhaseCompletion` and `getPhaseValidationErrors` for phases 1, 2, 3, 4, 6 rewritten per design invariants; tsc passes; `pnpm --filter @clever/shared test` passes

- [x] 4. Update legacy adapter
  - Design ref: §5.8 — Legacy Adapter Updates
  - Test ref: MI-08 (adaptLegacyData)
  - Scope:
    - modify `packages/shared/src/types/installations-programming/legacy-adapter.ts`
  - Covers: backward compatibility
  - Depends on: 2
  - Done when: `adaptLegacyData()` converts old `installationType` → `installationTypes[]`, old Phase2/3/4/6 fields → new structures; tsc passes

- [x] 5. Rewrite Phase1SetupForm (repeatable types UI)
  - Design ref: §5.3 — Phase 1 — Setup
  - Test ref: —
  - Scope:
    - modify `packages/frontend/src/components/installations-programming/Phase1SetupForm.vue`
  - Covers: INST-AC-001, INST-AC-002, INST-AC-003
  - Depends on: 2
  - Done when: form renders add/remove list for `installationTypes[]`; dropdown + "Adicionar" button; remove (✕) per entry; tsc passes

- [x] 6. Rewrite Phase2RececaoForm (flat checklist)
  - Design ref: §5.4 — Phase 2 — Receção do Material
  - Test ref: —
  - Scope:
    - modify `packages/frontend/src/components/installations-programming/Phase2RececaoForm.vue`
  - Covers: INST-AC-004, INST-AC-005, INST-AC-006, INST-AC-007, INST-AC-008, INST-AC-009
  - Depends on: 2
  - Done when: "Equipamento do Cliente" SIM/NÃO with conditional textarea; "Verificações" always visible with 5 toggles; tsc passes

- [x] 7. Rewrite Phase3ProgramacaoForm (hierarchical software)
  - Design ref: §5.5 — Phase 3 — Programação
  - Test ref: —
  - Scope:
    - modify `packages/frontend/src/components/installations-programming/Phase3ProgramacaoForm.vue`
  - Covers: INST-AC-010, INST-AC-011, INST-AC-012, INST-AC-013, INST-AC-014, INST-AC-015, INST-AC-016
  - Depends on: 1, 2
  - Done when: cascading dropdowns render from `SOFTWARE_HIERARCHY`; brand → subProduct → module/tier selection; single selection enforced; tsc passes

- [x] 8. Rewrite Phase4PreparacaoForm (toggleable sections)
  - Design ref: §5.6 — Phase 4 — Preparação
  - Test ref: —
  - Scope:
    - modify `packages/frontend/src/components/installations-programming/Phase4PreparacaoForm.vue`
  - Covers: INST-AC-017, INST-AC-018, INST-AC-019, INST-AC-020, INST-AC-021, INST-AC-022
  - Depends on: 2
  - Done when: each category has parent toggle; disabled hides children; "Equipamento adicional" at end with reversed logic; tsc passes

- [x] 9. Update Phase6TestesForm (falhas detectadas)
  - Design ref: §5.7 — Phase 6 — Testes
  - Test ref: —
  - Scope:
    - modify `packages/frontend/src/components/installations-programming/Phase6TestesForm.vue`
  - Covers: INST-AC-023, INST-AC-024, INST-AC-025
  - Depends on: 2
  - Done when: "Falhas detectadas" SIM/NÃO toggle added; conditional textarea visible when SIM; tsc passes

- [x] 10. Update CreateView and UpdateView form data
  - Design ref: §5.1, §5.2 — Component Hierarchy, Data Flow
  - Test ref: —
  - Scope:
    - modify `packages/frontend/src/views/installations-programming/InstallationsProgrammingCreateView.vue`
    - modify `packages/frontend/src/views/installations-programming/InstallationsProgrammingUpdateView.vue`
  - Covers: INST-S-001, INST-S-006
  - Depends on: 2, 5
  - Done when: CreateView uses `installationTypes: []` in payload; UpdateView correctly binds new phase data interfaces; tsc passes

## Property-Based Tests (Optional)

- [ ]* 11. PBT — Installation types non-empty on completion (P-1)
  - Design ref: §Correctness Properties
  - Test ref: —
  - Scope:
    - create `packages/shared/src/types/installations-programming/__tests__/pbt-installation-types.test.ts`
  - Covers: INST-AC-001
  - Depends on: 3
  - Done when: fast-check runs 100+ cases, all pass

- [ ]* 12. PBT — Software selection completeness (P-2)
  - Design ref: §Correctness Properties
  - Test ref: —
  - Scope:
    - create `packages/shared/src/types/installations-programming/__tests__/pbt-software-selection.test.ts`
  - Covers: INST-AC-012, INST-AC-014, INST-AC-015
  - Depends on: 3
  - Done when: fast-check runs 100+ cases, all pass

- [ ]* 13. PBT — Disabled categories excluded from validation (P-3)
  - Design ref: §Correctness Properties
  - Test ref: —
  - Scope:
    - create `packages/shared/src/types/installations-programming/__tests__/pbt-disabled-categories.test.ts`
  - Covers: INST-AC-018
  - Depends on: 3
  - Done when: fast-check runs 100+ cases, all pass

- [ ]* 14. PBT — Conditional text areas required only when toggled (P-4)
  - Design ref: §Correctness Properties
  - Test ref: —
  - Scope:
    - create `packages/shared/src/types/installations-programming/__tests__/pbt-conditional-fields.test.ts`
  - Covers: INST-AC-027, INST-AC-028
  - Depends on: 3
  - Done when: fast-check runs 100+ cases, all pass
