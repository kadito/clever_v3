# Coding Standards

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

Content Structure:
- All content extends BaseContent interface
- UUID-based identification
- Audit trail (created/updated by/at)
- Version tracking
- Soft delete support

API Patterns:
- RESTful endpoints: /api/content/{type}
- Consistent CRUD operations
- R2 key pattern: content/{type}/{type}-{uuid}.json
- Index pattern: indexes/{type}-index.json
