/**
 * Work Sheets API routes using the generic content route template
 * Implements full CRUD operations with work-sheet-specific validation and sorting
 * Integrates with balance system for automatic transaction processing
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 1.1, 1.3, 12.3
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import {
  createContentRoutes,
  createStandardContentConfig,
  contentErrorHandler,
} from './content-route-template';
import type {
  WorkSheet,
  WorkSheetData,
  WorkSheetCreationData,
  WorkSheetUpdateData,
  UserContext,
  StorageBucket,
  ApiResponse,
  ContentWithRelations,
} from '@clever/shared';
import {
  validateWorkSheetCreation,
  validateWorkSheetUpdate,
  getWorkSheetSummary,
  calculateWorkSheetTotals,
} from '@clever/shared';
import { autoAssignTechnician, validateTechnicianAssignment } from '../utils/technician-assignment';
import { createBalanceService } from '../services/balance-service';
import { createBalanceMiddleware } from '../middleware/balance-middleware';
import { requireUserContext } from '../middleware/clerk';

/**
 * Work sheet-specific validation for create operations
 * Uses the comprehensive validation from shared package with automatic technician assignment
 * Requirements: 8.2 - Content-specific validation logic, 1.1 - Automatic technician assignment
 */
function validateWorkSheetCreate(requestData: any, userContext?: UserContext): void {
  // Extract the actual work sheet data from the request
  let workSheetData = requestData.data || requestData;

  // Auto-assign technician if user context is available
  // Requirements: 1.1 - Automatic technician assignment on creation
  if (userContext) {
    try {
      workSheetData = autoAssignTechnician(workSheetData, userContext);
    } catch (error) {
      throw new Error(
        `Failed to assign technician: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  // Create a proper WorkSheetCreationData object with defaults
  const workSheetCreationData: WorkSheetCreationData = {
    clientId: workSheetData.clientId || '',
    contractId: workSheetData.contractId, // Include contractId field
    request: {
      date: workSheetData.request?.date || '',
      receivedBy: workSheetData.request?.receivedBy || '',
      assistanceDate: workSheetData.request?.assistanceDate || '',
      reason: workSheetData.request?.reason || '',
      arrivalTime: workSheetData.request?.arrivalTime || '',
      departureTime: workSheetData.request?.departureTime || '',
      totalHours: workSheetData.request?.totalHours || '0:00',
    },
    displacement: {
      hasDisplacement: workSheetData.displacement?.hasDisplacement || false,
      weekendHoliday: workSheetData.displacement?.weekendHoliday || false,
      oneWayKms: workSheetData.displacement?.oneWayKms || 0,
      totalKms: workSheetData.displacement?.totalKms || 0,
      paymentMethod: workSheetData.displacement?.paymentMethod || 'PENDENTE',
    },
    otherData: {
      serviceType: workSheetData.otherData?.serviceType || '',
      technician: workSheetData.otherData?.technician || '',
      serviceObservations: workSheetData.otherData?.serviceObservations || '',
      warranty: workSheetData.otherData?.warranty || false,
      contract: workSheetData.otherData?.contract || false,
      contractYear: workSheetData.otherData?.contractYear || '',
      materialUsed: workSheetData.otherData?.materialUsed || false,
      materialDetails: workSheetData.otherData?.materialDetails || '',
      equipment: workSheetData.otherData?.equipment || false,
      equipmentDetails: workSheetData.otherData?.equipmentDetails || '',
      totallyResolved: workSheetData.otherData?.totallyResolved || false,
      resolutionIssues: workSheetData.otherData?.resolutionIssues || '',
      dumpReading: workSheetData.otherData?.dumpReading || false,
      backup: workSheetData.otherData?.backup || false,
      remoteAccessCheck: workSheetData.otherData?.remoteAccessCheck || false,
      anydesk: workSheetData.otherData?.anydesk || false,
      serviceReport: workSheetData.otherData?.serviceReport || '',
      clientSignature: workSheetData.otherData?.clientSignature || '',
    },
  };

  // Use the comprehensive validation from shared package
  const errors = validateWorkSheetCreation(workSheetCreationData);

  if (errors.length > 0) {
    throw new Error(errors[0]); // Return first error for API response
  }

  // Validate technician assignment structure
  // Requirements: 1.1 - Validate TechnicianUser object structure
  const technicianValidation = validateTechnicianAssignment(workSheetData);
  if (!technicianValidation.isValid) {
    throw new Error(`Technician assignment validation failed: ${technicianValidation.errors[0]}`);
  }

  // Update the original request data with auto-assigned technician
  if (requestData.data) {
    requestData.data = workSheetData;
  } else {
    Object.assign(requestData, workSheetData);
  }
}

/**
 * Work sheet-specific validation for update operations
 * Uses the comprehensive validation from shared package with automatic technician assignment
 * Requirements: 8.2 - Content-specific validation logic, 1.3 - Automatic technician assignment on update
 * Note: Unlike contracts/licenses, work sheets allow client changes during updates
 */
function validateWorkSheetUpdateData(requestData: any, existingContent?: WorkSheet, userContext?: UserContext): void {
  // Extract the actual work sheet data from the request
  let workSheetData = requestData.data || requestData;

  // Auto-assign technician if user context is available
  // Requirements: 1.3 - Automatic technician assignment on update
  if (userContext) {
    try {
      workSheetData = autoAssignTechnician(workSheetData, userContext);
    } catch (error) {
      throw new Error(
        `Failed to assign technician: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  // Work sheets allow client changes during updates (unlike contracts/licenses)
  // This is because work sheets are service records that may need client corrections

  // Use the update validation from shared package
  const errors = validateWorkSheetUpdate(workSheetData as Partial<WorkSheetData>);

  if (errors.length > 0) {
    throw new Error(errors[0]); // Return first error for API response
  }

  // Validate technician assignment structure
  // Requirements: 1.3 - Validate TechnicianUser object structure
  const technicianValidation = validateTechnicianAssignment(workSheetData);
  if (!technicianValidation.isValid) {
    throw new Error(`Technician assignment validation failed: ${technicianValidation.errors[0]}`);
  }

  // Update the original request data with auto-assigned technician
  if (requestData.data) {
    requestData.data = workSheetData;
  } else {
    Object.assign(requestData, workSheetData);
  }
}

/**
 * Creates searchable text for work sheet content
 * Requirements: 8.5 - Search index with content-specific searchable fields
 * Updated to handle TechnicianUser object structure
 */
function createWorkSheetSearchText(data: WorkSheetData): string {
  const searchTerms: string[] = [];

  // Client information (only clientId, client data comes from relations)
  if (data.clientId) searchTerms.push(data.clientId.toLowerCase());

  // Request information
  if (data.request?.reason) searchTerms.push(data.request.reason.toLowerCase());

  // Service information
  if (data.otherData?.serviceType) searchTerms.push(data.otherData.serviceType.toLowerCase());
  
  // Handle TechnicianUser object for technician
  if (data.otherData?.technician) {
    const technician = data.otherData.technician;
    if (technician.firstName) searchTerms.push(technician.firstName.toLowerCase());
    if (technician.lastName) searchTerms.push(technician.lastName.toLowerCase());
    if (technician.firstName && technician.lastName) {
      searchTerms.push(`${technician.firstName} ${technician.lastName}`.toLowerCase());
    }
  }
  
  if (data.otherData?.serviceObservations)
    searchTerms.push(data.otherData.serviceObservations.toLowerCase());
  if (data.otherData?.serviceReport) searchTerms.push(data.otherData.serviceReport.toLowerCase());
  if (data.otherData?.contractYear) searchTerms.push(data.otherData.contractYear.toLowerCase());

  // Material and equipment details
  if (data.otherData?.materialDetails)
    searchTerms.push(data.otherData.materialDetails.toLowerCase());
  if (data.otherData?.equipmentDetails)
    searchTerms.push(data.otherData.equipmentDetails.toLowerCase());
  if (data.otherData?.resolutionIssues)
    searchTerms.push(data.otherData.resolutionIssues.toLowerCase());

  // Payment method
  if (data.displacement?.paymentMethod)
    searchTerms.push(data.displacement.paymentMethod.toLowerCase());

  // Service status indicators
  if (data.otherData?.totallyResolved) searchTerms.push('resolvido', 'completo');
  if (data.displacement?.hasDisplacement) searchTerms.push('deslocação', 'deslocacao');
  if (data.displacement?.weekendHoliday) searchTerms.push('fim-de-semana', 'feriado');
  if (data.otherData?.warranty) searchTerms.push('garantia');
  if (data.otherData?.contract) searchTerms.push('contrato');
  if (data.otherData?.materialUsed) searchTerms.push('material');
  if (data.otherData?.equipment) searchTerms.push('equipamento');

  return searchTerms.join(' ');
}

// Create the work sheets router using the generic template
const workSheetsRouter = new Hono();

// Apply error handling middleware
workSheetsRouter.use('*', contentErrorHandler);

// Create work sheet-specific configuration with date-based sorting (most recent first)
// Requirements: 8.6 - Date-based sorting for work sheets, content-specific searchable fields
const workSheetConfig = createStandardContentConfig<WorkSheet>('work-sheets', 'date-desc');

// Override the search text extraction to use the comprehensive work sheet search function
workSheetConfig.extractSearchableText = (content: WorkSheet) => {
  return createWorkSheetSearchText(content.data);
};

// Override the index fields extraction for work sheet-specific search and display
// Requirements: 8.5 - Search index with content-specific searchable fields
workSheetConfig.extractIndexFields = (content: WorkSheet) => {
  const data = content.data;
  const summary = getWorkSheetSummary(content);
  const totals = calculateWorkSheetTotals(data);

  return {
    // Basic information for search and display
    clientId: data.clientId || '',
    // Client data now comes from relations

    // Request information
    assistanceDate: data.request?.assistanceDate || '',
    requestDate: data.request?.date || '',
    reason: data.request?.reason || '',
    arrivalTime: data.request?.arrivalTime || '',
    departureTime: data.request?.departureTime || '',
    totalHours: totals.totalHours,

    // Service information
    serviceType: data.otherData?.serviceType || '',
    technician: data.otherData?.technician || '',
    totallyResolved: data.otherData?.totallyResolved || false,

    // Displacement information
    hasDisplacement: data.displacement?.hasDisplacement || false,
    weekendHoliday: data.displacement?.weekendHoliday || false,
    oneWayKms: data.displacement?.oneWayKms || 0,
    totalKms: data.displacement?.totalKms || 0,
    paymentMethod: data.displacement?.paymentMethod || 'PENDENTE',

    // Contract and warranty information
    warranty: data.otherData?.warranty || false,
    contract: data.otherData?.contract || false,
    contractYear: data.otherData?.contractYear || '',

    // Material and equipment flags
    materialUsed: data.otherData?.materialUsed || false,
    equipment: data.otherData?.equipment || false,

    // Technical operations flags
    dumpReading: data.otherData?.dumpReading || false,
    backup: data.otherData?.backup || false,
    remoteAccessCheck: data.otherData?.remoteAccessCheck || false,
    anydesk: data.otherData?.anydesk || false,

    // Pricing information (calculated)
    displacementRate: totals.displacementRate,
    kmsPrice: totals.kmsPrice,
    hourlyRate: totals.hourlyRate,
    laborPrice: totals.laborPrice,
    totalPrice: totals.totalPrice,

    // Summary for display
    summary,
  };
};

// Add validation functions
workSheetConfig.validateCreate = validateWorkSheetCreate;
workSheetConfig.validateUpdate = validateWorkSheetUpdateData;

// Create and mount the generic CRUD routes
const crudRoutes = createContentRoutes<WorkSheet>(workSheetConfig);
workSheetsRouter.route('/', crudRoutes);

// ============================================================================
// Balance System Integration
// ============================================================================

/**
 * Override POST handler to integrate balance middleware
 * Calls balance middleware after successful work sheet creation
 * Requirements: 12.3 - Automatic balance processing on work sheet creation
 */
workSheetsRouter.post('/', async (c: Context) => {
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

    // Validate work sheet data
    if (workSheetConfig.validateCreate) {
      try {
        await workSheetConfig.validateCreate(requestData, user);
      } catch (validationError) {
        const response: ApiResponse = {
          success: false,
          error: validationError instanceof Error ? validationError.message : 'Validation failed',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 400);
      }
    }

    // Create work sheet using storage service
    const { ContentStorageService } = await import('@clever/shared');
    const storage = new ContentStorageService<WorkSheet>(r2Bucket, 'work-sheets');
    const contentData = requestData.data || requestData;
    const newWorkSheet = await storage.create(contentData, { userId: user.userId });

    // Process balance update asynchronously (don't await - fire and forget)
    // Requirements: 12.5 - Async processing doesn't block content creation
    const balanceService = createBalanceService(r2Bucket);
    const balanceMiddleware = createBalanceMiddleware(balanceService);
    
    console.log('WORK SHEET CREATED - About to call balance middleware:', JSON.stringify({
      workSheetId: newWorkSheet.uuid,
      clientId: newWorkSheet.data.clientId,
      userId: user.userId,
      paymentMethod: newWorkSheet.data.displacement?.paymentMethod,
      warranty: newWorkSheet.data.otherData?.warranty,
    }, null, 2));
    
    // Call balance middleware hook without awaiting
    balanceMiddleware.onWorkSheetCreated(newWorkSheet as unknown as WorkSheet, user.userId)
      .then(() => {
        console.log('Balance middleware completed successfully for work sheet:', newWorkSheet.uuid);
      })
      .catch(error => {
        console.error('Balance middleware error (work sheet creation):', JSON.stringify({
          workSheetId: newWorkSheet.uuid,
          clientId: newWorkSheet.data.clientId,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : String(error),
        }, null, 2));
      });

    const response: ApiResponse<ContentWithRelations<any>> = {
      success: true,
      data: newWorkSheet,
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 201);
  } catch (error) {
    console.error('Error creating work sheet:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create work sheet',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }
});

export default workSheetsRouter;
