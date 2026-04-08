# Project Structure

```
clever-dashboard/
├── packages/
│   ├── shared/src/
│   │   ├── types/              # Per-content-type TypeScript types
│   │   │   ├── base.ts         # BaseContent interface
│   │   │   ├── clients/
│   │   │   ├── contracts/
│   │   │   ├── daily-records/
│   │   │   ├── installations-programming/
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
│   │   │   ├── daily-records/
│   │   │   ├── installations-programming/
│   │   │   ├── licenses/
│   │   │   ├── remote-assistance/
│   │   │   ├── work-sheets/
│   │   │   ├── HomeView.vue
│   │   │   ├── SignInView.vue
│   │   │   └── NotFoundView.vue
│   │   ├── components/
│   │   │   ├── common/         # SearchBar, ContentCard, RelationInfoDisplay, ConfirmationDialog,
│   │   │   │                   # ContentFormTemplate, ContentCreateTemplate, ContentUpdateTemplate,
│   │   │   │                   # ContentDetailTemplate, ContentListTemplate, ClientSearchInput,
│   │   │   │                   # ContractSearchInput, ExpirationDateFilter, ErrorComponent
│   │   │   ├── forms/          # ContentForm, SignaturePad
│   │   │   ├── contracts/      # CPAContractSection, SHContractSection, BenefitFieldsGroup,
│   │   │   │                   # DynamicPlanDetails, EquipmentCard, SHEquipmentCard,
│   │   │   │                   # CPAEquipmentManager, ContractDatesSection, DisplayToggleSwitch
│   │   │   ├── daily-records/  # ActivityCard, DailyRecordsFilters
│   │   │   ├── balance/        # ClientBalanceDisplay, TransactionHistoryDisplay
│   │   │   ├── installations-programming/  # PhaseChecklist, PhaseNavigation
│   │   │   └── layout/         # AppLayout, AppNavigation, DashboardGrid
│   │   ├── composables/        # useAuth, usePermissions, useApi, useSharedFormData,
│   │   │                       # useContent, useErrorHandler, usePlanData, usePlanSelection,
│   │   │                       # useUserType, useExpirationFilter, useDailyRecordsFilters,
│   │   │                       # usePerformanceOptimizations
│   │   ├── stores/             # Pinia stores (auth)
│   │   └── router/             # Vue Router config
│   └── backend/src/
│       ├── routes/             # One file per content type + balance-routes + content-route-template
│       │                       # clients, contracts, licenses, daily-records, work-sheets,
│       │                       # remote-assistance, installations-programming, balance-routes
│       ├── middleware/         # clerk (auth), permissions, error, balance-middleware
│       ├── services/           # balance-service, balance-reporting-service, balance-cache,
│       │                       # failed-transaction-service
│       ├── types/              # Backend-specific type definitions (auth, index)
│       └── utils/              # technician-assignment, daily-records-relations
├── old_src/                    # Legacy Vue 2 — reference only, do not modify
└── [root config]               # wrangler.toml, tsconfig, eslint, prettier, pnpm-workspace.yaml
```

## Conventions

- kebab-case for files/dirs; PascalCase for Vue components
- One content type = one folder in `views/` with: `*ListView.vue`, `*DetailView.vue`, `*CreateView.vue`, `*UpdateView.vue`
- Generic views in `views/content/` for not-yet-implemented content types (reminders, pending)
- Validation per content type: `shared/src/types/{contentType}/validation.ts`
- API routes: `/api/content/{type}` (CRUD) — all responses include resolved `relations`
- R2 keys: `content/{type}/{uuid}.json`, indexes: `indexes/{type}-index.json`
- All permission logic lives in `@clever/shared/permissions.ts` — never inline
