/**
 * Comprehensive License Relation System Tests (Task 10)
 *
 * This test suite thoroughly tests the license relation system as specified in task 10:
 * - Test with existing license data that has clientId
 * - Test with licenses that have invalid/missing clientId (verify error handling)
 * - Test license creation with any clientId values (no validation during creation)
 * - Test license updates that change client relations
 * - Verify structured error handling and user experience (404/500 error display)
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { StorageBucket } from '@clever/shared';
import { createContentRoutes, createStandardContentConfig } from './routes/content-route-template';
import {
  validateLicenseCreation,
  validateLicenseUpdate,
  sanitizeLicenseData,
} from '@clever/shared';
import type { BaseContent, UserContext, ContentWithRelations, LicenseData } from '@clever/shared';

// Mock storage bucket for testing
function createMockStorageBucket(): StorageBucket {
  const storage = new Map<string, string>();

  return {
    async get(key: string) {
      const data = storage.get(key);
      if (!data) return null;

      return {
        async json() {
          return JSON.parse(data);
        },
      };
    },

    async put(key: string, value: string) {
      storage.set(key, value);
      return {
        async json() {
          return JSON.parse(value);
        },
      };
    },

    async delete(key: string) {
      storage.delete(key);
    },
  };
}

describe('Comprehensive License Relation System Tests (Task 10)', () => {
  let app: Hono;
  let mockBucket: StorageBucket;

  const mockUserContext: UserContext = {
    userId: 'test-user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    userType: 'Admin',
    sessionId: 'test-session-123',
    isAuthenticated: true,
  };

  beforeEach(() => {
    mockBucket = createMockStorageBucket();

    // Create a test app with license routes
    app = new Hono();

    // Mock the environment and user context
    app.use('*', async (c, next) => {
      c.env = { R2_BUCKET: mockBucket };
      c.set('user', mockUserContext);
      await next();
    });

    // Create license routes with validation and relation resolution
    const licenseConfig = createStandardContentConfig('licenses', 'date-desc');
    licenseConfig.validateCreate = (data: any) => {
      const sanitizedData = sanitizeLicenseData(data.data || data);
      const errors = validateLicenseCreation(sanitizedData);
      if (errors.length > 0) throw new Error(errors[0]);
      if (data.data) {
        data.data = sanitizedData;
      } else {
        Object.assign(data, sanitizedData);
      }
    };
    licenseConfig.validateUpdate = (data: any) => {
      const sanitizedData = sanitizeLicenseData(data.data || data);
      const errors = validateLicenseUpdate(sanitizedData);
      if (errors.length > 0) throw new Error(errors[0]);
      if (data.data) {
        data.data = sanitizedData;
      } else {
        Object.assign(data, sanitizedData);
      }
    };

    const licenseRoutes = createContentRoutes<BaseContent>(licenseConfig);
    app.route('/api/content/licenses', licenseRoutes);
  });

  describe('Requirement 8.1: Test with existing license data that has clientId', () => {
    it('should handle existing license with valid clientId and existing client', async () => {
      // Create a client first
      const clientUuid = '550e8400-e29b-41d4-a716-446655440000';
      const clientContent = {
        uuid: clientUuid,
        contentType: 'clients',
        createdAt: '2024-01-10T10:00:00Z',
        createdBy: 'test-user-123',
        updatedAt: '2024-01-10T10:00:00Z',
        updatedBy: 'test-user-123',
        version: 1,
        isDeleted: false,
        data: {
          nomeEmpresa: 'Empresa Existente Lda',
          nomeComercial: 'Existente',
          contribuinte: '123456789',
          localidade: 'Porto',
          telefoneContato: '220123456',
          emailContato: 'info@existente.pt',
        },
      };

      await mockBucket.put(`content/clients/${clientUuid}.json`, JSON.stringify(clientContent));

      // Create license with existing client
      const licenseData = {
        clientId: clientUuid,
        versao: '2024',
        numeroSerie: 'EXIST001',
        software: {
          name: ['Vectron'],
          model: 'Vectron Wide 14"',
        },
        invoices: [],
      };

      const createResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      expect(createResponse.status).toBe(201);
      const createResult = await createResponse.json();
      expect(createResult.success).toBe(true);

      const licenseUuid = createResult.data.uuid;

      // Retrieve license and verify client relation is properly resolved
      const getResponse = await app.request(`/api/content/licenses/${licenseUuid}`);
      expect(getResponse.status).toBe(200);

      const getResult = await getResponse.json();
      expect(getResult.success).toBe(true);
      expect(getResult.data.relations).toBeDefined();
      expect(getResult.data.relations.client).toBeDefined();

      // Verify basic client fields are properly resolved (only basic fields are included)
      const clientRelation = getResult.data.relations.client;
      expect(clientRelation.uuid).toBe(clientUuid);
      expect(clientRelation.contentType).toBe('clients');
      expect(clientRelation.nomeEmpresa).toBe('Empresa Existente Lda');
      expect(clientRelation.nomeComercial).toBe('Existente');
      expect(clientRelation.contribuinte).toBe('123456789');
      expect(clientRelation.localidade).toBe('Porto');
      // Note: telefoneContato and emailContato are not included in basic fields
    });

    it('should handle existing license with clientId but client was deleted', async () => {
      // Create a client first
      const clientUuid = '550e8400-e29b-41d4-a716-446655440001';
      const clientContent = {
        uuid: clientUuid,
        contentType: 'clients',
        createdAt: '2024-01-10T10:00:00Z',
        createdBy: 'test-user-123',
        updatedAt: '2024-01-10T10:00:00Z',
        updatedBy: 'test-user-123',
        version: 1,
        isDeleted: true, // Client is soft deleted
        deletedAt: '2024-01-10T12:00:00Z',
        deletedBy: 'test-user-123',
        data: {
          nomeEmpresa: 'Empresa Deletada Lda',
          contribuinte: '987654321',
        },
      };

      await mockBucket.put(`content/clients/${clientUuid}.json`, JSON.stringify(clientContent));

      // Create license with deleted client
      const licenseData = {
        clientId: clientUuid,
        versao: '2024',
        software: { name: ['Pix'] },
        invoices: [],
      };

      const createResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      expect(createResponse.status).toBe(201);
      const createResult = await createResponse.json();
      const licenseUuid = createResult.data.uuid;

      // Retrieve license and verify client relation shows error for deleted client
      const getResponse = await app.request(`/api/content/licenses/${licenseUuid}`);
      expect(getResponse.status).toBe(200);

      const getResult = await getResponse.json();
      expect(getResult.success).toBe(true);
      expect(getResult.data.relations).toBeDefined();
      expect(getResult.data.relations.client).toBeDefined();
      expect(getResult.data.relations.client.type).toBe('error');
      expect(getResult.data.relations.client.code).toBe(404);
      expect(getResult.data.relations.client.message).toBe('Not found');
    });

    it('should handle multiple existing licenses with different client relation states', async () => {
      // Create multiple clients
      const validClientUuid = '550e8400-e29b-41d4-a716-446655440002';
      const validClientContent = {
        uuid: validClientUuid,
        contentType: 'clients',
        createdAt: '2024-01-10T10:00:00Z',
        createdBy: 'test-user-123',
        updatedAt: '2024-01-10T10:00:00Z',
        updatedBy: 'test-user-123',
        version: 1,
        isDeleted: false,
        data: {
          nomeEmpresa: 'Cliente Válido Lda',
          contribuinte: '111222333',
        },
      };

      await mockBucket.put(
        `content/clients/${validClientUuid}.json`,
        JSON.stringify(validClientContent)
      );

      // Create licenses with different client states
      const licenses = [
        {
          clientId: validClientUuid, // Valid client
          versao: '2024',
          software: { name: ['Vectron'] },
          invoices: [],
        },
        {
          clientId: '550e8400-e29b-41d4-a716-446655440999', // Non-existent client
          versao: '2024',
          software: { name: ['Pix'] },
          invoices: [],
        },
        {
          // No clientId
          versao: '2024',
          software: { name: ['Zon Soft'] },
          invoices: [],
        },
      ];

      const createdLicenses = [];
      for (const licenseData of licenses) {
        const response = await app.request('/api/content/licenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(licenseData),
        });
        expect(response.status).toBe(201);
        const result = await response.json();
        createdLicenses.push(result.data.uuid);
      }

      // List all licenses and verify relation states
      const listResponse = await app.request('/api/content/licenses');
      expect(listResponse.status).toBe(200);

      const listResult = await listResponse.json();
      expect(listResult.success).toBe(true);
      expect(listResult.data).toHaveLength(3);

      // Verify first license has valid client relation
      const license1 = listResult.data.find((l: any) => l.data.clientId === validClientUuid);
      expect(license1.relations.client).toBeDefined();
      expect(license1.relations.client.nomeEmpresa).toBe('Cliente Válido Lda');

      // Verify second license has error relation
      const license2 = listResult.data.find(
        (l: any) => l.data.clientId === '550e8400-e29b-41d4-a716-446655440999'
      );
      expect(license2.relations.client).toBeDefined();
      expect(license2.relations.client.type).toBe('error');
      expect(license2.relations.client.code).toBe(404);

      // Verify third license has no client relation
      const license3 = listResult.data.find((l: any) => !l.data.clientId);
      expect(license3.relations).toBeDefined();
      expect(license3.relations.client).toBeUndefined();
    });
  });

  describe('Requirement 8.2: Test with licenses that have invalid/missing clientId (verify error handling)', () => {
    it('should handle license with completely invalid UUID format clientId', async () => {
      const licenseData = {
        clientId: 'not-a-uuid-at-all',
        versao: '2024',
        software: { name: ['Vectron'] },
        invoices: [],
      };

      const response = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      // Should reject invalid UUID format during creation
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('formato válido de identificador');
    });

    it('should handle license with valid UUID format but non-existent client', async () => {
      const nonExistentClientId = '550e8400-e29b-41d4-a716-446655440404';

      const licenseData = {
        clientId: nonExistentClientId,
        versao: '2024',
        software: { name: ['Pix'] },
        invoices: [],
      };

      const createResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      // Should allow creation (no validation during creation)
      expect(createResponse.status).toBe(201);
      const createResult = await createResponse.json();
      expect(createResult.success).toBe(true);

      const licenseUuid = createResult.data.uuid;

      // But should show error when retrieving
      const getResponse = await app.request(`/api/content/licenses/${licenseUuid}`);
      expect(getResponse.status).toBe(200);

      const getResult = await getResponse.json();
      expect(getResult.success).toBe(true);
      expect(getResult.data.relations.client).toBeDefined();
      expect(getResult.data.relations.client.type).toBe('error');
      expect(getResult.data.relations.client.code).toBe(404);
      expect(getResult.data.relations.client.message).toBe('Not found');
    });

    it('should handle license with null clientId', async () => {
      const licenseData = {
        clientId: null,
        versao: '2024',
        software: { name: ['Zon Soft'] },
        invoices: [],
      };

      const response = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.data.clientId).toBeUndefined();
      expect(result.data.relations).toBeDefined();
    });

    it('should handle license with empty string clientId', async () => {
      const licenseData = {
        clientId: '',
        versao: '2024',
        software: { name: ['Pt CERT'] },
        invoices: [],
      };

      const response = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.data.clientId).toBeUndefined();
      expect(result.data.relations).toBeDefined();
    });

    it('should handle license with whitespace-only clientId', async () => {
      const licenseData = {
        clientId: '   ',
        versao: '2024',
        software: { name: ['Dream Soft'] },
        invoices: [],
      };

      const response = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.data.clientId).toBeUndefined();
      expect(result.data.relations).toBeDefined();
    });
  });

  describe('Requirement 8.3: Test license creation with any clientId values (no validation during creation)', () => {
    it('should allow creation with any valid UUID format clientId without checking if client exists', async () => {
      const testCases = [
        '550e8400-e29b-41d4-a716-446655440001',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        // Note: Some UUIDs like all zeros might be rejected by validation
        'ffffffff-ffff-4fff-afff-ffffffffffff', // Valid UUID v4 format
      ];

      for (const clientId of testCases) {
        const licenseData = {
          clientId,
          versao: '2024',
          software: { name: ['Vectron'] },
          invoices: [],
        };

        const response = await app.request('/api/content/licenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(licenseData),
        });

        if (response.status !== 201) {
          const errorResult = await response.json();
          console.log(`Failed for clientId ${clientId}:`, errorResult);
        }

        expect(response.status).toBe(201);
        const result = await response.json();
        expect(result.success).toBe(true);
        expect(result.data.data.clientId).toBe(clientId);
        expect(result.data.relations).toBeDefined();

        // Since clients don't exist, should show error in relations
        expect(result.data.relations.client).toBeDefined();
        expect(result.data.relations.client.type).toBe('error');
        expect(result.data.relations.client.code).toBe(404);
      }
    });

    it('should allow creation with mixed case UUID clientId', async () => {
      const clientId = '550E8400-E29B-41D4-A716-446655440000';

      const licenseData = {
        clientId,
        versao: '2024',
        software: { name: ['Pix'] },
        invoices: [],
      };

      const response = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.data.clientId).toBe(clientId); // Keep original case
    });

    it('should allow creation with clientId that will be valid later', async () => {
      const futureClientId = '550e8400-e29b-41d4-a716-446655440100';

      // Create license first
      const licenseData = {
        clientId: futureClientId,
        versao: '2024',
        software: { name: ['Zon Soft'] },
        invoices: [],
      };

      const createLicenseResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      expect(createLicenseResponse.status).toBe(201);
      const licenseResult = await createLicenseResponse.json();
      const licenseUuid = licenseResult.data.uuid;

      // Verify license shows error initially
      const getResponse1 = await app.request(`/api/content/licenses/${licenseUuid}`);
      const getResult1 = await getResponse1.json();
      expect(getResult1.data.relations.client.type).toBe('error');
      expect(getResult1.data.relations.client.code).toBe(404);

      // Now create the client
      const clientContent = {
        uuid: futureClientId,
        contentType: 'clients',
        createdAt: '2024-01-10T10:00:00Z',
        createdBy: 'test-user-123',
        updatedAt: '2024-01-10T10:00:00Z',
        updatedBy: 'test-user-123',
        version: 1,
        isDeleted: false,
        data: {
          nomeEmpresa: 'Cliente Futuro Lda',
          contribuinte: '999888777',
        },
      };

      await mockBucket.put(`content/clients/${futureClientId}.json`, JSON.stringify(clientContent));

      // Verify license now resolves client correctly
      const getResponse2 = await app.request(`/api/content/licenses/${licenseUuid}`);
      const getResult2 = await getResponse2.json();
      expect(getResult2.data.relations.client.nomeEmpresa).toBe('Cliente Futuro Lda');
      expect(getResult2.data.relations.client.contribuinte).toBe('999888777');
    });
  });

  describe('Requirement 8.4: Test license updates that change client relations', () => {
    it('should update license to add clientId where none existed', async () => {
      // Create license without client
      const licenseData = {
        versao: '2024',
        software: { name: ['Vectron'] },
        invoices: [],
      };

      const createResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      expect(createResponse.status).toBe(201);
      const createResult = await createResponse.json();
      const licenseUuid = createResult.data.uuid;

      // Create a client
      const clientUuid = '550e8400-e29b-41d4-a716-446655440200';
      const clientContent = {
        uuid: clientUuid,
        contentType: 'clients',
        createdAt: '2024-01-10T10:00:00Z',
        createdBy: 'test-user-123',
        updatedAt: '2024-01-10T10:00:00Z',
        updatedBy: 'test-user-123',
        version: 1,
        isDeleted: false,
        data: {
          nomeEmpresa: 'Cliente Adicionado Lda',
          contribuinte: '444555666',
        },
      };

      await mockBucket.put(`content/clients/${clientUuid}.json`, JSON.stringify(clientContent));

      // Update license to add client
      const updateData = {
        clientId: clientUuid,
      };

      const updateResponse = await app.request(`/api/content/licenses/${licenseUuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      expect(updateResponse.status).toBe(200);
      const updateResult = await updateResponse.json();
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.data.clientId).toBe(clientUuid);
      expect(updateResult.data.relations.client).toBeDefined();
      expect(updateResult.data.relations.client.nomeEmpresa).toBe('Cliente Adicionado Lda');
    });

    it('should update license to change from one client to another', async () => {
      // Create two clients
      const client1Uuid = '550e8400-e29b-41d4-a716-446655440201';
      const client1Content = {
        uuid: client1Uuid,
        contentType: 'clients',
        createdAt: '2024-01-10T10:00:00Z',
        createdBy: 'test-user-123',
        updatedAt: '2024-01-10T10:00:00Z',
        updatedBy: 'test-user-123',
        version: 1,
        isDeleted: false,
        data: {
          nomeEmpresa: 'Cliente Original Lda',
          contribuinte: '111111111',
        },
      };

      const client2Uuid = '550e8400-e29b-41d4-a716-446655440202';
      const client2Content = {
        uuid: client2Uuid,
        contentType: 'clients',
        createdAt: '2024-01-10T10:00:00Z',
        createdBy: 'test-user-123',
        updatedAt: '2024-01-10T10:00:00Z',
        updatedBy: 'test-user-123',
        version: 1,
        isDeleted: false,
        data: {
          nomeEmpresa: 'Cliente Novo Lda',
          contribuinte: '222222222',
        },
      };

      await mockBucket.put(`content/clients/${client1Uuid}.json`, JSON.stringify(client1Content));
      await mockBucket.put(`content/clients/${client2Uuid}.json`, JSON.stringify(client2Content));

      // Create license with first client
      const licenseData = {
        clientId: client1Uuid,
        versao: '2024',
        software: { name: ['Pix'] },
        invoices: [],
      };

      const createResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      expect(createResponse.status).toBe(201);
      const createResult = await createResponse.json();
      const licenseUuid = createResult.data.uuid;

      // Verify initial client relation
      expect(createResult.data.relations.client.nomeEmpresa).toBe('Cliente Original Lda');

      // Update to second client
      const updateData = {
        clientId: client2Uuid,
      };

      const updateResponse = await app.request(`/api/content/licenses/${licenseUuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      expect(updateResponse.status).toBe(200);
      const updateResult = await updateResponse.json();
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.data.clientId).toBe(client2Uuid);
      expect(updateResult.data.relations.client.nomeEmpresa).toBe('Cliente Novo Lda');
      expect(updateResult.data.relations.client.contribuinte).toBe('222222222');
    });

    it('should update license to remove clientId (set to null/empty)', async () => {
      // Create client and license
      const clientUuid = '550e8400-e29b-41d4-a716-446655440203';
      const clientContent = {
        uuid: clientUuid,
        contentType: 'clients',
        createdAt: '2024-01-10T10:00:00Z',
        createdBy: 'test-user-123',
        updatedAt: '2024-01-10T10:00:00Z',
        updatedBy: 'test-user-123',
        version: 1,
        isDeleted: false,
        data: {
          nomeEmpresa: 'Cliente Para Remover Lda',
          contribuinte: '333333333',
        },
      };

      await mockBucket.put(`content/clients/${clientUuid}.json`, JSON.stringify(clientContent));

      const licenseData = {
        clientId: clientUuid,
        versao: '2024',
        software: { name: ['Zon Soft'] },
        invoices: [],
      };

      const createResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      const createResult = await createResponse.json();
      const licenseUuid = createResult.data.uuid;

      // Update to remove client (set to empty string)
      const updateData = {
        clientId: '',
      };

      const updateResponse = await app.request(`/api/content/licenses/${licenseUuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      expect(updateResponse.status).toBe(200);
      const updateResult = await updateResponse.json();
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.data.clientId).toBeUndefined();
      expect(updateResult.data.relations).toBeDefined();
    });

    it('should update license to change to non-existent client and show error', async () => {
      // Create client and license
      const existingClientUuid = '550e8400-e29b-41d4-a716-446655440204';
      const clientContent = {
        uuid: existingClientUuid,
        contentType: 'clients',
        createdAt: '2024-01-10T10:00:00Z',
        createdBy: 'test-user-123',
        updatedAt: '2024-01-10T10:00:00Z',
        updatedBy: 'test-user-123',
        version: 1,
        isDeleted: false,
        data: {
          nomeEmpresa: 'Cliente Existente Lda',
          contribuinte: '444444444',
        },
      };

      await mockBucket.put(
        `content/clients/${existingClientUuid}.json`,
        JSON.stringify(clientContent)
      );

      const licenseData = {
        clientId: existingClientUuid,
        versao: '2024',
        software: { name: ['Pt CERT'] },
        invoices: [],
      };

      const createResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      const createResult = await createResponse.json();
      const licenseUuid = createResult.data.uuid;

      // Update to non-existent client
      const nonExistentClientUuid = '550e8400-e29b-41d4-a716-446655440999';
      const updateData = {
        clientId: nonExistentClientUuid,
      };

      const updateResponse = await app.request(`/api/content/licenses/${licenseUuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      expect(updateResponse.status).toBe(200);
      const updateResult = await updateResponse.json();
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.data.clientId).toBe(nonExistentClientUuid);
      expect(updateResult.data.relations.client).toBeDefined();
      expect(updateResult.data.relations.client.type).toBe('error');
      expect(updateResult.data.relations.client.code).toBe(404);
      expect(updateResult.data.relations.client.message).toBe('Not found');
    });
  });

  describe('Requirement 8.5: Verify structured error handling and user experience (404/500 error display)', () => {
    it('should return structured 404 error for non-existent client relation', async () => {
      const nonExistentClientId = '550e8400-e29b-41d4-a716-446655440404';

      const licenseData = {
        clientId: nonExistentClientId,
        versao: '2024',
        software: { name: ['Vectron'] },
        invoices: [],
      };

      const createResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      const createResult = await createResponse.json();
      const licenseUuid = createResult.data.uuid;

      const getResponse = await app.request(`/api/content/licenses/${licenseUuid}`);
      const getResult = await getResponse.json();

      // Verify structured error format
      expect(getResult.data.relations.client).toEqual({
        type: 'error',
        code: 404,
        message: 'Not found',
      });
    });

    it('should handle multiple relation errors in the same license', async () => {
      // This test simulates a license that might have multiple relation fields in the future
      const licenseData = {
        clientId: '550e8400-e29b-41d4-a716-446655440404', // Non-existent
        versao: '2024',
        software: { name: ['Pix'] },
        invoices: [],
      };

      const createResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      const createResult = await createResponse.json();
      const licenseUuid = createResult.data.uuid;

      const getResponse = await app.request(`/api/content/licenses/${licenseUuid}`);
      const getResult = await getResponse.json();

      // Verify error structure is consistent
      expect(getResult.data.relations.client.type).toBe('error');
      expect(getResult.data.relations.client.code).toBe(404);
      expect(getResult.data.relations.client.message).toBe('Not found');

      // Verify the license data itself is still valid
      expect(getResult.data.data.clientId).toBe('550e8400-e29b-41d4-a716-446655440404');
      expect(getResult.data.data.versao).toBe('2024');
    });

    it('should maintain consistent error format across different API operations', async () => {
      const nonExistentClientId = '550e8400-e29b-41d4-a716-446655440505';

      const licenseData = {
        clientId: nonExistentClientId,
        versao: '2024',
        software: { name: ['Zon Soft'] },
        invoices: [],
      };

      // Test CREATE response
      const createResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      const createResult = await createResponse.json();
      const licenseUuid = createResult.data.uuid;

      // Verify CREATE shows error
      expect(createResult.data.relations.client).toEqual({
        type: 'error',
        code: 404,
        message: 'Not found',
      });

      // Test GET response
      const getResponse = await app.request(`/api/content/licenses/${licenseUuid}`);
      const getResult = await getResponse.json();

      // Verify GET shows same error format
      expect(getResult.data.relations.client).toEqual({
        type: 'error',
        code: 404,
        message: 'Not found',
      });

      // Test UPDATE response
      const updateResponse = await app.request(`/api/content/licenses/${licenseUuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versao: '2025' }),
      });

      const updateResult = await updateResponse.json();

      // Verify UPDATE shows same error format
      expect(updateResult.data.relations.client).toEqual({
        type: 'error',
        code: 404,
        message: 'Not found',
      });

      // Test LIST response
      const listResponse = await app.request('/api/content/licenses');
      const listResult = await listResponse.json();

      const foundLicense = listResult.data.find((l: any) => l.uuid === licenseUuid);
      expect(foundLicense.relations.client).toEqual({
        type: 'error',
        code: 404,
        message: 'Not found',
      });
    });

    it('should handle mixed success and error relations in list view', async () => {
      // Create a valid client
      const validClientUuid = '550e8400-e29b-41d4-a716-446655440300';
      const clientContent = {
        uuid: validClientUuid,
        contentType: 'clients',
        createdAt: '2024-01-10T10:00:00Z',
        createdBy: 'test-user-123',
        updatedAt: '2024-01-10T10:00:00Z',
        updatedBy: 'test-user-123',
        version: 1,
        isDeleted: false,
        data: {
          nomeEmpresa: 'Cliente Válido Para Lista',
          contribuinte: '555666777',
        },
      };

      await mockBucket.put(
        `content/clients/${validClientUuid}.json`,
        JSON.stringify(clientContent)
      );

      // Create licenses with different relation states
      const licenses = [
        {
          clientId: validClientUuid, // Valid
          versao: '2024',
          software: { name: ['Vectron'] },
          invoices: [],
        },
        {
          clientId: '550e8400-e29b-41d4-a716-446655440404', // Invalid
          versao: '2024',
          software: { name: ['Pix'] },
          invoices: [],
        },
        {
          // No client
          versao: '2024',
          software: { name: ['Zon Soft'] },
          invoices: [],
        },
      ];

      // Create all licenses
      for (const licenseData of licenses) {
        await app.request('/api/content/licenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(licenseData),
        });
      }

      // Get list and verify mixed states
      const listResponse = await app.request('/api/content/licenses');
      const listResult = await listResponse.json();

      expect(listResult.data).toHaveLength(3);

      // Find and verify each license
      const validLicense = listResult.data.find((l: any) => l.data.clientId === validClientUuid);
      expect(validLicense.relations.client.nomeEmpresa).toBe('Cliente Válido Para Lista');

      const errorLicense = listResult.data.find(
        (l: any) => l.data.clientId === '550e8400-e29b-41d4-a716-446655440404'
      );
      expect(errorLicense.relations.client.type).toBe('error');
      expect(errorLicense.relations.client.code).toBe(404);

      const noClientLicense = listResult.data.find((l: any) => !l.data.clientId);
      expect(noClientLicense.relations).toBeDefined();
      expect(noClientLicense.relations.client).toBeUndefined();
    });

    it('should provide user-friendly error messages for different error scenarios', async () => {
      // Test various error scenarios that might occur
      const testCases = [
        {
          name: 'Non-existent client',
          clientId: '550e8400-e29b-41d4-a716-446655440404',
          expectedCode: 404,
          expectedMessage: 'Not found',
        },
      ];

      for (const testCase of testCases) {
        const licenseData = {
          clientId: testCase.clientId,
          versao: '2024',
          software: { name: ['Vectron'] },
          invoices: [],
        };

        const createResponse = await app.request('/api/content/licenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(licenseData),
        });

        const createResult = await createResponse.json();
        const licenseUuid = createResult.data.uuid;

        const getResponse = await app.request(`/api/content/licenses/${licenseUuid}`);
        const getResult = await getResponse.json();

        expect(getResult.data.relations.client.type).toBe('error');
        expect(getResult.data.relations.client.code).toBe(testCase.expectedCode);
        expect(getResult.data.relations.client.message).toBe(testCase.expectedMessage);
      }
    });
  });
});
