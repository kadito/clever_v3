# Implementation Plan: Content Implementation Pattern

## Overview

This implementation plan establishes the foundational pattern for all content types in the CLEVER dashboard system, then provides a repeatable process for implementing each content type individually following the established pattern.

## Key Improvements from Implementation Experience

### Form Data Management
- **Shared Form Data Composable**: Created `useSharedFormData.ts` to handle Vue component recreation issues
- **Component Architecture**: Split form handling into `ContentFormTemplate.vue` (core) and `ContentCreateTemplate.vue` (wrapper)
- **Data Persistence**: Form data persists across component recreation during navigation

### Audit Trail Enhancement
- **User Email Display**: Modified `ContentDetailTemplate.vue` to show user email addresses instead of user IDs
- **Current User Recognition**: Uses `useAuth()` composable to identify current user and display their email
- **Fallback Handling**: Shows "Sistema" for system actions and user ID for other users

### Validation Architecture
- **Shared Validation**: Validation functions in shared package for consistency
- **Custom Validators**: Content-specific validation can override default validation
- **Portuguese Messages**: All validation messages in Portuguese with proper field mapping

### Mobile-First Improvements
- **Touch Targets**: All interactive elements meet 44px minimum requirement
- **Responsive Forms**: Form sections adapt from mobile to desktop layouts
- **Input Types**: Proper HTML5 input types (tel, email, url) for mobile keyboards

### Multiselect Dropdown Enhancement
- **Touch-Friendly Interface**: Replaced individual checkboxes with multiselect dropdowns
- **Tag-Based Selection**: Visual tags show selected items with individual removal
- **Click-Outside Closing**: Proper dropdown behavior with overlay handling
- **Mobile Optimization**: Proper touch targets and responsive design

### Conditional Fields Implementation
- **Dynamic Visibility**: Fields show/hide based on other field values
- **Dependency Tracking**: Proper reactive updates when dependent values change
- **JSON Configuration**: All conditional logic defined in form section configuration

### Dynamic Configuration Management
- **Add/Remove Items**: Dynamic addition and removal of configuration items (e.g., software)
- **Edit Mode**: Individual item editing with save/cancel functionality
- **Mobile Cards**: Touch-friendly card interface for configuration management
- **Type-Specific Options**: Conditional suboptions based on configuration type

### Section Ordering Standardization
- **Consistent Order**: Basic → Contact → Address → Financial → Services → Configuration → Observations
- **Observations Last**: Always place observations section at the end
- **Cross-View Consistency**: Same ordering in Create, Update, and Detail views

## Phase 1: Base Infrastructure (Do Once)

- [x] 1. Set up shared types and base infrastructure
- [x] 1.1 Create BaseContent interface in shared package
  - Define uuid, contentType, audit trail fields, version tracking
  - Create API response types (ApiResponse, ListResponse, SearchResponse)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.2 Create ContentStorageService class template
  - Generic R2 storage operations (get, create, update, delete)
  - Search index synchronization logic
  - R2 key pattern implementation: content/{type}/{uuid}.json
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 1.3 Write property tests for base infrastructure
  - **Property 1: BaseContent Interface Compliance**
  - **Property 5: R2 Storage Key Pattern**
  - **Property 6: Content Retrieval Round Trip**
  - **Validates: Requirements 1.1, 1.4, 2.1, 2.2**

- [x] 2. Create shared Vue components
- [x] 2.1 Create ErrorComponent for consistent error display
  - Portuguese error messages
  - Simple close functionality (no retry logic)
  - _Requirements: 11.2, 12.5_

- [x] 2.2 Create BackButton component for navigation
  - Mobile-friendly touch targets (minimum 44px)
  - Consistent styling with color palette
  - _Requirements: 5.2, 5.5_

- [x] 2.3 Set up mobile-first CSS variables and base styles
  - Establish color palette (#75AE93 primary, #2c3e50 secondary)
  - Mobile-first responsive breakpoints
  - Touch-friendly component styles
  - _Requirements: 5.5, 12.1_

- [-] 3. Create generic API route template
- [x] 3.1 Implement base route handler pattern
  - Generic CRUD endpoints (GET, POST, PUT, DELETE)
  - Content-specific sorting logic (alphabetical for clients, by date for others)
  - Error handling with appropriate HTTP status codes
  - Authentication integration with Clerk
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.6, 10.1, 10.4_

- [ ]* 3.2 Write property tests for API pattern
  - **Property 9: API Endpoint Completeness**
  - **Property 10: API Error Response Consistency**
  - **Property 22: Content-Specific Sorting**
  - **Validates: Requirements 4.1-4.6, 8.6**

- [x] 4. Create Vue component templates
- [x] 4.1 Create ListView template component
  - Mobile-optimized card layout
  - Search functionality with debouncing
  - Portuguese labels and empty states
  - FAB for create action
  - _Requirements: 5.1, 5.2, 9.2, 12.1, 13.4_

- [x] 4.2 Create DetailView template component
  - Responsive section-based layout (320px+ width support)
  - Mobile-friendly information display
  - Edit action integration
  - _Requirements: 5.3, 9.3, 12.1_

- [x] 4.3 Create FormView template components
  - **ContentFormTemplate.vue**: Core form rendering with shared form data handling
  - **ContentCreateTemplate.vue**: Wrapper for creation-specific logic and validation
  - **ContentDetailTemplate.vue**: Enhanced with user email display in audit trail
  - Mobile-optimized form sections with touch-friendly controls
  - Shared form data composable to handle component recreation issues
  - Portuguese validation messages and labels
  - Appropriate input types (tel, email, url, textarea, select, checkbox)
  - _Requirements: 5.4, 9.4, 11.1, 12.1, 12.5_

- [x] 4.4 Enhance ClientSearchInput component for cross-content integration
  - Reduce debounce time from 500ms to 300ms for better responsiveness
  - Ensure component works seamlessly across all content forms (contracts, licenses, work sheets, daily records)
  - Verify mobile-first responsive design and touch-friendly interactions
  - Test integration with form templates and shared form data composable
  - Validate Portuguese localization and error messages
  - Ensure proper client data display in readonly/disabled modes
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 21.8, 21.9, 21.10_

- [ ]* 4.5 Write property tests for Vue templates
  - **Property 11: Mobile Touch Target Compliance**
  - **Property 12: Responsive Layout Compatibility**
  - **Property 13: Mobile Form Optimization**
  - **Property 24: Client Search Debouncing**
  - **Validates: Requirements 5.2, 5.3, 5.4, 21.2**

- [x] 5. Checkpoint - Base infrastructure complete ✅
- ✅ All base components and templates are working
- ✅ Frontend tests pass (48 tests) - authentication and component tests
- ✅ Shared package tests pass (64 tests) - types and storage tests  
- ✅ Backend tests pass (75 tests) - authentication and API tests ✅
- ✅ TypeScript compilation successful across all packages
- ✅ Build process successful for all packages
- ✅ Five-View Pattern implemented with Create/Update separation
- ✅ Mobile-first CSS framework and Portuguese localization in place
- ✅ Authentication middleware fixed - all API routes properly protected

## Phase 2: Content Type Implementation (Repeat for Each)  

### Process for Each Content Type (Contratos Implementation)

- [x] 6. Analyze legacy components for contratos
- [x] 6.1 Analyze old_src Detail view for contratos
  - Read old_src/views/contratos/ContratoDetail.vue
  - Extract data structure and display fields
  - Identify conditional logic and business rules
  - Document field relationships and formatting
  - _Requirements: 7.1, 7.2_

- [x] 6.2 Analyze old_src Form view for contratos
  - Read old_src/views/contratos/ContratoForm.vue
  - Extract form fields and input types
  - Identify validation rules and required fields
  - Document form sections and conditional fields
  - _Requirements: 7.1, 7.2_

- [x] 6.3 Create TypeScript interfaces for contratos
  - Extend BaseContent interface with content-specific data structure
  - Create validation schemas based on form analysis
  - Optimize data structure for new system (clean, modern design)
  - _Requirements: 7.3, 7.4, 7.5_

- [-] 7. Implement backend for contratos
- [x] 7.1 Create contracts.ts route file
  - Implement all CRUD endpoints using the generic pattern
  - Add content-specific validation logic
  - Configure content-specific sorting (by date for contracts)
  - Implement search index with content-specific searchable fields
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ]* 7.2 Write property tests for contratos API
  - **Property 15: Authentication Requirement**
  - **Property 16: Audit Trail User Recording**
  - **Property 7: Index-Storage Synchronization**
  - **Validates: Requirements 8.2, 8.3, 8.4, 10.1, 10.2**

- [x] 8. Implement frontend for contratos
- [ ] 8.1 Create ContractsListView.vue component
  - Implement content-specific display functions (getDisplayTitle, getDisplayMeta1, etc.)
  - Configure Portuguese labels for the content type
  - Add content-specific search and filter logic
  - Use mobile-first card layout with touch targets
  - _Requirements: 9.1, 9.2, 12.2, 12.3_

- [x] 8.2 Create ContractsDetailView.vue component
  - Use ContentDetailTemplate with enhanced audit trail display
  - Implement content-specific sections based on legacy analysis
  - Add content-specific field displays and formatting
  - Configure mobile-friendly responsive layouts
  - Include Portuguese labels and locale formatting
  - Display user email addresses in audit trail instead of user IDs
  - _Requirements: 9.3, 12.1, 12.4_

- [x] 8.3 Create ContractsCreateView.vue component
  - Use ContentCreateTemplate wrapper with ContentFormTemplate for rendering
  - Implement content-specific form sections for creation
  - Add creation-specific validation rules using shared validation functions
  - Configure appropriate mobile input types and form field definitions
  - Include Portuguese validation messages and labels
  - Handle form data persistence across component recreation
  - Implement multiselect dropdowns and conditional fields
  - Add dynamic configuration management for contract-specific items
  - _Requirements: 9.4, 11.1, 12.1, 12.5, 17.1, 18.1, 19.1_

- [x] 8.4 Create ContractsUpdateView.vue component
  - Use ContentFormTemplate for rendering
  - Implement content-specific form sections for editing
  - Add update-specific validation rules and disabled fields
  - Handle pre-population of existing data
  - Include Portuguese validation messages and labels
  - Support multiselect dropdowns and conditional fields
  - Support dynamic configuration management in edit mode
  - _Requirements: 9.4, 11.1, 12.1, 12.5, 18.1, 19.1_

- [ ]* 8.5 Write property tests for contratos components
  - **Property 17: Error Component Display**
  - **Property 18: Authentication Redirect**
  - **Property 19: Portuguese UI Language**
  - **Property 20: Portuguese Locale Formatting**
  - **Validates: Requirements 11.2, 11.3, 12.1-12.4**

- [x] 9. Integration and routing for contratos
- [x] 9.1 Add contracts routes to Vue Router
  - Configure 5-view pattern routes (List, Detail, Create, Update)
  - Add navigation integration
  - Update dashboard tiles for content type
  - _Requirements: 5.1, 9.5_

- [x] 9.2 Test end-to-end functionality for contratos
  - Verify complete CRUD workflows
  - Test mobile responsiveness across breakpoints
  - Validate Portuguese localization
  - Test authentication and error handling
  - Test multiselect dropdowns and conditional fields
  - Test dynamic configuration management
  - _Requirements: 11.3, 11.4, 13.5, 17.1, 18.1, 19.1_

- [ ]* 9.3 Write integration tests for contratos
  - Test complete user workflows
  - Verify mobile touch interactions
  - Test loading states and performance
  - **Property 21: Search Input Debouncing**
  - **Property 23: Loading State Provision**
  - **Validates: Requirements 13.4, 13.5**

- [x] 10. Checkpoint for contratos
- Ensure all contratos functionality works correctly
- Verify all builds pass (shared, backend, frontend packages)
- Confirm TypeScript compilation successful across all packages
- Validate Vue Router updated with contracts routes
- Test mobile-first responsive design implementation
- Verify Portuguese localization in place
- Confirm following established patterns from previous implementations

### Process for Each Content Type (Folhas de Obra Implementation)

- [x] 11. Analyze legacy components for folhas-obra
- [x] 11.1 Analyze old_src Detail view for folhas-obra
  - Read old_src/views/folhas-obra/FolhasObraDetail.vue
  - Extract data structure and display fields
  - Identify conditional logic and business rules
  - Document field relationships and formatting
  - _Requirements: 7.1, 7.2_

- [x] 11.2 Analyze old_src Form view for folhas-obra
  - Read old_src/views/folhas-obra/FolhaObraForm.vue
  - Extract form fields and input types
  - Identify validation rules and required fields
  - Document form sections and conditional fields
  - _Requirements: 7.1, 7.2_

- [x] 11.3 Create TypeScript interfaces for work-sheets
  - Extend BaseContent interface with content-specific data structure
  - Create validation schemas based on form analysis
  - Optimize data structure for new system (clean, modern design)
  - _Requirements: 7.3, 7.4, 7.5_

- [x] 12. Implement backend for work-sheets
- [x] 12.1 Create work-sheets.ts route file
  - Implement all CRUD endpoints using the generic pattern
  - Add content-specific validation logic
  - Configure content-specific sorting (by date for work-sheets)
  - Implement search index with content-specific searchable fields
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ]* 12.2 Write property tests for work-sheets API
  - **Property 15: Authentication Requirement**
  - **Property 16: Audit Trail User Recording**
  - **Property 7: Index-Storage Synchronization**
  - **Validates: Requirements 8.2, 8.3, 8.4, 10.1, 10.2**

- [x] 13. Implement frontend for work-sheets
- [x] 13.1 Create WorkSheetsListView.vue component
  - Implement content-specific display functions (getDisplayTitle, getDisplayMeta1, etc.)
  - Configure Portuguese labels for the content type
  - Add content-specific search and filter logic
  - Use mobile-first card layout with touch targets
  - _Requirements: 9.1, 9.2, 12.2, 12.3_

- [x] 13.2 Create WorkSheetsDetailView.vue component
  - Use ContentDetailTemplate with enhanced audit trail display
  - Implement content-specific sections based on legacy analysis
  - Add content-specific field displays and formatting
  - Configure mobile-friendly responsive layouts
  - Include Portuguese labels and locale formatting
  - Display user email addresses in audit trail instead of user IDs
  - _Requirements: 9.3, 12.1, 12.4_

- [x] 13.3 Create WorkSheetsCreateView.vue component
  - Use ContentCreateTemplate wrapper with ContentFormTemplate for rendering
  - Implement content-specific form sections for creation
  - Add creation-specific validation rules using shared validation functions
  - Configure appropriate mobile input types and form field definitions
  - Include Portuguese validation messages and labels
  - Handle form data persistence across component recreation
  - Implement multiselect dropdowns and conditional fields
  - Add dynamic configuration management for work-sheet-specific items
  - _Requirements: 9.4, 11.1, 12.1, 12.5, 17.1, 18.1, 19.1_

- [x] 13.4 Create WorkSheetsUpdateView.vue component
  - Use ContentFormTemplate for rendering
  - Implement content-specific form sections for editing
  - Add update-specific validation rules and disabled fields
  - Handle pre-population of existing data
  - Include Portuguese validation messages and labels
  - Support multiselect dropdowns and conditional fields
  - Support dynamic configuration management in edit mode
  - _Requirements: 9.4, 11.1, 12.1, 12.5, 18.1, 19.1_

- [ ]* 13.5 Write property tests for work-sheets components
  - **Property 17: Error Component Display**
  - **Property 18: Authentication Redirect**
  - **Property 19: Portuguese UI Language**
  - **Property 20: Portuguese Locale Formatting**
  - **Validates: Requirements 11.2, 11.3, 12.1-12.4**

- [-] 14. Integration and routing for work-sheets
- [x] 14.1 Add work-sheets routes to Vue Router
  - Configure 5-view pattern routes (List, Detail, Create, Update)
  - Add navigation integration
  - Update dashboard tiles for content type
  - _Requirements: 5.1, 9.5_

- [x] 14.2 Test end-to-end functionality for work-sheets
  - Verify complete CRUD workflows
  - Test mobile responsiveness across breakpoints
  - Validate Portuguese localization
  - Test authentication and error handling
  - Test multiselect dropdowns and conditional fields
  - Test dynamic configuration management
  - _Requirements: 11.3, 11.4, 13.5, 17.1, 18.1, 19.1_

- [ ]* 14.3 Write integration tests for work-sheets
  - Test complete user workflows
  - Verify mobile touch interactions
  - Test loading states and performance
  - **Property 21: Search Input Debouncing**
  - **Property 23: Loading State Provision**
  - **Validates: Requirements 13.4, 13.5**

- [x] 15. Checkpoint for work-sheets
- Ensure all work-sheets functionality works correctly
- Verify all builds pass (shared, backend, frontend packages)
- Confirm TypeScript compilation successful across all packages
- Validate Vue Router updated with work-sheets routes
- Test mobile-first responsive design implementation
- Verify Portuguese localization in place
- Confirm following established patterns from previous implementations

## Implementation Order

1. **Complete Phase 1** (Base Infrastructure) - Do this once
2. **Start with any content type** - Apply Phase 2 process (e.g., Clientes, Contratos, Licenças)
3. **Continue with remaining content types** as needed following the same pattern

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Phase 1 creates the foundation that all content types will use
- Phase 2 is repeated for each content type with content-specific implementations
- Each content type follows the same pattern but with unique data structures and business logic
- **Five-View Pattern**: Each content type has List, Detail, Create, Update views plus Home dashboard tile
- **Create vs Update**: Separate components allow different validation rules, field behaviors, and business logic
- Property tests validate universal correctness properties across all content types
- Focus on mobile-first design and Portuguese localization throughout
- Simple error handling without retry mechanisms
- **Multiselect Dropdowns**: Replace individual checkboxes with touch-friendly multiselect interfaces
- **Conditional Fields**: Implement dynamic field visibility based on form selections
- **Dynamic Configuration**: Support add/remove/edit functionality for complex configuration items
- **Shared Form Data**: Use `useSharedFormData` composable to handle component recreation issues
- **Enhanced Audit Trail**: Display user email addresses instead of user IDs in audit information