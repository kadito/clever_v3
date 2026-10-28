# Implementation Plan: Remote Assistance Payment Method & Contract Display

## Overview

This implementation plan refactors the remote assistance module to replace boolean "contrato" and "garantia" fields with a unified payment method selection system. The implementation follows the established work sheets pattern for contract display and leverages existing relation resolution infrastructure.

## Tasks

- [x] 1. Update data types and remove old boolean fields
  - Update RemoteAssistanceData interface to remove "contrato" and "garantia" boolean fields
  - Change paymentMethod from optional to required field
  - Update RemoteAssistanceCreationData and RemoteAssistanceUpdateData types
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 2. Update validation logic
  - [x] 2.1 Add payment method validation
    - Validate payment method is one of: "Contrato", "Faturação", "Garantia"
    - Ensure payment method is not empty
    - _Requirements: 4.8_
  
  - [x] 2.2 Add conditional contract ID validation
    - Validate contractId is required when paymentMethod is "Contrato"
    - Validate contractId is valid UUID format when provided
    - _Requirements: 4.7_
  
  - [x] 2.3 Remove old boolean field validations
    - Remove validation for "contrato" boolean field
    - Remove validation for "garantia" boolean field
    - _Requirements: 4.5, 4.6_

- [x] 3. Update form configuration
  - [x] 3.1 Remove old boolean switches from status section
    - Remove "contrato" switch field
    - Remove "garantia" switch field
    - Keep only "resolvido" switch and conditional "relatorio" field
    - _Requirements: 1.6, 3.1_
  
  - [x] 3.2 Update payment section fields
    - Ensure paymentMethod select field is required
    - Ensure contractId field has conditional display (shown only when paymentMethod === "Contrato")
    - Ensure contractId field is required when visible
    - Verify section ordering: Basic → Assistance Info → Date/Time → Description → Estado → Payment → Anexos
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.7, 3.2, 3.3_

- [x] 4. Update RemoteAssistanceDetailView component
  - [x] 4.1 Add contract information section
    - Add conditional contract section (shown when paymentMethod === "Contrato")
    - Implement three states: resolved contract, error state (404/500), warning state (missing contractId)
    - Use same styling as WorkSheetsDetailView (green/red/yellow borders)
    - Add contract icon and navigation button
    - Position section after Estado and before Anexos
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [x] 4.2 Add contract helper functions
    - Add getPlanName function (reused from WorkSheetsDetailView)
    - Add getContractDisplayName function (reused from WorkSheetsDetailView)
    - Add getContractDates function (reused from WorkSheetsDetailView)
    - Add navigateToContract function
    - Import contractPlansConfig
    - Import isRelationError utility
    - _Requirements: 2.2, 2.3_
  
  - [x] 4.3 Update payment method display
    - Add payment method display in appropriate section
    - Ensure payment method is shown in detail view
    - _Requirements: 2.7_

- [x] 5. Update RemoteAssistanceCreateView component
  - [x] 5.1 Add ContractSearchInput integration
    - Import ContractSearchInput component
    - Add custom field template for contractId field
    - Implement client filtering for contract search
    - Handle contract selection event
    - _Requirements: 1.4, 3.4, 3.5_
  
  - [x] 5.2 Update form data handling
    - Ensure paymentMethod field is properly initialized
    - Handle conditional contractId field based on paymentMethod
    - Clear contractId when paymentMethod changes from "Contrato" to other values
    - _Requirements: 1.1, 1.3_

- [x] 6. Update RemoteAssistanceUpdateView component
  - [x] 6.1 Add ContractSearchInput integration
    - Import ContractSearchInput component
    - Add custom field template for contractId field
    - Implement client filtering for contract search
    - Handle contract selection event
    - Load existing contract data when editing
    - _Requirements: 1.4, 3.4, 3.5_
  
  - [x] 6.2 Update form data handling
    - Ensure paymentMethod field is properly loaded from existing data
    - Handle conditional contractId field based on paymentMethod
    - Clear contractId when paymentMethod changes from "Contrato" to other values
    - _Requirements: 1.1, 1.3_

- [x] 7. Verify backend relation resolution
  - Confirm contract relation is configured in relation-validation.ts
  - Test API responses include contract relation when contractId is present
  - Verify failed resolutions return structured error objects (404/500)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 8. Checkpoint - Ensure all changes work together
  - Test creating remote assistance with each payment method
  - Test updating remote assistance to change payment methods
  - Test contract display in detail view with valid contract
  - Test contract display with invalid contract (404 error)
  - Test contract display with missing contractId but payment method "Contrato"
  - Verify old "contrato" and "garantia" fields are completely removed
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- This refactor removes old boolean fields entirely - no backward compatibility or data migration
- Follow the exact pattern from WorkSheetsDetailView for contract display
- Reuse existing ContractSearchInput component and contract relation resolution
- All validation rules are enforced at both frontend and backend
- Payment method section appears after Estado section and before Anexos section
- Contract information section appears after Estado section and before Anexos section in detail view
