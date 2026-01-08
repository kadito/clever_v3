/**
 * Integration tests for authentication system
 * Verifies that authentication is properly protecting API endpoints
 */

import { describe, it, expect } from 'vitest';
import app from './index';

describe('Authentication Integration', () => {
  describe('Protected API Endpoints', () => {
    it('should return 401 for unauthenticated requests to protected endpoints', async () => {
      // Test various protected endpoints
      const protectedEndpoints = [
        '/api/content/clients',
        '/api/content/contracts',
        '/api/content/licenses',
        '/api/user/profile',
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await app.request(endpoint);
        expect(response.status).toBe(401);
        
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Authentication');
      }
    });

    it('should return 401 for POST requests without authentication', async () => {
      const response = await app.request('/api/content/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Test Client' }),
      });

      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Authentication');
    });

    it('should return 401 for PUT requests without authentication', async () => {
      const response = await app.request('/api/content/clients/test-uuid', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Updated Client' }),
      });

      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Authentication');
    });

    it('should return 401 for DELETE requests without authentication', async () => {
      const response = await app.request('/api/content/clients/test-uuid', {
        method: 'DELETE',
      });

      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Authentication');
    });
  });

  describe('Public Endpoints', () => {
    it('should allow access to health check endpoints without authentication', async () => {
      const healthResponse = await app.request('/health');
      expect(healthResponse.status).toBe(200);
      
      const healthBody = await healthResponse.json();
      expect(healthBody.status).toBe('ok');

      const apiHealthResponse = await app.request('/api/health');
      expect(apiHealthResponse.status).toBe(200);
      
      const apiHealthBody = await apiHealthResponse.json();
      expect(apiHealthBody.status).toBe('ok');
    });
  });

  describe('CORS Configuration', () => {
    it('should include CORS headers in responses', async () => {
      const response = await app.request('/api/content/clients', {
        method: 'OPTIONS',
      });

      // Should still get CORS headers even for protected endpoints
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
    });
  });
});