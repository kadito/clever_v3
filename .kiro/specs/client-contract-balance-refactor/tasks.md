# Tasks — Refactor Relação Cliente↔Contrato e Sistema de Saldo

## 1. Tipo ClientData + relação contratoId

- [x] 1.1. Alterar tipo `ClientData` — remover campos legacy, adicionar `contratoId`
  - Design ref: [Alterações ao tipo ClientData](design.md#11-alterações-ao-tipo-clientdata)
  - Covers: REQ-01.2, CA-01.2.1
  - Test ref: [MA-04](tests.md#ma--executable-plan)
  - Done when: tipo `ClientData` tem campo `contratoId` (string, opcional); campos `contratos`, `contrato`, `contratoCPA`, `contratoSoftware`, `dataInicio`, `dataTermino` removidos; `CreateClientInput` sem `contratos`

- [x] 1.2. Configurar relação Cliente→Contrato no `CONTENT_RELATION_CONFIGS`
  - Design ref: [Alterações ao CONTENT_RELATION_CONFIGS](design.md#81-alterações-ao-content_relation_configs)
  - Covers: REQ-01.2, CA-01.2.2
  - Test ref: [MI-35, MI-36](tests.md#mi--executable-plan), [MA-05](tests.md#ma--executable-plan)
  - Done when: `CONTENT_RELATION_CONFIGS.clients` inclui entrada para `contratoId` → `contracts`; API de clientes resolve `relations.contratoId`

## 2. Validação 1:1 no backend

- [x] 2.1. Adicionar validação de unicidade na criação de contrato (POST contracts)
  - Design ref: [Validação no backend (API)](design.md#21-validação-no-backend-api)
  - Covers: REQ-01.1, CA-01.1.1, CA-01.1.2
  - Test ref: [MI-01, MI-02, MI-03](tests.md#mi--executable-plan), [MA-01, MA-02](tests.md#ma--executable-plan)
  - Done when: POST /api/content/contracts rejeita com HTTP 400 e mensagem PT quando cliente já tem contrato ativo; contratos com `isDeleted=true` são ignorados

- [x] 2.2. Sincronizar campo `contratoId` no cliente ao criar/eliminar contrato
  - Design ref: [Sincronização do campo contratoId no cliente](design.md#23-sincronização-do-campo-contratoid-no-cliente)
  - Covers: REQ-01.2, CA-01.2.1, CA-01.2.2
  - Test ref: [MI-04, MI-05](tests.md#mi--executable-plan)
  - Done when: criação de contrato → `contratoId` atualizado no cliente; eliminação (soft delete) → `contratoId = undefined` no cliente

## 3. Resolução automática de contrato no backend

- [x] 3.1. Implementar resolução automática de `contractId` na rota de folhas de obra
  - Design ref: [Fluxo de resolução no backend](design.md#31-fluxo-de-resolução-no-backend)
  - Covers: REQ-04.1, REQ-04.2, CA-04.1.1, CA-04.1.3
  - Test ref: [MI-06, MI-07, MI-08, MI-09](tests.md#mi--executable-plan), [MA-36](tests.md#ma--executable-plan)
  - Done when: POST work-sheets resolve `contractId` a partir do `contratoId` do cliente; ignora `contractId` do body; rejeita pagamento CONTRATO sem contrato ativo

- [x] 3.2. Implementar resolução automática de `contractId` na rota de assistências remotas
  - Design ref: [Fluxo de resolução no backend](design.md#31-fluxo-de-resolução-no-backend)
  - Covers: REQ-04.1, REQ-04.3, CA-04.1.2, CA-04.1.3
  - Test ref: [MI-10, MI-11, MI-12](tests.md#mi--executable-plan), [MA-35](tests.md#ma--executable-plan)
  - Done when: POST remote-assistance resolve `contractId` a partir do `contratoId` do cliente; rejeita pagamento Contrato sem contrato ativo

## 4. Renovação de contrato no backend

- [x] 4.1. Implementar lógica de renovação no PUT contracts — deteção de alteração de recursos e transação ADD
  - Design ref: [Regras de transação na renovação](design.md#42-regras-de-transação-na-renovação)
  - Covers: REQ-02.1, REQ-02.2, REQ-02.3, CA-02.1.1, CA-02.1.2, CA-02.1.3, CA-02.2.1, CA-02.2.2, CA-02.2.3, CA-02.2.4, CA-02.3.1, CA-02.3.2
  - Test ref: [MI-15, MI-16, MI-17](tests.md#mi--executable-plan), [MA-12, MA-13, MA-14, MA-15, MA-16, MA-17, MA-18, MA-19, MA-20](tests.md#ma--executable-plan)
  - Done when: PUT contracts compara recursos antigos vs novos; cria transação ADD com source "contract-renovation" quando recursos alterados; não cria transação quando apenas datas mudam; UUID do contrato mantém-se

## 5. Transações e validação de saldo

- [x] 5.1. Implementar transação ADD na criação de contrato
  - Design ref: [Tipos de transação](design.md#51-tipos-de-transação)
  - Covers: REQ-03.1, REQ-03.2, CA-03.1.1, CA-03.1.2, CA-03.1.3, CA-03.2.1, CA-03.2.2
  - Test ref: [MI-13, MI-14](tests.md#mi--executable-plan), [MA-24, MA-25](tests.md#ma--executable-plan)
  - Done when: criação de contrato gera transação ADD com recursos CPA+S&H somados; índice de saldo criado/atualizado

- [x] 5.2. Implementar transação DEBT por folha de obra segundo regras de pagamento
  - Design ref: [Regras por método de pagamento](design.md#32-regras-por-método-de-pagamento)
  - Covers: REQ-04.2, CA-04.2.1, CA-04.2.2, CA-04.2.3, CA-04.2.4
  - Test ref: [MI-18, MI-19, MI-20, MI-21](tests.md#mi--executable-plan), [MA-37, MA-38, MA-39, MA-40](tests.md#ma--executable-plan)
  - Done when: pagamento CONTRATO → DEBT consome manutenção + deslocação; Garantia → sem transação; outros → DEBT adiciona valor à dívida; sourceId = UUID da folha de obra

- [x] 5.3. Implementar transação DEBT por assistência remota segundo regras de pagamento
  - Design ref: [Regras por método de pagamento](design.md#32-regras-por-método-de-pagamento)
  - Covers: REQ-04.3, CA-04.3.1, CA-04.3.2, CA-04.3.3, CA-04.3.4
  - Test ref: [MI-22, MI-23, MI-24](tests.md#mi--executable-plan), [MA-41, MA-42, MA-43, MA-44](tests.md#ma--executable-plan)
  - Done when: pagamento Contrato → DEBT consome horas; Garantia → sem transação; outros → DEBT adiciona valor à dívida; sourceId = UUID da assistência remota

- [x] 5.4. Implementar validação de recursos disponíveis antes de transação DEBT
  - Design ref: [Validação antes de transação DEBT](design.md#53-validação-antes-de-transação-debt)
  - Covers: REQ-04.4, CA-04.4.1, CA-04.4.2, CA-04.4.3, CA-04.4.4
  - Test ref: [MI-25, MI-26, MI-27, MI-28, MI-29](tests.md#mi--executable-plan), [MA-45, MA-46, MA-47, MA-48](tests.md#ma--executable-plan)
  - Done when: transação rejeitada quando recursos insuficientes; ilimitado (-1) nunca rejeitado; conteúdo não criado se transação rejeitada; mensagem em PT

## 6. Validação 1:1 no frontend

- [x] 6.1. Adicionar verificação em tempo real no formulário de criação de contrato
  - Design ref: [Formulário de criação de contrato — Validação 1:1](design.md#74-formulário-de-criação-de-contrato--validação-11)
  - Covers: REQ-01.4, CA-01.4.1, CA-01.4.2, CA-01.4.3
  - Test ref: [MA-03, MA-09, MA-10, MA-11](tests.md#ma--executable-plan)
  - Done when: ao selecionar cliente com contrato ativo → banner amarelo + botão desativado; ao mudar para cliente sem contrato → aviso desaparece + botão reativado

## 7. Secção Contrato e Saldo no ClientsDetailView

- [x] 7.1. Adicionar secção "Contrato" no detalhe do cliente
  - Design ref: [Secção Contrato no detalhe do cliente](design.md#72-secção-contrato-no-detalhe-do-cliente)
  - Covers: REQ-01.3, CA-01.3.1, CA-01.3.2, CA-01.3.3
  - Test ref: [MA-06, MA-07, MA-08](tests.md#ma--executable-plan)
  - Done when: cliente com contrato → card com tipo, plano, datas, link para detalhe; sem contrato → "Sem contrato ativo" + botão "Criar Contrato"

- [x] 7.2. Adicionar secção "Saldo" no detalhe do cliente
  - Design ref: [Secção Saldo no detalhe do cliente](design.md#73-secção-saldo-no-detalhe-do-cliente)
  - Covers: REQ-03.3, CA-03.3.1, CA-03.3.2, CA-03.3.3, CA-03.3.4, CA-03.3.5
  - Test ref: [MA-27, MA-28, MA-29, MA-30, MA-31](tests.md#ma--executable-plan)
  - Done when: dívida em €, manutenções, deslocações e horas visíveis; aviso amarelo quando < 20%; ilimitado mostra "Ilimitado"; sem contrato mostra zeros; botão "Recalcular saldo" visível apenas para Admin

## 8. Remoção do campo contractId nos formulários

- [x] 8.1. Remover campo de seleção de contrato nos formulários de folhas de obra
  - Design ref: [Remoção do campo contractId nos formulários](design.md#75-remoção-do-campo-contractid-nos-formulários)
  - Covers: REQ-04.1, CA-04.1.1
  - Test ref: [MA-34](tests.md#ma--executable-plan)
  - Done when: `WorkSheetsCreateView` e `WorkSheetsUpdateView` sem campo `contractId`; sem referência a `ContractSearchInput` nestes formulários

- [x] 8.2. Remover campo de seleção de contrato nos formulários de assistências remotas
  - Design ref: [Remoção do campo contractId nos formulários](design.md#75-remoção-do-campo-contractid-nos-formulários)
  - Covers: REQ-04.1, CA-04.1.2
  - Test ref: [MA-35](tests.md#ma--executable-plan)
  - Done when: `RemoteAssistanceCreateView` e `RemoteAssistanceUpdateView` sem campo `contractId`; sem referência a `ContractSearchInput` nestes formulários

## 9. Testes de integração [MI]

- [ ] 9.1. Testes MI — Validação 1:1 e sincronização contratoId
  - Design ref: [Validação no backend (API)](design.md#21-validação-no-backend-api)
  - Covers: REQ-01.1, REQ-01.2
  - Test ref: [MI-01, MI-02, MI-03, MI-04, MI-05, MI-35, MI-36](tests.md#mi--executable-plan)
  - Done when: testes MI-01 a MI-05, MI-35, MI-36 passam

- [ ] 9.2. Testes MI — Resolução automática de contrato
  - Design ref: [Fluxo de resolução no backend](design.md#31-fluxo-de-resolução-no-backend)
  - Covers: REQ-04.1, REQ-04.2, REQ-04.3
  - Test ref: [MI-06, MI-07, MI-08, MI-09, MI-10, MI-11, MI-12](tests.md#mi--executable-plan)
  - Done when: testes MI-06 a MI-12 passam

- [ ] 9.3. Testes MI — Transações ADD e DEBT
  - Design ref: [Tipos de transação](design.md#51-tipos-de-transação)
  - Covers: REQ-02.2, REQ-03.2, REQ-04.2, REQ-04.3
  - Test ref: [MI-13, MI-14, MI-15, MI-16, MI-17, MI-18, MI-19, MI-20, MI-21, MI-22, MI-23, MI-24](tests.md#mi--executable-plan)
  - Done when: testes MI-13 a MI-24 passam

- [ ] 9.4. Testes MI — Validação de recursos e cálculo de saldo
  - Design ref: [Validação antes de transação DEBT](design.md#53-validação-antes-de-transação-debt)
  - Covers: REQ-03.4, REQ-04.4
  - Test ref: [MI-25, MI-26, MI-27, MI-28, MI-29, MI-30, MI-31, MI-32, MI-33, MI-34](tests.md#mi--executable-plan)
  - Done when: testes MI-25 a MI-34 passam

## 10. Testes de aceitação [MA]

- [ ] 10.1. Testes MA — Relação 1:1 Cliente↔Contrato (REQ-01)
  - Design ref: [Validação 1:1 — Unicidade de contrato por cliente](design.md#2-validação-11--unicidade-de-contrato-por-cliente)
  - Covers: REQ-01.1, REQ-01.2, REQ-01.3, REQ-01.4
  - Test ref: [MA-01 a MA-11](tests.md#ma--executable-plan)
  - Done when: testes MA-01 a MA-11 passam

- [ ] 10.2. Testes MA — Renovação de contrato (REQ-02)
  - Design ref: [Renovação de contrato](design.md#4-renovação-de-contrato)
  - Covers: REQ-02.1, REQ-02.2, REQ-02.3
  - Test ref: [MA-12 a MA-20](tests.md#ma--executable-plan)
  - Done when: testes MA-12 a MA-20 passam

- [ ] 10.3. Testes MA — Sistema de saldo (REQ-03)
  - Design ref: [Transações e cálculo de saldo simplificado](design.md#5-transações-e-cálculo-de-saldo-simplificado)
  - Covers: REQ-03.1, REQ-03.2, REQ-03.3, REQ-03.4
  - Test ref: [MA-21 a MA-33](tests.md#ma--executable-plan)
  - Done when: testes MA-21 a MA-33 passam

- [ ] 10.4. Testes MA — Transações automáticas sem seleção de contrato (REQ-04)
  - Design ref: [Resolução automática de contrato](design.md#3-resolução-automática-de-contrato--folhas-de-obra-e-assistências-remotas)
  - Covers: REQ-04.1, REQ-04.2, REQ-04.3, REQ-04.4
  - Test ref: [MA-34 a MA-48](tests.md#ma--executable-plan)
  - Done when: testes MA-34 a MA-48 passam

---

## Cobertura — Verificação

### Forward check (REQ → Task)

| REQ-ID   | Tasks de implementação         | Tasks de teste |     |     |     |     |
| ----------| --------------------------------| ----------------| -----| -----| -----| -----|
| REQ-01.1 | 2.1                            | 9.1, 10.1      |     |     |     |     |
| REQ-01.2 | 1.1, 1.2, 2.2                  | 9.1, 10.1      |     |     |     |     |
| REQ-01.3 | 7.1                            | 10.1           |     |     |     |     |
| REQ-01.4 | 6.1                            | 10.1           |     |     |     |     |
| REQ-02.1 | 4.1                            | 10.2           |     |     |     |     |
| REQ-02.2 | 4.1                            | 9.3, 10.2      |     |     |     |     |
| REQ-02.3 | 4.1                            | 10.2           |     |     |     |     |
| REQ-03.1 | 5.1                            | 10.3           |     |     |     |     |
| REQ-03.2 | 5.1                            | 9.3, 10.3      |     |     |     |     |
| REQ-03.3 | 7.2                            | 10.3           |     |     |     |     |
| REQ-03.4 | —   9.4, 10.3                  |                |     |     |     |     |
| REQ-04.1 | 3.1, 3.2, 8.1, 8.2     2, 10.4 |                |     |     |     |     |
| REQ-04.2 | 5.2                            | 9.2, 9.3, 10.4 |     |     |     |     |
| REQ-04.3 | 5.3                            | 9.2, 9.3, 10.4 |     |     |     |     |
| REQ-04.4 | 5.4     4, 10.4                |                |     |     |     |     |

> REQ-03.4 (recálculo de saldo) — a implementação já existe (`calculateBalanceFromTransactions`, `POST /api/balance/{clientId}/recalculate`). Sem tarefa de implementação necessária; coberto por testes 9.4 e 10.3.

### Resumo de cobertura

| Check                | Total | Cobertos | Gaps                     |                  |     |
| ----------------------| -------| ----------| --------------------------| ------------------| -----|
| REQ → Task           | 15    | 15       | 0                        |                  |     |
| Task → Design        | 20    | 20       | 0                        |                  |     |
| Task testável → Test | 20    | 20       | 0                        |                  |     |
| Secção design → Task | 8     | 8        | 0                        |                  |     |
| 9.                   | 9.    | --       | ------------------------ | ---------------- |     |