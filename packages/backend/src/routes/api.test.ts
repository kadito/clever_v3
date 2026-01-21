import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import api from './api';
import type { ApiResponse, ListResponse, BaseContent } from '@clever/shared';

describe('API Routes', () => {
  const app = new Hono();
  app.route('/api', api);

  describe('Authentication Protection', () => {
    it('should return 401 for unauthenticated requests to all protected endpoints', async () => {
      const protectedEndpoints = [
        '/api/content/clients',
        '/api/content/clients/test-uuid',
        '/api/user/profile',
      ];

      for (const endpoint of protectedEndpoints) {
        const res = await app.request(endpoint);
        expect(res.status).toBe(401);

        const body: ApiResponse = await res.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Authentication');
        expect(body.timestamp).toBeDefined();
      }
    });

    it('should return 401 for unauthenticated POST requests', async () => {
      const testData = { name: 'Test Client', email: 'test@example.com' };

      const res = await app.request('/api/content/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });

      expect(res.status).toBe(401);

      const body: ApiResponse = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Authentication');
    });

    it('should return 401 for unauthenticated PUT requests', async () => {
      const updateData = { data: { name: 'Updated Client' } };

      const res = await app.request('/api/content/clients/test-uuid', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      expect(res.status).toBe(401);

      const body: ApiResponse = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Authentication');
    });

    it('should return 401 for unauthenticated DELETE requests', async () => {
      const res = await app.request('/api/content/clients/test-uuid', {
        method: 'DELETE',
      });

      expect(res.status).toBe(401);

      const body: ApiResponse = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Authentication');
    });
  });

  describe('Content Type Validation (Unauthenticated)', () => {
    it('should return 401 for invalid content type requests (authentication takes precedence)', async () => {
      const res = await app.request('/api/content/invalid-type');
      expect(res.status).toBe(401);

      const body: ApiResponse = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Authentication');
      expect(body.timestamp).toBeDefined();
    });

    it('should return 401 for valid content types without authentication', async () => {
      const validTypes = [
        'clients',
        'contracts',
        'licenses',
        'work-sheets',
        'daily-records',
        'remote-assistance',
        'reminders',
        'pending',
      ];

      for (const type of validTypes) {
        const res = await app.request(`/api/content/${type}`);
        expect(res.status).toBe(401);

        const body: ApiResponse = await res.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Authentication');
      }
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in 401 responses', async () => {
      const res = await app.request('/api/content/clients', {
        headers: {
          Origin: 'http://localhost:3000',
        },
      });

      expect(res.status).toBe(401);

      // CORS headers should still be present
      expect(res.headers.get('access-control-allow-origin')).toBeTruthy();
    });

    it('should handle OPTIONS requests for CORS preflight', async () => {
      const res = await app.request('/api/content/clients', {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type,Authorization',
        },
      });

      expect(res.status).toBe(204);
      expect(res.headers.get('access-control-allow-origin')).toBeTruthy();
      expect(res.headers.get('access-control-allow-methods')).toBeTruthy();
      expect(res.headers.get('access-control-allow-headers')).toBeTruthy();
    });
  });
});
