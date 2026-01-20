# Implementation Plan: Contract Form Fixes

## Overview

This implementation plan addresses critical issues in the CLEVER dashboard contract management system by fixing CPA plan selection logic, correcting price table display behavior, improving toggle switch visual consistency, ensuring complete data storage and display, and streamlining forms by removing redundant client information fields.

## Tasks

- [x] 1. Create Plan Selection Service
  - Create new service file for handling plan filtering and selection logic
  - Implement methods for getting available plans based on contract type
  - Add configuration loading and validation logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2. Fix CPA Plan Selection Logic
  - [x] 2.1 Update CPAContractSection component plan dropdown
    - Replace hardcoded plan options with dynamic filtering
    - Implement reactive plan options based on contract type selection
    - Add plan clearing logic when contract type changes
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 Integrate Plan Selection Service
    - Import and use the new plan selection service
    - Connect service methods to component reactive properties
    - Handle service errors gracefully
    - _Requirements: 1.5, 7.1, 7.5_

- [x] 3. Fix Price Table Display Logic
  - [x] 3.1 Update shouldShowPlanDetails computed property
    - Modify logic to show price table immediately after plan selection for all contract types
    - Remove distance requirement for price table display
    - Ensure proper handling of different pricing structures
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Enhance DynamicPlanDetails component
    - Ensure proper handling of flat pricing (CPA_1500) and distance-based pricing (CPA, S&H)
    - Add loading states for plan changes
    - Improve error handling for missing plan data
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Improve Toggle Switch Visual Consistency
  - [x] 4.1 Enhance DisplayToggleSwitch component styling
    - Standardize CSS classes and animations
    - Improve accessibility with proper ARIA attributes
    - Add consistent hover and focus states
    - Implement smooth transitions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 4.2 Update form section integration
    - Ensure consistent toggle behavior across all contract sections
    - Add proper state management for section visibility
    - Implement smooth show/hide animations
    - _Requirements: 3.4, 3.5_

- [x] 5. Checkpoint - Verify form functionality
  - Ensure all form interactions work correctly, ask the user if questions arise.

- [x] 6. Verify and Fix Data Storage
  - [x] 6.1 Audit contract form data handling
    - Verify all form fields are included in ContractCreationData and ContractUpdateData types
    - Ensure proper handling of CPA_1500 contract type storage
    - Verify equipment data storage completeness
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.2 Update backend API endpoints if needed
    - Ensure all form fields are properly processed and stored
    - Add validation for contract type-specific fields
    - Improve error handling for missing or invalid data
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Enhance Contract Detail View
  - [x] 7.1 Verify and add missing field displays
    - Ensure all stored contract fields are displayed in detail view
    - Add proper formatting for CPA_1500 contract type display
    - Enhance POS package display with appropriate styling
    - Verify equipment field display completeness
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 7.2 Improve relation error handling
    - Enhance error message display for relation resolution failures
    - Add appropriate styling for error states
    - Ensure clear user feedback for missing client data
    - _Requirements: 5.5_

- [x] 8. Implement Form Validation Enhancements
  - [x] 8.1 Update validation logic for contract types
    - Remove distance requirement validation for CPA_1500 contracts
    - Maintain distance requirement validation for CPA and S&H contracts
    - Implement contract type-specific validation rules
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 8.2 Improve validation error handling
    - Ensure error messages are displayed in Portuguese
    - Implement immediate error message removal when errors are corrected
    - Add clear, helpful validation feedback
    - _Requirements: 6.4, 6.5_

- [x] 9. Remove Client Information Fields from Forms
  - [x] 9.1 Update contract create form
    - Remove client information input fields
    - Keep only client selection dropdown
    - Update form layout and styling
    - _Requirements: 8.1, 8.4_

  - [x] 9.2 Update contract update form
    - Implement read-only client field using form section modification
    - Display selected client information without allowing changes
    - Provide clear visual indicators for read-only state
    - Ensure client ID is included in update requests
    - _Requirements: 8.2, 8.6, 8.7_

  - [x] 9.3 Verify client data handling
    - Ensure client selection uses existing client data
    - Verify client information display in detail view through relations
    - Test client data resolution and display
    - _Requirements: 8.3, 8.5_

- [x] 10. Enhance UI Consistency
  - [x] 10.1 Standardize form element styling
    - Ensure consistent visual feedback across all form elements
    - Standardize animation and transition effects
    - Implement consistent error state styling
    - Add consistent loading indicators
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 10.2 Verify responsive design
    - Test form components across different screen sizes
    - Ensure proper mobile and desktop functionality
    - Verify touch-friendly interactions on mobile devices
    - _Requirements: 9.5_

- [x] 11. Final checkpoint - Complete testing
  - Ensure all fixes work correctly across different scenarios, ask the user if questions arise.

- [x] 12. Fix JavaScript Error Prevention
  - [x] 12.1 Remove duplicate equipment watchers
    - Remove the first set of equipment watchers that don't use cleanup pattern
    - Keep only the properly managed watchers with cleanup functions
    - Ensure no conflicting watchers for the same reactive arrays
    - _Requirements: 10.5_

  - [x] 12.2 Add null checks to all form data access
    - Add proper null checks to all watchers accessing formData.value
    - Update initialization functions to check formData availability
    - Ensure display toggle handlers safely access form data
    - _Requirements: 10.1, 10.3, 10.6_

  - [x] 12.3 Improve component lifecycle management
    - Ensure all watchers are properly added to cleanup functions
    - Verify proper cleanup on component unmount
    - Test component recreation scenarios
    - _Requirements: 10.2, 10.4, 10.7_

  - [x] 12.4 Test error scenarios
    - Test creating CPA-only contract then updating to add S&H section
    - Verify no "formData is not defined" errors occur
    - Ensure successful form submission after section additions
    - _Requirements: 10.1_

## Notes

- Focus on rapid implementation without automated tests initially
- User will perform manual testing and UI verification
- All code should be written in TypeScript following existing patterns
- Maintain existing Vue 3 + Composition API architecture
- Ensure Portuguese language support for all user-facing text
- Follow mobile-first responsive design principles