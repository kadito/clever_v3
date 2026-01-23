# Remote Assistance Payment Method & Contract Display Refactor

## Overview

Refactor the remote assistance module to add payment method selection and display contract information when the payment method is "Contrato", following the same pattern established in work sheets.

## User Stories

### US-1: Payment Method Selection in Forms
**As a** user creating or updating a remote assistance record  
**I want to** select a payment method (Contrato, Faturação, or Garantia)  
**So that** I can properly categorize how the assistance will be paid

**Acceptance Criteria:**
1.1. Payment method field is displayed in the form with three options: Contrato, Faturação, Garantia
1.2. Payment method field is required
1.3. When "Contrato" is selected, a contract search field appears
1.4. Contract search field is filtered by the selected client
1.5. Contract search field is required when payment method is "Contrato"
1.6. The old "Contrato" and "Garantia" boolean switches are REMOVED from the Estado section
1.7. Payment method section appears after the Estado section and before Anexos

### US-2: Contract Information Display in Detail View
**As a** user viewing a remote assistance record  
**I want to** see the associated contract information when payment method is "Contrato"  
**So that** I can verify which contract covers this assistance

**Acceptance Criteria:**
2.1. When payment method is "Contrato", a contract information section is displayed
2.2. Contract section shows contract number, client name, contract type, and status
2.3. Contract section uses the same visual design as work sheets (green border, contract icon)
2.4. If contract relation fails to resolve (404), display error state with red border
2.5. If no contractId is provided but payment method is "Contrato", show warning state with yellow border
2.6. Contract section appears after the Estado section and before Anexos section
2.7. Payment method is displayed in the detail view

### US-3: Form Configuration Updates
**As a** developer  
**I want to** update the form configuration to include payment method and contract selection  
**So that** the forms follow the established patterns

**Acceptance Criteria:**
3.1. Payment method field is added to remote-assistance-form-sections.ts
3.2. Contract search field is conditionally displayed based on payment method
3.3. Form sections maintain proper ordering: Basic → Assistance Info → Date/Time → Description → Estado → Payment → Anexos
3.4. Contract field uses ContractSearchInput component
3.5. Contract field is filtered by clientId

### US-4: Data Model Updates
**As a** developer  
**I want to** update the data model to include payment method and contract ID while removing old boolean fields  
**So that** the data structure supports the new functionality

**Acceptance Criteria:**
4.1. RemoteAssistanceCreationData includes paymentMethod field (required)
4.2. RemoteAssistanceCreationData includes contractId field (optional)
4.3. RemoteAssistanceUpdateData includes paymentMethod field (required)
4.4. RemoteAssistanceUpdateData includes contractId field (optional)
4.5. The old "contrato" boolean field is REMOVED from data types
4.6. The old "garantia" boolean field is REMOVED from data types
4.7. Validation ensures contractId is provided when paymentMethod is "Contrato"
4.8. Validation ensures paymentMethod is one of: "Contrato", "Faturação", "Garantia"

### US-5: Backend Relation Resolution
**As a** developer  
**I want to** ensure contract relations are resolved in the backend  
**So that** contract information is available in API responses

**Acceptance Criteria:**
5.1. Remote assistance API responses include contract relation when contractId is present
5.2. Contract relation resolution follows the same pattern as work sheets
5.3. Failed contract resolutions return structured error objects (404/500)
5.4. Contract relation is optional (only resolved when contractId exists)

## Dependencies

- ContractSearchInput component (already exists)
- Contract relation resolution in backend (already implemented)
- Work sheets detail view pattern for contract display (already implemented)

## Out of Scope

- Modifying contract resolution logic (already implemented)
- Creating new contract-related components (reuse existing)
- Modifying list view display (focus on forms and detail view only)

## Success Criteria

1. Users can select payment method in create/update forms
2. Contract search appears when payment method is "Contrato"
3. Contract information displays correctly in detail view (following work sheets pattern)
4. Old "contrato" and "garantia" boolean fields are removed from forms and data model
5. All validation rules are enforced
