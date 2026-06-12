import type { BaseContent } from '../base';
import type { TechnicianUser } from '../../types';
import type { FileReference } from '../../file-validation';

/**
 * Snapshot of pricing rates captured at Remote Assistance creation time.
 * Once stored, these rates are NEVER updated.
 */
export interface RemoteAssistancePricingSnapshot {
  /** Rates active at creation time */
  rates: {
    priceBusinessHours: number;
    priceAfterHours: number;
    billingIncrementMinutes: number;
    businessHoursMorningStart: number;
    businessHoursMorningEnd: number;
    businessHoursAfternoonStart: number;
    businessHoursAfternoonEnd: number;
  };
  /** Calculated totals using anchored rates */
  calculated: {
    totalValue: number;
    businessHoursValue: number;
    offHoursValue: number;
    totalMinutes: number;
    billingMinutes: number;
    businessMinutes: number;
    offHoursMinutes: number;
    isZeroCost: boolean;
  };
}

/**
 * Remote Assistance Data Interface
 * Based on analysis of old_src/views/assistencias-remotas/AssistenciasRemotasDetail.vue and AssistenciasRemotasForm.vue
 *
 * Requirements: 7.3, 7.4, 7.5
 */
export interface RemoteAssistanceData {
  // Client relationship
  clientId: string;
  clienteName?: string; // Optional - client data should be resolved through relations

  // Contract relationship (optional - only when payment method is Contrato)
  contractId?: string;

  // Basic Information
  tipoAssistencia: 'REMOTA' | 'TELEFÓNICA' | 'TELEMÓVEL' | '';
  tecnicoResponsavel: TechnicianUser; // Changed from string to TechnicianUser object

  // Date and Time Information
  dataPedido: string; // ISO date string - required
  dataAssistencia: string; // ISO date string - required
  inicioAssistencia: string; // ISO date string with time
  fimAssistencia: string; // ISO date string with time
  horasTotais?: string; // Calculated field - format HH:MM

  // Description Fields
  motivoPedido: string;
  relatorioAssistencia: string;

  // Value Fields
  valorAssist: number; // Calculated value based on time and business rules

  // Payment Method (required field)
  paymentMethod: 'Contrato' | 'Faturação' | 'Garantia' | '';

  // Status Fields
  resolvido: boolean; // Required field
  relatorio?: string; // Conditional field - required when resolvido is false
  anexos: string;

  // File attachments — structured references to files stored in R2
  anexosFiles: FileReference[];

  /** Pricing snapshot anchored at creation time. Absent for legacy records. */
  pricingSnapshot?: RemoteAssistancePricingSnapshot;
}

/**
 * Remote Assistance Interface
 * Extends BaseContent with remote assistance specific data
 */
export interface RemoteAssistance extends BaseContent {
  contentType: 'remote-assistance';
  data: RemoteAssistanceData;
}

/**
 * Remote Assistance Creation Data
 * Data required to create a new remote assistance
 */
export interface RemoteAssistanceCreationData extends Omit<RemoteAssistanceData, 'clienteName'> {
  // clienteName is optional for creation as it can be derived from clientId
  clienteName?: string;
}

/**
 * Remote Assistance Update Data
 * Data that can be updated in an existing remote assistance
 */
export interface RemoteAssistanceUpdateData extends Partial<RemoteAssistanceData> {
  // clientId can be changed during updates (unlike contracts)
}

/**
 * Remote Assistance Display Data
 * Simplified data for list views and cards
 */
export interface RemoteAssistanceDisplayData {
  uuid: string;
  assistNumero: string; // Generated assistance number for display
  clienteName?: string; // Optional - should be resolved through relations
  tipoAssistencia: string;
  tecnicoResponsavel: string; // Display name extracted from TechnicianUser object
  dataAssistencia: string;
  valorAssist: number;
  paymentMethod: string; // Display payment method
  resolvido: boolean;
  motivoPedido: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Remote Assistance Search Filters
 * Filters for searching and filtering remote assistance
 */
export interface RemoteAssistanceSearchFilters {
  clientName?: string;
  tipoAssistencia?: 'REMOTA' | 'TELEFÓNICA' | 'TELEMÓVEL';
  tecnicoResponsavel?: string;
  dataAssistenciaFrom?: string;
  dataAssistenciaTo?: string;
  paymentMethod?: 'Contrato' | 'Faturação' | 'Garantia';
  contractId?: string;
  resolvido?: boolean;
  valorMin?: number;
  valorMax?: number;
  year?: string; // For year-based filtering
}

/**
 * Time Validation Result
 * Result of time format and business rule validation
 */
export interface TimeValidationResult {
  isValid: boolean;
  errors: string[];
  formattedTime?: string; // Rounded to nearest 15-minute interval
}

/**
 * Value Calculation Result
 * Result of automatic value calculation based on time and business rules
 */
export interface ValueCalculationResult {
  totalValue: number;
  businessHoursValue: number;
  afterHoursValue: number;
  totalHours: number;
  businessHours: number;
  afterHours: number;
  breakdown: {
    hour: number;
    rate: number;
    value: number;
    isBusinessHours: boolean;
  }[];
}

/**
 * Business Rules Constants
 * Constants for remote assistance business logic
 */
export const REMOTE_ASSISTANCE_CONSTANTS = {
  /** Business hours rate (€/hour) */
  PRICE_BUSINESS_HOURS: 45.0,
  /** Off-hours/weekends/holidays rate (€/hour) */
  PRICE_AFTER_HOURS: 60.0,

  /** Business hours windows (morning) */
  BUSINESS_HOURS_MORNING_START: 9 * 60, // 09:00 in minutes
  BUSINESS_HOURS_MORNING_END: 12 * 60 + 30, // 12:30 in minutes
  /** Business hours windows (afternoon) */
  BUSINESS_HOURS_AFTERNOON_START: 14 * 60 + 30, // 14:30 in minutes
  BUSINESS_HOURS_AFTERNOON_END: 18 * 60, // 18:00 in minutes

  /** Billing increment in minutes */
  BILLING_INCREMENT_MINUTES: 15,

  /** VAT rate */
  IVA_RATE: 0.23,

  /** Valid billing minute intervals */
  VALID_MINUTES: [0, 15, 30, 45] as const,

  // Assistance types
  ASSISTANCE_TYPES: ['REMOTA', 'TELEFÓNICA'] as const,
} as const;

/**
 * Type for assistance types
 */
export type AssistanceType = (typeof REMOTE_ASSISTANCE_CONSTANTS.ASSISTANCE_TYPES)[number];

/**
 * Type for valid minutes
 */
export type ValidMinute = (typeof REMOTE_ASSISTANCE_CONSTANTS.VALID_MINUTES)[number];
