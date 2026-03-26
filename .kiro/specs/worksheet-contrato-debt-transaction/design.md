# Worksheet CONTRATO Debt Transaction Bugfix Design

## Overview

The balance system fails to create DEBT transactions when a work sheet uses `CONTRATO` payment against a client with unlimited (`-1`) contract resources. Two methods in `balance-service.ts` perform naive arithmetic on the `-1` sentinel value, causing validation failures and balance corruption. The fix adds sentinel-aware guards so that unlimited resources are preserved through validation and application, while finite resource arithmetic remains unchanged.

## Glossary

- **Bug_Condition (C)**: A DEBT transaction targets a contract resource whose current value is `-1` (unlimited) — the naive arithmetic `(-1) + (-1) = -2` triggers a validation error or corrupts the balance
- **Property (P)**: When the current resource value is `-1`, validation passes and the resource stays `-1` after the transaction; the DEBT transaction is created successfully
- **Preservation**: All existing behavior for finite resources (≥ 0), zero resources, warranty work, non-CONTRATO payments, ADD transactions, and optimistic locking must remain unchanged
- **`validateTransactionAgainstBalance`**: Private method in `BalanceService` that checks whether proposed changes would produce invalid resource values
- **`applyTransactionToBalance`**: Private method in `BalanceService` that computes the new `BalanceIndex` after applying a transaction
- **`createDebtTransaction`**: Public method in `BalanceService` that computes `balanceAfter` snapshot and orchestrates the DEBT transaction flow
- **Sentinel value (`-1`)**: Special value in `ContractUsage` fields meaning "unlimited resources" — must never be decremented

## Bug Details

### Bug Condition

The bug manifests when a DEBT transaction attempts to consume contract resources that are currently set to `-1` (unlimited). Both `validateTransactionAgainstBalance` and `applyTransactionToBalance` perform blind arithmetic (`currentValue + change`) without checking for the sentinel, producing `-2` which is invalid.

Additionally, `createDebtTransaction` computes the `balanceAfter` snapshot with the same blind arithmetic, so even the transaction record itself would contain a corrupted snapshot.

**Formal Specification:**
```
FUNCTION isBugCondition(currentBalance, changes)
  INPUT: currentBalance of type BalanceIndex, changes of type TransactionChanges
  OUTPUT: boolean

  IF changes.contractUsageChanges IS UNDEFINED THEN
    RETURN false
  END IF

  FOR EACH field IN [manutencoesPorAno, deslocacoesPorAno, horasAssistenciaAnuais] DO
    change := changes.contractUsageChanges[field]
    currentValue := currentBalance.contracts[field]

    IF change IS DEFINED AND change < 0 AND currentValue == -1 THEN
      RETURN true
    END IF
  END FOR

  RETURN false
END FUNCTION
```

### Examples

- **Unlimited maintenance + CONTRATO work sheet**: Client has `manutencoesPorAno = -1`, work sheet consumes `-1`. Current code: `-1 + (-1) = -2`, fails `newValue < -1` check → `ValidationError`. Expected: validation passes, resource stays `-1`.
- **Unlimited displacements + displacement**: Client has `deslocacoesPorAno = -1`, work sheet has displacement consuming `-1`. Current code: `-1 + (-1) = -2` in `applyTransactionToBalance` → balance corrupted to `-2`. Expected: resource stays `-1`.
- **Mixed unlimited/finite**: Client has `manutencoesPorAno = -1` (unlimited) and `deslocacoesPorAno = 5` (finite). Work sheet consumes both. Current code: maintenance fails validation. Expected: maintenance stays `-1`, displacements become `4`.
- **Finite resources (no bug)**: Client has `manutencoesPorAno = 3`, work sheet consumes `-1`. Current code: `3 + (-1) = 2` → works correctly. This must remain unchanged.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Finite resource arithmetic: `5 + (-1) = 4` continues to work for all three resource fields
- Zero resource rejection: `validateResourceAvailability` continues to reject CONTRATO payments when resources are `0`
- Warranty work sheets continue to skip DEBT transaction creation
- Non-CONTRATO payment methods continue to create DEBT transactions with `balanceChange = totalPrice`
- ADD transactions from contracts continue to add `-1` values correctly (setting resources as unlimited)
- `validateTransactionAgainstBalance` continues to reject transactions that would bring finite resources below `-1`
- Optimistic locking with version check and exponential backoff retry continues to work
- Balance change (euro debt) validation continues to reject negative balances

**Scope:**
All inputs where no contract resource field is simultaneously `-1` (current) and being decremented (negative change) are completely unaffected. This includes:
- All ADD transactions (positive changes only)
- DEBT transactions against finite resources
- DEBT transactions with `balanceChange` only (no `contractUsageChanges`)
- Warranty work sheets (no transaction created)

## Hypothesized Root Cause

Based on the code analysis, the root cause is confirmed (not hypothesized):

1. **`validateTransactionAgainstBalance` (line ~930-970)**: Computes `newValue = currentBalance.contracts[field] + change` without checking if `currentBalance.contracts[field] === -1`. When both are `-1`, result is `-2`, which fails the `newValue < -1` guard → throws `ValidationError`.

2. **`applyTransactionToBalance` (line ~980-1010)**: Same blind arithmetic `currentValue + change` without sentinel check. If validation were bypassed, the balance index would be corrupted with `-2` values.

3. **`createDebtTransaction` (line ~680-740)**: Computes `balanceAfter` snapshot with the same pattern: `currentBalanceSnapshot.contracts[field] + (changes.contractUsageChanges?.[field] || 0)`. The transaction record itself would contain an invalid snapshot.

All three locations need the same fix pattern: if the current resource value is `-1`, skip the arithmetic and preserve `-1`.

## Correctness Properties

Property 1: Bug Condition - Unlimited Resources Preserved Through DEBT Transactions

_For any_ DEBT transaction where the current balance has a contract resource set to `-1` (unlimited) and the transaction attempts to consume that resource (negative change), the fixed `validateTransactionAgainstBalance` SHALL pass validation, the fixed `applyTransactionToBalance` SHALL preserve `-1` in the resulting balance, and the fixed `createDebtTransaction` SHALL produce a `balanceAfter` snapshot with `-1` for that resource.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Finite Resource Arithmetic Unchanged

_For any_ transaction where the current balance has finite contract resources (≥ 0) and the transaction applies changes, the fixed functions SHALL produce exactly the same results as the original functions — same validation outcomes, same computed balance values, same `balanceAfter` snapshots.

**Validates: Requirements 3.1, 3.2, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

**File**: `packages/backend/src/services/balance-service.ts`

**Method 1**: `validateTransactionAgainstBalance`

**Specific Changes**:
1. **Add sentinel guard for `manutencoesPorAno`**: Before computing `newValue`, check if `currentBalance.contracts.manutencoesPorAno === -1`. If so, skip the arithmetic check for this field (unlimited resources always pass validation).
2. **Add sentinel guard for `deslocacoesPorAno`**: Same pattern — skip validation when current value is `-1`.
3. **Add sentinel guard for `horasAssistenciaAnuais`**: Same pattern — skip validation when current value is `-1`.

**Method 2**: `applyTransactionToBalance`

**Specific Changes**:
4. **Sentinel-aware arithmetic for `manutencoesPorAno`**: If `currentBalance.contracts.manutencoesPorAno === -1`, preserve `-1` in the result instead of adding the change.
5. **Sentinel-aware arithmetic for `deslocacoesPorAno`**: Same pattern.
6. **Sentinel-aware arithmetic for `horasAssistenciaAnuais`**: Same pattern.

**Method 3**: `createDebtTransaction`

**Specific Changes**:
7. **Sentinel-aware `balanceAfter` computation for `manutencoesPorAno`**: If `currentBalanceSnapshot.contracts.manutencoesPorAno === -1`, set `balanceAfter.contracts.manutencoesPorAno = -1` instead of adding the change.
8. **Same for `deslocacoesPorAno` and `horasAssistenciaAnuais`**.

All changes follow the same minimal pattern: check for `-1` before arithmetic, preserve `-1` if found.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause analysis by observing the exact failure mode.

**Test Plan**: Write unit tests that call `validateTransactionAgainstBalance` and `applyTransactionToBalance` with unlimited resource balances and negative DEBT changes. Run on UNFIXED code to observe failures.

**Test Cases**:
1. **Unlimited maintenance validation**: Balance with `manutencoesPorAno = -1`, change of `-1` → will throw ValidationError on unfixed code
2. **Unlimited displacements validation**: Balance with `deslocacoesPorAno = -1`, change of `-1` → will throw ValidationError on unfixed code
3. **Unlimited hours validation**: Balance with `horasAssistenciaAnuais = -1`, change of `-0.5` → will throw ValidationError on unfixed code
4. **Apply to unlimited resource**: Balance with all resources `-1`, DEBT transaction consuming all → will produce `-2` values on unfixed code

**Expected Counterexamples**:
- `validateTransactionAgainstBalance` returns `{ isValid: false, errors: ["Transaction would result in invalid maintenance visits: -2"] }`
- `applyTransactionToBalance` produces `contracts.manutencoesPorAno = -2` instead of `-1`

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL (currentBalance, changes) WHERE isBugCondition(currentBalance, changes) DO
  validation := validateTransactionAgainstBalance_fixed(currentBalance, changes)
  ASSERT validation.isValid == true

  newBalance := applyTransactionToBalance_fixed(currentBalance, transaction)
  FOR EACH field WHERE currentBalance.contracts[field] == -1 DO
    ASSERT newBalance.contracts[field] == -1
  END FOR
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL (currentBalance, changes) WHERE NOT isBugCondition(currentBalance, changes) DO
  ASSERT validateTransactionAgainstBalance_original(currentBalance, changes)
       = validateTransactionAgainstBalance_fixed(currentBalance, changes)

  ASSERT applyTransactionToBalance_original(currentBalance, transaction)
       = applyTransactionToBalance_fixed(currentBalance, transaction)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many combinations of finite resource values and transaction changes automatically
- It catches edge cases like boundary values (0, 1, large numbers) that manual tests might miss
- It provides strong guarantees that the fix is truly minimal and doesn't alter any non-sentinel behavior

**Test Plan**: Observe behavior on UNFIXED code first for finite resource scenarios, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Finite resource validation preservation**: Generate random finite balances (≥ 0) and random changes, verify validation result matches original
2. **Finite resource application preservation**: Generate random finite balances and transactions, verify computed balance matches original
3. **Balance change preservation**: Generate random euro balance changes, verify debt calculation unchanged
4. **ADD transaction preservation**: Generate random ADD transactions, verify they are unaffected by the fix

### Unit Tests

- Test `validateTransactionAgainstBalance` with each unlimited resource field individually
- Test `applyTransactionToBalance` with each unlimited resource field individually
- Test `createDebtTransaction` balanceAfter snapshot with unlimited resources
- Test mixed unlimited/finite resources (e.g., maintenance unlimited, displacements finite)
- Test that finite resources still decrement correctly
- Test that zero resources still fail validation via `validateResourceAvailability`

### Property-Based Tests

- Generate random `BalanceIndex` with resources in `{-1, 0, 1, ..., 100}` and random negative changes, verify unlimited resources always stay `-1` and finite resources decrement correctly
- Generate random finite-only `BalanceIndex` (no `-1` values) and random changes, verify output matches original unfixed function exactly (preservation)
- Generate random DEBT `TransactionChanges` and verify `balanceAfter` snapshot consistency with the applied balance

### Integration Tests

- Test full `onWorkSheetCreated` flow with a CONTRATO work sheet against unlimited resources — verify DEBT transaction is created and balance preserved
- Test full flow with mixed unlimited/finite resources — verify correct fields are preserved/decremented
- Test that warranty work sheets still skip transaction creation with unlimited resources
