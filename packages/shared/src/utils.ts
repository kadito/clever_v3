// Relation detection and resolution utilities
import type { BaseContent } from './types.js';

/**
 * Mapping from relation field names to target content types
 * This defines which content types are referenced by relation fields
 */
export const RELATION_TYPE_MAPPING: Record<string, string> = {
  clientId: 'clients',
  contractId: 'contracts',
  licenseId: 'licenses',
  workSheetId: 'work-sheets',
  dailyRecordId: 'daily-records',
  remoteAssistanceId: 'remote-assistance',
  reminderId: 'reminders',
  pendingId: 'pending',
} as const;

/**
 * Detects relation fields in content data by finding fields ending in 'Id'
 * @param data - The content data object to analyze
 * @returns Array of relation field names found in the data
 */
export function detectRelationFields(data: Record<string, any>): string[] {
  if (!data || typeof data !== 'object') {
    return [];
  }

  return Object.keys(data).filter(key => {
    // Check if field ends with 'Id' and has a non-null, non-undefined value
    return key.endsWith('Id') && data[key] != null;
  });
}

/**
 * Gets the target content type for a given relation field
 * @param relationField - The relation field name (e.g., 'clientId')
 * @returns The target content type or null if not found
 */
export function getContentTypeFromRelation(relationField: string): string | null {
  return RELATION_TYPE_MAPPING[relationField] || null;
}

/**
 * Basic field definitions for each content type
 * Defines which fields to extract for display in relation information
 */
export const BASIC_FIELD_DEFINITIONS: Record<string, string[]> = {
  clients: ['nomeEmpresa', 'nomeComercial', 'contribuinte', 'localidade'],
  contracts: ['numeroContrato', 'dataInicio', 'dataFim'],
  licenses: ['versao', 'numeroSerie', 'dataVencimento'],
  'work-sheets': ['numeroFolha', 'dataInicio', 'dataFim'],
  'daily-records': ['data', 'atividade', 'duracao'],
  'remote-assistance': ['data', 'tipo', 'duracao'],
  reminders: ['titulo', 'dataLembrete', 'prioridade'],
  pending: ['titulo', 'dataLimite', 'status'],
} as const;

/**
 * Common fallback fields used when content type is not recognized
 * These are generic fields that might exist across different content types
 */
export const COMMON_FALLBACK_FIELDS = [
  'name', 'title', 'description', 'numero', 'data', 'dataInicio', 'dataFim'
] as const;

/**
 * Extracts basic fields from content data based on content type
 * @param contentData - The content data object to extract fields from
 * @param contentType - The type of content to determine which fields to extract
 * @returns Object containing only the basic fields for the content type
 */
export function extractBasicFields(
  contentData: Record<string, any>,
  contentType: string
): Record<string, any> {
  if (!contentData || typeof contentData !== 'object') {
    return {};
  }

  // Get the basic field definitions for this content type
  const basicFields = BASIC_FIELD_DEFINITIONS[contentType];
  
  if (basicFields) {
    // Extract only the defined basic fields for this content type
    const extracted: Record<string, any> = {};
    
    for (const field of basicFields) {
      if (contentData[field] !== undefined && contentData[field] !== null) {
        extracted[field] = contentData[field];
      }
    }
    
    return extracted;
  }

  // Fallback for unknown content types - use common fields
  const extracted: Record<string, any> = {};
  
  for (const field of COMMON_FALLBACK_FIELDS) {
    if (contentData[field] !== undefined && contentData[field] !== null) {
      extracted[field] = contentData[field];
    }
  }
  
  return extracted;
}

/**
 * Content fetcher function type for dependency injection
 * This allows the resolution utility to work with different storage implementations
 */
export type ContentFetcher = (contentType: string, uuid: string) => Promise<any>;

/**
 * Resolves content relations by fetching related content and extracting basic data
 * Uses sequential resolution approach for simplicity
 * @param content - The content item to resolve relations for
 * @param fetchContent - Function to fetch content by type and UUID
 * @returns Promise resolving to content with relations field
 */
export async function resolveContentRelations<T extends BaseContent>(
  content: T,
  fetchContent: ContentFetcher
): Promise<T & { relations: Record<string, any> }> {
  const relations: Record<string, any> = {};
  
  // Detect relation fields in the content data
  const relationFields = detectRelationFields(content.data);
  
  // Resolve each relation sequentially (simple approach)
  for (const relationField of relationFields) {
    const relationId = content.data[relationField];
    const targetContentType = getContentTypeFromRelation(relationField);
    
    if (!targetContentType) {
      // Log warning for unknown relation field but continue processing
      console.warn(`Unknown relation field: ${relationField}`);
      continue;
    }
    
    // Create relation key by removing 'Id' suffix (e.g., 'clientId' -> 'client')
    const relationKey = relationField.replace(/Id$/, '');
    
    try {
      // Fetch the related content
      const relatedContent = await fetchContent(targetContentType, relationId);
      
      if (relatedContent && relatedContent.data) {
        // Extract basic fields from the related content
        const basicData = extractBasicFields(relatedContent.data, targetContentType);
        
        // Create resolved relation object
        relations[relationKey] = {
          uuid: relatedContent.uuid,
          contentType: relatedContent.contentType,
          ...basicData
        };
      } else {
        // Related content not found - return 404 error
        relations[relationKey] = {
          type: 'error',
          code: 404,
          message: 'Not found'
        };
      }
    } catch (error) {
      // Log the error for debugging but continue processing other relations
      console.warn(`Failed to resolve relation ${relationField} (${relationId}):`, error);
      
      // Return structured error information
      relations[relationKey] = {
        type: 'error',
        code: 500,
        message: 'Internal Server Error'
      };
    }
  }
  
  return {
    ...content,
    relations
  };
}
