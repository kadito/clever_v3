/**
 * Daily Records API routes using the generic content route template
 * Implements full CRUD operations with daily records-specific validation and sorting
 * Requirements: 1.1, 1.2, 12.1, 13.1, 14.1, 15.1, 15.2, 18.1
 */

import { Hono } from 'hono';
import {
  createContentRoutes,
  createStandardContentConfig,
  contentErrorHandler,
} from './content-route-template';
import type { Context } from 'hono';
import type {
  DailyRecord,
  DailyRecordData,
  DailyRecordCreationData,
  UserContext,
  ApiResponse,
  ContentWithRelations,
  StorageBucket,
} from '@clever/shared';
import {
  validateDailyRecordCreation,
  validateDailyRecordUpdate,
} from '@clever/shared';
import { autoAssignTechnician, validateTechnicianAssignment } from '../utils/technician-assignment';
import { resolveDailyRecordRelations } from '../utils/daily-records-relations';

/**
 * Daily record-specific validation for create operations
 * Uses the comprehensive validation from shared package
 * Requirements: 1.1 - Date validation, 1.2 - Minimum activity requirement
 */
function validateDailyRecordCreate(requestData: any, userContext?: UserContext): void {
  // Extract the actual daily record data from the request
  let dailyRecordData = requestData.data || requestData;

  // Auto-assign technician if user context is available
  if (userContext) {
    try {
      dailyRecordData = autoAssignTechnician(dailyRecordData, userContext);
    } catch (error) {
      throw new Error(
        `Erro ao atribuir técnico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }

  // Create a proper DailyRecordCreationData object with defaults
  const dailyRecordCreationData: DailyRecordCreationData = {
    dataRegistro: dailyRecordData.dataRegistro || '',
    atividades: dailyRecordData.atividades || [],
  };

  // Use the comprehensive validation from shared package
  const errors = validateDailyRecordCreation(dailyRecordCreationData);

  if (errors.length > 0) {
    throw new Error(errors[0]); // Return first error for API response
  }

  // Validate technician assignment if present
  if (dailyRecordData.technician) {
    const technicianValidation = validateTechnicianAssignment(dailyRecordData);
    if (!technicianValidation.isValid) {
      throw new Error(technicianValidation.errors[0]);
    }
  }

  // Update the original request data
  if (requestData.data) {
    requestData.data = dailyRecordData;
  } else {
    Object.assign(requestData, dailyRecordData);
  }
}

/**
 * Daily record-specific validation for update operations
 * Uses the comprehensive validation from shared package
 * Requirements: 14.1 - Update validation, 14.5 - Validation consistency
 */
function validateDailyRecordUpdateData(
  requestData: any,
  existingContent?: DailyRecord,
  userContext?: UserContext
): void {
  // Extract the actual daily record data from the request
  let dailyRecordData = requestData.data || requestData;

  // Auto-assign technician if user context is available
  if (userContext) {
    try {
      dailyRecordData = autoAssignTechnician(dailyRecordData, userContext);
    } catch (error) {
      throw new Error(
        `Erro ao atribuir técnico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }

  // For updates, we need to ensure we have the complete data structure
  // Merge with existing content if available
  const completeData: DailyRecordCreationData = {
    dataRegistro: dailyRecordData.dataRegistro || existingContent?.data.dataRegistro || '',
    atividades: dailyRecordData.atividades || existingContent?.data.atividades || [],
  };

  // Use the update validation from shared package
  const errors = validateDailyRecordUpdate(completeData);

  if (errors.length > 0) {
    throw new Error(errors[0]); // Return first error for API response
  }

  // Validate technician assignment if present
  if (dailyRecordData.technician) {
    const technicianValidation = validateTechnicianAssignment(dailyRecordData);
    if (!technicianValidation.isValid) {
      throw new Error(technicianValidation.errors[0]);
    }
  }

  // Update the original request data
  if (requestData.data) {
    requestData.data = dailyRecordData;
  } else {
    Object.assign(requestData, dailyRecordData);
  }
}

/**
 * Creates searchable text for daily record content
 * Requirements: 12.4 - Search and filtering support
 */
function createDailyRecordSearchText(data: DailyRecordData): string {
  const searchTerms: string[] = [];

  // Date information
  if (data.dataRegistro) searchTerms.push(data.dataRegistro.toLowerCase());

  // Activity information
  if (data.atividades && data.atividades.length > 0) {
    data.atividades.forEach(activity => {
      // Activity type
      if (activity.tipoAtividade) searchTerms.push(activity.tipoAtividade.toLowerCase());

      // Subject and description
      if (activity.assunto) searchTerms.push(activity.assunto.toLowerCase());
      if (activity.descricao) searchTerms.push(activity.descricao.toLowerCase());

      // Link type
      if (activity.tipoLigacao) searchTerms.push(activity.tipoLigacao.toLowerCase());
    });
  }

  // Add common search terms
  searchTerms.push('registo', 'diário', 'diario', 'atividade', 'atividades');

  return searchTerms.join(' ');
}

/**
 * Calculate total hours for all activities in a daily record
 */
function calculateDailyTotalHours(data: DailyRecordData): string {
  if (!data.atividades || data.atividades.length === 0) {
    return '00:00';
  }

  let totalMinutes = 0;

  data.atividades.forEach(activity => {
    if (activity.totalHoras) {
      const [hours, minutes] = activity.totalHoras.split(':').map(Number);
      totalMinutes += hours * 60 + minutes;
    }
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Create the daily records router using the generic template
const dailyRecordsRouter = new Hono();

// Apply error handling middleware
dailyRecordsRouter.use('*', contentErrorHandler);

// Create daily record-specific configuration with date-based sorting (most recent first)
// Requirements: 12.5 - Chronological ordering (newest first)
const dailyRecordConfig = createStandardContentConfig<DailyRecord>('daily-records', 'date-desc');

// Override the search text extraction to use the comprehensive daily record search function
dailyRecordConfig.extractSearchableText = (content: DailyRecord) => {
  return createDailyRecordSearchText(content.data);
};

// Override the index fields extraction for daily record-specific search and display
// Requirements: 12.2 - List display information (date, activity count, total hours)
dailyRecordConfig.extractIndexFields = (content: DailyRecord) => {
  const data = content.data;

  return {
    // Basic information for search and display
    dataRegistro: data.dataRegistro || '',

    // Technician fields for filtering
    technicianUserId: data.technician?.userId ?? null,
    technicianName: data.technician ? `${data.technician.firstName} ${data.technician.lastName}` : null,
    activityCount: data.atividades?.length || 0,
    totalHours: calculateDailyTotalHours(data),

    // Activity summaries for quick reference
    activities: data.atividades?.map(activity => ({
      tipoAtividade: activity.tipoAtividade,
      assunto: activity.assunto,
      totalHoras: activity.totalHoras,
      tipoLigacao: activity.tipoLigacao,
      hasWorkSheet: !!activity.workSheetId,
      hasRemoteAssistance: !!activity.remoteAssistanceId,
    })) || [],

    // Flags for filtering
    hasInternalActivities: data.atividades?.some(a => a.tipoAtividade === 'Interno') || false,
    hasExternalActivities: data.atividades?.some(a => a.tipoAtividade === 'Externo') || false,
    hasLinkedWorkSheets: data.atividades?.some(a => !!a.workSheetId) || false,
    hasLinkedRemoteAssistance: data.atividades?.some(a => !!a.remoteAssistanceId) || false,
  };
};

// Add validation functions
dailyRecordConfig.validateCreate = validateDailyRecordCreate;
dailyRecordConfig.validateUpdate = validateDailyRecordUpdateData;

/**
 * List unique collaborators from daily records index
 * Returns sorted list of technicians who have at least one non-deleted daily record
 * Requirements: REQ-01, CA-01.1, CA-01.3
 */
interface CollaboratorEntry {
  userId: string;
  name: string;
}

dailyRecordsRouter.get('/collaborators', async (c: Context): Promise<Response> => {
  const r2Bucket = c.env?.R2_BUCKET as StorageBucket;

  if (!r2Bucket) {
    return c.json(
      { success: false, error: 'Storage not available', timestamp: new Date().toISOString() } satisfies ApiResponse,
      500
    );
  }

  let collaborators: CollaboratorEntry[] = [];
  let errorOccurred = false;

  await r2Bucket
    .get('indexes/daily-records-index.json')
    .then(async (indexObject) => {
      if (!indexObject) return;

      const index = (await indexObject.json()) as { items: Array<{ isDeleted?: boolean; technicianUserId?: string | null; technicianName?: string | null }> };
      const seen = new Map<string, string>();

      for (const item of index.items) {
        if (item.isDeleted) continue;
        if (!item.technicianUserId || !item.technicianName) continue;
        if (!seen.has(item.technicianUserId)) {
          seen.set(item.technicianUserId, item.technicianName);
        }
      }

      collaborators = Array.from(seen, ([userId, name]) => ({ userId, name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-PT'));
    })
    .catch((error: unknown) => {
      console.error('Error fetching collaborators:', error);
      errorOccurred = true;
    });

  if (errorOccurred) {
    return c.json(
      { success: false, error: 'Failed to retrieve collaborators', timestamp: new Date().toISOString() } satisfies ApiResponse,
      500
    );
  }

  return c.json({
    success: true,
    data: collaborators,
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<CollaboratorEntry[]>);
});

// Custom GET route for single daily record with activity relation resolution
// This overrides the generic GET /:uuid route to handle nested activity relations
// Requirements: 13.3, 13.4, 18.1, 18.2, 18.3, 18.4
dailyRecordsRouter.get('/:uuid', async (c: Context) => {
  try {
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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid UUID format',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 400);
    }

    // Get content directly from R2
    const key = `content/daily-records/${uuid}.json`;
    const object = await r2Bucket.get(key);
    
    if (!object) {
      const response: ApiResponse = {
        success: false,
        error: 'daily-records not found',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 404);
    }
    
    const content = (await object.json()) as DailyRecord;
    
    if (content.isDeleted) {
      const response: ApiResponse = {
        success: false,
        error: 'daily-records not found',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 404);
    }

    // Create content fetcher for relation resolution
    const contentFetcher = async (contentType: string, relationUuid: string) => {
      const relationKey = `content/${contentType}/${relationUuid}.json`;
      const relationObject = await r2Bucket.get(relationKey);
      
      if (!relationObject) return null;
      
      const relationContent = await relationObject.json();
      return relationContent.isDeleted ? null : relationContent;
    };

    // Use custom relation resolution for daily records
    const contentWithRelations = await resolveDailyRecordRelations(content, contentFetcher);

    const response: ApiResponse<ContentWithRelations<DailyRecordData>> = {
      success: true,
      data: contentWithRelations,
      timestamp: new Date().toISOString(),
    };
    return c.json(response);
  } catch (error) {
    console.error('Error retrieving daily record:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }
});

// Create and mount the generic CRUD routes (list, create, update, delete)
const crudRoutes = createContentRoutes<DailyRecord>(dailyRecordConfig);
dailyRecordsRouter.route('/', crudRoutes);

export default dailyRecordsRouter;
