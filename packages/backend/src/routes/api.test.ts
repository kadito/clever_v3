import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import api from './api';
import type { ApiResponse, ListResponse, BaseContent } from '@clever/shared';

describe('API Routes', () => {
  const app = new Hono();
  app.route('/api', api);

  describe('Content Type Validation', () => {
    it('should return 400 for invalid content type', async () => {
      const res = await app.request('/api/content/invalid-type');
      expect(res.status).toBe(400);
      
      const body: ApiResponse = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid content type');
      expect(body.timestamp).toBeDefined();
    });

    it('should accept valid content types', async () => {
      const validTypes = [
        'clients',
        'contracts', 
        'licenses',
        'work-sheets',
        'daily-records',
        'remote-assistance',
        'reminders',
        'pending'
      ];

      for (const type of validTypes) {
        const res = await app.request(`/api/content/${type}`);
        expect(res.status).toBe(200);
        
        const body: ListResponse<BaseContent> = await res.json();
        expect(body.success).toBe(true);
        expect(body.data).toEqual([]);
        expect(body.pagination).toBeDefined();
      }
    });
  });

  describe('GET /api/content/:type', () => {
    it('should return 200 with empty list for valid content type', async () => {
      const res = await app.request('/api/content/clients');
      expect(res.status).toBe(200);
      
      const body: ListResponse<BaseContent> = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
      expect(body.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 0
      });
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/content/:type/:uuid', () => {
    it('should return 200 with null data for valid content type and uuid', async () => {
      const res = await app.request('/api/content/clients/test-uuid');
      expect(res.status).toBe(200);
      
      const body: ApiResponse<BaseContent | null> = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toBe(null);
      expect(body.timestamp).toBeDefined();
    });

    it('should return 400 for invalid content type', async () => {
      const res = await app.request('/api/content/invalid/test-uuid');
      expect(res.status).toBe(400);
      
      const body: ApiResponse = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid content type');
    });
  });

  describe('POST /api/content/:type', () => {
    it('should return 201 when creating content with valid JSON', async () => {
      const testData = { name: 'Test Client', email: 'test@example.com' };
      
      const res = await app.request('/api/content/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });
      
      expect(res.status).toBe(201);
      
      const body: ApiResponse<BaseContent> = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data?.contentType).toBe('clients');
      expect(body.data?.data).toEqual(testData);
      expect(body.data?.uuid).toBeDefined();
      expect(body.data?.createdAt).toBeDefined();
      expect(body.data?.version).toBe(1);
      expect(body.data?.isDeleted).toBe(false);
    });

    it('should return 400 for invalid JSON body', async () => {
      const res = await app.request('/api/content/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });
      
      expect(res.status).toBe(400);
      
      const body: ApiResponse = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid JSON body');
    });

    it('should return 400 for invalid content type', async () => {
      const res = await app.request('/api/content/invalid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });
      
      expect(res.status).toBe(400);
      
      const body: ApiResponse = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid content type');
    });
  });

  describe('PUT /api/content/:type/:uuid', () => {
    it('should return 200 when updating content with valid JSON', async () => {
      const updateData = { data: { name: 'Updated Client' } };
      
      const res = await app.request('/api/content/clients/test-uuid', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      expect(res.status).toBe(200);
      
      const body: ApiResponse<Partial<BaseContent>> = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data?.uuid).toBe('test-uuid');
      expect(body.data?.contentType).toBe('clients');
      expect(body.data?.data).toEqual(updateData.data);
      expect(body.data?.updatedAt).toBeDefined();
      expect(body.data?.version).toBe(2);
    });

    it('should return 400 for invalid JSON body', async () => {
      const res = await app.request('/api/content/clients/test-uuid', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });
      
      expect(res.status).toBe(400);
      
      const body: ApiResponse = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid JSON body');
    });
  });

  describe('DELETE /api/content/:type/:uuid', () => {
    it('should return 200 when soft deleting content', async () => {
      const res = await app.request('/api/content/clients/test-uuid', {
        method: 'DELETE'
      });
      
      expect(res.status).toBe(200);
      
      const body: ApiResponse<Partial<BaseContent>> = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data?.uuid).toBe('test-uuid');
      expect(body.data?.contentType).toBe('clients');
      expect(body.data?.isDeleted).toBe(true);
      expect(body.data?.deletedAt).toBeDefined();
    });

    it('should return 400 for invalid content type', async () => {
      const res = await app.request('/api/content/invalid/test-uuid', {
        method: 'DELETE'
      });
      
      expect(res.status).toBe(400);
      
      const body: ApiResponse = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid content type');
    });
  });
});