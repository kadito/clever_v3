# Notas da reunião de 17 de novembro de 2026

Pontos tirados da reunião com o cliente. Estado: por fazer, salvo indicação.

## 1. Saldos e contratos

### Regras de contrato

- Um contrato tem sempre 12 meses de validade, sem incluir o último dia.
- O contrato renova automaticamente à meia-noite do último dia disponível.
- Ao criar o contrato, a data de fim passa a ser a data de início + 1 (ano).
- Aviso prévio de renovação para contratos sem débito direto.
- Contratos com débito direto renovam automaticamente.

### Clientes sem contrato

- Também têm de ter transações (SALDO), mas só com dívida.
- O período é de 1 de janeiro a 31 de dezembro.

### Como cada documento consome o contrato

- **Folha de obra paga por contrato, manutenção:** consome 1 manutenção (secção CPA).
- **Assistência presencial CPA:** consome 1 deslocação.
- **Assistência presencial software (SH):** consome 1 deslocação, e as horas só se estiver marcada como hora extra.
- **Assistência remota paga por contrato:** consome horas de SH.
- **Folha de obra ou assistência com método de pagamento Contrato e sem contrato escolhido:** tentar encontrar o contrato do cliente e descontar nele.

### Mostrar todos os gastos (não fazer já)

- No saldo de cada cliente, mostrar todos os gastos acumulados durante o período.
- A discutir mais tarde. O cliente quer saber quanto o seu cliente gastaria se não tivesse contrato.

### Tarefas

- Mandar a lista de contratos sem data de início. **FEITO** (`contratos-sem-data-inicio.csv`).

## 2. Análise de clientes

- **Adega 25 de Abril:** só conta as folhas de obra. Faltam as assistências remotas nas transações.
- **Todas as assistências remotas no saldo:** o tempo está mal (a confirmar).
- **Basilios:** faltam todas as assistências remotas no saldo (dívida). A folha de obra de manutenção não desconta a deslocação.
- **Brejo:** folhas de obra sem contrato escolhido. Relacionar com o contrato do cliente e descontar. Faltam também as assistências remotas.
- **Doce M:** folha de obra sem o contrato respetivo, e as assistências remotas não aparecem.
- **Gafaniz:** eliminar o contrato.
- **Pão Artesanal Caldas / Pão com Chouriço:** as assistências remotas têm de ser descontadas nas transações.

## 3. Transações

- Mostrar o débito em horas em vez de percentagem de horas. Usamos 0,25 e 9,25 quando falamos de horas, por isso converter para horas e não para percentagem (100).

## 4. Instalações e programações

- Permitir que os utilizadores editem.
- Garantir que a foto da instalação é OBRIGATÓRIA.
- Adicionar o tipo de instalação "relógio de ponto".

## 5. Licenças

- Adicionar no Software "Cloud Relógio de Ponto".

## 6. Assistências remotas (não fazer já)

- Se o cliente for Vectron: leitura do DUMP obrigatória.
- Se tiver Outros Softwares ou Caixa de pagamento: AnyDesk e código obrigatórios.

## 7. Lista de tarefas do utilizador (novo tipo de conteúdo)

**Listagem**

- Tarefas por colaborador, datas e cliente.
- Ordenar pela tarefa mais recente a fazer.
- Não mostrar as feitas, e adicionar um filtro para ver todas.

**Campos**

- Técnico associado (só os ADMINS conseguem alterar o colaborador da tarefa).
- Título.
- Cliente (relação).
- Descrição da tarefa.
- Data de criação da tarefa (automática, data e hora).
- Data do pedido (data e hora).
- Data prevista de execução (data e hora).
- Data de finalização (estado FEITO).

**Estado**

- "Concluída".
- "Em progresso" (estado inicial).
- "Em atraso": data prevista de execução passada (mais antiga do que hoje).

**Pouca prioridade**

- Como notificar o colaborador das tarefas do seu dia: WhatsApp, Google Calendar, notificação push.
- A partir da tarefa, criar a folha de obra ou assistência remota.

## A esclarecer

1. "Data de fim = data de início + 1": é + 1 ano? E "último dia não inclusive" significa que o contrato de 1 jan termina a 31 dez, ou que a data de fim é 1 jan do ano seguinte?
2. Débito direto: como se sabe que um contrato tem débito direto? O contrato tem o campo modalidade de pagamento (MENSAL/ANUAL) e o método de pagamento, mas não vi um campo de débito direto.
3. Aviso prévio de renovação: quem avisa quem, com quanto tempo de antecedência, e por que meio?
4. Assistências remotas em clientes sem SH (CPA apenas): a regra diz que consomem horas de SH, mas não foi respondido o que acontece nesses casos (30 assistências no resumo).
5. Saldo negativo ou dívida quando o saldo acaba: não ficou decidido.
6. Gafaniz: eliminar o contrato em produção. Precisa da tua aprovação explícita e de uma cópia de segurança antes.
7. Folhas de obra e assistências antigas sem contrato: ligar ao contrato do cliente é uma alteração em massa em produção. Primeiro em teste, depois com aprovação.
8. "Tempo mal" nas assistências remotas: pode ser o formato das horas, que aparece como 0.25 em alguns registos e 00:15 noutros.
9. "Em atraso": confirmar que é data prevista anterior a hoje.

## Respostas às questões acima (17 de novembro de 2026, depois da reunião)

1. **Fim do contrato:** um contrato que começa a 1 de janeiro termina a 31 de dezembro. A data de fim é o último dia válido (início + 1 ano - 1 dia).
2. **Renovação e débito direto:** nada disto é para implementar agora. Faz-se quando se corrigir a funcionalidade de saldo.
3. **Assistências remotas pagas por contrato em clientes sem SH:** criar dívida com o custo da assistência.
4. **Sem saldo negativo:** quando acabam as deslocações, as manutenções ou as horas, o valor é adicionado como dívida.
5. **Lista de tarefas:** é independente. As questões dela respondem-se quando se fizer essa funcionalidade.

Pontos que ficam por confirmar:

- O custo de uma assistência remota é calculado como? O resumo mostra 7,50 € por assistência de 15 minutos faturada (30 €/h), mas as assistências pagas por contrato têm valor 0 € no sistema, por isso a dívida teria de ser calculada com a tarifa.
- A dívida de 22,50 € do resumo: o cliente não respondeu.

## Regra de preços (17 de novembro de 2026, depois da reunião)

- O preço de uma folha de obra ou de uma assistência é o do momento da criação.
- Se os preços mudarem mais tarde, os registos já criados não são alterados. Assistências antigas podem, por isso, ter valores antigos (por exemplo 7,50 € por 15 minutos).
- O valor da dívida é lido do próprio registo. Nunca se recalcula com os preços atuais.
- Assistências remotas: 45 € / 60 € por hora (preços atuais).
