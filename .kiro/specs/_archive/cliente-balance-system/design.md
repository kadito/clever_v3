# Design Document: Cliente Balance System

## Overview

The Cliente Balance System is a specialized financial tracking subsystem within the CLEVER dashboard that maintains accurate records of client debts and contract resource consumption. Unlike standard content types that use the BaseContent interface, this system employs a custom storage pattern optimized for financial data integrity and audit trail requirements.

The system operates on two core principles:
1. **Immutable Transaction Ledger**: All balance changes are recorded as immutable transactions that form a complete audit trail
2. **Derived Balance State**: Current balance and contract usage are derived from the transaction history and cached in balance indexes for performance

This design ensures data integrity, provides complete audit trails for compliance, and integrates seamlessly with existing content creation workflows (contracts, work sheets, remote assistance).

## Architecture

### Storage Architecture

The balance system uses a hierarchical R2 storage structure:

```
balance/
├── {clientId}/
│   ├── index.json                    # Current balance state (cached aggregate)
│   └── transactions/
│       ├── {uuid-1}.json            # Transaction record
│       ├── {uuid-2}.json            # Transaction record
│       └── {uuid-n}.json            # Transaction record
```

**Design Rationale:**
- Client-centric organization enables efficient retrieval of all data for a specific client
- Separate transaction storage provides immutability and audit trail
- Balance index acts as a materialized view for performance

### Integration Architecture

The balance system integrates with existing content workflows through middleware hooks:

```
Content Creation Flow:
┌─────────────────┐
│ User Creates    │
│ Content         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Content API     │
│ Handler         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save Content    │
│ to R2           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Balance         │
│ Middleware      │◄─── Async processing
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Process         │
│ Transaction     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Balance  │
│ Index           │
└─────────────────┘
```

**Design Rationale:**
- Asynchronous processing prevents blocking content creation
- Middleware pattern allows clean separation of concerns
- Failure in balance processing doesn't prevent content creation

## Components and Interfaces

### 1. Balance Index

The balance index represents the current financial state for a client:

```typescript
interface BalanceIndex {
  clientId: string;
  balance: number;                    // Debt in euros (>= 0)
  contracts: ContractUsage;
  lastUpdated: string;                // ISO timestamp
  lastTransactionId: string;          // UUID of last processed transaction
  version: number;                    // Optimistic locking version
}

interface ContractUsage {
  manutencoesPorAno: number;         // Maintenance visits remaining
  deslocacoesPorAno: number;         // Displacements remaining
  horasAssistenciaAnuais: number;    // Assistance hours remaining
}
```

**Design Notes:**
- `balance` is always non-negative (debt, not credit)
- Contract usage values can be -1 for unlimited
- `version` enables optimistic locking for concurrent updates
- `lastTransactionId` provides transaction chain verification

### 2. Transaction Record

Immutable record of a balance change:

```typescript
interface BalanceTransaction {
  uuid: string;
  clientId: string;
  type: 'ADD' | 'DEBT';
  source: 'contract' | 'contract-renovation' | 'work-sheet' | 'remote-assistance';
  sourceId: string;                   // UUID of source content
  timestamp: string;                  // ISO timestamp
  createdBy: string;                  // User ID from auth context
  changes: TransactionChanges;
  balanceAfter: BalanceSnapshot;
  metadata: TransactionMetadata;
}

interface TransactionChanges {
  balanceChange?: number;             // Euro amount added to debt (positive)
  contractUsageChanges?: {
    manutencoesPorAno?: number;       // Positive for ADD, negative for DEBT
    deslocacoesPorAno?: number;       // Positive for ADD, negative for DEBT
    horasAssistenciaAnuais?: number;  // Positive for ADD, negative for DEBT
  };
}

interface BalanceSnapshot {
  balance: number;
  contracts: ContractUsage;
}

interface TransactionMetadata {
  paymentMethod?: string;             // For work sheets and remote assistance
  serviceDetails?: Record<string, any>; // Additional context
  contractType?: string;              // For contract transactions
  renovationPeriod?: string;          // For contract renovations
}
```

**Design Notes:**
- Transactions are immutable once created
- `balanceAfter` provides point-in-time snapshot for verification
- `changes` describes the delta, not absolute values
- `metadata` provides context without affecting balance calculations

### 3. Balance Service

Core service for balance operations:

```typescript
interface BalanceService {
  // Transaction creation
  createAddTransaction(
    clientId: string,
    sourceId: string,
    sourceType: 'contract' | 'contract-renovation',
    contractUsageChanges: ContractUsageChanges,
    userId: string,
    metadata: TransactionMetadata
  ): Promise<BalanceTransaction>;

  createDebtTransaction(
    clientId: string,
    sourceId: string,
    sourceType: 'work-sheet' | 'remote-assistance',
    changes: TransactionChanges,
    userId: string,
    metadata: TransactionMetadata
  ): Promise<BalanceTransaction>;

  // Balance queries
  getBalance(clientId: string): Promise<BalanceIndex | null>;
  getTransactionHistory(
    clientId: string,
    options?: QueryOptions
  ): Promise<BalanceTransaction[]>;

  // Validation
  validateTransaction(
    clientId: string,
    changes: TransactionChanges
  ): Promise<ValidationResult>;

  // Administrative
  recalculateBalance(clientId: string): Promise<BalanceIndex>;
  retryFailedTransaction(transactionId: string): Promise<void>;
}

interface QueryOptions {
  type?: 'ADD' | 'DEBT';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
```

**Design Notes:**
- Separate methods for ADD and DEBT transactions enforce type safety
- Validation is explicit and separate from transaction creation
- Administrative methods support error recovery and data verification

### 4. Balance Middleware

Middleware hooks for content creation integration:

```typescript
interface BalanceMiddleware {
  // Hook after contract creation
  onContractCreated(contract: Contract, userId: string): Promise<void>;

  // Hook after contract update (for renovations)
  onContractUpdated(
    contract: Contract,
    previousContract: Contract,
    userId: string
  ): Promise<void>;

  // Hook after work sheet creation
  onWorkSheetCreated(workSheet: WorkSheet, userId: string): Promise<void>;

  // Hook after remote assistance creation
  onRemoteAssistanceCreated(
    remoteAssistance: RemoteAssistance,
    userId: string
  ): Promise<void>;
}
```

**Design Notes:**
- Hooks are called asynchronously after content is saved
- Failures in hooks are logged but don't prevent content creation
- Each hook extracts relevant data and calls BalanceService

### 5. Balance Display Components

Frontend components for displaying balance information:

```typescript
// Vue component for client detail view
interface ClientBalanceDisplay {
  props: {
    clientId: string;
  };
  data: {
    balance: BalanceIndex | null;
    isLoading: boolean;
    error: string | null;
  };
  computed: {
    hasDebt: boolean;
    hasLowContractUsage: boolean;
    warningMessage: string | null;
  };
}

// Vue component for transaction history
interface TransactionHistoryDisplay {
  props: {
    clientId: string;
  };
  data: {
    transactions: BalanceTransaction[];
    filters: QueryOptions;
    isLoading: boolean;
    error: string | null;
  };
  methods: {
    loadTransactions(): Promise<void>;
    filterByType(type: 'ADD' | 'DEBT'): void;
    filterByDateRange(start: string, end: string): void;
  };
}
```

**Design Notes:**
- Components use existing CLEVER design patterns (mobile-first, Portuguese labels)
- Balance display integrates into existing client detail view
- Transaction history is a separate view accessible from client detail

## Data Models

### Balance Calculation Logic

The balance index is a materialized view derived from transactions:

```typescript
function calculateBalance(transactions: BalanceTransaction[]): BalanceIndex {
  const sortedTransactions = transactions.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let balance = 0;
  let contracts: ContractUsage = {
    manutencoesPorAno: 0,
    deslocacoesPorAno: 0,
    horasAssistenciaAnuais: 0,
  };

  for (const transaction of sortedTransactions) {
    // Apply balance changes
    if (transaction.changes.balanceChange) {
      balance += transaction.changes.balanceChange;
    }

    // Apply contract usage changes
    if (transaction.changes.contractUsageChanges) {
      const changes = transaction.changes.contractUsageChanges;
      
      if (changes.manutencoesPorAno !== undefined) {
        contracts.manutencoesPorAno += changes.manutencoesPorAno;
      }
      if (changes.deslocacoesPorAno !== undefined) {
        contracts.deslocacoesPorAno += changes.deslocacoesPorAno;
      }
      if (changes.horasAssistenciaAnuais !== undefined) {
        contracts.horasAssistenciaAnuais += changes.horasAssistenciaAnuais;
      }
    }
  }

  return {
    clientId: transactions[0].clientId,
    balance,
    contracts,
    lastUpdated: new Date().toISOString(),
    lastTransactionId: sortedTransactions[sortedTransactions.length - 1].uuid,
    version: sortedTransactions.length,
  };
}
```

**Design Notes:**
- Transactions are processed in chronological order
- ADD transactions have positive changes, DEBT transactions have negative changes
- Balance index can be recalculated from scratch if needed
- Version number equals transaction count for simple verification

### Transaction Extraction Logic

Logic to extract transaction data from source content:

```typescript
// Extract ADD transaction from contract
function extractContractAddTransaction(contract: Contract): TransactionChanges {
  const changes: TransactionChanges = {
    contractUsageChanges: {},
  };

  // Extract from CPA contract if present
  if (contract.data.hasCPAContract) {
    changes.contractUsageChanges!.manutencoesPorAno = 
      contract.data.manutencoesPorAnoCPA || 0;
    changes.contractUsageChanges!.deslocacoesPorAno = 
      contract.data.deslocacoesPorAnoCPA || 0;
    changes.contractUsageChanges!.horasAssistenciaAnuais = 
      contract.data.horasAssistenciaAnualCPA || 0;
  }

  // Extract from S&H contract if present
  if (contract.data.hasSHContract) {
    changes.contractUsageChanges!.manutencoesPorAno! += 
      contract.data.manutencoesPorAnoSH || 0;
    changes.contractUsageChanges!.deslocacoesPorAno! += 
      contract.data.deslocacoesPorAnoSH || 0;
    changes.contractUsageChanges!.horasAssistenciaAnuais! += 
      contract.data.horasAssistenciaAnualSH || 0;
  }

  return changes;
}

// Extract DEBT transaction from work sheet
function extractWorkSheetDebtTransaction(workSheet: WorkSheet): TransactionChanges {
  const paymentMethod = workSheet.data.paymentMethod;

  // Garantia - no transaction
  if (paymentMethod === 'Garantia') {
    return { contractUsageChanges: {} };
  }

  // Contract payment - consume contract resources
  if (paymentMethod === 'Contract') {
    return {
      contractUsageChanges: {
        manutencoesPorAno: -1,           // Consume 1 maintenance visit
        deslocacoesPorAno: workSheet.data.displacements || 0,
        horasAssistenciaAnuais: workSheet.data.hours || 0,
      },
    };
  }

  // Other payment methods - add to debt
  return {
    balanceChange: workSheet.data.totalValue || 0,
  };
}

// Extract DEBT transaction from remote assistance
function extractRemoteAssistanceDebtTransaction(
  remoteAssistance: RemoteAssistance
): TransactionChanges {
  const paymentMethod = remoteAssistance.data.paymentMethod;

  // Garantia - no transaction
  if (paymentMethod === 'Garantia') {
    return { contractUsageChanges: {} };
  }

  // Contract payment - consume assistance hours
  if (paymentMethod === 'Contract') {
    return {
      contractUsageChanges: {
        horasAssistenciaAnuais: -(remoteAssistance.data.duration || 0),
      },
    };
  }

  // Other payment methods - add to debt
  return {
    balanceChange: remoteAssistance.data.totalValue || 0,
  };
}
```

**Design Notes:**
- Extraction logic is centralized and testable
- Handles both CPA and S&H contracts
- Negative values for DEBT transactions (consumption)
- Positive values for ADD transactions (addition)
- Garantia payment method results in no transaction

### Concurrent Update Handling

Optimistic locking strategy for concurrent updates:

```typescript
async function updateBalanceWithTransaction(
  clientId: string,
  transaction: BalanceTransaction,
  maxRetries: number = 3
): Promise<BalanceIndex> {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // 1. Read current balance index
      const currentBalance = await getBalance(clientId);
      const currentVersion = currentBalance?.version || 0;

      // 2. Validate transaction against current balance
      const validation = validateTransactionAgainstBalance(
        currentBalance,
        transaction.changes
      );
      
      if (!validation.isValid) {
        throw new ValidationError(validation.errors[0]);
      }

      // 3. Calculate new balance
      const newBalance = applyTransactionToBalance(currentBalance, transaction);
      newBalance.version = currentVersion + 1;

      // 4. Write transaction record (immutable)
      await writeTransaction(transaction);

      // 5. Write balance index with version check
      const success = await writeBalanceWithVersionCheck(
        newBalance,
        currentVersion
      );

      if (success) {
        return newBalance;
      }

      // Version conflict - retry
      retries++;
      await sleep(Math.pow(2, retries) * 100); // Exponential backoff
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error; // Don't retry validation errors
      }
      
      retries++;
      if (retries >= maxRetries) {
        throw new Error(`Failed to update balance after ${maxRetries} retries`);
      }
      
      await sleep(Math.pow(2, retries) * 100);
    }
  }

  throw new Error('Unexpected error in balance update');
}

async function writeBalanceWithVersionCheck(
  balance: BalanceIndex,
  expectedVersion: number
): Promise<boolean> {
  // Read current version from R2
  const current = await r2Bucket.get(`balance/${balance.clientId}/index.json`);
  
  if (current) {
    const currentData = JSON.parse(await current.text());
    if (currentData.version !== expectedVersion) {
      return false; // Version conflict
    }
  }

  // Write new version
  await r2Bucket.put(
    `balance/${balance.clientId}/index.json`,
    JSON.stringify(balance, null, 2)
  );

  return true;
}
```

**Design Notes:**
- Optimistic locking prevents lost updates
- Exponential backoff reduces contention
- Validation errors are not retried
- Transaction is written before balance index (audit trail preserved even on failure)
- Version conflicts trigger retry with fresh data

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I identified the following areas where properties can be consolidated:

**Consolidation Opportunities:**
1. Transaction structure properties (2.1-2.11) can be combined into a single comprehensive property about transaction record completeness
2. ADD transaction properties (3.1-3.7) can be combined into one property about ADD transactions increasing resources
3. DEBT transaction properties for work sheets (4.1-4.5) and remote assistance (5.1-5.5) can be combined into one property about payment method determining transaction type
4. Validation properties (6.1-6.6) can be combined into one property about preventing negative balances
5. Immutability properties (2.12, 11.1-11.4) can be combined into one property about transaction immutability

**Properties to Keep Separate:**
- Balance calculation from transactions (1.5) - fundamental correctness property
- Balance index structure (1.2, 1.3) - can be combined into one property
- Contract renovation (10.1-10.5) - specific workflow that should be tested separately
- Filtering and querying (9.1-9.8, 15.1-15.5) - can be combined into one property about query correctness

### Correctness Properties

Property 1: Balance Index Non-Negativity Invariant
*For any* balance index, the debt amount must be greater than or equal to zero, and all contract usage values must be greater than or equal to -1 (where -1 represents unlimited).
**Validates: Requirements 1.2, 1.3**

Property 2: Balance Calculation Consistency
*For any* sequence of transactions for a client, recalculating the balance from scratch by summing all transaction changes should produce the same result as the current balance index.
**Validates: Requirements 1.5**

Property 3: Transaction Record Completeness
*For any* transaction record, it must contain all required fields: uuid, clientId, type, source, sourceId, timestamp, createdBy, changes, balanceAfter, and metadata.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11**

Property 4: Transaction Immutability
*For any* transaction record that has been created, any attempt to modify or delete that transaction must fail.
**Validates: Requirements 2.12, 11.1, 11.2, 11.3**

Property 5: ADD Transaction Resource Increase
*For any* ADD transaction (from contract creation or renovation), all contract usage changes must be non-negative (zero or positive values only).
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

Property 6: Payment Method Determines Transaction Type
*For any* work sheet or remote assistance with payment method "Contract", the system must create a DEBT transaction with contract usage decreases; for payment method other than "Contract" or "Garantia", the system must create a DEBT transaction with balance increase; for payment method "Garantia", no transaction should be created.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5**

Property 7: Validation Prevents Negative Balances
*For any* proposed DEBT transaction, if applying the transaction would result in negative balance or negative contract usage (excluding -1 for unlimited), the validation must reject the transaction.
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

Property 8: Contract Renovation Accumulation
*For any* contract renovation, the ADD transaction must add the new period's resources to the existing balance, not replace them.
**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

Property 9: Low Usage Warning Threshold
*For any* balance index where any contract usage value is below 20% of its original value (from the first ADD transaction), the system must indicate a warning state.
**Validates: Requirements 8.5**

Property 10: Transaction History Filtering Correctness
*For any* transaction history query with filters (type, date range), all returned transactions must match the filter criteria, and no transactions matching the criteria should be excluded.
**Validates: Requirements 9.6, 9.7, 15.2, 15.3**

Property 11: Balance Reporting Aggregation Accuracy
*For any* set of client balances, the summary statistics (total debt, average debt, count of clients with debt) must accurately reflect the sum and average of individual client balances.
**Validates: Requirements 15.4**

Property 12: Error Preservation of Previous State
*For any* balance update that fails due to validation or errors, the balance index must remain unchanged from its state before the attempted update.
**Validates: Requirements 13.2**

## Error Handling

### Validation Errors

The system distinguishes between validation errors (business rule violations) and system errors (infrastructure failures):

**Validation Errors (Do Not Retry):**
- Negative balance would result from transaction
- Negative contract usage would result from transaction
- Missing required fields in transaction data
- Invalid source content reference

**System Errors (Retry with Backoff):**
- R2 read/write failures
- Network timeouts
- Temporary service unavailability
- Version conflicts (optimistic locking)

### Error Response Format

```typescript
interface BalanceError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
}

// Example validation error
{
  code: 'NEGATIVE_BALANCE',
  message: 'Transaction would result in negative balance',
  details: {
    currentBalance: 50,
    proposedChange: -75,
    resultingBalance: -25
  },
  retryable: false
}

// Example system error
{
  code: 'R2_WRITE_FAILED',
  message: 'Failed to write transaction to R2',
  details: {
    transactionId: 'uuid-123',
    attempt: 3
  },
  retryable: true
}
```

### Error Logging

All balance operations must log errors with structured data:

```typescript
console.error('Balance operation failed:', JSON.stringify({
  operation: 'createDebtTransaction',
  clientId: 'client-uuid',
  sourceId: 'work-sheet-uuid',
  error: {
    code: error.code,
    message: error.message,
    details: error.details
  },
  timestamp: new Date().toISOString()
}, null, 2));
```

### Failed Transaction Recovery

The system maintains a failed transaction queue for administrative recovery:

```typescript
interface FailedTransaction {
  transactionId: string;
  clientId: string;
  sourceId: string;
  sourceType: string;
  failureReason: string;
  failureTimestamp: string;
  retryCount: number;
  lastRetryTimestamp?: string;
}
```

Administrators can:
1. View failed transactions
2. Manually retry failed transactions
3. Mark transactions as permanently failed (e.g., invalid source data)

## Testing Strategy

### Dual Testing Approach

The Cliente Balance System requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests Focus:**
- Specific transaction extraction scenarios (contract with CPA only, S&H only, both)
- Edge cases (zero values, unlimited values, missing fields)
- Error message formatting and Portuguese labels
- Component rendering with specific balance states
- Integration points between middleware and service

**Property-Based Tests Focus:**
- Universal correctness properties across all inputs
- Balance calculation consistency with random transaction sequences
- Validation rules with randomly generated invalid transactions
- Transaction immutability with random modification attempts
- Query filtering with random filter combinations

### Property-Based Testing Configuration

All property tests must:
- Run minimum 100 iterations per test
- Use fast-check library for TypeScript
- Tag tests with feature name and property number
- Reference design document properties

**Example Property Test:**

```typescript
import fc from 'fast-check';
import { describe, test, expect } from 'vitest';

describe('Cliente Balance System - Property Tests', () => {
  test('Property 2: Balance Calculation Consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({
          type: fc.constantFrom('ADD', 'DEBT'),
          balanceChange: fc.integer({ min: 0, max: 1000 }),
          contractUsageChanges: fc.record({
            manutencoesPorAno: fc.integer({ min: -10, max: 10 }),
            deslocacoesPorAno: fc.integer({ min: -10, max: 10 }),
            horasAssistenciaAnuais: fc.integer({ min: -10, max: 10 }),
          })
        }), { minLength: 1, maxLength: 50 }),
        async (transactions) => {
          // Calculate balance from transactions
          const calculatedBalance = calculateBalanceFromTransactions(transactions);
          
          // Recalculate from scratch
          const recalculatedBalance = calculateBalanceFromTransactions(transactions);
          
          // Should be identical
          expect(calculatedBalance.balance).toBe(recalculatedBalance.balance);
          expect(calculatedBalance.contracts).toEqual(recalculatedBalance.contracts);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: cliente-balance-system, Property 2: Balance Calculation Consistency
});
```

### Unit Testing Balance

While property tests provide comprehensive coverage, unit tests are essential for:
- Specific business scenarios (e.g., "Contract with only CPA section")
- Portuguese error message validation
- Component integration with specific props
- Edge cases that are difficult to generate randomly

**Avoid writing too many unit tests** - property-based tests handle covering lots of inputs. Focus unit tests on concrete examples that demonstrate correct behavior and integration points.

### Testing Checklist

**Balance Service:**
- [ ] Transaction creation with valid data
- [ ] Transaction creation with invalid data (validation errors)
- [ ] Balance calculation from transaction history
- [ ] Concurrent update handling with version conflicts
- [ ] Error handling and retry logic

**Middleware Integration:**
- [ ] Contract creation triggers ADD transaction
- [ ] Work sheet creation triggers appropriate transaction
- [ ] Remote assistance creation triggers appropriate transaction
- [ ] Failed balance updates don't prevent content creation

**Frontend Components:**
- [ ] Balance display shows correct values
- [ ] Warning indicators appear when usage is low
- [ ] Transaction history displays and filters correctly
- [ ] Portuguese labels are accurate
- [ ] Mobile-responsive design works correctly

**Property-Based Tests:**
- [ ] All 12 correctness properties implemented
- [ ] Each test runs 100+ iterations
- [ ] Tests tagged with feature and property number
- [ ] Tests cover edge cases through randomization

## Performance Considerations

### R2 Operation Optimization

**Read Optimization:**
- Cache balance indexes for 30 seconds to reduce R2 reads
- Batch read multiple balance indexes when displaying lists
- Use conditional requests (ETags) to avoid unnecessary data transfer

**Write Optimization:**
- Write transactions before balance indexes (audit trail priority)
- Use parallel writes for transaction and index when safe
- Implement write-behind caching for high-frequency updates

### Query Performance

**Transaction History:**
- Limit default query to 50 transactions
- Implement cursor-based pagination for large histories
- Consider maintaining a transaction index for faster filtering

**Balance Reporting:**
- Cache aggregate statistics for 5 minutes
- Use streaming for large result sets
- Implement background jobs for expensive reports

### Caching Strategy

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class BalanceCache {
  private cache: Map<string, CacheEntry<BalanceIndex>>;
  
  get(clientId: string): BalanceIndex | null {
    const entry = this.cache.get(clientId);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(clientId);
      return null;
    }
    
    return entry.data;
  }
  
  set(clientId: string, balance: BalanceIndex, ttl: number = 30000): void {
    this.cache.set(clientId, {
      data: balance,
      timestamp: Date.now(),
      ttl
    });
  }
  
  invalidate(clientId: string): void {
    this.cache.delete(clientId);
  }
}
```

**Cache Invalidation Rules:**
- Invalidate balance cache after any transaction creation
- Invalidate transaction history cache after new transaction
- Use short TTLs (30 seconds) to balance performance and freshness

## Security Considerations

### Data Access Control

Balance data is sensitive financial information:

**Read Access:**
- Authenticated users can read balance for clients they have access to
- Admin users can read all client balances
- Balance reporting requires admin privileges

**Write Access:**
- Only system (via middleware) can create transactions
- No direct user-initiated transaction creation
- Administrative recovery operations require admin privileges

### Audit Trail

All balance operations must be auditable:

**Transaction Audit:**
- Every transaction records the user who triggered it (via content creation)
- Timestamp provides temporal audit trail
- Source content reference enables tracing back to original operation

**Balance Index Audit:**
- Version number provides change tracking
- Last transaction ID enables verification of transaction chain
- Last updated timestamp shows when balance was last modified

### Data Integrity

Protect against data corruption:

**Validation:**
- All transactions validated before creation
- Balance indexes validated after calculation
- Version conflicts detected and handled

**Immutability:**
- Transactions cannot be modified or deleted
- Balance indexes can only be updated through transaction processing
- Failed updates leave previous state intact

## Migration and Deployment

### Initial Deployment

**Phase 1: Infrastructure Setup**
1. Deploy balance service with R2 storage
2. Deploy middleware hooks (disabled)
3. Deploy frontend components (hidden)
4. Test with synthetic data

**Phase 2: Historical Data Migration**
1. Process all existing contracts to create ADD transactions
2. Process all existing work sheets to create DEBT transactions
3. Process all existing remote assistance to create DEBT transactions
4. Verify balance calculations match expected values

**Phase 3: Live Integration**
1. Enable middleware hooks for new content
2. Enable frontend components
3. Monitor for errors and performance issues
4. Provide user training on balance features

### Rollback Strategy

If issues arise:

**Immediate Rollback:**
1. Disable middleware hooks (stop new transactions)
2. Hide frontend components
3. Investigate and fix issues
4. Re-enable when ready

**Data Rollback:**
- Transaction data is immutable - no rollback needed
- Balance indexes can be recalculated from transactions
- No risk of data loss or corruption

### Backward Compatibility

The balance system is additive:
- No changes to existing content types
- No changes to existing APIs
- No changes to existing workflows
- Can be deployed and tested independently

## Future Enhancements

### Planned Improvements

**Payment Processing Integration:**
- Record payments that reduce client debt
- Payment transactions (PAYMENT type)
- Payment history and receipts

**Contract Expiration Handling:**
- Automatic expiration of unused contract resources
- Notifications when contracts are near expiration
- Rollover policies for unused resources

**Advanced Reporting:**
- Client financial health scoring
- Predictive analytics for contract usage
- Revenue forecasting based on debt and contracts

**Bulk Operations:**
- Bulk contract renewals
- Bulk balance adjustments
- Bulk transaction imports

### Extension Points

The system is designed for extensibility:

**New Transaction Types:**
- Add new transaction types (PAYMENT, ADJUSTMENT, REFUND)
- Extend TransactionChanges interface
- Update balance calculation logic

**New Contract Types:**
- Support additional contract structures
- Extend ContractUsage interface
- Update extraction logic

**Integration Points:**
- Webhook notifications for balance changes
- External accounting system integration
- Automated billing system integration
