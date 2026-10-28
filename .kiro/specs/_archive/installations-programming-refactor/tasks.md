# Tasks — Instalações e Programações (Refactor)

> **Nota:** REQ-03 (Fase 2), REQ-05 (Fase 4) e REQ-06 (Fase 5) não têm alterações neste refactor — as fases são mantidas inalteradas conforme o design. Os testes [MA] correspondentes (MA-15 a MA-25, MA-37 a MA-47) validam que o comportamento existente se mantém.

## Implementação

- [x] 1. Refatorizar tipos Phase1Data e Phase3Data na shared
  - Design ref: [Modelo de Dados — Phase1Data (Refactor)](design.md#1-modelo-de-dados--phase1data-refactor) + [Modelo de Dados — Phase3Data (Reorganização em Secções)](design.md#2-modelo-de-dados--phase3data-reorganização-em-secções)
  - Covers: REQ-02 (CA-02.1 a CA-02.5, CA-02.8), REQ-04 (CA-04.8)
  - Test ref: [MI-01](tests.md#mi--plano-executável), [MI-02](tests.md#mi--plano-executável), [MI-03](tests.md#mi--plano-executável)
  - Done when: `Phase1Data` tem 5 campos novos, `VectronLeituraXData` e `VectronConsultaDiariaData` removidas, `Phase3Data` inclui `tecnicoFormacao`, compilação TypeScript sem erros

- [x] 2. Atualizar PHASE_NAMES e labels na shared
  - Design ref: [Constantes e Labels](design.md#3-constantes-e-labels)
  - Covers: REQ-08 (CA-08.1), REQ-01 (CA-01.2)
  - Test ref: [MA-02](tests.md#ma--plano-executável)
  - Done when: Fase 1 = "Programação / Preparação", Fase 2 = "Preparação Instalação", exports atualizados

- [x] 3. Atualizar lógica de completude da Fase 1 na validation
  - Design ref: [Backend — Validação e Defaults](design.md#4-backend--validação-e-defaults) (secção calculateCompletedPhases)
  - Covers: REQ-08 (CA-08.4, CA-08.5)
  - Test ref: [MI-04](tests.md#mi--plano-executável), [MI-05](tests.md#mi--plano-executável), [MI-06](tests.md#mi--plano-executável), [MI-07](tests.md#mi--plano-executável)
  - Done when: `isPhase1Complete()` verifica novos campos (pelo menos um texto preenchido OU testeFinal === true), fases 2-5 inalteradas

- [x] 4. Atualizar defaults e validação no backend routes
  - Design ref: [Backend — Validação e Defaults](design.md#4-backend--validação-e-defaults)
  - Covers: REQ-01 (CA-01.1, CA-01.6), REQ-02 (CA-02.6, CA-02.7), REQ-04 (CA-04.8), REQ-10 (CA-10.1, CA-10.2)
  - Test ref: [MI-08](tests.md#mi--plano-executável), [MI-09](tests.md#mi--plano-executável), [MI-10](tests.md#mi--plano-executável), [MI-11](tests.md#mi--plano-executável), [MI-12](tests.md#mi--plano-executável), [MI-13](tests.md#mi--plano-executável), [MI-14](tests.md#mi--plano-executável), [MI-15](tests.md#mi--plano-executável), [MI-16](tests.md#mi--plano-executável)
  - Done when: `defaultPhase1()` retorna 5 campos novos, `defaultPhase3()` inclui `tecnicoFormacao`, `validateCreate()` e `validateUpdate()` usam novos defaults e merge parcial

- [x] 5. Verificar/atualizar PhaseNavigation component
  - Design ref: [Frontend — Vistas e Componentes](design.md#5-frontend--vistas-e-componentes) (PhaseNavigation.vue)
  - Covers: REQ-08 (CA-08.1, CA-08.2, CA-08.3, CA-08.6)
  - Test ref: [MA-53](tests.md#ma--plano-executável), [MA-54](tests.md#ma--plano-executável)
  - Done when: PhaseNavigation usa PHASE_NAMES da shared (ou nomes atualizados se hardcoded), navegação livre entre fases funcional

- [x] 6. Refatorizar InstallationsProgrammingDetailView — Fase 1 e Fase 3
  - Design ref: [Frontend — Vistas e Componentes](design.md#5-frontend--vistas-e-componentes) (DetailView)
  - Covers: REQ-02 (CA-02.1 a CA-02.5, CA-02.8), REQ-04 (CA-04.1 a CA-04.11), REQ-07 (CA-07.3, CA-07.4), REQ-09 (CA-09.3)
  - Test ref: [MA-07](tests.md#ma--plano-executável) a [MA-14](tests.md#ma--plano-executável), [MA-26](tests.md#ma--plano-executável) a [MA-36](tests.md#ma--plano-executável)
  - Done when: Fase 1 mostra 5 campos novos (sem campos antigos), Fase 3 organizada em 4 secções (Dados Gerais, Detalhes, Formação com tecnicoFormacao, Material), labels em PT

- [x] 7. Refatorizar InstallationsProgrammingCreateView — Fase 1 e Fase 3
  - Design ref: [Frontend — Vistas e Componentes](design.md#5-frontend--vistas-e-componentes) (CreateView) + [Tratamento de Erros](design.md#6-tratamento-de-erros)
  - Covers: REQ-02 (CA-02.1 a CA-02.7), REQ-04 (CA-04.1 a CA-04.11), REQ-07 (CA-07.1, CA-07.2), REQ-09 (CA-09.2 a CA-09.6)
  - Test ref: [MA-07](tests.md#ma--plano-executável) a [MA-14](tests.md#ma--plano-executável), [MA-26](tests.md#ma--plano-executável) a [MA-36](tests.md#ma--plano-executável), [MA-60](tests.md#ma--plano-executável)
  - Done when: Fase 1 com 4 inputs texto + 1 switch (sem campos antigos), Fase 3 com 4 secções visuais incluindo tecnicoFormacao, formData reativo atualizado, touch targets ≥ 44px

- [x] 8. Refatorizar InstallationsProgrammingUpdateView — Fase 1 e Fase 3
  - Design ref: [Frontend — Vistas e Componentes](design.md#5-frontend--vistas-e-componentes) (UpdateView) + [Tratamento de Erros](design.md#6-tratamento-de-erros)
  - Covers: REQ-02 (CA-02.1 a CA-02.7), REQ-04 (CA-04.1 a CA-04.11), REQ-07 (CA-07.1, CA-07.2), REQ-09 (CA-09.2 a CA-09.6)
  - Test ref: [MA-07](tests.md#ma--plano-executável) a [MA-14](tests.md#ma--plano-executável), [MA-26](tests.md#ma--plano-executável) a [MA-36](tests.md#ma--plano-executável), [MA-60](tests.md#ma--plano-executável)
  - Done when: Mesmas alterações que CreateView, `populateFormData()` atualizado para novos campos Phase1Data e Phase3Data, edição funcional

- [x] 9. Substituição direta de dados (migração)
  - Design ref: [Migração de Dados](design.md#7-migração-de-dados)
  - Covers: REQ-02 (CA-02.8), REQ-10 (CA-10.4)
  - Done when: Confirmado que não existem registos antigos em R2, nenhum fallback necessário, tipos e defaults usam apenas formato novo
