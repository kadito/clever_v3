# Roadmap

## Phase 1: Foundation ✅

- Single Worker setup (unified frontend + backend deployment)
- KV binding via [assets] for Vue static assets
- Route handling (API vs SPA routes)
- BaseContent interface and implementation
- Content CRUD operations (clients, contracts, licenses)
- Search indexes and basic search functionality
- Clerk authentication integration
- R2 storage layer
- Basic UI with Portuguese labels

## Phase 2: Core Features ✅

- Content types implemented:
  - Folhas de Obra (Work Sheets)
  - Registo Diário (Daily Records)
  - Assistências Remotas (Remote Assistance)
  - Programação de Instalações (Installations Programming)
  - _(Lembretes and Pendentes use generic views, not yet specialized)_
- Content Relations System:
  - Automatic relation detection and resolution
  - License → Client, Contract → Client, WorkSheet → Client, RemoteAssistance → Client, InstallationsProgramming → Client
  - Relation type guards and validation in @clever/shared
- User Permissions System:
  - Role-based access control (Admin/User)
  - Delete restrictions + audit trail visibility for User role
  - Shared permission utilities, frontend composable, backend middleware
- Delete functionality across all content types with ConfirmationDialog
- Automatic technician assignment from Clerk auth context
- Balance reporting system (report, export, transaction history)
- Contract form system (CPA/S&H toggles, plan selection, equipment management, pricing)
- Manual benefit override for contract plans (BenefitFieldsGroup)
- Expiration date filtering

## Phase 3: Advanced Features (current)

- Client-contract balance refactoring
- Data migration from old system
- Automation workflows
- External integrations
- Advanced search and filtering
- Reporting enhancements
- Reminders and Pending Items specialized views

## Deployment Strategy

- test branch → test environment
- prod branch → production environment
- Separate R2 buckets and Clerk environments per stage
