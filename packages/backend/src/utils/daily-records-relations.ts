/**
 * Daily Records Relation Resolution Utility
 * Handles nested relation resolution for activities within daily records
 * Requirements: 13.3, 13.4, 18.1, 18.2, 18.3, 18.4
 */

import type { DailyRecord, ContentWithRelations, DailyRecordData } from '@clever/shared';
import type { ContentFetcher } from '@clever/shared';
import { extractBasicFields } from '@clever/shared';

/**
 * Resolve relations for all activities in a daily record
 * Relations are stored with keys like "activity_0_workSheet", "activity_1_remoteAssistance"
 * 
 * @param content - The daily record content
 * @param fetchContent - Function to fetch related content
 * @returns Daily record with resolved activity relations
 */
export async function resolveDailyRecordRelations(
  content: DailyRecord,
  fetchContent: ContentFetcher
): Promise<ContentWithRelations<DailyRecordData>> {
  const relations: Record<string, any> = {};

  // Iterate through each activity and resolve its relations
  if (content.data.atividades && content.data.atividades.length > 0) {
    for (let i = 0; i < content.data.atividades.length; i++) {
      const activity = content.data.atividades[i];

      // Resolve work sheet relation if present
      if (activity.workSheetId) {
        const relationKey = `activity_${i}_workSheet`;
        try {
          const relatedContent = await fetchContent('work-sheets', activity.workSheetId);

          if (relatedContent && relatedContent.data) {
            // Extract basic fields from the work sheet
            const basicData = extractBasicFields(relatedContent.data, 'work-sheets');

            // Also resolve the client name from the work sheet's clientId
            let clientName = 'Cliente não encontrado';
            if (relatedContent.data.clientId) {
              try {
                const clientContent = await fetchContent('clients', relatedContent.data.clientId);
                if (clientContent && clientContent.data) {
                  clientName = clientContent.data.nomeEmpresa || clientContent.data.nomeComercial || 'Cliente sem nome';
                }
              } catch (error) {
                console.warn(`Failed to resolve client ${relatedContent.data.clientId} for work sheet ${activity.workSheetId}:`, error);
              }
            }

            relations[relationKey] = {
              uuid: relatedContent.uuid,
              contentType: relatedContent.contentType,
              ...basicData,
              clientName, // Add resolved client name
            };
          } else {
            // Work sheet not found - return 404 error
            relations[relationKey] = {
              type: 'error',
              code: 404,
              message: 'Not found',
            };
          }
        } catch (error) {
          console.warn(`Failed to resolve work sheet ${activity.workSheetId} for activity ${i}:`, error);
          relations[relationKey] = {
            type: 'error',
            code: 500,
            message: 'Internal Server Error',
          };
        }
      }

      // Resolve remote assistance relation if present
      if (activity.remoteAssistanceId) {
        const relationKey = `activity_${i}_remoteAssistance`;
        try {
          const relatedContent = await fetchContent('remote-assistance', activity.remoteAssistanceId);

          if (relatedContent && relatedContent.data) {
            // Extract basic fields from the remote assistance
            const basicData = extractBasicFields(relatedContent.data, 'remote-assistance');

            // Also resolve the client name from the remote assistance's clientId
            let clientName = 'Cliente não encontrado';
            if (relatedContent.data.clientId) {
              try {
                const clientContent = await fetchContent('clients', relatedContent.data.clientId);
                if (clientContent && clientContent.data) {
                  clientName = clientContent.data.nomeEmpresa || clientContent.data.nomeComercial || 'Cliente sem nome';
                }
              } catch (error) {
                console.warn(`Failed to resolve client ${relatedContent.data.clientId} for remote assistance ${activity.remoteAssistanceId}:`, error);
              }
            }

            relations[relationKey] = {
              uuid: relatedContent.uuid,
              contentType: relatedContent.contentType,
              ...basicData,
              clientName, // Add resolved client name
            };
          } else {
            // Remote assistance not found - return 404 error
            relations[relationKey] = {
              type: 'error',
              code: 404,
              message: 'Not found',
            };
          }
        } catch (error) {
          console.warn(`Failed to resolve remote assistance ${activity.remoteAssistanceId} for activity ${i}:`, error);
          relations[relationKey] = {
            type: 'error',
            code: 500,
            message: 'Internal Server Error',
          };
        }
      }
    }
  }

  return {
    ...content,
    relations,
  } as ContentWithRelations<DailyRecordData>;
}
