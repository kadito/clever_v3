import type { BaseContent } from '../base';

/**
 * Contract Equipment Interface
 * Represents individual equipment items for CPA contracts
 */
export interface ContractEquipment {
  id: string;
  modelo: string;
  numeroSerie: string;
  desconto: number; // Discount percentage (0 for first equipment, can be > 0 for additional)
  observacoes: string;
}

/**
 * Contract Data Interface
 * Based on analysis of old_src/views/contratos/ContratoDetail.vue and ContratoForm.vue
 */
export interface ContractData {
  // Client relationship
  clientId: string;
  clienteName: string; // For display purposes

  // CPA Contract Information
  hasCPAContract: boolean;
  cpaContractType: 'CPA' | 'CPA_1500' | ''; // CPA (2023) or CPA_1500
  planIdCPA: string;
  planoCPA: string; // Plan description
  distanceCPA: 'under180km' | 'over180km' | ''; // Required for CPA (2023), not for CPA_1500
  modalidadePagamentoCPA: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | '';
  hasPOSPackage: boolean; // Optional POS assistance package for CPA_1500 PREMIUM
  
  // CPA Equipment (array of equipments)
  cpaEquipments: ContractEquipment[];
  
  // CPA Contract Dates
  inicioContratoCPA: string; // ISO date string
  fimContratoCPA: string; // ISO date string

  // S&H Contract Information
  hasSHContract: boolean;
  planIdSH: string;
  planoSH: string; // Plan description
  distanceSH: 'under180km' | 'over180km' | '';
  modalidadePagamentoSH: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | '';
  
  // S&H Equipment (array of equipments)
  shEquipments: Array<{
    id: string;
    modelo: string;
    numeroSerie: string;
    software: string;
    observacoes: string;
  }>;
  
  // S&H Contract Dates
  inicioContratoSH: string; // ISO date string
  fimContratoSH: string; // ISO date string

  // Service Details
  horasAssistenciaAnual: number;
  deslocacoesPorAno: number;
  manutencoesPorAno: number;

  // Payment Method
  metodoPagamento: 'TRANSFERENCIA_BANCARIA' | 'DEBITO_DIRETO' | 'MULTIBANCO' | 'CHEQUE' | 'NUMERARIO' | 'MB_WAY' | '';
}

/**
 * Contract Interface
 * Extends BaseContent with contract-specific data
 */
export interface Contract extends BaseContent {
  contentType: 'contracts';
  data: ContractData;
}

/**
 * Contract Creation Data
 * Data required to create a new contract
 */
export interface ContractCreationData extends Omit<ContractData, 'clienteName'> {
  // clienteName is optional for creation as it can be derived from clientId
  clienteName?: string;
}

/**
 * Contract Update Data
 * Data that can be updated in an existing contract
 */
export interface ContractUpdateData extends Partial<ContractData> {
  // clientId cannot be changed after creation
  clientId?: never;
}

/**
 * Contract Display Data
 * Simplified data for list views and cards
 */
export interface ContractDisplayData {
  uuid: string;
  clienteName: string;
  contractTypes: string[]; // ['CPA', 'S&H'] based on active contracts
  planNames: string[]; // Plan names for display
  paymentMethods: string[]; // Payment methods for both contract types
  startDate: string; // Earliest start date
  endDate: string; // Latest end date
  createdAt: string;
  updatedAt: string;
}

/**
 * Contract Search Filters
 * Filters for searching and filtering contracts
 */
export interface ContractSearchFilters {
  clientName?: string;
  contractType?: 'CPA' | 'S&H' | 'BOTH';
  planId?: string;
  paymentMethod?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  hasActiveContract?: boolean;
}

/**
 * Contract Plan Configuration
 * Configuration for contract plans (from contract-plans.json)
 */
export interface ContractPlan {
  id: string;
  name: string;
  description: string;
  maintenancePerYear?: number;
  hoursPerYear?: number;
  callouts?: string;
  displacementsIncluded?: string | number;
  remoteSupport?: string;
  weekendSupport?: boolean;
  softwareUpdates?: boolean;
  prioritySupport?: boolean;
  dedicatedManager?: boolean;
  additionalPackage?: {
    description: string;
    price: number;
  };
  prices: {
    under180km?: {
      monthly: number;
      quarterly?: number;
      semiannual?: number;
      annual: number;
    };
    over180km?: {
      monthly: number;
      quarterly?: number;
      semiannual?: number;
      annual: number;
    };
    // For CPA_1500 (no distance-based pricing)
    monthly?: number;
    quarterly?: number;
    semiannual?: number;
    annual?: number;
  };
}

/**
 * Contract Plan Configuration Structure
 * Structure of the contract-plans.json configuration
 */
export interface ContractPlanConfig {
  CPA: {
    plans: ContractPlan[];
  };
  CPA_1500: {
    plans: ContractPlan[];
  };
  'S&H': {
    plans: ContractPlan[];
  };
}