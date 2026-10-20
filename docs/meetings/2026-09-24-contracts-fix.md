# Reunião com o cliente — Correção dos benefícios dos contratos

**Data:** 2026-09-24
**Tema:** O problema dos contratos, o que corrigimos, e confirmação dos valores dos planos
**Estado do trabalho:** correção de código já implementada; correção dos dados por confirmar

---

## 1. Resumo num parágrafo

Alguns contratos tinham os benefícios do plano guardados a zero — sem deslocações, sem
manutenções. Como o sistema verifica esses números antes de permitir registar uma
Assistência Remota ou uma Folha de Obra a débito de um contrato, os colaboradores ficaram
impedidos de registar trabalho para esses clientes. Corrigimos os contratos afetados e
resolvemos também a causa de origem, para que não volte a acontecer. **O que precisamos de
vós hoje é a confirmação de que os valores de benefícios por plano estão corretos.**

---

## 2. Qual era o problema (em linguagem simples)

- Cada contrato está associado a um plano (ESSENTIAL / PROFESSIONAL / PREMIUM para CPA;
  SIMPLE e outros para S&H).
- Cada plano tem os seus benefícios: quantas deslocações por ano, quantas manutenções por
  ano, quantas horas de assistência.
- Nalguns contratos esses números estavam guardados a **0**, apesar de o plano estar
  corretamente registado.
- Com 0 deslocações disponíveis, o sistema recusava deixar o colaborador criar uma
  Assistência Remota ou Folha de Obra com pagamento por "Contrato" — foi assim que o
  problema deu nas vistas.
- Causa: os valores dos benefícios só eram gravados quando alguém selecionava ativamente um
  plano no formulário. Os contratos migrados do sistema antigo chegaram com o nome do plano
  mas sem os números, e nunca ninguém os preencheu.

**Importa ser claro:** isto foi um problema de dados, não de faturação. Nenhum cliente foi
cobrado a mais ou a menos por causa disto. O que se perdeu foi a possibilidade de registar
trabalho.

---

## 3. O que fizemos

**Parte 1 — corrigimos os contratos afetados.** Auditámos todos os contratos em produção,
comparámos cada um com o respetivo plano, e escrevemos os valores de benefícios corretos
onde estavam em falta.

**Parte 2 — corrigimos a causa (esta semana).** Duas alterações:

- O sistema passa a **recusar guardar** um contrato cujos benefícios do plano nunca tenham
  sido aplicados, em vez de guardar zeros em silêncio. O utilizador recebe uma mensagem a
  pedir para selecionar novamente o plano.
- Ao abrir um contrato afetado, os valores dos benefícios são agora **recalculados
  automaticamente a partir do plano**, pelo que qualquer contrato que ainda tenha zeros se
  corrige a si próprio na gravação seguinte.

**Alteração visível para os colaboradores:** se alguém abrir um contrato antigo que ainda
tenha este problema e tentar gravar, verá uma mensagem em português a pedir para selecionar
novamente o plano. Isto é a nova proteção a funcionar como previsto, não um novo erro.

---

## 4. ⭐ O PEDIDO PRINCIPAL — confirmem estes valores dos planos

Esta é a tabela que o sistema passa a tratar como fonte da verdade. Tudo o resto decorre
dela, por isso, se alguma linha estiver errada, os contratos corrigidos também estarão.

### Planos CPA

| Plano | Deslocações / ano | Manutenções / ano | Horas / ano |
|---|---|---|---|
| ESSENTIAL CARE | 1 | 1 | — |
| PROFESSIONAL CARE | 2 | 1 | — |
| PREMIUM CARE | 3 | 2 | — |

### Planos S&H

| Plano | Horas / ano | Deslocações / ano | Manutenções / ano |
|---|---|---|---|
| SIMPLE | 10 | 2 | 0 |
| BRASS | 10 | 2 | 0 |
| SILVER | 10 | 2 | 0 |
| GOLD | 15 | 3 | 0 |
| DIAMOND | 15 | 3 | 0 |
| PLATINUM | 15 | 3 | 0 |

**Perguntas:**
- Estes valores estão atuais e corretos?
- Os planos CPA **não têm horas anuais** nenhumas — está correto?
- Todos os planos S&H têm **zero manutenções** — está correto?
- Algum valor de plano mudou recentemente, ou vai mudar em breve?

---

## 5. O que foi efetivamente corrigido

**18 contratos, de 18 clientes diferentes, 25 secções de contrato** (alguns contratos têm
uma secção CPA e uma secção S&H).

| Plano | Contratos | Correção aplicada |
|---|---|---|
| PREMIUM CARE (CPA) | 13 | Deslocações 0 → 3, Manutenções 0 → 2 |
| PROFESSIONAL CARE (CPA) | 3 | Deslocações 0 → 2, Manutenções 0 → 1 |
| ESSENTIAL CARE (CPA) | 2 | Deslocações 0 → 1 |
| SIMPLE (S&H) | 6 | Deslocações 0 → 2 |
| SIMPLE (S&H) | 1 | Deslocações **3 → 2** ← ver abaixo |

Em todos os casos exceto o último, foi preenchido um valor em falta. As horas anuais dos
contratos S&H já estavam corretas (10) e não foram alteradas.

---

## 6. ⚠️ Um contrato a analisar em particular

**Um contrato S&H no plano SIMPLE tinha 3 deslocações, e a correção reduziu-o para 2.**

Todas as outras alterações acrescentaram um valor em falta. Este é o único caso em que um
valor existente foi **reduzido**, o que significa que o cliente pode ficar com menos
deslocações do que antes.

**Pergunta: esse 3 era intencional?**

- Se era uma exceção negociada, retirámos algo e é preciso repor — e precisamos de uma
  forma adequada de registar exceções (ver a secção seguinte).
- Se eram dados errados, a correção está certa e não é preciso mais nada.

Posso dar-vos o nome do cliente deste contrato antes da reunião, se for útil.

---

## 7. Questão de conceção — pode um contrato divergir do seu plano?

Isto decide como o sistema deve comportar-se daqui para a frente, por isso vale a pena
fechar o assunto.

Hoje a regra é:

- **Contrato com um equipamento** → os valores dos benefícios vêm do plano, e os campos
  ficam bloqueados no formulário. O utilizador não os pode alterar.
- **Contrato com dois ou mais equipamentos** → os valores são introduzidos à mão, porque os
  benefícios padrão do plano deixam de se aplicar diretamente.

O contrato da secção 6 mostra que **existem nos dados** contratos de um só equipamento com
valores diferentes do plano, mesmo que o formulário não permita criar um assim.

**Então: um contrato de um só equipamento deve alguma vez poder ter valores de benefícios
diferentes do seu plano?**

- **Não** → a conceção atual está correta, a correção foi acertada, e está tudo resolvido.
- **Sim** → precisamos de acrescentar uma forma de registar uma exceção aprovada, porque
  neste momento o sistema vai continuar a puxar esse contrato de volta para os valores do plano.

---

## 8. Ainda por confirmar do nosso lado

- [ ] Verificar se a correção dos dados foi efetivamente aplicada a todos os contratos
      afetados em produção (a auditoria correu de certeza; quero confirmar que a escrita
      também ocorreu).
- [ ] Confirmar que os saldos dos clientes foram recalculados após a correção — os saldos
      derivam destes números de benefícios, por isso têm de acompanhar.
- [ ] Rever dois ou três contratos corrigidos na interface, convosco.

---

## 9. Lista para levar da reunião

1. Valores dos planos na secção 4 — confirmados como corretos, ou correções dadas.
2. O contrato reduzido na secção 6 — intencional, ou dados errados?
3. A questão de conceção na secção 7 — são permitidas exceções?
4. Qualquer outro contrato que considerem ter números de benefícios errados, para
   verificarmos diretamente.
5. Se pretendem uma nota escrita para o vosso próprio registo.

---

## Anexo — se pedirem detalhe técnico

- A validação está no caminho de gravação do contrato e aplica-se tanto à criação como à
  atualização, incluindo qualquer utilização direta da API.
- Os valores que podem legitimamente ser zero **não** são assinalados: horas anuais CPA, e
  manutenções S&H. "Ilimitado" (registado como -1) também continua válido.
- A autocorreção só toca em contratos de um só equipamento. Os contratos com vários
  equipamentos mantêm os valores introduzidos à mão intactos, por serem negociados.
- Implementado em test e em produção; ambos os ambientes estão atualmente ao mesmo nível.
