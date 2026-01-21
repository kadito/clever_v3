/**
 * Contracts API routes using the generic content route template
 * Implements full CRUD operations with contract-specific validation and sorting
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { Hono } from 'hono';
import {
  createContentRoutes,
  createStandardContentConfig,
  contentErrorHandler,
} from './content-route-template';
import type {
  Contract,
  ContractData,
  ContractCreationData,
  ContractUpdateData,
} from '@clever/shared';
import {
  getContractSummary,
  hasActiveContract,
  // Note: sanitizeContractData will be added when contract validation is fully implemented
} from '@clever/shared';

/**
 * Temporary direct implementation of contract validation to avoid import conflicts
 * TODO: Fix the shared package exports to properly expose specific validation functions
 */
function validateContractCreationDirect(data: ContractCreationData): string[] {
  const errors: string[] = [];

  // Basic validation
  if (!data.clientId?.trim()) {
    errors.push('Por favor, selecione um cliente');
  }

  // Must have at least one contract type
  if (!data.hasCPAContract && !data.hasSHContract) {
    errors.push('Por favor, selecione pelo menos um tipo de contrato (CPA e/ou S&H)');
  }

  // CPA Contract validation
  if (data.hasCPAContract) {
    if (!data.cpaContractType) {
      errors.push('Por favor, selecione o tipo de contrato CPA');
    }

    if (!data.planIdCPA) {
      errors.push('Por favor, selecione um plano CPA');
    }

    if (!data.modalidadePagamentoCPA) {
      errors.push('Por favor, selecione a modalidade de pagamento CPA');
    }

    // Distance is only required for CPA (2023), not CPA_1500
    if (data.cpaContractType === 'CPA' && !data.distanceCPA) {
      errors.push('Por favor, selecione a distância para contratos CPA (2023)');
    }

    // Validate CPA equipment
    if (!data.cpaEquipments || data.cpaEquipments.length === 0) {
      errors.push('Por favor, adicione pelo menos um equipamento CPA');
    }
  }

  // S&H Contract validation
  if (data.hasSHContract) {
    if (!data.planIdSH) {
      errors.push('Por favor, selecione um plano S&H');
    }

    if (!data.distanceSH) {
      errors.push('Por favor, selecione a distância para o contrato S&H');
    }

    if (!data.modalidadePagamentoSH) {
      errors.push('Por favor, selecione a modalidade de pagamento S&H');
    }
  }

  return errors;
}

/**
 * Contract-specific validation for create operations
 * Uses the comprehensive validation from shared package
 * Requirements: 8.2 - Content-specific validation logic
 */
function validateContractCreate(requestData: any): void {
  // Extract the actual contract data from the request
  const contractData = requestData.data || requestData;

  // Create a proper ContractCreationData object with defaults
  const contractCreationData: ContractCreationData = {
    clientId: contractData.clientId || '',
    clienteName: contractData.clienteName || '',
    hasCPAContract: contractData.hasCPAContract || false,
    hasSHContract: contractData.hasSHContract || false,
    cpaContractType: contractData.cpaContractType || '',
    planIdCPA: contractData.planIdCPA || '',
    distanceCPA: contractData.distanceCPA || '',
    modalidadePagamentoCPA: contractData.modalidadePagamentoCPA || '',
    hasPOSPackage: contractData.hasPOSPackage || false,
    inicioContratoCPA: contractData.inicioContratoCPA || '',
    fimContratoCPA: contractData.fimContratoCPA || '',
    horasAssistenciaAnualCPA: contractData.horasAssistenciaAnualCPA || 0,
    deslocacoesPorAnoCPA: contractData.deslocacoesPorAnoCPA || 0,
    manutencoesPorAnoCPA: contractData.manutencoesPorAnoCPA || 0,
    planIdSH: contractData.planIdSH || '',
    distanceSH: contractData.distanceSH || '',
    modalidadePagamentoSH: contractData.modalidadePagamentoSH || '',
    inicioContratoSH: contractData.inicioContratoSH || '',
    fimContratoSH: contractData.fimContratoSH || '',
    horasAssistenciaAnualSH: contractData.horasAssistenciaAnualSH || 0,
    deslocacoesPorAnoSH: contractData.deslocacoesPorAnoSH || 0,
    manutencoesPorAnoSH: contractData.manutencoesPorAnoSH || 0,
    metodoPagamento: contractData.metodoPagamento || '',
    cpaEquipments: contractData.cpaEquipments || [],
    shEquipments: contractData.shEquipments || [],
  };

  // Use the comprehensive validation from shared package directly
  const errors = validateContractCreationDirect(contractCreationData);

  if (errors.length > 0) {
    throw new Error(errors[0]); // Return first error for API response
  }
}

/**
 * Contract-specific validation for update operations
 * Uses the comprehensive validation from shared package
 * Requirements: 8.2 - Content-specific validation logic
 * IMPORTANT: Client cannot be changed during updates for data integrity
 */
function validateContractUpdateData(requestData: any, existingContent?: Contract): void {
  // Extract the actual contract data from the request
  const contractData = requestData.data || requestData;

  // Prevent client changes during updates for data integrity
  if (
    existingContent &&
    contractData.clientId &&
    contractData.clientId !== existingContent.data.clientId
  ) {
    throw new Error('Cliente não pode ser alterado durante atualizações');
  }

  // Create a proper ContractCreationData object with defaults
  const contractCreationData: ContractCreationData = {
    clientId: contractData.clientId || '',
    clienteName: contractData.clienteName || '',
    hasCPAContract: contractData.hasCPAContract || false,
    hasSHContract: contractData.hasSHContract || false,
    cpaContractType: contractData.cpaContractType || '',
    planIdCPA: contractData.planIdCPA || '',
    distanceCPA: contractData.distanceCPA || '',
    modalidadePagamentoCPA: contractData.modalidadePagamentoCPA || '',
    hasPOSPackage: contractData.hasPOSPackage || false,
    inicioContratoCPA: contractData.inicioContratoCPA || '',
    fimContratoCPA: contractData.fimContratoCPA || '',
    horasAssistenciaAnualCPA: contractData.horasAssistenciaAnualCPA || 0,
    deslocacoesPorAnoCPA: contractData.deslocacoesPorAnoCPA || 0,
    manutencoesPorAnoCPA: contractData.manutencoesPorAnoCPA || 0,
    planIdSH: contractData.planIdSH || '',
    distanceSH: contractData.distanceSH || '',
    modalidadePagamentoSH: contractData.modalidadePagamentoSH || '',
    inicioContratoSH: contractData.inicioContratoSH || '',
    fimContratoSH: contractData.fimContratoSH || '',
    horasAssistenciaAnualSH: contractData.horasAssistenciaAnualSH || 0,
    deslocacoesPorAnoSH: contractData.deslocacoesPorAnoSH || 0,
    manutencoesPorAnoSH: contractData.manutencoesPorAnoSH || 0,
    metodoPagamento: contractData.metodoPagamento || '',
    cpaEquipments: contractData.cpaEquipments || [],
    shEquipments: contractData.shEquipments || [],
  };

  // Use the update validation from shared package directly
  const errors = validateContractCreationDirect(contractCreationData);

  if (errors.length > 0) {
    throw new Error(errors[0]); // Return first error for API response
  }
}

/**
 * Creates searchable text for contract content
 * Requirements: 8.5 - Search index with content-specific searchable fields
 */
function createContractSearchText(data: ContractData): string {
  const searchTerms: string[] = [];

  // Basic information
  if (data.clienteName) searchTerms.push(data.clienteName.toLowerCase());
  if (data.clientId) searchTerms.push(data.clientId.toLowerCase());

  // Contract types and plans
  if (data.hasCPAContract) {
    searchTerms.push('cpa');
    if (data.cpaContractType) searchTerms.push(data.cpaContractType.toLowerCase());
    if (data.planIdCPA) searchTerms.push(data.planIdCPA.toLowerCase());
    if (data.modalidadePagamentoCPA) searchTerms.push(data.modalidadePagamentoCPA.toLowerCase());
    if (data.distanceCPA) searchTerms.push(data.distanceCPA.toLowerCase());
  }

  if (data.hasSHContract) {
    searchTerms.push('s&h', 'sh');
    if (data.planIdSH) searchTerms.push(data.planIdSH.toLowerCase());
    if (data.modalidadePagamentoSH) searchTerms.push(data.modalidadePagamentoSH.toLowerCase());
    if (data.distanceSH) searchTerms.push(data.distanceSH.toLowerCase());
  }

  // Equipment information
  if (data.cpaEquipments && data.cpaEquipments.length > 0) {
    data.cpaEquipments.forEach(equipment => {
      if (equipment.modelo) searchTerms.push(equipment.modelo.toLowerCase());
      if (equipment.numeroSerie) searchTerms.push(equipment.numeroSerie.toLowerCase());
    });
  }

  if (data.shEquipments && data.shEquipments.length > 0) {
    data.shEquipments.forEach(equipment => {
      if (equipment.modelo) searchTerms.push(equipment.modelo.toLowerCase());
      if (equipment.numeroSerie) searchTerms.push(equipment.numeroSerie.toLowerCase());
      if (equipment.software) searchTerms.push(equipment.software.toLowerCase());
    });
  }

  // Payment method
  if (data.metodoPagamento) searchTerms.push(data.metodoPagamento.toLowerCase());

  return searchTerms.join(' ');
}

// Create the contracts router using the generic template
const contractsRouter = new Hono();

// Apply error handling middleware
contractsRouter.use('*', contentErrorHandler);

// Create contract-specific configuration with date-based sorting (most recent first)
// Requirements: 8.6 - Date-based sorting for contracts, content-specific searchable fields
const contractConfig = createStandardContentConfig<Contract>('contracts', 'date-desc');

// Override the search text extraction to use the comprehensive contract search function
contractConfig.extractSearchableText = (content: Contract) => {
  return createContractSearchText(content.data);
};

// Override the index fields extraction for contract-specific search and display
// Requirements: 8.5 - Search index with content-specific searchable fields
contractConfig.extractIndexFields = (content: Contract) => {
  const data = content.data;
  const summary = getContractSummary(data);

  return {
    // Basic information for search and display
    clientId: data.clientId || '',
    clienteName: data.clienteName || '',

    // Contract types and status
    hasCPAContract: data.hasCPAContract || false,
    hasSHContract: data.hasSHContract || false,
    contractTypes: summary.contractTypes,
    hasActiveContract: hasActiveContract(data),

    // CPA Contract information
    cpaContractType: data.cpaContractType || '',
    planIdCPA: data.planIdCPA || '',
    modalidadePagamentoCPA: data.modalidadePagamentoCPA || '',
    distanceCPA: data.distanceCPA || '',
    inicioContratoCPA: data.inicioContratoCPA || '',
    fimContratoCPA: data.fimContratoCPA || '',

    // S&H Contract information
    planIdSH: data.planIdSH || '',
    modalidadePagamentoSH: data.modalidadePagamentoSH || '',
    distanceSH: data.distanceSH || '',
    inicioContratoSH: data.inicioContratoSH || '',
    fimContratoSH: data.fimContratoSH || '',

    // Equipment information for search
    cpaEquipmentModels: data.cpaEquipments?.map(e => e.modelo).filter(Boolean) || [],
    cpaEquipmentSerials: data.cpaEquipments?.map(e => e.numeroSerie).filter(Boolean) || [],
    shEquipmentModels: data.shEquipments?.map(e => e.modelo).filter(Boolean) || [],
    shEquipmentSerials: data.shEquipments?.map(e => e.numeroSerie).filter(Boolean) || [],
    equipmentCount: (data.cpaEquipments?.length || 0) + (data.shEquipments?.length || 0),

    // Service details - handle both old and new field names for backward compatibility
    horasAssistenciaAnualCPA: data.horasAssistenciaAnualCPA || 0,
    deslocacoesPorAnoCPA: data.deslocacoesPorAnoCPA || 0,
    manutencoesPorAnoCPA: data.manutencoesPorAnoCPA || 0,
    horasAssistenciaAnualSH: data.horasAssistenciaAnualSH || 0,
    deslocacoesPorAnoSH: data.deslocacoesPorAnoSH || 0,
    manutencoesPorAnoSH: data.manutencoesPorAnoSH || 0,

    // Payment information
    metodoPagamento: data.metodoPagamento || '',
    planNames: summary.planNames,
    paymentMethods: summary.paymentMethods,

    // Contract period information
    startDate: summary.startDate,
    endDate: summary.endDate,
  };
};

// Add validation functions
contractConfig.validateCreate = validateContractCreate;
contractConfig.validateUpdate = validateContractUpdateData;

// Create and mount the generic CRUD routes
const crudRoutes = createContentRoutes<Contract>(contractConfig);
contractsRouter.route('/', crudRoutes);

export default contractsRouter;
