# Saldo do cliente — perguntas para a reunião

**Data:** 2026-09-24

Contexto rápido: o saldo de cada cliente passa a funcionar por **período de contrato** —
os recursos (manutenções, deslocações, horas) valem dentro das datas do contrato, e
reiniciam quando o contrato renova. Já ficou decidido:

- O saldo segue as **datas do contrato**, não o ano civil.
- A renovação **repõe os valores originais do plano** e **não** soma o que sobrou do ano anterior.
- Débito direto renova sozinho na data de fim; os restantes renovam com um botão **RENOVAR** manual.
- Fora do período (contrato expirado ou por renovar), folhas e assistências passam a **dívida**.
- Se os recursos do período se esgotarem com o contrato ainda ativo, o excedente vira **dívida**.
- O ecrã mostra o período **atual**; o histórico fica agrupado por período.

Faltam confirmar os pontos abaixo.


CPA - X manutenção e Y Deslocações

Folha de obra -> Manutencao (obriga sempre a uma deslocação) -> desconta CPA

Folhas de Obra -> Assitencia Presencial -> 

Folhas de Obra Novos tipos de assistencias
 - Assitencias Presencial CPA - desconta no contrato CPA
 - Assitencias Presencial Software - desconta no contrato S&H

Folhas de Obra
 - Assitencia Presencial -> So TEM CPA desconta 1 deslocação (se tiver o horas extra desconta o tempo tambem)
   - Sem horas extra -> o tempo da Assitencia Presencial entra no Saldo ()
 - Manutenção -> So TEM CPA desconta 1 manutençao
 - Instalação -> nao desconta nada


Cliente so com contrato para S&H

---

## 1. Contratos com CPA e S&H ao mesmo tempo

Um contrato pode ter CPA e S&H com **datas diferentes** (por exemplo, o CPA começa em Março
e o S&H em Junho).

**O saldo deve tratar cada parte com o seu próprio período (o CPA reinicia na data do CPA,
o S&H na data do S&H), ou os dois partilham um único período do contrato?**

Com novos tipos de assitencias e conehcido o contrato a descontar

---

## 2. Que data conta para descontar uma folha de obra

Cada folha de obra tem duas datas: a **data do pedido** e a **data da assistência** (quando
o trabalho foi feito).

**Qual das duas deve decidir a que ano/período de contrato o desconto pertence?**

Data do Pedido

---

## 3. Como é uma folha de obra descontada ao contrato

Hoje, uma folha paga por contrato desconta sempre **1 manutenção + 1 deslocação**,
independentemente do trabalho.

**Mantém-se assim, ou o desconto deve ser proporcional ao trabalho real?**
(As assistências remotas já descontam as horas reais.)

Respondido em cima

---

## 4. O botão RENOVAR (renovação manual)

Quando se carrega em **RENOVAR** num contrato:

**As datas do contrato mantêm-se as mesmas, ou devem ser introduzidas datas novas
(novo início e fim) nesse momento?**
(Um contrato anual que renova precisa de uma janela de datas nova para o ano seguinte.)

Mesmas datas

---

## 5. Duração do período de recursos — sempre anual?

Os planos definem os recursos "por ano" (ex.: PREMIUM = 2 manutenções e 3 deslocações por
ano). A **forma de pagamento** é separada — o mesmo plano pode ser pago mensal, semestral
ou anual.

**O pacote de recursos e a renovação são sempre a 1 ano (a forma de pagamento só afeta as
prestações), ou o período de recursos deve acompanhar a forma de pagamento (mensal renova
os recursos todos os meses, semestral de 6 em 6 meses)?**

_(Nota: os recursos são números pequenos — "1 manutenção por ano" — pelo que dividi-los por
mês não é prático. A opção "sempre anual" é a que o sistema suporta naturalmente.)_

Parametros sempre Anuais. a recorrencia do pagamento e que muda

---

## 6. Contratos só com CPA ou só com S&H

**Confirmar:** um contrato pode ter só CPA, só S&H, ou ambos — e a renovação e o saldo
aplicam-se apenas às partes que existem. Está correto?



---

## 7. Quando um cliente tem contrato e sempre para selecionar contrato?

Mesmo que um contrato ja nao tenha saldo, o User pode escolher contrato e fica com saldo negativo?

Se escolher Pagamento em dinheiro/multibanco, nao se aplica para o saldo certo?

Sim, correto.

---


## 8. O histórico antigo do saldo

Vamos reconstruir os saldos de todos os clientes de raiz, a partir dos contratos e de todas
as folhas e assistências já registadas.

Há um limite: os contratos guardam apenas as **datas atuais**, não as de anos anteriores.
Por isso os períodos **passados** não são reconstruíveis com exatidão.

**Aceita que o histórico anterior a esta mudança fique como um único período de arranque, e
que os períodos rigorosos comecem só a partir de agora?**

---

## 9. Corrigir já os saldos, ou esperar

Há 25 contratos cujos benefícios estavam a zero (já corrigidos nos contratos). Os saldos
desses clientes ainda não refletem a correção.

**Quer que corrijamos esses saldos já, ou espera pela reconstrução completa que vem com esta
mudança maior?**

---


## Nota a transmitir

Ao reconstruir os saldos, **alguns valores vão mudar** face aos atuais — isto é esperado e
correto (os saldos antigos foram calculados com regras que agora se corrigem). Em particular,
trabalho que antes não gerava dívida pode passar a gerar, quando o período não tinha recursos
suficientes.
