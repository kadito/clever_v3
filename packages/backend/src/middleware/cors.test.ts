import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import api from '../routes/api';

describe('CORS Middleware', () => {
  const app = new Hono();
  app.route('/api', api);

  describe('CORS Headers', () => {
    it('should include CORS headers in response', async () => {
      const res = await app.request('/api/content/clients');
      
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(res.headers.get('Access-Control-Allow-Methods')).toBeDefined();
      expect(res.headers.get('Access-Control-Allow-Headers')).toBeDefined();
    });

    it('should handle OPTIONS preflight requests', async () => {
      const res = await app.request('/api/content/clients', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });

    it('should allow configured origins', async () => {
      const allowedOrigins = ['http://localhost:8787', 'http://localhost:3000'];
      
      for (const origin of allowedOrigins) {
        const res = await app.request('/api/content/clients', {
          headers: { 'Origin': origin }
        });
        
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe(origin);
      }
    });

    it('should allow configured methods', async () => {
      const res = await app.request('/api/content/clients', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      const allowedMethods = res.headers.get('Access-Control-Allow-Methods');
      expect(allowedMethods).toContain('GET');
      expect(allowedMethods).toContain('POST');
      expect(allowedMethods).toContain('PUT');
      expect(allowedMethods).toContain('DELETE');
      expect(allowedMethods).toContain('OPTIONS');
    });

    it('should allow configured headers', async () => {
      const res = await app.request('/api/content/clients', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });
      
      const allowedHeaders = res.headers.get('Access-Control-Allow-Headers');
      expect(allowedHeaders).toContain('Content-Type');
      expect(allowedHeaders).toContain('Authorization');
    });
  });
});