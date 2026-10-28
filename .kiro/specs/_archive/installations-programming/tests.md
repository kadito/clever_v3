# Plano de Aceitação Executável — Instalações e Programações

## [MA] Mirror — Testes de Aceitação

| Test ID | CA-ID | Given / When / Then | Dados | Critério de Passagem |
|---------|-------|---------------------|-------|---------------------|
| T-01.1 | CA-01.1 | Given técnico autenticado / When cria registo / Then número único gerado | Utilizador válido com sessão Clerk | Registo criado com ID único e 5 fases vazias |
| T-01.2 | CA-01.2 | Given registo existe / When aberto / Then 5 fases apresentadas | Registo com ID válido | Fases: Programação, Preparação, Instalação, Testes, Finalização visíveis |
| T-01.3 | CA-01.6 | Given técnico "João Silva" autenticado / When cria registo / Then técnico atribuído automaticamente | Sessão Clerk com firstName="João", lastName="Silva" | Campo técnico preenchido com dados do utilizador autenticado |
| T-02.1 | CA-02.1 | Given técnico na Fase 1 / When formulário apresentado / Then campos de texto visíveis | — | Campos: PLUS, Departamento, Cabeçalho, Rede, Vectron Connect, Anydesk, Séries/Nº Equipamentos presentes |
| T-02.2 | CA-02.2 | Given técnico na Fase 1 / When formulário apresentado / Then switches visíveis | — | Switches: CPA, Gaveta, Impressora/Monitor, Faturadora, Display Clientes, Scanner, Leitor Cartões, Fechadura Chaves presentes |
| T-02.3 | CA-02.4, CA-02.5 | Given switch Vectron desativado / When ativa switch / Then grupos condicionais aparecem | Switch Vectron = false → true | Grupo "Programação Leitura X" e "Tecla Só Consulta Diária" visíveis |
| T-02.4 | CA-02.5, CA-02.6 | Given switch Vectron ativado / When desativa switch / Then grupos condicionais desaparecem | Switch Vectron = true → false | Grupos Vectron ocultos |
| T-03.1 | CA-03.1 | Given técnico na Fase 2 / When formulário apresentado / Then checklist por categorias | — | Categorias: POS, Display Cliente, Gaveta Metálica, CPA, Balanças, CCTV, Router/Switch, Acessórios visíveis |
| T-03.2 | CA-03.10 | Given checklist com itens desmarcados / When marca um item / Then estado guardado | Categoria POS, item "Cabo POS" = false → true | Item marcado e estado persistido |
| T-03.3 | CA-03.11 | Given categoria com 4 itens, 3 marcados / When categoria visualizada / Then progresso mostrado | Categoria POS: 3/4 verificados | Indicador "3/4" visível na categoria |
| T-04.1 | CA-04.1 | Given técnico na Fase 3 / When acede campo cliente / Then lista de clientes apresentada | Lista de clientes existentes no sistema | Dropdown/seletor com clientes disponíveis |
| T-04.2 | CA-04.7 | Given técnico na Fase 3 / When formulário apresentado / Then switches de material visíveis | — | Switches: POS, CPA, Balança, CCTV, Alarme, Impressora, UPS, Router, Switch presentes |
| T-04.3 | CA-04.8 | Given material instalado / When Rolos ativado / Then campo quantidade aparece | Switch Rolos = true | Campo numérico para quantidade de rolos visível |
| T-04.4 | CA-04.9 | Given clientId inválido no registo / When registo apresentado / Then erro exibido | clientId = "inexistente-123" | Mensagem de erro estruturada no campo de cliente |
| T-05.1 | CA-05.1, CA-05.2 | Given técnico na Fase 4 / When Anydesk = Sim / Then campo código aparece | Switch Anydesk = true | Campo "Código Anydesk" visível, campo "Motivo" oculto |
| T-05.2 | CA-05.1, CA-05.3 | Given técnico na Fase 4 / When Anydesk = Não / Then campo motivo aparece | Switch Anydesk = false | Campo "Motivo da falha" visível, campo "Código" oculto |
| T-05.3 | CA-05.4, CA-05.5 | Given técnico na Fase 4 / When Vectron Connect = Sim / Then campo código aparece | Switch Vectron Connect = true | Campo "Código Vectron Connect" visível, campo "Motivo" oculto |
| T-05.4 | CA-05.4, CA-05.6 | Given técnico na Fase 4 / When Vectron Connect = Não / Then campo motivo aparece | Switch Vectron Connect = false | Campo "Motivo da falha" visível, campo "Código" oculto |
| T-06.1 | CA-06.3, CA-06.4 | Given técnico na Fase 5 / When Foto = Sim / Then campo URL aparece | Switch Foto = true | Campo "URL da Drive" visível |
| T-06.2 | CA-06.3, CA-06.4 | Given técnico na Fase 5 / When Foto = Não / Then campo URL oculto | Switch Foto = false | Campo "URL da Drive" oculto |
| T-06.3 | CA-06.5 | Given todas verificações Fase 5 completas / When última verificação marcada / Then instalação finalizada | DUMP=true, Cópia=true, Foto=true+URL | Registo marcado como concluído |
| T-07.1 | CA-07.3 | Given registo com clientId válido / When registo apresentado / Then nome do cliente resolvido | clientId de cliente existente | Nome do cliente exibido corretamente |
| T-07.2 | CA-07.4 | Given registo com clientId inválido / When registo apresentado / Then erro estruturado | clientId inexistente | Mensagem de erro com estilo vermelho |
| T-08.1 | CA-08.1 | Given registo aberto / When técnico navega / Then 5 fases navegáveis | Registo com fases em diferentes estados | Navegação livre entre todas as fases |
| T-08.2 | CA-08.5, CA-08.6 | Given registo com 3/5 fases completas / When visto na lista / Then progresso visível | Fases 1,2,3 completas; 4,5 incompletas | Indicador "3/5" na lista |
| T-09.1 | CA-09.2 | Given técnico em dispositivo móvel / When interage com switches / Then touch targets adequados | Ecrã 375px largura | Todos os elementos interativos ≥ 44px |
| T-09.2 | CA-09.5 | Given checklist com 8 categorias / When vista no telemóvel / Then categorias colapsáveis | Ecrã móvel | Categorias expandem/colapsam por toque |
| T-10.1 | CA-10.2 | Given registo criado / When verificado no armazenamento / Then audit trail presente | Registo recém-criado | Campos createdAt, updatedAt, createdBy presentes |
| T-10.2 | CA-10.3 | Given técnico Admin / When elimina registo / Then confirmação e eliminação | Role = Admin | Diálogo de confirmação apresentado, registo eliminado após confirmação |
| T-10.3 | CA-10.5 | Given registo criado / When índice verificado / Then índice atualizado | Novo registo de instalação | Entrada presente no índice de pesquisa |

## [MI] — Strategy

| Interface | Âmbito de teste | Dependências mockadas | REQ-ID |
|-----------|----------------|----------------------|--------|
| `calculateCompletedPhases()` (shared validation) | Lógica de completude: dados de cada fase → array de fases completas + `isCompleted` | Nenhuma (função pura) | REQ-08 |
| `CHECKLIST_CATEGORIES` / `CHECKLIST_LABELS` (shared constants) | Constantes de checklist: categorias e itens correspondem ao esperado | Nenhuma (constantes) | REQ-03 |
| Backend route `installations-programming` (CRUD) | Criação com auto-assign, atualização com recálculo de fases, soft delete, listagem com paginação | R2 bucket (mock), Clerk userContext (mock) | REQ-01, REQ-07, REQ-10 |
| Backend `extractSearchableText()` / `extractIndexFields()` | Extração de texto pesquisável e campos de índice a partir do conteúdo | Nenhuma (funções puras sobre dados) | REQ-01, REQ-10 |
| `PhaseNavigation.vue` (componente) | Navegação entre fases, indicador de progresso, estado visual por fase | Props mockadas (completedPhases, currentPhase) | REQ-08, REQ-09 |
| `PhaseChecklist.vue` (componente) | Renderização de categorias colapsáveis, toggle de itens, indicador de progresso por categoria | Props mockadas (checklist data) | REQ-03, REQ-09 |
| `InstallationsProgrammingCreateView.vue` | Formulário de criação: campos condicionais (Vectron, Anydesk, foto), navegação entre fases, submit | `useApi` (mock), `useSharedFormData` (mock) | REQ-02, REQ-04, REQ-05, REQ-06 |
| `InstallationsProgrammingListView.vue` | Lista com pesquisa, paginação, exibição de progresso e relação cliente | `useApi` (mock) | REQ-01, REQ-08, REQ-09 |
| `InstallationsProgrammingDetailView.vue` | Detalhe com fases, relação cliente resolvida, botão eliminar condicionado a permissão | `useApi` (mock), `usePermissions` (mock) | REQ-01, REQ-07, REQ-08 |

## [MI] — Plano Executável

| Test ID | Interface | Comportamento | Dados de entrada | Resultado esperado | REQ-ID |
|---------|-----------|---------------|-----------------|-------------------|--------|
| MI-01 | `calculateCompletedPhases()` | Todas as fases vazias → nenhuma completa | Dados default (strings vazias, booleans false) | `completedPhases: []`, `isCompleted: false` | REQ-08 |
| MI-02 | `calculateCompletedPhases()` | Fase 1 completa (campo texto preenchido) | `phase1.plus = "ABC"`, resto vazio | `completedPhases: [1]`, `isCompleted: false` | REQ-08 |
| MI-03 | `calculateCompletedPhases()` | Fase 2 completa (item checklist marcado) | `phase2.checklist.pos.caboPOS = true` | `completedPhases: [2]` | REQ-08 |
| MI-04 | `calculateCompletedPhases()` | Fase 3 completa (clientId + data) | `clientId = "uuid-1"`, `dataInstalacao = "2026-01-01"` | `completedPhases: [3]` | REQ-08 |
| MI-05 | `calculateCompletedPhases()` | Fase 3 incompleta (clientId sem data) | `clientId = "uuid-1"`, datas vazias | Fase 3 não incluída em `completedPhases` | REQ-08 |
| MI-06 | `calculateCompletedPhases()` | Fase 4 completa (ambos testes com código) | `anydeskTestado=true, anydeskCodigo="123"`, `vectronConnectTestado=true, vectronConnectCodigo="456"` | `completedPhases: [4]` | REQ-08 |
| MI-07 | `calculateCompletedPhases()` | Fase 4 completa (ambos testes com motivo) | `anydeskTestado=false, anydeskMotivo="sem rede"`, `vectronConnectTestado=false, vectronConnectMotivo="sem licença"` | `completedPhases: [4]` | REQ-08 |
| MI-08 | `calculateCompletedPhases()` | Fase 4 incompleta (anydesk sim sem código) | `anydeskTestado=true, anydeskCodigo=""` | Fase 4 não incluída | REQ-08 |
| MI-09 | `calculateCompletedPhases()` | Fase 5 completa com foto | `dumpLido=true, copiaSeguranca=true, fotoInstalacao=true, fotoURL="https://drive.google.com/..."` | `completedPhases: [5]` | REQ-08 |
| MI-10 | `calculateCompletedPhases()` | Fase 5 completa sem foto | `dumpLido=true, copiaSeguranca=true, fotoInstalacao=false` | `completedPhases: [5]` | REQ-08 |
| MI-11 | `calculateCompletedPhases()` | Fase 5 incompleta (foto sim sem URL) | `dumpLido=true, copiaSeguranca=true, fotoInstalacao=true, fotoURL=""` | Fase 5 não incluída | REQ-08 |
| MI-12 | `calculateCompletedPhases()` | Todas as 5 fases completas | Dados completos para todas as fases | `completedPhases: [1,2,3,4,5]`, `isCompleted: true` | REQ-08 |
| MI-13 | `CHECKLIST_CATEGORIES` | 8 categorias presentes | — | Chaves: `pos`, `displayCliente`, `gavetaMetalica`, `cpa`, `balancas`, `cctv`, `routerSwitch`, `acessorios` | REQ-03 |
| MI-14 | `CHECKLIST_CATEGORIES` | Categoria POS tem 4 itens | — | `['caboPOS', 'wer', 'transformador', 'caboRede']` | REQ-03 |
| MI-15 | `CHECKLIST_CATEGORIES` | Categoria CPA tem 12 itens | — | 12 chaves conforme design | REQ-03 |
| MI-16 | `CHECKLIST_LABELS` | Labels PT correspondem às categorias | — | Cada categoria e item tem label PT não vazio | REQ-03 |
| MI-17 | Backend CRUD | POST cria registo com auto-assign técnico | Body com dados mínimos, userContext válido | 201, registo com `technician` preenchido, `completedPhases: []` | REQ-01, REQ-10 |
| MI-18 | Backend CRUD | POST sem autenticação | Body sem userContext | 401 Unauthorized | REQ-10 |
| MI-19 | Backend CRUD | PUT atualiza e recalcula fases | Body com `phase1.plus = "ABC"` | 200, `completedPhases` inclui 1 | REQ-01, REQ-08 |
| MI-20 | Backend CRUD | PUT preserva fases não incluídas no payload | Body com apenas `phase1`, registo existente com `phase2` preenchida | `phase2` preservada no resultado | REQ-01 |
| MI-21 | Backend CRUD | GET lista com paginação | `?page=1&limit=10` | 200, array de itens com `completedPhasesCount` | REQ-01 |
| MI-22 | Backend CRUD | GET detalhe com relação cliente resolvida | UUID válido, `clientId` válido | 200, `relations.clients` com dados do cliente | REQ-07 |
| MI-23 | Backend CRUD | GET detalhe com clientId inválido | UUID válido, `clientId` inexistente | 200, `relations.clients` com erro 404 | REQ-07 |
| MI-24 | Backend CRUD | DELETE soft delete (Admin) | UUID válido, userContext Admin | 200, `isDeleted: true` | REQ-10 |
| MI-25 | Backend CRUD | DELETE negado (User) | UUID válido, userContext User | 403 Forbidden | REQ-10 |
| MI-26 | `extractSearchableText()` | Extrai texto pesquisável | Conteúdo com técnico "João Silva" | String contendo "joão silva" (minúsculas) | REQ-01, REQ-10 |
| MI-27 | `extractIndexFields()` | Extrai campos de índice | Conteúdo com `clientId`, `completedPhases: [1,2]`, `isCompleted: false` | `{ clientId, technicianName, completedPhasesCount: 2, isCompleted: false }` | REQ-01, REQ-10 |
| MI-28 | `PhaseNavigation.vue` | Renderiza 5 tabs de fases | `completedPhases: [1,2]`, `currentPhase: 1` | 5 tabs visíveis, fases 1 e 2 com indicador completo | REQ-08, REQ-09 |
| MI-29 | `PhaseNavigation.vue` | Emite evento ao clicar numa fase | Click na tab da fase 3 | Evento `update:currentPhase` emitido com valor 3 | REQ-08 |
| MI-30 | `PhaseChecklist.vue` | Renderiza categorias colapsáveis | Dados de checklist com 8 categorias | 8 secções colapsáveis visíveis | REQ-03, REQ-09 |
| MI-31 | `PhaseChecklist.vue` | Mostra progresso por categoria | Categoria POS: 3/4 marcados | Indicador "3/4" visível | REQ-03 |
| MI-32 | `PhaseChecklist.vue` | Emite evento ao toggle de item | Click no switch "Cabo POS" | Evento `update:checklist` emitido com item atualizado | REQ-03 |
| MI-33 | `InstallationsProgrammingCreateView.vue` | Campos condicionais Vectron | `isVectron = false` → `true` | Grupos "Programação Leitura X" e "Tecla Só Consulta Diária" aparecem | REQ-02 |
| MI-34 | `InstallationsProgrammingCreateView.vue` | Campos condicionais Anydesk (Fase 4) | `anydeskTestado = true` | Campo "Código Anydesk" visível, "Motivo" oculto | REQ-05 |
| MI-35 | `InstallationsProgrammingCreateView.vue` | Campos condicionais Foto (Fase 5) | `fotoInstalacao = true` | Campo "URL da Drive" visível | REQ-06 |
| MI-36 | `InstallationsProgrammingCreateView.vue` | Campos condicionais Rolos (Fase 3) | `materialInstalado.rolos = true` | Campo "Quantidade de Rolos" visível | REQ-04 |
| MI-37 | `InstallationsProgrammingListView.vue` | Renderiza lista com progresso | Lista com 2 registos (3/5 e 5/5) | Indicadores de progresso visíveis por registo | REQ-01, REQ-08 |
| MI-38 | `InstallationsProgrammingListView.vue` | Pesquisa filtra resultados | Texto de pesquisa "João" | Lista filtrada | REQ-01 |
| MI-39 | `InstallationsProgrammingDetailView.vue` | Exibe relação cliente resolvida | Registo com `clientId` válido, relação resolvida | Nome do cliente exibido via RelationInfoDisplay | REQ-07 |
| MI-40 | `InstallationsProgrammingDetailView.vue` | Exibe erro de relação cliente | Registo com `clientId` inválido | Mensagem de erro com estilo vermelho | REQ-07 |
| MI-41 | `InstallationsProgrammingDetailView.vue` | Botão eliminar visível para Admin | `usePermissions` retorna `canDelete: true` | Botão eliminar presente no DOM | REQ-10 |
| MI-42 | `InstallationsProgrammingDetailView.vue` | Botão eliminar oculto para User | `usePermissions` retorna `canDelete: false` | Botão eliminar ausente do DOM | REQ-10 |

## [MA] — Plano Executável

| Test ID | CA-ID | Given / When / Then | Dados | Critério de Passagem |
|---------|-------|---------------------|-------|---------------------|
| MA-01 | CA-01.1 | Given técnico autenticado / When cria registo / Then número único gerado | Utilizador válido com sessão Clerk | Registo criado com UUID único e 5 fases vazias |
| MA-02 | CA-01.2 | Given registo existe / When aberto / Then 5 fases apresentadas | Registo com UUID válido | Fases: Programação, Preparação, Instalação, Testes, Finalização visíveis |
| MA-03 | CA-01.3 | Given registo existente / When edita campo da Fase 1 / Then alteração guardada | Registo existente, `plus = "novo valor"` | Campo atualizado no registo |
| MA-04 | CA-01.4 | Given registo com fases parcialmente completas / When visualizado / Then progresso visível | Fases 1,2 completas | Indicador mostra 2/5 |
| MA-05 | CA-01.5 | Given registos existentes / When acede lista / Then lista com pesquisa | 3 registos no sistema | Lista apresentada com pesquisa funcional |
| MA-06 | CA-01.6 | Given técnico "João Silva" autenticado / When cria registo / Then técnico atribuído | Sessão Clerk firstName="João", lastName="Silva" | Campo técnico = "João Silva" |
| MA-07 | CA-02.1 | Given técnico na Fase 1 / When formulário apresentado / Then campos texto visíveis | — | PLUS, Departamento, Cabeçalho, Rede, Vectron Connect, Anydesk, Séries presentes |
| MA-08 | CA-02.2 | Given técnico na Fase 1 / When formulário apresentado / Then switches visíveis | — | 8 switches de ligação presentes |
| MA-09 | CA-02.3 | Given técnico na Fase 1 / When formulário apresentado / Then campo turnos visível | — | Campo "Configuração dos Turnos" presente |
| MA-10 | CA-02.4, CA-02.5 | Given switch Vectron desativado / When ativa / Then grupos condicionais aparecem | isVectron false → true | Grupos Leitura X e Consulta Diária visíveis |
| MA-11 | CA-02.6 | Given switch Vectron ativado / When formulário apresentado / Then campos Consulta Diária visíveis | isVectron = true | Leitura Gerente Normal, Leitura Supervisor presentes |
| MA-12 | CA-02.7 | Given campos Fase 1 preenchidos / When submete / Then dados guardados | plus="ABC", departamento="DEP1" | Dados persistidos no registo |
| MA-13 | CA-02.8 | Given Fase 1 preenchida / When edita campo / Then edição permitida | Registo existente com Fase 1 | Campo editável e alteração guardada |
| MA-14 | CA-03.1 | Given técnico na Fase 2 / When formulário apresentado / Then checklist por categorias | — | 8 categorias com switches |
| MA-15 | CA-03.2 | Given categoria POS / When visualizada / Then 4 itens presentes | — | Cabo POS, WER, Transformador, Cabo Rede |
| MA-16 | CA-03.3 | Given categoria Display Cliente / When visualizada / Then 7 itens presentes | — | Impressora, Rolo, Cabo Power, Transformador, Cabo Ligação POS, Ficha Adaptador RS232, Autocolantes |
| MA-17 | CA-03.4 | Given categoria Gaveta Metálica / When visualizada / Then 2 itens presentes | — | Chaves, Autocolantes |
| MA-18 | CA-03.5 | Given categoria CPA / When visualizada / Then 12 itens presentes | — | Todos os 12 itens conforme requisitos |
| MA-19 | CA-03.6 | Given categoria Balanças / When visualizada / Then 4 itens presentes | — | Cabo Power, Transformador, Folha 1ª Verificação, Autocolante |
| MA-20 | CA-03.7 | Given categoria CCTV / When visualizada / Then 7 itens presentes | — | DVR, Câmaras, Transformador, Cabo Power, Fichas, Placas Licença, Autocolantes |
| MA-21 | CA-03.8 | Given categoria Router/Switch / When visualizada / Then 6 itens presentes | — | Router, Switch, Cabo Power, Transformador, Cabo Rede, Autocolante |
| MA-22 | CA-03.9 | Given categoria Acessórios / When visualizada / Then 12 itens presentes | — | Todos os 12 itens conforme requisitos |
| MA-23 | CA-03.10 | Given checklist / When marca item / Then estado guardado imediatamente | Cabo POS false → true | Estado persistido |
| MA-24 | CA-03.11 | Given categoria com 4 itens, 3 marcados / When visualizada / Then progresso "3/4" | POS: 3/4 | Indicador "3/4" visível |
| MA-25 | CA-04.1 | Given técnico na Fase 3 / When acede campo cliente / Then lista apresentada | Clientes existentes | Seletor com clientes disponíveis |
| MA-26 | CA-04.2 | Given técnico na Fase 3 / When formulário apresentado / Then campos texto visíveis | — | Nº Fatura, Nº Guia de Transportes presentes |
| MA-27 | CA-04.3 | Given técnico autenticado na Fase 3 / When formulário apresentado / Then técnico preenchido | Sessão Clerk ativa | Técnico responsável preenchido automaticamente |
| MA-28 | CA-04.4 | Given técnico na Fase 3 / When formulário apresentado / Then campos data/hora instalação visíveis | — | Data Instalação, Hora Inicial, Hora Final presentes |
| MA-29 | CA-04.5 | Given técnico na Fase 3 / When formulário apresentado / Then campos data/hora formação visíveis | — | Data Formação, Hora Inicial, Hora Final presentes |
| MA-30 | CA-04.6 | Given técnico na Fase 3 / When formulário apresentado / Then campo formação visível | — | "Quem Recebeu Formação" presente |
| MA-31 | CA-04.7 | Given técnico na Fase 3 / When formulário apresentado / Then switches material visíveis | — | POS, CPA, Balança, CCTV, Alarme, Impressora, UPS, Router, Switch presentes |
| MA-32 | CA-04.8 | Given Rolos ativado / When switch ligado / Then campo quantidade aparece | rolos = true | Campo numérico "Quantidade de Rolos" visível |
| MA-33 | CA-04.9 | Given clientId inválido / When registo apresentado / Then erro exibido | clientId inexistente | Mensagem de erro estruturada |
| MA-34 | CA-05.1, CA-05.2 | Given Fase 4 / When Anydesk = Sim / Then campo código visível | anydeskTestado = true | "Código Anydesk" visível, "Motivo" oculto |
| MA-35 | CA-05.3 | Given Fase 4 / When Anydesk = Não / Then campo motivo visível | anydeskTestado = false | "Motivo da Falha" visível, "Código" oculto |
| MA-36 | CA-05.4, CA-05.5 | Given Fase 4 / When Vectron Connect = Sim / Then campo código visível | vectronConnectTestado = true | "Código Vectron Connect" visível, "Motivo" oculto |
| MA-37 | CA-05.6 | Given Fase 4 / When Vectron Connect = Não / Then campo motivo visível | vectronConnectTestado = false | "Motivo da Falha" visível, "Código" oculto |
| MA-38 | CA-06.1 | Given Fase 5 / When formulário apresentado / Then switch DUMP visível | — | Switch "DUMP Lido" presente |
| MA-39 | CA-06.2 | Given Fase 5 / When formulário apresentado / Then switch cópia visível | — | Switch "Cópia de Segurança" presente |
| MA-40 | CA-06.3, CA-06.4 | Given Fase 5 / When Foto = Sim / Then campo URL visível | fotoInstalacao = true | "URL da Drive" visível |
| MA-41 | CA-06.5 | Given todas verificações Fase 5 completas / When última marcada / Then finalizada | DUMP=true, Cópia=true, Foto=true+URL | Registo marcado como concluído |
| MA-42 | CA-07.1 | Given Fase 3 / When acede seleção cliente / Then lista apresentada | Clientes existentes | Lista de clientes para seleção |
| MA-43 | CA-07.2 | Given cliente selecionado / When guardado / Then clientId armazenado | Cliente selecionado | clientId presente no registo |
| MA-44 | CA-07.3 | Given registo com clientId válido / When apresentado / Then nome resolvido | clientId existente | Nome do cliente exibido |
| MA-45 | CA-07.4 | Given registo com clientId inválido / When apresentado / Then erro estruturado | clientId inexistente | Mensagem de erro com estilo vermelho |
| MA-46 | CA-07.5 | Given registo com cliente / When visto em lista e detalhe / Then relação consistente | clientId válido | Nome do cliente consistente em ambas as vistas |
| MA-47 | CA-08.1 | Given registo aberto / When navega entre fases / Then 5 fases navegáveis | Registo existente | Navegação sequencial funcional |
| MA-48 | CA-08.2 | Given registo com fases em diferentes estados / When visualizado / Then indicador visual | Fases 1,2 completas, 3 em curso | Indicador mostra estado por fase |
| MA-49 | CA-08.3 | Given fase anterior incompleta / When tenta aceder outra fase / Then navegação livre | Fase 1 incompleta | Acesso à Fase 3 permitido |
| MA-50 | CA-08.4 | Given campos obrigatórios de fase preenchidos / When completa / Then fase marcada | Fase 1 com campo preenchido | Fase 1 marcada como completa |
| MA-51 | CA-08.5 | Given 5 fases completas / When última completada / Then registo concluído | Todas as fases completas | `isCompleted: true` |
| MA-52 | CA-08.6 | Given registos com diferentes progressos / When lista visualizada / Then progresso visível | Registos 3/5 e 5/5 | Indicadores "3/5" e "5/5" na lista |
| MA-53 | CA-09.1 | Given módulo disponível / When acede / Then 5 vistas disponíveis | — | Home tile, Lista, Detalhe, Criar, Editar acessíveis |
| MA-54 | CA-09.2 | Given dispositivo móvel / When interage / Then touch targets ≥ 44px | Ecrã 375px | Elementos interativos ≥ 44px |
| MA-55 | CA-09.3 | Given qualquer vista / When apresentada / Then labels em PT | — | Todos os labels em Português de Portugal |
| MA-56 | CA-09.4 | Given checklist no telemóvel / When toca switches / Then uso táctil otimizado | Ecrã móvel | Switches com área de toque adequada |
| MA-57 | CA-09.5 | Given checklist com categorias / When vista no telemóvel / Then categorias colapsáveis | Ecrã móvel | Categorias expandem/colapsam |
| MA-58 | CA-09.6 | Given telemóvel / When navega entre fases / Then navegação por toque | Ecrã móvel | Navegação acessível por toque |
| MA-59 | CA-10.1 | Given registo criado / When armazenado / Then segue BaseContent | Novo registo | Estrutura BaseContent respeitada |
| MA-60 | CA-10.2 | Given registo criado/atualizado / When operação concluída / Then audit trail | Operação CRUD | createdAt, updatedAt, createdBy presentes |
| MA-61 | CA-10.3 | Given Admin / When elimina registo / Then confirmação e eliminação | Role Admin | Diálogo confirmação + soft delete |
| MA-62 | CA-10.4 | Given registo guardado / When armazenado / Then padrão de chaves seguido | Novo registo | Chave R2: `content/installations-programming/{uuid}.json` |
| MA-63 | CA-10.5 | Given registo criado/atualizado/eliminado / When operação concluída / Then índice atualizado | Operação CRUD | Índice sincronizado |
| MA-64 | CA-10.6 | Given utilizador acede módulo / When sistema verifica / Then permissões respeitadas | Role User tenta eliminar | Operação bloqueada |
