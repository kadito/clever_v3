import type { BaseContent, ContentWithRelations, TechnicianUser } from '../base';

/**
 * Activity within a daily record
 * Represents a single work activity with time tracking and optional relations
 */
export interface Activity {
  /** Activity type classification */
  tipoAtividade: 'Interno' | 'Externo';
  /** Client UUID — mandatory for new activities, optional for legacy data */
  clientId?: string;
  /** Activity subject (required) */
  assunto: string;
  /** Start time in HH:MM format (24-hour) */
  horaInicio: string;
  /** End time in HH:MM format (24-hour) */
  horaFim: string;
  /** Break time in minutes */
  tempoPausa: number;
  /** Calculated total hours in HH:MM format */
  totalHoras: string;
  /** Optional activity description */
  descricao?: string;
  /** Link type for optional relations */
  tipoLigacao: 'Nenhuma' | 'Folha de Obra' | 'Assistência Remota';
  /** Work sheet UUID when tipoLigacao is 'Folha de Obra' */
  workSheetId?: string;
  /** Remote assistance UUID when tipoLigacao is 'Assistência Remota' */
  remoteAssistanceId?: string;
}

/**
 * Daily Record Data Interface
 * Complete data structure for daily activity records
 */
export interface DailyRecordData {
  /** Date of the record in ISO format (YYYY-MM-DD) */
  dataRegistro: string;
  /** Array of activities performed on this date */
  atividades: Activity[];
  /** Technician responsible for the daily record (automatically assigned) */
  technician?: TechnicianUser;
}

/**
 * Daily Record Interface
 * Extends BaseContent with daily-records-specific data
 */
export interface DailyRecord extends BaseContent {
  contentType: 'daily-records';
  data: DailyRecordData;
}

/**
 * Daily Record Creation Data
 * Data required to create a new daily record
 */
export interface DailyRecordCreationData extends DailyRecordData {
  // All fields are required for creation
}

/**
 * Daily Record Update Data
 * Data that can be updated in an existing daily record
 */
export interface DailyRecordUpdateData extends Partial<DailyRecordData> {
  // All fields are optional for updates
  dataRegistro?: string;
  atividades?: Activity[];
}

/**
 * Daily Record with resolved relations
 * Returned by API endpoints with automatic relation resolution
 * 
 * Note: Relations for activities are stored with keys like "activity_0_workSheet", "activity_1_remoteAssistance"
 * to maintain compatibility with the standard ContentWithRelations structure
 */
export interface DailyRecordWithRelations extends ContentWithRelations<DailyRecordData> {
  contentType: 'daily-records';
  data: DailyRecordData;
}

/**
 * Daily Record Display Data
 * Simplified data for list views and cards
 */
export interface DailyRecordDisplayData {
  uuid: string;
  dataRegistro: string;
  activityCount: number;
  totalHours: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Daily Record Search Filters
 * Filters for searching and filtering daily records
 */
export interface DailyRecordSearchFilters {
  dateFrom?: string;
  dateTo?: string;
  activityType?: 'Interno' | 'Externo';
  hasWorkSheet?: boolean;
  hasRemoteAssistance?: boolean;
}
