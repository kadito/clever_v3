# Tech Constraints

## Build System

- **Monorepo**: pnpm workspaces with TypeScript project references
- **Node.js**: >=18.0.0 required
- **pnpm**: >=8.0.0 required
- **TypeScript**: v5+ with strict mode enabled

### Frontend

- Vue 3
- Composition API
- TailwindCSS
- No Options API
- No class-based components
- 5-view pattern: Home → List → Detail → Create → Update (separate Create/Update components)
- Shared form data composable (`useSharedFormData`) for component recreation handling
- Multiselect dropdowns for better mobile experience
- Conditional fields via JSON configuration
- Dynamic configuration management for complex items

Backend:

- Cloudflare Workers
- Hono framework
- TypeScript only
- REST API

Deployment:

- Single Cloudflare Worker for both frontend and backend
- Vue static files stored in Cloudflare KV
- KV binding via [assets] in wrangler.toml
- Route handling:
  - Known API routes → API handlers
  - All other routes → Vue app (with 404 handling)

Storage:

- Cloudflare R2 (JSON document store)
- Cloudflare KV (static assets)
- No traditional database
- R2 bucket structure:
  ```
  ├── content/{type}/{uuid}.json
  ├── indexes/{type}-index.json
  └── migrations/
  ```

Auth:

- Clerk (email/password only)
- Simple authentication system
- User data stored in content audit trail

Environments:

- test branch → test environment
- prod branch → production environment

Localization:

- All code in English
- All UI labels in Português Portugal

General:

- No experimental libraries
- No code generation without review
- All public APIs must be typed
