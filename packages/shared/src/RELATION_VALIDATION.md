# Content Relations Validation System

This document describes the relation validation system implemented for the
CLEVER dashboard content management system.

## Overview

The relation validation system allows content to reference other content through
relation IDs (like `clientId`) without requiring the referenced content to exist
at creation/update time. This design enables flexible content management, bulk
imports, and eventual consistency patterns.

## Key Principles

### 1. No Referential Integrity Validation at Storage Time

**Requirement 1.1, 1.3**: Allow creation/update of content with relation IDs
without validating referenced content exists.

- Content can be created with any relation ID value (valid UUID format)
- No database-style foreign key constraints
- Enables bulk imports and data migrations
- Supports eventual consistency patterns

```typescript
// This is allowed - clientId doesn't need to reference an existing client
const license = {
  clientId: '123e4567-e89b-12d3-a456-426614174000', // May or may not exist
  versao: '2024',
  numeroSerie: 'ABC123',
};
```

### 2. Optional Relationships

**Requirement 1.4**: Allow null/empty relation IDs for optional relationships.

- All relation fields are optional by default
- Empty strings, null, and undefined values are allowed
- Content can exist without any relations

```typescript
// All of these are valid
const license1 = { versao: '2024' }; // No clientId
const license2 = { clientId: '', versao: '2024' }; // Empty clientId
const license3 = { clientId: null, versao: '2024' }; // Null clientId
const license4 = { clientId: undefined, versao: '2024' }; // Undefined clientId
```

### 3. Format Validation Only

The system validates the format of relation IDs (UUID format) but not their
existence:

```typescript
// Valid - proper UUID format
clientId: '123e4567-e89b-12d3-a456-426614174000' ✅

// Invalid - wrong format
clientId: 'invalid-format' ❌
```

### 4. Audit Trail for Relation Changes

**Requirement 1.5**: Maintain audit trail for relation changes.

- All relation field changes are logged
- Changes are tracked in the content version history
- Audit information includes old and new values

```typescript
// Example audit log entry
{
  contentType: 'licenses',
  uuid: 'license-uuid',
  relationChanges: {
    clientId: {
      from: '123e4567-e89b-12d3-a456-426614174000',
      to: '987fcdeb-51a2-43d1-9f12-123456789abc'
    }
  }
}
```

### 5. Backward Compatibility

**Requirement 1.6**: Ensure backward compatibility with existing content.

- Existing content with relation fields continues to work
- More lenient validation for existing content
- Gradual migration support

## Implementation

### Relation Field Configuration

Relations are configured in `CONTENT_RELATION_CONFIGS`:

```typescript
export const CONTENT_RELATION_CONFIGS: Record<string, RelationFieldConfig[]> = {
  licenses: [
    {
      fieldName: 'clientId',
      targetType: 'clients',
      required: false, // Optional relation
      displayName: 'Cliente',
    },
  ],
  contracts: [
    {
      fieldName: 'clientId',
      targetType: 'clients',
      required: false,
      displayName: 'Cliente',
    },
  ],
  // ... other content types
};
```

### Validation Functions

#### `validateRelationFields(contentType, data)`

Validates relation field formats without checking referential integrity:

```typescript
const errors = validateRelationFields('licenses', {
  clientId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
  versao: '2024',
});
// Returns: [] (no errors)

const errors2 = validateRelationFields('licenses', {
  clientId: 'invalid-format', // Invalid UUID
  versao: '2024',
});
// Returns: ['Cliente deve ter um formato válido de identificador']
```

#### `sanitizeRelationFields(contentType, data)`

Cleans and normalizes relation field values:

```typescript
const sanitized = sanitizeRelationFields('licenses', {
  clientId: '  123e4567-e89b-12d3-a456-426614174000  ', // Whitespace
  versao: '2024',
});
// Returns: { clientId: '123e4567-e89b-12d3-a456-426614174000', versao: '2024' }

const sanitized2 = sanitizeRelationFields('licenses', {
  clientId: '   ', // Empty after trim
  versao: '2024',
});
// Returns: { clientId: undefined, versao: '2024' }
```

#### `extractRelationChanges(contentType, oldData, newData)`

Tracks changes to relation fields for audit purposes:

```typescript
const changes = extractRelationChanges(
  'licenses',
  { clientId: 'old-uuid', versao: '2024' },
  { clientId: 'new-uuid', versao: '2024' }
);
// Returns: { clientId: { from: 'old-uuid', to: 'new-uuid' } }
```

### Integration with Existing Validation

The relation validation integrates with existing content-specific validation:

```typescript
// In license validation
export function validateLicenseCreation(data: LicenseData): string[] {
  const errors: string[] = [];

  // Validate relation fields first
  const relationErrors = validateRelationFields('licenses', data);
  errors.push(...relationErrors);

  // Then validate other license-specific fields
  // ... other validation logic

  return errors;
}
```

## API Behavior

### Content Creation

```http
POST /api/content/licenses
{
  "clientId": "123e4567-e89b-12d3-a456-426614174000",
  "versao": "2024"
}
```

- ✅ Allowed even if client doesn't exist
- ✅ Relation will be resolved at display time
- ❌ Rejected if clientId format is invalid

### Content Updates

```http
PUT /api/content/licenses/license-uuid
{
  "clientId": "987fcdeb-51a2-43d1-9f12-123456789abc"
}
```

- ✅ Allowed even if new client doesn't exist
- ✅ Relation change is logged for audit
- ❌ Rejected if clientId format is invalid

### Content Retrieval

```http
GET /api/content/licenses/license-uuid
```

Response includes resolved relations:

```json
{
  "success": true,
  "data": {
    "uuid": "license-uuid",
    "data": {
      "clientId": "123e4567-e89b-12d3-a456-426614174000",
      "versao": "2024"
    },
    "relations": {
      "client": {
        "uuid": "123e4567-e89b-12d3-a456-426614174000",
        "nomeEmpresa": "Example Company",
        "contribuinte": "123456789"
      }
    }
  }
}
```

If the client doesn't exist:

```json
{
  "relations": {
    "client": {
      "type": "error",
      "code": 404,
      "message": "Not found"
    }
  }
}
```

## Content Types with Relations

Currently supported relations:

| Content Type      | Relation Field | Target Type | Required |
| ----------------- | -------------- | ----------- | -------- |
| licenses          | clientId       | clients     | No       |
| contracts         | clientId       | clients     | No       |
| work-sheets       | clientId       | clients     | No       |
| remote-assistance | clientId       | clients     | No       |
| daily-records     | clientId       | clients     | No       |

## Benefits

1. **Flexible Data Import**: Bulk imports don't require specific ordering
2. **Eventual Consistency**: Content can be created before referenced content
3. **Migration Friendly**: Existing data continues to work during migrations
4. **Performance**: No expensive referential integrity checks during writes
5. **Audit Trail**: Complete history of relation changes
6. **Error Resilience**: System continues to work even with broken relations

## Error Handling

- **Invalid UUID Format**: Validation error at creation/update time
- **Missing Referenced Content**: Error object in relations at display time
- **Network Errors**: Error object in relations at display time
- **Malformed Data**: Sanitization handles common issues

## Testing

The system includes comprehensive tests:

- Unit tests for validation functions
- Integration tests for API endpoints
- Property-based tests for edge cases
- Backward compatibility tests

Run tests:

```bash
pnpm --filter @clever/shared test relation-validation.test.ts
pnpm --filter @clever/backend test relation-validation-integration.test.ts
```

## Future Enhancements

Potential future improvements:

1. **Relation Validation Rules**: More sophisticated validation rules per
   relation type
2. **Cascade Operations**: Optional cascade delete/update operations
3. **Relation Indexing**: Specialized indexes for relation queries
4. **Relation Analytics**: Metrics on relation usage and health
5. **Relation Constraints**: Optional referential integrity constraints for
   specific use cases
