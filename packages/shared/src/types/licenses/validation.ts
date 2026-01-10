import type { LicenseData, LicenseSoftware } from './types';
import { validateRelationFields, sanitizeRelationFields } from '../../relation-validation.js';

/**
 * Validates license creation data
 * @param data License data to validate
 * @returns Array of validation error messages in Portuguese
 */
export function validateLicenseCreation(data: LicenseData): string[] {
  const errors: string[] = [];

  // Validate relation fields (clientId) without checking referential integrity
  // This allows license creation with any clientId value, including non-existent clients
  // Requirements: 1.1, 1.3 - Allow creation without validating referenced content exists
  const relationErrors = validateRelationFields('licenses', data);
  errors.push(...relationErrors);

  // Software-specific validation (only if software is provided and has content)
  // Software is optional - empty software arrays are allowed
  if (data.software?.name && data.software.name.length > 0) {
    const softwareErrors = validateSoftwareConfiguration(data.software);
    errors.push(...softwareErrors);
  }

  // Date validation
  if (data.dataInicio && data.dataVencimento) {
    const startDate = new Date(data.dataInicio);
    const endDate = new Date(data.dataVencimento);
    
    if (startDate >= endDate) {
      errors.push('Data de vencimento deve ser posterior à data de início');
    }
  }

  // Invoice validation
  if (data.invoices && data.invoices.length > 0) {
    data.invoices.forEach((invoice, index) => {
      if (invoice.dataFatura && invoice.dataAviso) {
        const invoiceDate = new Date(invoice.dataFatura);
        const noticeDate = new Date(invoice.dataAviso);
        
        if (noticeDate < invoiceDate) {
          errors.push(`Fatura ${index + 1}: Data do aviso deve ser posterior à data da fatura`);
        }
      }
    });
  }

  return errors;
}

/**
 * Validates license update data
 * @param data License data to validate
 * @returns Array of validation error messages in Portuguese
 */
export function validateLicenseUpdate(data: Partial<LicenseData>): string[] {
  const errors: string[] = [];

  // Validate relation fields (clientId) without checking referential integrity
  // This allows license updates with any clientId value, including non-existent clients
  // Requirements: 1.1, 1.3 - Allow updates without validating referenced content exists
  const relationErrors = validateRelationFields('licenses', data as Record<string, any>);
  errors.push(...relationErrors);

  // Only validate software if it's being updated and has content
  if (data.software !== undefined) {
    // Software-specific validation if software is being updated and has content
    // Software is optional - empty software arrays are allowed
    if (data.software.name && data.software.name.length > 0) {
      const softwareErrors = validateSoftwareConfiguration(data.software);
      errors.push(...softwareErrors);
    }
  }

  // Date validation if both dates are provided
  if (data.dataInicio && data.dataVencimento) {
    const startDate = new Date(data.dataInicio);
    const endDate = new Date(data.dataVencimento);
    
    if (startDate >= endDate) {
      errors.push('Data de vencimento deve ser posterior à data de início');
    }
  }

  return errors;
}

/**
 * Validates software configuration based on selected software types
 * @param software Software configuration to validate
 * @returns Array of validation error messages in Portuguese
 */
function validateSoftwareConfiguration(software: Partial<LicenseSoftware>): string[] {
  const errors: string[] = [];

  // If no name is provided or it's empty, skip validation
  if (!software.name || software.name.length === 0) {
    return errors;
  }

  // Vectron-specific validation
  if (software.name.includes('Vectron')) {
    // Vectron validation is optional - model and equipment number are not required
  }

  // Pix-specific validation
  if (software.name.includes('Pix')) {
    // Pix validation is optional - product and modules are not required
    if (software.product && software.modules) {
      const productsWithModules = ['Pix rest', 'Pix Gest', 'Pix POS', 'Pix AutoVenda'];
      if (!productsWithModules.includes(software.product) && software.modules.length > 0) {
        errors.push('Módulos só são aplicáveis para Pix rest, Pix Gest, Pix POS e Pix AutoVenda');
      }
    }
  }

  // Zon Soft-specific validation
  if (software.name.includes('Zon Soft')) {
    // Zon Soft validation is optional - product and version are not required
    if (software.product === 'ZSFACT' && software.version) {
      errors.push('ZSFACT não tem versões específicas');
    }
  }

  // Pt CERT-specific validation
  if (software.name.includes('Pt CERT')) {
    // Pt CERT validation is optional - license type is not required
  }

  return errors;
}

/**
 * Sanitizes license data by trimming strings and normalizing values
 * @param data License data to sanitize
 * @returns Sanitized license data
 */
export function sanitizeLicenseData(data: Partial<LicenseData>): Partial<LicenseData> {
  // First sanitize relation fields using the centralized utility
  // Requirements: 1.4 - Allow null/empty relation IDs for optional relationships
  const sanitizedRelations = sanitizeRelationFields('licenses', data);
  
  return {
    ...sanitizedRelations,
    clientName: data.clientName?.trim() || undefined,
    versao: data.versao?.trim() || undefined,
    numeroSerie: data.numeroSerie?.trim() || undefined,
    modalidade: data.modalidade?.trim() || undefined,
    duracaoContrato: data.duracaoContrato?.trim() || undefined,
    software: data.software ? sanitizeSoftwareData(data.software) : undefined,
    invoices: data.invoices?.map(invoice => ({
      ...invoice,
      ano: invoice.ano?.trim() || undefined,
      numeroFatura: invoice.numeroFatura?.trim() || undefined
    })) || undefined
  } as Partial<LicenseData>;
}

/**
 * Sanitizes software configuration data
 * @param software Software data to sanitize
 * @returns Sanitized software data
 */
function sanitizeSoftwareData(software: Partial<LicenseSoftware>): Partial<LicenseSoftware> {
  return {
    ...software,
    name: software.name || [],
    model: software.model?.trim() || undefined,
    nEquipamento: software.nEquipamento?.trim() || undefined,
    product: software.product?.trim() || undefined,
    version: software.version?.trim() || undefined,
    licenseType: software.licenseType?.trim() || undefined,
    numeroSerie: software.numeroSerie?.trim() || undefined,
    versaoSoftware: software.versaoSoftware?.trim() || undefined,
    versaoLicenca: software.versaoLicenca?.trim() || undefined,
    modules: software.modules || []
  };
}

/**
 * Calculates license status based on expiration date
 * @param dataVencimento Expiration date string
 * @returns License status
 */
export function calculateLicenseStatus(dataVencimento?: string): 'active' | 'expiring' | 'expired' {
  if (!dataVencimento) {
    return 'active';
  }

  const today = new Date();
  const expirationDate = new Date(dataVencimento);
  const diffTime = expirationDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'expired';
  } else if (diffDays <= 30) {
    return 'expiring';
  } else {
    return 'active';
  }
}