/**
 * Remote Assistance API routes using the generic content route template
 * Implements full CRUD operations with remote assistance-specific validation and sorting
 * Integrates with balance system for automatic transaction processing
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 1.2, 1.3, 12.4
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import {
  createContentRoutes,
  createStandardContentConfig,
  contentErrorHandler,
} from './content-route-template';
import type {
  RemoteAssistance,
  RemoteAssistanceData,
  RemoteAssistanceCreationData,
  RemoteAssistanceUpdateData,
  UserContext,
  StorageBucket,
  ApiResponse,
  ContentWithRelations,
  Client,
} from '@clever/shared';
import {
  validateRemoteAssistanceCreation,
  validateRemoteAssistanceUpdate,
  getRemoteAssistanceSummary,
  calculateAssistanceValue,
  validateAndFormatTime,
  generateAssistanceNumber,
  getYearFromAssistanceDate,
  hasBillableValue,
  REMOTE_ASSISTANCE_CONSTANTS,
} from '@clever/shared';
import { autoAssignTechnician, validateTechnicianAssignment } from '../utils/technician-assignment';
import { createBalanceService, ValidationError } from '../services/balance-service';
import { createBalanceMiddleware } from '../middleware/balance-middleware';
import { requireUserContext } from '../middleware/clerk';
import { extractRemoteAssistanceDebtTransaction, hasTransactionChanges } from '@clever/shared';

/**
 * Remote assistance-specific validation for create operations
 * Uses the comprehensive validation from shared package with automatic technician assignment
 * Requirements: 8.2 - Content-specific validation logic with time inputs and business rules, 1.2 - Automatic technician assignment
 */
function validateRemoteAssistanceCreate(requestData: any, userContext?: UserContext): void {
  // Extract the actual remote assistance data from the request
  let remoteAssistanceData = requestData.data || requestData;

  // Auto-assign technician if user context is available
  // Requirements: 1.2 - Automatic technician assignment on creation
  if (userContext) {
    try {
      remoteAssistanceData = autoAssignTechnician(remoteAssistanceData, userContext);
    } catch (error) {
      throw new Error(
        `Failed to assign technician: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  // Create a proper RemoteAssistanceCreationData object with defaults
  const remoteAssistanceCreationData: RemoteAssistanceCreationData = {
    clientId: remoteAssistanceData.clientId || '',
    clienteName: remoteAssistanceData.clienteName || '',
    contractId: remoteAssistanceData.contractId, // Include contractId field
    tipoAssistencia: remoteAssistanceData.tipoAssistencia || '',
    tecnicoResponsavel: remoteAssistanceData.tecnicoResponsavel || '',
    dataPedido: remoteAssistanceData.dataPedido || '',
    dataAssistencia: remoteAssistanceData.dataAssistencia || '',
    inicioAssistencia: remoteAssistanceData.inicioAssistencia || '',
    fimAssistencia: remoteAssistanceData.fimAssistencia || '',
    horasTotais: remoteAssistanceData.horasTotais || '',
    motivoPedido: remoteAssistanceData.motivoPedido || '',
    relatorioAssistencia: remoteAssistanceData.relatorioAssistancia || '',
    relatorio: remoteAssistanceData.relatorio || '',
    valorAssist: remoteAssistanceData.valorAssist || 0,
    paymentMethod: remoteAssistanceData.paymentMethod, // Include paymentMethod field
    resolvido: remoteAssistanceData.resolvido || false,
    anexos: remoteAssistanceData.anexos || '',
  };

  // Use the comprehensive validation from shared package
  const errors = validateRemoteAssistanceCreation(remoteAssistanceCreationData);

  if (errors.length > 0) {
    throw new Error(errors[0]); // Return first error for API response
  }

  // Validate technician assignment structure
  // Requirements: 1.2 - Validate TechnicianUser object structure
  const technicianValidation = validateTechnicianAssignment(remoteAssistanceData);
  if (!technicianValidation.isValid) {
    throw new Error(`Technician assignment validation failed: ${technicianValidation.errors[0]}`);
  }

  // Update the original request data with auto-assigned technician
  if (requestData.data) {
    requestData.data = remoteAssistanceData;
  } else {
    Object.assign(requestData, remoteAssistanceData);
  }
}

/**
 * Remote assistance-specific validation for update operations
 * Uses the comprehensive validation from shared package with automatic technician assignment
 * Requirements: 8.2 - Content-specific validation logic with time inputs and business rules, 1.3 - Automatic technician assignment on update
 * Note: Remote assistance allows client changes during updates (unlike contracts/licenses)
 */
function validateRemoteAssistanceUpdateData(
  requestData: any,
  existingContent?: RemoteAssistance,
  userContext?: UserContext
): void {
  // Extract the actual remote assistance data from the request
  let remoteAssistanceData = requestData.data || requestData;

  // Auto-assign technician if user context is available
  // Requirements: 1.3 - Automatic technician assignment on update
  if (userContext) {
    try {
      remoteAssistanceData = autoAssignTechnician(remoteAssistanceData, userContext);
    } catch (error) {
      throw new Error(
        `Failed to assign technician: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  // Remote assistance allows client changes during updates (unlike contracts/licenses)
  // This is because assistance records may need client corrections or reassignments

  // Use the update validation from shared package
  const errors = validateRemoteAssistanceUpdate(
    remoteAssistanceData as Partial<RemoteAssistanceData>
  );

  if (errors.length > 0) {
    throw new Error(errors[0]); // Return first error for API response
  }

  // Validate technician assignment structure
  // Requirements: 1.3 - Validate TechnicianUser object structure
  const technicianValidation = validateTechnicianAssignment(remoteAssistanceData);
  if (!technicianValidation.isValid) {
    throw new Error(`Technician assignment validation failed: ${technicianValidation.errors[0]}`);
  }

  // Update the original request data with auto-assigned technician
  if (requestData.data) {
    requestData.data = remoteAssistanceData;
  } else {
    Object.assign(requestData, remoteAssistanceData);
  }
}

/**
 * Creates searchable text for remote assistance content
 * Requirements: 8.5 - Search index with content-specific searchable fields (client, assistance number, technician, type)
 * Updated to handle TechnicianUser object structure
 */
function createRemoteAssistanceSearchText(data: RemoteAssistanceData): string {
  const searchTerms: string[] = [];

  // Client information (only clientId, client data comes from relations)
  if (data.clientId) searchTerms.push(data.clientId.toLowerCase());
  if (data.clienteName) searchTerms.push(data.clienteName.toLowerCase());

  // Assistance type and technician information
  if (data.tipoAssistencia) searchTerms.push(data.tipoAssistencia.toLowerCase());
  
  // Handle TechnicianUser object for technician
  if (data.tecnicoResponsavel) {
    const technician = data.tecnicoResponsavel;
    if (technician.firstName) searchTerms.push(technician.firstName.toLowerCase());
    if (technician.lastName) searchTerms.push(technician.lastName.toLowerCase());
    if (technician.firstName && technician.lastName) {
      searchTerms.push(`${technician.firstName} ${technician.lastName}`.toLowerCase());
    }
  }

  // Description fields
  if (data.motivoPedido) searchTerms.push(data.motivoPedido.toLowerCase());
  if (data.relatorioAssistencia) searchTerms.push(data.relatorioAssistencia.toLowerCase());
  if (data.relatorio) searchTerms.push(data.relatorio.toLowerCase());

  // Status indicators
  if (data.paymentMethod === 'Contrato') searchTerms.push('contrato');
  if (data.paymentMethod === 'Garantia') searchTerms.push('garantia');
  if (data.resolvido) searchTerms.push('resolvido', 'completo');

  // Value-related terms
  if (hasBillableValue(data)) {
    searchTerms.push('faturável', 'faturavel', 'pago');
  } else {
    searchTerms.push('gratuito', 'sem-custo');
  }

  // Assistance types for better search
  searchTerms.push('assistência', 'assistencia', 'remota', 'suporte');

  return searchTerms.join(' ');
}

/**
 * Generate sequential assistance number for the year
 * Requirements: 8.6 - Automatic assistance number generation (sequential numbering)
 */
async function generateSequentialAssistanceNumber(year: string, storage: any): Promise<string> {
  try {
    // Get all remote assistance items for the year to determine next sequential number
    const { items } = await storage.list(1, 10000); // Get all items (assuming reasonable limit)

    // Filter items by year and count them
    const yearItems = items.filter((item: any) => {
      const assistanceYear = getYearFromAssistanceDate(item.data.dataAssistencia);
      return assistanceYear === year;
    });

    // Next sequential number is count + 1
    const nextSequentialNumber = yearItems.length + 1;

    return generateAssistanceNumber(year, nextSequentialNumber);
  } catch (error) {
    console.warn('Error generating sequential assistance number:', error);
    // Fallback to basic numbering
    return generateAssistanceNumber(year, 1);
  }
}

// Create the remote assistance router using the generic template
const remoteAssistanceRouter = new Hono();

// Apply error handling middleware
remoteAssistanceRouter.use('*', contentErrorHandler);

// Create remote assistance-specific configuration with date-based sorting (most recent first)
// Requirements: 8.6 - Content-specific sorting (by assistance date, most recent first)
const remoteAssistanceConfig = createStandardContentConfig<RemoteAssistance>(
  'remote-assistance',
  'date-desc'
);

// Override the search text extraction to use the comprehensive remote assistance search function
remoteAssistanceConfig.extractSearchableText = (content: RemoteAssistance) => {
  return createRemoteAssistanceSearchText(content.data);
};

// Override the index fields extraction for remote assistance-specific search and display
// Requirements: 8.5 - Search index with content-specific searchable fields (client, assistance number, technician, type)
remoteAssistanceConfig.extractIndexFields = (content: RemoteAssistance) => {
  const data = content.data;
  const summary = getRemoteAssistanceSummary(data);

  // Generate assistance number for display
  const year = getYearFromAssistanceDate(data.dataAssistencia);
  const assistanceNumber = generateAssistanceNumber(year, 1); // Placeholder - actual number generated during creation

  return {
    // Basic information for search and display
    clientId: data.clientId || '',
    clienteName: data.clienteName || '', // Will be resolved through relations
    assistanceNumber, // Generated assistance number for display

    // Assistance details
    tipoAssistencia: data.tipoAssistencia || '',
    tecnicoResponsavel: data.tecnicoResponsavel || '',

    // Date and time information
    dataPedido: data.dataPedido || '',
    dataAssistencia: data.dataAssistencia || '',
    inicioAssistencia: data.inicioAssistencia || '',
    fimAssistencia: data.fimAssistencia || '',
    horasTotais: data.horasTotais || '',
    year: getYearFromAssistanceDate(data.dataAssistencia),

    // Value and billing information
    valorAssist: data.valorAssist || 0,
    hasBillableValue: hasBillableValue(data),

    // Status flags
    paymentMethod: data.paymentMethod || '',
    resolvido: data.resolvido || false,

    // Summary information
    assistanceType: summary.assistanceType,
    technician: summary.technician,
    date: summary.date,
    value: summary.value,
    status: summary.status,
    duration: summary.duration,

    // Calculated fields for filtering
    isContract: data.paymentMethod === 'Contrato',
    isWarranty: data.paymentMethod === 'Garantia',
    isResolved: data.resolvido,
    isBillable: hasBillableValue(data),

    // Time validation results (for debugging)
    hasValidTimes: !!(data.inicioAssistencia && data.fimAssistencia),

    // Business hours calculation (if times are available)
    businessHoursValue:
      data.inicioAssistencia && data.fimAssistencia
        ? calculateAssistanceValue(
            data.inicioAssistencia,
            data.fimAssistencia,
            data.paymentMethod
          ).businessHoursValue
        : 0,
    afterHoursValue:
      data.inicioAssistencia && data.fimAssistencia
        ? calculateAssistanceValue(
            data.inicioAssistencia,
            data.fimAssistencia,
            data.paymentMethod
          ).afterHoursValue
        : 0,
  };
};

// Add validation functions
remoteAssistanceConfig.validateCreate = validateRemoteAssistanceCreate;
remoteAssistanceConfig.validateUpdate = validateRemoteAssistanceUpdateData;

// Create and mount the generic CRUD routes
const crudRoutes = createContentRoutes<RemoteAssistance>(remoteAssistanceConfig);
remoteAssistanceRouter.route('/', crudRoutes);

// ============================================================================
// Balance System Integration
// ============================================================================

/**
 * Override POST handler to integrate balance middleware
 * Calls balance middleware after successful remote assistance creation
 * Requirements: 12.4 - Automatic balance processing on remote assistance creation
 */
remoteAssistanceRouter.post('/', async (c: Context) => {
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

    // Validate remote assistance data
    if (remoteAssistanceConfig.validateCreate) {
      try {
        await remoteAssistanceConfig.validateCreate(requestData, user);
      } catch (validationError) {
        const response: ApiResponse = {
          success: false,
          error: validationError instanceof Error ? validationError.message : 'Validation failed',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 400);
      }
    }

    const contentData = requestData.data || requestData;

    // ========================================================================
    // Automatic contract resolution from client (REQ-04.1, CA-04.1.3)
    // Always resolve contractId from the client's contractId — ignore body value
    // ========================================================================
    const clientId = contentData.clientId as string | undefined;
    let resolvedContractId: string | undefined;

    if (clientId) {
      const clientObject = await r2Bucket.get(`content/clients/${clientId}.json`);
      if (!clientObject) {
        const response: ApiResponse = {
          success: false,
          error: 'Cliente não encontrado.',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 404);
      }

      const client = (await clientObject.json()) as Client;
      resolvedContractId = client.data.contractId;
    }

    // Reject "Contrato" payment when client has no active contract (REQ-04.3, CA-04.1.3)
    const paymentMethod = contentData.paymentMethod as string | undefined;
    if (paymentMethod === 'Contrato' && !resolvedContractId) {
      const response: ApiResponse = {
        success: false,
        error: 'O cliente não possui contrato ativo para consumir recursos.',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 400);
    }

    // Override contractId — always resolved from client, never from body
    contentData.contractId = resolvedContractId;

    // ========================================================================
    // Validate resource availability BEFORE creating content (REQ-04.4)
    // If resources are insufficient, reject with HTTP 400 — content NOT created
    // ========================================================================
    const balanceService = createBalanceService(r2Bucket);

    if (paymentMethod === 'Contrato' && clientId) {
      // Build the same changes that the balance middleware would create
      const proposedChanges = extractRemoteAssistanceDebtTransaction({
        data: contentData,
      } as unknown as RemoteAssistance);

      if (hasTransactionChanges(proposedChanges)) {
        try {
          await balanceService.validateResourceAvailability(clientId, proposedChanges);
        } catch (validationError) {
          if (validationError instanceof ValidationError) {
            const response: ApiResponse = {
              success: false,
              error: validationError.message,
              timestamp: new Date().toISOString(),
            };
            return c.json(response, 400);
          }
          throw validationError;
        }
      }
    }

    // Create remote assistance using storage service
    const { ContentStorageService } = await import('@clever/shared');
    const storage = new ContentStorageService<RemoteAssistance>(r2Bucket, 'remote-assistance');
    const newRemoteAssistance = await storage.create(contentData, { userId: user.userId });

    // Process balance update asynchronously (don't await - fire and forget)
    // Requirements: 12.5 - Async processing doesn't block content creation
    const balanceMiddleware = createBalanceMiddleware(balanceService);
    
    console.log('REMOTE ASSISTANCE CREATED - About to call balance middleware:', JSON.stringify({
      remoteAssistanceId: newRemoteAssistance.uuid,
      clientId: newRemoteAssistance.data.clientId,
      userId: user.userId,
      paymentMethod: newRemoteAssistance.data.paymentMethod,
      horasTotais: newRemoteAssistance.data.horasTotais,
    }, null, 2));
    
    // Call balance middleware hook without awaiting
    balanceMiddleware.onRemoteAssistanceCreated(newRemoteAssistance as unknown as RemoteAssistance, user.userId)
      .then(() => {
        console.log('Balance middleware completed successfully for remote assistance:', newRemoteAssistance.uuid);
      })
      .catch(error => {
        console.error('Balance middleware error (remote assistance creation):', JSON.stringify({
          remoteAssistanceId: newRemoteAssistance.uuid,
          clientId: newRemoteAssistance.data.clientId,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : String(error),
        }, null, 2));
      });

    const response: ApiResponse<ContentWithRelations<any>> = {
      success: true,
      data: newRemoteAssistance,
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 201);
  } catch (error) {
    console.error('Error creating remote assistance:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create remote assistance',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }
});

/**
 * Additional endpoint for automatic value calculation
 * POST /api/content/remote-assistance/calculate-value
 * Requirements: 8.2 - Complex business logic for time validation and value calculation
 */
remoteAssistanceRouter.post('/calculate-value', async c => {
  try {
    const requestData = await c.req.json();
    const { inicioAssistencia, fimAssistencia, paymentMethod = '' } = requestData;

    if (!inicioAssistencia || !fimAssistencia) {
      return c.json(
        {
          success: false,
          error: 'Início e fim da assistência são obrigatórios para cálculo',
          timestamp: new Date().toISOString(),
        },
        400
      );
    }

    // Validate and format times
    const startTimeValidation = validateAndFormatTime(inicioAssistencia);
    const endTimeValidation = validateAndFormatTime(fimAssistencia);

    if (!startTimeValidation.isValid || !endTimeValidation.isValid) {
      const errors = [...(startTimeValidation.errors || []), ...(endTimeValidation.errors || [])];
      return c.json(
        {
          success: false,
          error: errors.join('; '),
          timestamp: new Date().toISOString(),
        },
        400
      );
    }

    // Calculate assistance value
    const calculation = calculateAssistanceValue(
      startTimeValidation.formattedTime || inicioAssistencia,
      endTimeValidation.formattedTime || fimAssistencia,
      paymentMethod
    );

    return c.json({
      success: true,
      data: {
        ...calculation,
        formattedStartTime: startTimeValidation.formattedTime,
        formattedEndTime: endTimeValidation.formattedTime,
        constants: {
          businessHoursRate: REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS,
          afterHoursRate: REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS,
          businessHoursStart: REMOTE_ASSISTANCE_CONSTANTS.BUSINESS_HOURS_START,
          businessHoursEnd: REMOTE_ASSISTANCE_CONSTANTS.BUSINESS_HOURS_END,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error calculating assistance value:', error);
    return c.json(
      {
        success: false,
        error: 'Erro ao calcular valor da assistência',
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

/**
 * Additional endpoint for time validation and formatting
 * POST /api/content/remote-assistance/validate-time
 * Requirements: 8.2 - Content-specific validation logic for time inputs
 */
remoteAssistanceRouter.post('/validate-time', async c => {
  try {
    const requestData = await c.req.json();
    const { timeString } = requestData;

    if (!timeString) {
      return c.json(
        {
          success: false,
          error: 'Tempo é obrigatório para validação',
          timestamp: new Date().toISOString(),
        },
        400
      );
    }

    const validation = validateAndFormatTime(timeString);

    return c.json({
      success: true,
      data: {
        isValid: validation.isValid,
        errors: validation.errors,
        formattedTime: validation.formattedTime,
        originalTime: timeString,
        validMinutes: REMOTE_ASSISTANCE_CONSTANTS.VALID_MINUTES,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error validating time:', error);
    return c.json(
      {
        success: false,
        error: 'Erro ao validar tempo',
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

export default remoteAssistanceRouter;
