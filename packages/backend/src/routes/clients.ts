/**
 * Clients API routes using the generic content route template
 * Demonstrates the implementation pattern for content-specific routes
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { Hono } from 'hono';
import { createContentRoutes, createClientContentConfig, contentErrorHandler } from './content-route-template';
import type { BaseContent } from '@clever/shared';

/**
 * Client content interface extending BaseContent
 * Based on analysis of old_src/views/clientes/ components
 */
export interface ClientContent extends BaseContent {
  contentType: 'clients';
  data: {
    // Basic company information
    nomeEmpresa: string;
    nomeComercial?: string;
    contribuinte?: string;
    localidade?: string;
    
    // Contact information
    responsavel?: string;
    telefoneContato?: string;
    email?: string;
    
    // Address information
    morada?: string;
    codigoPostal?: string;
    
    // Additional fields based on legacy analysis
    // These will be populated when analyzing old_src components
    [key: string]: any;
  };
}

/**
 * Client-specific validation for create operations
 */
function validateClientCreate(data: any): void {
  if (!data.nomeEmpresa || typeof data.nomeEmpresa !== 'string' || data.nomeEmpresa.trim() === '') {
    throw new Error('Nome da empresa é obrigatório');
  }
  
  // Validate email format if provided
  if (data.email && typeof data.email === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Formato de email inválido');
    }
  }
  
  // Validate phone format if provided (Portuguese format)
  if (data.telefoneContato && typeof data.telefoneContato === 'string') {
    const phoneRegex = /^(\+351\s?)?[0-9]{9}$/;
    if (!phoneRegex.test(data.telefoneContato.replace(/\s/g, ''))) {
      throw new Error('Formato de telefone inválido (deve ter 9 dígitos)');
    }
  }
  
  // Validate NIF (Portuguese tax number) if provided
  if (data.contribuinte && typeof data.contribuinte === 'string') {
    const nifRegex = /^[0-9]{9}$/;
    if (!nifRegex.test(data.contribuinte)) {
      throw new Error('NIF deve ter 9 dígitos');
    }
  }
}

/**
 * Client-specific validation for update operations
 */
function validateClientUpdate(data: any): void {
  // For updates, fields are optional but must be valid if provided
  if (data.nomeEmpresa !== undefined) {
    if (!data.nomeEmpresa || typeof data.nomeEmpresa !== 'string' || data.nomeEmpresa.trim() === '') {
      throw new Error('Nome da empresa não pode estar vazio');
    }
  }
  
  if (data.email !== undefined && data.email !== null && data.email !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Formato de email inválido');
    }
  }
  
  if (data.telefoneContato !== undefined && data.telefoneContato !== null && data.telefoneContato !== '') {
    const phoneRegex = /^(\+351\s?)?[0-9]{9}$/;
    if (!phoneRegex.test(data.telefoneContato.replace(/\s/g, ''))) {
      throw new Error('Formato de telefone inválido (deve ter 9 dígitos)');
    }
  }
  
  if (data.contribuinte !== undefined && data.contribuinte !== null && data.contribuinte !== '') {
    const nifRegex = /^[0-9]{9}$/;
    if (!nifRegex.test(data.contribuinte)) {
      throw new Error('NIF deve ter 9 dígitos');
    }
  }
}

// Create the clients router using the generic template
const clientsRouter = new Hono();

// Apply error handling middleware
clientsRouter.use('*', contentErrorHandler);

// Create client-specific configuration with alphabetical sorting
const clientConfig = createClientContentConfig<ClientContent>();

// Add validation functions
clientConfig.validateCreate = validateClientCreate;
clientConfig.validateUpdate = validateClientUpdate;

// Create and mount the generic CRUD routes
const crudRoutes = createContentRoutes<ClientContent>(clientConfig);
clientsRouter.route('/', crudRoutes);

export default clientsRouter;