/**
 * Contracts API routes using the generic content route template
 * Implements full CRUD operations with contract-specific validation and sorting
 * Integrates with balance system for automatic transaction processing
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 12.1, 12.2
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import {
  createContentRoutes,
  createStandardContentConfig,
  contentErrorHandler,
} from './content-route-template';
import type {
  Contract,
  Client,
  ContractData,
  ContractCreationData,
  ContractUpdateData,
  StorageBucket,
  ApiResponse,
  ContentWithRelations,
} from '@clever/shared';
import {
  getContractSummary,
  hasActiveContract,
  ContentStorageService,
  // Note: sanitizeContractData will be added when contract validation is fully implemented
} from '@clever/shared';
import { createBalanceService } from '../services/balance-service';
import { createBalanceMiddleware } from '../middleware/balance-middleware';
import { requireDeletePermission } from '../middleware/permissions';
import { requireUserContext } from '../middleware/clerk';

/**
 * Temporary direct implementation of contract validation to avoid import conflicts
 * TODO: Fix the shared package exports to properly expose specific validation functions
 */
function validateContractCreationDirect(data: ContractCreationData): string[] {
  const errors: string[] = [];

  // Basic validation
  if (!data.clientId?.trim()) {
    errors.push('Por favor, selecione um cliente');
  }

  // Must have at least one contract type
  if (!data.hasCPAContract && !data.hasSHContract) {
    errors.push('Por favor, selecione pelo menos um tipo de contrato (CPA e/ou S&H)');
  }

  // CPA Contract validation
  if (data.hasCPAContract) {
    if (!data.cpaContractType) {
      errors.push('Por favor, selecione o tipo de contrato CPA');
    }

    if (!data.planIdCPA) {
      errors.push('Por favor, selecione um plano CPA');
    }

    if (!data.modalidadePagamentoCPA) {
      errors.push('Por favor, selecione a modalidade de pagamento CPA');
    }

    // Distance is only required for CPA (2023), not CPA_1500
    if (data.cpaContractType === 'CPA' && !data.distanceCPA) {
      errors.push('Por favor, selecione a distância para contratos CPA (2023)');
    }

    // Validate CPA equipment
    if (!data.cpaEquipments || data.cpaEquipments.length === 0) {
      errors.push('Por favor, adicione pelo menos um equipamento CPA');
    }
  }

  // S&H Contract validation
  if (data.hasSHContract) {
    if (!data.planIdSH) {
      errors.push('Por favor, selecione um plano S&H');
    }

    if (!data.distanceSH) {
      errors.push('Por favor, selecione a distância para o contrato S&H');
    }

    if (!data.modalidadePagamentoSH) {
      errors.push('Por favor, selecione a modalidade de pagamento S&H');
    }
  }

  return errors;
}

/**
 * Contract-specific validation for create operations
 * Uses the comprehensive validation from shared package
 * Requirements: 8.2 - Content-specific validation logic
 */
function validateContractCreate(requestData: any): void {
  // Extract the actual contract data from the request
  const contractData = requestData.data || requestData;

  // Create a proper ContractCreationData object with defaults
  const contractCreationData: ContractCreationData = {
    clientId: contractData.clientId || '',
    clienteName: contractData.clienteName || '',
    hasCPAContract: contractData.hasCPAContract || false,
    hasSHContract: contractData.hasSHContract || false,
    cpaContractType: contractData.cpaContractType || '',
    planIdCPA: contractData.planIdCPA || '',
    distanceCPA: contractData.distanceCPA || '',
    modalidadePagamentoCPA: contractData.modalidadePagamentoCPA || '',
    hasPOSPackage: contractData.hasPOSPackage || false,
    inicioContratoCPA: contractData.inicioContratoCPA || '',
    fimContratoCPA: contractData.fimContratoCPA || '',
    horasAssistenciaAnualCPA: contractData.horasAssistenciaAnualCPA || 0,
    deslocacoesPorAnoCPA: contractData.deslocacoesPorAnoCPA || 0,
    manutencoesPorAnoCPA: contractData.manutencoesPorAnoCPA || 0,
    planIdSH: contractData.planIdSH || '',
    distanceSH: contractData.distanceSH || '',
    modalidadePagamentoSH: contractData.modalidadePagamentoSH || '',
    inicioContratoSH: contractData.inicioContratoSH || '',
    fimContratoSH: contractData.fimContratoSH || '',
    horasAssistenciaAnualSH: contractData.horasAssistenciaAnualSH || 0,
    deslocacoesPorAnoSH: contractData.deslocacoesPorAnoSH || 0,
    manutencoesPorAnoSH: contractData.manutencoesPorAnoSH || 0,
    metodoPagamento: contractData.metodoPagamento || '',
    cpaEquipments: contractData.cpaEquipments || [],
    shEquipments: contractData.shEquipments || [],
  };

  // Use the comprehensive validation from shared package directly
  const errors = validateContractCreationDirect(contractCreationData);

  if (errors.length > 0) {
    throw new Error(errors[0]); // Return first error for API response
  }
}

/**
 * Contract-specific validation for update operations
 * Uses the comprehensive validation from shared package
 * Requirements: 8.2 - Content-specific validation logic
 * IMPORTANT: Client cannot be changed during updates for data integrity
 */
function validateContractUpdateData(requestData: any, existingContent?: Contract): void {
  // Extract the actual contract data from the request
  const contractData = requestData.data || requestData;

  // Prevent client changes during updates for data integrity
  if (
    existingContent &&
    contractData.clientId &&
    contractData.clientId !== existingContent.data.clientId
  ) {
    throw new Error('Cliente não pode ser alterado durante atualizações');
  }

  // Create a proper ContractCreationData object with defaults
  const contractCreationData: ContractCreationData = {
    clientId: contractData.clientId || '',
    clienteName: contractData.clienteName || '',
    hasCPAContract: contractData.hasCPAContract || false,
    hasSHContract: contractData.hasSHContract || false,
    cpaContractType: contractData.cpaContractType || '',
    planIdCPA: contractData.planIdCPA || '',
    distanceCPA: contractData.distanceCPA || '',
    modalidadePagamentoCPA: contractData.modalidadePagamentoCPA || '',
    hasPOSPackage: contractData.hasPOSPackage || false,
    inicioContratoCPA: contractData.inicioContratoCPA || '',
    fimContratoCPA: contractData.fimContratoCPA || '',
    horasAssistenciaAnualCPA: contractData.horasAssistenciaAnualCPA || 0,
    deslocacoesPorAnoCPA: contractData.deslocacoesPorAnoCPA || 0,
    manutencoesPorAnoCPA: contractData.manutencoesPorAnoCPA || 0,
    planIdSH: contractData.planIdSH || '',
    distanceSH: contractData.distanceSH || '',
    modalidadePagamentoSH: contractData.modalidadePagamentoSH || '',
    inicioContratoSH: contractData.inicioContratoSH || '',
    fimContratoSH: contractData.fimContratoSH || '',
    horasAssistenciaAnualSH: contractData.horasAssistenciaAnualSH || 0,
    deslocacoesPorAnoSH: contractData.deslocacoesPorAnoSH || 0,
    manutencoesPorAnoSH: contractData.manutencoesPorAnoSH || 0,
    metodoPagamento: contractData.metodoPagamento || '',
    cpaEquipments: contractData.cpaEquipments || [],
    shEquipments: contractData.shEquipments || [],
  };

  // Use the update validation from shared package directly
  const errors = validateContractCreationDirect(contractCreationData);

  if (errors.length > 0) {
    throw new Error(errors[0]); // Return first error for API response
  }
}

/**
 * Creates searchable text for contract content
 * Requirements: 8.5 - Search index with content-specific searchable fields
 */
function createContractSearchText(data: ContractData): string {
  const searchTerms: string[] = [];

  // Basic information
  if (data.clienteName) searchTerms.push(data.clienteName.toLowerCase());
  if (data.clientId) searchTerms.push(data.clientId.toLowerCase());

  // Contract types and plans
  if (data.hasCPAContract) {
    searchTerms.push('cpa');
    if (data.cpaContractType) searchTerms.push(data.cpaContractType.toLowerCase());
    if (data.planIdCPA) searchTerms.push(data.planIdCPA.toLowerCase());
    if (data.modalidadePagamentoCPA) searchTerms.push(data.modalidadePagamentoCPA.toLowerCase());
    if (data.distanceCPA) searchTerms.push(data.distanceCPA.toLowerCase());
  }

  if (data.hasSHContract) {
    searchTerms.push('s&h', 'sh');
    if (data.planIdSH) searchTerms.push(data.planIdSH.toLowerCase());
    if (data.modalidadePagamentoSH) searchTerms.push(data.modalidadePagamentoSH.toLowerCase());
    if (data.distanceSH) searchTerms.push(data.distanceSH.toLowerCase());
  }

  // Equipment information
  if (data.cpaEquipments && data.cpaEquipments.length > 0) {
    data.cpaEquipments.forEach(equipment => {
      if (equipment.modelo) searchTerms.push(equipment.modelo.toLowerCase());
      if (equipment.numeroSerie) searchTerms.push(equipment.numeroSerie.toLowerCase());
    });
  }

  if (data.shEquipments && data.shEquipments.length > 0) {
    data.shEquipments.forEach(equipment => {
      if (equipment.modelo) searchTerms.push(equipment.modelo.toLowerCase());
      if (equipment.numeroSerie) searchTerms.push(equipment.numeroSerie.toLowerCase());
      if (equipment.software) searchTerms.push(equipment.software.toLowerCase());
    });
  }

  // Payment method
  if (data.metodoPagamento) searchTerms.push(data.metodoPagamento.toLowerCase());

  return searchTerms.join(' ');
}

/**
 * Synchronize the contractId field on a client document in R2.
 * Uses optimistic locking (version field) to avoid concurrent write conflicts.
 * @param r2Bucket - R2 storage bucket
 * @param clientId - UUID of the client to update
 * @param contractId - Contract UUID to set, or undefined to clear
 */
async function syncClientContractId(
  r2Bucket: StorageBucket,
  clientId: string,
  contractId: string | undefined
): Promise<void> {
  const clientKey = `content/clients/${clientId}.json`;

  const clientObject = await r2Bucket.get(clientKey);
  if (!clientObject) {
    console.error('syncClientContractId: client not found:', clientId);
    return;
  }

  const client = (await clientObject.json()) as Client;

  const updatedClient: Client = {
    ...client,
    data: {
      ...client.data,
      contractId,
    },
    updatedAt: new Date().toISOString(),
    version: client.version + 1,
  };

  await r2Bucket.put(clientKey, JSON.stringify(updatedClient, null, 2), {
    httpMetadata: {
      contentType: 'application/json',
      cacheControl: 'public, max-age=3600',
    },
    customMetadata: {
      contentType: 'clients',
      version: updatedClient.version.toString(),
      createdAt: updatedClient.createdAt,
      updatedAt: updatedClient.updatedAt,
    },
  });
}

// Create the contracts router using the generic template
const contractsRouter = new Hono();

// Apply error handling middleware
contractsRouter.use('*', contentErrorHandler);

// Create contract-specific configuration with date-based sorting (most recent first)
// Requirements: 8.6 - Date-based sorting for contracts, content-specific searchable fields
const contractConfig = createStandardContentConfig<Contract>('contracts', 'date-desc');

// Override the search text extraction to use the comprehensive contract search function
contractConfig.extractSearchableText = (content: Contract) => {
  return createContractSearchText(content.data);
};

// Override the index fields extraction for contract-specific search and display
// Requirements: 8.5 - Search index with content-specific searchable fields
contractConfig.extractIndexFields = (content: Contract) => {
  const data = content.data;
  const summary = getContractSummary(data);

  return {
    // Basic information for search and display
    clientId: data.clientId || '',
    clienteName: data.clienteName || '',

    // Contract types and status
    hasCPAContract: data.hasCPAContract || false,
    hasSHContract: data.hasSHContract || false,
    contractTypes: summary.contractTypes,
    hasActiveContract: hasActiveContract(data),

    // CPA Contract information
    cpaContractType: data.cpaContractType || '',
    planIdCPA: data.planIdCPA || '',
    modalidadePagamentoCPA: data.modalidadePagamentoCPA || '',
    distanceCPA: data.distanceCPA || '',
    inicioContratoCPA: data.inicioContratoCPA || '',
    fimContratoCPA: data.fimContratoCPA || '',

    // S&H Contract information
    planIdSH: data.planIdSH || '',
    modalidadePagamentoSH: data.modalidadePagamentoSH || '',
    distanceSH: data.distanceSH || '',
    inicioContratoSH: data.inicioContratoSH || '',
    fimContratoSH: data.fimContratoSH || '',

    // Equipment information for search
    cpaEquipmentModels: data.cpaEquipments?.map(e => e.modelo).filter(Boolean) || [],
    cpaEquipmentSerials: data.cpaEquipments?.map(e => e.numeroSerie).filter(Boolean) || [],
    shEquipmentModels: data.shEquipments?.map(e => e.modelo).filter(Boolean) || [],
    shEquipmentSerials: data.shEquipments?.map(e => e.numeroSerie).filter(Boolean) || [],
    equipmentCount: (data.cpaEquipments?.length || 0) + (data.shEquipments?.length || 0),

    // Service details - handle both old and new field names for backward compatibility
    horasAssistenciaAnualCPA: data.horasAssistenciaAnualCPA || 0,
    deslocacoesPorAnoCPA: data.deslocacoesPorAnoCPA || 0,
    manutencoesPorAnoCPA: data.manutencoesPorAnoCPA || 0,
    horasAssistenciaAnualSH: data.horasAssistenciaAnualSH || 0,
    deslocacoesPorAnoSH: data.deslocacoesPorAnoSH || 0,
    manutencoesPorAnoSH: data.manutencoesPorAnoSH || 0,

    // Payment information
    metodoPagamento: data.metodoPagamento || '',
    planNames: summary.planNames,
    paymentMethods: summary.paymentMethods,

    // Contract period information
    startDate: summary.startDate,
    endDate: summary.endDate,
  };
};

// Add validation functions
contractConfig.validateCreate = validateContractCreate;
contractConfig.validateUpdate = validateContractUpdateData;

// Create and mount the generic CRUD routes
const crudRoutes = createContentRoutes<Contract>(contractConfig);
contractsRouter.route('/', crudRoutes);

// ============================================================================
// Balance System Integration
// ============================================================================

/**
 * Override POST handler to integrate balance middleware
 * Calls balance middleware after successful contract creation
 * Requirements: 12.1 - Automatic balance processing on contract creation
 */
contractsRouter.post('/', async (c: Context) => {
  try {
    const user = requireUserContext(c);
    const r2Bucket = c.env?.R2_BUCKET as StorageBucket;

    if (!r2Bucket) {
      const response: ApiResponse = {
        success: false,
        error: 'Storage not available',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 500);
    }

    // Parse and validate request
    let requestData;
    try {
      requestData = await c.req.json();
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid JSON body',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 400);
    }

    // Validate contract data
    if (contractConfig.validateCreate) {
      try {
        await contractConfig.validateCreate(requestData, user);
      } catch (validationError) {
        const response: ApiResponse = {
          success: false,
          error: validationError instanceof Error ? validationError.message : 'Validation failed',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 400);
      }
    }

    // Validate 1:1 uniqueness — client must not have an active contract
    const contentData = requestData.data || requestData;
    const clientId = contentData.clientId as string | undefined;

    if (clientId) {
      const indexObject = await r2Bucket.get('indexes/contracts-index.json');
      if (indexObject) {
        const index = (await indexObject.json()) as { items: Array<{ uuid: string; clientId?: string; isDeleted?: boolean }> };
        const hasActive = (index.items || []).some(
          (item) => item.clientId === clientId && !item.isDeleted
        );
        if (hasActive) {
          const response: ApiResponse = {
            success: false,
            error: 'Este cliente já possui um contrato ativo.',
            timestamp: new Date().toISOString(),
          };
          return c.json(response, 400);
        }
      }
    }

    // Create contract using storage service
    const storage = new ContentStorageService<Contract>(r2Bucket, 'contracts');
    const newContract = await storage.create(contentData, { userId: user.userId });

    // Sync contractId on the client (REQ-01.2, CA-01.2.1)
    if (clientId) {
      await syncClientContractId(r2Bucket, clientId, newContract.uuid)
        .then(() => {
          console.log('Client contractId synced for contract:', newContract.uuid);
        })
        .catch((syncError) => {
          console.error('Failed to sync client contractId:', JSON.stringify({
            contractId: newContract.uuid,
            clientId,
            error: syncError instanceof Error ? syncError.message : String(syncError),
          }, null, 2));
        });
    }

    // Process balance update asynchronously (don't await - fire and forget)
    // Requirements: 12.5 - Async processing doesn't block content creation
    const balanceService = createBalanceService(r2Bucket);
    const balanceMiddleware = createBalanceMiddleware(balanceService);
    
    console.log('CONTRACT CREATED - About to call balance middleware:', JSON.stringify({
      contractId: newContract.uuid,
      clientId: newContract.data.clientId,
      userId: user.userId,
      contractData: {
        hasCPAContract: newContract.data.hasCPAContract,
        hasSHContract: newContract.data.hasSHContract,
        manutencoesPorAnoCPA: newContract.data.manutencoesPorAnoCPA,
        deslocacoesPorAnoCPA: newContract.data.deslocacoesPorAnoCPA,
        horasAssistenciaAnualCPA: newContract.data.horasAssistenciaAnualCPA,
        manutencoesPorAnoSH: newContract.data.manutencoesPorAnoSH,
        deslocacoesPorAnoSH: newContract.data.deslocacoesPorAnoSH,
        horasAssistenciaAnualSH: newContract.data.horasAssistenciaAnualSH,
      },
    }, null, 2));
    
    // Call balance middleware hook without awaiting
    balanceMiddleware.onContractCreated(newContract as unknown as Contract, user.userId)
      .then(() => {
        console.log('Balance middleware completed successfully for contract:', newContract.uuid);
      })
      .catch(error => {
        console.error('Balance middleware error (contract creation):', JSON.stringify({
          contractId: newContract.uuid,
          clientId: newContract.data.clientId,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : String(error),
        }, null, 2));
      });

    const response: ApiResponse<ContentWithRelations<any>> = {
      success: true,
      data: newContract,
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 201);
  } catch (error) {
    console.error('Error creating contract:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create contract',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }
});

/**
 * Override PUT handler to integrate balance middleware
 * Calls balance middleware after successful contract update (for renovations)
 * Requirements: 12.2 - Automatic balance processing on contract renovation
 */
contractsRouter.put('/:uuid', async (c: Context) => {
  try {
    const user = requireUserContext(c);
    const uuid = c.req.param('uuid');
    const r2Bucket = c.env?.R2_BUCKET as StorageBucket;

    if (!r2Bucket) {
      const response: ApiResponse = {
        success: false,
        error: 'Storage not available',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 500);
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid UUID format',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 400);
    }

    // Parse request
    let requestData;
    try {
      requestData = await c.req.json();
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid JSON body',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 400);
    }

    // Get existing contract for validation and balance comparison
    const storage = new ContentStorageService<Contract>(r2Bucket, 'contracts');
    
    let existingContract: Contract | undefined;
    try {
      const contentWithRelations = await storage.get(uuid);
      existingContract = contentWithRelations as unknown as Contract;
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Contract not found',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 404);
    }

    // Validate contract update
    if (contractConfig.validateUpdate) {
      try {
        await contractConfig.validateUpdate(requestData, existingContract, user);
      } catch (validationError) {
        const response: ApiResponse = {
          success: false,
          error: validationError instanceof Error ? validationError.message : 'Validation failed',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 400);
      }
    }

    // Update contract
    const contentData = requestData.data || requestData;
    const updatedContract = await storage.update(uuid, contentData, { userId: user.userId });

    // Process balance update asynchronously (don't await - fire and forget)
    // Requirements: 12.5 - Async processing doesn't block content creation
    const balanceService = createBalanceService(r2Bucket);
    const balanceMiddleware = createBalanceMiddleware(balanceService);
    
    // Call balance middleware hook without awaiting
    // Pass both current and previous contract for renovation detection
    balanceMiddleware.onContractUpdated(
      updatedContract as unknown as Contract,
      existingContract,
      user.userId
    ).catch(error => {
      console.error('Balance middleware error (contract update):', JSON.stringify({
        contractId: updatedContract.uuid,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : String(error),
      }, null, 2));
    });

    const response: ApiResponse<ContentWithRelations<any>> = {
      success: true,
      data: updatedContract,
      timestamp: new Date().toISOString(),
    };
    return c.json(response);
  } catch (error) {
    console.error('Error updating contract:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update contract',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }
});

/**
 * Override DELETE handler to clear contractId on the client after soft delete
 * Requirements: REQ-01.2 — contractId = undefined when contract is deleted
 */
contractsRouter.delete('/:uuid', requireDeletePermission, async (c: Context) => {
  const user = requireUserContext(c);
  const uuid = c.req.param('uuid');
  const r2Bucket = c.env?.R2_BUCKET as StorageBucket;

  if (!r2Bucket) {
    const response: ApiResponse = {
      success: false,
      error: 'Storage not available',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid UUID format',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 400);
  }

  const storage = new ContentStorageService<Contract>(r2Bucket, 'contracts');

  // Read the contract before deleting to get the clientId
  const contractKey = `content/contracts/${uuid}.json`;
  const contractObject = await r2Bucket.get(contractKey)
    .then((obj) => obj ? obj.json() as Promise<Contract> : null)
    .catch(() => null);

  if (!contractObject) {
    const response: ApiResponse = {
      success: false,
      error: 'Contrato não encontrado.',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 404);
  }

  // Perform the soft delete
  await storage.delete(uuid, { userId: user.userId })
    .catch((error) => {
      if (error instanceof Error && error.message === 'Content not found') {
        const response: ApiResponse = {
          success: false,
          error: 'Contrato não encontrado.',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 404);
      }
      throw error;
    });

  // Clear contractId on the client (REQ-01.2, CA-01.2.2)
  const clientId = contractObject.data?.clientId;
  if (clientId) {
    await syncClientContractId(r2Bucket, clientId, undefined)
      .then(() => {
        console.log('Client contractId cleared after contract deletion:', uuid);
      })
      .catch((syncError) => {
        console.error('Failed to clear client contractId:', JSON.stringify({
          contractId: uuid,
          clientId,
          error: syncError instanceof Error ? syncError.message : String(syncError),
        }, null, 2));
      });
  }

  const response: ApiResponse<void> = {
    success: true,
    timestamp: new Date().toISOString(),
  };
  return c.json(response);
});

export default contractsRouter;
