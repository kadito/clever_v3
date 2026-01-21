/**
 * End-to-End License Relation System Integration Test (Task 10)
 *
 * This test simulates real-world usage scenarios of the license relation system
 * to verify the complete user experience from creation to error handling.
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

describe('End-to-End License Relation System Integration (Task 10)', () => {
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

  describe('Real-world Usage Scenarios', () => {
    it('should handle complete license lifecycle with client relations', async () => {
      // Step 1: Create a client first
      const clientUuid = '550e8400-e29b-41d4-a716-446655440100';
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
          nomeEmpresa: 'Empresa Completa Lda',
          nomeComercial: 'Completa',
          contribuinte: '123456789',
          localidade: 'Lisboa',
        },
      };

      await mockBucket.put(`content/clients/${clientUuid}.json`, JSON.stringify(clientContent));

      // Step 2: Create license with client relation
      const licenseData = {
        clientId: clientUuid,
        versao: '2024',
        numeroSerie: 'COMPLETE-001',
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

      // Verify creation response includes resolved client
      expect(createResult.data.relations.client).toBeDefined();
      expect(createResult.data.relations.client.nomeEmpresa).toBe('Empresa Completa Lda');

      // Step 3: Retrieve license and verify relation is still resolved
      const getResponse = await app.request(`/api/content/licenses/${licenseUuid}`);
      expect(getResponse.status).toBe(200);

      const getResult = await getResponse.json();
      expect(getResult.data.relations.client.nomeEmpresa).toBe('Empresa Completa Lda');
      expect(getResult.data.relations.client.contribuinte).toBe('123456789');

      // Step 4: Update license with different client
      const newClientUuid = '550e8400-e29b-41d4-a716-446655440101';
      const newClientContent = {
        uuid: newClientUuid,
        contentType: 'clients',
        createdAt: '2024-01-10T11:00:00Z',
        createdBy: 'test-user-123',
        updatedAt: '2024-01-10T11:00:00Z',
        updatedBy: 'test-user-123',
        version: 1,
        isDeleted: false,
        data: {
          nomeEmpresa: 'Empresa Nova Lda',
          contribuinte: '987654321',
          localidade: 'Porto',
        },
      };

      await mockBucket.put(
        `content/clients/${newClientUuid}.json`,
        JSON.stringify(newClientContent)
      );

      const updateData = {
        clientId: newClientUuid,
        versao: '2025',
      };

      const updateResponse = await app.request(`/api/content/licenses/${licenseUuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      expect(updateResponse.status).toBe(200);
      const updateResult = await updateResponse.json();

      // Verify update response includes new resolved client
      expect(updateResult.data.data.versao).toBe('2025');
      expect(updateResult.data.relations.client.nomeEmpresa).toBe('Empresa Nova Lda');
      expect(updateResult.data.relations.client.contribuinte).toBe('987654321');

      // Step 5: List licenses and verify relations are included
      const listResponse = await app.request('/api/content/licenses');
      expect(listResponse.status).toBe(200);

      const listResult = await listResponse.json();
      expect(listResult.data).toHaveLength(1);

      const listedLicense = listResult.data[0];
      expect(listedLicense.relations.client.nomeEmpresa).toBe('Empresa Nova Lda');
    });

    it('should handle license creation before client exists (eventual consistency)', async () => {
      // Step 1: Create license with future client ID
      const futureClientId = '550e8400-e29b-41d4-a716-446655440200';

      const licenseData = {
        clientId: futureClientId,
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

      // Verify license shows error initially
      expect(createResult.data.relations.client.type).toBe('error');
      expect(createResult.data.relations.client.code).toBe(404);

      // Step 2: Create the client later
      const clientContent = {
        uuid: futureClientId,
        contentType: 'clients',
        createdAt: '2024-01-10T12:00:00Z',
        createdBy: 'test-user-123',
        updatedAt: '2024-01-10T12:00:00Z',
        updatedBy: 'test-user-123',
        version: 1,
        isDeleted: false,
        data: {
          nomeEmpresa: 'Empresa Futura Lda',
          contribuinte: '555666777',
        },
      };

      await mockBucket.put(`content/clients/${futureClientId}.json`, JSON.stringify(clientContent));

      // Step 3: Verify license now resolves client correctly
      const getResponse = await app.request(`/api/content/licenses/${licenseUuid}`);
      const getResult = await getResponse.json();

      expect(getResult.data.relations.client.nomeEmpresa).toBe('Empresa Futura Lda');
      expect(getResult.data.relations.client.contribuinte).toBe('555666777');
    });

    it('should handle client deletion gracefully (soft delete)', async () => {
      // Step 1: Create client and license
      const clientUuid = '550e8400-e29b-41d4-a716-446655440300';
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
          nomeEmpresa: 'Empresa Para Deletar Lda',
          contribuinte: '111222333',
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

      // Verify license initially resolves client
      expect(createResult.data.relations.client.nomeEmpresa).toBe('Empresa Para Deletar Lda');

      // Step 2: Soft delete the client
      const deletedClientContent = {
        ...clientContent,
        isDeleted: true,
        deletedAt: '2024-01-10T15:00:00Z',
        deletedBy: 'test-user-123',
      };

      await mockBucket.put(
        `content/clients/${clientUuid}.json`,
        JSON.stringify(deletedClientContent)
      );

      // Step 3: Verify license now shows error for deleted client
      const getResponse = await app.request(`/api/content/licenses/${licenseUuid}`);
      const getResult = await getResponse.json();

      expect(getResult.data.relations.client.type).toBe('error');
      expect(getResult.data.relations.client.code).toBe(404);
      expect(getResult.data.relations.client.message).toBe('Not found');

      // Step 4: Verify license data itself is still intact
      expect(getResult.data.data.clientId).toBe(clientUuid);
      expect(getResult.data.data.versao).toBe('2024');
    });

    it('should handle multiple licenses with mixed relation states', async () => {
      // Create one valid client
      const validClientUuid = '550e8400-e29b-41d4-a716-446655440400';
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
          nomeEmpresa: 'Cliente Válido Múltiplo',
          contribuinte: '444555666',
        },
      };

      await mockBucket.put(
        `content/clients/${validClientUuid}.json`,
        JSON.stringify(validClientContent)
      );

      // Create multiple licenses with different relation states
      const licenses = [
        {
          name: 'Valid Client License',
          data: {
            clientId: validClientUuid,
            versao: '2024',
            software: { name: ['Vectron'] },
            invoices: [],
          },
        },
        {
          name: 'Invalid Client License',
          data: {
            clientId: '550e8400-e29b-41d4-a716-446655440999',
            versao: '2024',
            software: { name: ['Pix'] },
            invoices: [],
          },
        },
        {
          name: 'No Client License',
          data: {
            versao: '2024',
            software: { name: ['Zon Soft'] },
            invoices: [],
          },
        },
      ];

      const createdLicenses = [];
      for (const license of licenses) {
        const response = await app.request('/api/content/licenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(license.data),
        });

        expect(response.status).toBe(201);
        const result = await response.json();
        createdLicenses.push({
          name: license.name,
          uuid: result.data.uuid,
          relations: result.data.relations,
        });
      }

      // Verify each license has correct relation state
      expect(createdLicenses[0].relations.client.nomeEmpresa).toBe('Cliente Válido Múltiplo');
      expect(createdLicenses[1].relations.client.type).toBe('error');
      expect(createdLicenses[1].relations.client.code).toBe(404);
      expect(createdLicenses[2].relations.client).toBeUndefined();

      // Verify list endpoint returns all licenses with correct relations
      const listResponse = await app.request('/api/content/licenses');
      const listResult = await listResponse.json();

      expect(listResult.data).toHaveLength(3);

      // Find each license in the list and verify relations
      const validLicense = listResult.data.find((l: any) => l.data.clientId === validClientUuid);
      expect(validLicense.relations.client.nomeEmpresa).toBe('Cliente Válido Múltiplo');

      const errorLicense = listResult.data.find(
        (l: any) => l.data.clientId === '550e8400-e29b-41d4-a716-446655440999'
      );
      expect(errorLicense.relations.client.type).toBe('error');

      const noClientLicense = listResult.data.find((l: any) => !l.data.clientId);
      expect(noClientLicense.relations.client).toBeUndefined();
    });

    it('should maintain performance with multiple relation resolutions', async () => {
      // Create multiple clients
      const clients = [];
      for (let i = 0; i < 5; i++) {
        const clientUuid = `550e8400-e29b-41d4-a716-44665544${i.toString().padStart(4, '0')}`;
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
            nomeEmpresa: `Empresa Performance ${i + 1}`,
            contribuinte: `${i + 1}23456789`,
          },
        };

        await mockBucket.put(`content/clients/${clientUuid}.json`, JSON.stringify(clientContent));

        clients.push(clientUuid);
      }

      // Create multiple licenses
      const licenses = [];
      for (let i = 0; i < 5; i++) {
        const licenseData = {
          clientId: clients[i],
          versao: '2024',
          numeroSerie: `PERF-${i + 1}`,
          software: { name: ['Vectron'] },
          invoices: [],
        };

        const response = await app.request('/api/content/licenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(licenseData),
        });

        expect(response.status).toBe(201);
        const result = await response.json();
        licenses.push(result.data.uuid);
      }

      // Measure list performance (should resolve all relations)
      const startTime = Date.now();
      const listResponse = await app.request('/api/content/licenses');
      const endTime = Date.now();

      expect(listResponse.status).toBe(200);
      const listResult = await listResponse.json();

      expect(listResult.data).toHaveLength(5);

      // Verify all relations are resolved
      for (let i = 0; i < 5; i++) {
        const license = listResult.data.find((l: any) => l.data.numeroSerie === `PERF-${i + 1}`);
        expect(license.relations.client.nomeEmpresa).toBe(`Empresa Performance ${i + 1}`);
      }

      // Performance should be reasonable (less than 1 second for 5 licenses)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000);
    });
  });
});
