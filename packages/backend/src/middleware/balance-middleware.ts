/**
 * Balance Middleware — Period-aware hooks for content creation.
 *
 * Contract created → open period(s)
 * Contract updated (resource change) → close + reopen affected period(s)
 * Work sheet created → resolve period by request.date + section, create DEBT transaction
 * Remote assistance created → resolve SH period by dataPedido, create DEBT transaction
 *
 * All hooks are fire-and-forget safe: errors are logged but do not block content creation.
 */

import type { BalancePeriodService } from '../services/balance-service';
import type { Contract } from '@clever/shared';
import type { WorkSheet } from '@clever/shared';
import type { RemoteAssistance } from '@clever/shared';
import {
  extractContractSectionResources,
  extractWorkSheetDebtTransaction,
  extractRemoteAssistanceDebtTransaction,
  getSectionForServiceType,
  hasTransactionChanges,
} from '@clever/shared';

export class BalanceMiddleware {
  constructor(private periodService: BalancePeriodService) {}

  // --------------------------------------------------------------------------
  // Contract hooks
  // --------------------------------------------------------------------------

  async onContractCreated(contract: Contract, userId: string): Promise<void> {
    const clientId = contract.data.clientId;
    if (!clientId) return;

    try {
      if (contract.data.hasCPAContract) {
        await this.periodService.openPeriod(
          clientId,
          contract.uuid,
          'CPA',
          extractContractSectionResources(contract, 'CPA'),
          contract.data.inicioContratoCPA,
          contract.data.fimContratoCPA,
          userId
        );
      }
      if (contract.data.hasSHContract) {
        await this.periodService.openPeriod(
          clientId,
          contract.uuid,
          'SH',
          extractContractSectionResources(contract, 'SH'),
          contract.data.inicioContratoSH,
          contract.data.fimContratoSH,
          userId
        );
      }
    } catch (error) {
      console.error(
        'BalanceMiddleware: error opening period on contract creation:',
        JSON.stringify({
          contractId: contract.uuid,
          clientId,
          error: error instanceof Error ? error.message : String(error),
        }, null, 2)
      );
    }
  }

  async onContractUpdated(
    contract: Contract,
    previousContract: Contract,
    userId: string
  ): Promise<void> {
    const clientId = contract.data.clientId;
    if (!clientId) return;

    try {
      const cpaSectionChanged = this.hasCPAResourcesChanged(contract, previousContract);
      const shSectionChanged = this.hasSHResourcesChanged(contract, previousContract);

      if (contract.data.hasCPAContract && cpaSectionChanged) {
        await this.closeAndReopenPeriod(clientId, contract, 'CPA', userId);
      }
      if (contract.data.hasSHContract && shSectionChanged) {
        await this.closeAndReopenPeriod(clientId, contract, 'SH', userId);
      }
    } catch (error) {
      console.error(
        'BalanceMiddleware: error updating period on contract update:',
        JSON.stringify({
          contractId: contract.uuid,
          clientId,
          error: error instanceof Error ? error.message : String(error),
        }, null, 2)
      );
    }
  }

  private async closeAndReopenPeriod(
    clientId: string,
    contract: Contract,
    section: 'CPA' | 'SH',
    userId: string
  ): Promise<void> {
    const index = await this.periodService.getPeriodsIndex(clientId);
    const activeEntry = index.find(
      e => e.contractId === contract.uuid && e.section === section && e.status === 'active'
    );

    if (activeEntry) {
      await this.periodService.closePeriod(clientId, activeEntry.periodId, userId);
      const resources = extractContractSectionResources(contract, section);
      const start = section === 'CPA' ? contract.data.inicioContratoCPA : contract.data.inicioContratoSH;
      const end = section === 'CPA' ? contract.data.fimContratoCPA : contract.data.fimContratoSH;
      await this.periodService.openPeriod(
        clientId, contract.uuid, section, resources, start, end, userId,
        activeEntry.periodId
      );
    }
  }

  // --------------------------------------------------------------------------
  // Work sheet hook
  // --------------------------------------------------------------------------

  async onWorkSheetCreated(workSheet: WorkSheet, userId: string): Promise<void> {
    const clientId = workSheet.data.clientId;
    const contractId = workSheet.data.contractId;

    if (!clientId) return;

    const serviceType = workSheet.data.otherData.serviceType;
    const section = getSectionForServiceType(serviceType);

    if (!section) {
      // INSTALAÇÃO or empty — no contract consumption
      console.log('BalanceMiddleware: work sheet has no contract section (INSTALAÇÃO), skipping:', workSheet.uuid);
      return;
    }

    const requestDate = workSheet.data.request.date;

    try {
      const activePeriod = contractId
        ? await this.periodService.getActivePeriodForDate(clientId, contractId, section, requestDate)
        : null;

      const changes = extractWorkSheetDebtTransaction(workSheet, activePeriod);

      if (!hasTransactionChanges(changes)) return;

      // Determine periodId for transaction (use activePeriod if found, else a placeholder)
      const periodId = activePeriod?.uuid ?? 'no-period';
      const resolvedContractId = activePeriod?.contractId ?? contractId ?? 'unknown';

      await this.periodService.createDebtTransaction(
        clientId,
        resolvedContractId,
        periodId,
        workSheet.uuid,
        'work-sheet',
        changes,
        userId,
        {
          paymentMethod: workSheet.data.displacement.paymentMethod,
          section,
          serviceDetails: {
            serviceType,
            horasExtra: workSheet.data.otherData.horasExtra,
            hasDisplacement: workSheet.data.displacement.hasDisplacement,
          },
        }
      );

      console.log('BalanceMiddleware: work sheet debt transaction created:', JSON.stringify({
        workSheetId: workSheet.uuid,
        clientId,
        section,
        hasActivePeriod: !!activePeriod,
        changesType: changes.balanceChange ? 'euro-debt' : 'resource-consumption',
      }, null, 2));
    } catch (error) {
      console.error(
        'BalanceMiddleware: error processing work sheet:',
        JSON.stringify({
          workSheetId: workSheet.uuid,
          clientId,
          error: error instanceof Error ? error.message : String(error),
        }, null, 2)
      );
    }
  }

  // --------------------------------------------------------------------------
  // Remote assistance hook
  // --------------------------------------------------------------------------

  async onRemoteAssistanceCreated(
    remoteAssistance: RemoteAssistance,
    userId: string
  ): Promise<void> {
    const clientId = remoteAssistance.data.clientId;
    const contractId = remoteAssistance.data.contractId;

    if (!clientId) return;

    const requestDate = remoteAssistance.data.dataPedido;

    try {
      const activePeriod = contractId
        ? await this.periodService.getActivePeriodForDate(clientId, contractId, 'SH', requestDate)
        : null;

      const changes = extractRemoteAssistanceDebtTransaction(remoteAssistance, activePeriod);

      if (!hasTransactionChanges(changes)) return;

      const periodId = activePeriod?.uuid ?? 'no-period';
      const resolvedContractId = activePeriod?.contractId ?? contractId ?? 'unknown';

      await this.periodService.createDebtTransaction(
        clientId,
        resolvedContractId,
        periodId,
        remoteAssistance.uuid,
        'remote-assistance',
        changes,
        userId,
        {
          paymentMethod: remoteAssistance.data.paymentMethod,
          section: 'SH',
          serviceDetails: {
            tipoAssistencia: remoteAssistance.data.tipoAssistencia,
            horasTotais: remoteAssistance.data.horasTotais,
          },
        }
      );

      console.log('BalanceMiddleware: remote assistance debt transaction created:', JSON.stringify({
        remoteAssistanceId: remoteAssistance.uuid,
        clientId,
        hasActivePeriod: !!activePeriod,
        changesType: changes.balanceChange ? 'euro-debt' : 'resource-consumption',
      }, null, 2));
    } catch (error) {
      console.error(
        'BalanceMiddleware: error processing remote assistance:',
        JSON.stringify({
          remoteAssistanceId: remoteAssistance.uuid,
          clientId,
          error: error instanceof Error ? error.message : String(error),
        }, null, 2)
      );
    }
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private hasCPAResourcesChanged(current: Contract, previous: Contract): boolean {
    return (
      (current.data.manutencoesPorAnoCPA ?? 0) !== (previous.data.manutencoesPorAnoCPA ?? 0) ||
      (current.data.deslocacoesPorAnoCPA ?? 0) !== (previous.data.deslocacoesPorAnoCPA ?? 0) ||
      (current.data.horasAssistenciaAnualCPA ?? 0) !== (previous.data.horasAssistenciaAnualCPA ?? 0)
    );
  }

  private hasSHResourcesChanged(current: Contract, previous: Contract): boolean {
    return (
      (current.data.manutencoesPorAnoSH ?? 0) !== (previous.data.manutencoesPorAnoSH ?? 0) ||
      (current.data.deslocacoesPorAnoSH ?? 0) !== (previous.data.deslocacoesPorAnoSH ?? 0) ||
      (current.data.horasAssistenciaAnualSH ?? 0) !== (previous.data.horasAssistenciaAnualSH ?? 0)
    );
  }
}

export function createBalanceMiddleware(
  periodService: BalancePeriodService
): BalanceMiddleware {
  return new BalanceMiddleware(periodService);
}
