# Design — Filtros na Listagem de Registos Diários de Atividade

## 1. Visão geral da arquitetura

### Camadas impactadas

| Camada | Ficheiro | Tipo de alteração | Justificação |
|--------|----------|-------------------|--------------|
| Índice R2 | `indexes/daily-records-index.json` | Modificação | Adicionar campos `technicianUserId`, `technicianName` às entradas do índice |
| Backend — rota | `routes/daily-records.ts` | Modificação | Extrair novos campos no `extractIndexFields`; endpoint GET para lista de colaboradores |
| Backend — template | `routes/content-route-template.ts` | Modificação | Suportar query params `collaborator` e `date` na listagem com filtragem no índice antes da paginação |
| Composable | `composables/useDailyRecordsFilters.ts` | Novo | Estado dos filtros, lista de colaboradores, envio de query params via `useApi` |
| Componente UI | `components/daily-records/DailyRecordsFilters.vue` | Novo | Dropdowns de filtro (colaborador e data) |
| Vista | `views/daily-records/DailyRecordsListView.vue` | Modificação | Integrar filtros no slot `#filters`, passar params à `fetchList` |

### Decisões de design

- Filtragem server-side via query params — a API é paginada, filtrar client-side só afetaria a página atual
- Filtros aplicados no índice R2 antes da paginação — sem leitura de documentos individuais para filtrar
- Adicionar `technicianUserId` e `technicianName` ao índice de daily-records — permite filtrar sem ler cada documento
- Endpoint dedicado para lista de colaboradores únicos — extrai do índice, evita carregar todos os registos
- Reutilizar o padrão do `ExpirationDateFilter.vue` como referência para o componente de dropdown (select nativo, 44px, "Limpar filtro")
- Componente de filtros específico para daily-records (não genérico) — evita complexidade desnecessária
- `SearchParams.filters` já existe no frontend — reutilizar para enviar `collaborator` e `date`

## 2. Modelo de dados — campos de filtragem

### Campos no registo (já existentes)

| Campo                  | Tipo     | Localização no registo           | Formato            | Utilização                          |
| ------------------------| ----------| ----------------------------------| --------------------| -------------------------------------|
| `technician.firstName` | `string` | `item.data.technician.firstName` | Texto livre        | Compor nome completo do colaborador |
| `technician.lastName`  | `string` | `item.data.technician.lastName`  | Texto livre        | Compor nome completo do colaborador |
| `technician.userId`    | `string` | `item.data.technician.userId`    | UUID Clerk         | Identificador único do colaborador  |
| `dataRegistro`         | `string` | `item.data.dataRegistro`         | `YYYY-MM-DD` (ISO) | Data do registo                     |

### Campos a adicionar ao índice (`extractIndexFields`)

| Campo no índice | Origem | Tipo | Justificação |
|----------------|--------|------|--------------|
| `technicianUserId` | `data.technician.userId` | `string \| null` | Filtrar por colaborador sem ler documentos individuais |
| `technicianName` | `${data.technician.firstName} ${data.technician.lastName}` | `string \| null` | Apresentar nome no dropdown de colaboradores |
| `dataRegistro` | `data.dataRegistro` | `string` | Já existe implicitamente no `searchableText`, mas necessário como campo dedicado para filtragem exata |

### Regras de extração

- Nome completo do colaborador: `${technician.firstName} ${technician.lastName}`
- Identificador do colaborador no filtro: `technician.userId` (garante unicidade mesmo com nomes iguais)
- Registos sem `technician` definido: `technicianUserId` e `technicianName` ficam `null` no índice; excluídos da lista de colaboradores do filtro, mas visíveis na listagem quando nenhum filtro de colaborador está ativo
- Data do filtro UI: apresentada como `dd/mm/aaaa` (pt-PT), enviada como `YYYY-MM-DD` no query param para comparação direta com `dataRegistro`
- Índices existentes precisam de ser reconstruídos após a alteração ao `extractIndexFields` (criar/atualizar qualquer registo diário força a reconstrução do índice)

## 3. Backend — filtragem no índice e endpoint de colaboradores

### Query params suportados na listagem

| Param | Tipo | Obrigatório | Exemplo | Comportamento |
|-------|------|-------------|---------|---------------|
| `collaborator` | `string` | Não | `?collaborator=user_32q1WZ...` | Filtra entradas do índice onde `technicianUserId === valor` |
| `date` | `string` | Não | `?date=2026-03-25` | Filtra entradas do índice onde `dataRegistro === valor` |
| `search` | `string` | Não | `?search=manutenção` | Pesquisa existente por `searchableText` (mantida) |
| `page` | `number` | Não | `?page=1` | Paginação existente (mantida) |
| `limit` | `number` | Não | `?limit=10` | Limite por página existente (mantido) |

### Lógica de filtragem (no handler GET da listagem)

- Ler os query params `collaborator` e `date` do request
- Após filtrar itens eliminados (`!isDeleted`), aplicar filtros adicionais sobre as entradas do índice:
  - Se `collaborator` presente: manter apenas entradas com `technicianUserId === collaborator`
  - Se `date` presente: manter apenas entradas com `dataRegistro === date`
  - Se `search` presente: manter apenas entradas com `searchableText.includes(search)`
- Aplicar os três filtros em AND lógico
- Paginar sobre o resultado filtrado (não sobre o total)
- O `total` na resposta reflete a contagem filtrada

### Endpoint de colaboradores únicos

| Aspeto | Detalhe |
|--------|---------|
| Rota | `GET /api/content/daily-records/collaborators` |
| Resposta | `{ success: true, data: [{ userId, name }], timestamp }` |
| Origem | Lê o índice `indexes/daily-records-index.json` |
| Lógica | Extrair pares únicos `(technicianUserId, technicianName)` de entradas não eliminadas, ordenar alfabeticamente por `name` |
| Entradas sem técnico | Excluídas (onde `technicianUserId` é `null`) |

### Alteração ao `extractIndexFields` (daily-records.ts)

- Adicionar ao objeto retornado:
  - `technicianUserId`: `content.data.technician?.userId ?? null`
  - `technicianName`: `content.data.technician ? \`${content.data.technician.firstName} ${content.data.technician.lastName}\` : null`
  - `dataRegistro`: `content.data.dataRegistro` (campo dedicado, além do `searchableText`)

## 4. Composable `useDailyRecordsFilters`

### Interface exposta

| Membro | Tipo | Descrição | REQ-IDs |
|--------|------|-----------|---------|
| `selectedCollaborator` | `Ref<string \| null>` | `userId` do colaborador selecionado, `null` = sem filtro | REQ-01 |
| `selectedDate` | `Ref<string \| null>` | Data selecionada em formato `YYYY-MM-DD`, `null` = sem filtro | REQ-02 |
| `collaborators` | `Ref<{ userId: string; name: string }[]>` | Lista de colaboradores disponíveis, ordenada alfabeticamente | REQ-01 |
| `isLoadingCollaborators` | `Ref<boolean>` | Estado de carregamento da lista de colaboradores | REQ-01 |
| `hasActiveFilters` | `ComputedRef<boolean>` | `true` se pelo menos um filtro está ativo | REQ-04, REQ-05 |
| `filterParams` | `ComputedRef<Record<string, string>>` | Objeto com query params ativos (`{ collaborator?, date? }`) para passar ao `fetchList` | REQ-03 |
| `clearCollaborator()` | `() => void` | Limpa o filtro de colaborador | REQ-04 |
| `clearDate()` | `() => void` | Limpa o filtro de data | REQ-04 |
| `clearAll()` | `() => void` | Limpa todos os filtros | REQ-04 |
| `fetchCollaborators()` | `() => Promise<void>` | Carrega a lista de colaboradores do endpoint `/api/content/daily-records/collaborators` | REQ-01 |

### Comportamento

- `fetchCollaborators()` é chamado uma vez no `onMounted` da ListView
- Quando `selectedCollaborator` ou `selectedDate` mudam, a ListView re-invoca `fetchList` com os novos `filterParams`
- `filterParams` omite chaves com valor `null` (não envia params vazios)
- A paginação reinicia na página 1 quando qualquer filtro muda

## 5. Componente de filtros UI — `DailyRecordsFilters.vue`

### Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `collaborators` | `{ userId: string; name: string }[]` | Sim | Lista de colaboradores para o dropdown |
| `selectedCollaborator` | `string \| null` | Sim | Valor atual do filtro de colaborador |
| `selectedDate` | `string \| null` | Sim | Valor atual do filtro de data (formato `YYYY-MM-DD`) |
| `isLoadingCollaborators` | `boolean` | Não (default: `false`) | Mostra estado de carregamento no dropdown de colaboradores |

### Eventos emitidos

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `update:selectedCollaborator` | `string \| null` | Colaborador selecionado ou `null` ao limpar |
| `update:selectedDate` | `string \| null` | Data selecionada (`YYYY-MM-DD`) ou `null` ao limpar |

### Regras visuais

- Dois controlos lado a lado (flex row em desktop, flex col em mobile)
- Cada controlo tem `min-height: 44px` para alvos tácteis (REQ-06)
- Rótulos: "Colaborador" e "Data" em Português de Portugal (REQ-06)
- Dropdown de colaborador: `<select>` nativo com placeholder "Todos os colaboradores"
- Filtro de data: `<input type="date">` nativo para seleção de dia (REQ-02)
- Opção "Limpar filtro" visível no select de colaborador quando o filtro está ativo (padrão do `ExpirationDateFilter`)
- O dropdown de colaborador mostra o nome completo (primeiro nome + apelido) (REQ-01)
- Quando `isLoadingCollaborators` é `true`, o dropdown de colaborador mostra "A carregar..." como placeholder desativado

## 6. Integração na ListView — `DailyRecordsListView.vue`

### Alterações ao componente

| Aspeto | Estado atual | Alteração |
|--------|-------------|-----------|
| Importações | Sem composable de filtros | Importar `useDailyRecordsFilters` e `DailyRecordsFilters` |
| Setup | Sem estado de filtros | Inicializar composable, chamar `fetchCollaborators()` no `onMounted` |
| Slot `#filters` | Não utilizado | Renderizar `DailyRecordsFilters` com v-model para colaborador e data |
| `fetchList` params | `{ search, page, limit }` | Adicionar `...filterParams` ao objeto de params |
| Watch de filtros | Inexistente | Watch em `selectedCollaborator` e `selectedDate` → re-invocar `fetchList` com `page: 1` |
| Mensagem vazia | Mensagem genérica única | Mensagem diferenciada quando `hasActiveFilters` é `true` (REQ-05) |

### Fluxo de dados

- `DailyRecordsFilters` emite alterações via `v-model:selectedCollaborator` e `v-model:selectedDate`
- O watch deteta a mudança, reinicia a página para 1, e chama `fetchList` com os `filterParams` atualizados
- A pesquisa por texto existente continua a funcionar em paralelo (AND lógico com os filtros)
- A paginação opera sobre os resultados já filtrados pelo backend

### Mensagem de estado vazio com filtros

- Quando `hasActiveFilters` é `true` e a lista está vazia: "Não foram encontrados registos para os filtros selecionados"
- Quando `hasActiveFilters` é `false` e a lista está vazia: mensagem padrão existente ("Não há registos diários cadastrados no sistema.")
- Os filtros permanecem visíveis e editáveis em ambos os casos (REQ-05)

## 7. Tratamento de erros

| Cenário | Comportamento | Mensagem / Resultado |
|---------|---------------|----------------------|
| Erro ao carregar lista de colaboradores | `isLoadingCollaborators` volta a `false`, dropdown mostra placeholder de erro | "Erro ao carregar colaboradores" no dropdown; filtro de data continua funcional |
| Erro ao carregar lista de registos (com filtros ativos) | Comportamento de erro existente (`ErrorComponent`) | Mensagem de erro existente; filtros permanecem visíveis e editáveis |
| Nenhum registo corresponde aos filtros | Lista vazia com mensagem diferenciada | "Não foram encontrados registos para os filtros selecionados" |
| Nenhum registo no sistema (sem filtros) | Lista vazia com mensagem padrão | "Não há registos diários cadastrados no sistema." |
| Nenhum colaborador com registos | Dropdown de colaborador sem opções | Dropdown mostra apenas "Todos os colaboradores" (sem opções adicionais) |
| Alterações rápidas de filtro em sequência | Apenas o último estado é aplicado | O watch com `fetchList` garante que apenas o pedido mais recente é relevante |
