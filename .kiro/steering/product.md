# Product Overview

CLEVER is an internal business management dashboard for a Portuguese service company (v3 rebuild from Vue 2). Replaces manual spreadsheets and emails. Mobile-first, non-technical staff friendly. Designed for incremental feature growth over years.

## Goals

- Replace manual spreadsheets and emails
- Be usable by non-technical staff on any device
- Mobile-first experience for field workers
- Support incremental feature growth for years

## Non-goals

- No native mobile app (responsive web only)
- No public API exposure
- No premature microservices

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

## Design philosophy

- Dashboard-centric navigation with content tiles
- 5-view pattern per module: Home → List → Detail → Create → Update
- Mobile-first, 44px minimum touch targets
- Primary color: #75AE93
- Multiselect dropdowns over checkboxes for mobile
- Conditional fields with dynamic visibility based on form selections
- Standardized section ordering across all content types

## Longevity rules

- Prefer boring tech
- Avoid over-engineering
- R2 as document store (JSON files)
- Simple search via maintained indexes

## Rules

- All UI labels in Português Portugal; all code in English
- Auth: Clerk (email/password), roles: Admin / User
