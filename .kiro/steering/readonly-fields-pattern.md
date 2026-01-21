# Read-Only Fields Pattern

## Overview

When implementing update views that need certain fields to be read-only (like
client selection in contract updates), follow this established pattern used in
LicensesUpdateView.

## Implementation Pattern

### 1. Modify Form Sections

Create a computed property that modifies the form sections to mark specific
fields as readonly:

```typescript
// Create modified form sections with readonly clientId field
const modifiedFormSections = computed(() => {
  return originalFormSections.map(section => ({
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

### 2. Use Modified Form Sections in Template

```vue
<ContentFormTemplate
  :form-sections="modifiedFormSections"
  <!-- other props -->
>
```

### 3. Custom Field Template (if needed)

If you need custom display for the readonly field, you can still provide a
custom template:

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

## Key Points

1. **Form Section Modification**: The `readonly: true` property in form sections
   is the primary mechanism for making fields read-only
2. **ClientSearchInput Component**: The component already supports `readonly`
   prop and will display the selected client information without allowing
   changes
3. **Visual Indicators**: Add helpful text and icons to indicate why the field
   is read-only
4. **Consistent Pattern**: Use this same pattern across all update views that
   need read-only fields

## Components That Support Readonly

- `ClientSearchInput`: Displays selected client info when readonly=true
- Standard form inputs: Automatically become read-only when field.readonly=true
- Custom components: Should implement readonly behavior based on props

## Example Usage

This pattern is used in:

- `LicensesUpdateView.vue` - clientId field is readonly
- `ContractsUpdateView.vue` - clientId field is readonly

For more detailed contract-specific patterns, see `contract-form-patterns.md`.

## Common Mistakes to Avoid

1. **Don't rely only on component props**: The form section modification is
   required for proper readonly behavior
2. **Don't forget to use modifiedFormSections**: Use the computed property, not
   the original form sections
3. **Don't skip visual indicators**: Always provide clear indication why a field
   is read-only
4. **Don't forget client loading**: Ensure selectedClient is properly loaded for
   display in readonly mode

## Testing Checklist

- [ ] Field displays existing data correctly
- [ ] Field cannot be modified (input is disabled/readonly)
- [ ] Visual indicators show field is read-only
- [ ] Form submission includes the readonly field value
- [ ] Client information displays properly in readonly mode
