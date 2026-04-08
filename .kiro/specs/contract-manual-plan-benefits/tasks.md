# Tarefas — Edição Manual dos Benefícios do Plano de Contrato

- [x] 1. Criar componente BenefitFieldsGroup.vue
  - Design ref: [Componente BenefitFieldsGroup — interface e comportamento](design.md#3-componente-benefitfieldsgroup--interface-e-comportamento) + [Validação — regras e mensagens de erro](design.md#6-validação--regras-e-mensagens-de-erro) + [Tratamento de erros](design.md#8-tratamento-de-erros)
  - Covers: REQ-01.1, REQ-02.1, REQ-04.1, REQ-04.2
  - Test ref: [MI-01](tests.md#mi--plano-executável) a [MI-11](tests.md#mi--plano-executável), [MA-25](tests.md#ma--plano-executável) a [MA-31](tests.md#ma--plano-executável)
  - Done when: componente renderiza 3 inputs numéricos editáveis com labels PT, valida inline (≥0 ou -1), mostra/esconde mensagens de erro em PT, emite eventos update:horasAssistencia / update:deslocacoesPorAno / update:manutencoesPorAno, suporta prop disabled

- [x] 2. Integrar BenefitFieldsGroup em CPAContractSection.vue
  - Design ref: [Integração nos componentes de secção (CPA + S&H)](design.md#4-integração-nos-componentes-de-secção-cpa--sh)
  - Covers: REQ-01.1, REQ-01.2, REQ-03.1, REQ-03.3
  - Test ref: [MI-12](tests.md#mi--plano-executável) a [MI-14](tests.md#mi--plano-executável), [MA-01](tests.md#ma--plano-executável) a [MA-07](tests.md#ma--plano-executável), [MA-15](tests.md#ma--plano-executável) a [MA-18](tests.md#ma--plano-executável), [MA-23](tests.md#ma--plano-executável)
  - Done when: BenefitFieldsGroup aparece na secção CPA após ContractDatesSection, props ligadas a formData.horasAssistenciaAnualCPA / deslocacoesPorAnoCPA / manutencoesPorAnoCPA, emits propagam update-field com nomes de campo CPA, disabled quando planIdCPA vazio

- [x] 3. Integrar BenefitFieldsGroup em SHContractSection.vue
  - Design ref: [Integração nos componentes de secção (CPA + S&H)](design.md#4-integração-nos-componentes-de-secção-cpa--sh)
  - Covers: REQ-02.1, REQ-02.2, REQ-03.2, REQ-03.3
  - Test ref: [MI-15](tests.md#mi--plano-executável) a [MI-17](tests.md#mi--plano-executável), [MA-08](tests.md#ma--plano-executável) a [MA-14](tests.md#ma--plano-executável), [MA-19](tests.md#ma--plano-executável) a [MA-22](tests.md#ma--plano-executável), [MA-24](tests.md#ma--plano-executável)
  - Done when: BenefitFieldsGroup aparece na secção S&H após ContractDatesSection, props ligadas a formData.horasAssistenciaAnualSH / deslocacoesPorAnoSH / manutencoesPorAnoSH, emits propagam update-field com nomes de campo S&H, disabled quando planIdSH vazio

- [x] 4. Adicionar validação de benefícios na submissão (Create + Update)
  - Design ref: [Persistência — Create e Update views](design.md#7-persistência--create-e-update-views) + [Validação — regras e mensagens de erro](design.md#6-validação--regras-e-mensagens-de-erro)
  - Covers: REQ-04.1, REQ-04.3, REQ-01.2, REQ-02.2
  - Test ref: [MI-18](tests.md#mi--plano-executável) a [MI-21](tests.md#mi--plano-executável), [MA-32](tests.md#ma--plano-executável), [MA-33](tests.md#ma--plano-executável)
  - Done when: validateContractCreate e validateContractUpdate verificam que os 3 campos CPA (se CPA ativo) e os 3 campos S&H (se S&H ativo) são inteiros ≥0 ou -1, submissão bloqueada com campos inválidos destacados
