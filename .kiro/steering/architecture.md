# System Architecture

## Overview

CLEVER is an internal dashboard using unified Cloudflare Worker deployment.
Single Worker serves both Vue SPA and API endpoints, with KV for static assets
and R2 for JSON document storage.

## Technology Stack

### Build System & Package Management

- **pnpm workspaces** with TypeScript project references
- **Node.js** >=18.0.0 required
- **pnpm** >=8.0.0 required for improved performance and disk efficiency
- **Benefits of pnpm**:
  - ~40% reduction in node_modules size through hard linking
  - ~50% faster installs compared to npm
  - Strict dependency management prevents phantom dependencies
  - Content-addressable storage with intelligent hoisting

### Unified Deployment

- **Single Cloudflare Worker** serving both frontend and backend
- **Vue 3 static files** stored in Cloudflare KV
- **KV binding** via [assets] in wrangler.toml
- **Route handling**:
  - API routes (`/api/*`) → Backend handlers
  - All other routes → Vue SPA (with 404 handling)

### Frontend

- **Vue 3** with Composition API
- **TailwindCSS** for styling with mobile-first responsive design
- **TypeScript** strict mode
- **Pinia** for state management
- **Vue Router** for navigation with dashboard-centric routing
- **Mobile-First Design**: Optimized for mobile devices with responsive
  breakpoints
- **Color Palette**: Based on old_src (#75AE93 primary, #2c3e50 secondary)
- **5-View Pattern**: Home (dashboard) → List (search) → Detail → Create →
  Update for all content types (separate Create/Update components)

### Form Architecture

- **Shared Form Data**: Use `useSharedFormData` composable to handle Vue
  component recreation issues
- **Component Split**: `ContentFormTemplate.vue` (core rendering) +
  `ContentCreateTemplate.vue` (wrapper)
- **Data Persistence**: Form data persists across component recreation during
  navigation
- **Multiselect Dropdowns**: Replace individual checkboxes with touch-friendly
  multiselect interfaces
- **Conditional Fields**: Dynamic field visibility based on form selections via
  JSON configuration
- **Dynamic Configuration**: Add/remove/edit functionality for complex
  configuration items
- **Mobile Input Types**: Use proper HTML5 input types (tel, email, url) for
  mobile keyboards

### Audit Trail Enhancement

- **User Email Display**: Show user email addresses instead of user IDs in audit
  trails
- **Current User Recognition**: Use `useAuth()` composable to identify current
  user
- **Fallback Handling**: Show "Sistema" for system actions, user ID for unknown
  users

### Automatic Technician Assignment

- **User Context Integration**: Leverage Clerk authentication context to automatically assign technicians
- **TechnicianUser Object Pattern**: Store complete user objects (userId, email, firstName, lastName, userType) instead of simple strings
- **Middleware Enhancement**: Extract user context from JWT tokens for automatic assignment
- **Form Simplification**: Remove manual technician selection fields from forms while preserving display functionality
- **Backward Compatibility**: Handle both string and object formats during data transitions

### User Permissions System

- **Role-Based Access Control**: Two roles - Admin (full access) and User/Employee (restricted access)
- **Shared Permission Logic**: All permission checks use utilities from @clever/shared package
- **Frontend Integration**: `usePermissions()` composable provides reactive permission checks for UI
- **Backend Protection**: Middleware functions enforce permissions at API level
- **Defense in Depth**: Permissions enforced at both UI layer (UX) and API layer (security)
- **Fail Closed**: Deny all permissions when userType is unavailable or null
- **Current Restrictions**: Users cannot delete content or view audit trails (Histórico sections)
- **No Data Migration**: Uses existing userType field from Clerk authentication
- **Consistent Enforcement**: Same permission logic applied across all content types

### Backend

- **Cloudflare Workers** serverless runtime
- **Hono** web framework
- **TypeScript** strict mode
- **Clerk** authentication (email/password)

### Storage

- **Cloudflare R2** as JSON document store
- **Cloudflare KV** for static assets
- No traditional database
- File-based search indexes

## Data Architecture

### R2 Bucket Structure

```
├── content/
│   ├── clients/
│   │   └── {uuid}.json
│   ├── contracts/
│   │   └── {uuid}.json
│   ├── licenses/
│   │   └── {uuid}.json
│   ├── work-sheets/
│   │   └── {uuid}.json
│   ├── daily-records/
│   │   └── {uuid}.json
│   ├── remote-assistance/
│   │   └── {uuid}.json
│   ├── reminders/
│   │   └── {uuid}.json
│   └── pending/
│       └── {uuid}.json
├── indexes/
│   ├── clients-index.json
│   ├── contracts-index.json
│   ├── licenses-index.json
│   ├── work-sheets-index.json
│   ├── daily-records-index.json
│   ├── remote-assistance-index.json
│   ├── reminders-index.json
│   └── pending-index.json
└── migrations/
    └── [migration files]
```

### KV Structure

```
KV Namespace: ASSETS
├── index.html
├── assets/
│   ├── index-{hash}.js
│   ├── index-{hash}.css
│   └── [other static assets]
└── [Vue build artifacts]
```

### BaseContent Interface

```typescript
interface BaseContent {
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
  data: Record<string, any>;
}
```

### Content Relations System

CLEVER implements a simple content relations system that automatically resolves
relationships between content types:

- **Relation Storage**: Content stores only relation IDs (e.g., `clientId`) in
  the data field
- **No Creation Validation**: Relation IDs can be stored without validating
  referenced content exists
- **Display-Time Validation**: Relations are validated and resolved when serving
  API responses
- **Structured Error Handling**: Failed relations return error objects with
  type, code (404/500), and message
- **Automatic Resolution**: All API responses include resolved relation data
  under a `relations` field
- **Pattern Detection**: Relations are detected by field naming patterns (fields
  ending in 'Id')
- **Hard-coded Mappings**: Relation type to content type mappings are explicitly
  defined in shared files
- **Sequential Resolution**: Relations resolved one by one for simplicity
- **No Caching**: Always fetch fresh data - no caching for relations, detail
  views, or list views
- **Basic Data Only**: Only essential fields from related content are included
  (company name, tax number, etc.)
- **No Configuration**: System uses simple conventions without complex schema
  configuration
- **Explicit Integration**: Each content type explicitly includes relation
  display where needed
- **Consistent UI**: Same relation type uses identical layout across all content
  types

```typescript
// Enhanced API response with relations and error handling
interface ContentWithRelations<T> extends BaseContent {
  data: T;
  relations: Record<string, RelationResult>;
}

type RelationResult = ResolvedRelation | RelationError;

interface ResolvedRelation {
  uuid: string;
  contentType: string;
  [key: string]: any; // Basic data fields
}

interface RelationError {
  type: 'error';
  code: 404 | 500;
  message: string;
}

// Example: License with resolved client relation
const licenseResponse = {
  uuid: 'license-uuid',
  contentType: 'licenses',
  data: { clientId: 'client-uuid', versao: '2024' },
  relations: {
    client: {
      uuid: 'client-uuid',
      contentType: 'clients',
      nomeEmpresa: 'Empresa ABC Lda',
      contribuinte: '123456789',
    },
  },
};

// Example: License with client resolution error
const licenseWithErrorResponse = {
  uuid: 'license-uuid',
  contentType: 'licenses',
  data: { clientId: 'invalid-uuid', versao: '2024' },
  relations: {
    client: {
      type: 'error',
      code: 404,
      message: 'Not found',
    },
  },
};
```

#### Supported Relations

- **License → Client**: `clientId` field resolves to client basic data
- **Contract → Client**: `clientId` field resolves to client basic data
- **Work Sheet → Client**: `clientId` field resolves to client basic data
- **Remote Assistance → Client**: `clientId` field resolves to client basic data

## Content Types

| Code Name           | Portuguese Label            | Frequency      | Description            |
| ------------------- | --------------------------- | -------------- | ---------------------- |
| `clients`           | Clientes                    | Low (~1/month) | Customer records       |
| `contracts`         | Contratos                   | Low (~1/month) | Contract documents     |
| `licenses`          | Licenças                    | Low (~1/month) | License management     |
| `work-sheets`       | Folhas de Obra              | High (~10/day) | Work timesheets        |
| `daily-records`     | Registo Diário de Atividade | High (~10/day) | Daily activity logs    |
| `remote-assistance` | Assistências Remotas        | High (~10/day) | Remote support records |
| `reminders`         | Lembretes                   | Medium         | Reminder system        |
| `pending`           | Pendentes                   | Medium         | Pending tasks          |

## Worker Route Handling

### Request Flow

```
Incoming Request
       ↓
   Is /api/* route?
       ↓
   Yes → API Handler
       ↓
   No → Serve Vue SPA
       ↓
   Vue Router handles routing
       ↓
   Unknown routes → 404 page
```

### API Endpoints

```
GET    /api/content/{type}           # List with search/filter + resolved relations
GET    /api/content/{type}/{uuid}    # Get single item + resolved relations
POST   /api/content/{type}           # Create new item + return with resolved relations
PUT    /api/content/{type}/{uuid}    # Update item + return with resolved relations
DELETE /api/content/{type}/{uuid}    # Soft delete item
POST   /api/migrate/{type}           # Import old data
```

All content API responses automatically include resolved relations in the
`relations` field.

### Static Asset Serving

```
GET    /                            # Vue SPA index.html
GET    /assets/*                    # Static assets from KV
GET    /clients                     # Vue SPA (client-side routing)
GET    /any-other-route             # Vue SPA (404 handling)
```

## Deployment

### Environments

- **test branch** → test environment
- **prod branch** → production environment

### Environment Configuration

```
Test:
- Worker: clever-test
- R2 bucket: clever-dashboard-test
- KV namespace: ASSETS_TEST
- Clerk environment: test
- Domain: clever-test.company.com

Production:
- Worker: clever-prod
- R2 bucket: clever-dashboard-prod
- KV namespace: ASSETS_PROD
- Clerk environment: production
- Domain: clever.company.com
```

### Wrangler Configuration

```toml
# wrangler.toml
[assets]
binding = "ASSETS"
directory = "./dist"

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "clever-dashboard-{env}"

[[kv_namespaces]]
binding = "ASSETS"
id = "{kv-namespace-id}"
```

## Build Process

### Common Commands

```bash
# Development
pnpm dev                              # Start full-stack development
pnpm --filter @clever/frontend dev    # Start frontend only
pnpm --filter @clever/backend dev     # Start backend only

# Building
pnpm build                            # Build all packages
pnpm --filter @clever/shared build    # Build specific package

# Code Quality
pnpm check-all                       # Run all checks (type-check, lint, format)
pnpm type-check                      # Type checking across workspaces
pnpm lint                            # Linting across workspaces
pnpm lint:fix                        # Fix linting issues
pnpm format                          # Format code across workspaces
pnpm format:check                    # Check formatting

# Testing
pnpm test                            # Run all tests
pnpm --filter @clever/WORKSPACE test # Test specific package (replace WORKSPACE with package name)

# Examples:
pnpm --filter @clever/frontend test  # Test frontend package
pnpm --filter @clever/backend test   # Test backend package
pnpm --filter @clever/shared test    # Test shared package
```

### Frontend Build

1. Vue build creates static files in `./dist`
2. Wrangler uploads static files to KV namespace
3. Worker serves files from KV binding

### Backend Integration

1. Hono handles API routes
2. Static file middleware serves Vue assets from KV
3. Fallback to Vue SPA for unknown routes

## Security

### Authentication

- Clerk email/password authentication
- User information stored in content audit trail
- Simple Admin/Employee roles (Phase 2)

### Data Access

- All content operations require authentication
- Audit trail on all modifications
- Soft delete for data retention

## Scalability Considerations

### Current Volume Projections

- High frequency content: ~11,000 items/year
- Low frequency content: ~36 items/year
- Total after 5 years: ~55,000 items maximum

### Performance

- KV provides fast static asset delivery
- JSON indexes will remain fast at this scale
- R2 provides excellent read performance
- Single Worker eliminates network latency between frontend/backend

## Migration Strategy

### Data Import Process

1. Export old system data to JSON files
2. Create schema mapping functions
3. Validate data against new BaseContent structure
4. Batch import with progress tracking
5. Generate initial search indexes

### Rollback Plan

- Keep migration files in R2 for reference
- Version all content for rollback capability
- Test environment for validation before production
