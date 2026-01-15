/**
 * Contracts API routes using the generic content route template
 * Implements full CRUD operations with contract-specific validation and sorting
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { Hono } from 'hono';
import { createContentRoutes, createStandardContentConfig, contentErrorHandler } from './content-route-template';
import type { Contract, ContractData, ContractCreationData, ContractUpdateData } from '@clever/shared';
import { 
  sanitizeContractData,
  getContractSummary,
  hasActiveContract
} from '@clever/shared';

/**
 * Temporary direct implementation of contract validation to avoid import conflicts
 * TODO: Fix the shared package exports to properly expose specific validation functions
 */
function validateContractCreationDirect(data: ContractCreationData): string[] {
  const errors: string[] = [];

  // Basic validation
  if (!data.clientId?.trim()) {
    errors.push('Cliente é obrigatório');
  }

  // Must have at least one contract type
  if (!data.hasCPAContract && !data.hasSHContract) {
    errors.push('Deve selecionar pelo menos um tipo de contrato (CPA e/ou S&H)');
  }

  // CPA Contract validation
  if (data.hasCPAContract) {
    if (!data.cpaContractType) {
      errors.push('Tipo de contrato CPA é obrigatório');
    }

    if (!data.planIdCPA) {
      errors.push('Plano CPA é obrigatório');
    }

    if (!data.modalidadePagamentoCPA) {
      errors.push('Modalidade de pagamento CPA é obrigatória');
    }

    // Distance is only required for CPA (2023), not CPA_1500
    if (data.cpaContractType === 'CPA' && !data.distanceCPA) {
      errors.push('Distância é obrigatória para contratos CPA (2023)');
    }

    // Validate CPA equipment
    if (!data.cpaEquipments || data.cpaEquipments.length === 0) {
      errors.push('Pelo menos um equipamento CPA deve ser adicionado');
    }
  }

  // S&H Contract validation
  if (data.hasSHContract) {
    if (!data.planIdSH) {
      errors.push('Plano S&H é obrigatório');
    }

    if (!data.distanceSH) {
      errors.push('Distância S&H é obrigatória');
    }

    if (!data.modalidadePagamentoSH) {
      errors.push('Modalidade de pagamento S&H é obrigatória');
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
    planoCPA: contractData.planoCPA || '',
    distanceCPA: contractData.distanceCPA || '',
    modalidadePagamentoCPA: contractData.modalidadePagamentoCPA || '',
    hasPOSPackage: contractData.hasPOSPackage || false,
    inicioContratoCPA: contractData.inicioContratoCPA || '',
    fimContratoCPA: contractData.fimContratoCPA || '',
    planIdSH: contractData.planIdSH || '',
    planoSH: contractData.planoSH || '',
    distanceSH: contractData.distanceSH || '',
    modalidadePagamentoSH: contractData.modalidadePagamentoSH || '',
    inicioContratoSH: contractData.inicioContratoSH || '',
    fimContratoSH: contractData.fimContratoSH || '',
    modeloPSO: contractData.modeloPSO || '',
    numeroSeriePSO: contractData.numeroSeriePSO || '',
    softwarePSO: contractData.softwarePSO || '',
    horasAssistenciaAnual: contractData.horasAssistenciaAnual || 0,
    deslocacoesPorAno: contractData.deslocacoesPorAno || 0,
    manutencoesPorAno: contractData.manutencoesPorAno || 0,
    metodoPagamento: contractData.metodoPagamento || '',
    cpaEquipments: contractData.cpaEquipments || [],
    modeloCPA: contractData.modeloCPA || '',
    numeroSerieCPA: contractData.numeroSerieCPA || '',
    planoContrato: contractData.planoContrato || '',
    temCPA: contractData.temCPA || false,
    temPSO: contractData.temPSO || false
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
  if (existingContent && contractData.clientId && contractData.clientId !== existingContent.data.clientId) {
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
    planoCPA: contractData.planoCPA || '',
    distanceCPA: contractData.distanceCPA || '',
    modalidadePagamentoCPA: contractData.modalidadePagamentoCPA || '',
    hasPOSPackage: contractData.hasPOSPackage || false,
    inicioContratoCPA: contractData.inicioContratoCPA || '',
    fimContratoCPA: contractData.fimContratoCPA || '',
    planIdSH: contractData.planIdSH || '',
    planoSH: contractData.planoSH || '',
    distanceSH: contractData.distanceSH || '',
    modalidadePagamentoSH: contractData.modalidadePagamentoSH || '',
    inicioContratoSH: contractData.inicioContratoSH || '',
    fimContratoSH: contractData.fimContratoSH || '',
    modeloPSO: contractData.modeloPSO || '',
    numeroSeriePSO: contractData.numeroSeriePSO || '',
    softwarePSO: contractData.softwarePSO || '',
    horasAssistenciaAnual: contractData.horasAssistenciaAnual || 0,
    deslocacoesPorAno: contractData.deslocacoesPorAno || 0,
    manutencoesPorAno: contractData.manutencoesPorAno || 0,
    metodoPagamento: contractData.metodoPagamento || '',
    cpaEquipments: contractData.cpaEquipments || [],
    modeloCPA: contractData.modeloCPA || '',
    numeroSerieCPA: contractData.numeroSerieCPA || '',
    planoContrato: contractData.planoContrato || '',
    temCPA: contractData.temCPA || false,
    temPSO: contractData.temPSO || false
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
    if (data.planoCPA) searchTerms.push(data.planoCPA.toLowerCase());
    if (data.modalidadePagamentoCPA) searchTerms.push(data.modalidadePagamentoCPA.toLowerCase());
    if (data.distanceCPA) searchTerms.push(data.distanceCPA.toLowerCase());
  }
  
  if (data.hasSHContract) {
    searchTerms.push('s&h', 'sh');
    if (data.planIdSH) searchTerms.push(data.planIdSH.toLowerCase());
    if (data.planoSH) searchTerms.push(data.planoSH.toLowerCase());
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
  
  // Legacy equipment fields
  if (data.modeloCPA) searchTerms.push(data.modeloCPA.toLowerCase());
  if (data.numeroSerieCPA) searchTerms.push(data.numeroSerieCPA.toLowerCase());
  if (data.modeloPSO) searchTerms.push(data.modeloPSO.toLowerCase());
  if (data.numeroSeriePSO) searchTerms.push(data.numeroSeriePSO.toLowerCase());
  if (data.softwarePSO) searchTerms.push(data.softwarePSO.toLowerCase());
  
  // Payment method
  if (data.metodoPagamento) searchTerms.push(data.metodoPagamento.toLowerCase());
  
  // Legacy fields
  if (data.planoContrato) searchTerms.push(data.planoContrato.toLowerCase());
  
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
    planoCPA: data.planoCPA || '',
    modalidadePagamentoCPA: data.modalidadePagamentoCPA || '',
    distanceCPA: data.distanceCPA || '',
    inicioContratoCPA: data.inicioContratoCPA || '',
    fimContratoCPA: data.fimContratoCPA || '',
    
    // S&H Contract information
    planIdSH: data.planIdSH || '',
    planoSH: data.planoSH || '',
    modalidadePagamentoSH: data.modalidadePagamentoSH || '',
    distanceSH: data.distanceSH || '',
    inicioContratoSH: data.inicioContratoSH || '',
    fimContratoSH: data.fimContratoSH || '',
    
    // Equipment information for search
    cpaEquipmentModels: data.cpaEquipments?.map(e => e.modelo).filter(Boolean) || [],
    cpaEquipmentSerials: data.cpaEquipments?.map(e => e.numeroSerie).filter(Boolean) || [],
    equipmentCount: data.cpaEquipments?.length || 0,
    
    // Legacy equipment fields
    modeloCPA: data.modeloCPA || '',
    numeroSerieCPA: data.numeroSerieCPA || '',
    modeloPSO: data.modeloPSO || '',
    numeroSeriePSO: data.numeroSeriePSO || '',
    softwarePSO: data.softwarePSO || '',
    
    // Service details
    horasAssistenciaAnual: data.horasAssistenciaAnual || 0,
    deslocacoesPorAno: data.deslocacoesPorAno || 0,
    manutencoesPorAno: data.manutencoesPorAno || 0,
    
    // Payment information
    metodoPagamento: data.metodoPagamento || '',
    planNames: summary.planNames,
    paymentMethods: summary.paymentMethods,
    
    // Contract period information
    startDate: summary.startDate,
    endDate: summary.endDate,
    
    // Legacy fields
    planoContrato: data.planoContrato || '',
    temCPA: data.temCPA || false,
    temPSO: data.temPSO || false,
  };
};

// Add validation functions
contractConfig.validateCreate = validateContractCreate;
contractConfig.validateUpdate = validateContractUpdateData;

// Create and mount the generic CRUD routes
const crudRoutes = createContentRoutes<Contract>(contractConfig);
contractsRouter.route('/', crudRoutes);

export default contractsRouter;