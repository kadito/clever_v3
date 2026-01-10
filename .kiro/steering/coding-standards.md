# Coding Standards

## Package Management

- Use pnpm for all dependency management
- Use workspace:* protocol for internal dependencies
- Follow pnpm workspace commands for cross-package operations
- Maintain pnpm-lock.yaml in version control

## Code Quality

- TypeScript strict mode always on
- No `any`
- Prefer explicit return types
- Preference for small functions
- One responsibility per file
- No deep nesting (>3 levels)

Naming:

- camelCase for variables
- PascalCase for components
- kebab-case for routes
- Content types in English (code)
- UI labels in Português Portugal

Comments:

- Why > What
- No obvious comments

Mobile-First Development:

- Design for mobile screens first (320px+)
- Use Tailwind responsive breakpoints: sm (768px), md (1024px), lg (1280px)
- Touch targets minimum 44px (iOS/Android guidelines)
- Test on mobile devices regularly
- Optimize for thumb navigation
- Use mobile-first CSS media queries

Component Standards:

- Follow 4-view pattern: Home → List → Detail → Create/Edit
- Use consistent color palette from old_src
- Implement loading states for mobile networks
- Handle offline scenarios gracefully
- Use semantic HTML for accessibility

Content Structure:

- All content extends BaseContent interface
- UUID-based identification
- Audit trail (created/updated by/at)
- Version tracking
- Soft delete support

Content Relations:

- Store only relation IDs in content data (e.g., `clientId`)
- Use field naming pattern: `{relationType}Id` (clientId, contractId)
- Hard-code relation type mappings in shared content files
- No validation during content creation/update - allow any relation ID values
- Validate relations during API response generation (display-time validation)
- All API responses include `relations` field with resolved data or error information
- Use sequential resolution approach (simple, one-by-one)
- No caching - always fetch fresh data for relations
- Extract only basic data from related content (no sensitive information)
- Handle relation resolution failures with structured error objects:
  - 404 errors: `{ type: 'error', code: 404, message: 'Not found' }`
  - 500 errors: `{ type: 'error', code: 500, message: 'Internal Server Error' }`
- Use explicit component integration (each content type decides where to show relations)
- Consistent UI layout for same relation types across all content types
- Display errors with distinct styling (red background/border for error states)

API Patterns:

- RESTful endpoints: /api/content/{type}
- Consistent CRUD operations
- R2 key pattern: content/{type}/{uuid}.json
- Index pattern: indexes/{type}-index.json
- All responses include resolved relations automatically
