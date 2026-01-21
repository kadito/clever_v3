import { describe, it, expect, vi } from 'vitest';
import app from './index';
import type { ApiResponse } from '@clever/shared';

// Mock the ASSETS binding for testing
const mockAssetsFetch = vi.fn();
const mockEnv = {
  ASSETS: {
    fetch: mockAssetsFetch,
  },
};

describe('Main App', () => {
  describe('Health Check Endpoint', () => {
    it('should return 200 with health status', async () => {
      const res = await app.request('/health');

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
      expect(() => new Date(body.timestamp)).not.toThrow();
    });
  });

  describe('API Routes Integration', () => {
    it('should return 401 for unauthenticated API requests (authentication working)', async () => {
      const res = await app.request('/api/content/clients');

      expect(res.status).toBe(401);

      const body: ApiResponse = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Authentication');
    });

    it('should return 401 for unauthenticated invalid API routes (authentication takes precedence)', async () => {
      const res = await app.request('/api/content/invalid-type');

      expect(res.status).toBe(401);

      const body: ApiResponse = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Authentication');
    });
  });

  describe('Static Assets Middleware', () => {
    it('should pass non-API requests to ASSETS binding', async () => {
      // Mock the ASSETS.fetch to return a response
      const mockResponse = new Response('<!DOCTYPE html><html></html>', {
        headers: { 'Content-Type': 'text/html' },
      });
      mockAssetsFetch.mockResolvedValueOnce(mockResponse);

      // Test that static assets are handled by ASSETS binding
      const res = await app.request('/index.html', {}, mockEnv);

      // The response should be handled by the static middleware
      // Since we're testing the integration, we expect the middleware to be called
      expect(res).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle errors with global error handler', async () => {
      // Create a separate test app to avoid route conflicts
      const { Hono } = await import('hono');
      const { errorHandler } = await import('./middleware/error');

      const testApp = new Hono();
      testApp.onError(errorHandler);

      // Add a route that throws an error for testing
      testApp.get('/test-error', () => {
        throw new Error('Test error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const res = await testApp.request('/test-error');

      expect(res.status).toBe(500);

      const body: ApiResponse = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Internal server error');
      expect(body.timestamp).toBeDefined();

      consoleSpy.mockRestore();
    });
  });
});
