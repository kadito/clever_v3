/**
 * Clients API routes using the generic content route template
 * Implements full CRUD operations with client-specific validation and sorting
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { Hono } from 'hono';
import {
  createContentRoutes,
  createClientContentConfig,
  contentErrorHandler,
} from './content-route-template';
import type { Client, ClientData } from '@clever/shared';
import {
  validateClientCreation,
  validateClientUpdate,
  sanitizeClientData,
  createClientSearchText,
} from '@clever/shared';

/**
 * Client-specific validation for create operations
 * Uses the comprehensive validation from shared package
 * Requirements: 8.2 - Content-specific validation logic
 */
function validateClientCreate(requestData: any): void {
  // Extract the actual client data from the request
  const clientData = requestData.data || requestData;

  // Sanitize the data first
  const sanitizedData = sanitizeClientData(clientData as ClientData);

  // Use the comprehensive validation from shared package
  const errors = validateClientCreation(sanitizedData);

  if (errors.length > 0) {
    throw new Error(errors[0]); // Return first error for API response
  }
}

/**
 * Client-specific validation for update operations
 * Uses the comprehensive validation from shared package
 * Requirements: 8.2 - Content-specific validation logic
 */
function validateClientUpdateData(requestData: any): void {
  // Extract the actual client data from the request
  const clientData = requestData.data || requestData;

  // Use the update validation from shared package
  const errors = validateClientUpdate(clientData as Partial<ClientData>);

  if (errors.length > 0) {
    throw new Error(errors[0]); // Return first error for API response
  }
}

// Create the clients router using the generic template
const clientsRouter = new Hono();

// Apply error handling middleware
clientsRouter.use('*', contentErrorHandler);

// Create client-specific configuration with alphabetical sorting and search functionality
// Requirements: 8.6 - Alphabetical sorting for clients, content-specific searchable fields
const clientConfig = createClientContentConfig<Client>();

// Override the search text extraction to use the comprehensive client search function
clientConfig.extractSearchableText = (content: Client) => {
  return createClientSearchText(content.data);
};

// Override the index fields extraction for client-specific search and display
// Requirements: 8.5 - Search index with content-specific searchable fields
clientConfig.extractIndexFields = (content: Client) => {
  const data = content.data;
  return {
    // Basic information for search and display
    nomeEmpresa: data.nomeEmpresa || '',
    nomeComercial: data.nomeComercial || '',
    contribuinte: data.contribuinte || '',
    localidade: data.localidade || '',
    responsavel: data.responsavel || '',
    telefoneContato: data.telefoneContato || '',
    email: data.email || '',
    emailContato: data.emailContato || '',

    // Service flags for filtering
    temAnydesk: data.temAnydesk || false,
    manutencao: data.manutencao || false,
    manutencao24: data.manutencao24 || false,
    atcud: data.atcud || false,
    dumps: data.dumps || false,
    vectronConnect: data.vectronConnect || false,

    // Software information for search
    softwareNames: data.softwares?.map(s => s.name) || [],
    softwareProducts: data.softwares?.map(s => s.product).filter(Boolean) || [],
  };
};

// Add validation functions
clientConfig.validateCreate = validateClientCreate;
clientConfig.validateUpdate = validateClientUpdateData;

// Create and mount the generic CRUD routes
const crudRoutes = createContentRoutes<Client>(clientConfig);
clientsRouter.route('/', crudRoutes);

export default clientsRouter;
