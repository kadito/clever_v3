import type { BaseContent } from '../base';

/**
 * Software configuration for a client
 * Based on analysis of legacy ClienteDetail.vue and ClienteForm.vue
 */
export interface ClientSoftware {
  id: number;
  name: 'Vectron' | 'Pix' | 'Zone Soft' | 'Pt CERT' | 'Dream Soft' | 'Contas Certas';

  // Vectron-specific fields
  model?: string; // Vectron models: Wide 14, Pos 7, Pos PC, etc.
  nEquipamento?: string; // Equipment number

  // Pix-specific fields
  product?: string; // Pix rest, Pix Gest, Pix POS, etc.
  modules?: string[]; // Module 1, Module 2, Module 3, Posto adicional

  // Zone Soft-specific fields
  version?: string; // Pro, Lite, Basic (not for ZSFACT)

  // Pt CERT-specific fields
  licenseType?: string; // Licença Definitiva, Licença Anual

  // Common fields (all except Vectron)
  numeroSerie?: string;
  versaoSoftware?: string;
  versaoLicenca?: string;
}

/**
 * Client data structure
 * Based on analysis of legacy ClienteDetail.vue and ClienteForm.vue
 */
export interface ClientData {
  // Basic Information
  nomeEmpresa: string; // Required - Company name
  nomeComercial: string; // Required - Commercial name
  contribuinte?: string; // Tax ID (NIF)
  responsavel?: string; // Responsible person

  // Contact Information
  telefone?: string;
  telefoneContato?: string; // Contact phone
  email?: string;
  emailContato?: string; // Contact email

  // Address Information
  morada?: string; // Address (multiline)
  codigoPostal?: string; // Postal code (0000-000 format)
  localidade?: string; // Location/City

  // Financial Information
  iban?: string; // Bank account

  // Software Configuration (new structure)
  softwares: ClientSoftware[];

  // Services (boolean flags)
  temAnydesk: boolean;
  manutencao: boolean; // Maintenance
  manutencao24: boolean; // 24h Maintenance
  dumps: boolean;
  atcud: boolean;
  vectronConnect: boolean;

  // Conditional fields based on services
  // DUMPS conditional field
  dumpsLink?: string; // Google Drive link

  // ATCUD conditional fields
  seriesDocumentos?: string; // Document series
  atUsername?: string; // AT username
  atPassword?: string; // AT password

  // Vectron Connect conditional field
  vectronAddress?: string; // Vectron address (IP or domain)

  // Additional Information
  observacoes?: string; // Notes/observations

  // Contract reference (1:1 relationship — populated by backend)
  contractId?: string;

  // Legacy fields for backward compatibility
  vectron?: boolean;
  dreamSoft?: boolean;
  ptcert?: boolean;
  pix?: boolean;
  zsrest?: boolean;
  contasCertas?: boolean;
  atClient?: string; // Legacy AT client field
}

/**
 * Complete Client interface extending BaseContent
 */
export interface Client extends BaseContent {
  contentType: 'clients';
  data: ClientData;
}

/**
 * Client creation input (without BaseContent fields)
 */
export interface CreateClientInput {
  data: ClientData;
}

/**
 * Client update input (partial data)
 */
export interface UpdateClientInput {
  data: Partial<ClientData>;
}

/**
 * Client search/list response item
 * Optimized for list views and search results
 */
export interface ClientListItem {
  uuid: string;
  contentType: 'clients';
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;

  // Key display fields for list view
  nomeEmpresa: string;
  nomeComercial: string;
  contribuinte?: string;
  localidade?: string;
  responsavel?: string;
  telefoneContato?: string;
  email?: string;

  // Service flags for quick filtering
  temAnydesk: boolean;
  manutencao: boolean;
  manutencao24: boolean;
  atcud: boolean;
  dumps: boolean;
  vectronConnect: boolean;

  // Software summary for search
  softwareNames: string[]; // Array of software names
}
