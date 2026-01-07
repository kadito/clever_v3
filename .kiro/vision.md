# Project Vision

CLEVER is a long-lived internal dashboard for a small company.

Goals:

- Replace manual spreadsheets and emails
- Be usable by non-technical staff on any device
- Support incremental feature growth for years
- Provide mobile-first experience for field workers

Non-goals:

- No native mobile app (responsive web only)
- No public API exposure
- No premature microservices

Design Philosophy:

- Mobile-first responsive design
- Dashboard-centric navigation with content tiles
- Consistent 4-view pattern: Home → List → Detail → Create/Edit
- Touch-friendly interfaces optimized for mobile use
- Color scheme inspired by old_src (green primary: #75AE93)

Content Types:

- Clientes (Clients)
- Contratos (Contracts)
- Licenças (Licenses)
- Folhas de Obra (Work Sheets)
- Registo Diário de Atividade (Daily Records)
- Assistências Remotas (Remote Assistance)
- Lembretes (Reminders)
- Pendentes (Pending Items)

Data Patterns:

- High frequency: Daily records, work sheets, assistance (~10/day)
- Low frequency: Clients, contracts, licenses (~1/month)

Longevity Rules:

- Prefer boring tech
- Avoid over-engineering
- R2 as document store (JSON files)
- Simple search via maintained indexes
