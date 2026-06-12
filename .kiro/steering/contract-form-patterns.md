---
inclusion: fileMatch
fileMatchPattern: ["**/contracts/**", "**/contracts.*"]
---

# Contract Form Patterns

## Display toggle system

- CPA and S&H sections can be active independently via `DisplayToggleSwitch`
- Toggle on → initialize section data + set `hasCPAContract`/`hasSHContract`
- Toggle off → mark contract as inactive + clear section validation errors
- CSS transitions for smooth show/hide

## Plan selection

- Plans filtered by `cpaContractType` or `shContractType`
- On plan selection: auto-populate benefit fields (hours, displacements, maintenances)
- Plan details cached via `planDetailsCache` with `markRaw()` to avoid deep reactivity
- Plan selection overwrites any manual benefit edits

## Benefit fields (BenefitFieldsGroup)

| Label (PT) | CPA field | S&H field |
|-------------|-----------|-----------|
| Horas de Assistência Anual | `horasAssistenciaAnualCPA` | `horasAssistenciaAnualSH` |
| Deslocações por Ano | `deslocacoesPorAnoCPA` | `deslocacoesPorAnoSH` |
| Manutenções por Ano | `manutencoesPorAnoCPA` | `manutencoesPorAnoSH` |

- Accepted values: integers ≥ 0 or -1 (unlimited)
- Disabled when no plan selected
- Inline validation on `@input`/`@blur` with PT messages

## Unlimited values convention

- `-1` = unlimited (displacements, hours, maintenances)
- Detection: plan description contains "sem limite" or "unlimited" → store -1
- Display: convert -1 to "Ilimitado" in detail/list views
- Validation: accept -1 as valid alongside positive integers

## Pricing formula

`TOTAL = BASE_PRICE + POS_PACKAGE(+100€/year) + Σ(ADDITIONAL_EQUIPMENT × (1 - DISCOUNT%))`

- First equipment included in base price
- Each additional equipment costs base price × (1 - discount%)
- POS package: fixed €100/year for CPA_1500 PREMIUM when `hasPOSPackage` enabled
- Monthly/annual prices calculated independently per payment period

## Equipment management

- Reactive arrays for equipment list (`cpaEquipments`, `shEquipments`)
- Action-based updates: add / update / remove
- Deep watcher syncs equipment array → form data
- At least one equipment required per active contract section

## Read-only fields in update views

- `clientId` field marked readonly via computed `modifiedFormSections`
- `ClientSearchInput` component supports `readonly` prop
- Visual indicator: lock icon + "O cliente não pode ser alterado durante a edição do contrato."

## Validation

- At least one contract type (CPA or S&H) must be active
- CPA requires: contractType, planId, distance (only for CPA 2023 type)
- S&H requires: contractType, planId
- Portuguese error messages throughout
