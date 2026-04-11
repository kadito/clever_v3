---
inclusion: fileMatch
fileMatchPattern: ["**/contracts/**", "**/contracts.*"]
---

# Contract Form Patterns

## Overview

This document outlines the established patterns for contract form implementation
in the CLEVER dashboard, including the display toggle system, plan selection
logic, and read-only field handling.

## Display Toggle System

### Implementation Pattern

Contract forms use a display toggle system that allows users to enable/disable
different contract sections (CPA and S&H) independently.

```vue
<template>
  <!-- Display Toggle for Contract Section -->
  <DisplayToggleSwitch
    title="CPA"
    :is-active="showCPASection"
    @toggle="handleCPADisplayToggle"
  />

  <!-- Contract Section Content -->
  <Transition name="section-slide" mode="out-in">
    <CPAContractSection
      v-if="showCPASection"
      :form-data="formData || {}"
      :cpa-equipments="cpaEquipments"
      :selected-plan-details="selectedCPAPlanDetails"
      :is-loading-plan="isLoadingCPAPlan"
      @update-field="updateFieldValue"
      @equipment-updated="handleEquipmentUpdate"
      @plan-selected="handleCPAPlanSelection"
    />
  </Transition>
</template>
```

### Toggle Handler Pattern

```typescript
const handleCPADisplayToggle = (active: boolean) => {
  showCPASection.value = active;

  if (active) {
    // Initialize section data if it doesn't exist
    if (!formData.value.hasCPAContract) {
      updateFieldValue('hasCPAContract', true);
      initializeCPAData();
    }
  } else {
    // When hiding section, mark as not having contract
    updateFieldValue('hasCPAContract', false);
    clearCPAValidationErrors();
  }
};
```

### Key Principles

1. **Independent Sections**: CPA and S&H sections can be active simultaneously
2. **State Persistence**: Toggle states are persisted in form data
3. **Data Initialization**: Section data is initialized when toggled on
4. **Validation Cleanup**: Section-specific validation errors are cleared when
   toggled off
5. **Smooth Transitions**: Use CSS transitions for show/hide animations

## Plan Selection Logic

### Dynamic Plan Filtering

Plans are filtered based on the selected contract type:

```typescript
// Plan details computed properties with memoization
const selectedCPAPlanDetails = computed(() => {
  if (!formData.value?.planIdCPA || !formData.value?.cpaContractType) {
    return null;
  }

  const cacheKey = `${formData.value.cpaContractType}-${formData.value.planIdCPA}`;

  // Check cache first for performance
  if (planDetailsCache.has(cacheKey)) {
    return planDetailsCache.get(cacheKey);
  }

  try {
    const contractType = formData.value.cpaContractType as ContractType;
    const planDetails = getPlanDetails(contractType, formData.value.planIdCPA);

    // Cache the result for future use
    if (planDetails) {
      planDetailsCache.set(cacheKey, markRaw(planDetails));
    }

    return planDetails;
  } catch (error) {
    console.error(
      'Error getting CPA plan details:',
      JSON.stringify(error, null, 2)
    );
    return null;
  }
});
```

### Plan Selection Handlers

```typescript
const handleCPAPlanSelection = async (planId: string) => {
  updateFieldValue('planIdCPA', planId);

  if (planId && formData.value?.cpaContractType) {
    await loadCPAPlanDetails(planId, formData.value.cpaContractType);

    // Auto-populate service details from plan data
    const planDetails = getPlanDetails(
      formData.value.cpaContractType as ContractType,
      planId
    );

    if (planDetails) {
      // Set maintenance per year (CPA plans have this field)
      if (planDetails.maintenancePerYear !== undefined) {
        updateFieldValue(
          'manutencoesPorAnoCPA',
          planDetails.maintenancePerYear
        );
      }

      // Set displacements per year with unlimited value handling
      if (planDetails.callouts !== undefined) {
        if (typeof planDetails.callouts === 'number') {
          updateFieldValue('deslocacoesPorAnoCPA', planDetails.callouts);
        } else if (typeof planDetails.callouts === 'string') {
          const match = planDetails.callouts.match(/(\d+)/);
          if (match) {
            const value = parseInt(match[1]);
            updateFieldValue('deslocacoesPorAnoCPA', value);
          } else {
            // If no number found, check if it's unlimited (contains "sem limite" or "unlimited")
            if (
              planDetails.callouts.toLowerCase().includes('sem limite') ||
              planDetails.callouts.toLowerCase().includes('unlimited')
            ) {
              updateFieldValue('deslocacoesPorAnoCPA', -1); // -1 represents unlimited
            } else {
              updateFieldValue('deslocacoesPorAnoCPA', 0);
            }
          }
        }
      }

      // CPA plans don't typically have hours, so set to 0
      updateFieldValue('horasAssistenciaAnualCPA', 0);
    }
  }
};
```

### Key Principles

1. **Dynamic Filtering**: Plans are filtered based on contract type selection
2. **Auto-Population**: Service details are automatically populated from plan
   data
3. **Performance Optimization**: Use caching and memoization for plan details
4. **Error Handling**: Graceful handling of missing or invalid plan data
5. **Type Safety**: Use proper TypeScript types for plan data
6. **Unlimited Values**: Use `-1` to represent unlimited values (displacements,
   hours, etc.)

## Unlimited Values Handling

### Convention

The system uses `-1` to represent unlimited values in contract service details:

- `deslocacoesPorAnoCPA: -1` = Unlimited CPA displacements per year
- `deslocacoesPorAnoSH: -1` = Unlimited S&H displacements per year
- `horasAssistenciaAnualCPA: -1` = Unlimited CPA hours per year (if applicable)
- `horasAssistenciaAnualSH: -1` = Unlimited S&H hours per year (if applicable)

### Detection Logic

```typescript
// Check if plan description indicates unlimited
if (
  planDetails.callouts.toLowerCase().includes('sem limite') ||
  planDetails.callouts.toLowerCase().includes('unlimited')
) {
  updateFieldValue('deslocacoesPorAnoCPA', -1); // -1 represents unlimited
} else {
  updateFieldValue('deslocacoesPorAnoCPA', 0);
}
```

### Display Logic

In detail views and display components, convert `-1` back to user-friendly text:

```vue
<div class="detail-value">
  {{ (contract?.data.deslocacoesPorAnoCPA || contract?.data.deslocacoesPorAno) === -1 
      ? 'Ilimitado' 
      : (contract?.data.deslocacoesPorAnoCPA || contract?.data.deslocacoesPorAno || 0) }}
</div>
```

### Validation Rules

Validation functions must allow `-1` for unlimited values:

```typescript
// Allow -1 (unlimited) or positive numbers, but not 0 or other negative numbers
if (
  typeof data.deslocacoesPorAnoCPA !== 'number' ||
  (data.deslocacoesPorAnoCPA !== -1 && data.deslocacoesPorAnoCPA <= 0)
) {
  errors.push(
    'As deslocações por ano CPA devem ser um número positivo ou -1 para ilimitado'
  );
}
```

### Key Principles

1. **Consistent Convention**: Always use `-1` for unlimited values across the
   system
2. **Detection Keywords**: Look for "sem limite", "unlimited", or similar
   phrases in plan descriptions
3. **User-Friendly Display**: Convert `-1` to "Ilimitado" in Portuguese for user
   interfaces
4. **Validation Support**: Update validation rules to accept `-1` as a valid
   unlimited value
5. **Data Integrity**: Ensure unlimited values are properly stored and retrieved
   from R2 storage

## Dynamic Price Calculations

### Overview

The system implements dynamic price calculations that account for POS packages
and additional equipment costs.

### Pricing Formula

`TOTAL_PRICE = BASE_PRICE + POS_PACKAGE(+100€) + Σ(BASE_PRICE * (1 - DISCOUNT/100))`

### Pricing Components

1. **Base Plan Price**: The standard plan price based on contract type, plan,
   and distance
2. **POS Package**: Fixed €100/year for CPA_1500 PREMIUM when `hasPOSPackage` is
   enabled
3. **Additional Equipment**: Each additional equipment (beyond the first) costs
   the same as the base plan price, with discount applied

### Equipment Pricing Logic

- **First Equipment**: Included in base plan price (no additional cost)
- **Additional Equipment**: Each costs the same as the base plan price
- **Discount Application**:
  `EQUIPMENT_COST = BASE_PRICE * (1 - DISCOUNT_PERCENTAGE/100)`

### Example Calculations

**CPA_1500 PREMIUM + POS Package + 2 Equipments (second with 50% discount):**

**Annual Payment:**

- Base Plan: €825
- POS Package: +€100
- Equipment 2 (50% discount): +€412.50 (€825 × 0.5)
- **Total Annual**: €1,337.50

**Monthly Payment:**

- Base Plan: €75
- POS Package: +€8.33 (€100 ÷ 12)
- Equipment 2 (50% discount): +€37.50 (€75 × 0.5)
- **Total Monthly**: €120.83
- **Total Monthly × 12**: €1,449.96

**Savings**: ((€1,449.96 - €1,337.50) ÷ €1,449.96) × 100 = **7.75%**

**CPA Premium (Annual: €825) + 3 Equipments:**

**Annual Payment:**

- Base Plan: €825
- Equipment 2 (25% discount): +€618.75 (€825 × 0.75)
- Equipment 3 (0% discount): +€825.00 (€825 × 1.0)
- **Total Annual**: €2,268.75

**Monthly Payment (€75 base):**

- Base Plan: €75
- Equipment 2 (25% discount): +€56.25 (€75 × 0.75)
- Equipment 3 (0% discount): +€75.00 (€75 × 1.0)
- **Total Monthly**: €206.25
- **Total Monthly × 12**: €2,475.00

**Savings**: ((€2,475.00 - €2,268.75) ÷ €2,475.00) × 100 = **8.33%**

### Implementation Details

- Equipment pricing is calculated dynamically based on the base plan price **for
  each payment period**
- **Monthly**: Equipment cost = Monthly base price × (1 - discount%)
- **Annual**: Equipment cost = Annual base price × (1 - discount%)
- POS package cost is fixed at €100/year regardless of payment frequency
- All additional costs are calculated proportionally for each payment period
- Price breakdown section shows composition when additional costs exist
- Savings calculation compares total annual cost vs total monthly cost × 12

## Manual Benefit Override (BenefitFieldsGroup)

### Overview

Contract plans auto-populate 3 benefit fields per section (CPA/S&H), but users can override them manually. The `BenefitFieldsGroup.vue` component encapsulates this pattern.

### Fields

| Label (PT) | CPA field | S&H field |
|-------------|-----------|-----------|
| HORAS DE ASSISTÊNCIA ANUAL | `horasAssistenciaAnualCPA` | `horasAssistenciaAnualSH` |
| DESLOCAÇÕES POR ANO | `deslocacoesPorAnoCPA` | `deslocacoesPorAnoSH` |
| MANUTENÇÕES POR ANO | `manutencoesPorAnoCPA` | `manutencoesPorAnoSH` |

### Validation rules

- Accepted: integers ≥ 0 or -1 (unlimited)
- Rejected: negative ≠ -1, non-numeric, empty
- Inline validation on `@input` / `@blur` with PT error messages
- Submission blocked if any benefit field is invalid

### Integration pattern

- Placed in CPA/SH sections after `ContractDatesSection`, before `DynamicPlanDetails`
- Props bound to `formData.{field}`, emits propagate via `update-field`
- `disabled` when no plan selected (`!formData.planIdCPA` / `!formData.planIdSH`)
- Plan selection auto-populates values; changing plan overwrites manual edits

## Equipment Management

### CPA Equipment Pattern

```typescript
// Equipment management state
const cpaEquipments = ref<ContractEquipment[]>([]);

// Equipment update handler
const handleEquipmentUpdate = (data: {
  action: string;
  index?: number;
  equipment?: ContractEquipment;
}) => {
  switch (data.action) {
    case 'add':
      if (data.equipment) {
        cpaEquipments.value.push(data.equipment);
      }
      break;
    case 'update':
      if (data.index !== undefined && data.equipment) {
        cpaEquipments.value[data.index] = data.equipment;
      }
      break;
    case 'remove':
      if (data.index !== undefined) {
        cpaEquipments.value.splice(data.index, 1);
      }
      break;
  }
};

// Watch for equipment changes and update form data
watch(
  cpaEquipments,
  newEquipments => {
    updateFieldValue('cpaEquipments', newEquipments);
  },
  { deep: true }
);
```

### Key Principles

1. **Reactive Arrays**: Use reactive arrays for equipment management
2. **Action-Based Updates**: Handle equipment updates through action objects
3. **Form Data Sync**: Automatically sync equipment arrays with form data
4. **Deep Watching**: Use deep watchers for nested object changes

## Read-Only Fields in Update Views

### Form Section Modification

For update views that need read-only fields (like client selection), modify the
form sections:

```typescript
// Create modified form sections with readonly clientId field
const modifiedFormSections = computed(() => {
  return contractsFormSections.map(section => ({
    ...section,
    fields: section.fields.map(field => {
      if (field.key === 'clientId') {
        return {
          ...field,
          readonly: true,
        };
      }
      return field;
    }),
  }));
});
```

### Custom Field Template

```vue
<template #field-clientId="{ formData, error, updateFieldValue }">
  <ClientSearchInput
    :model-value="formData?.clientId || ''"
    :readonly="true"
    :selected-client="selectedClient"
    :has-error="!!error"
    @update:model-value="value => updateFieldValue('clientId', value)"
    @client-selected="handleClientSelected"
  />
  <p v-if="error" class="form-error text-red-600 text-sm mt-1">{{ error }}</p>
  <p class="form-help text-xs text-gray-500 mt-1">
    <svg
      class="w-4 h-4 text-gray-400 inline mr-1"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
    O cliente não pode ser alterado durante a edição do contrato.
  </p>
</template>
```

### Key Principles

1. **Form Section Modification**: Use computed properties to modify form
   sections for readonly behavior
2. **Visual Indicators**: Provide clear visual indicators for read-only fields
3. **Component Support**: Ensure components support readonly props
4. **Data Integrity**: Include read-only field values in form submissions

## Validation Patterns

### Contract Type-Specific Validation

```typescript
const validateContractUpdate = (
  data: Record<string, any>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  try {
    // Contract type validation - at least one must be configured
    const hasCPA = data.hasCPAContract;
    const hasSH = data.hasSHContract;

    if (!hasCPA && !hasSH) {
      errors.contractTypes =
        'Por favor, mantenha pelo menos um tipo de contrato (CPA ou S&H)';
    }

    // CPA-specific validation (if CPA is configured)
    if (hasCPA) {
      if (!data.cpaContractType) {
        errors.cpaContractType = 'Por favor, selecione o tipo de contrato CPA';
      }

      if (!data.planIdCPA) {
        errors.planIdCPA = 'Por favor, selecione um plano CPA';
      }

      // Distance is only required for CPA (2023), not CPA_1500
      if (data.cpaContractType === 'CPA' && !data.distanceCPA) {
        errors.distanceCPA =
          'Por favor, selecione a distância para contratos CPA (2023)';
      }

      // Validate equipment
      const cpaEquipmentsData = data.cpaEquipments || cpaEquipments.value;
      if (!cpaEquipmentsData || cpaEquipmentsData.length === 0) {
        errors.cpaEquipments =
          'Por favor, mantenha pelo menos um equipamento CPA';
      }
    }

    // S&H-specific validation (if S&H is configured)
    if (hasSH) {
      // Similar validation logic for S&H
    }
  } catch (err) {
    console.error('Contract validation error:', err);
    errors.general = 'Erro na validação do contrato';
  }

  return errors;
};
```

### Key Principles

1. **Conditional Validation**: Apply validation rules based on contract type
   selection
2. **Portuguese Messages**: Use Portuguese language for all validation messages
3. **Structured Errors**: Return structured error objects with field-specific
   messages
4. **Error Handling**: Gracefully handle validation errors with fallback
   messages

## Performance Optimization

### Caching and Memoization

```typescript
// Plan details cache for performance optimization
const planDetailsCache = createCache<string, any>();

// Use markRaw to prevent deep reactivity on cached data
if (planDetails) {
  planDetailsCache.set(cacheKey, markRaw(planDetails));
}

// Debounced update function for better performance
const debouncedUpdateField = createDebounced((field: string, value: any) => {
  updateFieldValue(field, value);
}, 300);
```

### Key Principles

1. **Caching**: Cache frequently accessed data like plan details
2. **Memoization**: Use computed properties with caching for expensive
   operations
3. **Debouncing**: Debounce frequent updates to improve performance
4. **Shallow Reactivity**: Use markRaw for cached data to prevent unnecessary
   reactivity

## Common Patterns

### Component Cleanup

```typescript
// Cleanup tracking
const cleanupFunctions: (() => void)[] = [];

// Add watchers to cleanup functions
const stopWatcher = watch(/* ... */);
cleanupFunctions.push(stopWatcher);

// Component cleanup
onBeforeUnmount(() => {
  // Clear caches
  planDetailsCache.clear();

  // Run all cleanup functions
  cleanupFunctions.forEach(cleanup => cleanup());
  cleanupFunctions.length = 0;
});
```

### Error Handling

```typescript
// Structured error handling
try {
  // Operation
} catch (err) {
  console.error('Operation failed:', JSON.stringify(err, null, 2));
  error.value = err instanceof Error ? err.message : 'Erro na operação';
}
```

### Key Principles

1. **Cleanup Management**: Track and cleanup watchers and resources
2. **Error Logging**: Use structured logging with JSON.stringify for objects
3. **User-Friendly Errors**: Provide Portuguese error messages for users
4. **Resource Management**: Clear caches and cleanup resources on unmount

## Testing Considerations

### Manual Testing Checklist

- [ ] Toggle switches work correctly and show/hide sections
- [ ] Plan selection filters correctly based on contract type
- [ ] Price tables display immediately after plan selection
- [ ] Equipment management allows add/edit/remove operations
- [ ] Read-only fields display correctly and prevent modifications
- [ ] Form validation works for different contract type combinations
- [ ] Data is properly saved and retrieved
- [ ] Client information displays correctly in read-only mode
- [ ] All Portuguese text displays correctly
- [ ] Mobile responsiveness works across all form sections
- [ ] Unlimited values (-1) are properly detected from plan descriptions
- [ ] Unlimited values display as "Ilimitado" in detail views
- [ ] Validation accepts -1 for unlimited values
- [ ] Plans with "sem limite" text correctly set displacement values to -1

### Common Issues to Watch For

1. **Toggle State Persistence**: Ensure toggle states are maintained during
   navigation
2. **Plan Cache Invalidation**: Clear plan cache when contract types change
3. **Equipment Array Synchronization**: Ensure equipment arrays stay in sync
   with form data
4. **Validation Rule Conflicts**: Check for conflicting validation rules between
   contract types
5. **Read-Only Field Submission**: Ensure read-only field values are included in
   form submissions
6. **Unlimited Value Detection**: Ensure plans with "sem limite" text are
   properly detected and set to -1
7. **Unlimited Value Display**: Verify that -1 values display as "Ilimitado" in
   all views
8. **Validation Edge Cases**: Test that validation properly handles -1 values
   without errors
