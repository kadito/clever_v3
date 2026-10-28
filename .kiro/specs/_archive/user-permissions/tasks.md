# Implementation Plan: User Permissions System

## Overview

This implementation plan breaks down the user permissions system into discrete coding tasks. The approach follows a bottom-up strategy: shared utilities first, then backend protection, then frontend integration. This ensures the core permission logic is solid before integrating it into UI components.

## Tasks

- [x] 1. Create shared permission utilities
  - Create `packages/shared/src/permissions.ts` with core permission functions
  - Implement `UserType` type and `Permissions` interface
  - Implement `isAdmin()`, `canDelete()`, `canViewAuditTrail()`, and `getPermissions()` functions
  - Export all types and functions from shared package index
  - _Requirements: 1.2, 1.3, 4.1, 4.2, 4.3_

- [ ]* 1.1 Write property tests for shared permission utilities
  - **Property 1: Admin Full Access** - For any user with userType 'Admin', getPermissions() should return all permissions as true
  - **Property 2: User Restricted Access** - For any user with userType 'User', canDelete and canViewAuditTrail should return false
  - **Property 6: Unauthenticated User Denial** - For any null userType, all permission functions should return false
  - _Requirements: 1.2, 1.3, 4.5_

- [x] 2. Implement backend delete permission middleware
  - Create `packages/backend/src/middleware/permissions.ts`
  - Implement `requireDeletePermission` middleware function
  - Extract userType from userContext set by authentication middleware
  - Return 403 Forbidden with Portuguese error message for User role
  - Log permission denials with user and request details
  - Allow Admin users to proceed to delete handler
  - _Requirements: 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 2.1 Write property tests for backend middleware
  - **Property 4: Backend Delete Permission Enforcement** - For any DELETE request with User role, middleware should return 403
  - Test middleware with Admin role allows request to proceed
  - Test middleware with missing userContext returns 401
  - _Requirements: 2.4, 2.5, 5.1_

- [x] 3. Integrate middleware with DELETE endpoints
  - Import `requireDeletePermission` middleware in `packages/backend/src/routes/content.ts`
  - Apply middleware to all DELETE /api/content/:type/:uuid endpoints
  - Ensure middleware runs after authentication middleware
  - Verify existing delete logic remains unchanged
  - _Requirements: 5.2, 5.4, 8.1, 8.3_

- [x] 4. Create frontend usePermissions composable
  - Create `packages/frontend/src/composables/usePermissions.ts`
  - Import shared permission utilities from @clever/shared
  - Import useAuth composable for authentication state
  - Implement computed userType from authenticated user
  - Implement computed permissions using getPermissions()
  - Return userType, permissions, and isAuthenticated
  - _Requirements: 1.2, 1.3, 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 6.4_

- [ ]* 4.1 Write property tests for usePermissions composable
  - **Property 7: Reactive Permission Updates** - For any authentication state change, permissions should update reactively
  - **Property 8: Permission Check Performance** - For any permission check, execution should complete in less than 10ms
  - Test composable with various user contexts
  - _Requirements: 6.3, 9.1_

- [x] 5. Update ContentDetailTemplate for delete button permissions
  - Import usePermissions composable in `packages/frontend/src/components/templates/ContentDetailTemplate.vue`
  - Extract permissions from usePermissions()
  - Create computed `shouldShowDeleteButton` combining showDeleteButton prop with permissions.canDelete
  - Update delete button v-if directives to use shouldShowDeleteButton
  - Apply to both desktop and mobile delete buttons
  - _Requirements: 2.1, 2.2, 2.3, 6.1, 6.2_

- [ ]* 5.1 Write property tests for ContentDetailTemplate permissions
  - **Property 3: Delete Button Visibility by Role** - For any content type, delete button should be visible only for Admin users
  - Test with Admin user shows delete button
  - Test with User role hides delete button
  - Test with unauthenticated user hides delete button
  - _Requirements: 2.1, 2.2_

- [x] 6. Update ClientsDetailView for audit trail permissions
  - Import usePermissions composable in `packages/frontend/src/views/clients/ClientsDetailView.vue`
  - Extract permissions from usePermissions()
  - Add v-if="permissions.canViewAuditTrail" to Histórico section
  - Verify section is completely removed from DOM for User role
  - _Requirements: 3.1, 3.2, 6.1_

- [x] 7. Update ContractsDetailView for audit trail permissions
  - Import usePermissions composable in `packages/frontend/src/views/contracts/ContractsDetailView.vue`
  - Extract permissions from usePermissions()
  - Add v-if="permissions.canViewAuditTrail" to Histórico section
  - Verify section is completely removed from DOM for User role
  - _Requirements: 3.1, 3.2, 6.1_

- [x] 8. Update LicensesDetailView for audit trail permissions
  - Import usePermissions composable in `packages/frontend/src/views/licenses/LicensesDetailView.vue`
  - Extract permissions from usePermissions()
  - Add v-if="permissions.canViewAuditTrail" to Histórico section
  - Verify section is completely removed from DOM for User role
  - _Requirements: 3.1, 3.2, 6.1_

- [x] 9. Update WorkSheetsDetailView for audit trail permissions
  - Import usePermissions composable in `packages/frontend/src/views/work-sheets/WorkSheetsDetailView.vue`
  - Extract permissions from usePermissions()
  - Add v-if="permissions.canViewAuditTrail" to Histórico section
  - Verify section is completely removed from DOM for User role
  - _Requirements: 3.1, 3.2, 6.1_

- [x] 10. Update DailyRecordsDetailView for audit trail permissions
  - Import usePermissions composable in `packages/frontend/src/views/daily-records/DailyRecordsDetailView.vue`
  - Extract permissions from usePermissions()
  - Add v-if="permissions.canViewAuditTrail" to Histórico section
  - Verify section is completely removed from DOM for User role
  - _Requirements: 3.1, 3.2, 6.1_

- [x] 11. Update RemoteAssistanceDetailView for audit trail permissions
  - Import usePermissions composable in `packages/frontend/src/views/remote-assistance/RemoteAssistanceDetailView.vue`
  - Extract permissions from usePermissions()
  - Add v-if="permissions.canViewAuditTrail" to Histórico section
  - Verify section is completely removed from DOM for User role
  - _Requirements: 3.1, 3.2, 6.1_

- [x] 12. Update RemindersDetailView for audit trail permissions
  - Import usePermissions composable in `packages/frontend/src/views/reminders/RemindersDetailView.vue`
  - Extract permissions from usePermissions()
  - Add v-if="permissions.canViewAuditTrail" to Histórico section
  - Verify section is completely removed from DOM for User role
  - _Requirements: 3.1, 3.2, 6.1_

- [x] 13. Update PendingDetailView for audit trail permissions
  - Import usePermissions composable in `packages/frontend/src/views/pending/PendingDetailView.vue`
  - Extract permissions from usePermissions()
  - Add v-if="permissions.canViewAuditTrail" to Histórico section
  - Verify section is completely removed from DOM for User role
  - _Requirements: 3.1, 3.2, 6.1_

- [ ]* 13.1 Write property tests for audit trail visibility
  - **Property 5: Audit Trail Visibility by Role** - For any content type detail view, Histórico section should be visible only for Admin users
  - Test across all content types (clients, contracts, licenses, work sheets, daily records, remote assistance, reminders, pending)
  - Test with Admin user shows Histórico section
  - Test with User role hides Histórico section
  - _Requirements: 3.1, 3.2, 7.1, 7.2_

- [x] 14. Checkpoint - Verify all tests pass and permissions work correctly
  - Run all unit tests and property tests
  - Manually test with Admin user account (can delete, can see Histórico)
  - Manually test with User role account (cannot delete, cannot see Histórico)
  - Test on mobile and desktop viewports
  - Verify no console errors
  - Verify Portuguese error messages display correctly
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Shared utilities are implemented first to ensure consistency between frontend and backend
- Backend protection is added before frontend integration for security
- Detail views are updated one at a time for incremental testing
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All permission checks use shared utilities from @clever/shared package
- Backend middleware protects DELETE endpoints at API level
- Frontend composable provides reactive permission checks for UI
