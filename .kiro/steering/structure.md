# Project Structure

```
clever-dashboard/
├── packages/
│   ├── shared/src/
│   │   ├── types/              # Per-content-type TypeScript types
│   │   │   ├── base.ts         # BaseContent interface
│   │   │   ├── clients/
│   │   │   ├── contracts/
│   │   │   ├── daily-activity-records/
│   │   │   ├── daily-records/
│   │   │   ├── licenses/
│   │   │   ├── remote-assistance/
│   │   │   └── work-sheets/
│   │   ├── permissions.ts      # RBAC logic (shared by frontend + backend)
│   │   ├── balance-types.ts    # Balance type definitions
│   │   ├── balance-utils.ts    # Balance calculation utilities
│   │   ├── balance-extraction.ts # Balance data extraction
│   │   ├── relation-type-guards.ts  # isRelationError / isResolvedRelation
│   │   ├── relation-validation.ts   # Relation validation logic
│   │   ├── user-type-utils.ts  # User type helpers
│   │   ├── storage.ts          # Storage key utilities
│   │   ├── utils.ts            # General utilities
│   │   ├── types.ts            # Core shared types
│   │   └── index.ts            # Package exports
│   ├── frontend/src/
│   │   ├── views/
│   │   │   ├── content/        # Generic views (List, Detail, Form) for unimplemented types
│   │   │   ├── balance/        # Balance report + transaction history views
│   │   │   ├── clients/
│   │   │   ├── contracts/
│   │   │   ├── licenses/
│   │   │   ├── work-sheets/
│   │   │   ├── remote-assistance/
│   │   │   ├── daily-records/
│   │   │   ├── HomeView.vue
│   │   │   ├── SignInView.vue
│   │   │   └── NotFoundView.vue
│   │   ├── components/
│   │   │   ├── common/         # SearchBar, ContentCard, RelationInfoDisplay, ConfirmationDialog
│   │   │   ├── forms/          # ContentFormTemplate, ContentCreateTemplate, ContentUpdateTemplate
│   │   │   ├── contracts/      # Contract-specific components (sections, toggles, equipment)
│   │   │   ├── daily-records/  # Daily records components
│   │   │   ├── balance/        # Balance report components
│   │   │   └── layout/         # AppLayout, navigation
│   │   ├── composables/        # useAuth, usePermissions, useApi, useSharedFormData,
│   │   │                       # useContent, useErrorHandler, usePlanData, usePlanSelection, useUserType
│   │   ├── stores/             # Pinia stores (auth)
│   │   └── router/             # Vue Router config
│   └── backend/src/
│       ├── routes/             # One file per content type + balance-routes + content-route-template
│       ├── middleware/         # clerk (auth), permissions, error, balance-middleware
│       ├── services/           # balance-service, balance-reporting, balance-cache, failed-transactions
│       ├── types/              # Backend-specific type definitions
│       └── utils/              # technician-assignment, daily-records-relations
├── old_src/                    # Legacy Vue 2 — reference only, do not modify
└── [root config]               # wrangler.toml, tsconfig, eslint, prettier
```

## Conventions

- kebab-case for files/dirs; PascalCase for Vue components
- One content type = one folder in `views/` with: `*ListView.vue`, `*DetailView.vue`, `*CreateView.vue`, `*UpdateView.vue`
- Generic views in `views/content/` for not-yet-implemented content types (reminders, pending)
- API routes: `/api/content/{type}` (CRUD) — all responses include resolved `relations`
- R2 keys: `content/{type}/{uuid}.json`, indexes: `indexes/{type}-index.json`
- All permission logic lives in `@clever/shared/permissions.ts` — never inline
