import type { ClientData, ClientSoftware, CreateClientInput, UpdateClientInput } from './types';
import { validateRelationFields, sanitizeRelationFields } from '../../relation-validation.js';

/**
 * Validation rules for client data
 * Based on analysis of legacy ClienteForm.vue validation requirements
 */

/**
 * Validates required fields for client creation
 */
export function validateClientCreation(data: ClientData): string[] {
  const errors: string[] = [];

  // Validate relation fields (currently none for clients, but ensures consistency)
  // Requirements: 1.1, 1.3 - Allow creation without validating referenced content exists
  const relationErrors = validateRelationFields('clients', data);
  errors.push(...relationErrors);

  // Required fields
  if (!data.nomeEmpresa?.trim()) {
    errors.push('Nome da empresa é obrigatório');
  }

  if (!data.nomeComercial?.trim()) {
    errors.push('Nome comercial é obrigatório');
  }

  // Validate email formats if provided
  if (data.email && !isValidEmail(data.email)) {
    errors.push('Email inválido');
  }

  if (data.emailContato && !isValidEmail(data.emailContato)) {
    errors.push('Email de contacto inválido');
  }

  // Validate IBAN format if provided
  if (data.iban && !isValidIBAN(data.iban)) {
    errors.push('IBAN inválido');
  }

  // Validate postal code format if provided
  if (data.codigoPostal && !isValidPostalCode(data.codigoPostal)) {
    errors.push('Código postal inválido (formato: 0000-000)');
  }

  // Validate conditional fields
  if (data.atcud) {
    if (data.atUsername && !data.atPassword) {
      errors.push('Password AT é obrigatória quando username AT é fornecido');
    }
  }

  if (data.dumps && data.dumpsLink && !isValidURL(data.dumpsLink)) {
    errors.push('Link do Google Drive inválido');
  }

  // Validate software configurations
  if (data.softwares && Array.isArray(data.softwares)) {
    data.softwares.forEach((software, index) => {
      const softwareErrors = validateSoftware(software, index);
      errors.push(...softwareErrors);
    });
  }

  return errors;
}

/**
 * Validates client data for updates (less strict)
 */
export function validateClientUpdate(data: Partial<ClientData>): string[] {
  const errors: string[] = [];

  // Validate relation fields (currently none for clients, but ensures consistency)
  // Requirements: 1.1, 1.3 - Allow updates without validating referenced content exists
  const relationErrors = validateRelationFields('clients', data as Record<string, any>);
  errors.push(...relationErrors);

  // Only validate provided fields
  if (data.nomeEmpresa !== undefined && !data.nomeEmpresa?.trim()) {
    errors.push('Nome da empresa não pode estar vazio');
  }

  if (data.nomeComercial !== undefined && !data.nomeComercial?.trim()) {
    errors.push('Nome comercial não pode estar vazio');
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push('Email inválido');
  }

  if (data.emailContato && !isValidEmail(data.emailContato)) {
    errors.push('Email de contacto inválido');
  }

  if (data.iban && !isValidIBAN(data.iban)) {
    errors.push('IBAN inválido');
  }

  if (data.codigoPostal && !isValidPostalCode(data.codigoPostal)) {
    errors.push('Código postal inválido (formato: 0000-000)');
  }

  if (data.dumpsLink && !isValidURL(data.dumpsLink)) {
    errors.push('Link do Google Drive inválido');
  }

  // Validate software configurations if provided
  if (data.softwares) {
    data.softwares.forEach((software, index) => {
      const softwareErrors = validateSoftware(software, index);
      errors.push(...softwareErrors);
    });
  }

  return errors;
}

/**
 * Validates individual software configuration
 */
export function validateSoftware(software: ClientSoftware, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Software ${index + 1}: `;

  if (!software.name) {
    errors.push(`${prefix}Nome do software é obrigatório`);
    return errors; // Can't validate further without software name
  }

  // Validate software-specific fields
  switch (software.name) {
    case 'Vectron':
      // Vectron has optional model and nEquipamento
      break;

    case 'Pix':
      // Pix should have a product
      if (!software.product) {
        errors.push(`${prefix}Produto Pix é obrigatório`);
      }

      // Validate modules for products that support them
      if (software.product && pixHasModules(software.product)) {
        if (!software.modules || software.modules.length === 0) {
          // Modules are optional even for products that support them
        }
      }
      break;

    case 'Zone Soft':
      if (!software.product) {
        errors.push(`${prefix}Produto Zone Soft é obrigatório`);
      }

      // Version is required for all products except ZSFACT
      if (software.product && software.product !== 'ZSFACT' && !software.version) {
        errors.push(`${prefix}Versão é obrigatória para ${software.product}`);
      }
      break;

    case 'Pt CERT':
      if (!software.licenseType) {
        errors.push(`${prefix}Tipo de licença é obrigatório para Pt CERT`);
      }
      break;

    case 'Dream Soft':
    case 'Contas Certas':
      // These have no specific required fields beyond the common ones
      break;
  }

  return errors;
}

/**
 * Helper function to check if Pix product supports modules
 */
function pixHasModules(product: string): boolean {
  const productsWithModules = ['Pix rest', 'Pix Gest', 'Pix POS', 'Pix AutoVenda'];
  return productsWithModules.includes(product);
}

/**
 * Email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * IBAN validation (basic format check)
 */
function isValidIBAN(iban: string): boolean {
  // Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();

  // Portuguese IBAN should start with PT and be 25 characters long
  const ibanRegex = /^PT\d{23}$/;
  return ibanRegex.test(cleanIban);
}

/**
 * Portuguese postal code validation
 */
function isValidPostalCode(postalCode: string): boolean {
  const postalCodeRegex = /^\d{4}-\d{3}$/;
  return postalCodeRegex.test(postalCode);
}

/**
 * URL validation
 */
function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes client data for storage
 */
export function sanitizeClientData(data: ClientData): ClientData {
  // First sanitize relation fields using the centralized utility
  // Requirements: 1.4 - Allow null/empty relation IDs for optional relationships
  const sanitizedRelations = sanitizeRelationFields('clients', data);

  return {
    ...sanitizedRelations,
    // Trim string fields
    nomeEmpresa: data.nomeEmpresa?.trim() || '',
    nomeComercial: data.nomeComercial?.trim() || '',
    contribuinte: data.contribuinte?.trim() || undefined,
    responsavel: data.responsavel?.trim() || undefined,
    telefone: data.telefone?.trim() || undefined,
    telefoneContato: data.telefoneContato?.trim() || undefined,
    email: data.email?.trim().toLowerCase() || undefined,
    emailContato: data.emailContato?.trim().toLowerCase() || undefined,
    morada: data.morada?.trim() || undefined,
    codigoPostal: data.codigoPostal?.trim() || undefined,
    localidade: data.localidade?.trim() || undefined,
    iban: data.iban?.replace(/\s/g, '').toUpperCase() || undefined,
    observacoes: data.observacoes?.trim() || undefined,
    seriesDocumentos: data.seriesDocumentos?.trim() || undefined,
    atUsername: data.atUsername?.trim() || undefined,
    atPassword: data.atPassword?.trim() || undefined,
    dumpsLink: data.dumpsLink?.trim() || undefined,
    vectronAddress: data.vectronAddress?.trim() || undefined,

    // Ensure boolean fields are proper booleans
    temAnydesk: Boolean(data.temAnydesk),
    manutencao: Boolean(data.manutencao),
    manutencao24: Boolean(data.manutencao24),
    dumps: Boolean(data.dumps),
    atcud: Boolean(data.atcud),
    vectronConnect: Boolean(data.vectronConnect),

    // Clean software configurations
    softwares: (data.softwares || []).map(software => ({
      ...software,
      numeroSerie: software.numeroSerie?.trim() || undefined,
      versaoSoftware: software.versaoSoftware?.trim() || undefined,
      versaoLicenca: software.versaoLicenca?.trim() || undefined,
      nEquipamento: software.nEquipamento?.trim() || undefined,
    })),
  } as ClientData;
}

/**
 * Creates search text for client indexing
 */
export function createClientSearchText(data: ClientData): string {
  const searchFields = [
    data.nomeEmpresa,
    data.nomeComercial,
    data.contribuinte,
    data.responsavel,
    data.localidade,
    data.telefone,
    data.telefoneContato,
    data.email,
    data.emailContato,
    data.observacoes,
    ...(data.softwares || []).map(s => s.name),
    ...(data.softwares || []).map(s => s.product).filter(Boolean),
    ...(data.softwares || []).map(s => s.model).filter(Boolean),
  ];

  return searchFields
    .filter(field => field && typeof field === 'string')
    .join(' ')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
