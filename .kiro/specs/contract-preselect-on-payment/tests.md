# Pré-Seleção de Contrato no Pagamento - Tests

## [MI] — Strategy

| Interface | Test type | Key scenarios from design | Mocked dependencies | REQ-ID |
|-----------|-----------|--------------------------|---------------------|--------|
| `fetchClientContracts()` in WorkSheetsCreateView | unit | 1 contrato → contractId = uuid; N contratos → contractId = primeiro uuid; 0 contratos → contractId vazio | `contractsApi.fetchList` mocked | PRESEL-AC-001, AC-003, AC-006 |
| `fetchClientContracts()` in RemoteAssistanceCreateView | unit | Mesmos 3 cenários (comportamento consistente) | `contractsApi.fetchList` mocked | PRESEL-AC-008 |
| `paymentMethod` watcher (ambos views) | unit | Mudar para "Contrato" → dispara fetch; Mudar para outro → limpa contractId e contratos | `fetchClientContracts` mocked | PRESEL-AC-001, AC-003 |
| `clientId` watcher (ambos views) | unit | Cliente muda enquanto paymentMethod é "Contrato" → re-fetch e pré-seleciona; Novo cliente com 0 contratos → limpa seleção anterior | `fetchClientContracts` mocked | PRESEL-AC-009, AC-010 |

## [MA] — Plano de testes de aceitação

| MA-ID | Cenário | Pré-condições | Passos | Resultado esperado | REQ-ID |
|-------|---------|---------------|--------|-------------------|--------|
| MA-01 | Pré-seleção com contrato único | Cliente com 1 contrato; formulário de Folha de Obra aberto | 1. Selecionar cliente 2. Selecionar "CONTRATO" como método de pagamento | contractId preenchido automaticamente; caixa verde com info do contrato visível | PRESEL-AC-001, AC-002 |
| MA-02 | Pré-seleção com múltiplos contratos | Cliente com 3 contratos; formulário de Folha de Obra aberto | 1. Selecionar cliente 2. Selecionar "CONTRATO" como método de pagamento | Primeiro contrato pré-selecionado; dropdown visível com 3 opções | PRESEL-AC-003, AC-004 |
| MA-03 | Cliente sem contratos | Cliente sem contratos associados; formulário de Folha de Obra aberto | 1. Selecionar cliente 2. Selecionar "CONTRATO" como método de pagamento | Mensagem "Nenhum contrato encontrado para este cliente" apresentada; contractId vazio | PRESEL-AC-006, AC-007 |
| MA-04 | Mudança de cliente re-seleciona contrato | Método de pagamento já é "CONTRATO"; clienteA selecionado com contrato pré-selecionado | 1. Alterar cliente para clienteB (que tem contratos) | contractId atualizado para primeiro contrato de clienteB | PRESEL-AC-009 |
| MA-05 | Consistência entre Folhas de Obra e Assistências Remotas | Cliente com 2 contratos | 1. Testar pré-seleção no formulário de Folha de Obra 2. Testar pré-seleção no formulário de Assistência Remota | Comportamento idêntico em ambos | PRESEL-AC-008 |
| MA-06 | Mudança de cliente para cliente sem contratos | Método de pagamento já é "Contrato"; contrato pré-selecionado | 1. Alterar cliente para um sem contratos | Seleção limpa; mensagem de erro apresentada | PRESEL-AC-010 |
