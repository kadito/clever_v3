import { Context } from 'hono';
import type { ApiResponse } from '@clever/shared';

// Global error handler middleware
export const errorHandler = async (err: Error, c: Context) => {
  console.error('Unhandled error:', err);
  
  const response: ApiResponse = {
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  };
  
  return c.json(response, 500);
};

// 404 handler for API routes
export const notFoundHandler = (c: Context) => {
  const response: ApiResponse = {
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  };
  
  return c.json(response, 404);
};