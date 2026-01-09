/**
 * Licenses API routes using the generic content route template
 * Implements full CRUD operations with license-specific validation and sorting
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { Hono } from 'hono';
import { createContentRoutes, createStandardContentConfig, contentErrorHandler } from './content-route-template';
import type { License, LicenseData } from '@clever/shared';
import { 
  validateLicenseCreation, 
  validateLicenseUpdate, 
  sanitizeLicenseData,
  calculateLicenseStatus 
} from '@clever/shared';

/**
 * License-specific validation for create operations
 * Uses the comprehensive validation from shared package
 * Requirements: 8.2 - Content-specific validation logic
 */
function validateLicenseCreate(requestData: any): void {
  // Extract the actual license data from the request
  const licenseData = requestData.data || requestData;
  
  // Sanitize the data first
  const sanitizedData = sanitizeLicenseData(licenseData as LicenseData);
  
  // Use the comprehensive validation from shared package
  const errors = validateLicenseCreation(sanitizedData);
  
  if (errors.length > 0) {
    throw new Error(errors[0]); // Return first error for API response
  }
}

/**
 * License-specific validation for update operations
 * Uses the comprehensive validation from shared package
 * Requirements: 8.2 - Content-specific validation logic
 */
function validateLicenseUpdateData(requestData: any): void {
  // Extract the actual license data from the request
  const licenseData = requestData.data || requestData;
  
  // Use the update validation from shared package
  const errors = validateLicenseUpdate(licenseData as Partial<LicenseData>);
  
  if (errors.length > 0) {
    throw new Error(errors[0]); // Return first error for API response
  }
}

/**
 * Creates searchable text for license content
 * Requirements: 8.5 - Search index with content-specific searchable fields
 */
function createLicenseSearchText(data: LicenseData): string {
  const searchTerms: string[] = [];
  
  // Basic information
  if (data.clientName) searchTerms.push(data.clientName.toLowerCase());
  if (data.versao) searchTerms.push(data.versao.toLowerCase());
  if (data.numeroSerie) searchTerms.push(data.numeroSerie.toLowerCase());
  if (data.modalidade) searchTerms.push(data.modalidade.toLowerCase());
  if (data.duracaoContrato) searchTerms.push(data.duracaoContrato.toLowerCase());
  
  // Software information
  if (data.software?.name) {
    data.software.name.forEach(name => searchTerms.push(name.toLowerCase()));
  }
  if (data.software?.model) searchTerms.push(data.software.model.toLowerCase());
  if (data.software?.product) searchTerms.push(data.software.product.toLowerCase());
  if (data.software?.version) searchTerms.push(data.software.version.toLowerCase());
  if (data.software?.licenseType) searchTerms.push(data.software.licenseType.toLowerCase());
  if (data.software?.modules) {
    data.software.modules.forEach(module => searchTerms.push(module.toLowerCase()));
  }
  
  // Invoice information
  if (data.invoices) {
    data.invoices.forEach(invoice => {
      if (invoice.ano) searchTerms.push(invoice.ano.toLowerCase());
      if (invoice.numeroFatura) searchTerms.push(invoice.numeroFatura.toLowerCase());
    });
  }
  
  return searchTerms.join(' ');
}

// Create the licenses router using the generic template
const licensesRouter = new Hono();

// Apply error handling middleware
licensesRouter.use('*', contentErrorHandler);

// Create license-specific configuration with date-based sorting (most recent first)
// Requirements: 8.6 - Date-based sorting for licenses, content-specific searchable fields
const licenseConfig = createStandardContentConfig<License>('licenses', 'date-desc');

// Override the search text extraction to use the comprehensive license search function
licenseConfig.extractSearchableText = (content: License) => {
  return createLicenseSearchText(content.data);
};

// Override the index fields extraction for license-specific search and display
// Requirements: 8.5 - Search index with content-specific searchable fields
licenseConfig.extractIndexFields = (content: License) => {
  const data = content.data;
  return {
    // Basic information for search and display
    clientId: data.clientId || '',
    clientName: data.clientName || '',
    versao: data.versao || '',
    numeroSerie: data.numeroSerie || '',
    modalidade: data.modalidade || '',
    duracaoContrato: data.duracaoContrato || '',
    
    // License period information
    dataInicio: data.dataInicio || '',
    dataVencimento: data.dataVencimento || '',
    
    // Software information for search and filtering
    software: data.software?.name || [],
    softwareModel: data.software?.model || '',
    softwareProduct: data.software?.product || '',
    softwareVersion: data.software?.version || '',
    softwareLicenseType: data.software?.licenseType || '',
    softwareModules: data.software?.modules || [],
    
    // License status for filtering
    status: calculateLicenseStatus(data.dataVencimento),
    
    // Invoice count for display
    invoiceCount: data.invoices?.length || 0
  };
};

// Add validation functions
licenseConfig.validateCreate = validateLicenseCreate;
licenseConfig.validateUpdate = validateLicenseUpdateData;

// Create and mount the generic CRUD routes
const crudRoutes = createContentRoutes<License>(licenseConfig);
licensesRouter.route('/', crudRoutes);

export default licensesRouter;