# Implementation Plan: Content Relations System

## Overview

This implementation plan creates a simple content relations system that automatically detects relation fields (ending in 'Id'), resolves them in API responses, and displays the related basic data in the frontend. No complex configuration is needed - the system uses simple patterns and conventions.

## Tasks

### Phase 1: Core Relation System

- [ ] 1. Create relation detection utility
  - Implement `detectRelationFields` function to find fields ending in 'Id'
  - Create `RELATION_TYPE_MAPPING` for relation type to content type mapping
  - Add `getContentTypeFromRelation` helper function
  - Write unit tests for relation detection with various field patterns
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [ ] 2. Create basic data extraction utility
  - Implement `extractBasicFields` function with content-type specific logic
  - Add basic field definitions for clients (nomeEmpresa, nomeComercial, contribuinte, localidade)
  - Add basic field definitions for contracts (numeroContrato, dataInicio, dataFim)
  - Add fallback logic for unknown content types using common fields
  - Write unit tests for basic data extraction
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 3. Implement relation resolution utility
  - Create `resolveContentRelations` function that uses detection and extraction utilities
  - Use sequential resolution approach (resolve relations one by one for simplicity)
  - Add structured error handling for missing/invalid relations (return error objects with code and message)
  - Implement proper TypeScript interfaces for `ContentWithRelations`, `RelationResult`, `RelationError`
  - Add minimal logging for relation resolution failures
  - Write unit tests for relation resolution with success and error scenarios
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 8.1, 8.2_

### Phase 2: Backend Integration

- [ ] 4. Update ContentStorageService with relation resolution
  - Modify `getContentById` to resolve relations before returning
  - Update `getContentList` to resolve relations for all items
  - Update `createContent` to resolve relations in response
  - Update `updateContent` to resolve relations in response
  - Ensure backward compatibility with existing API clients
  - _Requirements: 2.1, 2.2, 2.3, 7.1, 7.2_

- [ ] 5. Add relation validation to content operations
  - Allow creation/update of content with relation IDs without validating referenced content exists
  - Allow null/empty relation IDs for optional relationships
  - Maintain audit trail for relation changes
  - Ensure backward compatibility with existing content
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

### Phase 3: Frontend Components

- [ ] 6. Create RelationInfoDisplay component
  - Implement reusable component for displaying relation information
  - Add responsive design for mobile and desktop (mobile-first)
  - Include proper Portuguese labels for relation types and fields
  - Handle relation errors with appropriate styling (red background for errors)
  - Handle missing relation data with "não encontrado" messages
  - Add proper TypeScript interfaces for component props including error types
  - Ensure consistent layout for same relation types across all content types
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 8.4_

- [ ] 7. Update shared types and interfaces
  - Add `ContentWithRelations`, `RelationResult`, `ResolvedRelation`, `RelationError` interfaces to shared package
  - Export relation system types and utilities
  - Update API response documentation with error handling examples
  - Ensure type safety across frontend and backend
  - _Requirements: 2.5, 7.3, 7.4, 8.1_

### Phase 4: License Implementation (Primary Example)

- [ ] 8. Implement license-client relation
  - Update license API endpoints to use relation resolution
  - Test license creation with clientId (no validation during creation)
  - Test license retrieval with resolved client data and error handling
  - Verify license updates maintain client relations
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 9. Update license views with relation display
  - Add RelationInfoDisplay component to LicensesDetailView (explicit integration)
  - Update LicensesListView to show client company name or error states
  - Update LicensesCreateView and LicensesEditView (no client validation during creation)
  - Test comprehensive license-client relationship functionality with error scenarios
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 10. Test license relation system thoroughly
  - Test with existing license data that has clientId
  - Test with licenses that have invalid/missing clientId (verify error handling)
  - Test license creation with any clientId values (no validation during creation)
  - Test license updates that change client relations
  - Verify structured error handling and user experience (404/500 error display)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

### Phase 5: Extend to Other Content Types

- [ ] 11. Implement contract-client relation
  - Apply relation system to contract content type
  - Update contract API endpoints and views
  - Test contract-client relationship functionality
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 12. Implement work-sheet-client relation
  - Apply relation system to work-sheet content type
  - Update work-sheet API endpoints and views
  - Test work-sheet-client relationship functionality
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 13. Implement remote-assistance-client relation
  - Apply relation system to remote-assistance content type
  - Update remote-assistance API endpoints and views
  - Test remote-assistance-client relationship functionality
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

### Phase 6: Performance and Polish

- [ ] 14. Add performance optimizations
  - Implement sequential relation resolution (simple approach)
  - No caching - always fetch fresh data for detail and list views
  - Add efficient relation lookups using existing indexes
  - Minimal logging - focus on simplicity over complex monitoring
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 15. Comprehensive testing and validation
  - Run integration tests across all content types with relations
  - Test relation system performance with realistic datasets
  - Verify error scenarios and recovery mechanisms
  - Test mobile responsiveness of relation display components
  - _Requirements: 7.5, 8.5_

### Phase 7: Documentation and Finalization

- [ ] 16. Create documentation and examples
  - Document relation system usage patterns
  - Create examples for adding new relation types
  - Document error handling and troubleshooting
  - Update API documentation with relation response structure
  - _Requirements: All requirements validation_

- [ ] 17. Final validation checkpoint
  - Ensure all requirements are met and tested
  - Verify system works with existing data
  - Confirm performance is acceptable
  - Get user approval for production deployment

## Notes

- Start with licenses as the primary use case to validate the approach
- Each task includes specific requirement references for traceability
- Focus on simplicity - no complex configuration or schema management
- Use existing index files for relation lookups (acceptable for this scale)
- Periodic indexing of relation data will be handled in a separate spec later
- All relation resolution happens at API response time, not storage time
- Frontend components should be mobile-first and touch-friendly
- Portuguese labels for all UI elements, English for code and types