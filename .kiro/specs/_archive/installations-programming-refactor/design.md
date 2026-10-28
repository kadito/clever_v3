# Design — Instalações e Programações (Refactor)

## Introdução

Este documento descreve o design técnico para o refactor do content type "Instalações e Programações". O refactor foca-se na reformulação da Fase 1 (novos campos simplificados) e na reorganização da Fase 3 em secções claras, mantendo as Fases 2, 4 e 5 inalteradas.

## 1. Modelo de Dados — Phase1Data (Refactor)

### Campos removidos (Phase1Data atual)

| Campo | Tipo | Motivo da remoção |
|-------|------|-------------------|
| `plus` | `string` | Substituído por `tipoProgramacao` |
| `departamento` | `string` | Não requerido no novo formulário |
| `cabecalho` | `string` | Não requerido no novo formulário |
| `rede` | `string` | Não requerido no novo formulário |
| `vectronConnect` | `string` | Movido para Fase 4 (já existente como teste) |
| `anydesk` | `string` | Movido para Fase 4 (já existente como teste) |
| `seriesEquipamentos` | `string` | Substituído por `numeroSerie` + `numeroEquipamento` |
| `ligacaoCPA` | `boolean` | Não requerido no novo formulário |
| `ligacaoGaveta` | `boolean` | Não requerido no novo formulário |
| `ligacaoImpressoraMonitor` | `boolean` | Não requerido no novo formulário |
| `ligacaoFaturadora` | `boolean` | Não requerido no novo formulário |
| `ligacaoDisplayClientes` | `boolean` | Não requerido no novo formulário |
| `ligacaoScanner` | `boolean` | Não requerido no novo formulário |
| `ligacaoLeitorCartoes` | `boolean` | Não requerido no novo formulário |
| `ligacaoFechaduraChaves` | `boolean` | Não requerido no novo formulário |
| `turnos` | `string` | Não requerido no novo formulário |
| `isVectron` | `boolean` | Não requerido no novo formulário |
| `vectronLeituraX` | `VectronLeituraXData` | Não requerido no novo formulário |
| `vectronConsultaDiaria` | `VectronConsultaDiariaData` | Não requerido no novo formulário |

### Novos campos (Phase1Data refatorizada)

| Campo | Tipo | Obrigatório | Descrição | REQ-ID |
|-------|------|-------------|-----------|--------|
| `tipoProgramacao` | `string` | Não | Tipo de programação do equipamento | CA-02.1 |
| `numeroSerie` | `string` | Não | Número de série do equipamento | CA-02.2 |
| `numeroEquipamento` | `string` | Não | Número do equipamento | CA-02.3 |
| `leiturasGuardadas` | `string` | Não | Registo textual das leituras efetuadas | CA-02.4 |
| `testeFinal` | `boolean` | Não | Teste final a todos os equipamentos e acessórios | CA-02.5 |

### Interface resultante

| Interface | Definição |
|-----------|-----------|
| `Phase1Data` | `{ tipoProgramacao: string; numeroSerie: string; numeroEquipamento: string; leiturasGuardadas: string; testeFinal: boolean }` |

- As sub-interfaces `VectronLeituraXData` e `VectronConsultaDiariaData` são removidas do ficheiro de tipos
- Nenhum campo da Phase1Data é obrigatório para guardar — o formulário permite preenchimento parcial (CA-02.6, CA-02.7)
- A completude da fase para efeitos de progresso é calculada em `calculateCompletedPhases` (ver secção 4)

## 2. Modelo de Dados — Phase3Data (Reorganização em Secções)

A Phase3Data mantém os mesmos campos — a alteração é na organização do formulário frontend em 4 secções claras. A interface TypeScript não muda.

### Mapeamento de campos por secção UI

| Secção UI | Campo | Tipo | Notas | REQ-ID |
|-----------|-------|------|-------|--------|
| Dados Gerais | `clientId` (em `InstallationsProgrammingData`) | `string` | Relação com content type Clientes | CA-04.1 |
| Dados Gerais | `nrFatura` | `string` | — | CA-04.2 |
| Dados Gerais | `nrGuiaTransportes` | `string` | — | CA-04.2 |
| Dados Gerais | `dataInstalacao` | `string` | Formato data | CA-04.3 |
| Dados Gerais | `technician` (em `InstallationsProgrammingData`) | `TechnicianUser` | Auto-atribuído via Clerk | CA-04.4 |
| Detalhes da Instalação | `dataInstalacao` | `string` | Reutilizado de Dados Gerais | CA-04.5 |
| Detalhes da Instalação | `horaInicialInstalacao` | `string` | Formato hora | CA-04.5 |
| Detalhes da Instalação | `horaFinalInstalacao` | `string` | Formato hora | CA-04.5 |
| Formação | `dataFormacao` | `string` | Formato data | CA-04.6 |
| Formação | `horaInicialFormacao` | `string` | Formato hora | CA-04.6 |
| Formação | `horaFinalFormacao` | `string` | Formato hora | CA-04.6 |
| Formação | `quemRecebeuFormacao` | `string` | — | CA-04.7 |
| Formação | `tecnicoFormacao` | `string` | Novo campo — técnico responsável pela formação | CA-04.8 |
| Material Instalado | `materialInstalado.pos` | `boolean` | Switch | CA-04.9 |
| Material Instalado | `materialInstalado.cpa` | `boolean` | Switch | CA-04.9 |
| Material Instalado | `materialInstalado.balanca` | `boolean` | Switch | CA-04.9 |
| Material Instalado | `materialInstalado.cctv` | `boolean` | Switch | CA-04.9 |
| Material Instalado | `materialInstalado.alarme` | `boolean` | Switch | CA-04.9 |
| Material Instalado | `materialInstalado.impressora` | `boolean` | Switch | CA-04.9 |
| Material Instalado | `materialInstalado.ups` | `boolean` | Switch | CA-04.9 |
| Material Instalado | `materialInstalado.router` | `boolean` | Switch | CA-04.9 |
| Material Instalado | `materialInstalado.switchEquip` | `boolean` | Switch | CA-04.9 |
| Material Instalado | `materialInstalado.rolos` | `boolean` | Condicional: mostra `rolosQuantidade` | CA-04.10 |
| Material Instalado | `materialInstalado.rolosQuantidade` | `number` | Visível apenas se `rolos === true` | CA-04.10 |

### Alteração na interface Phase3Data

| Campo | Ação | Tipo | Motivo |
|-------|------|------|--------|
| `tecnicoFormacao` | Adicionar | `string` | CA-04.8 requer campo separado para técnico responsável pela formação (atualmente não existe na interface) |

- Todos os outros campos da Phase3Data permanecem inalterados
- A reorganização em secções é puramente frontend (template Vue) — não afeta a estrutura de dados armazenada em R2

## 3. Constantes e Labels

### PHASE_NAMES — Atualização

| Fase | Valor atual | Novo valor | REQ-ID |
|------|-------------|------------|--------|
| 1 | `'Programação'` | `'Programação / Preparação'` | CA-01.2, CA-08.1 |
| 2 | `'Preparação'` | `'Preparação Instalação'` | CA-01.2, CA-08.1 |
| 3 | `'Instalação no Cliente'` | Sem alteração | — |
| 4 | `'Testes'` | Sem alteração | — |
| 5 | `'Finalização'` | Sem alteração | — |

### Labels da Fase 1 — Novos

| Chave | Label PT | Contexto |
|-------|----------|----------|
| `tipoProgramacao` | `'Tipo de Programação'` | Campo de texto |
| `numeroSerie` | `'Número de Série'` | Campo de texto |
| `numeroEquipamento` | `'Nº Equipamento'` | Campo de texto |
| `leiturasGuardadas` | `'Leituras Guardadas'` | Campo de texto |
| `testeFinal` | `'Teste Final a todos os equipamentos e acessórios'` | Switch |

### Labels da Fase 3 — Secções

| Chave secção | Label PT |
|--------------|----------|
| `dadosGerais` | `'Dados Gerais'` |
| `detalhesInstalacao` | `'Detalhes da Instalação'` |
| `formacao` | `'Formação'` |
| `materialInstalado` | `'Material Instalado'` |
| `tecnicoFormacao` | `'Técnico Responsável pela Formação'` |

- Labels definidos inline nos templates Vue (padrão existente no projeto — não há ficheiro centralizado de labels)
- CHECKLIST_CATEGORIES, CHECKLIST_LABELS, CHECKLIST_CATEGORY_LABELS permanecem inalterados (Fase 2 sem alterações)

## 4. Backend — Validação e Defaults

### defaultPhase1() — Refator

| Estado | Implementação |
|--------|---------------|
| Atual | Retorna objeto com 19 campos (plus, departamento, cabecalho, rede, ligações, vectron, etc.) |
| Novo | `{ tipoProgramacao: '', numeroSerie: '', numeroEquipamento: '', leiturasGuardadas: '', testeFinal: false }` |

### defaultPhase3() — Alteração

| Campo | Ação | Valor default |
|-------|------|---------------|
| `tecnicoFormacao` | Adicionar | `''` |

- Todos os outros defaults da Phase3 permanecem inalterados

### calculateCompletedPhases() — Atualização da lógica Fase 1

| Fase | Critério de completude atual | Novo critério de completude | REQ-ID |
|------|------------------------------|----------------------------|--------|
| 1 | Verifica campos antigos (plus, departamento, etc.) | Pelo menos um campo de texto preenchido (`tipoProgramacao`, `numeroSerie`, `numeroEquipamento`, `leiturasGuardadas`) OU `testeFinal === true` | CA-08.4 |
| 2 | Sem alteração | Sem alteração | — |
| 3 | Sem alteração | Sem alteração | — |
| 4 | Sem alteração | Sem alteração | — |
| 5 | Sem alteração | Sem alteração | — |

### validateCreate() — Alterações

- Inicializar `phase1` com `defaultPhase1()` refatorizado
- Inicializar `phase3` com `defaultPhase3()` incluindo `tecnicoFormacao`
- Restante da lógica inalterada (auto-assign technician, initialize progress)

### validateUpdate() — Alterações

- Merge parcial de `phase1` usa os novos campos
- Merge parcial de `phase3` inclui `tecnicoFormacao`
- Recálculo de `completedPhases` usa nova lógica da Fase 1

### extractSearchableText() / extractIndexFields()

- Sem alterações — já extraem apenas `technician` e `clientId`, que não são afetados pelo refactor

## 5. Frontend — Vistas e Componentes

### Ficheiros impactados

| Ficheiro | Alteração | REQ-IDs |
|----------|-----------|---------|
| `views/installations-programming/InstallationsProgrammingDetailView.vue` | Fase 1: substituir secções "Programação" + "Ligações" + "Turnos" + "Vectron" por secção única com 5 campos novos. Fase 3: reorganizar em 4 secções (Dados Gerais, Detalhes, Formação, Material). Adicionar campo `tecnicoFormacao` na secção Formação | REQ-02, REQ-04 |
| `views/installations-programming/InstallationsProgrammingCreateView.vue` | Fase 1: substituir formulário antigo (campos texto + switches + Vectron condicional) por 4 inputs texto + 1 switch. Fase 3: reorganizar campos em 4 secções visuais. Adicionar input `tecnicoFormacao` | REQ-02, REQ-04, REQ-09 |
| `views/installations-programming/InstallationsProgrammingUpdateView.vue` | Mesmas alterações que CreateView — formulário de edição espelha o de criação | REQ-02, REQ-04, REQ-09 |
| `views/installations-programming/InstallationsProgrammingListView.vue` | Sem alterações — já usa campos genéricos (technician, completedPhases, clientId) | — |
| `components/installations-programming/PhaseNavigation.vue` | Atualizar nomes das fases se hardcoded (verificar se usa PHASE_NAMES da shared) | REQ-08 |
| `components/installations-programming/PhaseChecklist.vue` | Sem alterações — Fase 2 inalterada | — |

### Estrutura do formulário Fase 1 (Create/Update)

| Ordem | Campo | Componente | Props |
|-------|-------|------------|-------|
| 1 | Tipo de Programação | `<input type="text">` | `v-model="form.phase1.tipoProgramacao"` |
| 2 | Número de Série | `<input type="text">` | `v-model="form.phase1.numeroSerie"` |
| 3 | Nº Equipamento | `<input type="text">` | `v-model="form.phase1.numeroEquipamento"` |
| 4 | Leituras Guardadas | `<textarea>` | `v-model="form.phase1.leiturasGuardadas"` |
| 5 | Teste Final | Switch (toggle) | `v-model="form.phase1.testeFinal"` |

### Estrutura do formulário Fase 3 — Secções (Create/Update)

| Secção | Campos | Notas |
|--------|--------|-------|
| Dados Gerais | Cliente (seleção), Nº Fatura, Nº Guia Transporte, Data Instalação, Técnico (auto) | Técnico instalação auto-preenchido via Clerk |
| Detalhes da Instalação | Data, Hora Inicial, Hora Final | Campos de data/hora |
| Formação | Data Formação, Hora Inicial, Hora Final, Quem recebeu, Técnico Formação | `tecnicoFormacao` é input texto (não auto-atribuído) |
| Material Instalado | Switches: POS, CPA, Balança, CCTV, Alarme, Impressora, UPS, Router, Switch + Rolos (condicional: quantidade) | Padrão existente mantido |

### Padrões a seguir

- Composition API (`<script setup>`)
- `useApi<InstallationsProgramming>('installations-programming')` para operações CRUD
- `await api.method().then().catch().finally()` para promises
- Touch targets mínimos 44px em todos os elementos interativos
- Labels em Português de Portugal, código em Inglês
- `JSON.stringify(obj, null, 2)` para logging de objetos

## 6. Tratamento de Erros

### Cenários de erro por interface

| Cenário | Interface | Comportamento | Mensagem PT | REQ-ID |
|---------|-----------|---------------|-------------|--------|
| Cliente selecionado não encontrado | Frontend (Fase 3) | Apresentar erro inline no campo de seleção de cliente | "Cliente não encontrado" | CA-04.11, CA-07.4 |
| Relação clientId inválida na visualização | Frontend (Detail/List) | Usar `isRelationError()` — mostrar texto de erro com estilo vermelho | "Cliente não encontrado" | CA-07.4 |
| Contexto de autenticação indisponível na criação | Backend (validateCreate) | Lançar erro, bloquear criação | "Autenticação necessária para criar registo de instalação" | CA-01.6, RB-09 |
| Teste Anydesk = Não sem motivo preenchido | Frontend (Fase 4) | Destacar campo "Motivo" como obrigatório | Campo destacado visualmente | CA-05.3, RB-02 |
| Teste Vectron = Não sem motivo preenchido | Frontend (Fase 4) | Destacar campo "Motivo" como obrigatório | Campo destacado visualmente | CA-05.6, RB-04 |
| Foto ativada sem URL preenchido | Frontend (Fase 5) | Destacar campo "URL da Drive" como obrigatório | Campo destacado visualmente | CA-06.4, RB-05 |
| Erro de rede ao guardar | Frontend (qualquer fase) | Mostrar erro via componente de erro existente | "Erro ao guardar registo. Verifique a ligação." | REQ-10 |
| Eliminação sem permissão (role User) | Backend (middleware) | Bloquear operação, retornar 403 | "Sem permissão para eliminar" | CA-10.6 |

### Padrão de tratamento

- Erros de validação de campos condicionais: destacar visualmente o campo em falta (border vermelho + label de erro)
- Erros de relação: usar type guards `isRelationError()` da `@clever/shared`
- Erros de API: capturar via `.catch()` no padrão de promises existente
- Erros de autenticação: lançar exceção no backend, frontend redireciona para login

## 7. Migração de Dados

### Estratégia: substituição direta (sem backward compatibility)

- A base de dados R2 em produção está vazia — não existem registos com o formato antigo
- Não é necessário fallback, migração, nem leitura tolerante de campos antigos

### Ações

- Substituir `Phase1Data` diretamente pelos novos campos — sem manter campos antigos
- Remover as sub-interfaces `VectronLeituraXData` e `VectronConsultaDiariaData` do ficheiro de tipos
- `defaultPhase1()` retorna apenas os 5 campos novos
- `calculateCompletedPhases()` verifica apenas os campos novos
- Frontend Detail/Create/Update: apresentar apenas os campos novos — sem fallback para formato antigo
- Não é necessário script de migração
