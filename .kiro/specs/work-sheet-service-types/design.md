# Design — Work Sheet Service Types Expansion

**Spec:** work-sheet-service-types  
**Date:** 2026-11-08

---

## 1. Changed files

| File | Change |
|---|---|
| `packages/shared/src/types/work-sheets/types.ts` | Expand `serviceType` enum; add `horasExtra` to `WorkSheetOtherData`; update `WorkSheetSearchFilters` |
| `packages/shared/src/types/work-sheets/validation.ts` | New validation rules REQ-05.1, REQ-05.3 |
| `packages/shared/src/balance-extraction.ts` | Update `extractWorkSheetDebtTransaction` per REQ-07 |
| `packages/shared/src/index.ts` | Re-export if new types are added (likely no change needed) |
| `packages/frontend/src/config/work-sheets-form-sections.ts` | Update `serviceType` options; add `horasExtra` conditional field |
| `packages/frontend/src/views/work-sheets/WorkSheetDetailView.vue` | Display new type labels; show `horasExtra` when applicable |
| `packages/frontend/src/views/work-sheets/WorkSheetCreateView.vue` | Picks up changes via form config; no direct edit needed unless custom logic exists |
| `packages/frontend/src/views/work-sheets/WorkSheetUpdateView.vue` | Same as Create |

No backend route changes. No new R2 key patterns. No migration scripts.

---

## 2. Type changes (`types.ts`)

### `serviceType` — replace the union

```typescript
// Before
serviceType: 'ASSISTÊNCIA PRESENCIAL' | 'MANUTENÇÃO' | 'INSTALAÇÃO' | '';

// After
serviceType:
  | 'MANUTENÇÃO'
  | 'ASSISTÊNCIA PRESENCIAL CPA'
  | 'ASSISTÊNCIA PRESENCIAL SOFTWARE'
  | 'INSTALAÇÃO'
  | '';
```

The old value `'ASSISTÊNCIA PRESENCIAL'` is removed from the union. It will still appear
in stored records; TypeScript sees it as a stale string. Display and extraction code must
handle it via a fallback.

### `horasExtra` — new field on `WorkSheetOtherData`

```typescript
// Add to WorkSheetOtherData, after the `warranty` / `contract` block:
horasExtra: boolean; // HORAS EXTRA — only relevant for ASSISTÊNCIA PRESENCIAL CPA + CONTRATO
```

Default: `false`. The form config controls visibility.

### `WorkSheetSearchFilters` — update `serviceType` filter

```typescript
serviceType?:
  | 'MANUTENÇÃO'
  | 'ASSISTÊNCIA PRESENCIAL CPA'
  | 'ASSISTÊNCIA PRESENCIAL SOFTWARE'
  | 'INSTALAÇÃO';
```

---

## 3. Validation changes (`validation.ts`)

Two additions to the create/update validation function (exact file path to confirm at
implementation time — check if the file exists at
`packages/shared/src/types/work-sheets/validation.ts`):

**Rule A — serviceType required when CONTRATO (REQ-05.1)**
```typescript
if (data.displacement.paymentMethod === 'CONTRATO' && !data.otherData.serviceType) {
  errors.push('Tipo de serviço obrigatório quando o pagamento é por contrato');
}
```

**Rule B — horasExtra cleanup (REQ-05.3)**  
Not a validation error — a silent normalisation applied before saving:
```typescript
if (data.otherData.serviceType !== 'ASSISTÊNCIA PRESENCIAL CPA') {
  data.otherData.horasExtra = false;
}
```
Apply this in the backend route handler (contracts.ts equivalent for work-sheets) before
writing to R2, not in the shared validation function (which is pure / no side effects).

---

## 4. Balance extraction changes (`balance-extraction.ts`)

Replace the body of `extractWorkSheetDebtTransaction`:

```typescript
export function extractWorkSheetDebtTransaction(workSheet: WorkSheet): TransactionChanges {
  // Warranty — no transaction
  if (workSheet.data.otherData.warranty) {
    return { contractUsageChanges: {} };
  }

  const paymentMethod = workSheet.data.displacement.paymentMethod;
  const serviceType = workSheet.data.otherData.serviceType;

  // Non-contract payment — add to debt
  if (paymentMethod !== 'CONTRATO') {
    const snapshotPrice = workSheet.data.pricingSnapshot?.calculated.totalPrice;
    const totalPrice = (snapshotPrice != null && Number.isFinite(snapshotPrice))
      ? snapshotPrice
      : calculateWorkSheetTotals(workSheet.data).totalPrice;
    return { balanceChange: totalPrice };
  }

  // CONTRATO payment — consume resources by service type
  switch (serviceType) {
    case 'MANUTENÇÃO':
      // 1 manutenção + 1 deslocação (always together, REQ-07.2)
      return {
        contractUsageChanges: {
          manutencoesPorAno: -1,
          deslocacoesPorAno: -1,
        },
      };

    case 'ASSISTÊNCIA PRESENCIAL CPA':
    case 'ASSISTÊNCIA PRESENCIAL': { // legacy fallback (REQ-07.6)
      const changes: TransactionChanges = {
        contractUsageChanges: {
          deslocacoesPorAno: -1,
        },
      };
      // Consume hours only when horasExtra flag is set (REQ-07.3)
      if (workSheet.data.otherData.horasExtra) {
        const horasTotais = workSheet.data.request.totalHours || '0:00';
        const [h, m] = horasTotais.split(':').map(Number);
        const totalHours = (h || 0) + ((m || 0) / 60);
        if (totalHours > 0) {
          changes.contractUsageChanges!.horasAssistenciaAnuais = -totalHours;
        }
      }
      return changes;
    }

    case 'ASSISTÊNCIA PRESENCIAL SOFTWARE':
      // 1 deslocação from S&H resources (REQ-07.4)
      // Note: current model has single ContractUsage — per-section split is Saldo redesign scope
      return {
        contractUsageChanges: {
          deslocacoesPorAno: -1,
        },
      };

    case 'INSTALAÇÃO':
    case '':
    default:
      // No consumption (REQ-07.5)
      return { contractUsageChanges: {} };
  }
}
```

---

## 5. Form config changes (`work-sheets-form-sections.ts`)

In the `service` section, replace the `serviceType` options array:

```typescript
options: [
  { value: '', label: '--' },
  { value: 'MANUTENÇÃO', label: 'MANUTENÇÃO' },
  { value: 'ASSISTÊNCIA PRESENCIAL CPA', label: 'ASSISTÊNCIA PRESENCIAL CPA' },
  { value: 'ASSISTÊNCIA PRESENCIAL SOFTWARE', label: 'ASSISTÊNCIA PRESENCIAL SOFTWARE' },
  { value: 'INSTALAÇÃO', label: 'INSTALAÇÃO' },
],
```

Add `horasExtra` field immediately after `serviceType` in the `service` section:

```typescript
{
  key: 'horasExtra',
  label: 'Horas Extra',
  type: 'switch',
  fullWidth: false,
  switchLabel: 'Incluir horas no desconto do contrato',
  defaultValue: false,
  conditional: {
    dependsOn: 'serviceType',
    showWhen: (value: any) => value === 'ASSISTÊNCIA PRESENCIAL CPA',
  },
},
```

---

## 6. Detail view

In `WorkSheetDetailView.vue` (or `ContentDetailTemplate` config — confirm at
implementation), the `serviceType` value is already rendered via the stored string, so
new values display automatically. One addition needed:

Show `horasExtra` conditionally:
- Only render when `data.otherData.serviceType === 'ASSISTÊNCIA PRESENCIAL CPA'`
- Only render when `data.otherData.horasExtra === true`
- Label: **"Horas Extra: Sim"**

---

## 7. Backward compatibility

Legacy records store `serviceType: 'ASSISTÊNCIA PRESENCIAL'`. Three read paths must handle
this gracefully:

| Read path | Handling |
|---|---|
| Detail view display | Render the stored string as-is — no crash |
| List view card | Render the stored string as-is — no crash |
| `extractWorkSheetDebtTransaction` | `case 'ASSISTÊNCIA PRESENCIAL':` falls through to the CPA presential branch (REQ-07.6) |

No migration script needed — legacy records keep their stored value.

---

## 8. No backend route change

The work-sheet POST/PUT routes already pass the content body through to R2 via the
generic `content-route-template`. The new fields (`horasExtra`, updated `serviceType`)
are stored in `data.otherData` like all other fields. The only backend-layer touch is
the `horasExtra` normalisation (section 3, Rule B) in the work-sheet route's
post-validation hook — this mirrors the same pattern used for `warranty` cleanup.
