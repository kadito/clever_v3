# Design Document: Content Relations System

## Overview

This design implements a generic content relations system for the CLEVER
dashboard. Content types can define relationships to other content types with
configurable cardinality (one-to-one, one-to-many, many-to-one). The system
automatically resolves relationships in all API responses (GET, POST, PUT) and
indexes related data for efficient searching, while storing only relation IDs in
the actual content files.

## Architecture

### Relation Schema Configuration

Relations are defined through a configuration schema that specifies the
relationship rules, cardinality, and which fields to index.

```typescript
// Relation schema configuration
interface RelationSchema {
  sourceType: string; // e.g., "licenses"
  targetType: string; // e.g., "clients"
  relationField: string; // e.g., "clientId"
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  indexFields: string[]; // Fields from target to include in search index
  displayFields: string[]; // Fields to show in UI
}

// Example relation configurations
const RELATION_SCHEMAS: RelationSchema[] = [
  {
    sourceType: 'licenses',
    targetType: 'clients',
    relationField: 'clientId',
    cardinality: 'many-to-one',
    indexFields: ['nomeEmpresa', 'nomeComercial', 'contribuinte', 'localidade'],
    displayFields: [
      'nomeEmpresa',
      'nomeComercial',
      'contribuinte',
      'telefoneContato',
      'emailContato',
    ],
  },
  {
    sourceType: 'clients',
    targetType: 'contracts',
    relationField: 'contractId',
    cardinality: 'one-to-one',
    indexFields: ['numeroContrato', 'dataInicio', 'dataFim'],
    displayFields: ['numeroContrato', 'dataInicio', 'dataFim', 'valor'],
  },
  {
    sourceType: 'work-sheets',
    targetType: 'clients',
    relationField: 'clientId',
    cardinality: 'many-to-one',
    indexFields: ['nomeEmpresa', 'contribuinte'],
    displayFields: ['nomeEmpresa', 'nomeComercial', 'telefoneContato'],
  },
];
```

### Generic Relation Resolution System

The system provides utilities that work with any content type and relation
configuration.

```typescript
// Generic relation resolution utility
async function resolveContentRelations<T>(
  content: BaseContent & { data: T },
  relationSchemas: RelationSchema[]
): Promise<ContentWithRelations<T>> {
  const relations: Record<string, any> = {};

  // Find all relations for this content type
  const contentRelations = relationSchemas.filter(
    schema => schema.sourceType === content.contentType
  );

  for (const relation of contentRelations) {
    const relationId = (content.data as any)[relation.relationField];

    if (relationId) {
      try {
        const relatedContent = await getContentById(
          relation.targetType,
          relationId
        );
        if (relatedContent) {
          // Extract only the fields specified in displayFields
          const displayData = extractFields(
            relatedContent.data,
            relation.displayFields
          );
          relations[relation.relationField.replace('Id', '')] = {
            uuid: relatedContent.uuid,
            ...displayData,
          };
        } else {
          relations[relation.relationField.replace('Id', '')] = null;
        }
      } catch (error) {
        console.warn(
          `Failed to resolve relation ${relation.relationField}:`,
          error
        );
        relations[relation.relationField.replace('Id', '')] = null;
      }
    } else {
      relations[relation.relationField.replace('Id', '')] = null;
    }
  }

  return { ...content, relations };
}

// Enhanced API response structure
interface ContentWithRelations<T> extends BaseContent {
  data: T;
  relations: Record<string, any>;
}
```

### Relation Data Indexing System

When content is created or updated, the system automatically indexes related
content data for efficient searching.

```typescript
// Generic relation indexing utility
async function indexContentWithRelations<T>(
  content: BaseContent & { data: T },
  relationSchemas: RelationSchema[]
): Promise<ContentIndexRecord> {
  const relationData: Record<string, any> = {};
  let searchableText = generateBaseSearchableText(content);

  // Find all relations for this content type
  const contentRelations = relationSchemas.filter(
    schema => schema.sourceType === content.contentType
  );

  for (const relation of contentRelations) {
    const relationId = (content.data as any)[relation.relationField];

    if (relationId) {
      try {
        const relatedContent = await getContentById(
          relation.targetType,
          relationId
        );
        if (relatedContent) {
          // Extract fields specified in indexFields
          const indexData = extractFields(
            relatedContent.data,
            relation.indexFields
          );
          relationData[relation.relationField.replace('Id', 'Data')] = {
            id: relatedContent.uuid,
            ...indexData,
          };

          // Add related content fields to searchable text
          const relatedSearchText = Object.values(indexData)
            .filter(value => typeof value === 'string')
            .join(' ')
            .toLowerCase();
          searchableText += ' ' + relatedSearchText;
        }
      } catch (error) {
        console.warn(
          `Failed to index relation ${relation.relationField}:`,
          error
        );
      }
    }
  }

  return {
    uuid: content.uuid,
    contentType: content.contentType,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
    isDeleted: content.isDeleted,
    searchableText: searchableText.trim(),
    relationData,
  };
}

// Enhanced index record structure
interface ContentIndexRecord {
  uuid: string;
  contentType: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  searchableText: string;
  relationData: Record<string, any>;
}
```

## Components and Interfaces

### Backend Components

#### 1. Client Resolution Utility (`resolveClientData`)

- **Purpose**: Fetch and attach client data to content items
- **Input**: Content item with potential `clientId`
- **Output**: Content item with resolved `client` field
- **Error Handling**: Returns `client: null` on resolution failure

#### 2. Batch Client Resolution (`resolveMultipleClients`)

- **Purpose**: Efficiently resolve clients for multiple content items
- **Input**: Array of content items
- **Output**: Array of content items with resolved client data
- **Optimization**: Batches client requests to avoid N+1 queries

#### 3. Enhanced API Endpoints

- **GET /api/content/{type}/{uuid}**: Returns content with resolved client
- **GET /api/content/{type}**: Returns list with resolved clients
- **Caching**: Implements client data caching for performance

### Frontend Components

#### 1. ClientInfoDisplay Component

```vue
<template>
  <div v-if="client" class="client-info-section">
    <div class="bg-white rounded-touch border border-gray-200">
      <div
        class="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-touch"
      >
        <h3 class="text-lg font-semibold text-gray-900">
          Informação do Cliente
        </h3>
      </div>
      <div class="p-4">
        <div class="detail-grid">
          <div class="detail-item">
            <label class="detail-label">Nome da Empresa</label>
            <div class="detail-value">{{ client.data.nomeEmpresa }}</div>
          </div>
          <div v-if="client.data.nomeComercial" class="detail-item">
            <label class="detail-label">Nome Comercial</label>
            <div class="detail-value">{{ client.data.nomeComercial }}</div>
          </div>
          <div v-if="client.data.contribuinte" class="detail-item">
            <label class="detail-label">NIF</label>
            <div class="detail-value">{{ client.data.contribuinte }}</div>
          </div>
          <!-- Additional client fields -->
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="showMissingClient" class="client-info-section">
    <div class="bg-yellow-50 border border-yellow-200 rounded-touch p-4">
      <p class="text-yellow-800">Cliente não encontrado</p>
    </div>
  </div>
</template>
```

#### 2. Enhanced Detail Views

All content detail views will be updated to include the ClientInfoDisplay
component when client data is available.

#### 3. Enhanced List Views

List views will display client company names alongside content information.

## Data Models

### Enhanced Content Response

```typescript
interface ContentWithClient<T> extends BaseContent {
  data: T;
  client?: Client | null;
}

interface LicenseWithClient extends ContentWithClient<LicenseData> {}
interface ContractWithClient extends ContentWithClient<ContractData> {}
// ... other content types
```

### Client Resolution Cache

```typescript
interface ClientCache {
  [clientId: string]: {
    client: Client | null;
    timestamp: number;
    ttl: number;
  };
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all
valid executions of a system-essentially, a formal statement about what the
system should do. Properties serve as the bridge between human-readable
specifications and machine-verifiable correctness guarantees._

### Property 1: Client Resolution Consistency

_For any_ content item with a valid `clientId`, resolving client data should
always return the same client information for the same `clientId` within the
cache TTL period. **Validates: Requirements 1.1, 1.2**

### Property 2: Null Client Handling

_For any_ content item without a `clientId` or with an invalid `clientId`, the
resolved client field should always be `null`. **Validates: Requirements 1.3,
5.1**

### Property 3: Backward Compatibility

_For any_ existing API client, the enhanced response structure should maintain
all existing fields while adding the new `client` field. **Validates:
Requirements 1.5, 7.4**

### Property 4: Batch Resolution Efficiency

_For any_ list of content items requiring client resolution, the number of
client API calls should not exceed the number of unique client IDs. **Validates:
Requirements 2.5, 6.2**

### Property 5: Client Name Synchronization

_For any_ content item with resolved client data, the `clientName` field in the
content data should match the client's company name. **Validates: Requirements
1.4, 7.5**

### Property 6: Error Isolation

_For any_ batch client resolution operation, failure to resolve one client
should not prevent resolution of other clients in the same batch. **Validates:
Requirements 2.4, 5.3**

### Property 7: Cache Consistency

_For any_ client data in cache, the cached data should be identical to the data
that would be retrieved from the primary storage within the TTL period.
**Validates: Requirements 6.1, 6.3**

### Property 8: Mobile Display Responsiveness

_For any_ client information display component, the layout should adapt
appropriately to screen sizes from 320px to 1280px width. **Validates:
Requirements 9.1, 9.3**

## Error Handling

### Client Resolution Failures

- **Missing Client**: Return `client: null`, display "Cliente não encontrado"
- **Network Errors**: Return `client: null`, use cached `clientName` if
  available
- **Timeout**: Return `client: null`, log error for debugging
- **Invalid Client ID**: Return `client: null`, continue processing

### Batch Resolution Failures

- **Partial Failures**: Continue processing successful resolutions
- **Complete Failure**: Return all items with `client: null`
- **Rate Limiting**: Implement exponential backoff for retries

### Frontend Error Handling

- **Missing Client Data**: Show placeholder or "not found" message
- **Loading Failures**: Display cached client name if available
- **Network Issues**: Provide retry mechanism for critical operations

## Testing Strategy

### Unit Tests

- Test client resolution utility with various input scenarios
- Test batch resolution with mixed valid/invalid client IDs
- Test cache behavior with TTL expiration
- Test error handling for network failures
- Test frontend component rendering with/without client data

### Property-Based Tests

- **Property 1**: Generate random content items with client IDs, verify
  consistent resolution
- **Property 2**: Generate content items without client IDs, verify null client
  handling
- **Property 3**: Test API response structure compatibility with existing
  clients
- **Property 4**: Generate batches of content items, verify efficient client
  resolution
- **Property 5**: Test client name synchronization across different scenarios
- **Property 6**: Test error isolation in batch operations
- **Property 7**: Test cache consistency with various TTL scenarios
- **Property 8**: Test responsive display across different screen sizes

Each property test should run a minimum of 100 iterations and be tagged with:
**Feature: client-data-resolution, Property {number}: {property_text}**

### Integration Tests

- Test end-to-end client resolution in license detail views
- Test client resolution in content list views
- Test client resolution in edit forms
- Test performance with large datasets
- Test mobile responsiveness across different devices

## Performance Considerations

### Caching Strategy

- **Client Data Cache**: 5-minute TTL for individual client records
- **Batch Resolution Cache**: Cache resolved client sets for list views
- **Browser Caching**: Appropriate cache headers for client data responses

### Optimization Techniques

- **Request Batching**: Group multiple client requests into single API calls
- **Lazy Loading**: Load client data only when needed for detail views
- **Prefetching**: Preload client data for likely navigation paths
- **Debouncing**: Debounce client search requests in forms

### Monitoring

- Track client resolution success/failure rates
- Monitor client resolution response times
- Alert on excessive client resolution failures
- Track cache hit/miss ratios for optimization
