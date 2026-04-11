import type { BaseContent } from '../base';
import type { TechnicianUser } from '../../types';

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
