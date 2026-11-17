# Saldos de contratos: análise do período atual

Reunião de terça-feira, 17 de novembro de 2026

Dados de produção (`clever-content-prod`), lidos a 15 de novembro de 2026. Contam apenas os movimentos dentro do período de 1 ano em vigor de cada contrato.

## 1. Regras aplicadas

- Cada período dura 1 ano a contar da data de início do contrato. Um contrato sem data de fim é ativo e renova-se todos os anos.
- **Folha de obra paga por contrato:** manutenção consome 1 manutenção e 1 deslocação (secção CPA). Assistência presencial CPA consome 1 deslocação, e as horas só se estiver marcada como hora extra. Assistência presencial software consome 1 deslocação (SH).
- **Assistência remota paga por contrato:** consome horas de SH.
- Garantia não consome nada. Qualquer outro método de pagamento (por exemplo faturação) vai para dívida em euros.
- Quando o saldo necessário está esgotado, ou o cliente não tem período da secção em causa, o movimento passa a dívida.

## 2. Resultado global

- 9 clientes com contrato ativo, num total de 10 períodos (a Doce M tem CPA e SH).
- 4 folhas de obra e 40 assistências remotas no período atual.
- 10 movimentos consomem saldo, 33 vão para dívida, 1 não consome nada.
- Dívida em euros calculada: **22,50 €** (3 assistências remotas faturadas a 7,50 €).

| Cliente | Saldo final |
|---|---|
| Adega 25 de Abril | CPA: 2/2 manutenções, 3/3 deslocações (intacto) |
| Basilios Restaurante | CPA: 0/1 manutenções, 0/1 deslocações (esgotado) |
| Brejo Doce Pastelaria | CPA: 1/2 manutenções, 2/3 deslocações |
| Café do Centro | SH: 9,25/10h, 2/2 deslocações |
| Doce M Confeitaria Artesanal | CPA: 1/2 manutenções, 2/3 deslocações. SH: 9,5/10h, 2/2 deslocações |
| Fluxo Principal - Unipessoal Lda | CPA: 2/2 manutenções, 3/3 deslocações (sem movimento) |
| Gafaniz & Gafaniz Lda | CPA: 2/2 manutenções, 3/3 deslocações (intacto) |
| Pão Artesanal Caldas/Pão com Chouriço | SH: 9,25/10h, 2/2 deslocações |
| Tasca da Fatinha | CPA: 1/1 manutenções, 2/2 deslocações (intacto) |

## 3. Pontos a decidir com o cliente

1. **Assistências remotas pagas por contrato em clientes sem SH.** São 30 (Adega 3, Basilios 6, Brejo 11, Gafaniz 1, Tasca 9). A regra atual só deixa estas assistências consumir horas de SH, por isso vão para dívida. O valor delas é 0 €, por isso a dívida em euros não as reflete. Opções: consomem horas CPA, cobram-se (a que preço?) ou ficam incluídas no contrato.
2. **Tipo de serviço "ASSISTÊNCIA PRESENCIAL"** (folha do Brejo de 14 de agosto, 1h17). Não pertence a CPA nem a SH, por isso hoje não consome nada. É preciso decidir como conta.
3. **Basilios.** Já usou a única manutenção e deslocação do ano. Uma nova manutenção passa a dívida. Confirmar se é o comportamento pretendido.
4. **Contratos sem data de início.** Vários contratos não têm datas e ficam fora da análise (a lista está no CSV de resumo de saldos).

## 4. Detalhe por cliente

### Adega 25 de Abril

Período: 2026-07-01 a 2027-07-01

Saldo final: CPA: 2/2 manutenções, 3/3 deslocações (intacto)

| Data | Tipo | Serviço | Pagamento | Horas | Resultado | Dívida € |
|---|---|---|---|---|---|---|
| 2026-07-22 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-08-11 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-10-19 | Assist. Remota |  | Contrato | 00:15 | Dívida (cliente sem período SH) |  |

### Basilios Restaurante

Período: 2026-05-01 a 2027-05-01

Saldo final: CPA: 0/1 manutenções, 0/1 deslocações (esgotado)

| Data | Tipo | Serviço | Pagamento | Horas | Resultado | Dívida € |
|---|---|---|---|---|---|---|
| 2026-06-25 | Folha de Obra | MANUTENÇÃO | CONTRATO | 01:09:00 | Consumo (1 manut + 1 desl) |  |
| 2026-08-14 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-08-18 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-08-28 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-09-01 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-09-02 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-10-02 | Assist. Remota |  | Contrato | 00:15 | Dívida (cliente sem período SH) |  |

### Brejo Doce Pastelaria

Período: 2026-05-01 a 2027-05-01

Saldo final: CPA: 1/2 manutenções, 2/3 deslocações

| Data | Tipo | Serviço | Pagamento | Horas | Resultado | Dívida € |
|---|---|---|---|---|---|---|
| 2026-05-08 | Assist. Remota | REMOTA | Faturação | 0.25 | Dívida (Faturação) | 7.5 |
| 2026-05-14 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-05-15 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-06-12 | Folha de Obra | MANUTENÇÃO | CONTRATO | 02:45:00 | Consumo (1 manut + 1 desl) |  |
| 2026-06-18 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-06-29 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-07-06 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-08-12 | Assist. Remota | TELEFÓNICA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-08-14 | Folha de Obra | ASSISTÊNCIA PRESENCIAL | CONTRATO | 01:17:00 | Sem consumo (tipo "ASSISTÊNCIA PRESENCIAL") |  |
| 2026-09-01 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-09-09 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-10-09 | Assist. Remota |  | Contrato | 00:15 | Dívida (cliente sem período SH) |  |
| 2026-10-19 | Assist. Remota |  | Contrato | 00:15 | Dívida (cliente sem período SH) |  |
| 2026-10-29 | Assist. Remota |  | Contrato | 00:30 | Dívida (cliente sem período SH) |  |

### Café do Centro

Período: 2026-10-01 a 2027-10-01

Saldo final: SH: 9,25/10h, 2/2 deslocações

| Data | Tipo | Serviço | Pagamento | Horas | Resultado | Dívida € |
|---|---|---|---|---|---|---|
| 2026-10-08 | Assist. Remota |  | Contrato | 00:15 | Consumo (0.25h) |  |
| 2026-10-19 | Assist. Remota |  | Contrato | 00:15 | Consumo (0.25h) |  |
| 2026-11-04 | Assist. Remota |  | Contrato | 00:15 | Consumo (0.25h) |  |

### Doce M Confeitaria Artesanal

Período: 2026-06-05 a 2027-06-05

Saldo final: CPA: 1/2 manutenções, 2/3 deslocações. SH: 9,5/10h, 2/2 deslocações

| Data | Tipo | Serviço | Pagamento | Horas | Resultado | Dívida € |
|---|---|---|---|---|---|---|
| 2026-06-05 | Assist. Remota | REMOTA | Contrato | 0.25 | Consumo (0.25h) |  |
| 2026-07-06 | Assist. Remota | REMOTA | Contrato | 0.25 | Consumo (0.25h) |  |
| 2026-08-18 | Folha de Obra | MANUTENÇÃO | CONTRATO | 01:30:00 | Consumo (1 manut + 1 desl) |  |

### Gafaniz & Gafaniz Lda

Período: 2025-12-01 a 2026-12-01

Saldo final: CPA: 2/2 manutenções, 3/3 deslocações (intacto)

| Data | Tipo | Serviço | Pagamento | Horas | Resultado | Dívida € |
|---|---|---|---|---|---|---|
| 2026-04-06 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-04-07 | Assist. Remota | REMOTA | Faturação | 0.25 | Dívida (Faturação) | 7.5 |
| 2026-04-08 | Assist. Remota | REMOTA | Faturação | 0.25 | Dívida (Faturação) | 7.5 |

### Pão Artesanal Caldas/Pão com Chouriço

Período: 2026-01-01 a 2027-01-01

Saldo final: SH: 9,25/10h, 2/2 deslocações

| Data | Tipo | Serviço | Pagamento | Horas | Resultado | Dívida € |
|---|---|---|---|---|---|---|
| 2026-01-12 | Assist. Remota | REMOTA | Contrato | 0.50 | Consumo (0.50h) |  |
| 2026-04-16 | Assist. Remota | REMOTA | Contrato | 0.25 | Consumo (0.25h) |  |

### Tasca da Fatinha

Período: 2026-06-01 a 2027-06-01

Saldo final: CPA: 1/1 manutenções, 2/2 deslocações (intacto)

| Data | Tipo | Serviço | Pagamento | Horas | Resultado | Dívida € |
|---|---|---|---|---|---|---|
| 2026-06-02 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-06-03 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-06-25 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-06-26 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-07-28 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-07-29 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-07-31 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-09-03 | Assist. Remota | REMOTA | Contrato | 0.25 | Dívida (cliente sem período SH) |  |
| 2026-11-05 | Assist. Remota |  | Contrato | 00:15 | Dívida (cliente sem período SH) |  |

## 5. Notas

- Esta análise é uma simulação nos dados lidos. Não alterou nada em produção.
- Horas das assistências remotas: valor guardado em "horas totais" ou, se faltar, a diferença entre início e fim.
- Os 21 movimentos de períodos anteriores não entram.
