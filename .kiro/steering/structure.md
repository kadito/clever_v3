# Project Structure

## Monorepo Organization

```
clever-dashboard/
├── packages/
│   ├── shared/          # Common types and utilities
│   ├── frontend/        # Vue 3 application
│   └── backend/         # Hono API server
├── old_src/            # Legacy Vue 2 application (reference only)
└── [root config files]
```

## Package Structure Conventions

### @clever/shared

```
packages/shared/
├── src/
│   ├── index.ts        # Main exports
│   ├── types.ts        # TypeScript type definitions
│   └── utils.ts        # Shared utility functions
├── dist/               # Compiled output
└── package.json
```

### @clever/frontend

```
packages/frontend/
├── src/
│   ├── main.ts         # Vue app entry point
│   ├── components/     # Reusable Vue components
│   │   ├── layout/     # Layout components (mobile-first)
│   │   ├── common/     # Shared components (SearchBar, ContentCard, etc.)
│   │   └── forms/      # Form components
│   ├── views/          # Page-level components
│   │   ├── HomeView.vue        # Dashboard with content tiles
│   │   ├── content/            # Generic view templates
│   │   └── [ContentType]/      # Specific implementations
│   ├── stores/         # Pinia stores
│   ├── router/         # Vue Router configuration
│   └── assets/         # Static assets
└── package.json
```

### @clever/backend

```
packages/backend/
├── src/
│   ├── index.ts        # Hono app entry point
│   ├── routes/         # API route handlers
│   ├── middleware/     # Custom middleware
│   └── types/          # Backend-specific types
├── dist/               # Compiled output
└── package.json
```

## Naming Conventions

### Files and Directories

- Use kebab-case for file and directory names
- Vue components use PascalCase (e.g., `ClientesList.vue`)
- TypeScript files use camelCase or kebab-case consistently

### Module Organization

- Group related functionality by business domain
- Each module should follow the 4-view pattern:
  - `ModuleList.vue` - List/search view (mobile-optimized)
  - `ModuleDetail.vue` - Detail/view component (mobile-friendly)
  - `ModuleForm.vue` - Create/edit form (touch-optimized)
  - Dashboard tiles for navigation from HomeView.vue
- Use mobile-first responsive design for all components
- Implement consistent color scheme from old_src palette

### API Routes

- Use RESTful conventions
- Group by content type (e.g., `/api/clients`, `/api/contracts`)
- Maintain Portuguese business terminology in URLs when appropriate

## Legacy Code Reference

The `old_src/` directory contains the previous Vue 2 implementation and should
be used as reference for:

- Business logic patterns
- Module structure and organization
- Data models and relationships
- UI/UX patterns

**Important**: Do not modify files in `old_src/` - it's for reference only
during the migration to the new architecture.
