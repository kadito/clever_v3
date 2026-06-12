import type { BaseContent } from '../base';
import type { TechnicianUser } from '../../types';

/**
 * Centralized pricing constants for Work Sheets.
 * Single source of truth — referenced by shared validation, frontend views, and backend index extraction.
 */
export const WORK_SHEET_CONSTANTS = {
  /** Hourly rate for weekdays (€) */
  HOURLY_RATE_WEEKDAY: 55.0,
  /** Hourly rate for weekends/holidays (€) */
  HOURLY_RATE_WEEKEND_HOLIDAY: 70.0,
  /** Mileage rate per km (€) */
  MILEAGE_RATE_PER_KM: 0.45,
  /** Travel fee for distances up to 180km (€) */
  TRAVEL_FEE_SHORT: 45.0,
  /** Travel fee for distances over 180km (€) */
  TRAVEL_FEE_LONG: 60.0,
  /** Distance threshold for travel fee tiers (km) */
  TRAVEL_FEE_THRESHOLD_KM: 180,
  /** Minimum chargeable time in hours */
  MINIMUM_HOURS: 1,
  /** VAT rate */
  IVA_RATE: 0.23,
} as const;

// Client information is now handled through relations (clientId -> resolved client data)

/**
 * Work Sheet Request Data Interface
 * Request information section from the legacy form
 */
export interface WorkSheetRequestData {
  date: string; // DATA DO PEDIDO (ISO date string)
  receivedBy: string; // RECEÇÃO DO PEDIDO
  assistanceDate: string; // DATA DA ASSISTÊNCIA (ISO date string)
  reason: string; // MOTIVO DO PEDIDO
  arrivalTime: string; // HORA CHEGADA (HH:MM format)
  departureTime: string; // HORA SAÍDA (HH:MM format)
  totalHours: string; // TOTAL HORAS (calculated automatically)
}

/**
 * Work Sheet Displacement Data Interface
 * Displacement and pricing information section
 */
export interface WorkSheetDisplacementData {
  hasDisplacement: boolean; // DESLOCAÇÃO (SIM/NÃO)
  weekendHoliday: boolean; // FINAL SEMANA - FERIADO
  oneWayKms: number; // KMS (IDA)
  totalKms: number; // TOTAL KMS (IDA E VOLTA) - calculated automatically
  paymentMethod: 'PENDENTE' | 'CARTÃO MB' | 'DINHEIRO' | 'TRANSFERÊNCIA BANCÁRIA' | 'CONTRATO' | 'GARANTIA'; // MÉTODO DE PAGAMENTO
}

/**
 * Work Sheet Other Data Interface
 * Service details, technical operations, and additional information
 */
export interface WorkSheetOtherData {
  serviceType: 'ASSISTÊNCIA PRESENCIAL' | 'MANUTENÇÃO' | 'INSTALAÇÃO' | ''; // TIPO DE SERVIÇO
  technician: TechnicianUser; // TÉCNICO RESPONSÁVEL - Changed from string to TechnicianUser object
  serviceObservations?: string; // OBSERVAÇÕES DO SERVIÇO

  // Warranty & Contract (shown only when payment method is CONTRATO)
  warranty: boolean; // GARANTIA
  contract: boolean; // CONTRATO
  contractYear: string; // ANO DE CONTRATO

  // Material & Equipment
  materialUsed: boolean; // MATERIAL UTILIZADO
  materialDetails?: string; // DESCRIÇÃO DO MATERIAL UTILIZADO
  equipment: boolean; // EQUIPAMENTOS
  equipmentDetails?: string; // DESCRIÇÃO DOS EQUIPAMENTOS

  // Service Status & Technical Operations
  totallyResolved: boolean; // TOTALMENTE RESOLVIDO
  resolutionIssues?: string; // OBSERVAÇÕES SOBRE PROBLEMAS NÃO RESOLVIDOS
  dumpReading: boolean; // LEITURA DE DUMP
  backup: boolean; // CÓPIA DE SEGURANÇA
  remoteAccessCheck: boolean; // VERIFICAÇÃO DO ACESSO REMOTO
  anydesk: boolean; // ANYDESK

  // Service Report
  serviceReport: string; // DESCRIÇÃO DETALHADA DO SERVIÇO

  // Client Signature
  clientSignature?: string; // ASSINATURA DO CLIENTE (base64 PNG image data)
}

/**
 * Snapshot of pricing rates captured at Work Sheet creation time.
 * Once stored, these rates are NEVER updated — they anchor the price to creation-time values.
 */
export interface WorkSheetPricingSnapshot {
  /** Rates active at creation time */
  rates: {
    hourlyRateWeekday: number;       // from WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKDAY
    hourlyRateWeekendHoliday: number; // from WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKEND_HOLIDAY
    mileageRatePerKm: number;        // from WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM
    travelFeeShort: number;          // from WORK_SHEET_CONSTANTS.TRAVEL_FEE_SHORT
    travelFeeLong: number;           // from WORK_SHEET_CONSTANTS.TRAVEL_FEE_LONG
    travelFeeThresholdKm: number;    // from WORK_SHEET_CONSTANTS.TRAVEL_FEE_THRESHOLD_KM
    minimumHours: number;            // from WORK_SHEET_CONSTANTS.MINIMUM_HOURS
  };
  /** Calculated totals using anchored rates */
  calculated: {
    hourlyRate: number;     // effective rate used (weekday or weekend)
    laborHours: number;     // hours charged (min 1h applied)
    laborPrice: number;     // laborHours × hourlyRate
    travelFee: number;      // 0 if no displacement
    mileagePrice: number;   // 0 if no displacement
    totalPrice: number;     // laborPrice + travelFee + mileagePrice
  };
}

/**
 * Work Sheet Data Interface
 * Complete data structure for work sheets based on legacy analysis
 */
export interface WorkSheetData {
  // Client relationship
  clientId: string;

  // Contract relationship (optional - only when payment method is CONTRATO)
  contractId?: string;

  // Main data sections
  request: WorkSheetRequestData;
  displacement: WorkSheetDisplacementData;
  otherData: WorkSheetOtherData;

  /** Pricing snapshot anchored at creation time. Absent for legacy records. */
  pricingSnapshot?: WorkSheetPricingSnapshot;
}

/**
 * Work Sheet Interface
 * Extends BaseContent with work-sheet-specific data
 */
export interface WorkSheet extends BaseContent {
  contentType: 'work-sheets';
  data: WorkSheetData;
}

/**
 * Work Sheet Creation Data
 * Data required to create a new work sheet
 */
export interface WorkSheetCreationData extends WorkSheetData {
  // All fields are required for creation
}

/**
 * Work Sheet Update Data
 * Data that can be updated in an existing work sheet
 */
export interface WorkSheetUpdateData extends Partial<WorkSheetData> {
  // clientId can be changed during updates (unlike contracts)
  clientId?: string;
}

/**
 * Work Sheet Display Data
 * Simplified data for list views and cards
 */
export interface WorkSheetDisplayData {
  uuid: string;
  clientName: string;
  serviceType: string;
  technician: string; // Display name extracted from TechnicianUser object
  assistanceDate: string;
  totalHours: string;
  hasDisplacement: boolean;
  totallyResolved: boolean;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Work Sheet Search Filters
 * Filters for searching and filtering work sheets
 */
export interface WorkSheetSearchFilters {
  clientName?: string;
  technician?: string;
  serviceType?: 'ASSISTÊNCIA PRESENCIAL' | 'MANUTENÇÃO' | 'INSTALAÇÃO';
  paymentMethod?: 'PENDENTE' | 'CARTÃO MB' | 'DINHEIRO' | 'TRANSFERÊNCIA BANCÁRIA' | 'CONTRATO' | 'GARANTIA';
  contractId?: string;
  assistanceDateFrom?: string;
  assistanceDateTo?: string;
  hasDisplacement?: boolean;
  totallyResolved?: boolean;
  weekendHoliday?: boolean;
  materialUsed?: boolean;
  equipment?: boolean;
}
