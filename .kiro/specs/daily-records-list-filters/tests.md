# Plano de Aceitação Executável [MA] — Filtros na Listagem de Registos Diários

| Test ID | CA-ID | Given / When / Then | Dados | Critério de Passagem |
|---------|-------|---------------------|-------|----------------------|
| T-01 | CA-01.1 | **Given** existem registos de 3 colaboradores (Ana Silva, Carlos Mendes, Beatriz Costa) **When** o utilizador abre o filtro de colaborador **Then** as opções aparecem ordenadas: Ana Silva, Beatriz Costa, Carlos Mendes | 3 colaboradores com registos | Ordem alfabética correta |
| T-02 | CA-01.2 | **Given** existem 5 registos de Ana Silva e 3 de Carlos Mendes **When** o utilizador seleciona "Ana Silva" **Then** a lista mostra apenas os 5 registos de Ana Silva | 8 registos, 2 colaboradores | Contagem = 5 registos |
| T-03 | CA-01.3 | **Given** existe um colaborador com firstName="João" e lastName="Santos" **When** o utilizador visualiza as opções do filtro **Then** a opção mostra "João Santos" | 1 colaborador | Nome completo visível |
| T-04 | CA-02.1 | **Given** a listagem está carregada **When** o utilizador interage com o filtro de data **Then** pode selecionar uma data no formato dd/mm/aaaa | — | Formato de data correto |
| T-05 | CA-02.2 | **Given** existem registos nas datas 2026-03-20 e 2026-03-21 **When** o utilizador seleciona 20/03/2026 **Then** a lista mostra apenas os registos de 2026-03-20 | Registos em 2 datas | Apenas registos da data selecionada |
| T-06 | CA-02.3 | **Given** a listagem é carregada pela primeira vez **When** o utilizador observa o filtro de data **Then** o filtro está vazio (sem data selecionada) | — | Valor por defeito vazio |
| T-07 | CA-03.1 | **Given** Ana Silva tem registos em 20/03 e 21/03, Carlos tem registos em 20/03 **When** o utilizador seleciona "Ana Silva" e data 20/03/2026 **Then** a lista mostra apenas os registos de Ana Silva em 20/03 | 3 registos, 2 colaboradores, 2 datas | AND lógico correto |
| T-08 | CA-03.2 | **Given** o filtro de colaborador está ativo para "Ana Silva" **When** o utilizador pesquisa "manutenção" na barra de pesquisa **Then** a lista mostra apenas registos de Ana Silva que contêm "manutenção" | Registos com e sem "manutenção" | Pesquisa + filtro combinados |
| T-09 | CA-03.3 | **Given** o filtro de colaborador está ativo e existem 15 registos filtrados com limite de 10 por página **When** o utilizador navega para a página 2 **Then** a página 2 mostra os 5 registos restantes | 15 registos filtrados | Paginação sobre resultados filtrados |
| T-10 | CA-04.1 | **Given** o filtro de colaborador está ativo para "Ana Silva" **When** o utilizador limpa o filtro de colaborador **Then** o filtro volta ao valor por defeito e a lista mostra todos os registos | Filtro ativo | Filtro limpo, lista completa |
| T-11 | CA-04.2 | **Given** ambos os filtros estão ativos (Ana Silva + 20/03/2026) **When** o utilizador limpa apenas o filtro de data **Then** a lista mostra todos os registos de Ana Silva (todas as datas) | Ambos filtros ativos | Apenas filtro de colaborador ativo |
| T-12 | CA-05.1 | **Given** o utilizador seleciona "Ana Silva" e uma data sem registos dela **When** a lista é atualizada **Then** aparece mensagem "Não foram encontrados registos para os filtros selecionados" | Combinação sem resultados | Mensagem específica de filtros |
| T-13 | CA-05.2 | **Given** os filtros ativos não produzem resultados **When** o utilizador observa a zona de filtros **Then** os filtros permanecem visíveis e editáveis | Sem resultados | Filtros acessíveis |
| T-14 | CA-06.1 | **Given** o utilizador acede à listagem num dispositivo móvel (viewport 375px) **When** o utilizador toca nos filtros **Then** os alvos tácteis têm no mínimo 44px de altura | Viewport mobile | min-height >= 44px |
| T-15 | CA-06.2 | **Given** o utilizador visualiza os filtros **When** lê os rótulos **Then** os rótulos estão em Português de Portugal ("Colaborador", "Data") | — | Rótulos em PT-PT |
| T-16 | CA-06.3 | **Given** o utilizador acede em desktop (1280px) e mobile (375px) **When** observa o layout dos filtros **Then** os filtros adaptam-se ao tamanho do ecrã sem overflow | 2 viewports | Layout responsivo |

## [MI] — Strategy

| Interface | Âmbito do teste | Dependências simuladas | REQ-ID |
|-----------|----------------|----------------------|--------|
| Backend — filtragem no índice (handler GET listagem) | Filtrar entradas do índice por `collaborator`, `date` e `search` em AND lógico; paginação sobre resultado filtrado | R2 bucket (mock com índice em memória) | REQ-01, REQ-02, REQ-03 |
| Backend — endpoint `/collaborators` | Extrair colaboradores únicos do índice, ordenar alfabeticamente, excluir entradas sem técnico | R2 bucket (mock com índice em memória) | REQ-01 |
| Backend — `extractIndexFields` (daily-records) | Verificar que `technicianUserId`, `technicianName` e `dataRegistro` são extraídos corretamente | Nenhuma (função pura) | REQ-01, REQ-02 |
| Composable — `useDailyRecordsFilters` | Estado reativo dos filtros, `filterParams` computed, `clearCollaborator`/`clearDate`/`clearAll`, `fetchCollaborators` | API service (mock) | REQ-01, REQ-02, REQ-03, REQ-04 |
| Componente — `DailyRecordsFilters.vue` | Renderização dos dropdowns, emissão de eventos `update:selectedCollaborator` e `update:selectedDate`, estados de carregamento | Props (dados estáticos) | REQ-01, REQ-02, REQ-04, REQ-06 |
| Vista — `DailyRecordsListView.vue` (integração filtros) | Passagem de `filterParams` ao `fetchList`, reinício de página ao mudar filtro, mensagem vazia diferenciada | `useApi` (mock), `useDailyRecordsFilters` (mock) | REQ-03, REQ-05 |

## [MI] — Plano executável

| Test ID | Interface | Comportamento | Dados de entrada | Resultado esperado | REQ-ID |
|---------|-----------|---------------|-----------------|-------------------|--------|
| MI-IT-01 | extractIndexFields | Extrai campos de técnico quando presente | Registo com `technician: { userId: "u1", firstName: "Ana", lastName: "Silva" }` | `{ technicianUserId: "u1", technicianName: "Ana Silva", dataRegistro: "2026-03-20" }` | REQ-01, REQ-02 |
| MI-IT-02 | extractIndexFields | Campos null quando técnico ausente | Registo sem campo `technician` | `{ technicianUserId: null, technicianName: null, dataRegistro: "2026-03-20" }` | REQ-01 |
| MI-IT-03 | GET /collaborators | Retorna colaboradores únicos ordenados | Índice com 3 entradas: Ana Silva (2x), Carlos Mendes (1x) | `[{ userId: "u1", name: "Ana Silva" }, { userId: "u2", name: "Carlos Mendes" }]` | REQ-01 |
| MI-IT-04 | GET /collaborators | Exclui entradas sem técnico | Índice com 2 entradas: 1 com técnico, 1 com `technicianUserId: null` | Apenas 1 colaborador retornado | REQ-01 |
| MI-IT-05 | GET /collaborators | Exclui entradas eliminadas | Índice com 2 entradas: 1 ativa, 1 com `isDeleted: true` | Apenas colaborador da entrada ativa | REQ-01 |
| MI-IT-06 | GET /collaborators | Índice vazio retorna lista vazia | Índice sem entradas | `{ data: [] }` | REQ-01 |
| MI-IT-07 | GET listagem | Filtra por collaborator | `?collaborator=u1`, índice com entradas de u1 e u2 | Apenas entradas de u1 | REQ-01 |
| MI-IT-08 | GET listagem | Filtra por date | `?date=2026-03-20`, índice com entradas em 03-20 e 03-21 | Apenas entradas de 2026-03-20 | REQ-02 |
| MI-IT-09 | GET listagem | AND lógico collaborator + date | `?collaborator=u1&date=2026-03-20` | Apenas entradas de u1 em 2026-03-20 | REQ-03 |
| MI-IT-10 | GET listagem | AND lógico collaborator + date + search | `?collaborator=u1&date=2026-03-20&search=manutenção` | Apenas entradas de u1 em 2026-03-20 com "manutenção" no searchableText | REQ-03 |
| MI-IT-11 | GET listagem | Paginação sobre resultado filtrado | `?collaborator=u1&page=1&limit=2`, 5 entradas de u1 | `total: 5`, página 1 com 2 itens | REQ-03 |
| MI-IT-12 | GET listagem | Sem filtros retorna todos | Sem query params de filtro | Todos os registos não eliminados | REQ-03 |
| MI-IT-13 | GET listagem | Filtro sem resultados | `?collaborator=u_inexistente` | `{ data: [], total: 0 }` | REQ-05 |
| MI-IT-14 | useDailyRecordsFilters | filterParams omite chaves null | `selectedCollaborator: null, selectedDate: "2026-03-20"` | `{ date: "2026-03-20" }` (sem chave collaborator) | REQ-03 |
| MI-IT-15 | useDailyRecordsFilters | clearCollaborator repõe null | `selectedCollaborator: "u1"` → `clearCollaborator()` | `selectedCollaborator.value === null` | REQ-04 |
| MI-IT-16 | useDailyRecordsFilters | clearDate repõe null | `selectedDate: "2026-03-20"` → `clearDate()` | `selectedDate.value === null` | REQ-04 |
| MI-IT-17 | useDailyRecordsFilters | clearAll repõe ambos | Ambos filtros ativos → `clearAll()` | Ambos `null`, `hasActiveFilters === false` | REQ-04 |
| MI-IT-18 | useDailyRecordsFilters | hasActiveFilters true quando filtro ativo | `selectedCollaborator: "u1"` | `hasActiveFilters.value === true` | REQ-04, REQ-05 |
| MI-IT-19 | useDailyRecordsFilters | fetchCollaborators carrega lista | Mock API retorna `[{ userId: "u1", name: "Ana Silva" }]` | `collaborators.value` contém 1 item | REQ-01 |
| MI-IT-20 | useDailyRecordsFilters | fetchCollaborators erro | Mock API retorna erro | `isLoadingCollaborators === false`, `collaborators` vazio | REQ-01 |
| MI-IT-21 | DailyRecordsFilters | Renderiza dropdown de colaborador com opções | Props: `collaborators: [{ userId: "u1", name: "Ana Silva" }]` | Select com opção "Ana Silva" visível | REQ-01, REQ-06 |
| MI-IT-22 | DailyRecordsFilters | Emite update:selectedCollaborator ao selecionar | Utilizador seleciona "Ana Silva" | Evento emitido com `"u1"` | REQ-01 |
| MI-IT-23 | DailyRecordsFilters | Emite update:selectedDate ao selecionar data | Utilizador seleciona data | Evento emitido com `"2026-03-20"` | REQ-02 |
| MI-IT-24 | DailyRecordsFilters | Mostra "A carregar..." quando isLoadingCollaborators | Props: `isLoadingCollaborators: true` | Select desativado com placeholder "A carregar..." | REQ-01 |
| MI-IT-25 | DailyRecordsFilters | Rótulos em PT-PT | — | Rótulos "Colaborador" e "Data" presentes | REQ-06 |
| MI-IT-26 | DailyRecordsFilters | Min-height 44px nos controlos | — | Ambos os controlos com `min-height: 44px` | REQ-06 |
| MI-IT-27 | DailyRecordsListView | Mensagem diferenciada com filtros ativos e sem resultados | `hasActiveFilters: true`, lista vazia | Mensagem "Não foram encontrados registos para os filtros selecionados" | REQ-05 |
| MI-IT-28 | DailyRecordsListView | Mensagem padrão sem filtros e sem resultados | `hasActiveFilters: false`, lista vazia | Mensagem "Não há registos diários cadastrados no sistema." | REQ-05 |

## [MA] — Plano executável

| Test ID | CA-ID | Given / When / Then | Dados | Critério de passagem |
|---------|-------|---------------------|-------|----------------------|
| MA-AT-01 | CA-01.1 | **Given** existem registos de 3 colaboradores (Ana Silva, Carlos Mendes, Beatriz Costa) **When** o utilizador abre o filtro de colaborador **Then** as opções aparecem ordenadas: Ana Silva, Beatriz Costa, Carlos Mendes | 3 colaboradores com registos | Ordem alfabética correta |
| MA-AT-02 | CA-01.2 | **Given** existem 5 registos de Ana Silva e 3 de Carlos Mendes **When** o utilizador seleciona "Ana Silva" **Then** a lista mostra apenas os 5 registos de Ana Silva | 8 registos, 2 colaboradores | Contagem = 5 registos |
| MA-AT-03 | CA-01.3 | **Given** existe um colaborador com firstName="João" e lastName="Santos" **When** o utilizador visualiza as opções do filtro **Then** a opção mostra "João Santos" | 1 colaborador | Nome completo visível |
| MA-AT-04 | CA-02.1 | **Given** a listagem está carregada **When** o utilizador interage com o filtro de data **Then** pode selecionar uma data no formato dd/mm/aaaa | — | Formato de data correto |
| MA-AT-05 | CA-02.2 | **Given** existem registos nas datas 2026-03-20 e 2026-03-21 **When** o utilizador seleciona 20/03/2026 **Then** a lista mostra apenas os registos de 2026-03-20 | Registos em 2 datas | Apenas registos da data selecionada |
| MA-AT-06 | CA-02.3 | **Given** a listagem é carregada pela primeira vez **When** o utilizador observa o filtro de data **Then** o filtro está vazio (sem data selecionada) | — | Valor por defeito vazio |
| MA-AT-07 | CA-03.1 | **Given** Ana Silva tem registos em 20/03 e 21/03, Carlos tem registos em 20/03 **When** o utilizador seleciona "Ana Silva" e data 20/03/2026 **Then** a lista mostra apenas os registos de Ana Silva em 20/03 | 3 registos, 2 colaboradores, 2 datas | AND lógico correto |
| MA-AT-08 | CA-03.2 | **Given** o filtro de colaborador está ativo para "Ana Silva" **When** o utilizador pesquisa "manutenção" na barra de pesquisa **Then** a lista mostra apenas registos de Ana Silva que contêm "manutenção" | Registos com e sem "manutenção" | Pesquisa + filtro combinados |
| MA-AT-09 | CA-03.3 | **Given** o filtro de colaborador está ativo e existem 15 registos filtrados com limite de 10 por página **When** o utilizador navega para a página 2 **Then** a página 2 mostra os 5 registos restantes | 15 registos filtrados | Paginação sobre resultados filtrados |
| MA-AT-10 | CA-04.1 | **Given** o filtro de colaborador está ativo para "Ana Silva" **When** o utilizador limpa o filtro de colaborador **Then** o filtro volta ao valor por defeito e a lista mostra todos os registos | Filtro ativo | Filtro limpo, lista completa |
| MA-AT-11 | CA-04.2 | **Given** ambos os filtros estão ativos (Ana Silva + 20/03/2026) **When** o utilizador limpa apenas o filtro de data **Then** a lista mostra todos os registos de Ana Silva (todas as datas) | Ambos filtros ativos | Apenas filtro de colaborador ativo |
| MA-AT-12 | CA-05.1 | **Given** o utilizador seleciona "Ana Silva" e uma data sem registos dela **When** a lista é atualizada **Then** aparece mensagem "Não foram encontrados registos para os filtros selecionados" | Combinação sem resultados | Mensagem específica de filtros |
| MA-AT-13 | CA-05.2 | **Given** os filtros ativos não produzem resultados **When** o utilizador observa a zona de filtros **Then** os filtros permanecem visíveis e editáveis | Sem resultados | Filtros acessíveis |
| MA-AT-14 | CA-06.1 | **Given** o utilizador acede à listagem num dispositivo móvel (viewport 375px) **When** o utilizador toca nos filtros **Then** os alvos tácteis têm no mínimo 44px de altura | Viewport mobile | min-height >= 44px |
| MA-AT-15 | CA-06.2 | **Given** o utilizador visualiza os filtros **When** lê os rótulos **Then** os rótulos estão em Português de Portugal ("Colaborador", "Data") | — | Rótulos em PT-PT |
| MA-AT-16 | CA-06.3 | **Given** o utilizador acede em desktop (1280px) e mobile (375px) **When** observa o layout dos filtros **Then** os filtros adaptam-se ao tamanho do ecrã sem overflow | 2 viewports | Layout responsivo |
