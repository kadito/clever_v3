# Product Overview

CLEVER is an internal business management dashboard for a Portuguese service company (v3 rebuild from Vue 2). Replaces manual spreadsheets and emails. Mobile-first, non-technical staff friendly.

## Core Modules

| Code name                    | PT Label                       | Frequency      |
|------------------------------|--------------------------------|----------------|
| `clients`                    | Clientes                       | Low (~1/month) |
| `contracts`                  | Contratos                      | Low (~1/month) |
| `licenses`                   | Licenças                       | Low (~1/month) |
| `installations-programming`  | Programação de Instalações     | Low (~1/month) |
| `work-sheets`                | Folhas de Obra                 | High (~10/day) |
| `daily-records`              | Registo Diário de Atividade    | High (~10/day) |
| `remote-assistance`          | Assistências Remotas           | High (~10/day) |
| `reminders`                  | Lembretes                      | Medium         |
| `pending`                    | Pendentes                      | Medium         |

## Rules

- All UI labels in Português Portugal; all code in English
- 5-view pattern per module: Home → List → Detail → Create → Update
- Mobile-first, 44px minimum touch targets
- Primary color: #75AE93
- Auth: Clerk (email/password), roles: Admin / User
- No public API, no native app, no microservices
