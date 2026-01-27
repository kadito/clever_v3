# Implementation Plan: Cliente Balance System

## Overview

This implementation plan breaks down the Cliente Balance System into discrete coding tasks that build incrementally. The system is implemented as a specialized financial tracking subsystem with R2 storage, transaction processing, and frontend display components.

The implementation follows a bottom-up approach: core data structures and utilities first, then service layer, then middleware integration, and finally frontend components.

## Tasks

- [x] 1. Set up balance system core types and interfaces
  - Create `packages/shared/src/balance-types.ts` with all TypeScript interfaces
  - Define BalanceIndex, BalanceTransaction, TransactionChanges, ContractUsage interfaces
  - Define BalanceError, ValidationResult, QueryOptions interfaces
  - Export all types from shared package index
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_

- [x] 2. Implement balance calculation utilities
  - [x] 2.1 Create `packages/shared/src/balance-utils.ts` with calculation functions
    - Implement `calculateBalanceFromTransactions()` function
    - Implement `applyTransactionToBalance()` function
    - Implement `validateTransactionAgainstBalance()` function
    - Handle unlimited values (-1) correctly in calculations
    - _Requirements: 1.5, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 2.2 Write property test for balance calculation consistency
    - **Property 2: Balance Calculation Consistency**
    - **Validates: Requirements 1.5**

  - [ ]* 2.3 Write property test for validation preventing negative balances
    - **Property 7: Validation Prevents Negative Balances**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

- [x] 3. Implement transaction extraction logic
  - [x] 3.1 Create `packages/shared/src/balance-extraction.ts` with extraction functions
    - Implement `extractContractAddTransaction()` for contracts
    - Implement `extractWorkSheetDebtTransaction()` for work sheets
    - Implement `extractRemoteAssistanceDebtTransaction()` for remote assistance
    - Handle both CPA and S&H contract sections
    - Handle payment method logic (Contract, Garantia, other)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 3.2 Write property test for ADD transaction resource increase
    - **Property 5: ADD Transaction Resource Increase**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

  - [ ]* 3.3 Write property test for payment method determining transaction type
    - **Property 6: Payment Method Determines Transaction Type**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5**

  - [ ]* 3.4 Write unit tests for extraction edge cases
    - Test contract with only CPA section
    - Test contract with only S&H section
    - Test contract with both sections
    - Test work sheet with Garantia payment method
    - Test remote assistance with Contract payment method
    - _Requirements: 3.1, 4.1, 5.1_

- [x] 4. Implement balance service core
  - [x] 4.1 Create `packages/backend/src/services/balance-service.ts`
    - Implement `getBalance()` to read balance index from R2
    - Implement `getTransactionHistory()` to read transactions from R2
    - Implement `writeTransaction()` to write transaction to R2
    - Implement `writeBalanceIndex()` to write balance index to R2
    - Handle R2 key patterns: `balance/{clientId}/index.json` and `balance/{clientId}/transactions/{uuid}.json`
    - _Requirements: 1.1, 2.1, 2.12_

  - [x] 4.2 Implement transaction creation methods
    - Implement `createAddTransaction()` for contract transactions
    - Implement `createDebtTransaction()` for work sheet and remote assistance transactions
    - Generate UUIDs for transactions
    - Extract user context from authentication
    - Create transaction metadata
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 3.1, 4.1, 5.1_

  - [ ]* 4.3 Write property test for transaction record completeness
    - **Property 3: Transaction Record Completeness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11**

- [x] 5. Implement concurrent update handling
  - [x] 5.1 Add optimistic locking to balance service
    - Implement `updateBalanceWithTransaction()` with version checking
    - Implement `writeBalanceWithVersionCheck()` for atomic updates
    - Add retry logic with exponential backoff
    - Handle version conflicts
    - Distinguish validation errors from system errors
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 5.2 Write unit tests for concurrent update scenarios
    - Test version conflict detection
    - Test retry with exponential backoff
    - Test validation error handling (no retry)
    - Test system error handling (retry)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6. Checkpoint - Ensure core balance service works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement balance middleware hooks
  - [x] 7.1 Create `packages/backend/src/middleware/balance-middleware.ts`
    - Implement `onContractCreated()` hook
    - Implement `onContractUpdated()` hook for renovations
    - Implement `onWorkSheetCreated()` hook
    - Implement `onRemoteAssistanceCreated()` hook
    - Extract relevant data from content and call balance service
    - Handle errors without blocking content creation
    - Log all balance operations with structured logging
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 7.2 Detect contract renovations in update hook
    - Compare previous and current contract data
    - Identify when contract period is extended
    - Create ADD transaction for renovation
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 7.3 Write property test for contract renovation accumulation
    - **Property 8: Contract Renovation Accumulation**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

- [x] 8. Integrate middleware with content routes
  - [x] 8.1 Update contract routes to call balance middleware
    - Add balance middleware call after contract creation
    - Add balance middleware call after contract update
    - Handle async processing
    - _Requirements: 12.1, 12.2_

  - [x] 8.2 Update work sheet routes to call balance middleware
    - Add balance middleware call after work sheet creation
    - Handle async processing
    - _Requirements: 12.3_

  - [x] 8.3 Update remote assistance routes to call balance middleware
    - Add balance middleware call after remote assistance creation
    - Handle async processing
    - _Requirements: 12.4_

- [x] 9. Implement balance API endpoints
  - [x] 9.1 Create `packages/backend/src/routes/balance-routes.ts`
    - Implement `GET /api/balance/:clientId` to get balance index
    - Implement `GET /api/balance/:clientId/transactions` to get transaction history
    - Implement `GET /api/balance/report` for balance reporting (admin only)
    - Add query parameter support for filtering and pagination
    - Add authentication and authorization checks
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5, 15.1, 15.2, 15.3, 15.4_

  - [ ]* 9.2 Write property test for transaction history filtering correctness
    - **Property 10: Transaction History Filtering Correctness**
    - **Validates: Requirements 9.6, 9.7, 15.2, 15.3**

  - [ ]* 9.3 Write property test for balance reporting aggregation accuracy
    - **Property 11: Balance Reporting Aggregation Accuracy**
    - **Validates: Requirements 15.4**

- [x] 10. Checkpoint - Ensure backend integration works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement balance display component
  - [x] 11.1 Create `packages/frontend/src/components/balance/ClientBalanceDisplay.vue`
    - Display current debt amount in euros
    - Display remaining maintenance visits
    - Display remaining displacements
    - Display remaining assistance hours
    - Show warning indicators when usage is low (< 20%)
    - Handle loading and error states
    - Use Portuguese labels throughout
    - Apply mobile-first responsive design
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 11.2 Write property test for low usage warning threshold
    - **Property 9: Low Usage Warning Threshold**
    - **Validates: Requirements 8.5**

  - [ ]* 11.3 Write unit tests for balance display component
    - Test display with zero balance
    - Test display with debt
    - Test display with low contract usage
    - Test warning indicator visibility
    - Test Portuguese labels
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 12. Implement transaction history component
  - [x] 12.1 Create `packages/frontend/src/components/balance/TransactionHistoryDisplay.vue`
    - Display transactions in reverse chronological order
    - Show transaction type (ADD or DEBT)
    - Show source type and link to source content
    - Show changes to balance and contract usage
    - Show timestamp and user who created transaction
    - Implement filtering by type (ADD or DEBT)
    - Implement filtering by date range
    - Implement pagination
    - Use Portuguese labels throughout
    - Apply mobile-first responsive design
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [ ]* 12.2 Write unit tests for transaction history component
    - Test transaction display
    - Test filtering by type
    - Test filtering by date range
    - Test pagination
    - Test Portuguese labels
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [x] 13. Integrate balance display into client detail view
  - [x] 13.1 Update `packages/frontend/src/views/clients/ClientsDetailView.vue`
    - Add ClientBalanceDisplay component to client detail view
    - Position balance section prominently (after basic info)
    - Add link to transaction history view
    - Handle loading and error states
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 13.2 Create transaction history view route
    - Create `packages/frontend/src/views/balance/TransactionHistoryView.vue`
    - Add route to router configuration
    - Link from client detail view
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [x] 14. Implement error handling and recovery
  - [x] 14.1 Create failed transaction tracking
    - Create `packages/backend/src/services/failed-transaction-service.ts`
    - Track failed balance updates with error details
    - Implement retry mechanism for failed transactions
    - Provide administrative interface to view and retry failed transactions
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [ ]* 14.2 Write property test for error preservation of previous state
    - **Property 12: Error Preservation of Previous State**
    - **Validates: Requirements 13.2**

  - [ ]* 14.3 Write unit tests for error handling
    - Test validation error handling
    - Test system error handling
    - Test retry logic
    - Test failed transaction tracking
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [x] 15. Implement caching for performance
  - [x] 15.1 Create balance cache implementation
    - Create `packages/backend/src/services/balance-cache.ts`
    - Implement in-memory cache with TTL (30 seconds)
    - Implement cache invalidation on balance updates
    - Add cache hit/miss metrics
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 15.2 Integrate caching into balance service
    - Use cache for balance index reads
    - Invalidate cache after transaction creation
    - Add cache warming for frequently accessed balances
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 16. Implement balance reporting features
  - [x] 16.1 Create balance reporting service
    - Create `packages/backend/src/services/balance-reporting-service.ts`
    - Implement `getAllBalances()` to retrieve all client balances
    - Implement filtering by debt amount
    - Implement filtering by low contract usage
    - Calculate summary statistics (total debt, average debt, count)
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [x] 16.2 Create balance reporting view (admin only)
    - Create `packages/frontend/src/views/balance/BalanceReportView.vue`
    - Display summary statistics
    - Display list of clients with filters
    - Support CSV export
    - Restrict to admin users only
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 17. Implement transaction immutability enforcement
  - [x] 17.1 Add immutability checks to balance service
    - Prevent transaction updates (throw error if attempted)
    - Prevent transaction deletions (throw error if attempted)
    - Document compensating transaction pattern for corrections
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 17.2 Write property test for transaction immutability
    - **Property 4: Transaction Immutability**
    - **Validates: Requirements 2.12, 11.1, 11.2, 11.3**

- [x] 18. Add administrative recalculation feature
  - [x] 18.1 Implement balance recalculation
    - Add `recalculateBalance()` method to balance service
    - Read all transactions for a client
    - Recalculate balance from scratch
    - Update balance index with recalculated values
    - Log recalculation operations
    - _Requirements: 1.5, 13.5_

  - [x] 18.2 Create admin interface for recalculation
    - Add recalculation button to client detail view (admin only)
    - Show confirmation dialog before recalculation
    - Display recalculation results
    - _Requirements: 1.5, 13.5_

- [x] 19. Checkpoint - Ensure complete system works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Historical data migration preparation
  - [ ] 20.1 Create migration script for existing contracts
    - Create `packages/backend/src/migrations/migrate-contracts-to-balance.ts`
    - Read all existing contracts from R2
    - Create ADD transactions for each contract
    - Verify balance calculations
    - _Requirements: 3.1, 3.2_

  - [ ] 20.2 Create migration script for existing work sheets
    - Create `packages/backend/src/migrations/migrate-work-sheets-to-balance.ts`
    - Read all existing work sheets from R2
    - Create DEBT transactions based on payment method
    - Verify balance calculations
    - _Requirements: 4.1, 4.2_

  - [ ] 20.3 Create migration script for existing remote assistance
    - Create `packages/backend/src/migrations/migrate-remote-assistance-to-balance.ts`
    - Read all existing remote assistance from R2
    - Create DEBT transactions based on payment method
    - Verify balance calculations
    - _Requirements: 5.1, 5.2_

  - [ ]* 20.4 Write unit tests for migration scripts
    - Test contract migration
    - Test work sheet migration
    - Test remote assistance migration
    - Test balance verification
    - _Requirements: 3.1, 4.1, 5.1_

- [x] 21. Final integration and wiring
  - [x] 21.1 Wire all components together
    - Ensure middleware hooks are enabled
    - Ensure API routes are registered
    - Ensure frontend components are integrated
    - Ensure caching is active
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 21.2 Add comprehensive logging
    - Log all balance operations with structured data
    - Log all errors with context
    - Log performance metrics
    - _Requirements: 13.1, 14.1, 14.2_

  - [ ]* 21.3 Write integration tests
    - Test end-to-end contract creation with balance update
    - Test end-to-end work sheet creation with balance update
    - Test end-to-end remote assistance creation with balance update
    - Test concurrent balance updates
    - _Requirements: 12.1, 12.2, 12.3, 7.1, 7.2_

- [x] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The system is designed to be deployed incrementally (infrastructure → migration → live integration)
- Historical data migration is a separate phase that can be executed after live integration
- All Portuguese labels and error messages must be validated during implementation
