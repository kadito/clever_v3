# Desenho — Saldo do cliente por período de contrato

**Data:** 2026-09-24
**Estado:** desenho para aprovação, ainda sem código
**Origem:** decisões do cliente nas últimas reuniões (ver secção 1)

---

## 1. Decisões do cliente (fixas)

| # | Pergunta | Resposta do cliente |
|---|---|---|
| 1 | Início e fim do saldo? Ano civil? | **Datas do contrato**, não 1 Jan → 31 Dez |
| 2 | Quando reinicia o contrato? | Renova na **data de fim**. Débito direto → automático. Sem débito direto → **RENOVAR** manual na página de detalhe |
| 3 | Renovação acumula o ano anterior? | **NÃO acumulativo** |
| 4 | Sem pagamento/renovação, o que acontece às folhas/assistências? | Não há contrato ativo → são **debitadas fora do contrato** (dívida em euros, não consomem recursos) |
| 5 | Folhas e assistências descontam desde quando? | Desde o **início do contrato**, datas **inclusivas** (início e fim incluídos) |
| 6 | Ao renovar, os campos voltam ao original? | **Voltam ao valor original do plano** |

Pontos deixados **em aberto** (não desenhar agora):
- **Trigger** da renovação automática (cron vs. preguiçoso) — decisão adiada.

Decisões de arquitetura confirmadas:
- "Débito direto" já existe: campo `metodoPagamento === 'DEBITO_DIRETO'` no contrato (NÃO é a modalidade CPA/SH, que só tem MENSAL/SEMESTRAL/ANUAL).
- **Guardar histórico** de cada período fechado.

---

## 2. O problema com o modelo atual

O sistema de saldo atual (`@clever/shared/balance-*`, `services/balance-service.ts`) é um
**acumulador único e perpétuo** por cliente. Não tem qualquer noção de período:

- `ContractUsage` é um só conjunto de contadores, sem data de início/fim.
- As transações não sabem a que ciclo de contrato pertencem.
- A renovação (`onContractUpdated`) **SOMA** os valores novos aos antigos — contradiz diretamente as decisões 3 e 6.
- Uma folha "CONTRATO" consome recursos **sempre**, mesmo com o contrato expirado — contradiz a decisão 4.
- Não existe conceito de "contrato ativo vs. inativo por data" — contradiz as decisões 1 e 5.

Conclusão: **é um redesenho do modelo de saldo, não um ajuste.** A base boa que se mantém
é o livro-razão imutável de transações; o que muda é como se interpreta.

---

## 3. Modelo proposto — períodos de contrato

### 3.1 Conceito central: o Período (ContractPeriod)

Cada contrato tem, a cada momento, **um período ativo** definido pela sua janela de datas:

```
período ativo = [inicioContrato, fimContrato]   (ambos inclusivos, decisão 5)
```

Um período contém:
- os recursos **originais do plano** (o "orçamento" do período), decisão 6;
- o consumo acumulado **dentro** desse período;
- o restante = original − consumo.

Quando o contrato renova, o período atual **fecha** (vai para histórico, decisão do cliente)
e abre-se um período **novo** com os valores originais do plano, sem herdar o restante
(não acumulativo, decisão 3).

### 3.2 Como assenta no livro-razão existente

Não se deita fora o ledger imutável. Introduzem-se **fronteiras de período** como marcos:

- **Transação de abertura de período** (evolução da ADD atual): regista início/fim do
  período e os valores originais do plano. Passa a carregar `periodStart`, `periodEnd`,
  `contractId`.
- **Transações de consumo** (DEBT de folha/assistência): passam a carregar o `contractId`
  e são atribuídas ao período cuja janela contém a **data do serviço**.
- **Transação de fecho de período** (nova): marca o período anterior como fechado quando há
  renovação. O consumo desse período fica congelado no histórico.

O saldo ativo passa a ser calculado **por período**, não como soma perpétua.

### 3.3 "Ativo vs. fora do contrato" (decisão 4)

Ao criar uma folha ou assistência com pagamento "CONTRATO":

```
se existe período cuja janela [inicio, fim] contém a data do serviço (inclusiva):
    → consome recursos desse período
senão (contrato expirado / ainda não renovado / não há contrato):
    → NÃO consome; converte em dívida em euros (comportamento "fora do contrato")
```

Isto move a decisão de `balance-extraction.ts`: a extração deixa de ser cega ao período e
passa a precisar de saber se há período ativo na data do serviço.

---

## 4. Renovação

### 4.1 Regra (comum a automática e manual)

```
fechar período atual  → histórico (consumo congelado)
abrir período novo    → valores ORIGINAIS do plano (decisão 6)
                        janela = novo [inicio, fim] do contrato
                        NÃO herda restante do período anterior (decisão 3)
```

### 4.2 Automática vs. manual

- `metodoPagamento === 'DEBITO_DIRETO'` → renova **automaticamente** na data de fim.
  **Mecanismo do trigger em aberto** (não desenhar agora).
- Qualquer outro `metodoPagamento` → botão **RENOVAR** na página de detalhe do contrato,
  acionado pelo utilizador quando o cliente paga.

Enquanto não renova (nem paga), não há período ativo → decisão 4 aplica-se.

---

## 5. Ficheiros afetados (mapa de impacto)

Partilhado (`packages/shared/src/`):
- `balance-types.ts` — novo tipo `ContractPeriod` (ou campos de período nas transações);
  `BalanceIndex` deixa de ser um acumulador único e passa a refletir o período ativo +
  ponteiro para histórico.
- `balance-utils.ts` — `calculateBalanceFromTransactions` reescrita para agrupar por
  período; nova lógica de "período ativo numa data".
- `balance-extraction.ts` — folha/assistência "CONTRATO" passa a depender de haver período
  ativo na data do serviço; caso contrário vira dívida.

Backend (`packages/backend/src/`):
- `services/balance-service.ts` — persistência de períodos e do histórico; renovação
  (fechar + abrir); provável nova chave R2 `balance/{clientId}/periods/...`.
- `middleware/balance-middleware.ts` — `onContractUpdated` deixa de somar; passa a fechar+abrir
  período. `onWorkSheetCreated`/`onRemoteAssistanceCreated` passam a resolver o período por data.
- `routes/balance-routes.ts` — endpoint de renovação manual; `recalculate` tem de respeitar períodos.
- `routes/contracts.ts` — expor/acionar a renovação a partir do detalhe.

Frontend (`packages/frontend/src/`):
- Detalhe do contrato — botão **RENOVAR**.
- `views/balance/` + `ClientBalanceDisplay` — mostrar período ativo, restante do período, e
  aceder ao histórico de períodos fechados.

---

## 6. Migração dos dados existentes — rebuild determinístico do ledger

**Estratégia decidida (2026-09-24):** não corrigir os saldos existentes — **apagar e
reconstruir do zero** a partir da fonte da verdade (contratos + folhas + assistências).
É a abordagem correta para um livro-razão: os números velhos foram calculados por lógica
errada (renovação-soma, 25 contratos a zero), por isso deitam-se fora e reprocessa-se tudo
pela lógica nova.

Passos:
1. Cliente confirma os contratos novos (em curso — CSV `2026-09-24-contract-changes.csv`).
2. Apagar o saldo atual de cada cliente (índice + transações).
3. Por cliente: **Set** do saldo pelo contrato → transação de abertura de período com os
   valores originais do plano e a janela de datas do contrato.
4. Listar **todas** as folhas de obra e assistências do cliente e **recriar as transações
   por ordem cronológica da data do serviço**, cada uma caindo no período cuja janela a
   contém (fronteiras de período incluídas quando houve renovação).

Consequências a comunicar ao cliente:
- Alguns saldos **vão mudar** face aos atuais — isto é correto, não um bug.
- Uma folha/assistência "Contrato" cujo período já não tem recursos suficientes **vira
  dívida em euros** (decisão 3), mesmo que antes não gerasse dívida.
- **Limite honesto:** os contratos guardam apenas as datas **atuais**, não as de períodos
  anteriores. Períodos passados exatos podem não ser reconstituíveis. A decidir com o
  cliente (pergunta 5 da secção 7): tratar o histórico anterior como um período único de
  arranque e ter períodos exatos só a partir de agora.

---

## 7. Perguntas ainda por fechar

### Fechadas (cliente, 2026-09-23/24)
- **Período = datas do contrato**, não ano civil.
- **Renovação:** débito direto → automática na data de fim; resto → botão RENOVAR manual.
  **Não acumulativa**, volta aos **valores originais** do plano.
- **Fora do período** (contrato expirado/não renovado): folhas e assistências **viram
  dívida em euros**, não consomem recursos.
- **Consumo conta desde o início do contrato**, datas inclusivas.
- **Débito direto** = `metodoPagamento === 'DEBITO_DIRETO'` (campo já existente).
- **Histórico:** guardar cada período fechado.
- **(3) Recursos esgotados com contrato ainda ativo** → vira dívida em euros.
- **(4) Ecrã do saldo:** mostra só o período **atual**; histórico de transações agrupado por período.
- **(5) Migração:** rebuild determinístico do zero (ver secção 6).

### No cartão, à espera de resposta (bloqueiam o modelo de dados)
- **P2 — período por secção ou por contrato.** CPA e S&H têm datas próprias
  (`inicioContratoCPA` vs `inicioContratoSH`). Um período por secção ou um só? **Molda o
  modelo de dados e o passo 4 da migração.**
- **P4 — que data decide o período.** Folha tem `date` (Data do Pedido) e `assistanceDate`
  (Data da Assistência). **Molda a ordenação da migração.**
- **P1 — estado sem trigger** (adiado): contrato débito-direto expirado fica sem período
  ativo até renovar; aceitável como intercalar?
- **P3 — consumo fixo vs. proporcional** (hoje: folha fixa 1+1, assistência por horas reais).

### Extra para a reunião de amanhã (levantadas 2026-09-24)
1. **Contrato só-CPA / só-S&H / ambos** — renovação e período por secção existente; se
   período for único mas datas diferem, qual ganha?
2. **RENOVAR manual** — repõe com as datas atuais, ou o utilizador introduz **novas datas**?
   (Um contrato anual que renova precisa de janela nova, senão o período fica no intervalo
   já expirado.)
6. **Recalculate já vs. no redesenho** — correr `recalculate` no modelo atual JÁ para aplicar
   os recursos dos 25 contratos a zero, ou esperar por este redesenho (que faz o rebuild
   completo de qualquer forma)?

---

## 8. Recomendação de sequência

1. Fechar P2 e P4 (bloqueiam o modelo) + perguntas extra 1 e 2 na reunião de amanhã.
2. Escrever um spec formal (requirements → design → tasks) seguindo a metodologia do projeto,
   dado o tamanho. Isto é candidato a spec, não a edição direta.
3. Implementar por baixo para cima: tipos → cálculo → extração → serviço → middleware → UI.
4. Migração por rebuild (secção 6) no fim, apanhando os 25 contratos por construção.
