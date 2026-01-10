# API Response Documentation with Relations

This document describes the enhanced API response structure that includes automatic relation resolution and error handling for the CLEVER dashboard content relations system.

## Overview

All content API endpoints automatically resolve relations and include them in the response under a `relations` field. Relations are resolved at display-time, not storage-time, allowing for flexible content creation and eventual consistency.

## Enhanced Response Structure

### Base Content Response

All content responses follow this enhanced structure:

```typescript
interface ContentWithRelations<T> extends BaseContent {
  uuid: string;
  contentType: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  data: T;
  relations: Record<string, RelationResult>;
}
```

### Relation Result Types

Relations can be either successfully resolved or contain error information:

```typescript
type RelationResult = ResolvedRelation | RelationError;

interface ResolvedRelation {
  uuid: string;
  contentType: string;
  [key: string]: any; // Basic data fields from related content
}

interface RelationError {
  type: 'error';
  code: 404 | 500;
  message: string;
}
```

## API Endpoints with Relation Resolution

### GET /api/content/{type}/{uuid}

Retrieves a single content item with resolved relations.

**Example Request:**
```
GET /api/content/licenses/550e8400-e29b-41d4-a716-446655440000
```

**Example Response (Success):**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "contentType": "licenses",
  "createdAt": "2024-01-10T10:00:00Z",
  "createdBy": "user-123",
  "updatedAt": "2024-01-10T10:00:00Z",
  "updatedBy": "user-123",
  "version": 1,
  "isDeleted": false,
  "data": {
    "clientId": "client-456",
    "versao": "2024",
    "numeroSerie": "ABC123",
    "dataVencimento": "2024-12-31"
  },
  "relations": {
    "client": {
      "uuid": "client-456",
      "contentType": "clients",
      "nomeEmpresa": "Empresa ABC Lda",
      "nomeComercial": "ABC",
      "contribuinte": "123456789",
      "localidade": "Lisboa"
    }
  }
}
```

**Example Response (Client Not Found):**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "contentType": "licenses",
  "createdAt": "2024-01-10T10:00:00Z",
  "createdBy": "user-123",
  "updatedAt": "2024-01-10T10:00:00Z",
  "updatedBy": "user-123",
  "version": 1,
  "isDeleted": false,
  "data": {
    "clientId": "invalid-client-id",
    "versao": "2024",
    "numeroSerie": "ABC123",
    "dataVencimento": "2024-12-31"
  },
  "relations": {
    "client": {
      "type": "error",
      "code": 404,
      "message": "Not found"
    }
  }
}
```

**Example Response (Server Error):**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "contentType": "licenses",
  "createdAt": "2024-01-10T10:00:00Z",
  "createdBy": "user-123",
  "updatedAt": "2024-01-10T10:00:00Z",
  "updatedBy": "user-123",
  "version": 1,
  "isDeleted": false,
  "data": {
    "clientId": "client-456",
    "versao": "2024",
    "numeroSerie": "ABC123",
    "dataVencimento": "2024-12-31"
  },
  "relations": {
    "client": {
      "type": "error",
      "code": 500,
      "message": "Internal Server Error"
    }
  }
}
```

### GET /api/content/{type}

Retrieves a list of content items with resolved relations.

**Example Request:**
```
GET /api/content/licenses?page=1&limit=10
```

**Example Response:**
```json
{
  "items": [
    {
      "uuid": "license-1",
      "contentType": "licenses",
      "data": {
        "clientId": "client-456",
        "versao": "2024"
      },
      "relations": {
        "client": {
          "uuid": "client-456",
          "contentType": "clients",
          "nomeEmpresa": "Empresa ABC Lda",
          "contribuinte": "123456789"
        }
      }
    },
    {
      "uuid": "license-2",
      "contentType": "licenses",
      "data": {
        "clientId": "invalid-client",
        "versao": "2023"
      },
      "relations": {
        "client": {
          "type": "error",
          "code": 404,
          "message": "Not found"
        }
      }
    }
  ],
  "total": 25
}
```

### POST /api/content/{type}

Creates new content and returns it with resolved relations.

**Example Request:**
```
POST /api/content/licenses
Content-Type: application/json

{
  "clientId": "client-456",
  "versao": "2024",
  "numeroSerie": "XYZ789",
  "dataVencimento": "2024-12-31"
}
```

**Example Response:**
```json
{
  "uuid": "new-license-uuid",
  "contentType": "licenses",
  "createdAt": "2024-01-10T15:30:00Z",
  "createdBy": "user-123",
  "updatedAt": "2024-01-10T15:30:00Z",
  "updatedBy": "user-123",
  "version": 1,
  "isDeleted": false,
  "data": {
    "clientId": "client-456",
    "versao": "2024",
    "numeroSerie": "XYZ789",
    "dataVencimento": "2024-12-31"
  },
  "relations": {
    "client": {
      "uuid": "client-456",
      "contentType": "clients",
      "nomeEmpresa": "Empresa ABC Lda",
      "nomeComercial": "ABC",
      "contribuinte": "123456789",
      "localidade": "Lisboa"
    }
  }
}
```

### PUT /api/content/{type}/{uuid}

Updates existing content and returns it with resolved relations.

**Example Request:**
```
PUT /api/content/licenses/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "clientId": "different-client-789",
  "versao": "2024.1"
}
```

**Example Response:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "contentType": "licenses",
  "createdAt": "2024-01-10T10:00:00Z",
  "createdBy": "user-123",
  "updatedAt": "2024-01-10T16:00:00Z",
  "updatedBy": "user-456",
  "version": 2,
  "isDeleted": false,
  "data": {
    "clientId": "different-client-789",
    "versao": "2024.1",
    "numeroSerie": "ABC123",
    "dataVencimento": "2024-12-31"
  },
  "relations": {
    "client": {
      "uuid": "different-client-789",
      "contentType": "clients",
      "nomeEmpresa": "Empresa XYZ Lda",
      "nomeComercial": "XYZ",
      "contribuinte": "987654321",
      "localidade": "Porto"
    }
  }
}
```

## Supported Relations

### License Relations

- **clientId** → clients content type
  - Basic fields: nomeEmpresa, nomeComercial, contribuinte, localidade

### Contract Relations

- **clientId** → clients content type
  - Basic fields: nomeEmpresa, nomeComercial, contribuinte, localidade

### Work Sheet Relations

- **clientId** → clients content type
  - Basic fields: nomeEmpresa, nomeComercial, contribuinte, localidade

### Remote Assistance Relations

- **clientId** → clients content type
  - Basic fields: nomeEmpresa, nomeComercial, contribuinte, localidade

### Daily Records Relations

- **clientId** → clients content type
  - Basic fields: nomeEmpresa, nomeComercial, contribuinte, localidade

## Error Handling

### Error Types

1. **404 Not Found**: Referenced content does not exist
2. **500 Internal Server Error**: Network or system error during relation resolution

### Error Response Structure

```typescript
interface RelationError {
  type: 'error';
  code: 404 | 500;
  message: string;
}
```

### Error Handling Behavior

- **Partial Failures**: If one relation fails to resolve, other relations continue processing
- **Non-blocking**: Relation resolution errors do not prevent the main content from being returned
- **Structured Errors**: All errors include type, code, and message for consistent handling
- **Logging**: Relation resolution failures are logged for debugging but don't interrupt the response

## Frontend Integration

### Type Safety

Use the provided TypeScript interfaces for type-safe relation handling:

```typescript
import type { ContentWithRelations, RelationResult, ResolvedRelation, RelationError } from '@clever/shared';

// Type guard for checking if relation is resolved or error
function isRelationError(relation: RelationResult): relation is RelationError {
  return relation.type === 'error';
}

// Example usage
const license: ContentWithRelations<LicenseData> = await api.getLicense(uuid);

if (license.relations.client) {
  if (isRelationError(license.relations.client)) {
    // Handle error case
    console.error('Client not found:', license.relations.client.message);
  } else {
    // Handle success case
    console.log('Client name:', license.relations.client.nomeEmpresa);
  }
}
```

### Error Display

Display relation errors with appropriate styling and messaging:

```vue
<template>
  <div v-if="client" class="client-info">
    <div v-if="isRelationError(client)" class="error-state">
      <p class="text-red-600 bg-red-50 border border-red-200 rounded p-2">
        Cliente não encontrado
      </p>
    </div>
    <div v-else class="success-state">
      <h3>{{ client.nomeEmpresa }}</h3>
      <p>NIF: {{ client.contribuinte }}</p>
    </div>
  </div>
</template>
```

## Performance Considerations

### Sequential Resolution

Relations are resolved sequentially (one by one) for simplicity and reliability:

- **Pros**: Simple implementation, reliable error handling, no race conditions
- **Cons**: Slightly slower than parallel resolution for multiple relations
- **Trade-off**: Prioritizes reliability and maintainability over maximum performance

### No Caching

The system does not cache relation data to ensure freshness:

- **Pros**: Always returns current data, no cache invalidation complexity
- **Cons**: More API calls to resolve relations
- **Trade-off**: Prioritizes data consistency over performance optimization

### Minimal Data Transfer

Only basic fields are included in resolved relations to minimize response size:

- **Clients**: nomeEmpresa, nomeComercial, contribuinte, localidade
- **Contracts**: numeroContrato, dataInicio, dataFim
- **Other types**: Similar essential fields only

## Migration and Backward Compatibility

### Existing Content

- Content created before the relation system continues to work unchanged
- Missing relation fields result in empty relations object: `"relations": {}`
- Invalid relation IDs result in error objects in the relations field

### API Compatibility

- All existing API endpoints maintain their original functionality
- The `relations` field is additive - existing response fields are unchanged
- Clients can ignore the `relations` field if not needed

### Gradual Adoption

- Frontend components can gradually adopt relation display features
- No breaking changes to existing API contracts
- Relation resolution can be disabled per endpoint if needed (future enhancement)