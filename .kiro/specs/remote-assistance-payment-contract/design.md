# Remote Assistance Payment Method & Contract Display - Design Document

## Overview

This design refactors the remote assistance module to replace the old boolean "contrato" and "garantia" fields with a unified payment method selection system. When the payment method is "Contrato", users can select a specific contract and view contract information in the detail view, following the same pattern established in work sheets.

## Architecture

### High-Level Approach

The refactor follows these principles:

1. **Simplification**: Replace two boolean switches with a single payment method dropdown
2. **Pattern Reuse**: Follow the exact pattern established in work sheets for contract display
3. **Clean Break**: Remove old fields entirely - no backward compatibility or data migration
4. **Conditional Display**: Show contract selection only when payment method is "Contrato"
5. **Relation Resolution**: Leverage existing contract relation resolution infrastructure

### Component Interaction

```
RemoteAssistanceCreateView / RemoteAssistanceUpdateView
  ↓ (uses)
ContentFormTemplate
  ↓ (renders)
Payment Method Section
  ├─ Payment Method Dropdown (always visible)
  └─ ContractSearchInput (conditional: when paymentMethod === "Contrato")

RemoteAssistanceDetailView
  ↓ (uses)
ContentDetailTemplate
  ↓ (renders)
Contract Information Section (conditional: when paymentMethod === "Contrato")
  ├─ Contract Display (when contract relation resolves)
  ├─ Error State (when contract relation fails - 404/500)
  └─ Warning State (when contractId missing but payment method is "Contrato")
```

## Components and Interfaces

### 1. Form Configuration Updates

**File**: `packages/frontend/src/config/remote-assistance-form-sections.ts`

**Changes**:

1. Remove "contrato" and "garantia" boolean switches from the "status" section
2. Keep the "payment" section with updated fields:
   - `paymentMethod`: Required select field with options: Contrato, Faturação, Garantia
   - `contractId`: Conditional custom field (shown only when paymentMethod === "Contrato")

**Updated Status Section**:
```typescript
{
  key: 'status',
  title: 'Estado',
  description: 'Estado da assistência',
  fields: [
    {
      key: 'resolvido',
      label: 'Resolvido',
      type: 'switch',
      required: true,
      fullWidth: false,
      switchLabel: 'Problema foi resolvido',
      defaultValue: false,
    },
    {
      key: 'relatorio',
      label: 'Relatório Final',
      type: 'textarea',
      fullWidth: true,
      rows: 3,
      placeholder: 'Relatório final da assistência não resolvida...',
      conditional: {
        dependsOn: 'resolvido',
        showWhen: (value: any) => value === false,
      },
      conditionalRequired: {
        dependsOn: 'resolvido',
        requiredWhen: (value: any) => value === false,
      },
    },
  ],
}
```

**Section Ordering**:
1. Basic (Dados do Cliente)
2. Assistance Info (Informação da Assistência)
3. Date/Time (Data e Horário)
4. Description (Descrição)
5. Status (Estado) - **contrato and garantia switches removed**
6. Payment (Método de Pagamento) - **paymentMethod and contractId fields**
7. Observations (Anexos)

### 2. Data Model Updates

**File**: `packages/shared/src/types/remote-assistance/types.ts`

**Changes to RemoteAssistanceData**:

```typescript
export interface RemoteAssistanceData {
  // Client relationship
  clientId: string;
  clienteName?: string;

  // Contract relationship (optional - only when payment method is Contrato)
  contractId?: string;

  // Basic Information
  tipoAssistencia: 'REMOTA' | 'TELEFÓNICA' | 'TELEMÓVEL' | '';
  tecnicoResponsavel: TechnicianUser;

  // Date and Time Information
  dataPedido: string;
  dataAssistencia: string;
  inicioAssistencia: string;
  fimAssistencia: string;
  horasTotais?: string;

  // Description Fields
  motivoPedido: string;
  relatorioAssistencia: string;

  // Value Fields
  valorAssist: number;

  // Payment Method (required field)
  paymentMethod: 'Contrato' | 'Faturação' | 'Garantia' | '';

  // Status Fields
  // REMOVED: contrato: boolean;
  // REMOVED: garantia: boolean;
  resolvido: boolean;
  relatorio?: string;
  anexos: string;
}
```

**Key Changes**:
- `paymentMethod` field is now required (not optional)
- `contrato` boolean field is **removed**
- `garantia` boolean field is **removed**
- `contractId` remains optional (only populated when paymentMethod === "Contrato")

### 3. Validation Updates

**File**: `packages/shared/src/types/remote-assistance/validation.ts`

**Validation Rules**:

1. **Payment Method Validation**:
   - Must be one of: "Contrato", "Faturação", "Garantia"
   - Cannot be empty string
   - Required for both creation and update

2. **Contract ID Validation**:
   - Required when `paymentMethod === "Contrato"`
   - Optional (can be empty) when `paymentMethod !== "Contrato"`
   - Must be valid UUID format when provided

3. **Remove Old Validations**:
   - Remove validation for `contrato` boolean field
   - Remove validation for `garantia` boolean field

**Validation Logic**:

```typescript
// Payment method validation
if (!data.paymentMethod || data.paymentMethod === '') {
  errors.push('Método de pagamento é obrigatório');
}

if (data.paymentMethod && !['Contrato', 'Faturação', 'Garantia'].includes(data.paymentMethod)) {
  errors.push('Método de pagamento inválido. Deve ser: Contrato, Faturação ou Garantia');
}

// Contract ID validation (conditional)
if (data.paymentMethod === 'Contrato') {
  if (!data.contractId || data.contractId.trim() === '') {
    errors.push('Contrato é obrigatório quando o método de pagamento é "Contrato"');
  } else {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(data.contractId)) {
      errors.push('ID do contrato inválido');
    }
  }
}
```

### 4. Detail View Updates

**File**: `packages/frontend/src/views/remote-assistance/RemoteAssistanceDetailView.vue`

**Contract Information Section** (following WorkSheetsDetailView pattern):

```vue
<!-- Contract Information Section (when payment method is Contrato) -->
<div v-if="remoteAssistance?.data?.paymentMethod === 'Contrato'" class="detail-section">
  <div class="bg-white rounded-touch border border-gray-200"
       :class="{
         'border-red-200 bg-red-50': remoteAssistance?.relations?.contract && isRelationError(remoteAssistance.relations.contract),
         'border-yellow-200 bg-yellow-50': !remoteAssistance.data.contractId
       }">
    <div
      class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
      :class="{
        'border-red-200 bg-red-100': remoteAssistance?.relations?.contract && isRelationError(remoteAssistance.relations.contract),
        'border-yellow-200 bg-yellow-100': !remoteAssistance.data.contractId
      }"
    >
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center flex-1 min-w-0">
          <div class="flex-shrink-0 mr-3 text-gray-600"
               :class="{
                 'text-red-600': remoteAssistance?.relations?.contract && isRelationError(remoteAssistance.relations.contract),
                 'text-yellow-600': !remoteAssistance.data.contractId
               }">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 class="text-lg font-semibold text-gray-900"
              :class="{
                'text-red-900': remoteAssistance?.relations?.contract && isRelationError(remoteAssistance.relations.contract),
                'text-yellow-900': !remoteAssistance.data.contractId
              }">
            Informação do Contrato
          </h2>
          <div v-if="remoteAssistance?.relations?.contract && isRelationError(remoteAssistance.relations.contract)" class="ml-2">
            <svg
              class="w-4 h-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>
        
        <!-- Navigate to contract icon -->
        <button
          v-if="remoteAssistance?.relations?.contract && !isRelationError(remoteAssistance.relations.contract)"
          @click="navigateToContract"
          class="flex-shrink-0 p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-full transition-colors"
          style="min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;"
          title="Ver detalhes do contrato"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </button>
      </div>
    </div>
    <div class="p-4 sm:p-6">
      <!-- Contract not specified -->
      <div v-if="!remoteAssistance.data.contractId" class="text-center py-2">
        <p class="text-yellow-800 font-medium">Contrato não especificado</p>
      </div>
      
      <!-- Contract error -->
      <div v-else-if="remoteAssistance?.relations?.contract && isRelationError(remoteAssistance.relations.contract)" class="text-center py-2">
        <p class="text-red-800 font-medium mb-1">
          {{ remoteAssistance.relations.contract.code === 404 ? 'Contrato não encontrado' : 'Erro ao carregar contrato' }}
        </p>
        <p class="text-red-600 text-sm">Código: {{ remoteAssistance.relations.contract.code }}</p>
      </div>
      
      <!-- Contract information -->
      <div v-else-if="remoteAssistance?.relations?.contract" class="detail-grid">
        <div class="detail-item col-span-full">
          <label class="detail-label">Tipo de Contrato</label>
          <div class="detail-value font-medium">
            {{ getContractDisplayName(remoteAssistance.relations.contract) }}
          </div>
        </div>
        <div class="detail-item">
          <label class="detail-label">Período do Contrato</label>
          <div class="detail-value">
            {{ getContractDates(remoteAssistance.relations.contract) }}
          </div>
        </div>
        <div v-if="remoteAssistance.relations.contract.paymentFrequency" class="detail-item">
          <label class="detail-label">Frequência de Pagamento</label>
          <div class="detail-value">
            {{ remoteAssistance.relations.contract.paymentFrequency }}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Helper Functions** (reused from WorkSheetsDetailView):

```typescript
// Contract helper functions
const getPlanName = (contractType: string, planId: string): string => {
  const config = contractPlansConfig as any;
  const typeConfig = config[contractType];
  if (!typeConfig || !typeConfig.plans) return planId;
  
  const plan = typeConfig.plans.find((p: any) => p.id === planId);
  return plan?.name || planId;
};

const getContractDisplayName = (contract: any): string => {
  if (!contract || typeof contract !== 'object') return 'Contrato não especificado';
  
  const parts: string[] = [];
  
  // Add CPA contract info if exists
  if (contract.hasCPAContract && contract.cpaContractType && contract.planIdCPA) {
    const planName = getPlanName(contract.cpaContractType, contract.planIdCPA);
    parts.push(`CPA: ${planName}`);
  }
  
  // Add S&H contract info if exists
  if (contract.hasSHContract && contract.shContractType && contract.planIdSH) {
    const planName = getPlanName(contract.shContractType, contract.planIdSH);
    parts.push(`S&H: ${planName}`);
  }
  
  return parts.length > 0 ? parts.join(' | ') : 'Contrato não especificado';
};

const getContractDates = (contract: any): string => {
  if (!contract || typeof contract !== 'object') return '-';
  
  // Try CPA contract dates first
  if (contract.hasCPAContract && contract.inicioContratoCPA) {
    const startDate = formatDate(contract.inicioContratoCPA);
    const endDate = contract.fimContratoCPA ? formatDate(contract.fimContratoCPA) : '';
    
    if (startDate && endDate) {
      return `${startDate} - ${endDate}`;
    } else if (startDate) {
      return `Início: ${startDate}`;
    }
  }
  
  // Try S&H contract dates
  if (contract.hasSHContract && contract.inicioContratoSH) {
    const startDate = formatDate(contract.inicioContratoSH);
    const endDate = contract.fimContratoSH ? formatDate(contract.fimContratoSH) : '';
    
    if (startDate && endDate) {
      return `${startDate} - ${endDate}`;
    } else if (startDate) {
      return `Início: ${startDate}`;
    }
  }
  
  return '-';
};

// Navigation handler for contract button
const navigateToContract = () => {
  if (remoteAssistance.value?.data?.contractId) {
    router.push(`/contracts/${remoteAssistance.value.data.contractId}`);
  }
};
```

**Section Placement**:
The contract information section should appear:
- **After**: Estado section
- **Before**: Anexos section

This matches the work sheets pattern where contract information appears after status/state information.

### 5. Backend Relation Resolution

**File**: `packages/backend/src/routes/remote-assistance.ts`

**No Changes Required**:

The backend already supports contract relation resolution through the existing relation system. The relation configuration in `packages/shared/src/relation-validation.ts` already includes:

```typescript
'remote-assistance': {
  client: { targetType: 'clients', required: true },
  contract: { targetType: 'contracts', required: false },
}
```

This means:
- Contract relations are automatically resolved when `contractId` is present
- Failed resolutions return structured error objects (404/500)
- No additional backend code is needed

## Data Models

### RemoteAssistanceData Interface

**Before**:
```typescript
export interface RemoteAssistanceData {
  // ... other fields ...
  paymentMethod?: 'Contrato' | 'Faturação' | 'Garantia' | '';
  contrato: boolean;
  garantia: boolean;
  // ... other fields ...
}
```

**After**:
```typescript
export interface RemoteAssistanceData {
  // ... other fields ...
  paymentMethod: 'Contrato' | 'Faturação' | 'Garantia' | ''; // Now required
  // REMOVED: contrato: boolean;
  // REMOVED: garantia: boolean;
  // ... other fields ...
}
```

### Form Data Structure

**Payment Section Data**:
```typescript
{
  paymentMethod: 'Contrato' | 'Faturação' | 'Garantia' | '',
  contractId?: string // Only populated when paymentMethod === 'Contrato'
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Payment Method Selection Validation

*For any* remote assistance creation or update operation, the payment method field must be one of the three valid values: "Contrato", "Faturação", or "Garantia", and cannot be empty.

**Validates: Requirements 1.2, 4.8**

### Property 2: Conditional Contract ID Requirement

*For any* remote assistance record where payment method is "Contrato", the contractId field must be present and must be a valid UUID format.

**Validates: Requirements 1.5, 4.7**

### Property 3: Contract Field Visibility

*For any* remote assistance form state, the contract search field should be visible if and only if the payment method is "Contrato".

**Validates: Requirements 1.3, 3.2**

### Property 4: Contract Information Display Condition

*For any* remote assistance detail view, the contract information section should be displayed if and only if the payment method is "Contrato".

**Validates: Requirements 2.1, 2.6**

### Property 5: Contract Relation Resolution

*For any* remote assistance record with a contractId, the API response must include either a resolved contract relation object or a structured error object (404/500).

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 6: Old Field Removal

*For any* remote assistance form configuration, the form sections must not contain fields with keys "contrato" or "garantia".

**Validates: Requirements 1.6, 4.5, 4.6**

### Property 7: Contract Error State Display

*For any* remote assistance detail view where contract relation resolution fails (404 error), the contract section must display with red border styling and show "Contrato não encontrado" message.

**Validates: Requirements 2.3, 2.4**

### Property 8: Contract Warning State Display

*For any* remote assistance detail view where payment method is "Contrato" but contractId is missing, the contract section must display with yellow border styling and show "Contrato não especificado" message.

**Validates: Requirements 2.5**

### Property 9: Section Ordering Consistency

*For any* remote assistance form, the payment method section must appear after the Estado section and before the Anexos section.

**Validates: Requirements 1.7, 3.3**

### Property 10: Contract Search Client Filtering

*For any* remote assistance form with a selected client, the contract search field must filter contracts to show only those belonging to the selected client.

**Validates: Requirements 1.4, 3.5**

## Error Handling

### Validation Errors

**Payment Method Errors**:
- Empty payment method: "Método de pagamento é obrigatório"
- Invalid payment method: "Método de pagamento inválido. Deve ser: Contrato, Faturação ou Garantia"

**Contract ID Errors**:
- Missing when required: "Contrato é obrigatório quando o método de pagamento é 'Contrato'"
- Invalid UUID format: "ID do contrato inválido"

### Relation Resolution Errors

**404 - Contract Not Found**:
```typescript
{
  type: 'error',
  code: 404,
  message: 'Not found'
}
```

Display: Red border, "Contrato não encontrado"

**500 - Server Error**:
```typescript
{
  type: 'error',
  code: 500,
  message: 'Internal Server Error'
}
```

Display: Red border, "Erro ao carregar contrato"

### Warning States

**Missing Contract ID**:
When `paymentMethod === 'Contrato'` but `contractId` is empty:
- Display: Yellow border, "Contrato não especificado"
- This is a warning state, not an error (validation should prevent this during creation/update)

## Testing Strategy

### Unit Tests

**Form Configuration Tests**:
1. Verify "contrato" and "garantia" fields are removed from status section
2. Verify payment method field exists in payment section
3. Verify contract field has conditional display logic
4. Verify section ordering is correct

**Validation Tests**:
1. Test payment method validation with valid values
2. Test payment method validation with invalid values
3. Test contract ID validation when payment method is "Contrato"
4. Test contract ID validation when payment method is not "Contrato"
5. Test UUID format validation for contract ID

**Display Logic Tests**:
1. Test contract section visibility when payment method is "Contrato"
2. Test contract section hidden when payment method is not "Contrato"
3. Test error state display for 404 errors
4. Test error state display for 500 errors
5. Test warning state display for missing contract ID

### Property-Based Tests

Each correctness property should be implemented as a property-based test with minimum 100 iterations:

**Property 1 Test**:
- Generate random remote assistance data
- Ensure payment method is always one of the three valid values
- Tag: **Feature: remote-assistance-payment-contract, Property 1: Payment Method Selection Validation**

**Property 2 Test**:
- Generate random remote assistance data with payment method "Contrato"
- Ensure contractId is always present and valid UUID
- Tag: **Feature: remote-assistance-payment-contract, Property 2: Conditional Contract ID Requirement**

**Property 3 Test**:
- Generate random form states with different payment methods
- Verify contract field visibility matches payment method value
- Tag: **Feature: remote-assistance-payment-contract, Property 3: Contract Field Visibility**

**Property 4 Test**:
- Generate random remote assistance records
- Verify contract section display matches payment method value
- Tag: **Feature: remote-assistance-payment-contract, Property 4: Contract Information Display Condition**

**Property 5 Test**:
- Generate random remote assistance records with contractId
- Verify API responses include either resolved relation or error object
- Tag: **Feature: remote-assistance-payment-contract, Property 5: Contract Relation Resolution**

**Property 6 Test**:
- Inspect form configuration
- Verify no fields with keys "contrato" or "garantia" exist
- Tag: **Feature: remote-assistance-payment-contract, Property 6: Old Field Removal**

**Property 7 Test**:
- Generate remote assistance records with 404 contract errors
- Verify red border styling and error message display
- Tag: **Feature: remote-assistance-payment-contract, Property 7: Contract Error State Display**

**Property 8 Test**:
- Generate remote assistance records with payment method "Contrato" but no contractId
- Verify yellow border styling and warning message display
- Tag: **Feature: remote-assistance-payment-contract, Property 8: Contract Warning State Display**

**Property 9 Test**:
- Inspect form section ordering
- Verify payment section appears after Estado and before Anexos
- Tag: **Feature: remote-assistance-payment-contract, Property 9: Section Ordering Consistency**

**Property 10 Test**:
- Generate random client selections
- Verify contract search filters by selected client
- Tag: **Feature: remote-assistance-payment-contract, Property 10: Contract Search Client Filtering**

### Integration Tests

**End-to-End Flow Tests**:
1. Create remote assistance with payment method "Faturação" (no contract)
2. Create remote assistance with payment method "Contrato" (with contract)
3. Update remote assistance to change payment method from "Faturação" to "Contrato"
4. Update remote assistance to change payment method from "Contrato" to "Garantia"
5. View detail page with valid contract relation
6. View detail page with invalid contract relation (404)
7. View detail page with missing contract ID but payment method "Contrato"

## Implementation Notes

### Pattern Reuse

This design intentionally reuses the exact pattern from work sheets:
- Same contract display component structure
- Same helper functions (getPlanName, getContractDisplayName, getContractDates)
- Same error/warning state styling
- Same navigation button for viewing contract details

### No Data Migration

This design does not include data migration because:
- The old "contrato" and "garantia" boolean fields are being removed
- No backward compatibility is needed
- Existing records will need to be updated manually or through a separate migration process (out of scope)

### Simplicity Focus

The design prioritizes simplicity:
- Single payment method field instead of multiple boolean switches
- Conditional display instead of complex state management
- Reuse of existing components and patterns
- No new backend endpoints or relation logic needed

### Mobile-First Considerations

All UI components follow mobile-first design:
- 44px minimum touch targets for all interactive elements
- Responsive layout for contract information section
- Touch-friendly contract search dropdown
- Proper spacing and padding for mobile screens
