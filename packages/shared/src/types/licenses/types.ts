import type { BaseContent } from '../../types';

// Software configuration interface for licenses
export interface LicenseSoftware {
  // Software names (multi-select)
  name: string[];

  // Vectron-specific fields
  model?: string; // Vectron Wide 14", Vectron Pos 7, etc.
  nEquipamento?: string; // Equipment number

  // Pix-specific fields
  product?: string; // Pix rest, Pix Gest, Pix POS, etc.
  modules?: string[]; // Modulo 1, Modulo 2, Modulo 3, Posto adicional

  // Zon Soft-specific fields
  version?: string; // Pro, Lite, Basic (for non-ZSFACT products)

  // Pt CERT-specific fields
  licenseType?: string; // Licença Definitiva, Licença Anual

  // Common fields (all software types)
  numeroSerie?: string;
  versaoSoftware?: string;
  versaoLicenca?: string;
}

// Invoice information interface
export interface LicenseInvoice {
  id: number;
  ano?: string;
  numeroFatura?: string;
  dataFatura?: string;
  dataAviso?: string;
}

// License data structure - clean modern design
export interface LicenseData {
  // Basic Information
  clientId: string; // Client UUID (required) - stores reference to client
  clientName?: string; // Client name for display (optional, derived from clientId)
  versao?: string; // Software version
  numeroSerie?: string; // Serial number

  // License Period
  dataInicio?: string; // Start date
  dataVencimento?: string; // Expiration date
  modalidade?: string; // ANUAL, SEMESTRAL, TRIMESTRAL, MENSAL
  duracaoContrato?: string; // Contract duration (e.g., "12 meses")

  // Software Configuration
  software: LicenseSoftware;

  // Invoice Information
  invoices: LicenseInvoice[];
}

// Main License interface extending BaseContent
export interface License extends BaseContent {
  contentType: 'licenses';
  data: LicenseData;
}

// API Response types
export interface LicenseListItem {
  uuid: string;
  clientId: string; // Client UUID
  clientName: string; // Client name for display
  software: string[]; // Software names for display
  versao?: string;
  dataVencimento?: string;
  status: 'active' | 'expiring' | 'expired';
  createdAt: string;
  updatedAt: string;
}

// Search index item structure
export interface LicenseIndexItem {
  uuid: string;
  contentType: 'licenses';
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;

  // Searchable fields
  searchableText: string;
  clientId: string; // Client UUID
  clientName: string; // Client name for search
  software: string[]; // Software names
  versao?: string;
  numeroSerie?: string;
  modalidade?: string;
  status: 'active' | 'expiring' | 'expired';
}

// Software options for forms
export const SOFTWARE_OPTIONS = [
  { value: 'Vectron', label: 'Vectron' },
  { value: 'Pix', label: 'Pix' },
  { value: 'Zon Soft', label: 'Zon Soft' },
  { value: 'Pt CERT', label: 'Pt CERT' },
  { value: 'Dream Soft', label: 'Dream Soft' },
  { value: 'Contas Certas', label: 'Contas Certas' },
  { value: 'Publicidade', label: 'Publicidade' },
  { value: 'Software XD', label: 'Software XD' },
  { value: 'AIR Menu', label: 'AIR Menu' },
  { value: 'Cashlogy', label: 'Cashlogy' },
] as const;

// Vectron model options
export const VECTRON_MODELS = [
  'Vectron Wide 14"',
  'Vectron Pos 7',
  'Vectron Pos PC',
  'Vectron Pos Touch K6',
  'Vectron Pos Touch K5 15"',
  'Vectron Pos Touch K5 12"',
  'Vectron Mobil Pro III',
  'Vectron Mobil Pro IV',
] as const;

// Pix product options
export const PIX_PRODUCTS = [
  'Pix rest',
  'Pix Gest',
  'Pix POS',
  'Pix AutoVenda',
  'Pix Orders',
  'Pix Order Posto adicional',
  'Pix Monitor Pedidos',
  'Pix RestFest',
] as const;

// Pix modules
export const PIX_MODULES = ['Modulo 1', 'Modulo 2', 'Modulo 3', 'Posto adicional'] as const;

// Zon Soft products
export const ZONSOFT_PRODUCTS = [
  'ZSFACT',
  'ZSGO',
  'ZSPOS',
  'ZSPOS MOBILE (ANDRIOD)',
  'ZSREST',
] as const;

// Zon Soft versions
export const ZONSOFT_VERSIONS = ['Pro', 'Lite', 'Basic'] as const;

// Pt CERT license types
export const PTCERT_LICENSE_TYPES = ['Licença Definitiva', 'Licença Anual'] as const;

// License modalities
export const LICENSE_MODALITIES = ['ANUAL', 'SEMESTRAL', 'TRIMESTRAL', 'MENSAL'] as const;
