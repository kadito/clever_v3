# Contract Selection for Payment Method - Requirements

## Overview

Add contract selection functionality to Work Sheets and Remote Assistance forms when the payment method is set to "Contrato". This allows users to link work sheets and remote assistance records to specific client contracts.

## User Stories

### US-1: Contract Selection in Work Sheets
**As a** technician creating a work sheet  
**I want to** select a contract when payment method is "Contrato"  
**So that** the work can be properly linked to the client's contract

**Acceptance Criteria:**
1. When payment method is set to "Contrato", a contract search input appears
2. Contract search only shows contracts for the selected client
3. Contract selection is required when payment method is "Contrato"
4. Contract selection is hidden when payment method is not "Contrato"
5. Selected contract is stored as `contractId` in work sheet data
6. Contract relation is resolved and displayed in detail view

### US-2: Contract Selection in Remote Assistance
**As a** technician creating a remote assistance record  
**I want to** select a contract when payment method is "Contrato"  
**So that** the assistance can be properly linked to the client's contract

**Acceptance Criteria:**
1. When payment method is set to "Contrato", a contract search input appears
2. Contract search only shows contracts for the selected client
3. Contract selection is required when payment method is "Contrato"
4. Contract selection is hidden when payment method is not "Contrato"
5. Selected contract is stored as `contractId` in remote assistance data
6. Contract relation is resolved and displayed in detail view

### US-3: Contract Search Component
**As a** user  
**I want to** search and select contracts similar to client selection  
**So that** I can quickly find the correct contract

**Acceptance Criteria:**
1. Component follows the same pattern as ClientSearchInput
2. Search filters contracts by client ID
3. Displays contract number and relevant details
4. Supports readonly mode for update views (if needed)
5. Shows validation errors appropriately
6. Mobile-friendly with 44px touch targets

## Business Rules

### BR-1: Client Dependency
- Contract selection requires a client to be selected first
- If no client is selected, show appropriate message
- Contract list is filtered by the selected client ID

### BR-2: Payment Method Dependency
- Contract field only appears when payment method = "Contrato"
- Contract field is required when visible
- Contract field value is cleared when payment method changes away from "Contrato"

### BR-3: Contract Validation
- Selected contract must belong to the selected client
- Contract must exist in the system
- Contract must not be deleted (soft delete check)

### BR-4: Data Storage
- Contract ID stored as `contractId` field in work sheet/remote assistance data
- Follows existing relation pattern: `{relationType}Id`
- Contract relation automatically resolved in API responses

## Technical Constraints

### TC-1: Component Reuse
- Create a single `ContractSearchInput` component
- Follow the same pattern as `ClientSearchInput`
- Reuse across Work Sheets and Remote Assistance forms

### TC-2: API Integration
- Use existing `useApi` composable for contract fetching
- Filter contracts by client ID on frontend
- No new API endpoints required

### TC-3: Form Integration
- Use conditional field display based on payment method
- Integrate with existing form validation
- Maintain mobile-first responsive design

### TC-4: Relation System
- Contract relation follows existing relation patterns
- Backend automatically resolves contract relations
- Frontend displays resolved contract data in detail views

## Out of Scope

- Contract creation from work sheet/remote assistance forms
- Contract editing functionality
- Contract status validation (active/inactive)
- Multiple contract selection
- Contract history tracking

## Success Metrics

- Contract selection works seamlessly in both content types
- No performance degradation in form loading
- Contract search returns results in < 500ms
- Mobile usability maintained (44px touch targets)
- Zero data integrity issues with contract relations

## Dependencies

- Existing ClientSearchInput component pattern
- Existing contract content type and API
- Existing relation resolution system
- Work Sheets and Remote Assistance form configurations

## Assumptions

- Contracts are already implemented in the system
- Contract data includes client ID for filtering
- Users understand the concept of linking work to contracts
- Payment method field already exists in both content types
