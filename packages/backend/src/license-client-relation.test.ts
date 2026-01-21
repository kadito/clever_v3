/**
 * License-Client Relation Integration Tests
 *
 * Tests the complete license-client relation functionality as specified in task 8:
 * - Update license API endpoints to use relation resolution
 * - Test license creation with clientId (no validation during creation)
 * - Test license retrieval with resolved client data and error handling
 * - Verify license updates maintain client relations
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
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
import type { BaseContent, UserContext } from '@clever/shared';

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

describe('License-Client Relation Integration (Task 8)', () => {
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
      // First sanitize the data
      const sanitizedData = sanitizeLicenseData(data.data || data);
      // Then validate the sanitized data
      const errors = validateLicenseCreation(sanitizedData);
      if (errors.length > 0) throw new Error(errors[0]);
      // Update the original data with sanitized values
      if (data.data) {
        data.data = sanitizedData;
      } else {
        Object.assign(data, sanitizedData);
      }
    };
    licenseConfig.validateUpdate = (data: any) => {
      // First sanitize the data
      const sanitizedData = sanitizeLicenseData(data.data || data);
      // Then validate the sanitized data
      const errors = validateLicenseUpdate(sanitizedData);
      if (errors.length > 0) throw new Error(errors[0]);
      // Update the original data with sanitized values
      if (data.data) {
        data.data = sanitizedData;
      } else {
        Object.assign(data, sanitizedData);
      }
    };

    const licenseRoutes = createContentRoutes<BaseContent>(licenseConfig);
    app.route('/api/content/licenses', licenseRoutes);
  });

  describe('Requirement 5.1: License content with clientId relation to Client content', () => {
    it('should create license with clientId relation without validating client exists', async () => {
      const licenseData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID format
        versao: '2024',
        numeroSerie: 'ABC123',
        software: {
          name: ['Vectron'],
          model: 'Vectron Wide 14"',
        },
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
      expect(result.data.data.clientId).toBe(licenseData.clientId);
      expect(result.data.contentType).toBe('licenses');

      // Verify relation resolution structure is present
      expect(result.data.relations).toBeDefined();
    });

    it('should create license without clientId (optional relation)', async () => {
      const licenseData = {
        versao: '2024',
        numeroSerie: 'XYZ789',
        software: {
          name: ['Pix'],
          product: 'Pix rest',
        },
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

      // Verify relation resolution structure is present even without relations
      expect(result.data.relations).toBeDefined();
    });

    it('should reject license creation with invalid clientId format', async () => {
      const licenseData = {
        clientId: 'invalid-uuid-format',
        versao: '2024',
        software: {
          name: ['Zon Soft'],
          product: 'ZSFACT',
        },
        invoices: [],
      };

      const response = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('formato válido de identificador');
    });
  });

  describe('Requirement 5.2: License retrieval with resolved client data and error handling', () => {
    it('should retrieve license with resolved client relation when client exists', async () => {
      // First create a client
      const clientData = {
        nomeEmpresa: 'Empresa Teste Lda',
        contribuinte: '123456789',
        localidade: 'Lisboa',
      };

      // Mock client storage
      const clientUuid = '123e4567-e89b-12d3-a456-426614174000';
      const clientContent = {
        uuid: clientUuid,
        contentType: 'clients',
        createdAt: '2024-01-10T10:00:00Z',
        createdBy: 'test-user-123',
        updatedAt: '2024-01-10T10:00:00Z',
        updatedBy: 'test-user-123',
        version: 1,
        isDeleted: false,
        data: clientData,
      };

      await mockBucket.put(`content/clients/${clientUuid}.json`, JSON.stringify(clientContent));

      // Create license with client relation
      const licenseData = {
        clientId: clientUuid,
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

      // Retrieve license and verify client relation is resolved
      const getResponse = await app.request(`/api/content/licenses/${licenseUuid}`);
      expect(getResponse.status).toBe(200);

      const getResult = await getResponse.json();
      expect(getResult.success).toBe(true);
      expect(getResult.data.relations).toBeDefined();
      expect(getResult.data.relations.client).toBeDefined();
      expect(getResult.data.relations.client.nomeEmpresa).toBe('Empresa Teste Lda');
      expect(getResult.data.relations.client.contribuinte).toBe('123456789');
    });

    it('should retrieve license with error when client does not exist', async () => {
      // Create license with non-existent client
      const licenseData = {
        clientId: '987fcdeb-51a2-43d1-9f12-123456789abc', // Non-existent client
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

      // Retrieve license and verify client relation shows error
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

    it('should list licenses with resolved client relations', async () => {
      // Create a client first
      const clientUuid = '123e4567-e89b-12d3-a456-426614174000';
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
          nomeEmpresa: 'Cliente Lista Teste',
          contribuinte: '987654321',
        },
      };

      await mockBucket.put(`content/clients/${clientUuid}.json`, JSON.stringify(clientContent));

      // Create license with client relation
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

      expect(createResponse.status).toBe(201);

      // List licenses and verify relations are resolved
      const listResponse = await app.request('/api/content/licenses');
      expect(listResponse.status).toBe(200);

      const listResult = await listResponse.json();
      expect(listResult.success).toBe(true);
      expect(listResult.data).toHaveLength(1);

      const license = listResult.data[0];
      expect(license.relations).toBeDefined();
      expect(license.relations.client).toBeDefined();
      expect(license.relations.client.nomeEmpresa).toBe('Cliente Lista Teste');
    });
  });

  describe('Requirement 5.3: License updates maintain client relations', () => {
    it('should update license with new clientId and maintain relation resolution', async () => {
      // Create initial license without client
      const initialData = {
        versao: '2024',
        software: { name: ['Pt CERT'] },
        invoices: [],
      };

      const createResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialData),
      });

      expect(createResponse.status).toBe(201);
      const createResult = await createResponse.json();
      const licenseUuid = createResult.data.uuid;

      // Update with clientId
      const updateData = {
        clientId: '987fcdeb-51a2-43d1-9f12-123456789abc',
      };

      const updateResponse = await app.request(`/api/content/licenses/${licenseUuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      expect(updateResponse.status).toBe(200);
      const updateResult = await updateResponse.json();
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.data.clientId).toBe(updateData.clientId);

      // Verify relation resolution is maintained
      expect(updateResult.data.relations).toBeDefined();
      expect(updateResult.data.relations.client).toBeDefined();
      // Since client doesn't exist, should show error
      expect(updateResult.data.relations.client.type).toBe('error');
      expect(updateResult.data.relations.client.code).toBe(404);
    });

    it('should update license to remove clientId (set to empty)', async () => {
      // Create license with client
      const initialData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        versao: '2024',
        software: { name: ['Dream Soft'] },
        invoices: [],
      };

      const createResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialData),
      });

      expect(createResponse.status).toBe(201);
      const createResult = await createResponse.json();
      const licenseUuid = createResult.data.uuid;

      // Update to remove clientId
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

      // Verify relation resolution structure is maintained
      expect(updateResult.data.relations).toBeDefined();
    });

    it('should update other license fields while preserving client relation', async () => {
      // Create a client first
      const clientUuid = '123e4567-e89b-12d3-a456-426614174000';
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
          nomeEmpresa: 'Cliente Preservado',
          contribuinte: '111222333',
        },
      };

      await mockBucket.put(`content/clients/${clientUuid}.json`, JSON.stringify(clientContent));

      // Create license with client
      const initialData = {
        clientId: clientUuid,
        versao: '2024',
        numeroSerie: 'OLD123',
        software: { name: ['Cashlogy'] },
        invoices: [],
      };

      const createResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialData),
      });

      expect(createResponse.status).toBe(201);
      const createResult = await createResponse.json();
      const licenseUuid = createResult.data.uuid;

      // Update other fields while preserving client relation
      const updateData = {
        versao: '2025',
        numeroSerie: 'NEW456',
      };

      const updateResponse = await app.request(`/api/content/licenses/${licenseUuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      expect(updateResponse.status).toBe(200);
      const updateResult = await updateResponse.json();
      expect(updateResult.success).toBe(true);

      // Verify updated fields
      expect(updateResult.data.data.versao).toBe('2025');
      expect(updateResult.data.data.numeroSerie).toBe('NEW456');

      // Verify client relation is preserved and resolved
      expect(updateResult.data.data.clientId).toBe(clientUuid);
      expect(updateResult.data.relations.client).toBeDefined();
      expect(updateResult.data.relations.client.nomeEmpresa).toBe('Cliente Preservado');
    });
  });

  describe('Requirement 5.4: All relations use the same simple pattern without configuration', () => {
    it('should handle license relations using the same pattern as other content types', async () => {
      const licenseData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        versao: '2024',
        software: { name: ['AIR Menu'] },
        invoices: [],
      };

      const response = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      expect(response.status).toBe(201);
      const result = await response.json();

      // Verify the response follows the standard ContentWithRelations pattern
      expect(result.data).toHaveProperty('uuid');
      expect(result.data).toHaveProperty('contentType', 'licenses');
      expect(result.data).toHaveProperty('data');
      expect(result.data).toHaveProperty('relations');
      expect(result.data).toHaveProperty('createdAt');
      expect(result.data).toHaveProperty('updatedAt');
      expect(result.data).toHaveProperty('version');

      // Verify relation structure follows the standard pattern
      expect(result.data.relations).toBeTypeOf('object');

      // Verify clientId field follows the standard naming pattern
      expect(result.data.data.clientId).toBe(licenseData.clientId);
    });

    it('should search licenses with relation data included', async () => {
      // Create license with searchable content
      const licenseData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        versao: '2024',
        numeroSerie: 'SEARCH123',
        software: {
          name: ['Software XD'],
          product: 'Test Product',
        },
        invoices: [],
      };

      const createResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      expect(createResponse.status).toBe(201);

      // Search for the license
      const searchResponse = await app.request('/api/content/licenses?search=SEARCH123');
      expect(searchResponse.status).toBe(200);

      const searchResult = await searchResponse.json();
      expect(searchResult.success).toBe(true);
      expect(searchResult.data).toHaveLength(1);

      const foundLicense = searchResult.data[0];
      expect(foundLicense.data.numeroSerie).toBe('SEARCH123');

      // Verify relations are included in search results
      expect(foundLicense.relations).toBeDefined();
    });
  });
});
