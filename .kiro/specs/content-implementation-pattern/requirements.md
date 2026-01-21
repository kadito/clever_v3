# Requirements Document

## Introduction

This specification defines the standard implementation pattern for all content
types in the CLEVER dashboard system. This pattern will be applied consistently
across all content types (Clientes, Contratos, Licenças, Folhas de Obra, Registo
Diário, Assistências Remotas, Lembretes, Pendentes) to ensure consistency,
maintainability, and a unified user experience.

## Glossary

- **Content_Type**: A specific business entity type (e.g., clients, contracts,
  licenses)
- **BaseContent**: The foundational interface that all content types extend
- **R2_Storage**: Cloudflare R2 bucket used for JSON document storage
- **Search_Index**: JSON file maintaining searchable metadata for content items
- **Mobile_First_UI**: User interface designed primarily for mobile devices,
  then enhanced for larger screens
- **Five_View_Pattern**: Standard navigation pattern: Home → List → Detail →
  Create → Update
- **Worker**: Single Cloudflare Worker serving both frontend and backend
- **Content_Item**: Individual instance of a content type with unique UUID
- **ClientSearchInput**: Reusable component for searching and selecting clients
  across all content forms
- **Client_Relationship**: Association between content items and client records
  for business context

## Requirements

### Requirement 1: BaseContent Interface Implementation

**User Story:** As a system architect, I want all content types to follow a
consistent data structure, so that storage, retrieval, and management operations
are standardized across the system.

#### Acceptance Criteria

1. THE Content_Type SHALL extend the BaseContent interface with uuid,
   contentType, audit trail fields, and version tracking
2. WHEN a Content_Item is created, THE System SHALL generate a unique UUID and
   set initial audit trail values
3. WHEN a Content_Item is updated, THE System SHALL increment version number and
   update audit trail
4. THE Content_Type SHALL include a data field containing business-specific
   properties
5. THE System SHALL support soft delete functionality with isDeleted flag and
   deletion audit trail

### Requirement 2: R2 Storage Operations

**User Story:** As a developer, I want standardized storage operations for all
content types, so that data persistence is consistent and reliable across the
system.

#### Acceptance Criteria

1. WHEN storing a Content_Item, THE System SHALL save it to R2 using the pattern
   content/{type}/{uuid}.json
2. WHEN retrieving a Content_Item, THE System SHALL fetch it from R2 using the
   UUID-based key
3. WHEN listing Content_Items, THE System SHALL use the search index for
   efficient querying
4. WHEN a Content_Item is modified, THE System SHALL update both the individual
   file and the search index
5. THE System SHALL handle R2 storage errors gracefully and return appropriate
   error responses

### Requirement 3: Search Index Management

**User Story:** As a user, I want fast search and filtering capabilities, so
that I can quickly find the content I need without waiting for slow queries.

#### Acceptance Criteria

1. THE System SHALL maintain a search index file at indexes/{type}-index.json
   for each content type
2. WHEN a Content_Item is created, THE System SHALL add its metadata to the
   search index
3. WHEN a Content_Item is updated, THE System SHALL update its metadata in the
   search index
4. WHEN a Content_Item is soft deleted, THE System SHALL mark it as deleted in
   the search index
5. THE Search_Index SHALL contain searchable fields like title, description,
   dates, and status for efficient filtering

### Requirement 4: RESTful API Endpoints

**User Story:** As a frontend developer, I want consistent API endpoints for all
content types, so that I can build reusable components and maintain predictable
data access patterns.

#### Acceptance Criteria

1. THE System SHALL provide GET /api/content/{type} endpoint for listing items
   with search and filter support
2. THE System SHALL provide GET /api/content/{type}/{uuid} endpoint for
   retrieving individual items
3. THE System SHALL provide POST /api/content/{type} endpoint for creating new
   items
4. THE System SHALL provide PUT /api/content/{type}/{uuid} endpoint for updating
   existing items
5. THE System SHALL provide DELETE /api/content/{type}/{uuid} endpoint for soft
   deleting items
6. WHEN API endpoints receive invalid requests, THE System SHALL return
   appropriate HTTP status codes and error messages

### Requirement 5: Mobile-First Frontend Components

**User Story:** As a field worker, I want all content management interfaces to
work seamlessly on my mobile device, so that I can manage data efficiently while
on-site.

#### Acceptance Criteria

1. THE System SHALL implement the Five_View_Pattern for each content type: Home
   tile → List view → Detail view → Create form → Update form
2. WHEN displaying content lists, THE System SHALL use mobile-optimized cards
   with touch-friendly tap targets (minimum 44px)
3. WHEN showing content details, THE System SHALL use responsive layouts that
   work on screens from 320px width with responsive edit button (hidden on
   mobile, visible on desktop)
4. WHEN creating or updating content, THE System SHALL provide mobile-optimized
   forms with appropriate input types, multiselect dropdowns, conditional
   fields, and different validation rules for create vs update scenarios
5. THE System SHALL use the established color palette (#75AE93 primary, #2c3e50
   secondary) consistently across all content types

### Requirement 6: Individual Content Type Structure

**User Story:** As a developer, I want each content type to have its own
dedicated folder structure, so that content-specific logic is organized and
maintainable.

#### Acceptance Criteria

1. THE System SHALL create individual folders for each content type in
   shared/src/types/{content-type}/
2. THE System SHALL create individual API route files for each content type in
   backend/src/routes/{content-type}.ts
3. THE System SHALL create individual Vue component folders for each content
   type in frontend/src/views/{content-type}/
4. WHEN implementing a content type, THE System SHALL analyze old_src components
   to understand the content schema
5. THE System SHALL create TypeScript interfaces based on the legacy Vue
   component data structures

### Requirement 7: Schema Analysis from Legacy Code

**User Story:** As a developer, I want to understand existing content schemas
from the legacy system, so that I can maintain data compatibility and business
logic.

#### Acceptance Criteria

1. WHEN implementing a content type, THE System SHALL analyze the corresponding
   old_src Vue components
2. THE System SHALL extract data structures from legacy Detail and Form views
3. THE System SHALL create TypeScript interfaces based on the legacy data schema
   analysis
4. THE System SHALL identify required fields, validation rules, and
   relationships from legacy components
5. THE System SHALL create clean, modern data structures optimized for the new
   system

### Requirement 8: CRUD API Implementation

**User Story:** As a frontend developer, I want dedicated API endpoints for each
content type, so that I can perform all necessary data operations with proper
indexing support.

#### Acceptance Criteria

1. THE System SHALL create individual route files for each content type with
   full CRUD operations
2. WHEN creating content, THE System SHALL validate against the content-specific
   schema
3. WHEN updating content, THE System SHALL maintain search index synchronization
4. WHEN deleting content, THE System SHALL perform soft delete and update
   indexes
5. THE System SHALL implement search and filtering capabilities using the
   maintained indexes
6. WHEN listing or searching content, THE System SHALL sort clients
   alphabetically and all other content types by creation date (most recent
   first)

### Requirement 9: Mobile-First Vue Components

**User Story:** As a field worker, I want content-specific interfaces that work
perfectly on mobile devices, so that I can manage data efficiently while
on-site.

#### Acceptance Criteria

1. THE System SHALL create individual Vue component folders for each content
   type
2. WHEN implementing List views, THE System SHALL use mobile-optimized card
   layouts with touch-friendly interactions
3. WHEN implementing Detail views, THE System SHALL display information in
   mobile-friendly formats with user email display in audit trail
4. WHEN implementing Create and Update views, THE System SHALL use shared form
   data composable, JSON configuration for form sections, multiselect dropdowns,
   conditional fields, and appropriate mobile input types with different
   validation rules for each scenario
5. THE System SHALL follow the Five_View_Pattern with mobile-first responsive
   design and consistent section ordering (Services → Software → Observations)

### Requirement 10: Authentication Integration

**User Story:** As a system user, I want all content operations to be secure and
audited, so that data access is controlled and changes are traceable.

#### Acceptance Criteria

1. WHEN accessing any content endpoint, THE System SHALL require valid Clerk
   authentication
2. WHEN creating or updating content, THE System SHALL record the authenticated
   user in audit trail fields
3. THE System SHALL include user information in createdBy and updatedBy fields
   using Clerk user data
4. WHEN authentication fails, THE System SHALL return 401 Unauthorized responses
5. THE System SHALL validate user permissions for content operations (Phase 2
   requirement)

### Requirement 11: Simple Error Handling

**User Story:** As a user, I want clear feedback when operations fail, so that I
can understand what went wrong and take appropriate action.

#### Acceptance Criteria

1. WHEN content validation fails, THE System SHALL return detailed error
   messages with field-specific feedback
2. WHEN API requests fail, THE Vue App SHALL display the error using an Error
   component
3. WHEN API requests return 401 Unauthorized, THE System SHALL redirect to the
   sign-in page
4. WHEN R2 operations fail, THE System SHALL display the error message without
   retry attempts
5. THE System SHALL validate required fields and data types before attempting
   storage operations

### Requirement 12: Portuguese UI Labels

**User Story:** As a Portuguese user, I want all user interface elements to be
in Portuguese, so that the system is accessible and intuitive for local users.

#### Acceptance Criteria

1. THE System SHALL display all UI labels, buttons, and messages in Portuguese
   (Portugal variant)
2. WHEN showing content type names, THE System SHALL use Portuguese labels
   (Clientes, Contratos, etc.)
3. THE System SHALL maintain English code identifiers while displaying
   Portuguese labels to users
4. WHEN displaying dates and numbers, THE System SHALL use Portuguese locale
   formatting
5. THE System SHALL provide Portuguese error messages and validation feedback

### Requirement 13: Enhanced Form Field Support

**User Story:** As a user, I want comprehensive form field types including
multiselect dropdowns and conditional fields, so that I can efficiently
configure complex data relationships.

#### Acceptance Criteria

1. THE System SHALL support multiselect dropdown fields with touch-friendly
   interface and tag-based selection display
2. WHEN using multiselect fields, THE System SHALL provide click-outside
   closing, individual item removal, and proper mobile optimization
3. THE System SHALL support conditional fields that show/hide based on other
   field values
4. WHEN implementing conditional fields, THE System SHALL use proper dependency
   tracking and dynamic visibility updates
5. THE System SHALL maintain all form sections in JSON configuration files for
   better maintainability

### Requirement 14: Dynamic Configuration Management

**User Story:** As a user, I want comprehensive configuration options for
content-specific features, so that I can properly track all relevant
information.

#### Acceptance Criteria

1. THE System SHALL support dynamic addition and removal of configuration items
2. WHEN configuring items, THE System SHALL provide type-specific suboptions and
   conditional fields
3. THE System SHALL implement edit mode for individual configurations with
   proper validation
4. WHEN managing configurations, THE System SHALL use mobile-optimized cards
   with touch-friendly controls
5. THE System SHALL maintain backward compatibility with existing data
   structures

### Requirement 15: Section Ordering Standards

**User Story:** As a user, I want consistent section ordering across all content
types, so that I can efficiently navigate and understand the interface.

#### Acceptance Criteria

1. THE System SHALL implement standard section ordering: Basic → Contact →
   Address → Financial → Services → Configuration → Observations
2. WHEN displaying content, THE System SHALL ensure Observations is always the
   last section
3. THE System SHALL maintain consistent ordering between Create, Update, and
   Detail views
4. WHEN implementing new content types, THE System SHALL follow the established
   section ordering pattern
5. THE System SHALL use Services section before Configuration section in all
   views

### Requirement 16: Performance Optimization

**User Story:** As a mobile user with limited bandwidth, I want the system to
load quickly and work efficiently, so that I can be productive even with slower
connections.

#### Acceptance Criteria

1. WHEN loading content lists, THE System SHALL implement pagination or virtual
   scrolling for large datasets
2. WHEN displaying content, THE System SHALL lazy load non-critical data and
   images
3. THE System SHALL cache frequently accessed data using appropriate browser
   caching strategies
4. WHEN searching content, THE System SHALL debounce search inputs to avoid
   excessive API calls
5. THE System SHALL provide loading states and skeleton screens for better
   perceived performance

### Requirement 17: Shared Form Data Management

**User Story:** As a developer, I want form data to persist across component
recreation, so that users don't lose their input when navigating or when Vue
components are recreated.

#### Acceptance Criteria

1. THE System SHALL use a shared form data composable (`useSharedFormData`) to
   handle Vue component recreation issues
2. WHEN form components are recreated, THE System SHALL maintain form data
   persistence
3. THE System SHALL provide proper initialization of form data with all field
   keys from form sections
4. WHEN updating field values, THE System SHALL clear validation errors for the
   updated field
5. THE System SHALL provide methods to clear form data when navigation is
   complete

### Requirement 18: Multiselect Dropdown Implementation

**User Story:** As a user, I want touch-friendly multiselect dropdowns instead
of individual checkboxes, so that I can efficiently select multiple options on
mobile devices.

#### Acceptance Criteria

1. THE System SHALL implement multiselect dropdowns with tag-based selection
   display
2. WHEN using multiselect fields, THE System SHALL provide click-outside closing
   functionality
3. THE System SHALL allow individual item removal from selected tags
4. WHEN interacting with multiselect on mobile, THE System SHALL provide proper
   touch targets (minimum 44px)
5. THE System SHALL maintain backward compatibility with individual boolean
   flags for existing data structures

### Requirement 19: Conditional Field Support

**User Story:** As a user, I want form fields to appear dynamically based on my
selections, so that I only see relevant configuration options.

#### Acceptance Criteria

1. THE System SHALL support conditional fields that show/hide based on other
   field values
2. WHEN implementing conditional fields, THE System SHALL use proper dependency
   tracking
3. THE System SHALL provide dynamic visibility updates when dependent field
   values change
4. WHEN conditional fields are hidden, THE System SHALL not validate their
   values
5. THE System SHALL maintain conditional field configuration in JSON form
   sections

### Requirement 20: Enhanced Audit Trail Display

**User Story:** As a user, I want to see user email addresses in audit trails
instead of user IDs, so that I can easily identify who made changes.

#### Acceptance Criteria

1. THE System SHALL display user email addresses in audit trail instead of user
   IDs
2. WHEN showing audit information, THE System SHALL identify the current user
   and display their email
3. THE System SHALL provide fallback handling for system actions (display
   "Sistema")
4. WHEN user email is not available, THE System SHALL fall back to displaying
   the user ID
5. THE System SHALL use the `useAuth()` composable to access current user
   information

### Requirement 21: Client Search Integration

**User Story:** As a user creating content that relates to clients, I want a
consistent and efficient way to search and select clients across all content
forms, so that I can quickly associate content with the correct client and see
their basic information.

#### Acceptance Criteria

1. THE System SHALL provide a ClientSearchInput component that can be reused
   across all content types that relate to clients
2. WHEN a user types in the ClientSearchInput, THE System SHALL trigger a
   debounced search request after 300ms of inactivity
3. WHEN the ClientSearchInput receives focus, THE System SHALL make an initial
   search request even without text input to show recent clients
4. WHEN search results are returned, THE System SHALL display client basic
   information including company name, commercial name, tax number, and location
5. WHEN a client is selected, THE System SHALL display the client's detailed
   information including contact details in a dedicated section
6. THE ClientSearchInput SHALL work seamlessly on mobile devices with
   touch-friendly interactions and proper responsive design
7. WHEN used in readonly or disabled mode, THE System SHALL display the selected
   client's information without allowing changes
8. THE System SHALL emit both the client UUID and full client object when a
   selection is made for form integration
9. WHEN no search results are found, THE System SHALL display appropriate
   Portuguese feedback messages
10. THE System SHALL handle loading states with visual indicators during search
    operations
