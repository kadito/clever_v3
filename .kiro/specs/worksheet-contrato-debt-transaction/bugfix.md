# Bugfix Requirements Document

## Introduction

When a work sheet is created with `displacement.paymentMethod = "CONTRATO"` and a valid `contractId`, no DEBT transaction is being created in the balance system. The work sheet is saved successfully (HTTP 201), but the asynchronous balance middleware silently fails to create the corresponding DEBT transaction that should consume contract resources (1 maintenance visit + 1 displacement).

The root cause is that the balance system does not properly handle the `-1` (unlimited) sentinel value during arithmetic operations. When contract resources are unlimited (`-1`), the system blindly adds negative consumption values (e.g., `-1 + (-1) = -2`), which then fails the `validateTransactionAgainstBalance` check (`newValue < -1`). This validation error is caught and swallowed by the fire-and-forget async pattern in the work sheet route, so the DEBT transaction is never created and no error is surfaced to the user.

Additionally, `applyTransactionToBalance` does not preserve the `-1` sentinel — it decrements unlimited resources to `-2`, corrupting the balance state even if validation were to pass.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a client has unlimited contract resources (`-1` sentinel value for `deslocacoesPorAno` or `manutencoesPorAno` or `horasAssistenciaAnuais`) AND a DEBT transaction attempts to consume those resources THEN the system calculates `newValue = -1 + (-1) = -2` in `validateTransactionAgainstBalance`, which fails the `newValue < -1` check, throwing a `ValidationError` that silently prevents the DEBT transaction from being created

1.2 WHEN `applyTransactionToBalance` processes a DEBT transaction against unlimited resources (`-1`) THEN the system blindly adds the negative change (e.g., `-1 + (-1) = -2`), corrupting the balance index by turning an unlimited resource into an invalid value

1.3 WHEN the balance middleware `onWorkSheetCreated` fails due to a `ValidationError` from the unlimited resource arithmetic THEN the error is caught and only logged to console — the user receives no indication that the DEBT transaction was not created, and the work sheet appears to have been processed normally

1.4 WHEN `validateResourceAvailability` (pre-creation check in the route) evaluates unlimited resources (`-1`) for a CONTRATO payment THEN the validation passes correctly (because `-1 !== -1` is false in the `contracts.deslocacoesPorAno !== -1` guard), but the subsequent async DEBT transaction creation fails in `validateTransactionAgainstBalance` which uses a different arithmetic-based check

### Expected Behavior (Correct)

2.1 WHEN a client has unlimited contract resources (`-1` sentinel value) AND a DEBT transaction attempts to consume those resources THEN the system SHALL recognize the `-1` sentinel and skip the arithmetic check, allowing the transaction to proceed without validation error

2.2 WHEN `applyTransactionToBalance` processes a DEBT transaction against unlimited resources (`-1`) THEN the system SHALL preserve the `-1` sentinel value in the resulting balance index, keeping the resource marked as unlimited rather than decrementing it

2.3 WHEN a DEBT transaction is created for a CONTRATO work sheet THEN the system SHALL successfully create the DEBT transaction and update the balance index, consuming finite resources (decrementing by the change amount) while preserving unlimited resources (keeping `-1`)

2.4 WHEN the balance middleware encounters an error during DEBT transaction creation for a CONTRATO work sheet THEN the system SHALL log the error with sufficient detail (including the specific validation failure and resource values) to enable diagnosis

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a client has finite (non-unlimited, non-zero) contract resources AND a DEBT transaction consumes those resources THEN the system SHALL CONTINUE TO decrement the resource values normally (e.g., `5 + (-1) = 4`)

3.2 WHEN a client has zero contract resources AND a DEBT transaction attempts to consume those resources THEN the system SHALL CONTINUE TO reject the transaction via `validateResourceAvailability` with the "Recursos insuficientes" error before the work sheet is created

3.3 WHEN a work sheet is created with `warranty = true` THEN the system SHALL CONTINUE TO skip DEBT transaction creation (no balance change for warranty work)

3.4 WHEN a work sheet is created with a non-CONTRATO payment method THEN the system SHALL CONTINUE TO create a DEBT transaction with `balanceChange` equal to the calculated `totalPrice`

3.5 WHEN an ADD transaction is created from a contract with unlimited resources (`-1`) THEN the system SHALL CONTINUE TO add the `-1` value to the balance, correctly setting the resource as unlimited

3.6 WHEN `validateTransactionAgainstBalance` checks finite resource consumption THEN the system SHALL CONTINUE TO reject transactions that would result in values below `-1` for non-unlimited resources

3.7 WHEN the optimistic locking detects a version conflict during balance update THEN the system SHALL CONTINUE TO retry with exponential backoff up to 3 attempts
