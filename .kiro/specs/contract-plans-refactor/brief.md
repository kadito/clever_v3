# Brief — contract-plans-refactor

## Context

Refactor the Contracts module. All PLANS have changed and need to be updated based on new data sources.

## Data Sources

- `client_data/software_hardware_contracts.xlsx` — S&H contract plans
- `client_data/cpa_contracts.xlsx` — CPA contract plans

## Equipment Pricing Logic Change

Currently: a DISCOUNT is defined per equipment.

New behavior:
- When only 1 equipment: the base price and contract parameters are the BASE values (defined in the client_data files).
- When the user adds 1 or more additional equipments: the BASE PRICE and BASE PARAMETERS must be overwritten — the user will manually specify the price and parameters.

## Parameters (both CPA and S&H unless noted)

- **(BOTH)** Manutenções/Deslocações por ano
- **(BOTH)** Intervenções adicionais
- **(BOTH)** Intervalos de trabalho: semana, qualquer hora/dia
- **(S&H only)** Horas por ano
