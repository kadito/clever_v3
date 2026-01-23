# Contract Selection for Payment Method - Design

## Overview

This design implements contract selection functionality for Work Sheets and Remote Assistance when the payment method is "Contrato". The solution follows the existing ClientSearchInput pattern for consistency and reuses the established relation resolution system.

## Architecture

### Component Design

#### ContractSearchInput Component

A new reusable component following the exact pattern of `ClientSearchInput.vue`:

**Location**: `packages/frontend/src/components/common/ContractSearchInput.vue`

**Props**:
```typescript
interface Props {
  modelValue?: string;        // contractId
  clientId?: string;          // Required to filter contracts
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  hasError?: boolean;
}
```

**Emits**:
```typescript
interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'contractSelected', contract: Contract | null): void;
}
```

**Key Features**:
- Search and filter contracts by client ID
- Display contract number, type (CPA/S&H), and plan names
- Debounced search with 300ms delay
- Loading states and empty states
- Dropdown with search results
- Selected contract display (readonly mode)
- Mobile-first responsive design
- 44px minimum touch targets

**Display Format**:
```
CPA 1500 - PREMIUM CARE
Cliente: Empresa ABC Lda
Início: 01/01/2024 | Fim: 31/12/2024
```

Or for contracts with both types:
```
CPA 2023 - PROFESSIONAL CARE | S&H - GOLD
Cliente: Empresa ABC Lda
Início: 01/01/2024 | Fim: 31/12/2024
```

### Form Integration

#### Work Sheets Form Configuration

Update `packages/frontend/src/config/work-sheets-form-sections.ts`:

```typescript
{
  key: 'payment',
  title: 'Método de Pagamento',
  description: 'Forma de pagamento do serviço',
  fields: [
    {
      key: 'paymentMethod',
      label: 'Método de Pagamento',
      type: 'custom',
      required: true,
      fullWidth: true,
    },
    {
      key: 'contractId',
      label: 'Contrato',
      type: 'custom',
      required: true,
      fullWidth: true,
      conditional: {
        dependsOn: 'paymentMethod',
        showWhen: (value: any) => value === 'Contrato',
      },
    },
  ],
},
```

#### Remote Assistance Form Configuration

Update `packages/frontend/src/config/remote-assistance-form-sections.ts`:

Add new payment section:

```typescript
{
  key: 'payment',
  title: 'Método de Pagamento',
  description: 'Forma de pagamento da assistência',
  fields: [
    {
      key: 'paymentMethod',
      label: 'Método de Pagamento',
      type: 'select',
      required: true,
      fullWidth: false,
      options: [
        { value: '', label: 'Selecionar método...' },
        { value: 'Contrato', label: 'Contrato' },
        { value: 'Faturação', label: 'Faturação' },
        { value: 'Garantia', label: 'Garantia' },
      ],
    },
    {
      key: 'contractId',
      label: 'Contrato',
      type: 'custom',
      required: true,
      fullWidth: true,
      conditional: {
        dependsOn: 'paymentMethod',
        showWhen: (value: any) => value === 'Contrato',
      },
    },
  ],
},
```

### View Component Updates

#### Work Sheets Create/Update Views

**Files to Update**:
- `packages/frontend/src/views/work-sheets/WorkSheetsCreateView.vue`
- `packages/frontend/src/views/work-sheets/WorkSheetsUpdateView.vue`

**Changes**:
1. Import `ContractSearchInput` component
2. Add custom field template for `contractId`
3. Pass `clientId` from form data to filter contracts
4. Handle contract selection events

**Template Addition**:
```vue
<template #field-contractId="{ formData, error, updateFieldValue }">
  <ContractSearchInput
    :model-value="formData?.contractId || ''"
    :client-id="formData?.clientId || ''"
    :has-error="!!error"
    @update:model-value="value => updateFieldValue('contractId', value)"
    @contract-selected="handleContractSelected"
  />
  <p v-if="error" class="form-error text-red-600 text-sm mt-1">{{ error }}</p>
  <p v-if="!formData?.clientId" class="form-help text-xs text-gray-500 mt-1">
    Selecione um cliente primeiro para escolher um contrato
  </p>
</template>
```

#### Remote Assistance Create/Update Views

**Files to Update**:
- `packages/frontend/src/views/remote-assistance/RemoteAssistanceCreateView.vue`
- `packages/frontend/src/views/remote-assistance/RemoteAssistanceUpdateView.vue`

**Changes**: Same as Work Sheets views

#### Detail Views

**Files to Update**:
- `packages/frontend/src/views/work-sheets/WorkSheetsDetailView.vue`
- `packages/frontend/src/views/remote-assistance/RemoteAssistanceDetailView.vue`

**Changes**:
1. Display contract information when `contractId` exists
2. Use existing `RelationInfoDisplay` component for contract relation
3. Show contract details in payment section

**Template Addition**:
```vue
<!-- Contract Information (when payment method is Contrato) -->
<div v-if="workSheet?.data.paymentMethod === 'Contrato' && workSheet?.relations?.contract">
  <RelationInfoDisplay
    v-if="!isRelationError(workSheet.relations.contract)"
    :relation="workSheet.relations.contract"
    relation-type="contract"
    title="Contrato"
  />
  <div v-else class="relation-error">
    <p class="text-red-600">Erro ao carregar contrato</p>
  </div>
</div>
```

### Data Flow

#### Contract Filtering Logic

```typescript
// In ContractSearchInput component
const searchContracts = async (query: string) => {
  // Build search parameters
  const searchParams: any = { limit: 10 };
  
  // Filter by client ID if provided
  if (props.clientId) {
    searchParams.clientId = props.clientId;
  }
  
  // Add search query if provided
  if (query && query.length >= 1) {
    searchParams.search = query;
  }
  
  await contractsApi
    .fetchList(searchParams)
    .then(() => {
      if (contractsApi.items.value) {
        // Filter contracts by clientId on frontend
        searchResults.value = contractsApi.items.value.filter(
          contract => !props.clientId || contract.data.clientId === props.clientId
        );
      } else {
        searchResults.value = [];
      }
    })
    .catch(error => {
      console.error('Error searching contracts:', JSON.stringify(error, null, 2));
      searchResults.value = [];
    })
    .finally(() => {
      isLoading.value = false;
    });
};
```

#### Contract Display Format

```typescript
import contractPlansConfig from '@/config/contract-plans.json';

// Helper function to get plan name from plan ID
const getPlanName = (contractType: string, planId: string): string => {
  const plans = contractPlansConfig[contractType]?.plans || [];
  const plan = plans.find(p => p.id === planId);
  return plan?.name || planId;
};

// Helper function to format contract display
const getContractDisplayName = (contract: Contract): string => {
  const contractParts: string[] = [];
  
  if (contract.data.hasCPAContract) {
    const cpaType = contract.data.cpaContractType === 'CPA_1500' ? 'CPA 1500' : 'CPA 2023';
    const planName = getPlanName(contract.data.cpaContractType, contract.data.planIdCPA);
    contractParts.push(`${cpaType} - ${planName}`);
  }
  
  if (contract.data.hasSHContract) {
    const planName = getPlanName('S&H', contract.data.planIdSH);
    contractParts.push(`S&H - ${planName}`);
  }
  
  return contractParts.join(' | ') || 'Contrato';
};

// Helper function to format contract dates
const getContractDates = (contract: Contract): string => {
  const dates: string[] = [];
  
  if (contract.data.hasCPAContract && contract.data.inicioContratoCPA) {
    const inicio = new Date(contract.data.inicioContratoCPA).toLocaleDateString('pt-PT');
    const fim = new Date(contract.data.fimContratoCPA).toLocaleDateString('pt-PT');
    dates.push(`${inicio} - ${fim}`);
  }
  
  if (contract.data.hasSHContract && contract.data.inicioContratoSH) {
    const inicio = new Date(contract.data.inicioContratoSH).toLocaleDateString('pt-PT');
    const fim = new Date(contract.data.fimContratoSH).toLocaleDateString('pt-PT');
    dates.push(`${inicio} - ${fim}`);
  }
  
  return dates[0] || ''; // Use first date range for display
};
```

### Relation System Integration

#### Backend Changes

**No changes required** - the existing relation resolution system automatically handles contract relations:

1. Work Sheet/Remote Assistance stores `contractId` in data
2. Backend detects `contractId` field pattern
3. Backend resolves contract relation automatically
4. API response includes resolved contract in `relations.contract`

#### Relation Mapping

Add to `packages/shared/src/relation-type-guards.ts`:

```typescript
// Contract relation already supported through existing pattern
// contractId -> contracts content type
```

### Validation

#### Form Validation

**Work Sheets Validation**:
```typescript
// In validation logic
if (data.paymentMethod === 'Contrato') {
  if (!data.contractId) {
    errors.contractId = 'Por favor, selecione um contrato';
  }
  
  if (!data.clientId) {
    errors.contractId = 'Selecione um cliente antes de escolher um contrato';
  }
}
```

**Remote Assistance Validation**:
```typescript
// Same validation logic as Work Sheets
if (data.paymentMethod === 'Contrato') {
  if (!data.contractId) {
    errors.contractId = 'Por favor, selecione um contrato';
  }
  
  if (!data.clientId) {
    errors.contractId = 'Selecione um cliente antes de escolher um contrato';
  }
}
```

#### Contract-Client Relationship Validation

```typescript
// Frontend validation before submission
const validateContractClientRelation = (contractId: string, clientId: string): boolean => {
  // Fetch contract and verify it belongs to the selected client
  const contract = await contractsApi.fetchById(contractId);
  
  if (!contract || contract.data.clientId !== clientId) {
    return false;
  }
  
  return true;
};
```

### UI/UX Design

#### Contract Search Dropdown

```
┌─────────────────────────────────────────────────┐
│ [Search icon] Pesquisar contrato...             │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ CPA 1500 - PREMIUM CARE                         │
│ Cliente: Empresa ABC Lda                        │
│ 01/01/2024 - 31/12/2024                         │
├─────────────────────────────────────────────────┤
│ CPA 2023 - PROFESSIONAL CARE | S&H - GOLD       │
│ Cliente: Empresa ABC Lda                        │
│ 01/01/2024 - 31/12/2024                         │
├─────────────────────────────────────────────────┤
│ S&H - DIAMOND                                   │
│ Cliente: Empresa ABC Lda                        │
│ 15/03/2024 - 14/03/2025                         │
└─────────────────────────────────────────────────┘
```

#### Selected Contract Display (Form)

```
┌─────────────────────────────────────────────────┐
│ Informação do Contrato                          │
├─────────────────────────────────────────────────┤
│ Tipo: CPA 1500 - PREMIUM CARE                   │
│ Cliente: Empresa ABC Lda                        │
│ Período: 01/01/2024 - 31/12/2024                │
│ Manutenções/Ano: 3                              │
│ Deslocações/Ano: 3                              │
└─────────────────────────────────────────────────┘
```

#### Selected Contract Display (Detail View)

Uses existing `RelationInfoDisplay` component with contract-specific styling.

### Mobile Optimization

#### Touch Targets
- All interactive elements: 44px minimum height
- Contract dropdown items: 48px height on mobile
- Search input: 44px height

#### Responsive Behavior
- Contract details stack vertically on mobile
- Dropdown full-width on mobile
- Proper spacing for thumb navigation

### Error Handling

#### No Client Selected

```typescript
if (!props.clientId) {
  // Show message in dropdown
  return (
    <div class="search-option instruction">
      <span>Selecione um cliente primeiro</span>
    </div>
  );
}
```

#### No Contracts Found

```typescript
if (searchResults.length === 0 && props.clientId) {
  return (
    <div class="search-option no-results">
      <span>Nenhum contrato encontrado para este cliente</span>
    </div>
  );
}
```

#### Contract Resolution Error

```typescript
// In detail view
if (isRelationError(workSheet.relations.contract)) {
  return (
    <div class="relation-error bg-red-50 border border-red-200 rounded p-4">
      <p class="text-red-600">
        Erro ao carregar contrato: {workSheet.relations.contract.message}
      </p>
    </div>
  );
}
```

## Implementation Plan

### Phase 1: Component Creation
1. Create `ContractSearchInput.vue` component
2. Implement search and filter logic
3. Add contract display formatting
4. Test component in isolation

### Phase 2: Form Integration
1. Update Work Sheets form configuration
2. Update Remote Assistance form configuration
3. Add payment method field to Remote Assistance
4. Add conditional contract field to both forms

### Phase 3: View Updates
1. Update Work Sheets Create/Update views
2. Update Remote Assistance Create/Update views
3. Add custom field templates for contract selection
4. Handle contract selection events

### Phase 4: Detail View Integration
1. Update Work Sheets Detail view
2. Update Remote Assistance Detail view
3. Display contract relation information
4. Handle relation errors

### Phase 5: Validation
1. Add form validation for contract selection
2. Add client-contract relationship validation
3. Test validation scenarios

### Phase 6: Testing
1. Manual testing on mobile devices
2. Test contract filtering by client
3. Test conditional field display
4. Test relation resolution
5. Test error scenarios

## Correctness Properties

### Property 1: Contract Visibility
**For any** work sheet or remote assistance form with payment method set to "Contrato"  
**The system must** display the contract selection field  
**And** hide the contract selection field when payment method is not "Contrato"

### Property 2: Client Dependency
**For any** contract search operation  
**The system must** filter contracts by the selected client ID  
**And** show appropriate message when no client is selected

### Property 3: Contract Selection Requirement
**For any** work sheet or remote assistance with payment method "Contrato"  
**The system must** require a contract to be selected  
**And** prevent submission without a valid contract ID

### Property 4: Contract-Client Relationship
**For any** selected contract  
**The system must** verify the contract belongs to the selected client  
**And** prevent selection of contracts from different clients

### Property 5: Relation Resolution
**For any** work sheet or remote assistance with a contract ID  
**The system must** automatically resolve the contract relation in API responses  
**And** include contract data in the relations field

### Property 6: Display Consistency
**For any** contract displayed in the system  
**The system must** show contract type, plan names, and client information consistently  
**Across** search results, selected contract display, and detail views

### Property 7: Error Handling
**For any** contract relation resolution failure  
**The system must** display a clear error message  
**And** maintain the work sheet/remote assistance data integrity

### Property 8: Mobile Usability
**For any** contract selection interaction on mobile devices  
**The system must** provide 44px minimum touch targets  
**And** display contract information in a mobile-friendly format

### Property 9: Search Performance
**For any** contract search operation  
**The system must** return results within 500ms  
**And** debounce search input to prevent excessive API calls

### Property 10: Data Integrity
**For any** work sheet or remote assistance with contract payment method  
**The system must** store only the contract ID  
**And** resolve full contract data through the relation system

## Testing Strategy

### Unit Testing
- ContractSearchInput component behavior
- Contract filtering logic
- Contract display formatting
- Validation functions

### Integration Testing
- Form field conditional display
- Contract selection flow
- Relation resolution
- Error handling

### Manual Testing
- Mobile device testing
- Touch target verification
- Search performance
- User experience flow

## Dependencies

### Existing Components
- `ClientSearchInput.vue` - Pattern reference
- `RelationInfoDisplay.vue` - Contract display in detail views
- `ContentFormTemplate.vue` - Form rendering
- `useApi` composable - API integration

### Existing Systems
- Relation resolution system
- Form validation system
- Conditional field display
- Contract content type and API

## Migration Considerations

### Existing Data
- No migration required for existing work sheets/remote assistance
- Contract field is optional (only required when payment method is "Contrato")
- Existing records without contract ID remain valid

### Backward Compatibility
- Payment method field already exists in work sheets
- Adding payment method to remote assistance is non-breaking
- Contract field is additive, not replacing existing fields

## Performance Considerations

### API Calls
- Debounced search (300ms) reduces API load
- Client-side filtering reduces server load
- No additional API endpoints required

### Caching
- No caching required (always fetch fresh data)
- Contract list filtered on frontend
- Relation resolution handled by existing system

### Mobile Performance
- Lightweight component (similar to ClientSearchInput)
- Efficient search with debouncing
- Minimal DOM updates

## Security Considerations

### Data Access
- Contract filtering by client ID prevents unauthorized access
- Relation resolution validates contract-client relationship
- Authentication required for all contract operations

### Validation
- Client-contract relationship validated on frontend and backend
- Contract ID validated during relation resolution
- Payment method validation ensures data integrity

## Future Enhancements

### Out of Scope (Current Implementation)
- Contract status validation (active/inactive)
- Contract expiration warnings
- Multiple contract selection
- Contract creation from work sheet/remote assistance
- Contract history tracking

### Potential Future Features
- Contract quick view in dropdown
- Contract status indicators
- Contract expiration alerts
- Contract usage tracking
- Contract renewal reminders
