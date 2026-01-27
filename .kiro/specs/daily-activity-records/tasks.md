# Implementation Plan: Daily Activity Records

## Overview

This implementation plan breaks down the Daily Activity Records feature into discrete, incremental coding tasks. Each task builds on previous work and includes specific requirements references. The implementation follows the established CLEVER dashboard patterns including the 5-view pattern, mobile-first design, automatic technician assignment, and user permissions.

## Tasks

- [ ] 1. Set up shared types and validation
  - [x] 1.1 Create daily records type definitions in shared package
    - Create `packages/shared/src/types/daily-records/index.ts`
    - Define `DailyRecordCreationData`, `DailyRecordUpdateData`, `Activity` interfaces
    - Define `DailyRecordWithRelations` and `DailyRecordRelations` interfaces
    - Export all types from shared package
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 4.1, 5.1, 8.1_
  
  - [ ]* 1.2 Write property test for activity type validation
    - **Property 7: Activity Type Validation**
    - **Validates: Requirements 3.1, 3.2**
  
  - [x] 1.3 Create validation functions for daily records
    - Create `packages/shared/src/types/daily-records/validation.ts`
    - Implement `validateDailyRecordCreation()` function
    - Implement `validateActivity()` helper function
    - Implement time validation helpers (`isValidTimeFormat`, `timeToMinutes`, `minutesToTime`)
    - Implement `calculateTotalHours()` function with overnight support
    - Export validation functions
    - _Requirements: 1.1, 1.2, 3.1, 4.1, 5.1, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3_
  
  - [ ]* 1.4 Write property tests for time validation
    - **Property 10: Time Format Validation**
    - **Property 11: Time Relationship Validation**
    - **Property 12: Break Time Validation**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
  
  - [ ]* 1.5 Write property test for total hours calculation
    - **Property 13: Total Hours Calculation**
    - **Validates: Requirements 5.5, 7.1, 7.2, 7.3**

- [ ] 2. Configure relation mappings
  - [x] 2.1 Add daily records relation configuration
    - Update `packages/shared/src/relation-configs.ts`
    - Add 'daily-records' entry to `CONTENT_RELATION_CONFIGS`
    - Configure workSheetId → work-sheets relation
    - Configure remoteAssistanceId → remote-assistance relation
    - Mark both relations as optional (isRequired: false)
    - _Requirements: 8.5, 18.1_
  
  - [ ]* 2.2 Write property test for relation ID storage
    - **Property 18: Relation ID Storage**
    - **Validates: Requirements 8.5**

- [ ] 3. Implement backend API routes
  - [x] 3.1 Create daily records API route handlers
    - Create `packages/backend/src/routes/content/daily-records.ts`
    - Implement GET /api/content/daily-records (list with search)
    - Implement GET /api/content/daily-records/:uuid (get with relations)
    - Implement POST /api/content/daily-records (create)
    - Implement PUT /api/content/daily-records/:uuid (update)
    - Implement DELETE /api/content/daily-records/:uuid (soft delete, admin only)
    - Apply automatic technician assignment middleware
    - Apply permission middleware for delete operations
    - Use existing relation resolution utilities
    - _Requirements: 1.1, 1.2, 1.3, 12.1, 13.1, 14.1, 15.1, 15.2, 18.1_
  
  - [ ]* 3.2 Write property tests for backend API
    - **Property 1: Date Validation**
    - **Property 2: Minimum Activity Requirement**
    - **Property 3: Content Creation Initialization**
    - **Property 30: Soft Delete Behavior**
    - **Property 31: Delete Permission Enforcement**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 15.1, 15.2, 15.3**

- [x] 4. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Create search input components
  - [x] 5.1 Implement WorkSheetSearchInput component
    - Create `packages/frontend/src/components/common/WorkSheetSearchInput.vue`
    - Follow ClientSearchInput pattern
    - Implement debounced search with useApi composable
    - Display work sheet identification (date, client, service type)
    - Support readonly mode for display
    - Handle loading and error states
    - Emit update:modelValue and workSheetSelected events
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 5.2 Implement RemoteAssistanceSearchInput component
    - Create `packages/frontend/src/components/common/RemoteAssistanceSearchInput.vue`
    - Follow ClientSearchInput pattern
    - Implement debounced search with useApi composable
    - Display remote assistance identification (date, client, type)
    - Support readonly mode for display
    - Handle loading and error states
    - Emit update:modelValue and remoteAssistanceSelected events
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 5.3 Write property tests for search functionality
    - **Property 21: Search Functionality**
    - **Property 22: Selection Storage**
    - **Validates: Requirements 9.2, 9.4, 10.2, 10.4**


- [ ] 6. Create ActivityCard component
  - [x] 6.1 Implement ActivityCard component
    - Create `packages/frontend/src/components/daily-records/ActivityCard.vue`
    - Support both view and edit modes
    - Implement time input formatting (XXXX → XX:XX)
    - Calculate total hours reactively
    - Show/hide conditional fields based on tipoLigacao
    - Integrate WorkSheetSearchInput and RemoteAssistanceSearchInput
    - Emit activity-updated and activity-removed events
    - Use mobile-first responsive design with 44px touch targets
    - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.5, 6.1, 8.1, 8.2, 8.3, 11.1, 11.2, 11.3, 11.4, 17.1_
  
  - [ ]* 6.2 Write property tests for ActivityCard
    - **Property 4: Activity Array Management**
    - **Property 15: Time Input Formatting**
    - **Property 19: Conditional Field Visibility**
    - **Property 20: Link Type Change Clears Selection**
    - **Validates: Requirements 2.1, 2.3, 6.1, 11.1, 11.2, 11.3, 11.4**

- [ ] 7. Create form configuration
  - [x] 7.1 Create daily records form sections configuration
    - Create `packages/frontend/src/config/daily-records-form-sections.ts`
    - Define form sections: General Information, Activities
    - Configure dataRegistro field (date input, required)
    - Activities section will use ActivityCard components (not traditional fields)
    - Export dailyRecordsFormSections
    - _Requirements: 1.1, 2.1_

- [ ] 8. Implement create view
  - [x] 8.1 Create DailyRecordsCreateView component
    - Create `packages/frontend/src/views/daily-records/DailyRecordsCreateView.vue`
    - Use ContentCreateTemplate wrapper
    - Use useSharedFormData composable
    - Implement dynamic activity management (add/remove)
    - Use ActivityCard components for each activity
    - Implement custom validation with validateDailyRecordCreation
    - Handle form submission and navigation
    - Transform form data to DailyRecordCreationData format
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 16.1, 16.5_
  
  - [ ]* 8.2 Write property tests for create view
    - **Property 5: Activity Isolation During Edit**
    - **Property 6: Activity Capacity**
    - **Property 33: Form Submission Prevention**
    - **Validates: Requirements 2.2, 2.5, 16.5**

- [x] 9. Implement list view
  - [x] 9.1 Create DailyRecordsListView component
    - Create `packages/frontend/src/views/daily-records/DailyRecordsListView.vue`
    - Use useApi composable for data fetching
    - Display date, number of activities, total hours summary
    - Implement search and date range filtering
    - Sort by date descending (newest first)
    - Use mobile-responsive card layout
    - Navigate to detail view on click
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 17.3, 17.4_
  
  - [ ]* 9.2 Write property tests for list view
    - **Property 23: Deleted Records Exclusion**
    - **Property 24: List Display Information**
    - **Property 25: Date Range Filtering**
    - **Property 26: Chronological Ordering**
    - **Validates: Requirements 12.1, 12.2, 12.4, 12.5**

- [ ] 10. Implement detail view
  - [x] 10.1 Create DailyRecordsDetailView component
    - Create `packages/frontend/src/views/daily-records/DailyRecordsDetailView.vue`
    - Use ContentDetailTemplate for consistent layout
    - Display date and all activities with complete information
    - Use RelationInfoDisplay for resolved work sheets and remote assistance
    - Handle relation resolution errors gracefully (red styling)
    - Show audit trail section (admin only) using usePermissions
    - Implement delete functionality (admin only)
    - Use ConfirmationDialog for delete confirmation
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 15.1, 15.2, 18.5, 20.1, 20.2_
  
  - [ ]* 10.2 Write property tests for detail view
    - **Property 27: Relation Resolution**
    - **Property 38: Audit Trail Visibility by Role**
    - **Property 39: Audit Trail Completeness**
    - **Validates: Requirements 13.3, 13.4, 13.5, 18.1, 18.2, 18.3, 18.4, 20.1, 20.2, 20.3, 20.4, 20.5**

- [ ] 11. Implement update view
  - [x] 11.1 Create DailyRecordsUpdateView component
    - Create `packages/frontend/src/views/daily-records/DailyRecordsUpdateView.vue`
    - Use ContentFormTemplate directly (not wrapper)
    - Load existing daily record data
    - Use same activity management as create view
    - Pre-populate activities with existing data
    - Implement custom validation (same as create)
    - Handle form submission and navigation
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  
  - [ ]* 11.2 Write property tests for update view
    - **Property 28: Update Validation Consistency**
    - **Property 29: Version Increment on Update**
    - **Validates: Requirements 14.3, 14.4, 14.5**

- [x] 12. Checkpoint - Ensure frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Add routing configuration
  - [x] 13.1 Configure Vue Router routes for daily records
    - Update `packages/frontend/src/router/index.ts`
    - Add route: /daily-records (list view)
    - Add route: /daily-records/new (create view)
    - Add route: /daily-records/:uuid (detail view)
    - Add route: /daily-records/:uuid/edit (update view)
    - Configure route meta (requiresAuth: true)
    - _Requirements: 12.3_

- [ ] 14. Add navigation to home dashboard
  - [x] 14.1 Add daily records tile to HomeView
    - Update `packages/frontend/src/views/HomeView.vue`
    - Add "Registo Diário de Atividade" content tile
    - Link to /daily-records route
    - Use appropriate icon
    - Follow existing tile styling
    - _Requirements: 12.1_

- [ ] 15. Implement mobile optimizations
  - [x] 15.1 Verify and adjust touch targets
    - Review all interactive elements in daily records views
    - Ensure all buttons, inputs, and clickable areas are minimum 44px
    - Test on mobile device or browser dev tools
    - Adjust CSS as needed for touch target compliance
    - _Requirements: 17.1, 17.5_
  
  - [x] 15.2 Verify responsive layouts
    - Test all views at 320px, 768px, and 1280px+ widths
    - Verify activity cards stack vertically on mobile
    - Verify form sections adapt appropriately
    - Verify search dropdowns work on mobile
    - Adjust breakpoints and layouts as needed
    - _Requirements: 17.3, 17.4_
  
  - [ ]* 15.3 Write property tests for mobile compliance
    - **Property 34: Touch Target Compliance**
    - **Property 35: Responsive Layout Adaptation**
    - **Validates: Requirements 17.1, 17.3, 17.4, 17.5**

- [ ] 16. Final integration and testing
  - [x] 16.1 Test complete user flows
    - Create daily record with single activity
    - Create daily record with multiple activities
    - Add/edit/remove activities dynamically
    - Link activities to work sheets and remote assistance
    - Update existing daily record
    - Delete daily record (admin only)
    - Verify all validation messages in Portuguese
    - Test on mobile, tablet, and desktop
    - _Requirements: All_
  
  - [x] 16.2 Verify relation resolution
    - Create daily record with linked work sheet
    - Create daily record with linked remote assistance
    - View detail page and verify relations are resolved
    - Test with invalid relation IDs (should show errors)
    - Verify error styling (red background/border)
    - _Requirements: 13.3, 13.4, 18.1, 18.2, 18.3, 18.4_
  
  - [x] 16.3 Verify permission enforcement
    - Test delete as admin user (should succeed)
    - Test delete as non-admin user (should fail with 403)
    - Verify audit trail visible for admin only
    - Verify audit trail hidden for non-admin users
    - _Requirements: 15.2, 20.1, 20.2_

- [x] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Follow existing CLEVER dashboard patterns throughout
- Use Portuguese labels and error messages consistently
- Maintain mobile-first responsive design principles
- Apply automatic technician assignment (no manual field)
- Enforce user permissions (delete restricted to Admin)
