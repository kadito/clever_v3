import type { BaseContent } from '../base';

// ─── Plan Data Model ───────────────────────────────────────────────────────────

/**
 * Base plan parameter fields — shared between CPA and S&H.
 * These are the values that auto-populate the contract form for 1 equipment,
 * and that the user must manually specify for 2+ equipments.
 */
export interface PlanBaseParameters {
  manutencoesPorAno: number;
  deslocacoesPorAno: number; // -1 = unlimited
}

/**
 * Work schedule info — READ-ONLY display, never overridable by user.
 * Derived from plan definition, shown as informational text.
 */
export interface PlanScheduleInfo {
  deslocacao: string;
  remoteSupport: string;
}

/**
 * CPA-specific plan parameters.
 * CPA doesn't have "horas por ano".
 */
export interface CPAPlanParameters extends PlanBaseParameters {
  // No additional fields
}

/**
 * S&H-specific plan parameters.
 */
export interface SHPlanParameters extends PlanBaseParameters {
  horasPorAno: number;
}

/**
 * CPA Plan definition — flat pricing (no distance zones).
 */
export interface CPAPlan {
  id: string;
  name: string;
  description: string;
  parameters: CPAPlanParameters;
  schedule: PlanScheduleInfo;
  weekendSupport: boolean;
  posPackage?: {
    description: string;
    pricePerYear: number;
  };
  prices: {
    mensal: number;
    semestral: number;
    anual: number;
  };
}

/**
 * S&H Plan definition — distance-based pricing.
 */
export interface SHPlan {
  id: string;
  name: string;
  description: string;
  parameters: SHPlanParameters;
  schedule: PlanScheduleInfo;
  weekendSupport: boolean;
  prices: {
    under180km: {
      mensal: number;
      anual: number;
    };
    over180km: {
      mensal: number;
      anual: number;
    };
  };
}

/**
 * Top-level plan config — replaces old ContractPlanConfig.
 * CPA_1500 key is REMOVED (unified into CPA).
 */
export interface ContractPlanConfig {
  CPA: {
    name: string;
    description: string;
    plans: CPAPlan[];
  };
  'S&H': {
    name: string;
    description: string;
    plans: SHPlan[];
  };
}

// ─── Contract Equipment ────────────────────────────────────────────────────────

/**
 * Contract Equipment Interface
 * Represents individual equipment items for CPA contracts.
 * Note: `desconto` field has been removed — pricing is now plan-based or manual.
 */
export interface ContractEquipment {
  id: string;
  modelo: string;
  numeroSerie: string;
  observacoes: string;
}

// ─── Contract Data ─────────────────────────────────────────────────────────────

/**
 * Contract Data Interface
 * Fields removed: cpaContractType, distanceCPA (CPA is now unified with flat pricing).
 * Fields added: precoCPA, precoSH (manual price for 2+ equipments).
 */
export interface ContractData {
  // Client relationship
  clientId: string;
  clienteName?: string;

  // CPA Contract Information
  hasCPAContract: boolean;
  planIdCPA: string;
  modalidadePagamentoCPA: '' | 'MENSAL' | 'SEMESTRAL' | 'ANUAL';
  hasPOSPackage: boolean;

  // CPA Price (manual — set when 2+ equipments, undefined in auto mode)
  precoCPA?: number;

  // CPA Equipment (array of equipments)
  cpaEquipments: ContractEquipment[];

  // CPA Contract Dates
  inicioContratoCPA: string;
  fimContratoCPA: string;

  // CPA Service Details
  horasAssistenciaAnualCPA: number;
  deslocacoesPorAnoCPA: number;
  manutencoesPorAnoCPA: number;

  // S&H Contract Information
  hasSHContract: boolean;
  planIdSH: string;
  distanceSH: 'under180km' | 'over180km' | '';
  modalidadePagamentoSH: '' | 'MENSAL' | 'ANUAL';

  // S&H Price (manual — set when 2+ equipments, undefined in auto mode)
  precoSH?: number;

  // S&H Equipment (array of equipments)
  shEquipments: Array<{
    id: string;
    modelo: string;
    numeroSerie: string;
    software: string;
    observacoes: string;
  }>;

  // S&H Contract Dates
  inicioContratoSH: string;
  fimContratoSH: string;

  // S&H Service Details
  horasAssistenciaAnualSH: number;
  deslocacoesPorAnoSH: number;
  manutencoesPorAnoSH: number;

  // Payment Method
  metodoPagamento:
    | 'TRANSFERENCIA_BANCARIA'
    | 'DEBITO_DIRETO'
    | 'MULTIBANCO'
    | 'CHEQUE'
    | 'NUMERARIO'
    | 'MB_WAY'
    | '';
}

// ─── Contract Entity ───────────────────────────────────────────────────────────

/**
 * Contract Interface
 * Extends BaseContent with contract-specific data
 */
export interface Contract extends BaseContent {
  contentType: 'contracts';
  data: ContractData;
}

// ─── Contract Creation / Update ────────────────────────────────────────────────

/**
 * Contract Creation Data
 * Data required to create a new contract
 */
export interface ContractCreationData extends Omit<ContractData, 'clienteName'> {
  clienteName?: string;
}

/**
 * Contract Update Data
 * Data that can be updated in an existing contract
 */
export interface ContractUpdateData extends Partial<ContractData> {
  clientId?: never;
}

// ─── Display & Search ──────────────────────────────────────────────────────────

/**
 * Contract Display Data
 * Simplified data for list views and cards
 */
export interface ContractDisplayData {
  uuid: string;
  clienteName?: string;
  contractTypes: string[];
  planNames: string[];
  paymentMethods: string[];
  startDate: string;
  endDate: string;
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
