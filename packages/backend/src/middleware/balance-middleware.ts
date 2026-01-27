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
   * Detects contract renovations by comparing previous and current contract data.
   * A renovation is detected when:
   * - Contract end date is extended, OR
   * - Contract resources are increased
   * 
   * Creates an ADD transaction for renovations that adds new resources to balance.
   * 
   * @param contract - Updated contract content
   * @param previousContract - Previous contract content before update
   * @param userId - User ID from authentication context
   * 
   * Validates: Requirements 12.2, 10.1, 10.2, 10.3, 10.4, 10.5
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

      // Detect if this is a renovation
      const isRenovation = this.detectContractRenovation(contract, previousContract);

      if (!isRenovation) {
        console.log('Balance middleware: Contract update is not a renovation, skipping:', 
          JSON.stringify({ contractId: contract.uuid }, null, 2));
        return;
      }

      console.log('Balance middleware: Contract renovation detected:', JSON.stringify({
        contractId: contract.uuid,
        clientId,
      }, null, 2));

      // Extract transaction changes from updated contract
      // For renovations, we add the NEW resources (not the difference)
      const changes = extractContractAddTransaction(contract);

      // Check if there are any changes to process
      if (!hasTransactionChanges(changes)) {
        console.log('Balance middleware: No balance changes in contract renovation, skipping:', 
          JSON.stringify({ contractId: contract.uuid }, null, 2));
        return;
      }

      // Create ADD transaction for renovation
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
   * Detect if a contract update is a renovation.
   * 
   * A renovation is detected when:
   * - Contract end date is extended (fimContratoCPA or fimContratoSH is later), OR
   * - Contract resources are increased (any usage value is higher)
   * 
   * @param current - Current contract after update
   * @param previous - Previous contract before update
   * @returns true if renovation detected, false otherwise
   */
  private detectContractRenovation(current: Contract, previous: Contract): boolean {
    // Check if CPA end date is extended
    if (current.data.hasCPAContract && previous.data.hasCPAContract) {
      const currentEndDate = current.data.fimContratoCPA;
      const previousEndDate = previous.data.fimContratoCPA;

      if (currentEndDate && previousEndDate) {
        const currentDate = new Date(currentEndDate);
        const previousDate = new Date(previousEndDate);

        if (currentDate > previousDate) {
          console.log('Balance middleware: Renovation detected - CPA end date extended:', JSON.stringify({
            previousEndDate,
            currentEndDate,
          }, null, 2));
          return true;
        }
      }
    }

    // Check if S&H end date is extended
    if (current.data.hasSHContract && previous.data.hasSHContract) {
      const currentEndDate = current.data.fimContratoSH;
      const previousEndDate = previous.data.fimContratoSH;

      if (currentEndDate && previousEndDate) {
        const currentDate = new Date(currentEndDate);
        const previousDate = new Date(previousEndDate);

        if (currentDate > previousDate) {
          console.log('Balance middleware: Renovation detected - S&H end date extended:', JSON.stringify({
            previousEndDate,
            currentEndDate,
          }, null, 2));
          return true;
        }
      }
    }

    // Check if CPA resources are increased
    if (current.data.hasCPAContract && previous.data.hasCPAContract) {
      const currentCPA = {
        manutencoes: current.data.manutencoesPorAnoCPA || 0,
        deslocacoes: current.data.deslocacoesPorAnoCPA || 0,
        horas: current.data.horasAssistenciaAnualCPA || 0,
      };

      const previousCPA = {
        manutencoes: previous.data.manutencoesPorAnoCPA || 0,
        deslocacoes: previous.data.deslocacoesPorAnoCPA || 0,
        horas: previous.data.horasAssistenciaAnualCPA || 0,
      };

      if (
        currentCPA.manutencoes > previousCPA.manutencoes ||
        currentCPA.deslocacoes > previousCPA.deslocacoes ||
        currentCPA.horas > previousCPA.horas
      ) {
        console.log('Balance middleware: Renovation detected - CPA resources increased:', JSON.stringify({
          previousCPA,
          currentCPA,
        }, null, 2));
        return true;
      }
    }

    // Check if S&H resources are increased
    if (current.data.hasSHContract && previous.data.hasSHContract) {
      const currentSH = {
        manutencoes: current.data.manutencoesPorAnoSH || 0,
        deslocacoes: current.data.deslocacoesPorAnoSH || 0,
        horas: current.data.horasAssistenciaAnualSH || 0,
      };

      const previousSH = {
        manutencoes: previous.data.manutencoesPorAnoSH || 0,
        deslocacoes: previous.data.deslocacoesPorAnoSH || 0,
        horas: previous.data.horasAssistenciaAnualSH || 0,
      };

      if (
        currentSH.manutencoes > previousSH.manutencoes ||
        currentSH.deslocacoes > previousSH.deslocacoes ||
        currentSH.horas > previousSH.horas
      ) {
        console.log('Balance middleware: Renovation detected - S&H resources increased:', JSON.stringify({
          previousSH,
          currentSH,
        }, null, 2));
        return true;
      }
    }

    // Check if new contract section was added
    if (
      (current.data.hasCPAContract && !previous.data.hasCPAContract) ||
      (current.data.hasSHContract && !previous.data.hasSHContract)
    ) {
      console.log('Balance middleware: Renovation detected - new contract section added:', JSON.stringify({
        previousHasCPA: previous.data.hasCPAContract,
        currentHasCPA: current.data.hasCPAContract,
        previousHasSH: previous.data.hasSHContract,
        currentHasSH: current.data.hasSHContract,
      }, null, 2));
      return true;
    }

    return false;
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
