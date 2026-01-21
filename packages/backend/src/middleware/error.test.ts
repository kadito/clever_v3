import { describe, it, expect, vi } from 'vitest';
import { Hono, Context } from 'hono';
import { errorHandler, notFoundHandler } from './error';
import type { ApiResponse } from '@clever/shared';

describe('Error Handling Middleware', () => {
  describe('errorHandler', () => {
    it('should return 500 status with error response format', async () => {
      const mockContext = {
        json: vi.fn().mockReturnValue(new Response()),
      } as unknown as Context;

      const testError = new Error('Test error');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await errorHandler(testError, mockContext);

      expect(consoleSpy).toHaveBeenCalledWith('Unhandled error:', testError);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal server error',
          timestamp: expect.any(String),
        }),
        500
      );

      consoleSpy.mockRestore();
    });

    it('should include proper timestamp format', async () => {
      const mockContext = {
        json: vi.fn().mockReturnValue(new Response()),
      } as unknown as Context;

      const testError = new Error('Test error');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await errorHandler(testError, mockContext);

      const callArgs = (mockContext.json as any).mock.calls[0];
      const response = callArgs[0] as ApiResponse;

      // Verify timestamp is a valid ISO string
      expect(() => new Date(response.timestamp)).not.toThrow();
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      consoleSpy.mockRestore();
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 status with error response format', () => {
      const mockContext = {
        json: vi.fn().mockReturnValue(new Response()),
      } as unknown as Context;

      const result = notFoundHandler(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Endpoint not found',
          timestamp: expect.any(String),
        }),
        404
      );
    });

    it('should include proper timestamp format', () => {
      const mockContext = {
        json: vi.fn().mockReturnValue(new Response()),
      } as unknown as Context;

      notFoundHandler(mockContext);

      const callArgs = (mockContext.json as any).mock.calls[0];
      const response = callArgs[0] as ApiResponse;

      // Verify timestamp is a valid ISO string
      expect(() => new Date(response.timestamp)).not.toThrow();
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Integration with Hono app', () => {
    it('should handle errors thrown in route handlers', async () => {
      const app = new Hono();

      // Add error handler
      app.onError(errorHandler);

      // Add route that throws an error
      app.get('/test-error', () => {
        throw new Error('Test route error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const res = await app.request('/test-error');

      expect(res.status).toBe(500);

      const body: ApiResponse = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Internal server error');
      expect(body.timestamp).toBeDefined();

      consoleSpy.mockRestore();
    });
  });
});
