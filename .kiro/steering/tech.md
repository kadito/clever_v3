# Technology Stack

## Build System

- **Monorepo**: pnpm workspaces with TypeScript project references
- **Node.js**: >=18.0.0 required
- **pnpm**: >=8.0.0 required
- **TypeScript**: v5+ with strict mode enabled

## Frontend Stack

- **Vue 3** with Composition API
- **Vue Router 4** for routing with dashboard-centric navigation
- **Pinia** for state management
- **Vite** for build tooling and dev server
- **Tailwind CSS** for styling with mobile-first responsive design
- **Vitest** for testing

## Design Philosophy

- **Mobile-First**: All components designed for mobile screens first, then
  enhanced for larger screens with 44px minimum touch targets
- **5-View Pattern**: Home (dashboard) → List (search) → Detail → Create →
  Update for all content types (separate Create/Update components)
- **Color Palette**: Based on old_src (#75AE93 primary, #2c3e50 secondary)
- **Touch-Friendly**: Optimized for mobile interactions with proper tap targets
- **Form Architecture**: Shared form data composable with component recreation
  handling
- **UI Patterns**: Multiselect dropdowns, conditional fields, dynamic
  configuration management

## Backend Stack

- **Hono** web framework
- **Cloudflare Workers** runtime
- **Wrangler** for deployment and local development

## Code Quality Tools

- **ESLint** with TypeScript and Vue plugins
- **Prettier** for code formatting
- **TypeScript** strict mode for type checking

## Development Environment

### Local Development Setup

**IMPORTANT: The development server is ALWAYS RUNNING.**

**Access URLs:**

- **Application**: http://localhost:8787/
- **API Endpoints**: http://localhost:8787/api/\*
- **Vue SPA**: All non-API routes served by Vue Router

**Development Server Assumptions:**

- **DO NOT run `pnpm dev`** - the server is already running
- **DO NOT start any development servers** - they are already active
- If server doesn't respond, inform the user to restart it manually
- Single Wrangler dev server serves both frontend and backend
- Vue static files served from KV binding in development
- API routes handled by Hono, all other routes serve Vue SPA

### Alternative Development Commands

```bash
# Start frontend only (for isolated frontend development)
pnpm --filter @clever/frontend dev

# Start backend only (for isolated backend development)
pnpm --filter @clever/backend dev
```

**Note:** Use `pnpm dev` from root for normal development as it provides the
complete integrated experience.

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @clever/shared build
```

### Code Quality

```bash
# Run all checks (type-check, lint, format)
pnpm check-all

# Type checking
pnpm type-check

# Linting
pnpm lint
pnpm lint:fix

# Formatting
pnpm format
pnpm format:check
```

### Testing

```bash
# Run all tests
pnpm test

# Test specific package (replace WORKSPACE with package name)
pnpm --filter @clever/WORKSPACE test

# Examples:
pnpm --filter @clever/frontend test
pnpm --filter @clever/backend test
pnpm --filter @clever/shared test
```

## Package Structure

- `@clever/shared` - Common types and utilities
- `@clever/frontend` - Vue 3 application
- `@clever/backend` - Hono API server
