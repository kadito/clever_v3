# System Architecture

## Overview

CLEVER is an internal dashboard using unified Cloudflare Worker deployment.
Single Worker serves both Vue SPA and API endpoints, with KV for static assets
and R2 for JSON document storage.

## Technology Stack

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
- **Mobile-First Design**: Optimized for mobile devices with responsive breakpoints
- **Color Palette**: Based on old_src (#75AE93 primary, #2c3e50 secondary)
- **4-View Pattern**: Home (dashboard) → List (search) → Detail → Create/Edit for all content types

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
│   │   └── clients-{uuid}.json
│   ├── contracts/
│   │   └── contracts-{uuid}.json
│   ├── licenses/
│   │   └── licenses-{uuid}.json
│   ├── work-sheets/
│   │   └── work-sheets-{uuid}.json
│   ├── daily-records/
│   │   └── daily-records-{uuid}.json
│   ├── remote-assistance/
│   │   └── remote-assistance-{uuid}.json
│   ├── reminders/
│   │   └── reminders-{uuid}.json
│   └── pending/
│       └── pending-{uuid}.json
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
GET    /api/content/{type}           # List with search/filter
GET    /api/content/{type}/{uuid}    # Get single item
POST   /api/content/{type}           # Create new item
PUT    /api/content/{type}/{uuid}    # Update item
DELETE /api/content/{type}/{uuid}    # Soft delete item
POST   /api/migrate/{type}           # Import old data
```

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
