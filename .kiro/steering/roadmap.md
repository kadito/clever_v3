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
- Content Relations System:
  - Automatic relation detection and resolution
  - License → Client relations
  - Contract → Client relations
  - Work Sheet → Client relations
  - Remote Assistance → Client relations
- Schema validation
- Comprehensive testing
- User Permissions System:
  - Role-based access control (Admin/User)
  - Delete operation restrictions for User role
  - Audit trail visibility restrictions for User role
  - Shared permission utilities in @clever/shared
  - Frontend usePermissions composable
  - Backend permission middleware
  - Consistent enforcement across all content types

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
