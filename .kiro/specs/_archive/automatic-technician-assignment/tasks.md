# Implementation Plan: Automatic Technician Assignment

## Overview

This implementation plan converts the automatic technician assignment design into discrete coding tasks. The approach focuses on creating the TechnicianUser interface, updating existing data structures, modifying backend routes for auto-assignment, and updating frontend forms and displays.

## Tasks

- [x] 1. Create TechnicianUser interface and update shared types
  - Create TechnicianUser interface in shared package
  - Update WorkSheetOtherData interface to use TechnicianUser object for technician field
  - Update RemoteAssistanceData interface to use TechnicianUser object for technicianResponsavel field
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Implement backend auto-assignment functionality
  - [x] 2.1 Create technician auto-assignment utility function
    - Write function to extract TechnicianUser object from UserContext
    - Write function to auto-assign technician data to content during create/update
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ]* 2.2 Write property test for technician auto-assignment
    - **Property 1: Automatic Technician Assignment on Creation**
    - **Property 2: Automatic Technician Assignment on Update**
    - **Validates: Requirements 1.1, 1.2, 1.3**

- [ ] 3. Update backend routes for work sheets and remote assistance
  - [x] 3.1 Modify work sheets route to use auto-assignment
    - Integrate technician auto-assignment in create and update operations
    - Update validation to handle TechnicianUser object structure
    - _Requirements: 1.1, 1.3_
  
  - [x] 3.2 Modify remote assistance route to use auto-assignment
    - Integrate technician auto-assignment in create and update operations
    - Update validation to handle TechnicianUser object structure
    - _Requirements: 1.2, 1.3_

- [ ] 4. Update frontend form configurations
  - [x] 4.1 Remove technician field from work sheets form sections
    - Update work-sheets-form-sections.ts to remove technician input field
    - _Requirements: 2.1_
  
  - [x] 4.2 Remove technicianResponsavel field from remote assistance form sections
    - Update remote-assistance-form-sections.ts to remove technicianResponsavel input field
    - _Requirements: 2.2_
  
  - [ ]* 4.3 Write property test for form field removal
    - **Property 4: Form Field Removal**
    - **Validates: Requirements 2.1, 2.2**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Update frontend display components
  - [x] 6.1 Update work sheets detail view to display TechnicianUser object
    - Modify WorkSheetsDetailView to extract and display technician name from object
    - _Requirements: 3.1_
  
  - [x] 6.2 Update remote assistance detail view to display TechnicianUser object
    - Modify RemoteAssistanceDetailView to extract and display technician name from object
    - _Requirements: 3.2_
  
  - [x] 6.3 Update list views to display technician names from TechnicianUser objects
    - Update work sheets and remote assistance list views to handle object structure
    - _Requirements: 3.3_
  
  - [ ]* 6.4 Write property test for technician display consistency
    - **Property 3: Technician Display Consistency**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- The implementation maintains backward compatibility by handling both string and object formats during transition