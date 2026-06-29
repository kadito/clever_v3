# Brief -- installations-phases-refactor

**Type**: Feature
**Workflow**: requirements-first
**Date**: 2026-06-23

## Raw Input

Refactor to some phases of instalaçoes e programaçoes  


This are the new changes:

  
Setup

- Adicionar multiplos tipos de instação como fizemos no Registo Diario de Ativdade (Tipo de instalaçao pode ser repetido)

  


- Receçao do material
  - Equipamento do Cliente (SIM / NAO)
    - Nao aparecer caixa de texto
  -   
  Verificar condição do equipamento -> Mudar para "Verificações" - Tirar o SIM/NAO

  


- Verificar cabo - TRUE/FALSE
- Transformador - TRUE/FALSE
- Fechadura - TRUE/FALSE
- Chaves - TRUE/FALSE
- Testes ao equipamento - TRUE/FALSE

  
  


- Programação/Preparação
  - Software (one model can have sub modules)
    - Vectron
    - Pix
      - Pix Rest
        - Modulo 1
        - Modulo 2
        - Modulo 3
        - Posto adicional
      - Pix Gest
        - Modulo 1
        - Modulo 2
        - Modulo 3
        - Posto adicional
      - Pix POS
        - Modulo 1
        - Modulo 2
        - Modulo 3
        - Posto adicional
      - Pix AutoVenda
        - Modulo 1
        - Modulo 2
        - Modulo 3
        - Posto adicional
    - Pix Orders
    - Pix Order Posto Adicional
    - Pix MOnitor Pedidos
    - Pix RestFest
    - Zon Soft
      - ZS Rest
        - Basic
        - Light
        - Pro
      - ZS POS
        - Basic
        - Light
        - Pro
    - Zon Soft Mobile z
    - PT CERT
      - Licença definitiva
      - Licença Atual
    - Dream Soft
    - Contas Certas

  


- Preparação e instalaçao
  - Adiocinar em todos os Collapsables o TRUE/FALSE e so ter em consiredaçao os sub fiels se o parent tiver TRUE
  - Passar Equipamento adicional para o FIM com o TRUE/FALSE tambem
    - Ao ser False aparece caixa de texto

  


- Testes
  - Falhas detectadas (SIM / NAO)
    - SIM -> aparecer caixa de texto
