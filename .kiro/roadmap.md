# Roadmap

Phase 1: Foundation

- Single Worker setup (unified frontend + backend deployment)
- KV binding for Vue static assets
- Route handling (API vs SPA routes)
- BaseContent interface and implementation
- Content CRUD operations (clients, contracts, licenses)
- Search indexes and basic search functionality
- Clerk authentication integration
- R2 storage layer
- Basic UI with Portuguese labels

Phase 2: Core Features

- All content types implementation:
  - Folhas de Obra (Work Sheets)
  - Registo Diário (Daily Records)
  - Assistências Remotas (Remote Assistance)
  - Lembretes (Reminders)
  - Pendentes (Pending Items)
- Schema validation
- Comprehensive testing
- User permissions (Admin/Employee)

Phase 3: Advanced Features

- Data migration from old system
- Automation workflows
- External integrations
- Advanced search and filtering
- Reporting capabilities

Deployment Strategy:

- test branch → test environment
- prod branch → production environment
- Separate R2 buckets and Clerk environments per stage
