# Tarefas — Filtros na Listagem de Registos Diários de Atividade

- [x] 1. Adicionar campos de técnico e data ao `extractIndexFields` dos daily-records
  - Design ref: [Modelo de dados — campos de filtragem](design.md#2-modelo-de-dados--campos-de-filtragem) + [Alteração ao extractIndexFields](design.md#alteração-ao-extractindexfields-daily-recordsts)
  - Covers: REQ-01, CA-01.3, REQ-02
  - Test ref: [MI-IT-01](tests.md#mi--plano-executável), [MI-IT-02](tests.md#mi--plano-executável)
  - Done when: `extractIndexFields` retorna `technicianUserId`, `technicianName` e `dataRegistro` para registos com e sem técnico

- [x] 2. Criar endpoint GET `/api/content/daily-records/collaborators`
  - Design ref: [Endpoint de colaboradores únicos](design.md#endpoint-de-colaboradores-únicos)
  - Covers: REQ-01, CA-01.1, CA-01.3
  - Test ref: [MI-IT-03](tests.md#mi--plano-executável), [MI-IT-04](tests.md#mi--plano-executável), [MI-IT-05](tests.md#mi--plano-executável), [MI-IT-06](tests.md#mi--plano-executável)
  - Done when: Endpoint retorna lista de colaboradores únicos ordenados alfabeticamente, excluindo entradas sem técnico e eliminadas

- [x] 3. Adicionar filtragem por `collaborator` e `date` no handler GET da listagem
  - Design ref: [Backend — filtragem no índice e endpoint de colaboradores](design.md#3-backend--filtragem-no-índice-e-endpoint-de-colaboradores)
  - Covers: REQ-01, CA-01.2, REQ-02, CA-02.2, REQ-03, CA-03.1, CA-03.2, CA-03.3, REQ-05
  - Test ref: [MI-IT-07](tests.md#mi--plano-executável), [MI-IT-08](tests.md#mi--plano-executável), [MI-IT-09](tests.md#mi--plano-executável), [MI-IT-10](tests.md#mi--plano-executável), [MI-IT-11](tests.md#mi--plano-executável), [MI-IT-12](tests.md#mi--plano-executável), [MI-IT-13](tests.md#mi--plano-executável)
  - Done when: Query params `collaborator` e `date` filtram entradas do índice em AND lógico com `search`, paginação opera sobre resultado filtrado

- [x] 4. Criar composable `useDailyRecordsFilters`
  - Design ref: [Composable useDailyRecordsFilters](design.md#4-composable-usedailyrecordsfilters)
  - Covers: REQ-01, CA-01.1, REQ-02, CA-02.3, REQ-03, REQ-04, CA-04.1, CA-04.2, REQ-05
  - Test ref: [MI-IT-14](tests.md#mi--plano-executável), [MI-IT-15](tests.md#mi--plano-executável), [MI-IT-16](tests.md#mi--plano-executável), [MI-IT-17](tests.md#mi--plano-executável), [MI-IT-18](tests.md#mi--plano-executável), [MI-IT-19](tests.md#mi--plano-executável), [MI-IT-20](tests.md#mi--plano-executável)
  - Done when: Composable expõe estado reativo dos filtros, `filterParams` computed, métodos de limpeza e `fetchCollaborators` funcional

- [x] 5. Criar componente `DailyRecordsFilters.vue`
  - Design ref: [Componente de filtros UI — DailyRecordsFilters.vue](design.md#5-componente-de-filtros-ui--dailyrecordsfiltersvue)
  - Covers: REQ-01, CA-01.1, CA-01.3, REQ-02, CA-02.1, CA-02.3, REQ-04, CA-04.1, REQ-06, CA-06.1, CA-06.2, CA-06.3
  - Test ref: [MI-IT-21](tests.md#mi--plano-executável), [MI-IT-22](tests.md#mi--plano-executável), [MI-IT-23](tests.md#mi--plano-executável), [MI-IT-24](tests.md#mi--plano-executável), [MI-IT-25](tests.md#mi--plano-executável), [MI-IT-26](tests.md#mi--plano-executável)
  - Done when: Componente renderiza dropdowns de colaborador e data com 44px min-height, rótulos PT-PT, emite eventos v-model, layout responsivo

- [x] 6. Integrar filtros na `DailyRecordsListView.vue`
  - Design ref: [Integração na ListView — DailyRecordsListView.vue](design.md#6-integração-na-listview--dailyrecordslistviewvue) + [Tratamento de erros](design.md#7-tratamento-de-erros)
  - Covers: REQ-03, CA-03.1, CA-03.2, CA-03.3, REQ-05, CA-05.1, CA-05.2
  - Test ref: [MI-IT-27](tests.md#mi--plano-executável), [MI-IT-28](tests.md#mi--plano-executável)
  - Done when: Filtros renderizados no slot `#filters`, `filterParams` passados ao `fetchList`, paginação reinicia ao mudar filtro, mensagem vazia diferenciada com filtros ativos

- [ ]* 7. Testes de integração [MI]
  - Design ref: [Todas as secções](design.md)
  - Covers: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06
  - Test ref: [MI-IT-01](tests.md#mi--plano-executável) a [MI-IT-28](tests.md#mi--plano-executável)
  - Done when: Todos os 28 testes MI passam com Vitest + fast-check

- [ ]* 8. Testes de aceitação [MA]
  - Design ref: [Todas as secções](design.md)
  - Covers: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06
  - Test ref: [MA-AT-01](tests.md#ma--plano-executável) a [MA-AT-16](tests.md#ma--plano-executável)
  - Done when: Todos os 16 testes MA passam com Vitest + fast-check
