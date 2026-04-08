# Plano de Aceitação Executável [MA] — Edição Manual dos Benefícios do Plano

| Test ID | CA-ID | Given / When / Then | Dados | Critério de passagem |
|---------|-------|---------------------|-------|---------------------|
| T-01 | CA-01.1.1 | Given: formulário criação CPA ativo / When: utilizador vê secção benefícios / Then: campo horas é input editável | Secção CPA ativa | Campo aceita input numérico |
| T-02 | CA-01.1.2 | Given: formulário criação CPA ativo / When: utilizador vê secção benefícios / Then: campo deslocações é input editável | Secção CPA ativa | Campo aceita input numérico |
| T-03 | CA-01.1.3 | Given: formulário criação CPA ativo / When: utilizador vê secção benefícios / Then: campo manutenções é input editável | Secção CPA ativa | Campo aceita input numérico |
| T-04 | CA-01.1.4 | Given: formulário edição CPA ativo / When: utilizador vê secção benefícios / Then: 3 campos editáveis | Contrato existente com CPA | Campos aceitam novos valores |
| T-05 | CA-01.2.1 | Given: horas CPA alteradas para 20 / When: submete formulário / Then: valor guardado = 20 | horasAssistenciaAnualCPA = 20 | Valor no R2 = 20 |
| T-06 | CA-01.2.2 | Given: deslocações CPA alteradas para 5 / When: submete formulário / Then: valor guardado = 5 | deslocacoesPorAnoCPA = 5 | Valor no R2 = 5 |
| T-07 | CA-01.2.3 | Given: manutenções CPA alteradas para 4 / When: submete formulário / Then: valor guardado = 4 | manutencoesPorAnoCPA = 4 | Valor no R2 = 4 |
| T-08 | CA-02.1.1 | Given: formulário criação S&H ativo / When: utilizador vê secção benefícios / Then: campo horas é input editável | Secção S&H ativa | Campo aceita input numérico |
| T-09 | CA-02.1.2 | Given: formulário criação S&H ativo / When: utilizador vê secção benefícios / Then: campo deslocações é input editável | Secção S&H ativa | Campo aceita input numérico |
| T-10 | CA-02.1.3 | Given: formulário criação S&H ativo / When: utilizador vê secção benefícios / Then: campo manutenções é input editável | Secção S&H ativa | Campo aceita input numérico |
| T-11 | CA-02.1.4 | Given: formulário edição S&H ativo / When: utilizador vê secção benefícios / Then: 3 campos editáveis | Contrato existente com S&H | Campos aceitam novos valores |
| T-12 | CA-02.2.1 | Given: horas S&H alteradas para 25 / When: submete formulário / Then: valor guardado = 25 | horasAssistenciaAnualSH = 25 | Valor no R2 = 25 |
| T-13 | CA-02.2.2 | Given: deslocações S&H alteradas para 6 / When: submete formulário / Then: valor guardado = 6 | deslocacoesPorAnoSH = 6 | Valor no R2 = 6 |
| T-14 | CA-02.2.3 | Given: manutenções S&H alteradas para 3 / When: submete formulário / Then: valor guardado = 3 | manutencoesPorAnoSH = 3 | Valor no R2 = 3 |
| T-15 | CA-03.1.1 | Given: CPA sem plano / When: seleciona Professional Care / Then: manutenções preenchidas | Plano Professional Care CPA | Campo = valor do plano |
| T-16 | CA-03.1.2 | Given: CPA sem plano / When: seleciona Professional Care (2023) / Then: deslocações = -1 | Plano Professional Care CPA 2023 | Campo = -1 |
| T-17 | CA-03.1.3 | Given: CPA sem plano / When: seleciona plano CPA / Then: horas preenchidas | Qualquer plano CPA | Campo = valor do plano |
| T-18 | CA-03.1.4 | Given: campos CPA pré-preenchidos / When: clica no campo / Then: campo editável | Plano CPA selecionado | Campo aceita novos valores |
| T-19 | CA-03.2.1 | Given: S&H sem plano / When: seleciona Gold / Then: horas = 15 | Plano Gold S&H | Campo = 15 |
| T-20 | CA-03.2.2 | Given: S&H sem plano / When: seleciona Gold / Then: deslocações = 3 | Plano Gold S&H | Campo = 3 |
| T-21 | CA-03.2.3 | Given: S&H sem plano / When: seleciona Gold / Then: manutenções preenchidas | Plano Gold S&H | Campo = valor do plano |
| T-22 | CA-03.2.4 | Given: campos S&H pré-preenchidos / When: clica no campo / Then: campo editável | Plano S&H selecionado | Campo aceita novos valores |
| T-23 | CA-03.3.1 | Given: CPA com valores manuais (horas=20) / When: muda plano / Then: campos atualizados | Mudança de plano CPA | Campos = valores do novo plano |
| T-24 | CA-03.3.2 | Given: benefícios com valores manuais / When: muda plano / Then: valores manuais substituídos | Mudança de plano | Valores anteriores perdidos |
| T-25 | CA-04.1.1 | Given: campo editável / When: introduz 5 / Then: aceite | Valor = 5 | Sem erro |
| T-26 | CA-04.1.2 | Given: campo editável / When: introduz -1 / Then: aceite como ilimitado | Valor = -1 | Sem erro |
| T-27 | CA-04.1.3 | Given: campo editável / When: introduz -3 / Then: erro | Valor = -3 | Mensagem de erro visível |
| T-28 | CA-04.1.4 | Given: campo editável / When: introduz "abc" / Then: erro | Valor = "abc" | Mensagem de erro visível |
| T-29 | CA-04.2.1 | Given: campo com valor inválido / When: erro apresentado / Then: mensagem em PT | Valor inválido | Mensagem em Português |
| T-30 | CA-04.2.2 | Given: campo com valor inválido / When: erro apresentado / Then: junto ao campo | Valor inválido | Erro posicionado junto ao campo |
| T-31 | CA-04.2.3 | Given: campo com erro visível / When: corrige valor / Then: erro desaparece | Valor corrigido | Sem mensagem de erro |
| T-32 | CA-04.3.1 | Given: formulário com campo inválido / When: tenta submeter / Then: bloqueado | Campo com valor -3 | Formulário não submetido |
| T-33 | CA-04.3.2 | Given: formulário com campo inválido / When: tenta submeter / Then: campos destacados | Campo com valor inválido | Destaque visual nos campos |

---

## [MI] — Estratégia de Testes de Integração

| Interface | Âmbito do teste | Dependências mockadas | REQ-ID |
|-----------|----------------|----------------------|--------|
| `BenefitFieldsGroup.vue` | Componente renderiza 3 inputs editáveis, valida valores inline, emite eventos de atualização | Nenhuma (componente puro) | REQ-01.1, REQ-02.1, REQ-04 |
| `CPAContractSection.vue` com `BenefitFieldsGroup` | Secção CPA integra BenefitFieldsGroup, propaga `update-field` com campos CPA corretos | `formData` (prop mockada) | REQ-01.1, REQ-01.2 |
| `SHContractSection.vue` com `BenefitFieldsGroup` | Secção S&H integra BenefitFieldsGroup, propaga `update-field` com campos S&H corretos | `formData` (prop mockada) | REQ-02.1, REQ-02.2 |
| `handleCPAPlanSelection` (ContractsCreateView) | Seleção de plano CPA popula os 3 campos de benefícios CPA via `updateFieldValue` | `getPlanDetails` (mock do serviço planSelection) | REQ-03.1, REQ-03.3 |
| `handleSHPlanSelection` (ContractsCreateView) | Seleção de plano S&H popula os 3 campos de benefícios S&H via `updateFieldValue` | `getPlanDetails` (mock do serviço planSelection) | REQ-03.2, REQ-03.3 |
| `validateContractCreate` / `validateContractUpdate` | Validação de submissão rejeita valores inválidos nos campos de benefícios e aceita valores válidos (≥0 e -1) | Nenhuma (função pura) | REQ-04.1, REQ-04.3 |

---

## [MI] — Plano Executável

| Test ID | Interface | Comportamento | Dados de entrada | Resultado esperado | REQ-ID |
|---------|-----------|---------------|-----------------|-------------------|--------|
| MI-01 | `BenefitFieldsGroup.vue` | Renderiza 3 inputs numéricos editáveis | Props: horas=10, deslocações=5, manutenções=2 | 3 inputs `type="number"` com valores 10, 5, 2 | REQ-01.1, REQ-02.1 |
| MI-02 | `BenefitFieldsGroup.vue` | Emite evento ao alterar campo horas | Utilizador altera horas para 20 | Emit `update:horasAssistencia` com valor 20 | REQ-01.1, REQ-02.1 |
| MI-03 | `BenefitFieldsGroup.vue` | Emite evento ao alterar campo deslocações | Utilizador altera deslocações para -1 | Emit `update:deslocacoesPorAno` com valor -1 | REQ-01.1, REQ-02.1 |
| MI-04 | `BenefitFieldsGroup.vue` | Emite evento ao alterar campo manutenções | Utilizador altera manutenções para 4 | Emit `update:manutencoesPorAno` com valor 4 | REQ-01.1, REQ-02.1 |
| MI-05 | `BenefitFieldsGroup.vue` | Mostra erro para valor negativo ≠ -1 | Utilizador introduz -3 | Mensagem "O valor deve ser 0 ou superior, ou -1 para ilimitado" visível | REQ-04.1 |
| MI-06 | `BenefitFieldsGroup.vue` | Mostra erro para valor não numérico | Utilizador introduz "abc" | Mensagem "Introduza um valor numérico válido" visível | REQ-04.1 |
| MI-07 | `BenefitFieldsGroup.vue` | Mostra erro para campo vazio | Campo fica vazio | Mensagem "Este campo é obrigatório" visível | REQ-04.1 |
| MI-08 | `BenefitFieldsGroup.vue` | Erro desaparece ao corrigir valor | Valor inválido → corrigido para 5 | Mensagem de erro desaparece | REQ-04.2 |
| MI-09 | `BenefitFieldsGroup.vue` | Campos desativados quando disabled=true | Prop disabled=true | 3 inputs com atributo disabled | REQ-01.1 |
| MI-10 | `BenefitFieldsGroup.vue` | Aceita valor 0 sem erro | Utilizador introduz 0 | Sem mensagem de erro | REQ-04.1 |
| MI-11 | `BenefitFieldsGroup.vue` | Aceita valor -1 sem erro | Utilizador introduz -1 | Sem mensagem de erro | REQ-04.1 |
| MI-12 | `CPAContractSection.vue` | Renderiza BenefitFieldsGroup com campos CPA | formData com horasAssistenciaAnualCPA=10 | BenefitFieldsGroup presente com prop horasAssistencia=10 | REQ-01.1 |
| MI-13 | `CPAContractSection.vue` | Propaga update-field ao alterar benefício CPA | BenefitFieldsGroup emite update:horasAssistencia=20 | Emit `update-field` com ('horasAssistenciaAnualCPA', 20) | REQ-01.2 |
| MI-14 | `CPAContractSection.vue` | Campos desativados sem plano CPA selecionado | formData.planIdCPA = '' | BenefitFieldsGroup com disabled=true | REQ-01.1 |
| MI-15 | `SHContractSection.vue` | Renderiza BenefitFieldsGroup com campos S&H | formData com horasAssistenciaAnualSH=15 | BenefitFieldsGroup presente com prop horasAssistencia=15 | REQ-02.1 |
| MI-16 | `SHContractSection.vue` | Propaga update-field ao alterar benefício S&H | BenefitFieldsGroup emite update:deslocacoesPorAno=6 | Emit `update-field` com ('deslocacoesPorAnoSH', 6) | REQ-02.2 |
| MI-17 | `SHContractSection.vue` | Campos desativados sem plano S&H selecionado | formData.planIdSH = '' | BenefitFieldsGroup com disabled=true | REQ-02.1 |
| MI-18 | `validateContractCreate` | Aceita valores válidos (≥0) nos benefícios | horasAssistenciaAnualCPA=10, deslocacoesPorAnoCPA=5, manutencoesPorAnoCPA=2 | Sem erros de benefícios | REQ-04.1 |
| MI-19 | `validateContractCreate` | Aceita -1 como ilimitado | deslocacoesPorAnoCPA=-1 | Sem erros de benefícios | REQ-04.1 |
| MI-20 | `validateContractCreate` | Rejeita valor negativo ≠ -1 | deslocacoesPorAnoCPA=-3 | Erro de validação presente | REQ-04.1, REQ-04.3 |
| MI-21 | `validateContractUpdate` | Aceita valores válidos nos benefícios S&H | horasAssistenciaAnualSH=25, deslocacoesPorAnoSH=-1, manutencoesPorAnoSH=3 | Sem erros de benefícios | REQ-04.1 |

---

## [MA] — Plano Executável

| Test ID | CA-ID | Given / When / Then | Dados | Critério de passagem |
|---------|-------|---------------------|-------|---------------------|
| MA-01 | CA-01.1.1 | Given: formulário criação CPA ativo / When: utilizador vê secção benefícios / Then: campo "Horas de Assistência Anual" é input numérico editável | Secção CPA ativa, plano selecionado | Input type="number" presente e editável |
| MA-02 | CA-01.1.2 | Given: formulário criação CPA ativo / When: utilizador vê secção benefícios / Then: campo "Deslocações por Ano" é input numérico editável | Secção CPA ativa, plano selecionado | Input type="number" presente e editável |
| MA-03 | CA-01.1.3 | Given: formulário criação CPA ativo / When: utilizador vê secção benefícios / Then: campo "Manutenções por Ano" é input numérico editável | Secção CPA ativa, plano selecionado | Input type="number" presente e editável |
| MA-04 | CA-01.1.4 | Given: formulário edição CPA ativo / When: utilizador vê secção benefícios / Then: 3 campos editáveis com valores do contrato | Contrato existente com CPA | Campos mostram valores existentes e aceitam edição |
| MA-05 | CA-01.2.1 | Given: horas CPA alteradas para 20 / When: submete formulário / Then: valor guardado = 20 | horasAssistenciaAnualCPA = 20 | Contrato no R2 contém horasAssistenciaAnualCPA = 20 |
| MA-06 | CA-01.2.2 | Given: deslocações CPA alteradas para 5 / When: submete formulário / Then: valor guardado = 5 | deslocacoesPorAnoCPA = 5 | Contrato no R2 contém deslocacoesPorAnoCPA = 5 |
| MA-07 | CA-01.2.3 | Given: manutenções CPA alteradas para 4 / When: submete formulário / Then: valor guardado = 4 | manutencoesPorAnoCPA = 4 | Contrato no R2 contém manutencoesPorAnoCPA = 4 |
| MA-08 | CA-02.1.1 | Given: formulário criação S&H ativo / When: utilizador vê secção benefícios / Then: campo "Horas de Assistência Anual" é input numérico editável | Secção S&H ativa, plano selecionado | Input type="number" presente e editável |
| MA-09 | CA-02.1.2 | Given: formulário criação S&H ativo / When: utilizador vê secção benefícios / Then: campo "Deslocações por Ano" é input numérico editável | Secção S&H ativa, plano selecionado | Input type="number" presente e editável |
| MA-10 | CA-02.1.3 | Given: formulário criação S&H ativo / When: utilizador vê secção benefícios / Then: campo "Manutenções por Ano" é input numérico editável | Secção S&H ativa, plano selecionado | Input type="number" presente e editável |
| MA-11 | CA-02.1.4 | Given: formulário edição S&H ativo / When: utilizador vê secção benefícios / Then: 3 campos editáveis com valores do contrato | Contrato existente com S&H | Campos mostram valores existentes e aceitam edição |
| MA-12 | CA-02.2.1 | Given: horas S&H alteradas para 25 / When: submete formulário / Then: valor guardado = 25 | horasAssistenciaAnualSH = 25 | Contrato no R2 contém horasAssistenciaAnualSH = 25 |
| MA-13 | CA-02.2.2 | Given: deslocações S&H alteradas para 6 / When: submete formulário / Then: valor guardado = 6 | deslocacoesPorAnoSH = 6 | Contrato no R2 contém deslocacoesPorAnoSH = 6 |
| MA-14 | CA-02.2.3 | Given: manutenções S&H alteradas para 3 / When: submete formulário / Then: valor guardado = 3 | manutencoesPorAnoSH = 3 | Contrato no R2 contém manutencoesPorAnoSH = 3 |
| MA-15 | CA-03.1.1 | Given: CPA sem plano / When: seleciona Professional Care / Then: manutenções preenchidas com valor do plano | Plano Professional Care CPA | Campo manutencoesPorAnoCPA = maintenancePerYear do plano |
| MA-16 | CA-03.1.2 | Given: CPA sem plano / When: seleciona Professional Care (2023) / Then: deslocações = -1 | Plano Professional Care CPA 2023 | Campo deslocacoesPorAnoCPA = -1 |
| MA-17 | CA-03.1.3 | Given: CPA sem plano / When: seleciona plano CPA / Then: horas preenchidas | Qualquer plano CPA | Campo horasAssistenciaAnualCPA = 0 (padrão CPA) |
| MA-18 | CA-03.1.4 | Given: campos CPA pré-preenchidos / When: clica num campo / Then: campo editável | Plano CPA selecionado | Campo aceita novos valores numéricos |
| MA-19 | CA-03.2.1 | Given: S&H sem plano / When: seleciona Gold / Then: horas = 15 | Plano Gold S&H | Campo horasAssistenciaAnualSH = 15 |
| MA-20 | CA-03.2.2 | Given: S&H sem plano / When: seleciona Gold / Then: deslocações = 3 | Plano Gold S&H | Campo deslocacoesPorAnoSH = 3 |
| MA-21 | CA-03.2.3 | Given: S&H sem plano / When: seleciona Gold / Then: manutenções preenchidas | Plano Gold S&H | Campo manutencoesPorAnoSH = 0 (padrão S&H) |
| MA-22 | CA-03.2.4 | Given: campos S&H pré-preenchidos / When: clica num campo / Then: campo editável | Plano S&H selecionado | Campo aceita novos valores numéricos |
| MA-23 | CA-03.3.1 | Given: CPA com valores manuais (horas=20) / When: muda plano / Then: campos atualizados | Mudança de plano CPA | Campos = valores do novo plano |
| MA-24 | CA-03.3.2 | Given: benefícios com valores manuais / When: muda plano / Then: valores manuais substituídos | Mudança de plano | Valores anteriores perdidos, novos = plano |
| MA-25 | CA-04.1.1 | Given: campo editável / When: introduz 5 / Then: aceite | Valor = 5 | Sem mensagem de erro |
| MA-26 | CA-04.1.2 | Given: campo editável / When: introduz -1 / Then: aceite como ilimitado | Valor = -1 | Sem mensagem de erro |
| MA-27 | CA-04.1.3 | Given: campo editável / When: introduz -3 / Then: erro | Valor = -3 | Mensagem "O valor deve ser 0 ou superior, ou -1 para ilimitado" |
| MA-28 | CA-04.1.4 | Given: campo editável / When: introduz "abc" / Then: erro | Valor = "abc" | Mensagem "Introduza um valor numérico válido" |
| MA-29 | CA-04.2.1 | Given: campo com valor inválido / When: erro apresentado / Then: mensagem em PT | Valor inválido | Mensagem em Português de Portugal |
| MA-30 | CA-04.2.2 | Given: campo com valor inválido / When: erro apresentado / Then: junto ao campo | Valor inválido | Erro posicionado imediatamente abaixo do campo |
| MA-31 | CA-04.2.3 | Given: campo com erro visível / When: corrige valor para 5 / Then: erro desaparece | Valor corrigido de -3 para 5 | Mensagem de erro removida |
| MA-32 | CA-04.3.1 | Given: formulário com campo inválido / When: tenta submeter / Then: bloqueado | Campo com valor -3 | Formulário não submetido, erros apresentados |
| MA-33 | CA-04.3.2 | Given: formulário com campo inválido / When: tenta submeter / Then: campos destacados | Campo com valor inválido | Campos inválidos com borda vermelha |
