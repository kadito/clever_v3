import { describe, it, expect } from 'vitest';
import {
  detectRelationFields,
  getContentTypeFromRelation,
  RELATION_TYPE_MAPPING,
  extractBasicFields,
  BASIC_FIELD_DEFINITIONS,
  COMMON_FALLBACK_FIELDS,
  resolveContentRelations,
  type ContentFetcher,
} from './utils';

describe('Relation Detection Utilities', () => {
  describe('detectRelationFields', () => {
    it('should detect fields ending in Id with non-null values', () => {
      const data = {
        clientId: 'client-uuid-123',
        contractId: 'contract-uuid-456',
        name: 'Test Name',
        description: 'Test Description',
      };

      const result = detectRelationFields(data);
      expect(result).toEqual(['clientId', 'contractId']);
    });

    it('should ignore fields ending in Id with null values', () => {
      const data = {
        clientId: 'client-uuid-123',
        contractId: null,
        licenseId: undefined,
        name: 'Test Name',
      };

      const result = detectRelationFields(data);
      expect(result).toEqual(['clientId']);
    });

    it('should ignore fields not ending in Id', () => {
      const data = {
        clientName: 'Client Name',
        contractNumber: '12345',
        userId: 'user-123', // This should be detected
        description: 'Test Description',
      };

      const result = detectRelationFields(data);
      expect(result).toEqual(['userId']);
    });

    it('should return empty array for empty object', () => {
      const result = detectRelationFields({});
      expect(result).toEqual([]);
    });

    it('should return empty array for null or undefined input', () => {
      expect(detectRelationFields(null as any)).toEqual([]);
      expect(detectRelationFields(undefined as any)).toEqual([]);
    });

    it('should return empty array for non-object input', () => {
      expect(detectRelationFields('string' as any)).toEqual([]);
      expect(detectRelationFields(123 as any)).toEqual([]);
      expect(detectRelationFields(true as any)).toEqual([]);
    });

    it('should handle complex nested objects', () => {
      const data = {
        clientId: 'client-uuid-123',
        metadata: {
          contractId: 'contract-uuid-456', // Nested relation fields should not be detected
        },
        workSheetId: 'worksheet-uuid-789',
      };

      const result = detectRelationFields(data);
      expect(result).toEqual(['clientId', 'workSheetId']);
    });

    it('should handle various field patterns ending in Id', () => {
      const data = {
        clientId: 'client-123',
        remoteAssistanceId: 'remote-456',
        dailyRecordId: 'daily-789',
        someOtherId: 'other-999',
        notARelation: 'not-relation', // This should NOT be detected as it doesn't end in 'Id'
      };

      const result = detectRelationFields(data);
      expect(result).toEqual(['clientId', 'remoteAssistanceId', 'dailyRecordId', 'someOtherId']);
    });
  });

  describe('getContentTypeFromRelation', () => {
    it('should return correct content type for known relation fields', () => {
      expect(getContentTypeFromRelation('clientId')).toBe('clients');
      expect(getContentTypeFromRelation('contractId')).toBe('contracts');
      expect(getContentTypeFromRelation('licenseId')).toBe('licenses');
      expect(getContentTypeFromRelation('workSheetId')).toBe('work-sheets');
      expect(getContentTypeFromRelation('dailyRecordId')).toBe('daily-records');
      expect(getContentTypeFromRelation('remoteAssistanceId')).toBe('remote-assistance');
      expect(getContentTypeFromRelation('reminderId')).toBe('reminders');
      expect(getContentTypeFromRelation('pendingId')).toBe('pending');
    });

    it('should return null for unknown relation fields', () => {
      expect(getContentTypeFromRelation('unknownId')).toBeNull();
      expect(getContentTypeFromRelation('randomField')).toBeNull();
      expect(getContentTypeFromRelation('notAnId')).toBeNull();
    });

    it('should return null for empty or invalid input', () => {
      expect(getContentTypeFromRelation('')).toBeNull();
      expect(getContentTypeFromRelation(null as any)).toBeNull();
      expect(getContentTypeFromRelation(undefined as any)).toBeNull();
    });

    it('should be case sensitive', () => {
      expect(getContentTypeFromRelation('ClientId')).toBeNull(); // Capital C
      expect(getContentTypeFromRelation('clientid')).toBeNull(); // Lowercase
      expect(getContentTypeFromRelation('clientId')).toBe('clients'); // Correct case
    });
  });

  describe('RELATION_TYPE_MAPPING', () => {
    it('should contain all expected relation mappings', () => {
      const expectedMappings = {
        clientId: 'clients',
        contractId: 'contracts',
        licenseId: 'licenses',
        workSheetId: 'work-sheets',
        dailyRecordId: 'daily-records',
        remoteAssistanceId: 'remote-assistance',
        reminderId: 'reminders',
        pendingId: 'pending',
      };

      expect(RELATION_TYPE_MAPPING).toEqual(expectedMappings);
    });
  });

  describe('extractBasicFields', () => {
    describe('clients content type', () => {
      it('should extract basic client fields', () => {
        const clientData = {
          nomeEmpresa: 'Empresa ABC Lda',
          nomeComercial: 'ABC',
          contribuinte: '123456789',
          localidade: 'Lisboa',
          telefone: '123456789',
          email: 'test@example.com',
          morada: 'Rua Test, 123',
        };

        const result = extractBasicFields(clientData, 'clients');

        expect(result).toEqual({
          nomeEmpresa: 'Empresa ABC Lda',
          nomeComercial: 'ABC',
          contribuinte: '123456789',
          localidade: 'Lisboa',
        });
      });

      it('should handle missing client fields gracefully', () => {
        const clientData = {
          nomeEmpresa: 'Empresa ABC Lda',
          contribuinte: '123456789',
          telefone: '123456789', // Not a basic field
        };

        const result = extractBasicFields(clientData, 'clients');

        expect(result).toEqual({
          nomeEmpresa: 'Empresa ABC Lda',
          contribuinte: '123456789',
        });
      });

      it('should ignore null and undefined client fields', () => {
        const clientData = {
          nomeEmpresa: 'Empresa ABC Lda',
          nomeComercial: null,
          contribuinte: undefined,
          localidade: 'Lisboa',
        };

        const result = extractBasicFields(clientData, 'clients');

        expect(result).toEqual({
          nomeEmpresa: 'Empresa ABC Lda',
          localidade: 'Lisboa',
        });
      });
    });

    describe('contracts content type', () => {
      it('should extract basic contract fields', () => {
        const contractData = {
          numeroContrato: 'CT-2024-001',
          dataInicio: '2024-01-01',
          dataFim: '2024-12-31',
          valor: 1000,
          clientId: 'client-uuid-123',
          observacoes: 'Contract notes',
        };

        const result = extractBasicFields(contractData, 'contracts');

        expect(result).toEqual({
          numeroContrato: 'CT-2024-001',
        });
      });

      it('should handle missing contract fields gracefully', () => {
        const contractData = {
          numeroContrato: 'CT-2024-001',
          valor: 1000,
        };

        const result = extractBasicFields(contractData, 'contracts');

        expect(result).toEqual({
          numeroContrato: 'CT-2024-001',
        });
      });
    });

    describe('unknown content types', () => {
      it('should use fallback fields for unknown content types', () => {
        const unknownData = {
          name: 'Test Name',
          title: 'Test Title',
          description: 'Test Description',
          numero: '12345',
          data: '2024-01-01',
          customField: 'Custom Value',
          anotherField: 'Another Value',
        };

        const result = extractBasicFields(unknownData, 'unknown-type');

        expect(result).toEqual({
          name: 'Test Name',
          title: 'Test Title',
          description: 'Test Description',
          numero: '12345',
          data: '2024-01-01',
        });
      });

      it('should handle empty fallback results for unknown types', () => {
        const unknownData = {
          customField: 'Custom Value',
          anotherField: 'Another Value',
        };

        const result = extractBasicFields(unknownData, 'unknown-type');

        expect(result).toEqual({});
      });

      it('should ignore null and undefined fallback fields', () => {
        const unknownData = {
          name: 'Test Name',
          title: null,
          description: undefined,
          numero: '12345',
        };

        const result = extractBasicFields(unknownData, 'unknown-type');

        expect(result).toEqual({
          name: 'Test Name',
          numero: '12345',
        });
      });
    });

    describe('edge cases', () => {
      it('should return empty object for null input', () => {
        const result = extractBasicFields(null as any, 'clients');
        expect(result).toEqual({});
      });

      it('should return empty object for undefined input', () => {
        const result = extractBasicFields(undefined as any, 'clients');
        expect(result).toEqual({});
      });

      it('should return empty object for non-object input', () => {
        expect(extractBasicFields('string' as any, 'clients')).toEqual({});
        expect(extractBasicFields(123 as any, 'clients')).toEqual({});
        expect(extractBasicFields(true as any, 'clients')).toEqual({});
      });

      it('should return empty object for empty object input', () => {
        const result = extractBasicFields({}, 'clients');
        expect(result).toEqual({});
      });
    });

    describe('all defined content types', () => {
      it('should have basic field definitions for all content types', () => {
        const expectedContentTypes = [
          'clients',
          'contracts',
          'licenses',
          'work-sheets',
          'daily-records',
          'remote-assistance',
          'reminders',
          'pending',
        ];

        for (const contentType of expectedContentTypes) {
          expect(BASIC_FIELD_DEFINITIONS[contentType]).toBeDefined();
          expect(Array.isArray(BASIC_FIELD_DEFINITIONS[contentType])).toBe(true);
          expect(BASIC_FIELD_DEFINITIONS[contentType].length).toBeGreaterThan(0);
        }
      });

      it('should extract fields for all defined content types', () => {
        const testData = {
          // Client fields
          nomeEmpresa: 'Test Company',
          nomeComercial: 'Test Commercial',
          contribuinte: '123456789',
          localidade: 'Test Location',

          // Contract fields
          numeroContrato: 'CT-001',
          dataInicio: '2024-01-01',
          dataFim: '2024-12-31',

          // License fields
          versao: '2024',
          numeroSerie: 'SN-001',
          dataVencimento: '2024-12-31',

          // Work sheet fields
          numeroFolha: 'WS-001',

          // Daily record fields
          atividade: 'Test Activity',
          duracao: '2h',

          // Remote assistance fields
          tipo: 'Remote Support',

          // Reminder fields
          titulo: 'Test Reminder',
          dataLembrete: '2024-01-01',
          prioridade: 'High',

          // Pending fields
          dataLimite: '2024-01-01',
          status: 'Pending',

          // Common field
          data: '2024-01-01',
        };

        // Test each content type
        const clientResult = extractBasicFields(testData, 'clients');
        expect(clientResult).toHaveProperty('nomeEmpresa');
        expect(clientResult).toHaveProperty('nomeComercial');
        expect(clientResult).toHaveProperty('contribuinte');
        expect(clientResult).toHaveProperty('localidade');

        const contractResult = extractBasicFields(testData, 'contracts');
        expect(contractResult).toHaveProperty('numeroContrato');

        const licenseResult = extractBasicFields(testData, 'licenses');
        expect(licenseResult).toHaveProperty('versao');
        expect(licenseResult).toHaveProperty('numeroSerie');
        expect(licenseResult).toHaveProperty('dataVencimento');
      });
    });
  });

  describe('BASIC_FIELD_DEFINITIONS', () => {
    it('should contain definitions for all expected content types', () => {
      const expectedContentTypes = [
        'clients',
        'contracts',
        'licenses',
        'work-sheets',
        'daily-records',
        'remote-assistance',
        'reminders',
        'pending',
      ];

      for (const contentType of expectedContentTypes) {
        expect(BASIC_FIELD_DEFINITIONS).toHaveProperty(contentType);
        expect(Array.isArray(BASIC_FIELD_DEFINITIONS[contentType])).toBe(true);
      }
    });

    it('should have correct field definitions for clients', () => {
      expect(BASIC_FIELD_DEFINITIONS.clients).toEqual([
        'nomeEmpresa',
        'nomeComercial',
        'contribuinte',
        'localidade',
      ]);
    });

    it('should have correct field definitions for contracts', () => {
      expect(BASIC_FIELD_DEFINITIONS.contracts).toEqual([
        'numeroContrato',
        'paymentFrequency',
        'hasCPAContract',
        'cpaContractType',
        'planIdCPA',
        'inicioContratoCPA',
        'fimContratoCPA',
        'hasSHContract',
        'shContractType',
        'planIdSH',
        'inicioContratoSH',
        'fimContratoSH',
      ]);
    });
  });

  describe('COMMON_FALLBACK_FIELDS', () => {
    it('should contain expected fallback fields', () => {
      const expectedFields = [
        'name',
        'title',
        'description',
        'numero',
        'data',
        'dataInicio',
        'dataFim',
      ];

      expect(COMMON_FALLBACK_FIELDS).toEqual(expectedFields);
    });
  });
});

describe('Relation Resolution Utilities', () => {
  // Mock content fetcher for testing
  const createMockContentFetcher = (mockData: Record<string, any>): ContentFetcher => {
    return async (contentType: string, uuid: string) => {
      const key = `${contentType}:${uuid}`;
      return mockData[key] || null;
    };
  };

  describe('resolveContentRelations', () => {
    it('should resolve single client relation successfully', async () => {
      const mockClient = {
        uuid: 'client-uuid-123',
        contentType: 'clients',
        data: {
          nomeEmpresa: 'Empresa ABC Lda',
          nomeComercial: 'ABC',
          contribuinte: '123456789',
          localidade: 'Lisboa',
          telefone: '123456789',
          email: 'test@example.com',
        },
      };

      const mockFetcher = createMockContentFetcher({
        'clients:client-uuid-123': mockClient,
      });

      const licenseContent = {
        uuid: 'license-uuid-456',
        contentType: 'licenses',
        data: {
          clientId: 'client-uuid-123',
          versao: '2024',
          numeroSerie: 'SN-001',
        },
      };

      const result = await resolveContentRelations(licenseContent, mockFetcher);

      expect(result).toEqual({
        uuid: 'license-uuid-456',
        contentType: 'licenses',
        data: {
          clientId: 'client-uuid-123',
          versao: '2024',
          numeroSerie: 'SN-001',
        },
        relations: {
          client: {
            uuid: 'client-uuid-123',
            contentType: 'clients',
            nomeEmpresa: 'Empresa ABC Lda',
            nomeComercial: 'ABC',
            contribuinte: '123456789',
            localidade: 'Lisboa',
          },
        },
      });
    });

    it('should resolve multiple relations successfully', async () => {
      const mockClient = {
        uuid: 'client-uuid-123',
        contentType: 'clients',
        data: {
          nomeEmpresa: 'Empresa ABC Lda',
          contribuinte: '123456789',
          localidade: 'Lisboa',
        },
      };

      const mockContract = {
        uuid: 'contract-uuid-456',
        contentType: 'contracts',
        data: {
          numeroContrato: 'CT-2024-001',
          dataInicio: '2024-01-01',
          dataFim: '2024-12-31',
          valor: 1000,
        },
      };

      const mockFetcher = createMockContentFetcher({
        'clients:client-uuid-123': mockClient,
        'contracts:contract-uuid-456': mockContract,
      });

      const workSheetContent = {
        uuid: 'worksheet-uuid-789',
        contentType: 'work-sheets',
        data: {
          clientId: 'client-uuid-123',
          contractId: 'contract-uuid-456',
          numeroFolha: 'WS-001',
          dataInicio: '2024-01-01',
        },
      };

      const result = await resolveContentRelations(workSheetContent, mockFetcher);

      expect(result.relations).toHaveProperty('client');
      expect(result.relations).toHaveProperty('contract');
      expect(result.relations.client).toEqual({
        uuid: 'client-uuid-123',
        contentType: 'clients',
        nomeEmpresa: 'Empresa ABC Lda',
        contribuinte: '123456789',
        localidade: 'Lisboa',
      });
      expect(result.relations.contract).toEqual({
        uuid: 'contract-uuid-456',
        contentType: 'contracts',
        numeroContrato: 'CT-2024-001',
      });
    });

    it('should handle missing related content with 404 error', async () => {
      const mockFetcher = createMockContentFetcher({}); // Empty mock data

      const licenseContent = {
        uuid: 'license-uuid-456',
        contentType: 'licenses',
        data: {
          clientId: 'non-existent-client-uuid',
          versao: '2024',
        },
      };

      const result = await resolveContentRelations(licenseContent, mockFetcher);

      expect(result.relations).toEqual({
        client: {
          type: 'error',
          code: 404,
          message: 'Not found',
        },
      });
    });

    it('should handle content fetcher errors with 500 error', async () => {
      const mockFetcher: ContentFetcher = async () => {
        throw new Error('Network error');
      };

      const licenseContent = {
        uuid: 'license-uuid-456',
        contentType: 'licenses',
        data: {
          clientId: 'client-uuid-123',
          versao: '2024',
        },
      };

      const result = await resolveContentRelations(licenseContent, mockFetcher);

      expect(result.relations).toEqual({
        client: {
          type: 'error',
          code: 500,
          message: 'Internal Server Error',
        },
      });
    });

    it('should handle content with no relations', async () => {
      const mockFetcher = createMockContentFetcher({});

      const clientContent = {
        uuid: 'client-uuid-123',
        contentType: 'clients',
        data: {
          nomeEmpresa: 'Empresa ABC Lda',
          contribuinte: '123456789',
          localidade: 'Lisboa',
        },
      };

      const result = await resolveContentRelations(clientContent, mockFetcher);

      expect(result.relations).toEqual({});
    });

    it('should handle content with null relation IDs', async () => {
      const mockFetcher = createMockContentFetcher({});

      const licenseContent = {
        uuid: 'license-uuid-456',
        contentType: 'licenses',
        data: {
          clientId: null,
          contractId: undefined,
          versao: '2024',
        },
      };

      const result = await resolveContentRelations(licenseContent, mockFetcher);

      expect(result.relations).toEqual({});
    });

    it('should handle unknown relation fields gracefully', async () => {
      const mockFetcher = createMockContentFetcher({});

      const contentWithUnknownRelation = {
        uuid: 'content-uuid-123',
        contentType: 'unknown',
        data: {
          unknownRelationId: 'some-uuid',
          name: 'Test Content',
        },
      };

      const result = await resolveContentRelations(contentWithUnknownRelation, mockFetcher);

      // Should not include the unknown relation in the result
      expect(result.relations).toEqual({});
    });

    it('should handle mixed success and error scenarios', async () => {
      const mockClient = {
        uuid: 'client-uuid-123',
        contentType: 'clients',
        data: {
          nomeEmpresa: 'Empresa ABC Lda',
          contribuinte: '123456789',
        },
      };

      const mockFetcher = createMockContentFetcher({
        'clients:client-uuid-123': mockClient,
        // Missing contract data will cause 404 error
      });

      const workSheetContent = {
        uuid: 'worksheet-uuid-789',
        contentType: 'work-sheets',
        data: {
          clientId: 'client-uuid-123',
          contractId: 'non-existent-contract-uuid',
          numeroFolha: 'WS-001',
        },
      };

      const result = await resolveContentRelations(workSheetContent, mockFetcher);

      expect(result.relations.client).toEqual({
        uuid: 'client-uuid-123',
        contentType: 'clients',
        nomeEmpresa: 'Empresa ABC Lda',
        contribuinte: '123456789',
      });

      expect(result.relations.contract).toEqual({
        type: 'error',
        code: 404,
        message: 'Not found',
      });
    });

    it('should handle related content with missing data field', async () => {
      const mockClientWithoutData = {
        uuid: 'client-uuid-123',
        contentType: 'clients',
        // Missing data field
      };

      const mockFetcher = createMockContentFetcher({
        'clients:client-uuid-123': mockClientWithoutData,
      });

      const licenseContent = {
        uuid: 'license-uuid-456',
        contentType: 'licenses',
        data: {
          clientId: 'client-uuid-123',
          versao: '2024',
        },
      };

      const result = await resolveContentRelations(licenseContent, mockFetcher);

      expect(result.relations).toEqual({
        client: {
          type: 'error',
          code: 404,
          message: 'Not found',
        },
      });
    });

    it('should preserve original content structure', async () => {
      const mockFetcher = createMockContentFetcher({});

      const originalContent = {
        uuid: 'content-uuid-123',
        contentType: 'clients',
        data: {
          nomeEmpresa: 'Test Company',
          contribuinte: '123456789',
        },
      };

      const result = await resolveContentRelations(originalContent, mockFetcher);

      // Should preserve all original fields
      expect(result.uuid).toBe(originalContent.uuid);
      expect(result.contentType).toBe(originalContent.contentType);
      expect(result.data).toEqual(originalContent.data);
      expect(result).toHaveProperty('relations');
    });

    it('should extract only basic fields from related content', async () => {
      const mockClient = {
        uuid: 'client-uuid-123',
        contentType: 'clients',
        data: {
          // Basic fields (should be included)
          nomeEmpresa: 'Empresa ABC Lda',
          nomeComercial: 'ABC',
          contribuinte: '123456789',
          localidade: 'Lisboa',

          // Non-basic fields (should be excluded)
          telefone: '123456789',
          email: 'test@example.com',
          morada: 'Rua Test, 123',
          observacoes: 'Client notes',
          createdAt: '2024-01-01T00:00:00Z',
        },
      };

      const mockFetcher = createMockContentFetcher({
        'clients:client-uuid-123': mockClient,
      });

      const licenseContent = {
        uuid: 'license-uuid-456',
        contentType: 'licenses',
        data: {
          clientId: 'client-uuid-123',
          versao: '2024',
        },
      };

      const result = await resolveContentRelations(licenseContent, mockFetcher);

      // Should only include basic fields defined in BASIC_FIELD_DEFINITIONS
      expect(result.relations.client).toEqual({
        uuid: 'client-uuid-123',
        contentType: 'clients',
        nomeEmpresa: 'Empresa ABC Lda',
        nomeComercial: 'ABC',
        contribuinte: '123456789',
        localidade: 'Lisboa',
      });

      // Should not include non-basic fields
      expect(result.relations.client).not.toHaveProperty('telefone');
      expect(result.relations.client).not.toHaveProperty('email');
      expect(result.relations.client).not.toHaveProperty('morada');
      expect(result.relations.client).not.toHaveProperty('observacoes');
      expect(result.relations.client).not.toHaveProperty('createdAt');
    });
  });
});
