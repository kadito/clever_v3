# Documento de Requisitos — Instalações e Programações

## Introdução

Este documento define os requisitos para o novo content type "Instalações e Programações" no dashboard CLEVER. Este módulo permite acompanhar o processo completo de instalação e programação de equipamentos em clientes, desde a configuração inicial até à finalização.

O processo é dividido em 5 fases sequenciais, cada uma com campos e validações específicas, garantindo que todos os passos foram cumpridos antes de considerar a instalação concluída.

Frequência estimada: média (~2-5/semana), dependendo do volume de novas instalações.

## Glossário

- **Instalação**: Registo completo do processo de instalação de equipamentos num cliente, composto por 5 fases
- **Fase**: Etapa do processo de instalação; cada fase agrupa um conjunto de campos e validações
- **Programação**: Fase 1 — configuração inicial do equipamento antes da deslocação ao cliente
- **Preparação**: Fase 2 — verificação de todo o material necessário para a instalação
- **Checklist**: Conjunto de itens de verificação (switches) que confirmam a presença de material
- **Formação**: Sessão de treino dada ao cliente após a instalação do equipamento
- **DUMP**: Leitura de dados do equipamento para verificação pós-instalação
- **POS**: Terminal de ponto de venda (Point of Sale)
- **CPA**: Equipamento de contagem e pagamento automático
- **CCTV**: Sistema de videovigilância (Closed-Circuit Television)
- **Vectron Connect**: Software de gestão remota de equipamentos Vectron
- **Anydesk**: Software de acesso remoto a equipamentos
- **Técnico**: Utilizador do sistema responsável pela instalação
- **Cliente**: Entidade que recebe a instalação (content type Clientes existente)


## Requisitos

### REQ-01: Gestão de Registos de Instalação

**User Story:** Como técnico, quero criar e gerir registos de instalação, para acompanhar todo o processo de instalação de equipamentos em clientes.

#### Critérios de Aceitação

- CA-01.1: O sistema **SHALL** permitir criar novos registos de instalação com um número único gerado automaticamente
- CA-01.2: O sistema **SHALL** armazenar o registo com as 5 fases: Programação, Preparação, Instalação no Cliente, Testes e Finalização
- CA-01.3: O sistema **SHALL** permitir editar um registo existente para atualizar campos de qualquer fase
- CA-01.4: O sistema **SHALL** apresentar o estado de progresso do registo, indicando quais fases estão completas
- CA-01.5: O sistema **SHALL** permitir listar, pesquisar e visualizar registos de instalação
- CA-01.6: **WHEN** um registo é criado, o sistema **SHALL** atribuir automaticamente o técnico autenticado como responsável


### REQ-02: Fase 1 — Programação

**User Story:** Como técnico, quero registar a configuração inicial do equipamento, para garantir que a programação foi feita corretamente antes da instalação.

#### Critérios de Aceitação

- CA-02.1: O sistema **SHALL** apresentar um formulário com os seguintes campos de texto: PLUS, Departamento, Cabeçalho, Rede, Vectron Connect, Anydesk, Séries/Nº Equipamentos
- CA-02.2: O sistema **SHALL** apresentar os seguintes campos switch (ligado/desligado): Ligação a CPA, Ligação a Gaveta, Ligação a Impressora ou Monitor de Pedidos, Ligação a Faturadora, Ligação a Display Clientes, Ligação a Scanner, Ligação a Leitor de Cartões, Ligação a Fechadura de Chaves de Operador
- CA-02.3: O sistema **SHALL** apresentar um campo de texto para configuração dos vários turnos
- CA-02.4: O sistema **SHALL** apresentar um switch para indicar se o equipamento é Vectron
- CA-02.5: **WHEN** o switch Vectron está ativado, o sistema **SHALL** apresentar o grupo "Programação Leitura X" com os seguintes campos de texto: Plus 1, Plus 2, Departamentos, Operadores, Transações C/IVA
- CA-02.6: **WHEN** o switch Vectron está ativado, o sistema **SHALL** apresentar o grupo "Tecla Só Consulta Diária" com os seguintes campos de texto: Leitura Gerente Normal, Leitura Supervisor
- CA-02.7: **WHEN** o técnico preenche os campos da Fase 1, o sistema **SHALL** guardar os dados no registo de instalação
- CA-02.8: O sistema **SHALL** permitir editar os campos da Fase 1 após o preenchimento inicial


### REQ-03: Fase 2 — Preparação da Instalação

**User Story:** Como técnico, quero verificar todo o material necessário antes de ir ao cliente, para garantir que nada fica esquecido.

#### Critérios de Aceitação

- CA-03.1: O sistema **SHALL** apresentar uma checklist de material organizada por categorias, onde cada item é um switch de verificação
- CA-03.2: O sistema **SHALL** incluir a categoria **POS** com os itens: Cabo POS, WER, Transformador, Cabo Rede
- CA-03.3: O sistema **SHALL** incluir a categoria **Display Cliente** com os itens: Impressora, Rolo, Cabo Power, Transformador, Cabo Ligação POS, Ficha Adaptador RS232, Autocolantes
- CA-03.4: O sistema **SHALL** incluir a categoria **Gaveta Metálica** com os itens: Chaves, Autocolantes
- CA-03.5: O sistema **SHALL** incluir a categoria **CPA** com os itens: Base, Parafusos, Cabo Power, Transformador, Cabo Comunicação Entre Moedas e Notas, Cabo Rede, Cabo Série, Cabo USB, Chaves, Site Gestiinforma no Display, Folha com Códigos, Autocolantes
- CA-03.6: O sistema **SHALL** incluir a categoria **Balanças** com os itens: Cabo Power, Transformador, Folha 1ª Verificação, Autocolante
- CA-03.7: O sistema **SHALL** incluir a categoria **CCTV** com os itens: DVR, Câmaras, Transformador, Cabo Power, Fichas, Placas Licença, Autocolantes
- CA-03.8: O sistema **SHALL** incluir a categoria **Router/Switch** com os itens: Router, Switch, Cabo Power, Transformador, Cabo Rede, Autocolante
- CA-03.9: O sistema **SHALL** incluir a categoria **Acessórios** com os itens: Bobine de Cabos, Fichas de Rede, Adaptadores de Impressora, Monitor Interno, Soprador, Álcool, Pincel, Panos, Braçadeiras, Mangueira, Mala de Ferramentas, Autocolantes
- CA-03.10: **WHEN** o técnico marca/desmarca itens da checklist, o sistema **SHALL** guardar o estado imediatamente no registo
- CA-03.11: O sistema **SHALL** apresentar um indicador visual do progresso da checklist por categoria (ex: 3/4 itens verificados)


### REQ-04: Fase 3 — Instalação no Cliente

**User Story:** Como técnico, quero registar os detalhes da instalação no local do cliente, para documentar o trabalho realizado e a formação dada.

#### Critérios de Aceitação

- CA-04.1: O sistema **SHALL** permitir selecionar um cliente existente (relação com content type Clientes)
- CA-04.2: O sistema **SHALL** apresentar campos de texto para: Nº Fatura, Nº Guia de Transportes
- CA-04.3: O sistema **SHALL** registar automaticamente o técnico responsável a partir do utilizador autenticado
- CA-04.4: O sistema **SHALL** apresentar campos de data e hora para os detalhes da instalação: Data de Instalação, Hora Inicial, Hora Final
- CA-04.5: O sistema **SHALL** apresentar campos de data e hora para a formação: Data de Formação, Hora Inicial, Hora Final
- CA-04.6: O sistema **SHALL** apresentar um campo de texto para registar quem recebeu a formação
- CA-04.7: O sistema **SHALL** apresentar switches para o material instalado: POS, CPA, Balança, CCTV, Alarme, Impressora, UPS, Router, Switch
- CA-04.8: **WHEN** o material instalado inclui Rolos, o sistema **SHALL** apresentar um campo numérico para indicar a quantidade
- CA-04.9: **IF** o cliente selecionado não for encontrado, **THEN** o sistema **SHALL** apresentar uma mensagem de erro adequada


### REQ-05: Fase 4 — Testes

**User Story:** Como técnico, quero registar os resultados dos testes pós-instalação, para confirmar que o equipamento está funcional e acessível remotamente.

#### Critérios de Aceitação

- CA-05.1: O sistema **SHALL** apresentar um switch para o teste de Anydesk (Sim/Não)
- CA-05.2: **WHEN** o teste de Anydesk é marcado como Sim, o sistema **SHALL** apresentar um campo de texto para o código Anydesk
- CA-05.3: **WHEN** o teste de Anydesk é marcado como Não, o sistema **SHALL** apresentar um campo de texto para o motivo da falha
- CA-05.4: O sistema **SHALL** apresentar um switch para o teste de Vectron Connect (Sim/Não)
- CA-05.5: **WHEN** o teste de Vectron Connect é marcado como Sim, o sistema **SHALL** apresentar um campo de texto para o código Vectron Connect
- CA-05.6: **WHEN** o teste de Vectron Connect é marcado como Não, o sistema **SHALL** apresentar um campo de texto para o motivo da falha


### REQ-06: Fase 5 — Finalização

**User Story:** Como técnico, quero registar as verificações finais da instalação, para confirmar que o processo está completo e documentado.

#### Critérios de Aceitação

- CA-06.1: O sistema **SHALL** apresentar um switch para confirmar que o DUMP foi lido
- CA-06.2: O sistema **SHALL** apresentar um switch para confirmar que a cópia de segurança foi feita
- CA-06.3: O sistema **SHALL** apresentar um switch para indicar se existe foto da instalação
- CA-06.4: **WHEN** o switch de foto da instalação é marcado como Sim, o sistema **SHALL** apresentar um campo de texto para o URL da Drive com a foto
- CA-06.5: **WHEN** todas as verificações da Fase 5 estão completas, o sistema **SHALL** marcar a instalação como finalizada


### REQ-07: Relação com Cliente

**User Story:** Como técnico, quero associar a instalação a um cliente existente, para manter o histórico de instalações por cliente.

#### Critérios de Aceitação

- CA-07.1: **WHEN** o técnico cria ou edita uma instalação na Fase 3, o sistema **SHALL** permitir selecionar um cliente existente a partir da lista de Clientes
- CA-07.2: O sistema **SHALL** armazenar a relação com o cliente usando o campo clientId
- CA-07.3: **WHEN** o registo de instalação é apresentado, o sistema **SHALL** resolver e exibir o nome do cliente associado
- CA-07.4: **IF** a relação com o cliente não puder ser resolvida, **THEN** o sistema **SHALL** apresentar uma mensagem de erro estruturada
- CA-07.5: O sistema **SHALL** manter a integridade da relação com o cliente em todas as vistas


### REQ-08: Fluxo de Fases e Progressão

**User Story:** Como técnico, quero navegar entre as fases da instalação e ver o progresso geral, para saber rapidamente o que já foi feito e o que falta.

#### Critérios de Aceitação

- CA-08.1: O sistema **SHALL** apresentar as 5 fases de forma sequencial e navegável (Programação → Preparação → Instalação no Cliente → Testes → Finalização)
- CA-08.2: O sistema **SHALL** apresentar um indicador visual de progresso que mostre quais fases estão completas, em curso ou por iniciar
- CA-08.3: O sistema **SHALL** permitir navegar livremente entre fases, sem obrigar a completar uma fase antes de aceder à seguinte
- CA-08.4: **WHEN** todos os campos obrigatórios de uma fase estão preenchidos, o sistema **SHALL** marcar essa fase como completa no indicador de progresso
- CA-08.5: **WHEN** todas as 5 fases estão completas, o sistema **SHALL** marcar o registo de instalação como concluído
- CA-08.6: O sistema **SHALL** apresentar na vista de lista o estado de progresso de cada registo (ex: 3/5 fases completas)


### REQ-09: Interface Mobile-First

**User Story:** Como técnico em campo, quero aceder ao registo de instalação no telemóvel, para preencher as fases durante o trabalho no local do cliente.

#### Critérios de Aceitação

- CA-09.1: O sistema **SHALL** seguir o padrão de 5 vistas: Home tile, Lista, Detalhe, Criar, Editar
- CA-09.2: O sistema **SHALL** garantir touch targets mínimos de 44px em todos os elementos interativos
- CA-09.3: O sistema **SHALL** apresentar todos os labels da interface em Português de Portugal
- CA-09.4: O sistema **SHALL** otimizar os switches da checklist (Fase 2) para uso táctil em dispositivos móveis
- CA-09.5: O sistema **SHALL** apresentar as categorias da checklist de forma colapsável para reduzir scroll em ecrãs pequenos
- CA-09.6: O sistema **SHALL** adaptar o layout das fases para ecrãs móveis, com navegação entre fases acessível por toque


### REQ-10: Persistência e Auditoria

**User Story:** Como administrador, quero que os dados de instalação sejam armazenados de forma consistente com os outros content types, para manter a integridade e rastreabilidade dos dados.

#### Critérios de Aceitação

- CA-10.1: O sistema **SHALL** seguir a interface BaseContent para estrutura de dados consistente
- CA-10.2: O sistema **SHALL** manter audit trail com timestamps de criação/atualização e informação do utilizador
- CA-10.3: O sistema **SHALL** suportar funcionalidade de eliminação com confirmação
- CA-10.4: O sistema **SHALL** armazenar dados seguindo o padrão estabelecido de chaves de armazenamento
- CA-10.5: O sistema **SHALL** manter índices de pesquisa sincronizados com as alterações de conteúdo
- CA-10.6: O sistema **SHALL** integrar-se com o sistema de autenticação existente e respeitar as permissões de utilizador (Admin/User)


## Âmbito Excluído

- Upload direto de ficheiros (fotos, documentos) — utilizar URL da Drive em vez disso
- Notificações automáticas entre fases
- Aprovação/validação de fases por outro utilizador (supervisor)
- Relatórios ou estatísticas de instalações
- Integração com sistemas externos (Vectron, Anydesk)
- Gestão de stock de material (a checklist é apenas verificação, não controlo de inventário)
- Histórico de alterações por campo (apenas audit trail de criação/atualização geral)

## Restrições

- Todos os labels da interface em Português de Portugal; código em Inglês
- Mobile-first com touch targets mínimos de 44px
- Seguir os padrões existentes de content types do CLEVER (BaseContent, 5 vistas, R2, índices)
- Atribuição automática de técnico via contexto de autenticação Clerk
- Relação com Clientes segue o padrão existente (clientId + resolução automática)
- Sem dependência de serviços externos para funcionamento offline das checklists


## [MA] Mirror — Critérios de Aceitação

| REQ-ID | CA-ID | Given | When | Then | Prioridade |
|--------|-------|-------|------|------|------------|
| REQ-01 | CA-01.1 | Um técnico autenticado | Cria um novo registo de instalação | O sistema gera um número único e cria o registo | Alta |
| REQ-01 | CA-01.2 | Um registo de instalação existe | O registo é aberto | O sistema apresenta as 5 fases: Programação, Preparação, Instalação, Testes, Finalização | Alta |
| REQ-01 | CA-01.3 | Um registo de instalação existe | O técnico edita campos de qualquer fase | O sistema guarda as alterações no registo | Alta |
| REQ-01 | CA-01.4 | Um registo de instalação com fases parcialmente completas | O registo é visualizado | O sistema mostra o estado de progresso por fase | Média |
| REQ-01 | CA-01.5 | Existem registos de instalação no sistema | O técnico acede à lista de instalações | O sistema apresenta a lista com pesquisa disponível | Alta |
| REQ-01 | CA-01.6 | Um técnico autenticado | Cria um novo registo | O técnico autenticado é atribuído automaticamente como responsável | Alta |
| REQ-02 | CA-02.1 | O técnico está na Fase 1 (Programação) | O formulário é apresentado | Campos de texto visíveis: PLUS, Departamento, Cabeçalho, Rede, Vectron Connect, Anydesk, Séries/Nº Equipamentos | Alta |
| REQ-02 | CA-02.2 | O técnico está na Fase 1 | O formulário é apresentado | Switches visíveis: Ligação a CPA, Gaveta, Impressora/Monitor, Faturadora, Display Clientes, Scanner, Leitor de Cartões, Fechadura de Chaves de Operador | Alta |
| REQ-02 | CA-02.3 | O técnico está na Fase 1 | O formulário é apresentado | Campo de texto visível: Configuração dos vários turnos | Alta |
| REQ-02 | CA-02.4 | O técnico está na Fase 1 | O formulário é apresentado | Switch Vectron visível | Alta |
| REQ-02 | CA-02.5 | Switch Vectron ativado | O switch é ligado | Grupo "Programação Leitura X" apresentado com campos: Plus 1, Plus 2, Departamentos, Operadores, Transações C/IVA | Alta |
| REQ-02 | CA-02.6 | Switch Vectron ativado | O switch é ligado | Grupo "Tecla Só Consulta Diária" apresentado com campos: Leitura Gerente Normal, Leitura Supervisor | Alta |
| REQ-02 | CA-02.7 | O técnico preencheu campos da Fase 1 | Os dados são submetidos | O sistema guarda os dados no registo | Alta |
| REQ-02 | CA-02.8 | A Fase 1 já foi preenchida | O técnico edita um campo | O sistema permite a edição e guarda as alterações | Média |
| REQ-03 | CA-03.1 | O técnico está na Fase 2 (Preparação) | O formulário é apresentado | Checklist organizada por categorias com switches | Alta |
| REQ-03 | CA-03.2 | Categoria POS visível | O técnico verifica os itens | Itens disponíveis: Cabo POS, WER, Transformador, Cabo Rede | Alta |
| REQ-03 | CA-03.3 | Categoria Display Cliente visível | O técnico verifica os itens | Itens disponíveis: Impressora, Rolo, Cabo Power, Transformador, Cabo Ligação POS, Ficha Adaptador RS232, Autocolantes | Alta |
| REQ-03 | CA-03.4 | Categoria Gaveta Metálica visível | O técnico verifica os itens | Itens disponíveis: Chaves, Autocolantes | Alta |
| REQ-03 | CA-03.5 | Categoria CPA visível | O técnico verifica os itens | Itens disponíveis: Base, Parafusos, Cabo Power, Transformador, Cabo Comunicação, Cabo Rede, Cabo Série, Cabo USB, Chaves, Site Gestiinforma, Folha Códigos, Autocolantes | Alta |
| REQ-03 | CA-03.6 | Categoria Balanças visível | O técnico verifica os itens | Itens disponíveis: Cabo Power, Transformador, Folha 1ª Verificação, Autocolante | Alta |
| REQ-03 | CA-03.7 | Categoria CCTV visível | O técnico verifica os itens | Itens disponíveis: DVR, Câmaras, Transformador, Cabo Power, Fichas, Placas Licença, Autocolantes | Alta |
| REQ-03 | CA-03.8 | Categoria Router/Switch visível | O técnico verifica os itens | Itens disponíveis: Router, Switch, Cabo Power, Transformador, Cabo Rede, Autocolante | Alta |
| REQ-03 | CA-03.9 | Categoria Acessórios visível | O técnico verifica os itens | Itens disponíveis: Bobine de Cabos, Fichas de Rede, Adaptadores, Monitor Interno, Soprador, Álcool, Pincel, Panos, Braçadeiras, Mangueira, Mala Ferramentas, Autocolantes | Alta |
| REQ-03 | CA-03.10 | O técnico está na checklist | Marca ou desmarca um item | O estado é guardado imediatamente no registo | Alta |
| REQ-03 | CA-03.11 | Uma categoria tem itens parcialmente verificados | A categoria é visualizada | O sistema mostra indicador de progresso (ex: 3/4) | Média |
| REQ-04 | CA-04.1 | O técnico está na Fase 3 | Acede ao campo de cliente | O sistema apresenta lista de clientes existentes para seleção | Alta |
| REQ-04 | CA-04.2 | O técnico está na Fase 3 | O formulário é apresentado | Campos de texto visíveis: Nº Fatura, Nº Guia de Transportes | Alta |
| REQ-04 | CA-04.3 | O técnico autenticado está na Fase 3 | O formulário é apresentado | O técnico responsável é preenchido automaticamente | Alta |
| REQ-04 | CA-04.4 | O técnico está na Fase 3 | O formulário é apresentado | Campos de data/hora visíveis: Data Instalação, Hora Inicial, Hora Final | Alta |
| REQ-04 | CA-04.5 | O técnico está na Fase 3 | O formulário é apresentado | Campos de data/hora visíveis: Data Formação, Hora Inicial, Hora Final | Alta |
| REQ-04 | CA-04.6 | O técnico está na Fase 3 | O formulário é apresentado | Campo de texto visível: Quem recebeu formação | Alta |
| REQ-04 | CA-04.7 | O técnico está na Fase 3 | O formulário é apresentado | Switches de material instalado: POS, CPA, Balança, CCTV, Alarme, Impressora, UPS, Router, Switch | Alta |
| REQ-04 | CA-04.8 | Material instalado inclui Rolos | O switch de Rolos é ativado | Campo numérico para quantidade de rolos é apresentado | Média |
| REQ-04 | CA-04.9 | O técnico seleciona um cliente | O cliente não é encontrado no sistema | O sistema apresenta mensagem de erro adequada | Alta |
| REQ-05 | CA-05.1 | O técnico está na Fase 4 (Testes) | O formulário é apresentado | Switch de teste Anydesk visível (Sim/Não) | Alta |
| REQ-05 | CA-05.2 | Teste Anydesk marcado como Sim | O switch é ativado | Campo de texto para código Anydesk é apresentado | Alta |
| REQ-05 | CA-05.3 | Teste Anydesk marcado como Não | O switch está desativado | Campo de texto para motivo da falha é apresentado | Alta |
| REQ-05 | CA-05.4 | O técnico está na Fase 4 | O formulário é apresentado | Switch de teste Vectron Connect visível (Sim/Não) | Alta |
| REQ-05 | CA-05.5 | Teste Vectron Connect marcado como Sim | O switch é ativado | Campo de texto para código Vectron Connect é apresentado | Alta |
| REQ-05 | CA-05.6 | Teste Vectron Connect marcado como Não | O switch está desativado | Campo de texto para motivo da falha é apresentado | Alta |
| REQ-06 | CA-06.1 | O técnico está na Fase 5 (Finalização) | O formulário é apresentado | Switch para confirmar DUMP lido visível | Alta |
| REQ-06 | CA-06.2 | O técnico está na Fase 5 | O formulário é apresentado | Switch para confirmar cópia de segurança visível | Alta |
| REQ-06 | CA-06.3 | O técnico está na Fase 5 | O formulário é apresentado | Switch para indicar existência de foto da instalação visível | Alta |
| REQ-06 | CA-06.4 | Switch de foto marcado como Sim | O switch é ativado | Campo de texto para URL da Drive é apresentado | Alta |
| REQ-06 | CA-06.5 | Todas as verificações da Fase 5 completas | O técnico completa a última verificação | O sistema marca a instalação como finalizada | Alta |
| REQ-07 | CA-07.1 | O técnico está na Fase 3 | Acede ao campo de seleção de cliente | Lista de clientes existentes é apresentada | Alta |
| REQ-07 | CA-07.2 | Um cliente é selecionado | O registo é guardado | O clientId é armazenado no registo | Alta |
| REQ-07 | CA-07.3 | Um registo tem clientId associado | O registo é apresentado | O nome do cliente é resolvido e exibido | Alta |
| REQ-07 | CA-07.4 | Um registo tem clientId inválido | O registo é apresentado | Mensagem de erro estruturada é exibida | Alta |
| REQ-07 | CA-07.5 | Um registo tem cliente associado | O registo é visto em qualquer vista | A relação com o cliente é consistente em todas as vistas | Alta |
| REQ-08 | CA-08.1 | Um registo de instalação é aberto | O técnico navega entre fases | As 5 fases são apresentadas sequencialmente e navegáveis | Alta |
| REQ-08 | CA-08.2 | Um registo tem fases em diferentes estados | O registo é visualizado | Indicador visual mostra fases completas, em curso e por iniciar | Média |
| REQ-08 | CA-08.3 | Uma fase anterior não está completa | O técnico tenta aceder a outra fase | O sistema permite a navegação livre entre fases | Média |
| REQ-08 | CA-08.4 | Todos os campos obrigatórios de uma fase estão preenchidos | O técnico completa a fase | A fase é marcada como completa no indicador | Média |
| REQ-08 | CA-08.5 | Todas as 5 fases estão completas | A última fase é completada | O registo é marcado como concluído | Alta |
| REQ-08 | CA-08.6 | Existem registos com diferentes estados de progresso | O técnico acede à lista | O estado de progresso é visível por registo (ex: 3/5) | Média |
| REQ-09 | CA-09.1 | O módulo de instalações está disponível | O técnico acede ao módulo | 5 vistas disponíveis: Home tile, Lista, Detalhe, Criar, Editar | Alta |
| REQ-09 | CA-09.2 | O técnico usa um dispositivo móvel | Interage com qualquer elemento | Todos os touch targets têm mínimo 44px | Alta |
| REQ-09 | CA-09.3 | O técnico acede a qualquer vista | A interface é apresentada | Todos os labels estão em Português de Portugal | Alta |
| REQ-09 | CA-09.4 | O técnico usa a checklist no telemóvel | Toca nos switches | Os switches são otimizados para uso táctil | Alta |
| REQ-09 | CA-09.5 | A checklist tem múltiplas categorias | O técnico vê a Fase 2 no telemóvel | As categorias são colapsáveis para reduzir scroll | Média |
| REQ-09 | CA-09.6 | O técnico usa o telemóvel | Navega entre fases | A navegação entre fases é acessível por toque | Alta |
| REQ-10 | CA-10.1 | Um registo de instalação é criado | O registo é armazenado | Segue a estrutura BaseContent | Alta |
| REQ-10 | CA-10.2 | Um registo é criado ou atualizado | A operação é concluída | Timestamps e informação do utilizador são registados | Alta |
| REQ-10 | CA-10.3 | O técnico quer eliminar um registo | Confirma a eliminação | O registo é eliminado com confirmação prévia | Alta |
| REQ-10 | CA-10.4 | Um registo é guardado | A operação é concluída | Os dados são armazenados seguindo o padrão de chaves estabelecido | Alta |
| REQ-10 | CA-10.5 | Um registo é criado, atualizado ou eliminado | A operação é concluída | Os índices de pesquisa são atualizados | Alta |
| REQ-10 | CA-10.6 | Um utilizador acede ao módulo | O sistema verifica permissões | As permissões Admin/User são respeitadas | Alta |


## Fase 2 — Especificação Funcional

### Cenário Nominal

```mermaid
sequenceDiagram
    actor T as Técnico
    participant S as Sistema
    actor C as Cliente

    T->>S: Cria novo registo de instalação
    S-->>T: Registo criado com número único, técnico atribuído automaticamente

    Note over T,S: Fase 1 — Programação
    T->>S: Preenche campos de programação (PLUS, Departamento, Cabeçalho, etc.)
    T->>S: Configura switches de ligações (CPA, Gaveta, Impressora, etc.)
    alt Equipamento Vectron
        T->>S: Ativa switch Vectron
        S-->>T: Apresenta grupos condicionais (Programação Leitura X + Tecla Só Consulta Diária)
        T->>S: Preenche campos Vectron
    end
    S-->>T: Fase 1 marcada como completa

    Note over T,S: Fase 2 — Preparação da Instalação
    T->>S: Percorre checklist de material por categoria
    T->>S: Marca itens verificados (POS, Display, CPA, Balanças, CCTV, Router, Acessórios)
    S-->>T: Progresso da checklist atualizado por categoria
    S-->>T: Fase 2 marcada como completa

    Note over T,C: Fase 3 — Instalação no Cliente
    T->>S: Seleciona cliente existente
    S-->>T: Dados do cliente resolvidos e apresentados
    T->>S: Preenche Nº Fatura, Nº Guia de Transportes
    T->>S: Regista datas/horas de instalação e formação
    T->>S: Indica quem recebeu formação
    T->>S: Marca material instalado (POS, CPA, Balança, CCTV, etc.)
    S-->>T: Fase 3 marcada como completa

    Note over T,S: Fase 4 — Testes
    T->>S: Testa Anydesk
    alt Anydesk funciona
        T->>S: Marca Sim + insere código
    else Anydesk não funciona
        T->>S: Marca Não + insere motivo
    end
    T->>S: Testa Vectron Connect
    alt Vectron Connect funciona
        T->>S: Marca Sim + insere código
    else Vectron Connect não funciona
        T->>S: Marca Não + insere motivo
    end
    S-->>T: Fase 4 marcada como completa

    Note over T,S: Fase 5 — Finalização
    T->>S: Confirma DUMP lido
    T->>S: Confirma cópia de segurança
    T->>S: Indica foto da instalação
    alt Foto existe
        T->>S: Insere URL da Drive
    end
    S-->>T: Fase 5 marcada como completa
    S-->>T: Instalação marcada como concluída (5/5 fases)
```


### Regras de Negócio

| RB-ID | Condição | Ação | Erro |
|-------|----------|------|------|
| RB-01 | Switch Vectron ativado na Fase 1 | Apresentar grupos condicionais: "Programação Leitura X" (Plus 1, Plus 2, Departamentos, Operadores, Transações C/IVA) e "Tecla Só Consulta Diária" (Leitura Gerente Normal, Leitura Supervisor) | — |
| RB-02 | Switch Vectron desativado na Fase 1 | Ocultar grupos condicionais Vectron | — |
| RB-03 | Teste Anydesk = Sim (Fase 4) | Apresentar campo "Código Anydesk", ocultar campo "Motivo" | — |
| RB-04 | Teste Anydesk = Não (Fase 4) | Apresentar campo "Motivo da falha", ocultar campo "Código" | — |
| RB-05 | Teste Vectron Connect = Sim (Fase 4) | Apresentar campo "Código Vectron Connect", ocultar campo "Motivo" | — |
| RB-06 | Teste Vectron Connect = Não (Fase 4) | Apresentar campo "Motivo da falha", ocultar campo "Código" | — |
| RB-07 | Switch Foto Instalação = Sim (Fase 5) | Apresentar campo "URL da Drive" | — |
| RB-08 | Switch Foto Instalação = Não (Fase 5) | Ocultar campo "URL da Drive" | — |
| RB-09 | Todos os campos obrigatórios de uma fase preenchidos | Marcar fase como completa no indicador de progresso | — |
| RB-10 | Todas as 5 fases completas | Marcar registo de instalação como concluído | — |
| RB-11 | Criação de registo | Atribuir automaticamente o técnico autenticado como responsável | Erro se contexto de autenticação indisponível |
| RB-12 | Seleção de cliente na Fase 3 | Resolver e apresentar dados do cliente via relação clientId | Mensagem de erro se cliente não encontrado |
| RB-13 | Navegação entre fases | Permitir acesso livre a qualquer fase independentemente do estado das anteriores | — |
| RB-14 | Material instalado inclui Rolos (Fase 3) | Apresentar campo numérico para quantidade de rolos | — |


### Cenários Alternativos e de Erro

| Trigger | Comportamento | Resultado |
|---------|---------------|-----------|
| Cliente selecionado na Fase 3 não existe ou foi eliminado | O sistema tenta resolver a relação clientId | Mensagem de erro estruturada apresentada no campo de cliente |
| Técnico tenta guardar Fase 3 sem selecionar cliente | O sistema valida campos obrigatórios | Campo de cliente destacado como obrigatório |
| Técnico navega para outra fase sem guardar alterações | O sistema deteta alterações não guardadas | Dados da fase atual são preservados antes da navegação |
| Teste Anydesk marcado como Não sem preencher motivo | O sistema valida campo condicional obrigatório | Campo "Motivo" destacado como obrigatório |
| Teste Vectron Connect marcado como Não sem preencher motivo | O sistema valida campo condicional obrigatório | Campo "Motivo" destacado como obrigatório |
| Switch Foto ativado sem preencher URL da Drive | O sistema valida campo condicional obrigatório | Campo "URL da Drive" destacado como obrigatório |
| Contexto de autenticação indisponível na criação | O sistema não consegue atribuir técnico | Erro de autenticação apresentado, criação bloqueada |
| Técnico tenta eliminar registo de instalação | O sistema apresenta diálogo de confirmação | Registo eliminado após confirmação, ou operação cancelada |
| Utilizador com role "User" tenta eliminar registo | O sistema verifica permissões | Operação bloqueada conforme regras de permissão Admin/User |
| Registo parcialmente preenchido é aberto para edição | O sistema carrega o estado atual de todas as fases | Fases completas e incompletas apresentadas com indicador de progresso correto |
