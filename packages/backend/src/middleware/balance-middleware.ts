/**
 * Balance Middleware - Integration Hooks for Content Creation
 * 
 * This middleware provides hooks that integrate the balance system with
 * content creation workflows. Hooks are called after content is saved to R2
 * and process balance updates asynchronously.
 * 
 * Design Principles:
 * - Asynchronous processing prevents blocking content creation
 * - Errors in balance processing don't prevent content creation
 * - All operations are logged with structured data
 * - Extraction logic is delegated to shared utilities
 * 
 * Integration Points:
 * - Contract creation → ADD transaction
 * - Contract renovation → ADD transaction
 * - Work sheet creation → DEBT transaction (if applicable)
 * - Remote assistance creation → DEBT transaction (if applicable)
 * 
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */

import type { BalanceService } from '../services/balance-service';
import type { Contract } from '@clever/shared';
import type { WorkSheet } from '@clever/shared';
import type { RemoteAssistance } from '@clever/shared';
import {
  extractContractAddTransaction,
  extractWorkSheetDebtTransaction,
  extractRemoteAssistanceDebtTransaction,
  hasTransactionChanges,
} from '@clever/shared';

/**
 * Balance middleware class that provides hooks for content creation.
 * 
 * All hooks are designed to be called asynchronously after content is saved.
 * Errors in balance processing are logged but don't prevent content creation.
 */
export class BalanceMiddleware {
  constructor(private balanceService: BalanceService) {}

  /**
   * Hook called after contract creation.
   * 
   * Creates an ADD transaction that adds contract resources to client balance:
   * - Maintenance visits per year
   * - Displacements per year
   * - Assistance hours per year
   * 
   * Handles both CPA and S&H contract sections.
   * 
   * @param contract - Created contract content
   * @param userId - User ID from authentication context
   * 
   * Validates: Requirements 12.1, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
   */
  async onContractCreated(contract: Contract, userId: string): Promise<void> {
    try {
      console.log('Balance middleware: Processing contract creation:', JSON.stringify({
        contractId: contract.uuid,
        clientId: contract.data.clientId,
        userId,
        contractData: {
          hasCPAContract: contract.data.hasCPAContract,
          hasSHContract: contract.data.hasSHContract,
          manutencoesPorAnoCPA: contract.data.manutencoesPorAnoCPA,
          deslocacoesPorAnoCPA: contract.data.deslocacoesPorAnoCPA,
          horasAssistenciaAnualCPA: contract.data.horasAssistenciaAnualCPA,
          manutencoesPorAnoSH: contract.data.manutencoesPorAnoSH,
          deslocacoesPorAnoSH: contract.data.deslocacoesPorAnoSH,
          horasAssistenciaAnualSH: contract.data.horasAssistenciaAnualSH,
        },
      }, null, 2));

      // Extract client ID from contract
      const clientId = contract.data.clientId;
      
      if (!clientId) {
        console.warn('Balance middleware: Contract has no clientId, skipping balance update:', 
          JSON.stringify({ contractId: contract.uuid }, null, 2));
        return;
      }

      console.log('Balance middleware: Extracting transaction changes from contract...');
      
      // Extract transaction changes from contract
      const changes = extractContractAddTransaction(contract);

      console.log('Balance middleware: Extracted changes:', JSON.stringify({
        changes,
        hasChanges: hasTransactionChanges(changes),
      }, null, 2));

      // Check if there are any changes to process
      if (!hasTransactionChanges(changes)) {
        console.log('Balance middleware: No balance changes in contract, skipping:', 
          JSON.stringify({ contractId: contract.uuid }, null, 2));
        return;
      }

      console.log('Balance middleware: Creating ADD transaction...');

      // Create ADD transaction
      const transaction = await this.balanceService.createAddTransaction(
        clientId,
        contract.uuid,
        'contract',
        changes.contractUsageChanges || {},
        userId,
        {
          contractType: this.getContractTypeDescription(contract),
          serviceDetails: {
            hasCPAContract: contract.data.hasCPAContract,
            hasSHContract: contract.data.hasSHContract,
          },
        }
      );

      console.log('Balance middleware: Contract creation processed successfully:', JSON.stringify({
        contractId: contract.uuid,
        clientId,
        transactionId: transaction.uuid,
        changes: transaction.changes,
      }, null, 2));
    } catch (error) {
      // Log error but don't throw - balance processing errors shouldn't prevent content creation
      console.error('Balance middleware: Error processing contract creation:', JSON.stringify({
        contractId: contract.uuid,
        clientId: contract.data?.clientId,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : String(error),
      }, null, 2));
    }
  }

  /**
   * Hook called after contract update.
   * 
   * Detects contract renovations by comparing previous and current resource fields.
   * An ADD transaction is only created when resource fields change (not when only
   * dates or plans change).
   * 
   * Resource fields compared:
   * - manutencoesPorAnoCPA, deslocacoesPorAnoCPA, horasAssistenciaAnualCPA
   * - manutencoesPorAnoSH, deslocacoesPorAnoSH, horasAssistenciaAnualSH
   * 
   * @param contract - Updated contract content
   * @param previousContract - Previous contract content before update
   * @param userId - User ID from authentication context
   * 
   * Validates: Requirements 12.2, REQ-02.1, REQ-02.2, REQ-02.3
   */
  async onContractUpdated(
    contract: Contract,
    previousContract: Contract,
    userId: string
  ): Promise<void> {
    try {
      console.log('Balance middleware: Processing contract update:', JSON.stringify({
        contractId: contract.uuid,
        clientId: contract.data.clientId,
        userId,
      }, null, 2));

      // Extract client ID from contract
      const clientId = contract.data.clientId;
      
      if (!clientId) {
        console.warn('Balance middleware: Contract has no clientId, skipping balance update:', 
          JSON.stringify({ contractId: contract.uuid }, null, 2));
        return;
      }

      // Compare resource fields — only create ADD transaction when resources changed
      const resourcesChanged = this.haveResourcesChanged(contract, previousContract);

      if (!resourcesChanged) {
        console.log('Balance middleware: Contract resources unchanged (dates/plan only), skipping ADD transaction:', 
          JSON.stringify({ contractId: contract.uuid }, null, 2));
        return;
      }

      console.log('Balance middleware: Contract resource change detected (renovation):', JSON.stringify({
        contractId: contract.uuid,
        clientId,
      }, null, 2));

      // Extract transaction changes from updated contract using the new resource values
      const changes = extractContractAddTransaction(contract);

      // Check if there are any changes to process
      if (!hasTransactionChanges(changes)) {
        console.log('Balance middleware: No balance changes in contract renovation, skipping:', 
          JSON.stringify({ contractId: contract.uuid }, null, 2));
        return;
      }

      // Create ADD transaction for renovation with source "contract-renovation"
      const transaction = await this.balanceService.createAddTransaction(
        clientId,
        contract.uuid,
        'contract-renovation',
        changes.contractUsageChanges || {},
        userId,
        {
          contractType: this.getContractTypeDescription(contract),
          renovationPeriod: this.getRenovationPeriod(contract, previousContract),
          serviceDetails: {
            hasCPAContract: contract.data.hasCPAContract,
            hasSHContract: contract.data.hasSHContract,
          },
        }
      );

      console.log('Balance middleware: Contract renovation processed successfully:', JSON.stringify({
        contractId: contract.uuid,
        clientId,
        transactionId: transaction.uuid,
        changes: transaction.changes,
      }, null, 2));
    } catch (error) {
      // Log error but don't throw - balance processing errors shouldn't prevent content creation
      console.error('Balance middleware: Error processing contract update:', JSON.stringify({
        contractId: contract.uuid,
        clientId: contract.data.clientId,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : String(error),
      }, null, 2));
    }
  }

  /**
   * Hook called after work sheet creation.
   * 
   * Creates a DEBT transaction based on payment method:
   * - Warranty work: No transaction (no cost to client)
   * - Contract payment: Consume contract resources (maintenance visit + displacements)
   * - Other payment methods: Add to client debt
   * 
   * @param workSheet - Created work sheet content
   * @param userId - User ID from authentication context
   * 
   * Validates: Requirements 12.3, 4.1, 4.2, 4.3, 4.4, 4.5
   */
  async onWorkSheetCreated(workSheet: WorkSheet, userId: string): Promise<void> {
    try {
      console.log('Balance middleware: Processing work sheet creation:', JSON.stringify({
        workSheetId: workSheet.uuid,
        clientId: workSheet.data.clientId,
        paymentMethod: workSheet.data.displacement.paymentMethod,
        warranty: workSheet.data.otherData.warranty,
        userId,
      }, null, 2));

      // Extract client ID from work sheet
      const clientId = workSheet.data.clientId;
      
      if (!clientId) {
        console.warn('Balance middleware: Work sheet has no clientId, skipping balance update:', 
          JSON.stringify({ workSheetId: workSheet.uuid }, null, 2));
        return;
      }

      // Extract transaction changes from work sheet
      const changes = extractWorkSheetDebtTransaction(workSheet);

      // Check if there are any changes to process
      if (!hasTransactionChanges(changes)) {
        console.log('Balance middleware: No balance changes in work sheet (warranty work), skipping:', 
          JSON.stringify({ 
            workSheetId: workSheet.uuid,
            warranty: workSheet.data.otherData.warranty,
          }, null, 2));
        return;
      }

      // Create DEBT transaction
      const transaction = await this.balanceService.createDebtTransaction(
        clientId,
        workSheet.uuid,
        'work-sheet',
        changes,
        userId,
        {
          paymentMethod: workSheet.data.displacement.paymentMethod,
          serviceDetails: {
            serviceType: workSheet.data.otherData.serviceType,
            hasDisplacement: workSheet.data.displacement.hasDisplacement,
            warranty: workSheet.data.otherData.warranty,
          },
        }
      );

      console.log('Balance middleware: Work sheet creation processed successfully:', JSON.stringify({
        workSheetId: workSheet.uuid,
        clientId,
        transactionId: transaction.uuid,
        changes: transaction.changes,
      }, null, 2));
    } catch (error) {
      // Log error but don't throw - balance processing errors shouldn't prevent content creation
      console.error('Balance middleware: Error processing work sheet creation:', JSON.stringify({
        workSheetId: workSheet.uuid,
        clientId: workSheet.data.clientId,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : String(error),
      }, null, 2));
    }
  }

  /**
   * Hook called after remote assistance creation.
   * 
   * Creates a DEBT transaction based on payment method:
   * - Garantia: No transaction (warranty work, no cost to client)
   * - Contrato: Consume contract assistance hours
   * - Other payment methods: Add to client debt
   * 
   * @param remoteAssistance - Created remote assistance content
   * @param userId - User ID from authentication context
   * 
   * Validates: Requirements 12.4, 5.1, 5.2, 5.3, 5.4, 5.5
   */
  async onRemoteAssistanceCreated(
    remoteAssistance: RemoteAssistance,
    userId: string
  ): Promise<void> {
    try {
      console.log('Balance middleware: Processing remote assistance creation:', JSON.stringify({
        remoteAssistanceId: remoteAssistance.uuid,
        clientId: remoteAssistance.data.clientId,
        paymentMethod: remoteAssistance.data.paymentMethod,
        userId,
      }, null, 2));

      // Extract client ID from remote assistance
      const clientId = remoteAssistance.data.clientId;
      
      if (!clientId) {
        console.warn('Balance middleware: Remote assistance has no clientId, skipping balance update:', 
          JSON.stringify({ remoteAssistanceId: remoteAssistance.uuid }, null, 2));
        return;
      }

      // Extract transaction changes from remote assistance
      const changes = extractRemoteAssistanceDebtTransaction(remoteAssistance);

      // Check if there are any changes to process
      if (!hasTransactionChanges(changes)) {
        console.log('Balance middleware: No balance changes in remote assistance (Garantia), skipping:', 
          JSON.stringify({ 
            remoteAssistanceId: remoteAssistance.uuid,
            paymentMethod: remoteAssistance.data.paymentMethod,
          }, null, 2));
        return;
      }

      // Create DEBT transaction
      const transaction = await this.balanceService.createDebtTransaction(
        clientId,
        remoteAssistance.uuid,
        'remote-assistance',
        changes,
        userId,
        {
          paymentMethod: remoteAssistance.data.paymentMethod,
          serviceDetails: {
            tipoAssistencia: remoteAssistance.data.tipoAssistencia,
            horasTotais: remoteAssistance.data.horasTotais,
            valorAssist: remoteAssistance.data.valorAssist,
          },
        }
      );

      console.log('Balance middleware: Remote assistance creation processed successfully:', JSON.stringify({
        remoteAssistanceId: remoteAssistance.uuid,
        clientId,
        transactionId: transaction.uuid,
        changes: transaction.changes,
      }, null, 2));
    } catch (error) {
      // Log error but don't throw - balance processing errors shouldn't prevent content creation
      console.error('Balance middleware: Error processing remote assistance creation:', JSON.stringify({
        remoteAssistanceId: remoteAssistance.uuid,
        clientId: remoteAssistance.data.clientId,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : String(error),
      }, null, 2));
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Compare resource fields between current and previous contract.
   * 
   * Returns true when any of the 6 resource fields differ:
   * - manutencoesPorAnoCPA, deslocacoesPorAnoCPA, horasAssistenciaAnualCPA
   * - manutencoesPorAnoSH, deslocacoesPorAnoSH, horasAssistenciaAnualSH
   * 
   * Date-only or plan-only changes do NOT trigger a renovation ADD transaction.
   * 
   * @param current - Current contract after update
   * @param previous - Previous contract before update
   * @returns true if any resource field changed, false otherwise
   */
  private haveResourcesChanged(current: Contract, previous: Contract): boolean {
    const currentResources = {
      manutencoesPorAnoCPA: current.data.manutencoesPorAnoCPA || 0,
      deslocacoesPorAnoCPA: current.data.deslocacoesPorAnoCPA || 0,
      horasAssistenciaAnualCPA: current.data.horasAssistenciaAnualCPA || 0,
      manutencoesPorAnoSH: current.data.manutencoesPorAnoSH || 0,
      deslocacoesPorAnoSH: current.data.deslocacoesPorAnoSH || 0,
      horasAssistenciaAnualSH: current.data.horasAssistenciaAnualSH || 0,
    };

    const previousResources = {
      manutencoesPorAnoCPA: previous.data.manutencoesPorAnoCPA || 0,
      deslocacoesPorAnoCPA: previous.data.deslocacoesPorAnoCPA || 0,
      horasAssistenciaAnualCPA: previous.data.horasAssistenciaAnualCPA || 0,
      manutencoesPorAnoSH: previous.data.manutencoesPorAnoSH || 0,
      deslocacoesPorAnoSH: previous.data.deslocacoesPorAnoSH || 0,
      horasAssistenciaAnualSH: previous.data.horasAssistenciaAnualSH || 0,
    };

    const changed = (
      currentResources.manutencoesPorAnoCPA !== previousResources.manutencoesPorAnoCPA ||
      currentResources.deslocacoesPorAnoCPA !== previousResources.deslocacoesPorAnoCPA ||
      currentResources.horasAssistenciaAnualCPA !== previousResources.horasAssistenciaAnualCPA ||
      currentResources.manutencoesPorAnoSH !== previousResources.manutencoesPorAnoSH ||
      currentResources.deslocacoesPorAnoSH !== previousResources.deslocacoesPorAnoSH ||
      currentResources.horasAssistenciaAnualSH !== previousResources.horasAssistenciaAnualSH
    );

    if (changed) {
      console.log('Balance middleware: Resource fields changed:', JSON.stringify({
        previous: previousResources,
        current: currentResources,
      }, null, 2));
    }

    return changed;
  }

  /**
   * Get contract type description for transaction metadata.
   * 
   * @param contract - Contract content
   * @returns Contract type description
   */
  private getContractTypeDescription(contract: Contract): string {
    const types: string[] = [];

    if (contract.data.hasCPAContract) {
      types.push(contract.data.cpaContractType || 'CPA');
    }

    if (contract.data.hasSHContract) {
      types.push('S&H');
    }

    return types.join(' + ') || 'Unknown';
  }

  /**
   * Get renovation period description for transaction metadata.
   * 
   * @param current - Current contract after update
   * @param previous - Previous contract before update
   * @returns Renovation period description
   */
  private getRenovationPeriod(current: Contract, previous: Contract): string {
    const periods: string[] = [];

    // CPA period
    if (current.data.hasCPAContract && previous.data.hasCPAContract) {
      const previousEnd = previous.data.fimContratoCPA || 'Unknown';
      const currentEnd = current.data.fimContratoCPA || 'Unknown';
      if (previousEnd !== currentEnd) {
        periods.push(`CPA: ${previousEnd} → ${currentEnd}`);
      }
    }

    // S&H period
    if (current.data.hasSHContract && previous.data.hasSHContract) {
      const previousEnd = previous.data.fimContratoSH || 'Unknown';
      const currentEnd = current.data.fimContratoSH || 'Unknown';
      if (previousEnd !== currentEnd) {
        periods.push(`S&H: ${previousEnd} → ${currentEnd}`);
      }
    }

    return periods.length > 0 ? periods.join(', ') : 'No period change';
  }
}

/**
 * Factory function to create a BalanceMiddleware instance.
 * 
 * @param balanceService - Balance service instance
 * @returns BalanceMiddleware instance
 */
export function createBalanceMiddleware(balanceService: BalanceService): BalanceMiddleware {
  return new BalanceMiddleware(balanceService);
}
