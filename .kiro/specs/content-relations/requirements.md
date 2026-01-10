# Requirements Document

## Introduction

This specification defines a simple content relations system for the CLEVER dashboard. Content can reference other content by storing relation IDs. The system automatically resolves these relations in API responses (GET, POST, PUT) by fetching the related content and including it in the response. No complex indexing synchronization is needed - a periodic cron job will handle index updates.

## Glossary

- **Content_Relation**: A reference from one content item to another using a relation ID field
- **Relation_ID**: The UUID stored in content data that references another content item (e.g., `clientId`)
- **Resolved_Relation**: Complete related content data included in API responses
- **Relation_Resolution**: The process of fetching related content when serving API responses
- **Related_Content**: The complete content item that is referenced by a relation ID
- **Periodic_Indexing**: A cron job that updates search indexes with relation data periodically

## Requirements

### Requirement 1: Simple Relation Storage

**User Story:** As a developer, I want to store references to other content using simple ID fields, so that I can establish relationships without any schema configuration.

#### Acceptance Criteria

1. WHEN creating content with relations, THE System SHALL store only the relation ID (e.g., `clientId`) in the content data
2. THE System SHALL support relation fields like `clientId` without requiring any configuration
3. WHEN a relation ID is provided, THE System SHALL allow creation without validating the referenced content exists
4. THE System SHALL allow null/empty relation IDs for optional relationships
5. THE System SHALL maintain backward compatibility with existing content that has relation ID fields

### Requirement 2: Automatic Relation Resolution in API Responses

**User Story:** As a frontend developer, I want all API responses to automatically include resolved relation data, so that I have complete information without making additional API calls.

#### Acceptance Criteria

1. WHEN retrieving content via GET requests, THE System SHALL automatically resolve relation IDs and include the related content in the response
2. WHEN creating content via POST requests, THE System SHALL resolve relations for the newly created content and return them in the response
3. WHEN updating content via PUT requests, THE System SHALL resolve relations for the updated content and return them in the response
4. THE System SHALL include resolved relations under a `relations` field in the API response
5. WHEN a relation ID references non-existent content, THE System SHALL include structured error information with code 404 and "Not found" message

### Requirement 3: Simple Relation Resolution Logic

**User Story:** As a developer, I want a straightforward way to resolve relations without any configuration, so that I can easily add new relation types.

#### Acceptance Criteria

1. THE System SHALL recognize relation field patterns (fields ending in `Id` like `clientId`)
2. WHEN resolving relations, THE System SHALL fetch the related content by UUID and include only basic data fields
3. THE System SHALL include only essential basic information from related content (company name, tax number, key identifiers)
4. WHEN relation resolution fails, THE System SHALL continue processing and return `null` for that relation
5. THE System SHALL automatically determine basic fields without requiring configuration

### Requirement 4: Basic Data Only Resolution

**User Story:** As a user, I want to see only essential basic information from related content, so that the interface remains clean and focused.

#### Acceptance Criteria

1. WHEN resolving client relations, THE System SHALL include only basic data: company name, commercial name, tax number, location
2. WHEN resolving contract relations, THE System SHALL include only basic data: contract number, start date, end date
3. THE System SHALL not include detailed or sensitive information from related content
4. THE System SHALL use a consistent set of basic fields across all content types
5. THE System SHALL automatically determine basic fields based on content type without configuration

### Requirement 5: Content Type Relation Examples

**User Story:** As a developer, I want clear examples of which content types have relations, so that I can implement the correct relationships.

#### Acceptance Criteria

1. THE System SHALL support License content with `clientId` relation to Client content
2. THE System SHALL support Contract content with `clientId` relation to Client content  
3. THE System SHALL support Work Sheet content with `clientId` relation to Client content
4. THE System SHALL support Remote Assistance content with `clientId` relation to Client content
5. THE System SHALL handle all these relations using the same simple pattern without configuration

### Requirement 6: Frontend Relation Display

**User Story:** As a user viewing content, I want to see basic information from related content displayed clearly, so that I have context about relationships.

#### Acceptance Criteria

1. WHEN displaying content details, THE System SHALL show resolved relation information in dedicated sections
2. THE System SHALL display only basic fields from related content (company name, tax number, key identifiers)
3. WHEN displaying content lists, THE System SHALL show key related content information alongside main content
4. THE System SHALL provide consistent relation information display across all content types
5. WHEN related content is not available, THE System SHALL show appropriate placeholder messages

### Requirement 7: Performance and Simplicity

**User Story:** As a user, I want the relation system to be fast and simple, so that it doesn't slow down the application or add unnecessary complexity.

#### Acceptance Criteria

1. THE System SHALL resolve relations efficiently by batching requests when possible
2. THE System SHALL avoid complex real-time index synchronization to maintain simplicity
3. WHEN resolving multiple relations, THE System SHALL minimize the number of API calls
4. THE System SHALL provide reasonable performance even with multiple relations per content item
5. THE System SHALL use simple, maintainable code patterns that are easy to understand and extend

### Requirement 8: Error Handling and Fallbacks

**User Story:** As a user, I want the system to handle missing or invalid relations gracefully, so that I can still access content even when related data is unavailable.

#### Acceptance Criteria

1. WHEN a relation ID references non-existent content, THE System SHALL return structured error information with code 404 and "Not found" message
2. WHEN relation resolution fails due to network issues, THE System SHALL return structured error information with code 500 and "Internal Server Error" message
3. THE System SHALL continue processing other relations even when one relation resolution fails
4. WHEN displaying content with relation errors, THE System SHALL show appropriate error messages with distinct styling
5. THE System SHALL allow users to update relation IDs even when the original related content is missing