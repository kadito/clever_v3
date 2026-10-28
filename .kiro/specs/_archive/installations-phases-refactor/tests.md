# Programação de Instalações (Phases Refactor) — Tests

## [MI] — Strategy

| Interface | Test type | Key scenarios from design | Mocked dependencies | REQ-ID |
|-----------|-----------|--------------------------|---------------------|--------|
| `validatePhaseCompletion(1, data)` | unit | Empty installationTypes array blocks; single entry passes; multiple entries pass | None (pure function) | INST-AC-001, INST-AC-002 |
| `validatePhaseCompletion(2, data)` | unit | equipamentoCliente=true + empty description blocks; all verifications false still passes; null equipamentoCliente does not block | None (pure function) | INST-AC-005, INST-AC-006, INST-AC-009 |
| `validateSoftwareSelection(selection)` | unit | null returns false; brand-only (Vectron) passes; Pix without subProduct fails; Pix with subProduct+module passes; Zon Soft without tier fails; PT CERT without licenseType fails | None (pure function) | INST-AC-010–016 |
| `validatePhaseCompletion(4, data)` | unit | Disabled category ignored; enabled category with no items checked fails; equipamentoAdicional=false + empty motivo fails | None (pure function) | INST-AC-017–022 |
| `validatePhaseCompletion(6, data)` | unit | falhasDetectadas=null blocks; falhasDetectadas=true + empty description blocks; falhasDetectadas=false passes | None (pure function) | INST-AC-023–025 |
| `getPhaseValidationErrors(1, data)` | unit | Returns 'installationTypes' for empty array; returns empty for valid data | None (pure function) | INST-AC-026 |
| `getPhaseValidationErrors(3, data)` | unit | Returns 'software' when null; returns 'software.subProduct' when incomplete hierarchy | None (pure function) | INST-AC-026 |
| `adaptLegacyData(oldData)` | unit | Converts single installationType to array; maps old Phase2 fields; maps software string to SoftwareSelection; adds default falhasDetectadas | None (pure function) | — (backward compat) |

## Correctness Properties

### P-1 — Installation types non-empty on completion
**Requirement**: INST-AC-001 — The system SHALL allow adding multiple installation type entries WHEN the technician is in the Setup phase
**Property**: For any `InstallationSevenPhasesData` where Phase 1 validation passes, `installationTypes.length >= 1`
**Test approach**: fast-check — generate random `InstallationSevenPhasesData` with varying `installationTypes`, verify `validatePhaseCompletion(1, data) === true` implies `data.installationTypes.length >= 1`

### P-2 — Software selection completeness
**Requirement**: INST-AC-012, INST-AC-014, INST-AC-015 — Sub-level selection required when brand has sub-products
**Property**: For any `SoftwareSelection` where `validateSoftwareSelection(selection) === true`, if the brand has subProducts in `SOFTWARE_HIERARCHY`, then `selection.subProduct` is defined and matches a valid sub-product name
**Test approach**: fast-check — generate random `SoftwareSelection` objects, verify valid selections always have complete sub-level fields matching `SOFTWARE_HIERARCHY`

### P-3 — Disabled categories excluded from validation
**Requirement**: INST-AC-018 — The system SHALL hide all child fields of a section WHEN the parent toggle is set to FALSE
**Property**: For any `Phase4PreparacaoData` where a category has `enabled === false`, that category's items do not affect `validatePhaseCompletion(4, data)` result
**Test approach**: fast-check — generate random Phase 4 data, flip a category to disabled, verify validation result does not change based on that category's item values

### P-4 — Conditional text areas required only when toggled
**Requirement**: INST-AC-027, INST-AC-028 — Conditional text boxes block progression only when their toggle is active
**Property**: For any phase data, `getPhaseValidationErrors()` includes a conditional text field error only when the parent toggle activates it (`falhasDetectadas === true` and `falhasDescricao` empty, OR `equipamentoCliente === true` and `equipamentoClienteDescricao` empty)
**Test approach**: fast-check — generate random phase data combinations, verify error arrays only contain conditional field names when the toggle condition is met


## [MA] — Acceptance Test Plan

| MA-ID | Scenario | Preconditions | Steps | Expected result | REQ-ID |
|-------|----------|---------------|-------|-----------------|--------|
| MA-01 | Add multiple installation types | Form open at Phase 1 | 1. Select "POS" from dropdown 2. Click "Adicionar" 3. Select "POS" again 4. Click "Adicionar" 5. Select "CPA" 6. Click "Adicionar" | List shows 3 entries: POS, POS, CPA. All removable. | INST-AC-001, INST-AC-002 |
| MA-02 | Remove installation type entry | Phase 1 with 2+ entries | 1. Click ✕ on one entry | Entry removed from list, others remain | INST-AC-003 |
| MA-03 | Equipamento do Cliente conditional | Phase 2 open | 1. Select "Sim" 2. Observe text area appears 3. Select "Não" 4. Observe text area disappears | Text area visible only when SIM | INST-AC-005, INST-AC-006 |
| MA-04 | Verificações always visible | Phase 2 open | 1. Observe 5 toggle switches always present (Cabo, Transformador, Fechadura, Chaves, Testes ao equipamento) | All 5 items rendered unconditionally | INST-AC-007, INST-AC-008 |
| MA-05 | Phase 2 progression without verifications | Phase 2, no verifications checked | 1. Leave all verificação toggles OFF 2. Click "Next Phase" | Phase advances to Phase 3 without blocking | INST-AC-009 |
| MA-06 | Software hierarchical selection — Pix | Phase 3 open | 1. Select "Pix" 2. See sub-products appear 3. Select "Pix Rest" 4. See modules appear 5. Select "Modulo 1" | Full selection: Pix > Pix Rest > Modulo 1 | INST-AC-011, INST-AC-012 |
| MA-07 | Software hierarchical selection — Zon Soft | Phase 3 open | 1. Select "Zon Soft" 2. Select "ZS Rest" 3. Select "Pro" | Full selection: Zon Soft > ZS Rest > Pro | INST-AC-013, INST-AC-014 |
| MA-08 | Software selection — brand without sub-levels | Phase 3 open | 1. Select "Vectron" | Selection complete (no sub-product needed) | INST-AC-010, INST-AC-016 |
| MA-09 | Phase 4 toggleable sections | Phase 4 open | 1. Toggle POS section OFF 2. Observe children hidden 3. Toggle POS section ON 4. Observe children visible | Children visibility follows parent toggle | INST-AC-017, INST-AC-018, INST-AC-019 |
| MA-10 | Equipamento adicional reversed toggle | Phase 4, last section | 1. Set toggle to FALSE 2. Observe "Porquê?" text area appears 3. Set toggle to TRUE 4. Observe text area disappears | Text area visible when FALSE, hidden when TRUE | INST-AC-020, INST-AC-021, INST-AC-022 |
| MA-11 | Falhas detectadas conditional | Phase 6 open | 1. Select "Sim" 2. Observe text area appears 3. Select "Não" 4. Observe text area disappears | Defect description visible only when SIM | INST-AC-023, INST-AC-024, INST-AC-025 |
| MA-12 | Validation blocks on required text empty | Phase 6, Falhas=SIM, empty description | 1. Set "Falhas detectadas" to SIM 2. Leave description empty 3. Click "Next Phase" | Validation blocks, highlights field | INST-AC-027 |
| MA-13 | Legacy data displays correctly | Open existing installation with old data format | 1. Navigate to detail view of old record | Record renders with adapted data (installationType → array, old phases → new structure) | backward compat |
