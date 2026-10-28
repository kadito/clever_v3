# [MA] Plano de Aceitação Executável — Instalações e Programações (Refactor)

| Test ID | CA-ID | Given / When / Then | Dados | Critério de Passagem |
|---------|-------|---------------------|-------|---------------------|
| T-01 | CA-01.1 | Given técnico autenticado / When cria registo / Then número único gerado | Técnico: "João Silva" | Registo criado com ID único, sem duplicados |
| T-02 | CA-01.2 | Given registo existe / When aberto / Then 5 fases apresentadas | Registo com ID existente | Fases visíveis: Programação/Preparação, Preparação Instalação, Instalação no Cliente, Testes, Finalização |
| T-03 | CA-01.6 | Given técnico autenticado / When cria registo / Then técnico atribuído | Técnico autenticado via Clerk | Campo técnico preenchido automaticamente |
| T-04 | CA-02.1-02.5 | Given técnico na Fase 1 / When formulário apresentado / Then novos campos visíveis | — | Campos: Tipo Programação, Nº Série, Nº Equipamento, Leituras Guardadas (texto), Teste Final (switch) |
| T-05 | CA-02.8 | Given módulo atualizado / When Fase 1 apresentada / Then campos antigos ausentes | — | Campos PLUS, Departamento, Cabeçalho, Rede, switches ligações, Vectron condicional NÃO presentes |
| T-06 | CA-02.6 | Given técnico preencheu Fase 1 / When submete / Then dados guardados | Tipo: "POS", Série: "123", Equip: "456", Leituras: "OK" | Dados persistidos no registo |
| T-07 | CA-03.1 | Given técnico na Fase 2 / When formulário apresentado / Then checklist por categorias | — | Categorias com switches de verificação |
| T-08 | CA-03.10 | Given técnico na checklist / When marca item / Then estado guardado | Marcar "Cabo POS" na categoria POS | Estado switch persistido imediatamente |
| T-09 | CA-03.11 | Given categoria parcialmente verificada / When visualizada / Then progresso visível | 2 de 4 itens POS marcados | Indicador mostra "2/4" |
| T-10 | CA-04.1 | Given técnico na Fase 3, Dados Gerais / When acede campo cliente / Then lista apresentada | Clientes existentes no sistema | Dropdown/lista de clientes disponível |
| T-11 | CA-04.2-04.4 | Given técnico na Fase 3, Dados Gerais / When formulário apresentado / Then campos visíveis | — | Nº Fatura, Nº Guia Transporte, Data Instalação, Técnico (auto) |
| T-12 | CA-04.5 | Given técnico na Fase 3, Detalhes / When formulário apresentado / Then campos data/hora | — | Data, Hora Inicial, Hora Final visíveis |
| T-13 | CA-04.6-04.8 | Given técnico na Fase 3, Formação / When formulário apresentado / Then campos formação | — | Data Formação, Hora Inicial, Hora Final, Quem recebeu, Técnico |
| T-14 | CA-04.9 | Given técnico na Fase 3, Material / When formulário apresentado / Then switches material | — | POS, CPA, Balança, CCTV, Alarme, Impressora, UPS, Router, Switch |
| T-15 | CA-05.1-05.3 | Given técnico na Fase 4 / When testa Anydesk / Then campos condicionais | Anydesk=Sim: código; Anydesk=Não: motivo | Campo correto apresentado conforme switch |
| T-16 | CA-05.4-05.6 | Given técnico na Fase 4 / When testa Vectron / Then campos condicionais | VectronConnect=Sim: código; =Não: motivo | Campo correto apresentado conforme switch |
| T-17 | CA-06.1-06.5 | Given técnico na Fase 5 / When completa verificações / Then instalação finalizada | DUMP=Sim, Cópia=Sim, Foto=Sim+URL | Instalação marcada como finalizada |
| T-18 | CA-08.1-08.3 | Given registo aberto / When navega entre fases / Then navegação livre | Fase 1 incompleta, aceder Fase 3 | Navegação permitida sem bloqueio |
| T-19 | CA-08.5-08.6 | Given todas fases completas / When última fase completada / Then concluído | 5/5 fases completas | Registo marcado como concluído, visível na lista |
| T-20 | CA-04.11 | Given técnico na Fase 3 / When seleciona cliente inexistente / Then erro | clientId inválido | Mensagem de erro estruturada apresentada |
| T-21 | CA-09.2 | Given dispositivo móvel / When interage com elementos / Then touch targets OK | Ecrã 375px largura | Todos os elementos interativos ≥ 44px |

## [MI] — Estratégia de Testes de Integração

| Interface | Âmbito do teste | Dependências mockadas | REQ-ID |
|-----------|----------------|----------------------|--------|
| `Phase1Data` (tipos shared) | Validar que a nova interface compila e é compatível com `InstallationsProgrammingData` | Nenhuma | REQ-02 |
| `calculateCompletedPhases()` (shared/validation) | Verificar cálculo de completude com novos campos Fase 1 (campos preenchidos → fase completa, campos vazios → incompleta) | Nenhuma (função pura) | REQ-08 |
| `defaultPhase1()` (backend/routes) | Verificar que retorna objeto com os 5 campos novos e valores default corretos | Nenhuma (factory pura) | REQ-02 |
| `validateCreate()` (backend/routes) | Verificar inicialização de phase1 com defaults novos, auto-assign technician, e phase3 com `tecnicoFormacao` | `UserContext` mock, `extractTechnicianUser` mock | REQ-01, REQ-02, REQ-04 |
| `validateUpdate()` (backend/routes) | Verificar merge parcial de phase1 (novos campos), recálculo de completedPhases, e preservação de `tecnicoFormacao` | `InstallationsProgramming` existente mock | REQ-01, REQ-02, REQ-08 |
| `InstallationsProgrammingCreateView` (frontend) | Verificar que Fase 1 apresenta 5 campos novos e Fase 3 está organizada em 4 secções | `useApi` mock, `useAuth` mock | REQ-02, REQ-04, REQ-09 |
| `InstallationsProgrammingDetailView` (frontend) | Verificar que Fase 1 mostra campos novos e Fase 3 organizada em 4 secções | `useApi` mock | REQ-02, REQ-04 |
| `InstallationsProgrammingUpdateView` (frontend) | Verificar edição de Fase 1 com campos novos e Fase 3 com `tecnicoFormacao` | `useApi` mock | REQ-02, REQ-04 |

## [MI] — Plano Executável

| Test ID | Interface | Comportamento | Dados de entrada | Resultado esperado | REQ-ID |
|---------|-----------|---------------|------------------|--------------------|--------|
| MI-01 | `Phase1Data` (tipos) | Nova interface compila com 5 campos | `{ tipoProgramacao: '', numeroSerie: '', numeroEquipamento: '', leiturasGuardadas: '', testeFinal: false }` | Objeto válido, compatível com `InstallationsProgrammingData` | REQ-02 |
| MI-02 | `Phase1Data` (tipos) | Campos antigos removidos | Tentativa de aceder `plus`, `departamento`, `isVectron` | Erro de compilação TypeScript | REQ-02 |
| MI-03 | `Phase1Data` (tipos) | Sub-interfaces removidas | Tentativa de importar `VectronLeituraXData`, `VectronConsultaDiariaData` | Erro de compilação TypeScript | REQ-02 |
| MI-04 | `calculateCompletedPhases()` | Fase 1 completa — campo texto preenchido | `phase1: { tipoProgramacao: 'POS', numeroSerie: '', numeroEquipamento: '', leiturasGuardadas: '', testeFinal: false }` | Fase 1 contada como completa | REQ-08 |
| MI-05 | `calculateCompletedPhases()` | Fase 1 completa — testeFinal true | `phase1: { tipoProgramacao: '', numeroSerie: '', numeroEquipamento: '', leiturasGuardadas: '', testeFinal: true }` | Fase 1 contada como completa | REQ-08 |
| MI-06 | `calculateCompletedPhases()` | Fase 1 incompleta — todos vazios | `phase1: { tipoProgramacao: '', numeroSerie: '', numeroEquipamento: '', leiturasGuardadas: '', testeFinal: false }` | Fase 1 NÃO contada como completa | REQ-08 |
| MI-07 | `calculateCompletedPhases()` | Fases 2-5 inalteradas | Dados completos para fases 2-5, fase 1 vazia | Fases 2-5 contadas, fase 1 não | REQ-08 |
| MI-08 | `defaultPhase1()` | Retorna defaults corretos | Nenhum | `{ tipoProgramacao: '', numeroSerie: '', numeroEquipamento: '', leiturasGuardadas: '', testeFinal: false }` | REQ-02 |
| MI-09 | `defaultPhase3()` | Inclui tecnicoFormacao | Nenhum | Objeto com `tecnicoFormacao: ''` presente | REQ-04 |
| MI-10 | `validateCreate()` | Inicializa phase1 com novos defaults | Body vazio + UserContext mock | `phase1` contém 5 campos novos com defaults | REQ-01, REQ-02 |
| MI-11 | `validateCreate()` | Inicializa phase3 com tecnicoFormacao | Body vazio + UserContext mock | `phase3.tecnicoFormacao === ''` | REQ-04 |
| MI-12 | `validateCreate()` | Auto-assign technician | Body vazio + UserContext mock com userId | `technician` preenchido com dados do utilizador | REQ-01 |
| MI-13 | `validateCreate()` | Erro sem contexto de autenticação | Body vazio + UserContext null | Erro lançado: autenticação necessária | REQ-01 |
| MI-14 | `validateUpdate()` | Merge parcial phase1 novos campos | Existente com defaults + update `{ phase1: { tipoProgramacao: 'CPA' } }` | `phase1.tipoProgramacao === 'CPA'`, restantes mantidos | REQ-02 |
| MI-15 | `validateUpdate()` | Recálculo completedPhases | Existente com phase1 vazia + update `{ phase1: { numeroSerie: '123' } }` | `completedPhases` incrementado | REQ-08 |
| MI-16 | `validateUpdate()` | Preserva tecnicoFormacao | Existente com `tecnicoFormacao: 'Ana'` + update sem phase3 | `phase3.tecnicoFormacao === 'Ana'` | REQ-04 |

| MI-17 | `InstallationsProgrammingCreateView` | Fase 1 apresenta 5 campos novos | Render com formData default | 4 inputs texto + 1 switch visíveis, campos antigos ausentes | REQ-02, REQ-09 |
| MI-18 | `InstallationsProgrammingCreateView` | Fase 3 organizada em 4 secções | Render com formData default | Secções Dados Gerais, Detalhes, Formação (com tecnicoFormacao), Material visíveis | REQ-04, REQ-09 |
| MI-19 | `InstallationsProgrammingDetailView` | Fase 1 mostra campos novos | Render com registo preenchido | 5 campos novos exibidos, campos antigos ausentes | REQ-02 |
| MI-20 | `InstallationsProgrammingDetailView` | Fase 3 organizada em 4 secções | Render com registo preenchido | 4 secções com labels corretos, tecnicoFormacao visível | REQ-04 |
| MI-21 | `InstallationsProgrammingUpdateView` | Fase 1 editável com campos novos | Render com registo existente | 4 inputs texto + 1 switch editáveis, populateFormData correto | REQ-02 |
| MI-22 | `InstallationsProgrammingUpdateView` | Fase 3 com tecnicoFormacao editável | Render com registo existente | Campo tecnicoFormacao editável na secção Formação | REQ-04 |

## [MA] — Plano Executável

| Test ID | CA-ID | Given / When / Then | Dados | Critério de Passagem |
|---------|-------|---------------------|-------|---------------------|
| MA-01 | CA-01.1 | Given técnico autenticado / When cria registo / Then número único gerado | Técnico: "João Silva" | Registo criado com ID único, sem duplicados |
| MA-02 | CA-01.2 | Given registo existe / When aberto / Then 5 fases apresentadas | Registo com ID existente | Fases: Programação/Preparação, Preparação Instalação, Instalação no Cliente, Testes, Finalização |
| MA-03 | CA-01.3 | Given registo existe / When técnico edita campo / Then alteração guardada | Editar tipoProgramacao de '' para 'POS' | Valor persistido após reload |
| MA-04 | CA-01.4 | Given registo com fases parciais / When visualizado / Then progresso visível | 3/5 fases completas | Indicador mostra 3/5 |
| MA-05 | CA-01.5 | Given registos existem / When acede lista / Then lista com pesquisa | 3 registos no sistema | Lista apresentada com pesquisa funcional |
| MA-06 | CA-01.6 | Given técnico autenticado / When cria registo / Then técnico atribuído | Técnico via Clerk | Campo técnico preenchido automaticamente |
| MA-07 | CA-02.1 | Given técnico na Fase 1 / When formulário apresentado / Then campo Tipo Programação | — | Input texto visível com label "Tipo de Programação" |
| MA-08 | CA-02.2 | Given técnico na Fase 1 / When formulário apresentado / Then campo Nº Série | — | Input texto visível com label "Número de Série" |
| MA-09 | CA-02.3 | Given técnico na Fase 1 / When formulário apresentado / Then campo Nº Equipamento | — | Input texto visível com label "Nº Equipamento" |
| MA-10 | CA-02.4 | Given técnico na Fase 1 / When formulário apresentado / Then campo Leituras | — | Textarea visível com label "Leituras Guardadas" |
| MA-11 | CA-02.5 | Given técnico na Fase 1 / When formulário apresentado / Then switch Teste Final | — | Switch visível com label "Teste Final a todos os equipamentos e acessórios" |
| MA-12 | CA-02.6 | Given técnico preencheu Fase 1 / When submete / Then dados guardados | Tipo: "POS", Série: "123" | Dados persistidos no registo |
| MA-13 | CA-02.7 | Given Fase 1 preenchida / When edita campo / Then alteração guardada | Alterar Tipo de "POS" para "CPA" | Novo valor persistido |
| MA-14 | CA-02.8 | Given módulo atualizado / When Fase 1 apresentada / Then campos antigos ausentes | — | PLUS, Departamento, Cabeçalho, Rede, switches ligações, Vectron NÃO presentes |
| MA-15 | CA-03.1 | Given técnico na Fase 2 / When formulário apresentado / Then checklist categorias | — | Categorias com switches |
| MA-16 | CA-03.2 | Given categoria POS / When visualizada / Then itens corretos | — | Cabo POS, WER, Transformador, Cabo Rede |
| MA-17 | CA-03.3 | Given categoria Display / When visualizada / Then itens corretos | — | Impressora, Rolo, Cabo Power, Transformador, Cabo Ligação POS, Ficha Adaptador RS232, Autocolantes |
| MA-18 | CA-03.4 | Given categoria Gaveta / When visualizada / Then itens corretos | — | Chaves, Autocolantes |
| MA-19 | CA-03.5 | Given categoria CPA / When visualizada / Then itens corretos | — | 12 itens conforme CA-03.5 |
| MA-20 | CA-03.6 | Given categoria Balanças / When visualizada / Then itens corretos | — | Cabo Power, Transformador, Folha 1ª Verificação, Autocolante |
| MA-21 | CA-03.7 | Given categoria CCTV / When visualizada / Then itens corretos | — | DVR, Câmaras, Transformador, Cabo Power, Fichas, Placas Licença, Autocolantes |
| MA-22 | CA-03.8 | Given categoria Router/Switch / When visualizada / Then itens corretos | — | Router, Switch, Cabo Power, Transformador, Cabo Rede, Autocolante |
| MA-23 | CA-03.9 | Given categoria Acessórios / When visualizada / Then itens corretos | — | 12 itens conforme CA-03.9 |
| MA-24 | CA-03.10 | Given técnico na checklist / When marca item / Then estado guardado | Marcar "Cabo POS" | Estado persistido imediatamente |
| MA-25 | CA-03.11 | Given categoria parcial / When visualizada / Then progresso | 2/4 POS marcados | Indicador "2/4" visível |
| MA-26 | CA-04.1 | Given Fase 3, Dados Gerais / When acede cliente / Then lista apresentada | Clientes existentes | Dropdown de clientes disponível |
| MA-27 | CA-04.2 | Given Fase 3, Dados Gerais / When formulário / Then campos texto | — | Nº Fatura, Nº Guia Transporte visíveis |
| MA-28 | CA-04.3 | Given Fase 3, Dados Gerais / When formulário / Then campo data | — | Data de Instalação visível |
| MA-29 | CA-04.4 | Given técnico autenticado na Fase 3 / When formulário / Then técnico auto | — | Técnico instalação preenchido automaticamente |
| MA-30 | CA-04.5 | Given Fase 3, Detalhes / When formulário / Then campos data/hora | — | Data, Hora Inicial, Hora Final visíveis |
| MA-31 | CA-04.6 | Given Fase 3, Formação / When formulário / Then campos data/hora formação | — | Data Formação, Hora Inicial, Hora Final visíveis |
| MA-32 | CA-04.7 | Given Fase 3, Formação / When formulário / Then campo quem recebeu | — | Campo texto "Quem recebeu formação" visível |
| MA-33 | CA-04.8 | Given Fase 3, Formação / When formulário / Then campo técnico formação | — | Campo texto "Técnico Responsável pela Formação" visível |
| MA-34 | CA-04.9 | Given Fase 3, Material / When formulário / Then switches material | — | 9 switches: POS, CPA, Balança, CCTV, Alarme, Impressora, UPS, Router, Switch |
| MA-35 | CA-04.10 | Given Rolos ativado / When switch marcado / Then campo quantidade | Rolos = true | Campo numérico quantidade visível |
| MA-36 | CA-04.11 | Given Fase 3 / When cliente inexistente / Then erro | clientId inválido | Mensagem erro estruturada |
| MA-37 | CA-05.1 | Given Fase 4 / When formulário / Then switch Anydesk | — | Switch Anydesk visível |
| MA-38 | CA-05.2 | Given Anydesk=Sim / When ativado / Then campo código | — | Campo texto código Anydesk visível |
| MA-39 | CA-05.3 | Given Anydesk=Não / When desativado / Then campo motivo | — | Campo texto motivo visível |
| MA-40 | CA-05.4 | Given Fase 4 / When formulário / Then switch Vectron | — | Switch Vectron Connect visível |
| MA-41 | CA-05.5 | Given Vectron=Sim / When ativado / Then campo código | — | Campo texto código Vectron visível |
| MA-42 | CA-05.6 | Given Vectron=Não / When desativado / Then campo motivo | — | Campo texto motivo visível |
| MA-43 | CA-06.1 | Given Fase 5 / When formulário / Then switch DUMP | — | Switch DUMP lido visível |
| MA-44 | CA-06.2 | Given Fase 5 / When formulário / Then switch cópia segurança | — | Switch cópia segurança visível |
| MA-45 | CA-06.3 | Given Fase 5 / When formulário / Then switch foto | — | Switch foto instalação visível |
| MA-46 | CA-06.4 | Given foto=Sim / When ativado / Then campo URL | — | Campo texto URL Drive visível |
| MA-47 | CA-06.5 | Given todas verificações Fase 5 / When completas / Then finalizada | DUMP+Cópia+Foto completos | Instalação marcada finalizada |
| MA-48 | CA-07.1 | Given Fase 3 / When acede seleção cliente / Then lista clientes | Clientes existentes | Lista de clientes apresentada |
| MA-49 | CA-07.2 | Given cliente selecionado / When guarda / Then clientId armazenado | Cliente "Empresa X" | clientId persistido |
| MA-50 | CA-07.3 | Given registo com clientId / When apresentado / Then nome resolvido | clientId válido | Nome do cliente exibido |
| MA-51 | CA-07.4 | Given clientId inválido / When apresentado / Then erro | clientId inexistente | Mensagem erro estruturada (vermelho) |
| MA-52 | CA-07.5 | Given registo com cliente / When visto em qualquer vista / Then relação consistente | clientId válido | Nome cliente consistente em Detail, List, Edit |
| MA-53 | CA-08.1 | Given registo aberto / When navega / Then 5 fases sequenciais | — | Fases navegáveis na ordem correta |
| MA-54 | CA-08.2 | Given fases em diferentes estados / When visualizado / Then indicador | 2 completas, 1 em curso, 2 por iniciar | Indicador visual correto |
| MA-55 | CA-08.3 | Given fase anterior incompleta / When acede outra / Then permitido | Fase 1 vazia, aceder Fase 3 | Navegação livre permitida |
| MA-56 | CA-08.4 | Given campos obrigatórios preenchidos / When completa fase / Then marcada | Fase 1 com tipoProgramacao preenchido | Fase marcada como completa |
| MA-57 | CA-08.5 | Given 5 fases completas / When última completada / Then concluído | 5/5 fases | Registo marcado concluído |
| MA-58 | CA-08.6 | Given registos com diferentes estados / When lista / Then progresso visível | 3 registos: 1/5, 3/5, 5/5 | Progresso visível por registo |
| MA-59 | CA-09.1 | Given módulo disponível / When acede / Then 5 vistas | — | Home tile, Lista, Detalhe, Criar, Editar |
| MA-60 | CA-09.2 | Given dispositivo móvel / When interage / Then touch targets | Ecrã 375px | Todos elementos ≥ 44px |
| MA-61 | CA-09.3 | Given qualquer vista / When apresentada / Then labels PT | — | Todos labels em Português de Portugal |
| MA-62 | CA-09.4 | Given checklist no telemóvel / When toca switches / Then otimizado | — | Switches otimizados para toque |
| MA-63 | CA-09.5 | Given múltiplas categorias / When ecrã pequeno / Then colapsável | Ecrã 375px | Categorias colapsáveis |
| MA-64 | CA-09.6 | Given telemóvel / When navega fases / Then acessível | — | Navegação acessível por toque |
| MA-65 | CA-10.1 | Given registo criado / When armazenado / Then BaseContent | — | Estrutura BaseContent respeitada |
| MA-66 | CA-10.2 | Given registo criado/atualizado / When operação / Then audit trail | — | Timestamps e info utilizador registados |
| MA-67 | CA-10.3 | Given técnico elimina / When confirma / Then eliminado | — | Confirmação prévia + eliminação |
| MA-68 | CA-10.4 | Given registo guardado / When operação / Then padrão chaves | — | Chaves R2 seguem padrão |
| MA-69 | CA-10.5 | Given registo CRUD / When operação / Then índices sincronizados | — | Índices atualizados |
| MA-70 | CA-10.6 | Given utilizador acede / When verifica permissões / Then respeitadas | Admin vs User | Permissões Admin/User aplicadas |
