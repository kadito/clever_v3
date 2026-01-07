# Product Overview

CLEVER Dashboard is an internal business management application for a Portuguese
service company. The system manages various operational aspects including:

## Core Modules

- **Clientes** (Clients) - Customer management
- **Folhas de Obra** (Work Sheets) - Work order management
- **Assistências Remotas** (Remote Assistance) - Remote support tracking
- **Contratos** (Contracts) - Contract management
- **Licenças** (Licenses) - License management
- **Registo Diário** (Daily Records) - Daily activity logging
- **Equipa** (Team) - Team management

## Additional Modules (Legacy/Planned)

- Agendamentos (Scheduling)
- Instalações e Programações (Installations & Programming)
- Equipamento (Equipment management)
- Conta Corrente (Current Account)
- Encomendas (Orders)

## Language

The application is primarily in Portuguese, reflecting its target market. All UI
text, module names, and business terminology should maintain Portuguese language
conventions.

## Architecture

This is version 3 of the CLEVER system, being rebuilt as a modern monorepo with
separate frontend and backend packages, replacing the legacy Vue 2 application
in `old_src/`.

### Mobile-First Design

The new version prioritizes mobile experience with:

- Dashboard-centric navigation with content tiles
- Touch-friendly interfaces optimized for mobile devices
- Responsive design that scales from mobile to desktop
- Consistent 4-view pattern across all modules
- Color scheme inspired by the original application
