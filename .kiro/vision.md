# Project Vision

CLEVER is a long-lived internal dashboard for a small company.

Goals:

- Replace manual spreadsheets and emails
- Be usable by non-technical staff
- Support incremental feature growth for years

Non-goals:

- No mobile app (web only)
- No public API exposure
- No premature microservices

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
