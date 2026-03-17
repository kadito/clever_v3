# Project Structure

```
clever-dashboard/
├── packages/
│   ├── shared/src/           # Types, utils, permissions, balance, relations
│   │   ├── types/            # Per-content-type TypeScript types
│   │   ├── permissions.ts    # RBAC logic (shared by frontend + backend)
│   │   ├── balance-*.ts      # Balance calculation utilities
│   │   └── relation-*.ts     # Relation resolution + type guards
│   ├── frontend/src/
│   │   ├── views/            # One folder per content type (List/Detail/Create/Update)
│   │   │   ├── balance/      # Balance report views
│   │   │   ├── clients/
│   │   │   ├── contracts/
│   │   │   ├── licenses/
│   │   │   ├── work-sheets/
│   │   │   ├── remote-assistance/
│   │   │   └── daily-records/
│   │   ├── components/
│   │   │   ├── common/       # SearchBar, ContentCard, RelationInfoDisplay, etc.
│   │   │   ├── forms/        # ContentFormTemplate, ContentCreateTemplate, etc.
│   │   │   └── layout/       # AppLayout, navigation
│   │   ├── composables/      # useAuth, usePermissions, useApi, useSharedFormData
│   │   ├── stores/           # Pinia stores (auth)
│   │   └── router/           # Vue Router config
│   └── backend/src/
│       ├── routes/           # One file per content type + balance-routes.ts
│       ├── middleware/       # auth, permissions, error handlers
│       ├── services/         # Business logic
│       └── utils/            # R2 helpers, index management
├── old_src/                  # Legacy Vue 2 — reference only, do not modify
└── [root config]             # wrangler.toml, tsconfig, eslint, prettier
```

## Conventions

- kebab-case for files/dirs; PascalCase for Vue components
- One content type = one folder in `views/` with: `*List.vue`, `*Detail.vue`, `*CreateView.vue`, `*UpdateView.vue`
- API routes: `/api/content/{type}` (CRUD) — all responses include resolved `relations`
- R2 keys: `content/{type}/{uuid}.json`, indexes: `indexes/{type}-index.json`
- All permission logic lives in `@clever/shared/permissions.ts` — never inline
