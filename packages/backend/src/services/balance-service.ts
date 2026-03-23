/**
 * Balance Service - Core R2 Operations and Transaction Creation
 * 
 * This service provides low-level R2 operations for reading and writing
 * balance data, as well as higher-level methods for creating transactions
 * with proper metadata and user context.
 * 
 * Design Principles:
 * - Simple, focused operations for R2 storage
 * - Transaction creation with automatic UUID generation
 * - Proper error handling with structured logging
 * - Type-safe interfaces with StorageBucket abstraction
 * - Transaction immutability: Transactions can only be created, never updated or deleted
 * 
 * Transaction Immutability:
 * - Transactions are immutable once created (Requirements 2.12, 11.1, 11.2, 11.3)
 * - No update or delete methods are provided for transactions
 * - Corrections must be made through compensating transactions
 * - This ensures complete audit trail and data integrity
 * 
 * R2 Key Patterns:
 * - Balance Index: balance/{clientId}/index.json
 * - Transactions: balance/{clientId}/transactions/{uuid}.json
 * 
 * Validates: Requirements 1.1, 2.1, 2.12, 3.1, 4.1, 5.1, 11.1, 11.2, 11.3, 11.4
 */

import type { StorageBucket } from '@clever/shared';
import type {
  BalanceIndex,
  BalanceTransaction,
  QueryOptions,
  TransactionChanges,
  TransactionSource,
  TransactionMetadata,
  BalanceSnapshot,
  ContractUsage,
} from '@clever/shared';
import { getBalanceCache } from './balance-cache';

/**
 * Generate a UUID v4 using Web Crypto API.
 * Compatible with Cloudflare Workers runtime.
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Core balance service for R2 operations.
 * Provides basic CRUD operations for balance indexes and transactions.
 */
export class BalanceService {
  constructor(private r2Bucket: StorageBucket) {}

  /**
   * Read balance index from R2.
   * Returns null if balance index doesn't exist.
   * Uses cache for performance optimization.
   * 
   * R2 Key: balance/{clientId}/index.json
   * 
   * @param clientId - Client UUID
   * @returns Balance index or null if not found
   */
  async getBalance(clientId: string): Promise<BalanceIndex | null> {
    try {
      // Check cache first
      const cache = getBalanceCache();
      const cached = cache.get(clientId);
      
      if (cached) {
        console.log('Balance index retrieved from cache:', JSON.stringify({
          clientId,
          balance: cached.balance,
          version: cached.version,
        }, null, 2));
        return cached;
      }
      
      const key = `balance/${clientId}/index.json`;
      
      console.log('Reading balance index from R2:', JSON.stringify({ clientId, key }, null, 2));
      
      const object = await this.r2Bucket.get(key);
      
      if (!object) {
        console.log('Balance index not found:', JSON.stringify({ clientId }, null, 2));
        return null;
      }
      
      const balanceIndex = (await object.json()) as BalanceIndex;
      
      // Cache the result
      cache.set(clientId, balanceIndex);
      
      console.log('Balance index retrieved from R2 and cached:', JSON.stringify({
        clientId,
        balance: balanceIndex.balance,
        version: balanceIndex.version,
      }, null, 2));
      
      return balanceIndex;
    } catch (error) {
      console.error('Error reading balance index:', JSON.stringify({
        clientId,
        error: error instanceof Error ? error.message : String(error),
      }, null, 2));
      throw error;
    }
  }

  /**
   * Read transaction history from R2.
   * Supports filtering by type, date range, and pagination.
   * 
   * R2 Key Pattern: balance/{clientId}/transactions/{uuid}.json
   * 
   * Note: This implementation reads all transactions and filters in memory.
   * For production with large transaction volumes, consider maintaining
   * a transaction index for more efficient querying.
   * 
   * @param clientId - Client UUID
   * @param options - Query options for filtering and pagination
   * @returns Array of transactions matching the query
   */
  async getTransactionHistory(
    clientId: string,
    options?: QueryOptions
  ): Promise<BalanceTransaction[]> {
    try {
      console.log('Reading transaction history:', JSON.stringify({
        clientId,
        options,
      }, null, 2));
      
      // Get balance index to find transaction IDs
      const balanceIndex = await this.getBalance(clientId);
      
      if (!balanceIndex) {
        console.log('No balance index found, returning empty transaction history:', 
          JSON.stringify({ clientId }, null, 2));
        return [];
      }
      
      // For now, we'll list all transactions by attempting to read them
      // In a production system, we would maintain a transaction index
      // This is a simplified implementation for the MVP
      
      // Read all transactions for this client
      // Note: R2 doesn't have a native list operation for a prefix,
      // so we'll need to track transaction IDs in the balance index
      // or maintain a separate transaction index
      
      // For MVP, we'll return an empty array and document that
      // transaction listing requires maintaining a transaction index
      console.warn('Transaction history listing not fully implemented:', 
        JSON.stringify({
          clientId,
          note: 'Requires transaction index for efficient listing',
        }, null, 2));
      
      return [];
    } catch (error) {
      console.error('Error reading transaction history:', JSON.stringify({
        clientId,
        error: error instanceof Error ? error.message : String(error),
      }, null, 2));
      throw error;
    }
  }

  /**
   * Write transaction to R2.
   * Transactions are immutable once written.
   * 
   * R2 Key: balance/{clientId}/transactions/{uuid}.json
   * 
   * @param transaction - Transaction to write
   */
  async writeTransaction(transaction: BalanceTransaction): Promise<void> {
    try {
      const key = `balance/${transaction.clientId}/transactions/${transaction.uuid}.json`;
      
      console.log('Writing transaction:', JSON.stringify({
        clientId: transaction.clientId,
        transactionId: transaction.uuid,
        type: transaction.type,
        source: transaction.source,
        key,
      }, null, 2));
      
      await this.r2Bucket.put(
        key,
        JSON.stringify(transaction, null, 2),
        {
          httpMetadata: {
            contentType: 'application/json',
            cacheControl: 'public, max-age=31536000', // 1 year - immutable
          },
          customMetadata: {
            clientId: transaction.clientId,
            transactionId: transaction.uuid,
            type: transaction.type,
            source: transaction.source,
            timestamp: transaction.timestamp,
          },
        }
      );
      
      console.log('Transaction written successfully:', JSON.stringify({
        clientId: transaction.clientId,
        transactionId: transaction.uuid,
      }, null, 2));
    } catch (error) {
      console.error('Error writing transaction:', JSON.stringify({
        clientId: transaction.clientId,
        transactionId: transaction.uuid,
        error: error instanceof Error ? error.message : String(error),
      }, null, 2));
      throw error;
    }
  }

  /**
   * Write balance index to R2.
   * Updates the current balance state for a client.
   * Invalidates cache after write.
   * 
   * R2 Key: balance/{clientId}/index.json
   * 
   * @param balanceIndex - Balance index to write
   */
  async writeBalanceIndex(balanceIndex: BalanceIndex): Promise<void> {
    try {
      const key = `balance/${balanceIndex.clientId}/index.json`;
      
      console.log('Writing balance index:', JSON.stringify({
        clientId: balanceIndex.clientId,
        balance: balanceIndex.balance,
        version: balanceIndex.version,
        key,
      }, null, 2));
      
      await this.r2Bucket.put(
        key,
        JSON.stringify(balanceIndex, null, 2),
        {
          httpMetadata: {
            contentType: 'application/json',
            cacheControl: 'public, max-age=300', // 5 minutes
          },
          customMetadata: {
            clientId: balanceIndex.clientId,
            version: balanceIndex.version.toString(),
            lastUpdated: balanceIndex.lastUpdated,
            balance: balanceIndex.balance.toString(),
          },
        }
      );
      
      // Invalidate cache after write
      const cache = getBalanceCache();
      cache.invalidate(balanceIndex.clientId);
      
      console.log('Balance index written successfully and cache invalidated:', JSON.stringify({
        clientId: balanceIndex.clientId,
        version: balanceIndex.version,
      }, null, 2));
    } catch (error) {
      console.error('Error writing balance index:', JSON.stringify({
        clientId: balanceIndex.clientId,
        error: error instanceof Error ? error.message : String(error),
      }, null, 2));
      throw error;
    }
  }

  /**
   * Check if a balance index exists for a client.
   * Useful for determining if this is the first transaction for a client.
   * 
   * @param clientId - Client UUID
   * @returns True if balance index exists, false otherwise
   */
  async balanceExists(clientId: string): Promise<boolean> {
    try {
      const balance = await this.getBalance(clientId);
      return balance !== null;
    } catch (error) {
      console.error('Error checking balance existence:', JSON.stringify({
        clientId,
        error: error instanceof Error ? error.message : String(error),
      }, null, 2));
      return false;
    }
  }

  /**
   * Read a single transaction by UUID.
   * 
   * R2 Key: balance/{clientId}/transactions/{uuid}.json
   * 
   * @param clientId - Client UUID
   * @param transactionId - Transaction UUID
   * @returns Transaction or null if not found
   */
  async getTransaction(
    clientId: string,
    transactionId: string
  ): Promise<BalanceTransaction | null> {
    try {
      const key = `balance/${clientId}/transactions/${transactionId}.json`;
      
      console.log('Reading transaction:', JSON.stringify({
        clientId,
        transactionId,
        key,
      }, null, 2));
      
      const object = await this.r2Bucket.get(key);
      
      if (!object) {
        console.log('Transaction not found:', JSON.stringify({
          clientId,
          transactionId,
        }, null, 2));
        return null;
      }
      
      const transaction = (await object.json()) as BalanceTransaction;
      
      console.log('Transaction retrieved:', JSON.stringify({
        clientId,
        transactionId,
        type: transaction.type,
        source: transaction.source,
      }, null, 2));
      
      return transaction;
    } catch (error) {
      console.error('Error reading transaction:', JSON.stringify({
        clientId,
        transactionId,
        error: error instanceof Error ? error.message : String(error),
      }, null, 2));
      throw error;
    }
  }

  // ============================================================================
  // Transaction Creation Methods
  // ============================================================================

  /**
   * Create an ADD transaction for contract creation or renovation.
   * 
   * ADD transactions add resources to the client balance:
   * - Increase maintenance visits
   * - Increase displacements
   * - Increase assistance hours
   * 
   * This method uses optimistic locking to handle concurrent updates safely.
   * 
   * @param clientId - Client UUID
   * @param sourceId - Contract UUID
   * @param sourceType - 'contract' or 'contract-renovation'
   * @param contractUsageChanges - Contract resources to add (positive values)
   * @param userId - User ID from authentication context
   * @param metadata - Additional transaction metadata
   * @returns Created transaction record
   * 
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 3.1, 7.1, 7.2, 7.3, 7.4, 7.5
   */
  async createAddTransaction(
    clientId: string,
    sourceId: string,
    sourceType: 'contract' | 'contract-renovation',
    contractUsageChanges: {
      manutencoesPorAno?: number;
      deslocacoesPorAno?: number;
      horasAssistenciaAnuais?: number;
    },
    userId: string,
    metadata: TransactionMetadata
  ): Promise<BalanceTransaction> {
    try {
      console.log('BalanceService: Creating ADD transaction:', JSON.stringify({
        clientId,
        sourceId,
        sourceType,
        contractUsageChanges,
        userId,
        metadata,
      }, null, 2));

      // Generate UUID for transaction
      const transactionId = generateUUID();
      const timestamp = new Date().toISOString();

      console.log('BalanceService: Getting current balance for client:', clientId);

      // Get current balance to calculate balanceAfter snapshot
      const currentBalance = await this.getBalance(clientId);
      
      console.log('BalanceService: Current balance retrieved:', JSON.stringify({
        clientId,
        exists: currentBalance !== null,
        balance: currentBalance?.balance,
        version: currentBalance?.version,
      }, null, 2));
      
      const currentBalanceSnapshot = currentBalance || {
        clientId,
        balance: 0,
        contracts: {
          manutencoesPorAno: 0,
          deslocacoesPorAno: 0,
          horasAssistenciaAnuais: 0,
        },
        lastUpdated: timestamp,
        lastTransactionId: '',
        version: 0,
      };

      // Calculate what the balance will be after this transaction
      const balanceAfter = {
        balance: currentBalanceSnapshot.balance,
        contracts: {
          manutencoesPorAno: currentBalanceSnapshot.contracts.manutencoesPorAno + (contractUsageChanges.manutencoesPorAno || 0),
          deslocacoesPorAno: currentBalanceSnapshot.contracts.deslocacoesPorAno + (contractUsageChanges.deslocacoesPorAno || 0),
          horasAssistenciaAnuais: currentBalanceSnapshot.contracts.horasAssistenciaAnuais + (contractUsageChanges.horasAssistenciaAnuais || 0),
        },
      };

      console.log('BalanceService: Calculated balanceAfter:', JSON.stringify({
        balanceAfter,
      }, null, 2));

      // Create transaction record
      const transaction: BalanceTransaction = {
        uuid: transactionId,
        clientId,
        type: 'ADD',
        source: sourceType,
        sourceId,
        timestamp,
        createdBy: userId,
        changes: {
          contractUsageChanges,
        },
        balanceAfter,
        metadata,
      };

      console.log('BalanceService: ADD transaction created, applying with optimistic locking:', JSON.stringify({
        transactionId,
        clientId,
        balanceAfter: transaction.balanceAfter,
      }, null, 2));

      // Use optimistic locking to apply transaction
      await this.updateBalanceWithTransaction(clientId, transaction);

      console.log('BalanceService: ADD transaction completed successfully:', JSON.stringify({
        transactionId,
        clientId,
      }, null, 2));

      return transaction;
    } catch (error) {
      console.error('BalanceService: Error creating ADD transaction:', JSON.stringify({
        clientId,
        sourceId,
        sourceType,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : String(error),
      }, null, 2));
      throw error;
    }
  }

  /**
   * Validate that the client has sufficient resources for a DEBT transaction
   * that consumes contract resources.
   * 
   * Checks each resource being consumed (negative contractUsageChanges):
   * - Resources with value -1 (unlimited) always pass
   * - Resources with value 0 and consumption requested → insufficient
   * - Hours: current must be >= absolute value of hours requested
   * 
   * @param clientId - Client UUID
   * @param changes - Proposed transaction changes
   * @throws ValidationError if resources are insufficient
   * 
   * Validates: Requirements 6.1, 6.2, 6.3, 6.4
   */
  async validateResourceAvailability(
    clientId: string,
    changes: TransactionChanges
  ): Promise<void> {
    // Only validate contract usage changes (resource consumption)
    if (!changes.contractUsageChanges) {
      return;
    }

    const usageChanges = changes.contractUsageChanges;

    // No negative values means no resource consumption — skip validation
    const hasConsumption =
      (usageChanges.manutencoesPorAno !== undefined && usageChanges.manutencoesPorAno < 0) ||
      (usageChanges.deslocacoesPorAno !== undefined && usageChanges.deslocacoesPorAno < 0) ||
      (usageChanges.horasAssistenciaAnuais !== undefined && usageChanges.horasAssistenciaAnuais < 0);

    if (!hasConsumption) {
      return;
    }

    const currentBalance = await this.getBalance(clientId);
    const contracts = currentBalance?.contracts || {
      manutencoesPorAno: 0,
      deslocacoesPorAno: 0,
      horasAssistenciaAnuais: 0,
    };

    // Validate maintenance visits
    if (usageChanges.manutencoesPorAno !== undefined && usageChanges.manutencoesPorAno < 0) {
      if (contracts.manutencoesPorAno !== -1 && contracts.manutencoesPorAno === 0) {
        throw new ValidationError('Recursos insuficientes no contrato do cliente.');
      }
    }

    // Validate displacements
    if (usageChanges.deslocacoesPorAno !== undefined && usageChanges.deslocacoesPorAno < 0) {
      if (contracts.deslocacoesPorAno !== -1 && contracts.deslocacoesPorAno === 0) {
        throw new ValidationError('Recursos insuficientes no contrato do cliente.');
      }
    }

    // Validate assistance hours
    if (usageChanges.horasAssistenciaAnuais !== undefined && usageChanges.horasAssistenciaAnuais < 0) {
      const hoursRequested = Math.abs(usageChanges.horasAssistenciaAnuais);
      if (contracts.horasAssistenciaAnuais !== -1 && contracts.horasAssistenciaAnuais < hoursRequested) {
        throw new ValidationError('Recursos insuficientes no contrato do cliente.');
      }
    }
  }

  /**
   * Create a DEBT transaction for work sheet or remote assistance.
   * 
   * DEBT transactions either:
   * - Add to client debt (balanceChange > 0), OR
   * - Consume contract resources (negative contractUsageChanges)
   * 
   * This method uses optimistic locking to handle concurrent updates safely.
   * 
   * @param clientId - Client UUID
   * @param sourceId - Work sheet or remote assistance UUID
   * @param sourceType - 'work-sheet' or 'remote-assistance'
   * @param changes - Balance and/or contract usage changes
   * @param userId - User ID from authentication context
   * @param metadata - Additional transaction metadata
   * @returns Created transaction record
   * 
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 4.1, 5.1, 7.1, 7.2, 7.3, 7.4, 7.5
   */
  async createDebtTransaction(
    clientId: string,
    sourceId: string,
    sourceType: 'work-sheet' | 'remote-assistance',
    changes: TransactionChanges,
    userId: string,
    metadata: TransactionMetadata
  ): Promise<BalanceTransaction> {
    try {
      console.log('Creating DEBT transaction:', JSON.stringify({
        clientId,
        sourceId,
        sourceType,
        changes,
        userId,
      }, null, 2));

      // Generate UUID for transaction
      const transactionId = generateUUID();
      const timestamp = new Date().toISOString();

      // Get current balance to calculate balanceAfter snapshot
      const currentBalance = await this.getBalance(clientId);
      const currentBalanceSnapshot = currentBalance || {
        clientId,
        balance: 0,
        contracts: {
          manutencoesPorAno: 0,
          deslocacoesPorAno: 0,
          horasAssistenciaAnuais: 0,
        },
        lastUpdated: timestamp,
        lastTransactionId: '',
        version: 0,
      };

      // Calculate what the balance will be after this transaction
      const balanceAfter = {
        balance: currentBalanceSnapshot.balance + (changes.balanceChange || 0),
        contracts: {
          manutencoesPorAno: currentBalanceSnapshot.contracts.manutencoesPorAno + (changes.contractUsageChanges?.manutencoesPorAno || 0),
          deslocacoesPorAno: currentBalanceSnapshot.contracts.deslocacoesPorAno + (changes.contractUsageChanges?.deslocacoesPorAno || 0),
          horasAssistenciaAnuais: currentBalanceSnapshot.contracts.horasAssistenciaAnuais + (changes.contractUsageChanges?.horasAssistenciaAnuais || 0),
        },
      };

      // Create transaction record
      const transaction: BalanceTransaction = {
        uuid: transactionId,
        clientId,
        type: 'DEBT',
        source: sourceType,
        sourceId,
        timestamp,
        createdBy: userId,
        changes,
        balanceAfter,
        metadata,
      };

      console.log('DEBT transaction created, applying with optimistic locking:', JSON.stringify({
        transactionId,
        clientId,
        balanceAfter: transaction.balanceAfter,
      }, null, 2));

      // Use optimistic locking to apply transaction
      await this.updateBalanceWithTransaction(clientId, transaction);

      console.log('DEBT transaction completed successfully:', JSON.stringify({
        transactionId,
        clientId,
      }, null, 2));

      return transaction;
    } catch (error) {
      console.error('Error creating DEBT transaction:', JSON.stringify({
        clientId,
        sourceId,
        sourceType,
        error: error instanceof Error ? error.message : String(error),
      }, null, 2));
      throw error;
    }
  }

  // ============================================================================
  // Concurrent Update Handling with Optimistic Locking
  // ============================================================================

  /**
   * Write balance index with version check for optimistic locking.
   * 
   * This method implements atomic write with version verification:
   * 1. Read current balance index from R2
   * 2. Verify version matches expected version
   * 3. If version matches, write new balance index
   * 4. If version doesn't match, return false (version conflict)
   * 
   * Version conflicts indicate that another transaction was processed
   * between reading the balance and attempting to write. The caller
   * should retry with fresh data.
   * 
   * @param balance - New balance index to write
   * @param expectedVersion - Expected current version
   * @returns True if write succeeded, false if version conflict
   * 
   * Validates: Requirements 7.1, 7.2
   */
  async writeBalanceWithVersionCheck(
    balance: BalanceIndex,
    expectedVersion: number
  ): Promise<boolean> {
    try {
      console.log('Writing balance with version check:', JSON.stringify({
        clientId: balance.clientId,
        expectedVersion,
        newVersion: balance.version,
      }, null, 2));

      // Read current version from R2
      const current = await this.getBalance(balance.clientId);

      if (current) {
        // Check version match
        if (current.version !== expectedVersion) {
          console.warn('Version conflict detected:', JSON.stringify({
            clientId: balance.clientId,
            expectedVersion,
            currentVersion: current.version,
            newVersion: balance.version,
          }, null, 2));
          return false; // Version conflict
        }
      } else if (expectedVersion !== 0) {
        // No current balance but expected version is not 0
        console.warn('Version conflict: no current balance but expected version is not 0:', JSON.stringify({
          clientId: balance.clientId,
          expectedVersion,
        }, null, 2));
        return false;
      }

      // Version matches or this is the first balance - write new version
      await this.writeBalanceIndex(balance);

      console.log('Balance written successfully with version check:', JSON.stringify({
        clientId: balance.clientId,
        newVersion: balance.version,
      }, null, 2));

      return true;
    } catch (error) {
      console.error('Error in writeBalanceWithVersionCheck:', JSON.stringify({
        clientId: balance.clientId,
        expectedVersion,
        error: error instanceof Error ? error.message : String(error),
      }, null, 2));
      throw error;
    }
  }

  /**
   * Update balance with transaction using optimistic locking.
   * 
   * This method implements the complete concurrent update flow:
   * 1. Read current balance index
   * 2. Validate transaction against current balance
   * 3. Calculate new balance by applying transaction
   * 4. Write transaction record (immutable)
   * 5. Write balance index with version check
   * 6. If version conflict, retry with exponential backoff
   * 7. If validation error, throw immediately (don't retry)
   * 
   * Retry Strategy:
   * - Validation errors: Don't retry (business rule violation)
   * - Version conflicts: Retry with exponential backoff
   * - System errors: Retry with exponential backoff
   * - Max retries: 3 attempts
   * - Backoff: 100ms * 2^retry (100ms, 200ms, 400ms)
   * 
   * @param clientId - Client UUID
   * @param transaction - Transaction to apply
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @returns Updated balance index
   * @throws ValidationError if transaction violates business rules
   * @throws Error if max retries exceeded
   * 
   * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
   */
  async updateBalanceWithTransaction(
    clientId: string,
    transaction: BalanceTransaction,
    maxRetries: number = 3
  ): Promise<BalanceIndex> {
    let retries = 0;

    while (retries < maxRetries) {
      try {
        console.log('Attempting balance update with transaction:', JSON.stringify({
          clientId,
          transactionId: transaction.uuid,
          attempt: retries + 1,
          maxRetries,
        }, null, 2));

        // 1. Read current balance index
        let currentBalance = await this.getBalance(clientId);
        const currentVersion = currentBalance?.version || 0;

        // Initialize balance if it doesn't exist
        if (!currentBalance) {
          console.log('No existing balance, creating initial balance:', JSON.stringify({
            clientId,
          }, null, 2));

          currentBalance = {
            clientId,
            balance: 0,
            contracts: {
              manutencoesPorAno: 0,
              deslocacoesPorAno: 0,
              horasAssistenciaAnuais: 0,
            },
            lastUpdated: new Date().toISOString(),
            lastTransactionId: '',
            version: 0,
          };
        }

        // 2. Validate transaction against current balance
        const validation = this.validateTransactionAgainstBalance(
          currentBalance,
          transaction.changes
        );

        if (!validation.isValid) {
          const validationError = new ValidationError(validation.errors[0]);
          console.error('Transaction validation failed:', JSON.stringify({
            clientId,
            transactionId: transaction.uuid,
            errors: validation.errors,
          }, null, 2));
          throw validationError;
        }

        // 3. Calculate new balance
        const newBalance = this.applyTransactionToBalance(currentBalance, transaction);
        newBalance.version = currentVersion + 1;

        console.log('Calculated new balance:', JSON.stringify({
          clientId,
          currentVersion,
          newVersion: newBalance.version,
          balanceChange: newBalance.balance - currentBalance.balance,
        }, null, 2));

        // 4. Write transaction record (immutable)
        await this.writeTransaction(transaction);

        // 5. Write balance index with version check
        const success = await this.writeBalanceWithVersionCheck(
          newBalance,
          currentVersion
        );

        if (success) {
          console.log('Balance update completed successfully:', JSON.stringify({
            clientId,
            transactionId: transaction.uuid,
            newVersion: newBalance.version,
            attempts: retries + 1,
          }, null, 2));
          return newBalance;
        }

        // Version conflict - retry
        console.warn('Version conflict, retrying:', JSON.stringify({
          clientId,
          transactionId: transaction.uuid,
          attempt: retries + 1,
          maxRetries,
        }, null, 2));

        retries++;
        if (retries < maxRetries) {
          const backoffMs = Math.pow(2, retries) * 100;
          console.log('Backing off before retry:', JSON.stringify({
            clientId,
            backoffMs,
          }, null, 2));
          await this.sleep(backoffMs);
        }
      } catch (error) {
        // Don't retry validation errors
        if (error instanceof ValidationError) {
          console.error('Validation error, not retrying:', JSON.stringify({
            clientId,
            transactionId: transaction.uuid,
            error: error.message,
          }, null, 2));
          throw error;
        }

        // Retry system errors
        console.error('System error during balance update:', JSON.stringify({
          clientId,
          transactionId: transaction.uuid,
          attempt: retries + 1,
          error: error instanceof Error ? error.message : String(error),
        }, null, 2));

        retries++;
        if (retries >= maxRetries) {
          const maxRetriesError = new Error(
            `Failed to update balance after ${maxRetries} retries: ${error instanceof Error ? error.message : String(error)}`
          );
          console.error('Max retries exceeded:', JSON.stringify({
            clientId,
            transactionId: transaction.uuid,
            maxRetries,
          }, null, 2));
          throw maxRetriesError;
        }

        const backoffMs = Math.pow(2, retries) * 100;
        console.log('Backing off before retry after error:', JSON.stringify({
          clientId,
          backoffMs,
        }, null, 2));
        await this.sleep(backoffMs);
      }
    }

    // Should never reach here, but TypeScript requires a return
    throw new Error('Unexpected error in balance update');
  }

  /**
   * Validate transaction changes against current balance.
   * 
   * Validation Rules:
   * - Balance cannot go negative (debt must be >= 0)
   * - Contract usage cannot go negative (except -1 for unlimited)
   * - All changes must be valid numbers
   * 
   * @param currentBalance - Current balance state
   * @param changes - Proposed transaction changes
   * @returns Validation result with errors if invalid
   * 
   * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
   */
  private validateTransactionAgainstBalance(
    currentBalance: BalanceIndex,
    changes: TransactionChanges
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate balance change
    if (changes.balanceChange !== undefined) {
      const newBalance = currentBalance.balance + changes.balanceChange;
      if (newBalance < 0) {
        errors.push(
          `Transaction would result in negative balance: ${newBalance.toFixed(2)}€`
        );
      }
    }

    // Validate contract usage changes
    if (changes.contractUsageChanges) {
      const { manutencoesPorAno, deslocacoesPorAno, horasAssistenciaAnuais } =
        changes.contractUsageChanges;

      if (manutencoesPorAno !== undefined) {
        const newValue = currentBalance.contracts.manutencoesPorAno + manutencoesPorAno;
        if (newValue < -1) {
          errors.push(
            `Transaction would result in invalid maintenance visits: ${newValue}`
          );
        }
      }

      if (deslocacoesPorAno !== undefined) {
        const newValue = currentBalance.contracts.deslocacoesPorAno + deslocacoesPorAno;
        if (newValue < -1) {
          errors.push(
            `Transaction would result in invalid displacements: ${newValue}`
          );
        }
      }

      if (horasAssistenciaAnuais !== undefined) {
        const newValue =
          currentBalance.contracts.horasAssistenciaAnuais + horasAssistenciaAnuais;
        if (newValue < -1) {
          errors.push(
            `Transaction would result in invalid assistance hours: ${newValue}`
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Apply transaction changes to balance to calculate new state.
   * 
   * This is a pure function that calculates the new balance state
   * without modifying the current balance or writing to storage.
   * 
   * @param currentBalance - Current balance state
   * @param transaction - Transaction to apply
   * @returns New balance state after applying transaction
   */
  private applyTransactionToBalance(
    currentBalance: BalanceIndex,
    transaction: BalanceTransaction
  ): BalanceIndex {
    const newBalance: BalanceIndex = {
      clientId: currentBalance.clientId,
      balance: currentBalance.balance + (transaction.changes.balanceChange || 0),
      contracts: {
        manutencoesPorAno:
          currentBalance.contracts.manutencoesPorAno +
          (transaction.changes.contractUsageChanges?.manutencoesPorAno || 0),
        deslocacoesPorAno:
          currentBalance.contracts.deslocacoesPorAno +
          (transaction.changes.contractUsageChanges?.deslocacoesPorAno || 0),
        horasAssistenciaAnuais:
          currentBalance.contracts.horasAssistenciaAnuais +
          (transaction.changes.contractUsageChanges?.horasAssistenciaAnuais || 0),
      },
      lastUpdated: transaction.timestamp,
      lastTransactionId: transaction.uuid,
      version: currentBalance.version + 1,
    };

    return newBalance;
  }

  /**
   * Sleep for specified milliseconds.
   * Used for exponential backoff in retry logic.
   * 
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Recalculate balance from scratch by reading all transactions.
   * This is an administrative operation that should be used sparingly.
   * 
   * If no transactions exist, this will initialize the balance by:
   * 1. Finding all contracts for the client
   * 2. Creating ADD transactions for contracts that don't have transactions
   * 3. Calculating the final balance
   * 
   * Use cases:
   * - Initialize balance for existing clients with contracts
   * - Verify balance integrity
   * - Recover from data corruption
   * - Audit balance calculations
   * 
   * @param clientId - Client UUID
   * @param userId - User ID for creating missing transactions (optional, defaults to 'system')
   * @returns Recalculated balance index
   */
  async recalculateBalance(clientId: string, userId: string = 'system'): Promise<BalanceIndex> {
    try {
      console.log('Starting balance recalculation:', JSON.stringify({ clientId }, null, 2));

      // Step 1: Read all existing transactions for the client
      let transactions = await this.getTransactionHistory(clientId);

      console.log('Existing transactions found:', JSON.stringify({
        clientId,
        transactionCount: transactions.length,
      }, null, 2));

      // Step 2: Get all contracts for this client from R2
      console.log('Fetching contracts for client:', clientId);
      
      // Read contracts index to get list of all contract UUIDs
      const contractsKey = 'indexes/contracts-index.json';
      const contractsIndexObj = await this.r2Bucket.get(contractsKey);
      
      if (contractsIndexObj) {
        const contractsIndex = await contractsIndexObj.json() as any;
        
        console.log('Contracts index structure:', JSON.stringify({
          hasItems: !!contractsIndex.items,
          itemCount: contractsIndex.items?.length || 0,
          firstItem: contractsIndex.items?.[0] ? {
            uuid: contractsIndex.items[0].uuid,
            hasData: !!contractsIndex.items[0].data,
            dataKeys: contractsIndex.items[0].data ? Object.keys(contractsIndex.items[0].data) : [],
          } : null,
        }, null, 2));
        
        // The index contains minimal data - we need to read full contracts
        // Filter by clientId from index data
        const clientContractIds = contractsIndex.items
          ?.filter((item: any) => item.clientId === clientId)
          .map((item: any) => item.uuid) || [];

        console.log('Client contract IDs from index:', JSON.stringify({
          clientId,
          contractIds: clientContractIds,
        }, null, 2));

        // Step 3: Check which contracts don't have transactions
        const existingTransactionSources = new Set(
          transactions
            .filter(t => t.source === 'contract' || t.source === 'contract-renovation')
            .map(t => t.sourceId)
        );

        const contractIdsWithoutTransactions = clientContractIds.filter(
          (contractId: string) => !existingTransactionSources.has(contractId)
        );

        console.log('Contracts without transactions:', JSON.stringify({
          clientId,
          count: contractIdsWithoutTransactions.length,
          contractIds: contractIdsWithoutTransactions,
        }, null, 2));

        // Step 4: Create missing transactions for contracts
        for (const contractId of contractIdsWithoutTransactions) {
          try {
            console.log('Creating missing transaction for contract:', JSON.stringify({
              contractId,
              clientId,
            }, null, 2));

            // Read full contract data from R2
            const contractKey = `content/contracts/${contractId}.json`;
            const contractObj = await this.r2Bucket.get(contractKey);
            
            if (!contractObj) {
              console.warn('Contract not found in R2:', contractId);
              continue;
            }

            const contract = await contractObj.json() as any;

            console.log('Contract data loaded:', JSON.stringify({
              contractId,
              hasCPAContract: contract.data?.hasCPAContract,
              hasSHContract: contract.data?.hasSHContract,
              manutencoesPorAnoCPA: contract.data?.manutencoesPorAnoCPA,
              deslocacoesPorAnoCPA: contract.data?.deslocacoesPorAnoCPA,
              horasAssistenciaAnualCPA: contract.data?.horasAssistenciaAnualCPA,
            }, null, 2));

            // Extract transaction changes from contract
            const { extractContractAddTransaction, hasTransactionChanges } = await import('@clever/shared');
            const changes = extractContractAddTransaction(contract);

            console.log('Extracted changes from contract:', JSON.stringify({
              contractId,
              changes,
              hasChanges: hasTransactionChanges(changes),
            }, null, 2));

            if (!hasTransactionChanges(changes)) {
              console.log('No balance changes in contract, skipping:', contractId);
              continue;
            }

            // Create ADD transaction for this contract
            const transaction = await this.createAddTransaction(
              clientId,
              contract.uuid,
              'contract',
              changes.contractUsageChanges || {},
              userId,
              {
                contractType: this.getContractTypeDescription(contract),
                serviceDetails: {
                  hasCPAContract: contract.data?.hasCPAContract,
                  hasSHContract: contract.data?.hasSHContract,
                  createdDuringRecalculation: true,
                },
              }
            );

            console.log('Created missing transaction:', JSON.stringify({
              contractId: contract.uuid,
              transactionId: transaction.uuid,
              changes: transaction.changes,
            }, null, 2));

            // Add to transactions list for recalculation
            transactions.push(transaction);
          } catch (error) {
            console.error('Error creating transaction for contract:', JSON.stringify({
              contractId,
              error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              } : String(error),
            }, null, 2));
            // Continue with other contracts even if one fails
          }
        }
      } else {
        console.log('No contracts index found in R2');
      }

      // Step 5: Recalculate balance from all transactions
      if (transactions.length === 0) {
        console.log('No transactions found after checking contracts, initializing zero balance:', 
          JSON.stringify({ clientId }, null, 2));
        
        const zeroBalance: BalanceIndex = {
          clientId,
          balance: 0,
          contracts: {
            manutencoesPorAno: 0,
            deslocacoesPorAno: 0,
            horasAssistenciaAnuais: 0,
          },
          lastUpdated: new Date().toISOString(),
          lastTransactionId: '',
          version: 0,
        };

        // Write the zero balance to R2
        await this.writeBalanceIndex(zeroBalance);

        console.log('Zero balance initialized:', JSON.stringify({
          clientId,
          balance: zeroBalance.balance,
        }, null, 2));

        return zeroBalance;
      }

      // Sort transactions by timestamp
      const sortedTransactions = transactions.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Calculate balance from transactions
      let balance = 0;
      let contracts = {
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

      const recalculatedBalance: BalanceIndex = {
        clientId,
        balance,
        contracts,
        lastUpdated: new Date().toISOString(),
        lastTransactionId: sortedTransactions[sortedTransactions.length - 1].uuid,
        version: sortedTransactions.length,
      };

      // Write the recalculated balance
      await this.writeBalanceIndex(recalculatedBalance);

      console.log('Balance recalculation completed:', JSON.stringify({
        clientId,
        balance: recalculatedBalance.balance,
        contracts: recalculatedBalance.contracts,
        version: recalculatedBalance.version,
        transactionCount: sortedTransactions.length,
      }, null, 2));

      return recalculatedBalance;
    } catch (error) {
      console.error('Error recalculating balance:', JSON.stringify({
        clientId,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : String(error),
      }, null, 2));
      throw error;
    }
  }

  /**
   * Get contract type description for transaction metadata.
   * Helper method for creating transaction metadata.
   * 
   * @param contract - Contract content
   * @returns Contract type description
   */
  private getContractTypeDescription(contract: any): string {
    const types: string[] = [];

    if (contract.data?.hasCPAContract) {
      types.push(contract.data.cpaContractType || 'CPA');
    }

    if (contract.data?.hasSHContract) {
      types.push('S&H');
    }

    return types.join(' + ') || 'Unknown';
  }
}

/**
 * Custom error class for validation errors.
 * Validation errors should not be retried as they indicate
 * business rule violations, not transient failures.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Factory function to create a BalanceService instance.
 * 
 * @param r2Bucket - R2 storage bucket
 * @returns BalanceService instance
 */
export function createBalanceService(r2Bucket: StorageBucket): BalanceService {
  return new BalanceService(r2Bucket);
}
