# Tarefas — Instalações e Programações

- [x] 1. Criar tipos e interfaces do content type no shared package
  - Design ref: [Modelo de Dados](design.md#1-modelo-de-dados)
  - Covers: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, CA-01.2, CA-02.1–02.8, CA-03.1–03.9, CA-04.1–04.8, CA-05.1–05.6, CA-06.1–06.5
  - Test ref: [MI-13](tests.md#mi--plano-executável), [MI-14](tests.md#mi--plano-executável), [MI-15](tests.md#mi--plano-executável), [MI-16](tests.md#mi--plano-executável)
  - Done when: Interfaces `InstallationsProgrammingData`, `Phase1Data`–`Phase5Data`, `MaterialInstaladoData`, `VectronLeituraXData`, `VectronConsultaDiariaData`, constantes `CHECKLIST_CATEGORIES`, `CHECKLIST_LABELS`, `PHASE_NAMES`, e tipos derivados exportados de `packages/shared/src/types/installations-programming/`; `ContentType` union atualizada em `types.ts`

- [x] 2. Criar lógica de validação de progressão de fases
  - Design ref: [Lógica de Progressão de Fases](design.md#4-lógica-de-progressão-de-fases)
  - Covers: REQ-08, CA-08.4, CA-08.5
  - Test ref: [MI-01](tests.md#mi--plano-executável), [MI-02](tests.md#mi--plano-executável), [MI-03](tests.md#mi--plano-executável), [MI-04](tests.md#mi--plano-executável), [MI-05](tests.md#mi--plano-executável), [MI-06](tests.md#mi--plano-executável), [MI-07](tests.md#mi--plano-executável), [MI-08](tests.md#mi--plano-executável), [MI-09](tests.md#mi--plano-executável), [MI-10](tests.md#mi--plano-executável), [MI-11](tests.md#mi--plano-executável), [MI-12](tests.md#mi--plano-executável)
  - Done when: Função `calculateCompletedPhases()` exportada de `packages/shared/src/types/installations-programming/validation.ts` com regras de completude por fase conforme design

- [x] 3. Criar rota backend com CRUD, validação e extração de índice
  - Design ref: [API Backend — Rotas e Configuração](design.md#3-api-backend--rotas-e-configuração), [Armazenamento e Índices R2](design.md#2-armazenamento-e-índices-r2)
  - Covers: REQ-01, REQ-07, REQ-10, CA-01.1, CA-01.3, CA-01.5, CA-01.6, CA-07.2, CA-10.1–10.6
  - Test ref: [MI-17](tests.md#mi--plano-executável), [MI-18](tests.md#mi--plano-executável), [MI-19](tests.md#mi--plano-executável), [MI-20](tests.md#mi--plano-executável), [MI-21](tests.md#mi--plano-executável), [MI-22](tests.md#mi--plano-executável), [MI-23](tests.md#mi--plano-executável), [MI-24](tests.md#mi--plano-executável), [MI-25](tests.md#mi--plano-executável), [MI-26](tests.md#mi--plano-executável), [MI-27](tests.md#mi--plano-executável)
  - Done when: Ficheiro `packages/backend/src/routes/installations-programming.ts` criado via `createContentRoutes` + `createStandardContentConfig` (padrão existente), com `validateCreate` (auto-assign técnico, inicialização de fases), `validateUpdate` (recálculo de fases via `calculateCompletedPhases`, merge parcial), `extractSearchableText` e `extractIndexFields`, rota montada em `api.ts`

- [x] 4. Registar content type no router frontend
  - Design ref: [Router e Dashboard](design.md#9-router-e-dashboard)
  - Covers: REQ-09, CA-09.1
  - Test ref: [MA-53](tests.md#ma--plano-executável)
  - Done when: `'installations-programming'` adicionado a `contentTypes`, `getContentTypeDisplayName`, `getContentTypeIcon`, e `hasSpecificComponents` em `packages/frontend/src/router/index.ts`

- [x] 5. Criar componente PhaseNavigation
  - Design ref: [Frontend — Vistas e Componentes](design.md#6-frontend--vistas-e-componentes)
  - Covers: REQ-08, REQ-09, CA-08.1, CA-08.2, CA-08.3, CA-09.6
  - Test ref: [MI-28](tests.md#mi--plano-executável), [MI-29](tests.md#mi--plano-executável)
  - Done when: Componente `packages/frontend/src/components/installations-programming/PhaseNavigation.vue` renderiza 5 tabs com indicador de progresso, emite evento de mudança de fase, touch targets ≥ 44px

- [x] 6. Criar componente PhaseChecklist
  - Design ref: [Frontend — Vistas e Componentes](design.md#6-frontend--vistas-e-componentes)
  - Covers: REQ-03, REQ-09, CA-03.1–03.11, CA-09.4, CA-09.5
  - Test ref: [MI-30](tests.md#mi--plano-executável), [MI-31](tests.md#mi--plano-executável), [MI-32](tests.md#mi--plano-executável)
  - Done when: Componente `packages/frontend/src/components/installations-programming/PhaseChecklist.vue` renderiza categorias colapsáveis com switches, indicador de progresso por categoria, emite evento de toggle

- [x] 7. Criar vista de lista (ListView)
  - Design ref: [Frontend — Vistas e Componentes](design.md#6-frontend--vistas-e-componentes)
  - Covers: REQ-01, REQ-08, REQ-09, CA-01.4, CA-01.5, CA-08.6, CA-09.1
  - Test ref: [MI-37](tests.md#mi--plano-executável), [MI-38](tests.md#mi--plano-executável)
  - Done when: `packages/frontend/src/views/installations-programming/InstallationsProgrammingListView.vue` com pesquisa, paginação, indicador de progresso por registo, nome do cliente resolvido

- [x] 8. Criar vista de detalhe (DetailView)
  - Design ref: [Frontend — Vistas e Componentes](design.md#6-frontend--vistas-e-componentes)
  - Covers: REQ-01, REQ-07, REQ-08, REQ-10, CA-01.4, CA-07.3, CA-07.4, CA-07.5, CA-08.1, CA-08.2, CA-10.3, CA-10.6
  - Test ref: [MI-39](tests.md#mi--plano-executável), [MI-40](tests.md#mi--plano-executável), [MI-41](tests.md#mi--plano-executável), [MI-42](tests.md#mi--plano-executável)
  - Done when: `packages/frontend/src/views/installations-programming/InstallationsProgrammingDetailView.vue` com navegação entre fases, relação cliente resolvida via RelationInfoDisplay, botão eliminar condicionado a permissão Admin, ConfirmationDialog

- [x] 9. Criar vista de criação (CreateView)
  - Design ref: [Formulários — Secções e Campos](design.md#7-formulários--secções-e-campos)
  - Covers: REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-09, CA-02.1–02.8, CA-03.1–03.11, CA-04.1–04.8, CA-05.1–05.6, CA-06.1–06.5, CA-09.2–09.6
  - Test ref: [MI-33](tests.md#mi--plano-executável), [MI-34](tests.md#mi--plano-executável), [MI-35](tests.md#mi--plano-executável), [MI-36](tests.md#mi--plano-executável)
  - Done when: `packages/frontend/src/views/installations-programming/InstallationsProgrammingCreateView.vue` com 5 fases navegáveis, campos condicionais (Vectron, Rolos, Anydesk, Vectron Connect, Foto), ClientSearchInput na Fase 3, PhaseChecklist na Fase 2, submit via useApi

- [x] 10. Criar vista de edição (UpdateView)
  - Design ref: [Formulários — Secções e Campos](design.md#7-formulários--secções-e-campos)
  - Covers: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, CA-01.3, CA-02.8
  - Test ref: [MA-03](tests.md#ma--plano-executável), [MA-13](tests.md#ma--plano-executável)
  - Done when: `packages/frontend/src/views/installations-programming/InstallationsProgrammingUpdateView.vue` com dados pré-preenchidos, mesma estrutura de fases que CreateView, submit via useApi com merge parcial
