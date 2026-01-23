# Contract Selection for Payment Method - Tasks

## Task List

- [x] 1. Update Shared Types for Work Sheets
  - [x] 1.1 Add contractId field to WorkSheetData interface
  - [x] 1.2 Update WorkSheetDisplacementData paymentMethod type
  - [x] 1.3 Update WorkSheetSearchFilters interface

- [x] 2. Update Shared Types for Remote Assistance
  - [x] 2.1 Add paymentMethod field to RemoteAssistanceData interface
  - [x] 2.2 Add contractId field to RemoteAssistanceData interface
  - [x] 2.3 Update RemoteAssistanceSearchFilters interface

- [x] 3. Update Shared Validation for Work Sheets
  - [x] 3.1 Add contractId validation when paymentMethod is 'CONTRATO'
  - [x] 3.2 Update validation error messages

- [x] 4. Update Shared Validation for Remote Assistance
  - [x] 4.1 Add paymentMethod validation
  - [x] 4.2 Add contractId validation when paymentMethod is 'Contrato'
  - [x] 4.3 Update validation error messages

- [x] 5. Update Backend Relation Mapping
  - [x] 5.1 Add contractId relation mapping for work-sheets
  - [x] 5.2 Add contractId relation mapping for remote-assistance
  - [x] 5.3 Test relation resolution

- [x] 6. Create ContractSearchInput Component
  - [x] 6.1 Create component file structure
  - [x] 6.2 Implement search and filter logic
  - [x] 6.3 Add contract display formatting
  - [x] 6.4 Add mobile-responsive styling

- [x] 7. Update Work Sheets Form Configuration
  - [x] 7.1 Add contractId field to payment section
  - [x] 7.2 Configure conditional display logic
  - [x] 7.3 Add field validation rules

- [x] 8. Update Remote Assistance Form Configuration
  - [x] 8.1 Add payment method field
  - [x] 8.2 Add contractId field to payment section
  - [x] 8.3 Configure conditional display logic
  - [x] 8.4 Add field validation rules

- [x] 9. Update Work Sheets Create View
  - [x] 9.1 Import ContractSearchInput component
  - [x] 9.2 Add custom field template for contractId
  - [x] 9.3 Implement contract selection handler
  - [x] 9.4 Add client dependency validation

- [x] 10. Update Work Sheets Update View
  - [x] 10.1 Import ContractSearchInput component
  - [x] 10.2 Add custom field template for contractId
  - [x] 10.3 Implement contract selection handler
  - [x] 10.4 Add client dependency validation

- [x] 11. Update Remote Assistance Create View
  - [x] 11.1 Import ContractSearchInput component
  - [x] 11.2 Add custom field template for contractId
  - [x] 11.3 Implement contract selection handler
  - [x] 11.4 Add client dependency validation

- [x] 12. Update Remote Assistance Update View
  - [x] 12.1 Import ContractSearchInput component
  - [x] 12.2 Add custom field template for contractId
  - [x] 12.3 Implement contract selection handler
  - [x] 12.4 Add client dependency validation

- [x] 13. Update Work Sheets Detail View
  - [x] 13.1 Add contract relation display
  - [x] 13.2 Handle relation errors
  - [x] 13.3 Show contract info in payment section
  - [x] 13.4 Update backend to include contract plan data in relation resolution
  - [x] 13.5 Add navigation button to contract detail view

- [x] 14. Update Remote Assistance Detail View
  - [x] 14.1 Add contract relation display
  - [x] 14.2 Handle relation errors
  - [x] 14.3 Show contract info in payment section
  - [x] 14.4 Update backend to include contract plan data in relation resolution
  - [x] 14.5 Add navigation button to contract detail view

- [x] 15. Manual Testing
  - [x] 15.1 Test contract search and selection
  - [x] 15.2 Test conditional field display
  - [x] 15.3 Test client-contract filtering
  - [x] 15.4 Test mobile responsiveness
  - [x] 15.5 Test relation resolution in detail views
  - [x] 15.6 Test backend validation fix (contractId field)

## Task Details

### 1. Update Shared Types for Work Sheets

**File**: `packages/shared/src/types/work-sheets/types.ts`

**Description**: Add contractId field to work sheet types to support contract relations.

**Requirements**:
- Add contractId field to WorkSheetData interface
- Keep paymentMethod in WorkSheetDisplacementData but ensure 'CONTRATO' is included
- Add contractId to search filters

**Implementation**:
```typescript
// In WorkSheetData interface
export interface WorkSheetData {
  // Client relationship
  clientId: string;
  
  // Contract relationship (optional - only when payment method is CONTRATO)
  contractId?: string;

  // Main data sections
  request: WorkSheetRequestData;
  displacement: WorkSheetDisplacementData;
  otherData: WorkSheetOtherData;
}

// WorkSheetDisplacementData already has paymentMethod with 'CONTRATO' option - verify it's there
export interface WorkSheetDisplacementData {
  hasDisplacement: boolean;
  weekendHoliday: boolean;
  oneWayKms: number;
  totalKms: number;
  paymentMethod: 'PENDENTE' | 'CARTÃO MB' | 'DINHEIRO' | 'TRANSFERÊNCIA BANCÁRIA' | 'CONTRATO';
}

// In WorkSheetSearchFilters interface
export interface WorkSheetSearchFilters {
  clientName?: string;
  technician?: string;
  serviceType?: 'ASSISTÊNCIA PRESENCIAL' | 'MANUTENÇÃO' | 'INSTALAÇÃO';
  paymentMethod?: 'PENDENTE' | 'CARTÃO MB' | 'DINHEIRO' | 'TRANSFERÊNCIA BANCÁRIA' | 'CONTRATO';
  contractId?: string; // Add this line
  assistanceDateFrom?: string;
  assistanceDateTo?: string;
  hasDisplacement?: boolean;
  totallyResolved?: boolean;
  weekendHoliday?: boolean;
  materialUsed?: boolean;
  equipment?: boolean;
}
```

**Acceptance Criteria**:
- contractId field added to WorkSheetData as optional
- paymentMethod includes 'CONTRATO' option
- contractId added to search filters
- Types compile without errors
- No breaking changes to existing code

---

### 2. Update Shared Types for Remote Assistance

**File**: `packages/shared/src/types/remote-assistance/types.ts`

**Description**: Add paymentMethod and contractId fields to remote assistance types.

**Requirements**:
- Add paymentMethod field to RemoteAssistanceData
- Add contractId field to RemoteAssistanceData
- Update search filters

**Implementation**:
```typescript
// In RemoteAssistanceData interface
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

  // Payment Method (new field)
  paymentMethod?: 'Contrato' | 'Faturação' | 'Garantia' | '';

  // Status Fields
  contrato: boolean;
  garantia: boolean;
  resolvido: boolean;
  relatorio?: string;
  anexos: string;
}

// In RemoteAssistanceSearchFilters interface
export interface RemoteAssistanceSearchFilters {
  clientName?: string;
  tipoAssistencia?: 'REMOTA' | 'TELEFÓNICA' | 'TELEMÓVEL';
  tecnicoResponsavel?: string;
  dataAssistenciaFrom?: string;
  dataAssistenciaTo?: string;
  paymentMethod?: 'Contrato' | 'Faturação' | 'Garantia'; // Add this line
  contractId?: string; // Add this line
  contrato?: boolean;
  garantia?: boolean;
  resolvido?: boolean;
  valorMin?: number;
  valorMax?: number;
  year?: string;
}
```

**Acceptance Criteria**:
- paymentMethod field added to RemoteAssistanceData as optional
- contractId field added to RemoteAssistanceData as optional
- Both fields added to search filters
- Types compile without errors
- No breaking changes to existing code

---

### 3. Update Shared Validation for Work Sheets

**File**: `packages/shared/src/types/work-sheets/validation.ts`

**Description**: Add validation for contractId when payment method is CONTRATO.

**Requirements**:
- Validate contractId is present when paymentMethod is 'CONTRATO'
- Validate contractId format (UUID)
- Add appropriate error messages in Portuguese

**Implementation**:
```typescript
// In validateWorkSheetCreation or validateWorkSheetUpdate function
export function validateWorkSheetCreation(data: WorkSheetCreationData): string[] {
  const errors: string[] = [];

  // Existing validations...

  // Contract validation
  if (data.displacement?.paymentMethod === 'CONTRATO') {
    if (!data.contractId) {
      errors.push('O contrato é obrigatório quando o método de pagamento é CONTRATO');
    } else if (!isValidUUID(data.contractId)) {
      errors.push('O ID do contrato deve ser um UUID válido');
    }
  }

  return errors;
}

// Helper function for UUID validation
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
```

**Acceptance Criteria**:
- contractId validation added for CONTRATO payment method
- UUID format validation implemented
- Portuguese error messages
- Validation works for both create and update operations
- Tests pass (if tests exist)

---

### 4. Update Shared Validation for Remote Assistance

**File**: `packages/shared/src/types/remote-assistance/validation.ts`

**Description**: Add validation for paymentMethod and contractId fields.

**Requirements**:
- Validate paymentMethod is valid option
- Validate contractId is present when paymentMethod is 'Contrato'
- Validate contractId format (UUID)
- Add appropriate error messages in Portuguese

**Implementation**:
```typescript
// In validateRemoteAssistanceCreation or validateRemoteAssistanceUpdate function
export function validateRemoteAssistanceCreation(data: RemoteAssistanceCreationData): string[] {
  const errors: string[] = [];

  // Existing validations...

  // Payment method validation
  if (data.paymentMethod) {
    const validPaymentMethods = ['Contrato', 'Faturação', 'Garantia', ''];
    if (!validPaymentMethods.includes(data.paymentMethod)) {
      errors.push('Método de pagamento inválido');
    }
  }

  // Contract validation
  if (data.paymentMethod === 'Contrato') {
    if (!data.contractId) {
      errors.push('O contrato é obrigatório quando o método de pagamento é Contrato');
    } else if (!isValidUUID(data.contractId)) {
      errors.push('O ID do contrato deve ser um UUID válido');
    }
  }

  return errors;
}

// Helper function for UUID validation
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
```

**Acceptance Criteria**:
- paymentMethod validation added
- contractId validation added for 'Contrato' payment method
- UUID format validation implemented
- Portuguese error messages
- Validation works for both create and update operations
- Tests pass (if tests exist)

---

### 5. Update Backend Relation Mapping

**File**: `packages/shared/src/relation-type-guards.ts` or backend relation resolution code

**Description**: Ensure contractId field is recognized and resolved as a relation.

**Requirements**:
- Add contractId to relation field mappings
- Ensure relation resolution works for work-sheets
- Ensure relation resolution works for remote-assistance
- Test relation resolution

**Implementation**:

The existing relation system should automatically detect `contractId` fields based on the naming pattern. Verify the relation mapping includes:

```typescript
// In relation-type-guards.ts or similar file
const RELATION_MAPPINGS = {
  clientId: 'clients',
  contractId: 'contracts', // Should already exist or add this
  // ... other mappings
};
```

**Backend verification** (if needed):
```typescript
// In backend relation resolution code
// Ensure contractId is detected and resolved for work-sheets and remote-assistance
```

**Acceptance Criteria**:
- contractId field is recognized as a relation
- Relation resolution works for work-sheets with contractId
- Relation resolution works for remote-assistance with contractId
- API responses include resolved contract data in relations field
- Relation errors (404/500) are handled properly
- No backend code changes needed (existing system should handle it)

---

### 6. Create ContractSearchInput Component

**File**: `packages/frontend/src/components/common/ContractSearchInput.vue`

**Description**: Create a reusable contract search component following the ClientSearchInput pattern.

**Requirements**:
- Props: modelValue (contractId), clientId, placeholder, disabled, readonly, hasError
- Emits: update:modelValue, contractSelected
- Search contracts with debouncing (300ms)
- Filter contracts by clientId
- Display contract type and plan names from config
- Show loading states and empty states
- Mobile-first responsive design
- 44px minimum touch targets

**Implementation Notes**:
- Import contract plans config: `import contractPlansConfig from '@/config/contract-plans.json'`
- Create helper function `getPlanName(contractType, planId)` to lookup plan names
- Display format: "CPA 1500 - PREMIUM CARE" or "CPA 2023 - PROFESSIONAL CARE | S&H - GOLD"
- Show client name and contract dates in dropdown
- Handle case when no client is selected (show message)
- Handle case when no contracts found for client

**Acceptance Criteria**:
- Component renders without errors
- Search filters contracts by clientId
- Displays contract type (CPA 1500, CPA 2023, S&H) and plan names correctly
- Debounced search works (300ms delay)
- Loading states display properly
- Empty states show appropriate messages
- Selected contract displays in readonly mode
- Mobile touch targets are 44px minimum

---

### 7. Update Work Sheets Form Configuration

**File**: `packages/frontend/src/config/work-sheets-form-sections.ts`

**Description**: Add contractId field to payment section with conditional display.

**Requirements**:
- Add contractId field after paymentMethod field
- Set type to 'custom'
- Mark as required
- Add conditional display based on paymentMethod === 'Contrato'

**Implementation**:
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

**Acceptance Criteria**:
- contractId field appears when paymentMethod is 'Contrato'
- contractId field is hidden when paymentMethod is not 'Contrato'
- Field is marked as required when visible
- Form configuration compiles without errors

---

### 8. Update Remote Assistance Form Configuration

**File**: `packages/frontend/src/config/remote-assistance-form-sections.ts`

**Description**: Add payment method field and contractId field with conditional display.

**Requirements**:
- Add new payment section after status section
- Add paymentMethod select field
- Add contractId field with conditional display
- Configure validation rules

**Implementation**:
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

**Acceptance Criteria**:
- Payment section appears in form
- paymentMethod select works correctly
- contractId field appears when paymentMethod is 'Contrato'
- contractId field is hidden when paymentMethod is not 'Contrato'
- Form configuration compiles without errors

---

### 9. Update Work Sheets Create View

**File**: `packages/frontend/src/views/work-sheets/WorkSheetsCreateView.vue`

**Description**: Add ContractSearchInput component integration for contract selection.

**Requirements**:
- Import ContractSearchInput component
- Add custom field template for contractId
- Pass clientId from formData to filter contracts
- Handle contract selection events
- Show helper text when no client selected

**Implementation**:
```vue
<script setup lang="ts">
import ContractSearchInput from '@/components/common/ContractSearchInput.vue';
// ... existing imports

const handleContractSelected = (contract: Contract | null) => {
  console.log('Contract selected:', JSON.stringify(contract, null, 2));
  // Contract ID is already updated via v-model
};
</script>

<template>
  <ContentCreateTemplate
    <!-- existing props -->
  >
    <!-- existing custom fields -->
    
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
  </ContentCreateTemplate>
</template>
```

**Acceptance Criteria**:
- ContractSearchInput renders in form
- Contract search filters by selected client
- Contract selection updates formData
- Helper text shows when no client selected
- Validation errors display correctly
- Form submission includes contractId when payment method is 'Contrato'

---

### 10. Update Work Sheets Update View

**File**: `packages/frontend/src/views/work-sheets/WorkSheetsUpdateView.vue`

**Description**: Add ContractSearchInput component integration for contract selection in update view.

**Requirements**: Same as task 9 but for update view

**Implementation**: Same template structure as task 9

**Acceptance Criteria**: Same as task 9

---

### 11. Update Remote Assistance Create View

**File**: `packages/frontend/src/views/remote-assistance/RemoteAssistanceCreateView.vue`

**Description**: Add ContractSearchInput component integration for contract selection.

**Requirements**: Same as task 9 but for remote assistance

**Implementation**: Same template structure as task 9

**Acceptance Criteria**: Same as task 9

---

### 12. Update Remote Assistance Update View

**File**: `packages/frontend/src/views/remote-assistance/RemoteAssistanceUpdateView.vue`

**Description**: Add ContractSearchInput component integration for contract selection in update view.

**Requirements**: Same as task 9 but for update view

**Implementation**: Same template structure as task 9

**Acceptance Criteria**: Same as task 9

---

### 13. Update Work Sheets Detail View

**File**: `packages/frontend/src/views/work-sheets/WorkSheetsDetailView.vue`

**Description**: Display contract information when payment method is 'Contrato'.

**Requirements**:
- Import relation type guards
- Add contract relation display in payment section
- Handle relation errors
- Show contract type, plan names, and dates

**Implementation**:
```vue
<script setup lang="ts">
import { isRelationError } from '@clever/shared';
// ... existing imports
</script>

<template>
  <ContentDetailTemplate
    <!-- existing props -->
  >
    <!-- In payment section, after payment method display -->
    <div v-if="workSheet?.data.paymentMethod === 'Contrato'" class="mt-4">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Contrato</h4>
      
      <div v-if="workSheet?.relations?.contract">
        <div v-if="!isRelationError(workSheet.relations.contract)" class="bg-blue-50 border border-blue-200 rounded-touch p-4">
          <div class="space-y-2">
            <div>
              <span class="text-xs font-medium text-gray-500 uppercase">Tipo:</span>
              <span class="text-sm text-gray-900 ml-2">{{ getContractDisplayName(workSheet.relations.contract) }}</span>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-500 uppercase">Período:</span>
              <span class="text-sm text-gray-900 ml-2">{{ getContractDates(workSheet.relations.contract) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="bg-red-50 border border-red-200 rounded-touch p-4">
          <p class="text-red-600 text-sm">Erro ao carregar contrato: {{ workSheet.relations.contract.message }}</p>
        </div>
      </div>
      
      <div v-else class="text-gray-500 text-sm">
        Contrato não especificado
      </div>
    </div>
  </ContentDetailTemplate>
</template>
```

**Helper Functions**:
```typescript
import contractPlansConfig from '@/config/contract-plans.json';

const getPlanName = (contractType: string, planId: string): string => {
  const plans = contractPlansConfig[contractType]?.plans || [];
  const plan = plans.find(p => p.id === planId);
  return plan?.name || planId;
};

const getContractDisplayName = (contract: any): string => {
  const contractParts: string[] = [];
  
  if (contract.data?.hasCPAContract) {
    const cpaType = contract.data.cpaContractType === 'CPA_1500' ? 'CPA 1500' : 'CPA 2023';
    const planName = getPlanName(contract.data.cpaContractType, contract.data.planIdCPA);
    contractParts.push(`${cpaType} - ${planName}`);
  }
  
  if (contract.data?.hasSHContract) {
    const planName = getPlanName('S&H', contract.data.planIdSH);
    contractParts.push(`S&H - ${planName}`);
  }
  
  return contractParts.join(' | ') || 'Contrato';
};

const getContractDates = (contract: any): string => {
  if (contract.data?.hasCPAContract && contract.data.inicioContratoCPA) {
    const inicio = new Date(contract.data.inicioContratoCPA).toLocaleDateString('pt-PT');
    const fim = new Date(contract.data.fimContratoCPA).toLocaleDateString('pt-PT');
    return `${inicio} - ${fim}`;
  }
  
  if (contract.data?.hasSHContract && contract.data.inicioContratoSH) {
    const inicio = new Date(contract.data.inicioContratoSH).toLocaleDateString('pt-PT');
    const fim = new Date(contract.data.fimContratoSH).toLocaleDateString('pt-PT');
    return `${inicio} - ${fim}`;
  }
  
  return '';
};
```

**Acceptance Criteria**:
- Contract information displays when payment method is 'Contrato'
- Contract type and plan names show correctly
- Contract dates display in Portuguese format
- Relation errors display with red styling
- No contract message shows when contractId is missing
- Mobile-responsive layout

---

### 14. Update Remote Assistance Detail View

**File**: `packages/frontend/src/views/remote-assistance/RemoteAssistanceDetailView.vue`

**Description**: Display contract information when payment method is 'Contrato'.

**Requirements**: Same as task 13 but for remote assistance

**Implementation**: Same template structure and helper functions as task 13

**Acceptance Criteria**: Same as task 13

---

### 15. Manual Testing

**Description**: Comprehensive manual testing of contract selection functionality.

**Test Scenarios**:

#### 15.1 Test contract search and selection
- [ ] Open work sheet create view
- [ ] Select a client
- [ ] Set payment method to 'Contrato'
- [ ] Contract field appears
- [ ] Click contract search input
- [ ] Verify contracts are filtered by selected client
- [ ] Verify contract display shows: "CPA 1500 - PREMIUM CARE" format
- [ ] Select a contract
- [ ] Verify contract information displays below search
- [ ] Submit form
- [ ] Verify contractId is saved

#### 15.2 Test conditional field display
- [ ] Open work sheet create view
- [ ] Select a client
- [ ] Set payment method to 'Faturação'
- [ ] Verify contract field is hidden
- [ ] Change payment method to 'Contrato'
- [ ] Verify contract field appears
- [ ] Change payment method back to 'Faturação'
- [ ] Verify contract field is hidden again

#### 15.3 Test client-contract filtering
- [ ] Open work sheet create view
- [ ] Set payment method to 'Contrato'
- [ ] Try to open contract search without selecting client
- [ ] Verify helper message: "Selecione um cliente primeiro"
- [ ] Select client A
- [ ] Open contract search
- [ ] Verify only client A's contracts appear
- [ ] Change to client B
- [ ] Open contract search
- [ ] Verify only client B's contracts appear

#### 15.4 Test mobile responsiveness
- [ ] Open work sheet create view on mobile device (or responsive mode)
- [ ] Select client and set payment method to 'Contrato'
- [ ] Verify contract search input is 44px height
- [ ] Open contract dropdown
- [ ] Verify dropdown is full-width
- [ ] Verify contract items are 48px height
- [ ] Verify touch targets are easy to tap
- [ ] Select a contract
- [ ] Verify selected contract info displays properly on mobile

#### 15.5 Test relation resolution in detail views
- [ ] Create a work sheet with payment method 'Contrato' and select a contract
- [ ] Navigate to work sheet detail view
- [ ] Verify contract information displays in payment section
- [ ] Verify contract type shows correctly (e.g., "CPA 1500 - PREMIUM CARE")
- [ ] Verify contract dates display in Portuguese format
- [ ] Create a work sheet with invalid contractId
- [ ] Navigate to detail view
- [ ] Verify error message displays with red styling
- [ ] Repeat tests for remote assistance

**Acceptance Criteria**:
- All test scenarios pass
- No console errors
- Mobile experience is smooth
- Contract information displays correctly
- Relation errors are handled gracefully

## Notes

- Follow the existing ClientSearchInput pattern closely for consistency
- Use Portuguese labels throughout ("Contrato", "Selecione um cliente primeiro", etc.)
- Ensure 44px minimum touch targets for mobile
- Test on actual mobile devices if possible
- Contract relation resolution is automatic (no backend changes needed)
- Payment method field already exists in work sheets, only needs to be added to remote assistance


## Implementation Notes

### Backend Validation Fix (2026-01-23)

**Issue**: Form submission was failing with validation error "O contrato é obrigatório quando o método de pagamento é CONTRATO" even though the frontend was correctly sending the `contractId` field.

**Root Cause**: The backend validation functions in `packages/backend/src/routes/work-sheets.ts` and `packages/backend/src/routes/remote-assistance.ts` were not including the `contractId` field when constructing the validation data objects.

**Fix Applied**:

1. **Work Sheets** (`packages/backend/src/routes/work-sheets.ts`):
   - Added `contractId: workSheetData.contractId` to the `WorkSheetCreationData` object construction in `validateWorkSheetCreate` function

2. **Remote Assistance** (`packages/backend/src/routes/remote-assistance.ts`):
   - Added `contractId: remoteAssistanceData.contractId` to the `RemoteAssistanceCreationData` object construction in `validateRemoteAssistanceCreate` function
   - Added `paymentMethod: remoteAssistanceData.paymentMethod` to the same object

**Files Modified**:
- `packages/backend/src/routes/work-sheets.ts` (line 52)
- `packages/backend/src/routes/remote-assistance.ts` (lines 54-55)

**Testing**:
- Backend rebuilt successfully with `pnpm build`
- Validation now correctly receives and validates the `contractId` field
- Form submission should now work when payment method is 'CONTRATO'/'Contrato' and a contract is selected

**Next Steps**:
- Test form submission in the browser to verify the fix works end-to-end
- Verify validation error messages display correctly when contractId is missing
- Test both work sheets and remote assistance forms

### Contract Relation Data Enhancement (2026-01-23)

**Issue**: The detail views were showing "Contrato não especificado" and "-" for contract dates because the backend relation resolution was only returning basic fields (`numeroContrato`, `dataInicio`, `dataFim`) but not the contract type and plan information needed to display the contract properly.

**Root Cause**: The `BASIC_FIELD_DEFINITIONS` for contracts in `packages/shared/src/utils.ts` only included three fields, but the frontend needed access to the contract type fields (`hasCPAContract`, `cpaContractType`, `planIdCPA`, `hasSHContract`, `shContractType`, `planIdSH`) and payment frequency to properly display contract information.

**Fix Applied**:

1. **Shared Package** (`packages/shared/src/utils.ts`):
   - Updated `BASIC_FIELD_DEFINITIONS` for contracts to include:
     - `paymentFrequency` - Payment frequency (monthly, quarterly, etc.)
     - `hasCPAContract` - Whether contract has CPA component
     - `cpaContractType` - CPA contract type (CPA_1500 or CPA)
     - `planIdCPA` - CPA plan ID
     - `hasSHContract` - Whether contract has S&H component
     - `shContractType` - S&H contract type
     - `planIdSH` - S&H plan ID

2. **Frontend Detail Views**:
   - Updated `WorkSheetsDetailView.vue` to:
     - Access contract data directly from relation object (not `.data` property)
     - Add "Ver Detalhes do Contrato" button that navigates to contract detail view
     - Use `navigateToContract()` handler to navigate to `/contracts/{contractId}`
   
   - Updated `RemoteAssistanceDetailView.vue` with same changes

**Files Modified**:
- `packages/shared/src/utils.ts` - Added contract plan fields to BASIC_FIELD_DEFINITIONS
- `packages/frontend/src/views/work-sheets/WorkSheetsDetailView.vue` - Fixed data access and added navigation button
- `packages/frontend/src/views/remote-assistance/RemoteAssistanceDetailView.vue` - Fixed data access and added navigation button

**Packages Rebuilt**:
- `@clever/shared` - Rebuilt to include updated field definitions
- `@clever/backend` - Rebuilt to use updated shared package

**Features Added**:
- Contract type and plan names now display correctly (e.g., "CPA: PREMIUM CARE | S&H: GOLD")
- Contract dates display in Portuguese format
- Payment frequency displays when available
- "Ver Detalhes do Contrato" button allows navigation to full contract details
- Button has proper styling with primary color scheme and icon
- Button meets 44px touch target requirement for mobile

**Testing**:
- Verify contract information displays correctly in work sheets detail view
- Verify contract information displays correctly in remote assistance detail view
- Test navigation button redirects to correct contract detail page
- Test with contracts that have only CPA, only S&H, or both
- Test error states (missing contract, 404 errors)
- Test mobile responsiveness of button

### Contract Date Fields Fix (2026-01-23)

**Issue**: Contract dates were showing as "-" in the detail views even though the contract relation was resolved successfully. The API response included the contract data but the dates weren't displaying.

**Root Cause**: Contracts use different date field names than what was configured in `BASIC_FIELD_DEFINITIONS`:
- CPA contracts use: `inicioContratoCPA` and `fimContratoCPA`
- S&H contracts use: `inicioContratoSH` and `fimContratoSH`
- But the configuration was looking for generic `dataInicio` and `dataFim` fields

**Fix Applied**:

1. **Shared Package** (`packages/shared/src/utils.ts`):
   - Updated `BASIC_FIELD_DEFINITIONS` for contracts to include:
     - `inicioContratoCPA` - CPA contract start date
     - `fimContratoCPA` - CPA contract end date
     - `inicioContratoSH` - S&H contract start date
     - `fimContratoSH` - S&H contract end date
   - Removed generic `dataInicio` and `dataFim` fields

2. **Frontend Detail Views**:
   - Updated `getContractDates()` function in `WorkSheetsDetailView.vue` to:
     - Check for CPA contract dates first (`inicioContratoCPA`, `fimContratoCPA`)
     - Fall back to S&H contract dates (`inicioContratoSH`, `fimContratoSH`)
     - Handle cases where only start date is available
   
   - Updated `getContractDates()` function in `RemoteAssistanceDetailView.vue` with same logic

**Files Modified**:
- `packages/shared/src/utils.ts` - Updated contract date field names in BASIC_FIELD_DEFINITIONS
- `packages/frontend/src/views/work-sheets/WorkSheetsDetailView.vue` - Updated getContractDates() function
- `packages/frontend/src/views/remote-assistance/RemoteAssistanceDetailView.vue` - Updated getContractDates() function

**Packages Rebuilt**:
- `@clever/shared` - Rebuilt with correct date field names
- `@clever/backend` - Rebuilt to use updated shared package

**Expected Behavior**:
- Contract dates now display correctly in Portuguese format (e.g., "23/01/2026 - 23/01/2027")
- CPA contracts show their specific dates
- S&H contracts show their specific dates
- Contracts with both CPA and S&H show CPA dates (as primary)
- Contracts with only start date show "Início: DD/MM/YYYY"

**Testing**:
- Test with CPA-only contracts
- Test with S&H-only contracts
- Test with contracts that have both CPA and S&H
- Verify dates display in Portuguese format (DD/MM/YYYY)
- Verify dates appear in both work sheets and remote assistance detail views

### Update View Contract Field Fix (2026-01-23)

**Issue**: When opening the update view for a work sheet or remote assistance with a contract selected, the ContractSearchInput was empty. The contract was saved in the database and displayed correctly in the detail view, but wasn't being loaded into the update form.

**Root Cause**: The `initialFormData` computed property in both update views was missing the `contractId` field, so the form wasn't being initialized with the existing contract selection. Additionally, the `handleUpdate` function wasn't including the `contractId` field when submitting updates.

**Fix Applied**:

1. **Work Sheets Update View** (`packages/frontend/src/views/work-sheets/WorkSheetsUpdateView.vue`):
   - Added `contractId: data.contractId || ''` to the `initialFormData` computed property (line 138)
   - Added `contractId: formData.contractId` to the `updateData` object in `handleUpdate` function (line 476)

2. **Remote Assistance Update View** (`packages/frontend/src/views/remote-assistance/RemoteAssistanceUpdateView.vue`):
   - Added `contractId: data.contractId || ''` to the `initialFormData` computed property (after clientId field)
   - Added `contractId: formData.contractId` to the `updateData` object in `handleUpdate` function (after clientId field)

**Files Modified**:
- `packages/frontend/src/views/work-sheets/WorkSheetsUpdateView.vue` - Added contractId to initialFormData and handleUpdate
- `packages/frontend/src/views/remote-assistance/RemoteAssistanceUpdateView.vue` - Added contractId to initialFormData and handleUpdate

**Expected Behavior**:
- When opening update view for work sheet with contract, ContractSearchInput shows the selected contract
- When opening update view for remote assistance with contract, ContractSearchInput shows the selected contract
- Contract selection is preserved when updating the record
- Contract can be changed in update view if needed

**Testing**:
- Create a work sheet with payment method "CONTRATO" and select a contract
- Navigate to detail view and verify contract displays correctly
- Click "Editar" to open update view
- Verify ContractSearchInput shows the selected contract (not empty)
- Update other fields and save
- Verify contract is still selected after update
- Repeat for remote assistance
- Test changing the contract in update view
- Test removing contract by changing payment method
