# Brief

On Registo Diário de Atividade, each activity has a "Ligação" field (Folha de Obra or Assistência Remota). After selecting a value, the corresponding input appears.

## Desired behavior

- In each activity, the user must choose the CLIENTE first.
- Then select a FOLHA DE OBRA or ASSISTÊNCIA REMOTA associated to that client.
- The "Ligação" field may be removed if it doesn't simplify the endpoint logic for searching client-associated work sheets or remote assistances. If it does simplify things, keep it.

## Open questions

- Should the "Ligação" selector be kept or removed?
  - Keep it if it simplifies which endpoint to call (search folhas de obra vs assistências remotas for a given client)
  - Remove it if both can be searched under a single flow without it
