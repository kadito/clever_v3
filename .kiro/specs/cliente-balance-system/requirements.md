# Requirements Document: Cliente Balance System

## Introduction

The Cliente Balance System is a financial tracking system that monitors client debts and contract usage within the CLEVER dashboard. This system tracks monetary balances (debts) and contract resource consumption (maintenance visits, displacements, assistance hours) through an immutable transaction ledger stored in Cloudflare R2.

Unlike standard content types, this system uses a specialized storage pattern with balance indexes and transaction records to ensure data integrity and provide complete audit trails for all financial operations.

## Glossary

- **Balance_System**: The complete financial tracking system for client debts and contract usage
- **Balance_Index**: The current state record for a client's balance and contract usage
- **Transaction**: An immutable record of a change to a client's balance or contract usage
- **ADD_Transaction**: A transaction that increases available contract resources
- **DEBT_Transaction**: A transaction that consumes contract resources or increases monetary debt
- **Contract_Usage**: The remaining quantities of maintenance visits, displacements, and assistance hours
- **Client_Debt**: The monetary amount owed by a client in euros
- **Payment_Method**: The method used to pay for a service (Contract, Garantia, or other)
- **Source_Content**: The originating content that triggered a transaction (contract, work sheet, remote assistance)
- **Atomic_Update**: An operation that updates both transaction record and balance index as a single unit

## Requirements

### Requirement 1: Balance Index Management

**User Story:** As a system administrator, I want to maintain accurate balance indexes for each client, so that I can track their current financial state and contract usage.

#### Acceptance Criteria

1. WHEN a client's first transaction is created, THE Balance_System SHALL create a balance index at `balance/{clientId}/index.json`
2. THE Balance_Index SHALL store the current debt amount as a non-negative number in euros
3. THE Balance_Index SHALL store contract usage with fields for maintenance visits, displacements, and assistance hours
4. WHEN a transaction is processed, THE Balance_System SHALL update the balance index atomically with the transaction creation
5. THE Balance_Index SHALL reflect the cumulative effect of all transactions for that client

### Requirement 2: Transaction Record Creation

**User Story:** As a financial auditor, I want immutable transaction records for all balance changes, so that I have a complete audit trail of financial operations.

#### Acceptance Criteria

1. WHEN a balance change occurs, THE Balance_System SHALL create a transaction record at `balance/{clientId}/transactions/{uuid}.json`
2. THE Transaction SHALL include a unique UUID identifier
3. THE Transaction SHALL reference the client ID
4. THE Transaction SHALL specify the transaction type as ADD or DEBT
5. THE Transaction SHALL identify the source type (contract, contract-renovation, work-sheet, remote-assistance)
6. THE Transaction SHALL reference the source content UUID
7. THE Transaction SHALL record the timestamp of creation
8. THE Transaction SHALL identify the user who triggered the transaction
9. THE Transaction SHALL describe the changes made to balance or contract usage
10. THE Transaction SHALL snapshot the balance state after the transaction
11. THE Transaction SHALL include metadata about the operation context
12. WHEN a transaction is created, THE Balance_System SHALL prevent any modifications to that transaction

### Requirement 3: ADD Transaction Processing

**User Story:** As a contract manager, I want contract creation and renovation to increase available resources, so that clients can use their contracted services.

#### Acceptance Criteria

1. WHEN a new contract is created, THE Balance_System SHALL create an ADD transaction
2. WHEN a contract is renewed, THE Balance_System SHALL create an ADD transaction
3. THE ADD_Transaction SHALL increase the contract usage limits for maintenance visits
4. THE ADD_Transaction SHALL increase the contract usage limits for displacements
5. THE ADD_Transaction SHALL increase the contract usage limits for assistance hours
6. THE ADD_Transaction SHALL extract resource quantities from the contract data
7. THE ADD_Transaction SHALL handle unlimited values (-1) appropriately

### Requirement 4: DEBT Transaction Processing for Work Sheets

**User Story:** As a service technician, I want work sheet creation to update client balances, so that resource consumption and debts are tracked accurately.

#### Acceptance Criteria

1. WHEN a work sheet is created with payment method "Contract", THE Balance_System SHALL create a DEBT transaction that decreases contract usage
2. WHEN a work sheet is created with payment method other than "Contract" or "Garantia", THE Balance_System SHALL create a DEBT transaction that increases client debt
3. THE DEBT_Transaction SHALL extract the euro value from work sheet data when adding debt
4. THE DEBT_Transaction SHALL extract resource consumption quantities from work sheet data when decreasing contract usage
5. WHEN payment method is "Garantia", THE Balance_System SHALL not create any transaction

### Requirement 5: DEBT Transaction Processing for Remote Assistance

**User Story:** As a support technician, I want remote assistance creation to update client balances, so that assistance hours and debts are tracked accurately.

#### Acceptance Criteria

1. WHEN remote assistance is created with payment method "Contract", THE Balance_System SHALL create a DEBT transaction that decreases contract assistance hours
2. WHEN remote assistance is created with payment method other than "Contract" or "Garantia", THE Balance_System SHALL create a DEBT transaction that increases client debt
3. THE DEBT_Transaction SHALL extract the euro value from remote assistance data when adding debt
4. THE DEBT_Transaction SHALL extract assistance hours from remote assistance data when decreasing contract usage
5. WHEN payment method is "Garantia", THE Balance_System SHALL not create any transaction

### Requirement 6: Balance Validation Rules

**User Story:** As a system administrator, I want balance validation to prevent invalid states, so that financial data remains consistent and accurate.

#### Acceptance Criteria

1. WHEN a DEBT transaction would make the balance negative, THE Balance_System SHALL reject the transaction
2. WHEN a DEBT transaction would make contract maintenance visits negative, THE Balance_System SHALL reject the transaction
3. WHEN a DEBT transaction would make contract displacements negative, THE Balance_System SHALL reject the transaction
4. WHEN a DEBT transaction would make contract assistance hours negative, THE Balance_System SHALL reject the transaction
5. WHEN validation fails, THE Balance_System SHALL return a descriptive error message
6. WHEN validation fails, THE Balance_System SHALL not create any transaction or modify the balance index

### Requirement 7: Concurrent Update Safety

**User Story:** As a system architect, I want concurrent balance updates to be handled safely, so that race conditions do not corrupt financial data.

#### Acceptance Criteria

1. WHEN multiple transactions are processed simultaneously for the same client, THE Balance_System SHALL serialize the updates
2. WHEN a transaction is being processed, THE Balance_System SHALL lock the balance index for that client
3. WHEN a transaction completes, THE Balance_System SHALL release the lock on the balance index
4. WHEN a lock cannot be acquired, THE Balance_System SHALL retry the operation with exponential backoff
5. WHEN retries are exhausted, THE Balance_System SHALL return an error without corrupting data

### Requirement 8: Balance Display in Client Detail View

**User Story:** As a user, I want to see client balance and contract usage on the client detail page, so that I can quickly assess their financial status.

#### Acceptance Criteria

1. WHEN viewing a client detail page, THE Balance_System SHALL display the current debt amount
2. WHEN viewing a client detail page, THE Balance_System SHALL display remaining maintenance visits
3. WHEN viewing a client detail page, THE Balance_System SHALL display remaining displacements
4. WHEN viewing a client detail page, THE Balance_System SHALL display remaining assistance hours
5. WHEN contract usage is low (below 20% of original), THE Balance_System SHALL display a warning indicator
6. WHEN a client has no balance record, THE Balance_System SHALL display zero values

### Requirement 9: Transaction History Display

**User Story:** As a financial manager, I want to view transaction history for a client, so that I can understand how their balance evolved over time.

#### Acceptance Criteria

1. WHEN viewing transaction history, THE Balance_System SHALL display all transactions for the client in reverse chronological order
2. WHEN viewing a transaction, THE Balance_System SHALL display the transaction type (ADD or DEBT)
3. WHEN viewing a transaction, THE Balance_System SHALL display the source type and link to source content
4. WHEN viewing a transaction, THE Balance_System SHALL display the changes made to balance or contract usage
5. WHEN viewing a transaction, THE Balance_System SHALL display the timestamp and user who created it
6. THE Balance_System SHALL support filtering transactions by type (ADD or DEBT)
7. THE Balance_System SHALL support filtering transactions by date range
8. THE Balance_System SHALL support pagination for large transaction histories

### Requirement 10: Contract Renovation Workflow

**User Story:** As a contract manager, I want to renovate contracts and recharge their usage limits, so that clients can continue using services.

#### Acceptance Criteria

1. WHEN a contract renovation is triggered, THE Balance_System SHALL create an ADD transaction
2. THE ADD_Transaction SHALL add the new contract period's resource quantities to existing balances
3. THE ADD_Transaction SHALL reference the contract UUID as the source
4. THE ADD_Transaction SHALL mark the source as "contract-renovation"
5. THE Balance_System SHALL allow contract renovation even when previous limits are not fully consumed

### Requirement 11: Transaction Immutability

**User Story:** As a compliance officer, I want transaction records to be immutable, so that financial audit trails cannot be tampered with.

#### Acceptance Criteria

1. WHEN a transaction is created, THE Balance_System SHALL prevent any updates to that transaction record
2. WHEN a transaction is created, THE Balance_System SHALL prevent deletion of that transaction record
3. IF a transaction needs correction, THE Balance_System SHALL require creation of a new compensating transaction
4. THE Balance_System SHALL maintain all transaction records indefinitely for audit purposes

### Requirement 12: Integration with Content Creation

**User Story:** As a developer, I want balance updates to integrate seamlessly with content creation, so that users don't need separate steps for financial tracking.

#### Acceptance Criteria

1. WHEN a contract is created, THE Balance_System SHALL automatically trigger balance processing
2. WHEN a work sheet is created, THE Balance_System SHALL automatically trigger balance processing
3. WHEN remote assistance is created, THE Balance_System SHALL automatically trigger balance processing
4. WHEN balance processing fails, THE Balance_System SHALL log the error but not prevent content creation
5. THE Balance_System SHALL process balance updates asynchronously to avoid blocking content creation
6. THE Balance_System SHALL provide status indicators for pending balance updates

### Requirement 13: Error Handling and Recovery

**User Story:** As a system administrator, I want robust error handling for balance operations, so that temporary failures don't result in data loss.

#### Acceptance Criteria

1. WHEN a balance update fails, THE Balance_System SHALL log detailed error information
2. WHEN a balance update fails, THE Balance_System SHALL preserve the previous balance state
3. WHEN a balance update fails due to network issues, THE Balance_System SHALL retry the operation
4. WHEN a balance update fails due to validation, THE Balance_System SHALL not retry and SHALL return an error
5. THE Balance_System SHALL provide an administrative interface to manually retry failed balance updates
6. THE Balance_System SHALL track failed balance updates for monitoring and alerting

### Requirement 14: Performance Optimization

**User Story:** As a system architect, I want balance operations to be performant, so that high-frequency content creation (work sheets, remote assistance) is not slowed down.

#### Acceptance Criteria

1. WHEN processing a balance update, THE Balance_System SHALL complete within 500ms for 95% of operations
2. THE Balance_System SHALL use efficient R2 operations to minimize latency
3. THE Balance_System SHALL batch multiple balance reads when displaying lists
4. THE Balance_System SHALL cache balance indexes for short durations (30 seconds) to reduce R2 reads
5. WHEN cache is used, THE Balance_System SHALL invalidate cache after balance updates

### Requirement 15: Balance Reporting

**User Story:** As a financial manager, I want to generate balance reports, so that I can analyze client financial status across the organization.

#### Acceptance Criteria

1. THE Balance_System SHALL provide an API endpoint to retrieve all client balances
2. THE Balance_System SHALL support filtering balances by debt amount (e.g., clients with debt > €100)
3. THE Balance_System SHALL support filtering balances by low contract usage (e.g., < 20% remaining)
4. THE Balance_System SHALL provide summary statistics (total debt, average debt, clients with debt)
5. THE Balance_System SHALL support exporting balance data to CSV format
