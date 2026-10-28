# Tests — Refactor Relação Cliente↔Contrato e Sistema de Saldo

## [MI] — Strategy

| Interface | Âmbito do teste | Dependências mockadas | REQ-ID |
|-----------|----------------|----------------------|--------|
| Validação 1:1 no backend (`contracts` route — POST) | Verificar rejeição quando cliente já tem contrato ativo | R2 bucket (índice de contratos) | REQ-01.1 |
| Sincronização `contratoId` no cliente | Verificar que `contratoId` é atualizado no cliente após criação/eliminação de contrato | R2 bucket (cliente + contrato) | REQ-01.2 |
| Resolução automática de contrato (work-sheets route — POST) | Verificar que `contractId` é resolvido a partir do `clientId` e não do request body | R2 bucket (cliente) | REQ-04.1, REQ-04.2 |
| Resolução automática de contrato (remote-assistance route — POST) | Verificar que `contractId` é resolvido a partir do `clientId` e não do request body | R2 bucket (cliente) | REQ-04.1, REQ-04.3 |
| Transação ADD na criação de contrato (`balance-middleware.onContractCreated`) | Verificar criação de transação ADD com recursos CPA+S&H somados | R2 bucket (balance index + transactions) | REQ-03.2 |
| Transação ADD na renovação (`balance-middleware.onContractUpdated`) | Verificar criação de transação ADD apenas quando recursos alterados, com source "contract-renovation" | R2 bucket (balance index + transactions + contrato anterior) | REQ-02.2 |
| Transação DEBT por folha de obra (`balance-extraction.extractWorkSheetDebtTransaction`) | Verificar regras por método de pagamento: CONTRATO → recursos, Garantia → nada, outros → dívida | Nenhuma (função pura) | REQ-04.2 |
| Transação DEBT por assistência remota (`balance-extraction.extractRemoteAssistanceDebtTransaction`) | Verificar regras por método de pagamento: Contrato → horas, Garantia → nada, outros → dívida | Nenhuma (função pura) | REQ-04.3 |
| Validação de recursos disponíveis (`balance-utils.validateTransactionAgainstBalance`) | Verificar rejeição quando recursos insuficientes; verificar que ilimitado (-1) nunca é rejeitado | Nenhuma (função pura) | REQ-04.4 |
| Cálculo de saldo (`balance-utils.calculateBalanceFromTransactions`) | Verificar recálculo determinístico a partir de transações; verificar tratamento de ilimitado (-1) | Nenhuma (função pura) | REQ-03.4 |
| Recálculo manual de saldo (`POST /api/balance/{clientId}/recalculate`) | Verificar que o índice é reconstruído a partir das transações e produz resultado consistente | R2 bucket (transactions + balance index) | REQ-03.4 |
| Relação Cliente→Contrato (`CONTENT_RELATION_CONFIGS.clients`) | Verificar que `contratoId` é resolvido nas respostas da API de clientes | R2 bucket (cliente + contrato) | REQ-01.2 |

## [MI] — Executable plan

| Test ID | Interface | Behavior | Input data | Expected result | REQ-ID |
|---------|-----------|----------|-----------|-----------------|--------|
| MI-01 | Validação 1:1 backend (POST contracts) | Rejeitar criação quando cliente já tem contrato ativo | `clientId` com contrato ativo existente no índice | HTTP 400 — `"Este cliente já possui um contrato ativo."` | REQ-01.1 |
| MI-02 | Validação 1:1 backend (POST contracts) | Permitir criação quando cliente não tem contrato | `clientId` sem contrato no índice | HTTP 201 — contrato criado | REQ-01.1 |
| MI-03 | Validação 1:1 backend (POST contracts) | Ignorar contratos eliminados (soft delete) na verificação | `clientId` com contrato `isDeleted=true` no índice | HTTP 201 — contrato criado | REQ-01.1 |
| MI-04 | Sincronização contratoId no cliente | Atualizar `contratoId` no cliente após criação de contrato | Contrato criado com `clientId=X` | Cliente X tem `contratoId = contract.uuid` | REQ-01.2 |
| MI-05 | Sincronização contratoId no cliente | Limpar `contratoId` no cliente após eliminação de contrato | Contrato eliminado (soft delete) | Cliente tem `contratoId = undefined` | REQ-01.2 |
| MI-06 | Resolução automática contrato (POST work-sheets) | Resolver `contractId` a partir do `contratoId` do cliente | `clientId` com `contratoId` preenchido | Folha de obra guardada com `contractId = contratoId` do cliente | REQ-04.1 |
| MI-07 | Resolução automática contrato (POST work-sheets) | Ignorar `contractId` enviado no body | Body com `contractId=fake`, cliente com `contratoId=real` | Folha de obra guardada com `contractId = real` | REQ-04.1 |
| MI-08 | Resolução automática contrato (POST work-sheets) | Rejeitar quando pagamento CONTRATO e cliente sem contrato | `paymentMethod=CONTRATO`, cliente sem `contratoId` | HTTP 400 — `"O cliente não possui contrato ativo para consumir recursos."` | REQ-04.2 |
| MI-09 | Resolução automática contrato (POST work-sheets) | Permitir criação sem contrato quando pagamento não é CONTRATO | `paymentMethod=DINHEIRO`, cliente sem `contratoId` | HTTP 201 — folha de obra criada com `contractId=undefined` | REQ-04.2 |
| MI-10 | Resolução automática contrato (POST remote-assistance) | Resolver `contractId` a partir do `contratoId` do cliente | `clientId` com `contratoId` preenchido | Assistência remota guardada com `contractId = contratoId` do cliente | REQ-04.1 |
| MI-11 | Resolução automática contrato (POST remote-assistance) | Rejeitar quando pagamento Contrato e cliente sem contrato | `paymentMethod=Contrato`, cliente sem `contratoId` | HTTP 400 — `"O cliente não possui contrato ativo para consumir recursos."` | REQ-04.3 |
| MI-12 | Resolução automática contrato (POST remote-assistance) | Permitir criação sem contrato quando pagamento não é Contrato | `paymentMethod=Faturação`, cliente sem `contratoId` | HTTP 201 — assistência remota criada com `contractId=undefined` | REQ-04.3 |
| MI-13 | Transação ADD na criação de contrato | Criar transação ADD com recursos CPA+S&H somados | Contrato com CPA(12 manut, 6 desloc, 50h) + S&H(6 manut, 3 desloc, 25h) | Transação ADD: 18 manut, 9 desloc, 75h | REQ-03.2 |
| MI-14 | Transação ADD na criação de contrato | Criar índice de saldo se não existir | Primeiro contrato do cliente | `balance/{clientId}/index.json` criado com recursos do contrato | REQ-03.2 |
| MI-15 | Transação ADD na renovação | Criar transação ADD quando recursos alterados | Contrato atualizado: manut 12→15 | Transação ADD com source `"contract-renovation"`, novos valores | REQ-02.2 |
| MI-16 | Transação ADD na renovação | Não criar transação quando apenas datas alteradas | Contrato atualizado: apenas `fimContratoCPA` alterado | Nenhuma transação ADD criada | REQ-02.2 |
| MI-17 | Transação ADD na renovação | Somar novos recursos ao saldo existente | Saldo atual: 5 manut; renovação adiciona 12 manut | Saldo final: 17 manut | REQ-02.2 |
| MI-18 | Transação DEBT por folha de obra | Pagamento CONTRATO consome manutenção + deslocação | `paymentMethod=CONTRATO`, `hasDisplacement=true` | Transação DEBT: -1 manut, -1 desloc | REQ-04.2 |
| MI-19 | Transação DEBT por folha de obra | Pagamento CONTRATO sem deslocação | `paymentMethod=CONTRATO`, `hasDisplacement=false` | Transação DEBT: -1 manut, 0 desloc | REQ-04.2 |
| MI-20 | Transação DEBT por folha de obra | Pagamento Garantia não cria transação | `paymentMethod=Garantia` (warranty=true) | Nenhuma transação criada | REQ-04.2 |
| MI-21 | Transação DEBT por folha de obra | Outro pagamento adiciona valor à dívida | `paymentMethod=DINHEIRO`, valor total 50€ | Transação DEBT: +50€ dívida | REQ-04.2 |
| MI-22 | Transação DEBT por assistência remota | Pagamento Contrato consome horas | `paymentMethod=Contrato`, `horasTotais=2` | Transação DEBT: -2 horas | REQ-04.3 |
| MI-23 | Transação DEBT por assistência remota | Pagamento Garantia não cria transação | `paymentMethod=Garantia` | Nenhuma transação criada | REQ-04.3 |
| MI-24 | Transação DEBT por assistência remota | Outro pagamento adiciona valor à dívida | `paymentMethod=Faturação`, `valorAssist=30€` | Transação DEBT: +30€ dívida | REQ-04.3 |
| MI-25 | Validação de recursos disponíveis | Rejeitar quando manutenções = 0 | Saldo: 0 manut; DEBT consome 1 manut | Rejeição — `"Recursos insuficientes no contrato do cliente."` | REQ-04.4 |
| MI-26 | Validação de recursos disponíveis | Rejeitar quando deslocações = 0 | Saldo: 0 desloc; DEBT consome 1 desloc | Rejeição — `"Recursos insuficientes no contrato do cliente."` | REQ-04.4 |
| MI-27 | Validação de recursos disponíveis | Rejeitar quando horas insuficientes | Saldo: 1h; DEBT consome 2h | Rejeição — `"Recursos insuficientes no contrato do cliente."` | REQ-04.4 |
| MI-28 | Validação de recursos disponíveis | Permitir quando recurso ilimitado (-1) | Saldo: -1 manut; DEBT consome 1 manut | Transação permitida — recurso permanece -1 | REQ-04.4 |
| MI-29 | Validação de recursos disponíveis | Permitir quando recursos suficientes | Saldo: 5 manut; DEBT consome 1 manut | Transação permitida — saldo: 4 manut | REQ-04.4 |
| MI-30 | Cálculo de saldo | Recálculo determinístico a partir de transações | 3 transações: ADD(12,6,50), DEBT(-1,-1,0), DEBT(0,0,-2) | Saldo: 11 manut, 5 desloc, 48h | REQ-03.4 |
| MI-31 | Cálculo de saldo | Tratamento de ilimitado (-1) no recálculo | ADD(-1,6,50), DEBT(-1,-1,0) | Saldo: -1 manut (ilimitado preservado), 5 desloc, 50h | REQ-03.4 |
| MI-32 | Cálculo de saldo | Processamento por ordem cronológica | Transações fora de ordem temporal | Resultado idêntico ao processamento ordenado | REQ-03.4 |
| MI-33 | Recálculo manual de saldo (POST recalculate) | Reconstruir índice a partir de transações | 10 transações existentes; índice desatualizado | Índice reconstruído = resultado de `calculateBalanceFromTransactions()` | REQ-03.4 |
| MI-34 | Recálculo manual de saldo (POST recalculate) | Resultado idempotente | Recálculo executado 2 vezes consecutivas | Mesmo resultado em ambas execuções | REQ-03.4 |
| MI-35 | Relação Cliente→Contrato | Resolver `contratoId` nas respostas da API de clientes | Cliente com `contratoId` preenchido | `relations.contratoId` contém contrato resolvido | REQ-01.2 |
| MI-36 | Relação Cliente→Contrato | Não resolver quando `contratoId` é undefined | Cliente sem contrato | `relations.contratoId` ausente na resposta | REQ-01.2 |

## [MA] — Executable plan

| Test ID | CA-ID | Given / When / Then | Data | Pass criterion |
|---------|-------|---------------------|------|----------------|
| MA-01 | CA-01.1.1 | Given cliente com contrato ativo / When criar novo contrato para esse cliente / Then criação rejeitada | clientId com contrato ativo no índice | HTTP 400 retornado; contrato não criado |
| MA-02 | CA-01.1.2 | Given criação de contrato rejeitada / When resposta recebida / Then mensagem em Português | Resposta de erro | Mensagem = "Este cliente já possui um contrato ativo." |
| MA-03 | CA-01.1.3 | Given cliente com contrato ativo / When tentativa via formulário e via API / Then ambos rejeitam | Submissão frontend + POST API | Frontend: botão desativado + aviso; Backend: HTTP 400 |
| MA-04 | CA-01.2.1 | Given tipo ClientData / When inspecção da estrutura / Then campo `contratoId` presente, `contratos` ausente | Definição TypeScript | `contratoId: string` (opcional) existe; `contratos` removido |
| MA-05 | CA-01.2.2 | Given cliente com `contratoId` preenchido / When API resolve relações / Then contrato resolvido | GET /api/content/clients/{uuid} | `relations.contratoId` contém dados do contrato |
| MA-06 | CA-01.3.1 | Given cliente com contrato ativo / When abrir detalhe do cliente / Then resumo do contrato visível | ClientsDetailView com contrato | Secção "Contrato" mostra tipo, plano, datas |
| MA-07 | CA-01.3.2 | Given cliente sem contrato / When abrir detalhe do cliente / Then "Sem contrato ativo" visível | ClientsDetailView sem contrato | Texto "Sem contrato ativo" apresentado |
| MA-08 | CA-01.3.3 | Given cliente sem contrato / When abrir detalhe do cliente / Then botão "Criar Contrato" disponível | ClientsDetailView sem contrato | Botão/link para /contracts/create?clientId={uuid} presente |
| MA-09 | CA-01.4.1 | Given formulário de criação de contrato / When selecionar cliente com contrato ativo / Then aviso visual | ContractsCreateView + cliente com contrato | Banner amarelo com "Este cliente já possui um contrato ativo." |
| MA-10 | CA-01.4.2 | Given cliente com contrato selecionado / When tentar submeter / Then botão desativado | ContractsCreateView | Botão submit com `disabled=true`, `opacity-50` |
| MA-11 | CA-01.4.3 | Given aviso visível / When selecionar cliente sem contrato / Then aviso desaparece | ContractsCreateView + mudança de cliente | Banner removido; botão reativado |
| MA-12 | CA-02.1.1 | Given cliente com contrato / When renovar contrato / Then contrato existente atualizado | PUT /api/content/contracts/{uuid} | Contrato atualizado in-place; nenhum novo contrato criado |
| MA-13 | CA-02.1.2 | Given contrato em renovação / When alterar plano, datas e recursos / Then campos atualizados | Novos valores de plano + datas + recursos | Contrato reflete novos valores após PUT |
| MA-14 | CA-02.1.3 | Given contrato renovado / When verificar UUID / Then UUID mantém-se | UUID antes e depois da renovação | UUID idêntico |
| MA-15 | CA-02.2.1 | Given contrato renovado com novos recursos / When renovação concluída / Then transação ADD criada | Renovação com recursos alterados | Transação ADD com source "contract-renovation" existe |
| MA-16 | CA-02.2.2 | Given transação ADD de renovação / When inspecção / Then contém novos valores | Transação criada | Campos manutenções, deslocações, horas presentes |
| MA-17 | CA-02.2.3 | Given saldo com 5 manut restantes / When renovação adiciona 12 manut / Then saldo = 17 | Saldo antes: 5; ADD: 12 | Saldo após: 17 manutenções |
| MA-18 | CA-02.2.4 | Given transação ADD de renovação / When inspecção da fonte / Then source = "contract-renovation" | Transação criada | `source === "contract-renovation"` |
| MA-19 | CA-02.3.1 | Given contrato com múltiplas renovações / When consultar histórico / Then todas as transações ADD presentes | 3 renovações realizadas | 3 transações ADD de renovação no histórico |
| MA-20 | CA-02.3.2 | Given histórico de transações / When filtrar por tipo / Then criação e renovação distinguíveis | Transações ADD com sources diferentes | source "contract" vs "contract-renovation" distinguíveis |
| MA-21 | CA-03.1.1 | Given cliente com contrato CPA(12,6,50h) / When consultar saldo / Then saldo correto | GET /api/balance/{clientId} | 12 manut, 6 desloc, 50h |
| MA-22 | CA-03.1.2 | Given cliente com dívida 150€ / When consultar saldo / Then dívida = 150€ | Índice de saldo | `balance === 150` |
| MA-23 | CA-03.1.3 | Given cliente sem contrato / When consultar saldo / Then tudo a zero | GET /api/balance/{clientId} | 0 manut, 0 desloc, 0h, 0€ dívida |
| MA-24 | CA-03.2.1 | Given contrato acabado de criar / When verificar índice / Then índice criado | Após POST contracts | `balance/{clientId}/index.json` existe com recursos |
| MA-25 | CA-03.2.2 | Given índice existente / When transação processada / Then índice atualizado | ADD ou DEBT processado | Valores do índice refletem a transação |
| MA-26 | CA-03.2.3 | Given contrato com deslocações ilimitadas (-1) / When consultar índice / Then -1 | Índice de saldo | `contracts.deslocacoesPorAno === -1` |
| MA-27 | CA-03.3.1 | Given cliente com dívida 200€ / When abrir detalhe / Then "200€" visível | ClientsDetailView | Secção saldo mostra "200€" |
| MA-28 | CA-03.3.2 | Given cliente com 3 manut e 2 desloc / When abrir detalhe / Then valores visíveis | ClientsDetailView | "3" e "2" apresentados na secção saldo |
| MA-29 | CA-03.3.3 | Given 12 manut originais, 2 restantes (16%) / When abrir detalhe / Then aviso visível | ClientsDetailView | Indicador amarelo nas manutenções |
| MA-30 | CA-03.3.4 | Given horas ilimitadas (-1) / When abrir detalhe / Then "Ilimitado" | ClientsDetailView | Texto "Ilimitado" em vez de número |
| MA-31 | CA-03.3.5 | Given cliente sem transações / When abrir detalhe / Then zeros sem erros | ClientsDetailView | Valores "0" apresentados; sem erros na consola |
| MA-32 | CA-03.4.1 | Given 10 transações processadas / When recálculo / Then resultado = índice em cache | POST recalculate | Índice recalculado === índice existente |
| MA-33 | CA-03.4.2 | Given transações fora de ordem / When recálculo / Then ordem cronológica | Transações com timestamps desordenados | Processamento por ordem de `createdAt` |
| MA-34 | CA-04.1.1 | Given formulário de folha de obra / When inspecção / Then sem campo contrato | WorkSheetsCreateView | Campo `contractId` ausente do formulário |
| MA-35 | CA-04.1.2 | Given formulário de assistência remota / When inspecção / Then sem campo contrato | RemoteAssistanceCreateView | Campo `contractId` ausente do formulário |
| MA-36 | CA-04.1.3 | Given folha de obra criada com clientId / When backend processa / Then contractId automático | POST work-sheets com clientId | `contractId` = `contratoId` do cliente |
| MA-37 | CA-04.2.1 | Given pagamento CONTRATO / When folha de obra criada / Then consome manut + desloc | Folha de obra com `hasDisplacement=true` | DEBT: -1 manut, -1 desloc |
| MA-38 | CA-04.2.2 | Given pagamento Garantia / When folha de obra criada / Then sem transação | Folha de obra warranty=true | Nenhuma transação no histórico |
| MA-39 | CA-04.2.3 | Given pagamento Faturação, valor 50€ / When folha de obra criada / Then +50€ dívida | Folha de obra com valor total 50€ | DEBT: +50€ no campo balance |
| MA-40 | CA-04.2.4 | Given transação DEBT por folha de obra / When inspecção / Then sourceId correto | Transação criada | `sourceId === workSheet.uuid` |
| MA-41 | CA-04.3.1 | Given pagamento Contrato, 2h / When assistência remota criada / Then consome 2h | Assistência remota com horasTotais=2 | DEBT: -2 horas |
| MA-42 | CA-04.3.2 | Given pagamento Garantia / When assistência remota criada / Then sem transação | Assistência remota Garantia | Nenhuma transação no histórico |
| MA-43 | CA-04.3.3 | Given pagamento Faturação, 30€ / When assistência remota criada / Then +30€ dívida | Assistência remota com valorAssist=30 | DEBT: +30€ no campo balance |
| MA-44 | CA-04.3.4 | Given transação DEBT por assistência remota / When inspecção / Then sourceId correto | Transação criada | `sourceId === remoteAssistance.uuid` |
| MA-45 | CA-04.4.1 | Given 0 manut restantes / When folha de obra CONTRATO / Then rejeitada | Saldo: 0 manut | HTTP 400 — conteúdo não criado |
| MA-46 | CA-04.4.2 | Given deslocações ilimitadas (-1) / When folha de obra CONTRATO / Then permitida | Saldo: -1 desloc | HTTP 201 — folha de obra criada |
| MA-47 | CA-04.4.3 | Given recursos insuficientes / When tentativa rejeitada / Then mensagem PT | Resposta de erro | Mensagem = "Recursos insuficientes no contrato do cliente." |
| MA-48 | CA-04.4.4 | Given recursos insuficientes / When transação rejeitada / Then conteúdo não guardado | Folha de obra ou assistência remota | Conteúdo não existe em R2 |
