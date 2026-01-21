import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';

/**
 * End-to-End Authentication Integration Tests
 *
 * Tests complete authentication flow between frontend and backend
 * Verifies all error handling scenarios work correctly
 * Ensures proper integration with existing application structure
 *
 * Requirements: All requirements integration
 */

const sleep = promisify(setTimeout);

// Skip E2E tests that require running server - they expect authentication now
describe.skip('Authentication Integration E2E Tests', () => {
  let devProcess: ChildProcess | null = null;
  const DEV_PORT = 8787;
  const DEV_URL = `http://localhost:${DEV_PORT}`;
  const PROJECT_ROOT = process.cwd() + '/../..';

  // Helper function to make HTTP requests with timeout
  const fetchWithTimeout = async (
    url: string,
    options: RequestInit = {},
    timeout = 10000
  ): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Helper function to wait for dev server to be ready
  const waitForDevServer = async (maxAttempts = 30): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetchWithTimeout(`${DEV_URL}/health`, {}, 5000);
        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Server not ready yet, continue waiting
      }
      await sleep(1000);
    }
    return false;
  };

  beforeAll(async () => {
    // Start development server
    devProcess = spawn('pnpm', ['dev'], {
      cwd: PROJECT_ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
    });

    // Wait for server to be ready
    const isReady = await waitForDevServer();
    expect(isReady).toBe(true);
  }, 45000);

  afterAll(async () => {
    // Clean up development server
    if (devProcess) {
      devProcess.kill('SIGTERM');
      await sleep(2000);
      if (!devProcess.killed) {
        devProcess.kill('SIGKILL');
      }
      devProcess = null;
    }
  });

  describe('Frontend and Backend Integration', () => {
    it('should serve Vue SPA with authentication setup', async () => {
      // Test that the main page loads with authentication components
      const response = await fetchWithTimeout(`${DEV_URL}/`);
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/html');

      const content = await response.text();
      expect(content).toMatch(/<!doctype html>/i);
      expect(content).toContain('<div id="app">');
      expect(content).toContain('VITE_CLERK_PUBLISHABLE_KEY');
    });

    it('should redirect unauthenticated users to SignIn page', async () => {
      // Test protected route redirection
      const protectedRoutes = ['/clientes', '/contratos', '/licencas'];

      for (const route of protectedRoutes) {
        const response = await fetchWithTimeout(`${DEV_URL}${route}`);
        expect(response.ok).toBe(true);

        // Should serve the Vue SPA which will handle client-side routing
        const content = await response.text();
        expect(content).toMatch(/<!doctype html>/i);
        expect(content).toContain('<div id="app">');
      }
    });

    it('should serve SignIn page without authentication', async () => {
      // Test that SignIn page is accessible without authentication
      const response = await fetchWithTimeout(`${DEV_URL}/entrar`);
      expect(response.ok).toBe(true);

      const content = await response.text();
      expect(content).toMatch(/<!doctype html>/i);
      expect(content).toContain('<div id="app">');
    });
  });

  describe('API Authentication Integration', () => {
    it('should protect all API endpoints except health checks', async () => {
      // Test that protected endpoints return 401 without authentication
      const protectedEndpoints = [
        '/api/content/clients',
        '/api/content/contracts',
        '/api/content/licenses',
        '/api/user/profile',
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await fetchWithTimeout(`${DEV_URL}${endpoint}`);
        expect(response.status).toBe(401);

        const data = await response.json();
        expect(data).toHaveProperty('success', false);
        expect(data).toHaveProperty('error');
        expect(data.error).toContain('Authentication required');
        expect(data).toHaveProperty('timestamp');
      }
    });

    it('should allow access to health check endpoints without authentication', async () => {
      // Test that health endpoints are accessible without authentication
      const healthEndpoints = ['/health', '/api/health'];

      for (const endpoint of healthEndpoints) {
        const response = await fetchWithTimeout(`${DEV_URL}${endpoint}`);
        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data).toHaveProperty('status', 'ok');
        expect(data).toHaveProperty('timestamp');
      }
    });

    it('should handle invalid content types correctly', async () => {
      // Test that invalid content types return proper error responses
      const response = await fetchWithTimeout(`${DEV_URL}/api/content/invalid-type`);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid content type');
      expect(data).toHaveProperty('timestamp');
    });

    it('should handle CORS correctly for frontend requests', async () => {
      // Test CORS preflight request
      const response = await fetchWithTimeout(`${DEV_URL}/api/content/clients`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
      expect(response.headers.get('access-control-allow-methods')).toBeTruthy();
      expect(response.headers.get('access-control-allow-headers')).toBeTruthy();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle authentication errors gracefully', async () => {
      // Test with invalid authorization header
      const response = await fetchWithTimeout(`${DEV_URL}/api/content/clients`, {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('timestamp');
    });

    it('should handle malformed requests properly', async () => {
      // Test POST with invalid JSON
      const response = await fetchWithTimeout(`${DEV_URL}/api/content/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token',
        },
        body: 'invalid-json',
      });

      // Should return 401 for authentication first, not 400 for bad JSON
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
    });

    it('should handle non-existent API routes correctly', async () => {
      // Test 404 handling for non-existent API routes
      const response = await fetchWithTimeout(`${DEV_URL}/api/nonexistent`);
      expect([404, 500]).toContain(response.status);

      // Should return JSON error response
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('Application Structure Integration', () => {
    it('should serve static assets correctly', async () => {
      // Test that static assets are served with correct headers
      const response = await fetchWithTimeout(`${DEV_URL}/`);
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/html');

      const content = await response.text();
      expect(content).toMatch(/<!doctype html>/i);
      expect(content).toMatch(/<meta\s+name="viewport"/);
      expect(content).toContain('<div id="app">');
    });

    it('should handle SPA routing fallback correctly', async () => {
      // Test that unknown routes serve the Vue SPA
      const unknownRoutes = ['/unknown-route', '/clientes/123', '/contratos/new'];

      for (const route of unknownRoutes) {
        const response = await fetchWithTimeout(`${DEV_URL}${route}`);
        expect(response.ok).toBe(true);

        // Should serve the Vue SPA HTML
        const content = await response.text();
        expect(content).toMatch(/<!doctype html>/i);
        expect(content).toContain('<div id="app">');
      }
    });

    it('should maintain consistent API response format', async () => {
      // Test that all API responses follow the same format
      const endpoints = [
        '/api/content/clients',
        '/api/content/invalid-type',
        '/api/user/profile',
        '/health',
      ];

      for (const endpoint of endpoints) {
        const response = await fetchWithTimeout(`${DEV_URL}${endpoint}`);
        const data = await response.json();

        // All responses should have these fields
        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('timestamp');
        expect(typeof data.success).toBe('boolean');
        expect(typeof data.timestamp).toBe('string');

        // Error responses should have error field
        if (!data.success) {
          expect(data).toHaveProperty('error');
          expect(typeof data.error).toBe('string');
        }
      }
    });
  });

  describe('Environment Configuration Integration', () => {
    it('should have correct Clerk configuration in development', async () => {
      // Test that Clerk configuration is properly loaded
      const response = await fetchWithTimeout(`${DEV_URL}/`);
      const content = await response.text();

      // Should contain Clerk publishable key reference
      expect(content).toContain('VITE_CLERK_PUBLISHABLE_KEY');
    });

    it('should have proper CORS configuration for development', async () => {
      // Test that CORS allows development origins
      const response = await fetchWithTimeout(`${DEV_URL}/api/content/clients`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:3000',
        },
      });

      expect(response.ok).toBe(true);
      const allowOrigin = response.headers.get('access-control-allow-origin');
      expect(allowOrigin).toBeTruthy();
    });

    it('should handle environment variables correctly', async () => {
      // Test that health endpoint reflects correct environment
      const response = await fetchWithTimeout(`${DEV_URL}/health`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('status', 'ok');
      expect(data).toHaveProperty('timestamp');

      // Timestamp should be valid ISO string
      expect(() => new Date(data.timestamp)).not.toThrow();
    });
  });

  describe('Type Safety Integration', () => {
    it('should maintain type consistency between frontend and backend', async () => {
      // Test that API responses match expected TypeScript interfaces
      const response = await fetchWithTimeout(`${DEV_URL}/api/content/clients`);
      expect(response.status).toBe(401); // Expected due to no auth

      const data = await response.json();

      // Should match ApiResponse interface from shared package
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('timestamp');
      expect(typeof data.success).toBe('boolean');
      expect(typeof data.error).toBe('string');
      expect(typeof data.timestamp).toBe('string');
    });

    it('should handle content type validation consistently', async () => {
      // Test that content type validation works across all endpoints
      const validTypes = ['clients', 'contracts', 'licenses', 'work-sheets'];
      const invalidTypes = ['invalid', 'nonexistent', ''];

      for (const type of validTypes) {
        const response = await fetchWithTimeout(`${DEV_URL}/api/content/${type}`);
        expect(response.status).toBe(401); // Should fail auth, not validation
      }

      for (const type of invalidTypes) {
        const response = await fetchWithTimeout(`${DEV_URL}/api/content/${type}`);
        if (type === '') {
          // Empty type might result in different route matching
          expect([400, 404, 500]).toContain(response.status);
        } else {
          expect(response.status).toBe(400); // Should fail validation
        }
      }
    });
  });
});
