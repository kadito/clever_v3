/**
 * Integration tests for relation validation in API endpoints
 *
 * Verifies that the relation validation system works correctly with the API routes
 * and allows content creation/updates with relation IDs without validating referenced content exists.
 *
 * Requirements: 1.1, 1.3, 1.4, 1.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createContentRoutes, createStandardContentConfig } from './routes/content-route-template';
import type { BaseContent, UserContext } from '@clever/shared';
import { validateLicenseCreation, validateLicenseUpdate } from '@clever/shared';

// Mock storage bucket for testing
const createMockStorageBucket = () => {
  const storage = new Map<string, any>();

  return {
    get: async (key: string) => {
      const data = storage.get(key);
      return data ? { json: async () => data } : null;
    },
    put: async (key: string, value: string) => {
      storage.set(key, JSON.parse(value));
      return { json: async () => JSON.parse(value) };
    },
    delete: async (key: string) => {
      storage.delete(key);
    },
  };
};

// Mock user context
const mockUserContext: UserContext = {
  userId: 'test-user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  userType: 'User',
  sessionId: 'session-123',
  isAuthenticated: true,
};

describe('Relation Validation Integration', () => {
  let app: Hono;
  let mockBucket: any;

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

    // Create license routes with validation
    const licenseConfig = createStandardContentConfig('licenses', 'date-desc');
    licenseConfig.validateCreate = (data: any) => {
      const errors = validateLicenseCreation(data.data || data);
      if (errors.length > 0) throw new Error(errors[0]);
    };
    licenseConfig.validateUpdate = (data: any) => {
      const errors = validateLicenseUpdate(data.data || data);
      if (errors.length > 0) throw new Error(errors[0]);
    };

    const licenseRoutes = createContentRoutes<BaseContent>(licenseConfig);
    app.route('/api/content/licenses', licenseRoutes);
  });

  describe('License Creation with Client Relations', () => {
    it('should allow license creation with valid clientId without validating client exists', async () => {
      const licenseData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID format
        versao: '2024',
        numeroSerie: 'ABC123',
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
    });

    it('should allow license creation with empty clientId (optional relation)', async () => {
      const licenseData = {
        clientId: '', // Empty string - should be allowed for optional relations
        versao: '2024',
        numeroSerie: 'ABC123',
      };

      const response = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
    });

    it('should allow license creation without clientId (optional relation)', async () => {
      const licenseData = {
        versao: '2024',
        numeroSerie: 'ABC123',
        // No clientId field - should be allowed for optional relations
      };

      const response = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData),
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
    });

    it('should reject license creation with invalid clientId format', async () => {
      const licenseData = {
        clientId: 'invalid-uuid-format', // Invalid UUID format
        versao: '2024',
        numeroSerie: 'ABC123',
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

  describe('License Updates with Client Relations', () => {
    it('should allow license update with new clientId without validating client exists', async () => {
      // First create a license
      const initialData = {
        versao: '2024',
        numeroSerie: 'ABC123',
      };

      const createResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialData),
      });

      expect(createResponse.status).toBe(201);
      const createResult = await createResponse.json();
      const licenseUuid = createResult.data.uuid;

      // Now update with a clientId
      const updateData = {
        clientId: '987fcdeb-51a2-43d1-9f12-123456789abc', // Valid UUID format
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
    });

    it('should allow license update to remove clientId (set to empty)', async () => {
      // First create a license with clientId
      const initialData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        versao: '2024',
        numeroSerie: 'ABC123',
      };

      const createResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialData),
      });

      expect(createResponse.status).toBe(201);
      const createResult = await createResponse.json();
      const licenseUuid = createResult.data.uuid;

      // Now update to remove clientId
      const updateData = {
        clientId: '', // Remove the client relation
      };

      const updateResponse = await app.request(`/api/content/licenses/${licenseUuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      expect(updateResponse.status).toBe(200);
      const updateResult = await updateResponse.json();
      expect(updateResult.success).toBe(true);
    });

    it('should reject license update with invalid clientId format', async () => {
      // First create a license
      const initialData = {
        versao: '2024',
        numeroSerie: 'ABC123',
      };

      const createResponse = await app.request('/api/content/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialData),
      });

      expect(createResponse.status).toBe(201);
      const createResult = await createResponse.json();
      const licenseUuid = createResult.data.uuid;

      // Now try to update with invalid clientId
      const updateData = {
        clientId: 'invalid-format',
      };

      const updateResponse = await app.request(`/api/content/licenses/${licenseUuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      expect(updateResponse.status).toBe(400);
      const updateResult = await updateResponse.json();
      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toContain('formato válido de identificador');
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle existing content with relation fields', async () => {
      // Simulate existing content by directly storing it in the mock bucket
      const existingUuid = '123e4567-e89b-12d3-a456-426614174001'; // Valid UUID format
      const existingLicense = {
        uuid: existingUuid,
        contentType: 'licenses',
        createdAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'system',
        updatedAt: '2024-01-01T00:00:00.000Z',
        updatedBy: 'system',
        version: 1,
        isDeleted: false,
        data: {
          clientId: '123e4567-e89b-12d3-a456-426614174000',
          versao: '2023',
          numeroSerie: 'OLD123',
        },
      };

      await mockBucket.put(
        `content/licenses/${existingUuid}.json`,
        JSON.stringify(existingLicense)
      );

      // Try to retrieve the existing license
      const response = await app.request(`/api/content/licenses/${existingUuid}`);

      if (response.status !== 200) {
        const errorResult = await response.json();
        console.log('Error response:', errorResult);
      }

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.data.clientId).toBe(existingLicense.data.clientId);
    });
  });
});
