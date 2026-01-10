import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentStorageService, ContentNotFoundError, ContentValidationError, createContentStorageService } from './storage.js';
import type { BaseContent } from './types.js';

// Mock R2Bucket interface
interface MockR2Object {
  json(): Promise<any>;
}

interface MockR2Bucket {
  get(key: string): Promise<MockR2Object | null>;
  put(key: string, value: string): Promise<void>;
}

// Test content interface
interface TestContent extends BaseContent {
  data: {
    name: string;
    description: string;
  };
}

describe('ContentStorageService', () => {
  let mockR2Bucket: MockR2Bucket;
  let storageService: ContentStorageService<TestContent>;
  let mockUserContext: { userId: string };

  beforeEach(() => {
    mockR2Bucket = {
      get: vi.fn(),
      put: vi.fn(),
    };
    storageService = new ContentStorageService<TestContent>(mockR2Bucket as any, 'test-content');
    mockUserContext = { userId: 'user-123' };
  });

  describe('get', () => {
    it('should retrieve content by UUID using correct R2 key pattern', async () => {
      const mockContent: TestContent = {
        uuid: 'test-uuid-123',
        contentType: 'test-content',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'user-123',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'user-123',
        version: 1,
        isDeleted: false,
        data: {
          name: 'Test Content',
          description: 'Test Description',
        },
      };

      const mockR2Object = {
        json: vi.fn().mockResolvedValue(mockContent),
      };

      (mockR2Bucket.get as any).mockResolvedValue(mockR2Object);

      const result = await storageService.get('test-uuid-123');

      expect(mockR2Bucket.get).toHaveBeenCalledWith('content/test-content/test-uuid-123.json');
      expect(result).toEqual({
        ...mockContent,
        relations: {}
      });
    });

    it('should return null when content does not exist', async () => {
      (mockR2Bucket.get as any).mockResolvedValue(null);

      const result = await storageService.get('non-existent-uuid');

      expect(result).toBeNull();
    });

    it('should return null when content is soft deleted', async () => {
      const mockDeletedContent: TestContent = {
        uuid: 'deleted-uuid',
        contentType: 'test-content',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'user-123',
        updatedAt: '2024-01-02T00:00:00Z',
        updatedBy: 'user-123',
        version: 2,
        isDeleted: true,
        deletedAt: '2024-01-02T00:00:00Z',
        deletedBy: 'admin-456',
        data: {
          name: 'Deleted Content',
          description: 'This content was deleted',
        },
      };

      const mockR2Object = {
        json: vi.fn().mockResolvedValue(mockDeletedContent),
      };

      (mockR2Bucket.get as any).mockResolvedValue(mockR2Object);

      const result = await storageService.get('deleted-uuid');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new content with proper audit trail and UUID', async () => {
      const createData = {
        name: 'New Content',
        description: 'New Description',
      };

      // Mock crypto.randomUUID
      const mockUUID = 'generated-uuid-123';
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn().mockReturnValue(mockUUID),
      });

      // Mock current date
      const mockDate = '2024-01-01T10:00:00Z';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      // Mock index operations
      (mockR2Bucket.get as any).mockResolvedValue(null); // No existing index
      (mockR2Bucket.put as any).mockResolvedValue(undefined);

      const result = await storageService.create(createData, mockUserContext);

      // Verify content structure
      expect(result.uuid).toBe(mockUUID);
      expect(result.contentType).toBe('test-content');
      expect(result.createdAt).toBe(mockDate);
      expect(result.createdBy).toBe('user-123');
      expect(result.updatedAt).toBe(mockDate);
      expect(result.updatedBy).toBe('user-123');
      expect(result.version).toBe(1);
      expect(result.isDeleted).toBe(false);
      expect(result.data).toEqual(createData);
      expect(result.relations).toEqual({});

      // Verify R2 operations - content is saved without relations
      const expectedSavedContent = {
        uuid: mockUUID,
        contentType: 'test-content',
        createdAt: mockDate,
        createdBy: 'user-123',
        updatedAt: mockDate,
        updatedBy: 'user-123',
        version: 1,
        isDeleted: false,
        data: createData
      };
      
      expect(mockR2Bucket.put).toHaveBeenCalledWith(
        `content/test-content/${mockUUID}.json`,
        JSON.stringify(expectedSavedContent, null, 2),
        expect.objectContaining({
          httpMetadata: expect.objectContaining({
            contentType: 'application/json'
          })
        })
      );

      // Verify index update
      expect(mockR2Bucket.put).toHaveBeenCalledWith(
        'indexes/test-content-index.json',
        expect.stringContaining(mockUUID),
        expect.objectContaining({
          httpMetadata: expect.objectContaining({
            contentType: 'application/json'
          })
        })
      );
    });
  });

  describe('update', () => {
    it('should update existing content with incremented version', async () => {
      const existingContent: TestContent = {
        uuid: 'test-uuid-123',
        contentType: 'test-content',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'user-123',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'user-123',
        version: 1,
        isDeleted: false,
        data: {
          name: 'Original Name',
          description: 'Original Description',
        },
      };

      const mockR2Object = {
        json: vi.fn().mockResolvedValue(existingContent),
      };

      // Mock index for updateIndex call
      const mockIndex = {
        contentType: 'test-content',
        lastUpdated: '2024-01-01T00:00:00Z',
        items: [
          {
            uuid: 'test-uuid-123',
            contentType: 'test-content',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            isDeleted: false,
            searchableText: 'original name original description',
          },
        ],
      };

      const mockIndexObject = {
        json: vi.fn().mockResolvedValue(mockIndex),
      };

      (mockR2Bucket.get as any)
        .mockResolvedValueOnce(mockR2Object) // get existing content
        .mockResolvedValueOnce(mockIndexObject); // get index for update

      (mockR2Bucket.put as any).mockResolvedValue(undefined);

      const updateData = {
        name: 'Updated Name',
      };

      const mockDate = '2024-01-02T10:00:00Z';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      const result = await storageService.update('test-uuid-123', updateData, mockUserContext);

      expect(result.uuid).toBe('test-uuid-123');
      expect(result.version).toBe(2);
      expect(result.updatedAt).toBe(mockDate);
      expect(result.updatedBy).toBe('user-123');
      expect(result.data.name).toBe('Updated Name');
      expect(result.data.description).toBe('Original Description'); // Unchanged
    });

    it('should throw error when content not found', async () => {
      (mockR2Bucket.get as any).mockResolvedValue(null);

      await expect(
        storageService.update('non-existent-uuid', { name: 'Updated' }, mockUserContext)
      ).rejects.toThrow('Content not found');
    });
  });

  describe('delete', () => {
    it('should soft delete content with proper audit trail', async () => {
      const existingContent: TestContent = {
        uuid: 'test-uuid-123',
        contentType: 'test-content',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'user-123',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'user-123',
        version: 1,
        isDeleted: false,
        data: {
          name: 'Content to Delete',
          description: 'This will be deleted',
        },
      };

      const mockR2Object = {
        json: vi.fn().mockResolvedValue(existingContent),
      };

      // Mock index for updateIndex call
      const mockIndex = {
        contentType: 'test-content',
        lastUpdated: '2024-01-01T00:00:00Z',
        items: [
          {
            uuid: 'test-uuid-123',
            contentType: 'test-content',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            isDeleted: false,
            searchableText: 'content to delete this will be deleted',
          },
        ],
      };

      const mockIndexObject = {
        json: vi.fn().mockResolvedValue(mockIndex),
      };

      (mockR2Bucket.get as any)
        .mockResolvedValueOnce(mockR2Object) // get existing content
        .mockResolvedValueOnce(mockIndexObject); // get index for update

      (mockR2Bucket.put as any).mockResolvedValue(undefined);

      const mockDate = '2024-01-02T10:00:00Z';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      await storageService.delete('test-uuid-123', mockUserContext);

      // Verify soft delete was saved
      const expectedDeletedContent = {
        uuid: 'test-uuid-123',
        contentType: 'test-content',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'user-123',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'user-123',
        version: 2,
        isDeleted: true,
        data: {
          name: 'Content to Delete',
          description: 'This will be deleted',
        },
        deletedAt: mockDate,
        deletedBy: 'user-123'
      };
      
      expect(mockR2Bucket.put).toHaveBeenCalledWith(
        'content/test-content/test-uuid-123.json',
        JSON.stringify(expectedDeletedContent, null, 2),
        expect.objectContaining({
          httpMetadata: expect.objectContaining({
            contentType: 'application/json'
          })
        })
      );

      // Verify audit trail
      const savedContent = JSON.parse((mockR2Bucket.put as any).mock.calls[0][1]);
      expect(savedContent.isDeleted).toBe(true);
      expect(savedContent.deletedAt).toBe(mockDate);
      expect(savedContent.deletedBy).toBe('user-123');
      expect(savedContent.version).toBe(2);
    });

    it('should throw error when content not found', async () => {
      (mockR2Bucket.get as any).mockResolvedValue(null);

      await expect(
        storageService.delete('non-existent-uuid', mockUserContext)
      ).rejects.toThrow('Content not found');
    });
  });

  describe('list', () => {
    it('should return paginated list from search index', async () => {
      const mockIndex = {
        contentType: 'test-content',
        lastUpdated: '2024-01-01T00:00:00Z',
        items: [
          {
            uuid: 'uuid-1',
            contentType: 'test-content',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            isDeleted: false,
            searchableText: 'content 1',
          },
          {
            uuid: 'uuid-2',
            contentType: 'test-content',
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
            isDeleted: false,
            searchableText: 'content 2',
          },
          {
            uuid: 'uuid-3',
            contentType: 'test-content',
            createdAt: '2024-01-03T00:00:00Z',
            updatedAt: '2024-01-03T00:00:00Z',
            isDeleted: true, // Should be filtered out
            searchableText: 'deleted content',
          },
        ],
      };

      const mockIndexObject = {
        json: vi.fn().mockResolvedValue(mockIndex),
      };

      const mockContent1: TestContent = {
        uuid: 'uuid-1',
        contentType: 'test-content',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'user-123',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'user-123',
        version: 1,
        isDeleted: false,
        data: { name: 'Content 1', description: 'First content' },
      };

      const mockContent2: TestContent = {
        uuid: 'uuid-2',
        contentType: 'test-content',
        createdAt: '2024-01-02T00:00:00Z',
        createdBy: 'user-123',
        updatedAt: '2024-01-02T00:00:00Z',
        updatedBy: 'user-123',
        version: 1,
        isDeleted: false,
        data: { name: 'Content 2', description: 'Second content' },
      };

      (mockR2Bucket.get as any)
        .mockResolvedValueOnce(mockIndexObject) // Index call
        .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue(mockContent2) }) // uuid-2 (most recent first)
        .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue(mockContent1) }); // uuid-1

      const result = await storageService.list(1, 10);

      expect(result.total).toBe(2); // Only non-deleted items
      expect(result.items).toHaveLength(2);
      expect(result.items[0].uuid).toBe('uuid-2'); // Most recent first
      expect(result.items[1].uuid).toBe('uuid-1');
    });

    it('should return empty result when no index exists', async () => {
      (mockR2Bucket.get as any).mockResolvedValue(null);

      const result = await storageService.list();

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('search', () => {
    it('should search content using searchable text', async () => {
      const mockIndex = {
        contentType: 'test-content',
        items: [
          {
            uuid: 'uuid-1',
            isDeleted: false,
            searchableText: 'important document content',
          },
          {
            uuid: 'uuid-2',
            isDeleted: false,
            searchableText: 'regular content item',
          },
          {
            uuid: 'uuid-3',
            isDeleted: true,
            searchableText: 'important deleted content', // Should be filtered out
          },
        ],
      };

      const mockIndexObject = {
        json: vi.fn().mockResolvedValue(mockIndex),
      };

      const mockContent: TestContent = {
        uuid: 'uuid-1',
        contentType: 'test-content',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'user-123',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'user-123',
        version: 1,
        isDeleted: false,
        data: { name: 'Important Document', description: 'Important content' },
      };

      (mockR2Bucket.get as any)
        .mockResolvedValueOnce(mockIndexObject) // Index call
        .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue(mockContent) }); // Content call

      const result = await storageService.search('important');

      expect(result).toHaveLength(1);
      expect(result[0].uuid).toBe('uuid-1');
      expect(result[0].data.name).toBe('Important Document');
    });

    it('should return empty array when no index exists', async () => {
      (mockR2Bucket.get as any).mockResolvedValue(null);

      const result = await storageService.search('test');

      expect(result).toEqual([]);
    });

    it('should perform case-insensitive search', async () => {
      const mockIndex = {
        items: [
          {
            uuid: 'uuid-1',
            isDeleted: false,
            searchableText: 'important document content',
          },
        ],
      };

      const mockIndexObject = {
        json: vi.fn().mockResolvedValue(mockIndex),
      };

      const mockContent: TestContent = {
        uuid: 'uuid-1',
        contentType: 'test-content',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'user-123',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'user-123',
        version: 1,
        isDeleted: false,
        data: { name: 'Important Document', description: 'Important content' },
      };

      (mockR2Bucket.get as any)
        .mockResolvedValueOnce(mockIndexObject)
        .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue(mockContent) });

      const result = await storageService.search('IMPORTANT');

      expect(result).toHaveLength(1);
      expect(result[0].uuid).toBe('uuid-1');
    });
  });

  describe('protected methods', () => {
    it('should extract searchable text from content data', async () => {
      const content: TestContent = {
        uuid: 'test-uuid',
        contentType: 'test-content',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'user-123',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'user-123',
        version: 1,
        isDeleted: false,
        data: {
          name: 'Test Content',
          description: 'Test Description',
        },
      };

      // Access protected method through any cast for testing
      const searchableText = (storageService as any).extractSearchableText(content);

      expect(searchableText).toBe('{"name":"test content","description":"test description"}');
    });

    it('should extract empty index fields by default', async () => {
      const content: TestContent = {
        uuid: 'test-uuid',
        contentType: 'test-content',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'user-123',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'user-123',
        version: 1,
        isDeleted: false,
        data: {
          name: 'Test Content',
          description: 'Test Description',
        },
      };

      // Access protected method through any cast for testing
      const indexFields = (storageService as any).extractIndexFields(content);

      expect(indexFields).toEqual({});
    });

    it('should sort items by creation date (most recent first)', async () => {
      const items = [
        { uuid: 'uuid-1', createdAt: '2024-01-01T00:00:00Z' },
        { uuid: 'uuid-3', createdAt: '2024-01-03T00:00:00Z' },
        { uuid: 'uuid-2', createdAt: '2024-01-02T00:00:00Z' },
      ];

      // Access protected method through any cast for testing
      const sortedItems = (storageService as any).sortIndexItems(items);

      expect(sortedItems[0].uuid).toBe('uuid-3'); // Most recent
      expect(sortedItems[1].uuid).toBe('uuid-2');
      expect(sortedItems[2].uuid).toBe('uuid-1'); // Oldest
    });
  });
});

describe('Error classes', () => {
  describe('ContentNotFoundError', () => {
    it('should create error with proper message and name', () => {
      const error = new ContentNotFoundError('clients', 'uuid-123');

      expect(error.message).toBe('clients with UUID uuid-123 not found');
      expect(error.name).toBe('ContentNotFoundError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ContentValidationError', () => {
    it('should create error with proper message and name', () => {
      const error = new ContentValidationError('Validation failed');

      expect(error.message).toBe('Validation failed');
      expect(error.name).toBe('ContentValidationError');
      expect(error).toBeInstanceOf(Error);
    });
  });
});

describe('createContentStorageService factory', () => {
  it('should create ContentStorageService instance', () => {
    const mockR2Bucket = {} as R2Bucket;
    const service = createContentStorageService<TestContent>(mockR2Bucket, 'test-content');

    expect(service).toBeInstanceOf(ContentStorageService);
  });
});