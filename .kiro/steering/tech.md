# Technology Stack

## Build System
- **Monorepo**: npm workspaces with TypeScript project references
- **Node.js**: >=18.0.0 required
- **npm**: >=9.0.0 required
- **TypeScript**: v5+ with strict mode enabled

## Frontend Stack
- **Vue 3** with Composition API
- **Vue Router 4** for routing with dashboard-centric navigation
- **Pinia** for state management
- **Vite** for build tooling and dev server
- **Tailwind CSS** for styling with mobile-first responsive design
- **Vitest** for testing

## Design Philosophy
- **Mobile-First**: All components designed for mobile screens first, then enhanced for larger screens
- **4-View Pattern**: Home (dashboard) → List (search) → Detail → Create/Edit for all content types
- **Color Palette**: Based on old_src (#75AE93 primary, #2c3e50 secondary)
- **Touch-Friendly**: Optimized for mobile interactions with proper tap targets

## Backend Stack
- **Hono** web framework
- **Cloudflare Workers** runtime
- **Wrangler** for deployment and local development

## Code Quality Tools
- **ESLint** with TypeScript and Vue plugins
- **Prettier** for code formatting
- **TypeScript** strict mode for type checking

## Common Commands

### Development
```bash
# Start development (uses wrangler for full-stack)
npm run dev

# Start frontend only
npm run dev --workspace=@clever/frontend

# Start backend only
npm run dev --workspace=@clever/backend
```

### Building
```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=@clever/shared
```

### Code Quality
```bash
# Run all checks (type-check, lint, format)
npm run check-all

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

### Testing
```bash
# Run all tests
npm run test

# Test specific package
npm run test --workspace=@clever/frontend
```

## Package Structure
- `@clever/shared` - Common types and utilities
- `@clever/frontend` - Vue 3 application
- `@clever/backend` - Hono API server