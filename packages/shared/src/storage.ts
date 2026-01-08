import type { BaseContent } from './types.js';

/**
 * R2-like storage interface for type safety
 * This allows the shared package to be environment-agnostic
 * while still providing proper typing
 */
export interface StorageBucket {
  get(key: string): Promise<StorageObject | null>;
  put(key: string, value: string): Promise<StorageObject>;
  delete(key: string): Promise<void>;
}

export interface StorageObject {
  json(): Promise<any>;
}

/**
 * Generic content storage service for R2 operations
 * Provides CRUD operations and search index synchronization
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export class ContentStorageService<T extends BaseContent> {
  constructor(
    private r2Bucket: StorageBucket, // Use generic storage interface
    private contentType: string
  ) {}

  /**
   * Retrieve a content item by UUID
   * Uses R2 key pattern: content/{type}/{uuid}.json
   * Requirements: 2.2
   */
  async get(uuid: string): Promise<T | null> {
    const key = `content/${this.contentType}/${uuid}.json`;
    const object = await this.r2Bucket.get(key);
    
    if (!object) return null;
    
    const content = await object.json() as T;
    return content.isDeleted ? null : content;
  }

  /**
   * Create a new content item
   * Generates UUID and sets initial audit trail values
   * Requirements: 2.1, 2.4
   */
  async create(data: T['data'], userContext: { userId: string }): Promise<T> {
    const uuid = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const content: T = {
      uuid,
      contentType: this.contentType,
      createdAt: now,
      createdBy: userContext.userId,
      updatedAt: now,
      updatedBy: userContext.userId,
      version: 1,
      isDeleted: false,
      data
    } as T;

    await this.save(content);
    await this.updateIndex(content, 'create');
    
    return content;
  }

  /**
   * Update an existing content item
   * Increments version and updates audit trail
   * Requirements: 2.4
   */
  async update(uuid: string, data: Partial<T['data']>, userContext: { userId: string }): Promise<T> {
    const existing = await this.get(uuid);
    if (!existing) throw new Error('Content not found');
    
    const now = new Date().toISOString();
    
    const updated: T = {
      ...existing,
      data: { ...existing.data, ...data },
      updatedAt: now,
      updatedBy: userContext.userId,
      version: existing.version + 1
    };

    await this.save(updated);
    await this.updateIndex(updated, 'update');
    
    return updated;
  }

  /**
   * Soft delete a content item
   * Sets isDeleted flag and deletion audit trail
   * Requirements: 2.4
   */
  async delete(uuid: string, userContext: { userId: string }): Promise<void> {
    const existing = await this.get(uuid);
    if (!existing) throw new Error('Content not found');
    
    const now = new Date().toISOString();
    
    const deleted: T = {
      ...existing,
      isDeleted: true,
      deletedAt: now,
      deletedBy: userContext.userId,
      version: existing.version + 1
    };

    await this.save(deleted);
    await this.updateIndex(deleted, 'delete');
  }

  /**
   * List content items with pagination
   * Uses search index for efficient querying
   * Requirements: 2.3
   */
  async list(page: number = 1, limit: number = 50): Promise<{ items: T[]; total: number }> {
    const indexKey = `indexes/${this.contentType}-index.json`;
    
    const indexObject = await this.r2Bucket.get(indexKey);
    if (!indexObject) {
      return { items: [], total: 0 };
    }
    
    const index = await indexObject.json() as { items: any[] };
    const activeItems = index.items.filter(item => !item.isDeleted);
    
    // Sort by creation date (most recent first) for most content types
    // Clients should be sorted alphabetically (handled in subclasses)
    const sortedItems = this.sortIndexItems(activeItems);
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = sortedItems.slice(startIndex, endIndex);
    
    // Fetch full content for paginated items
    const items: T[] = [];
    for (const indexItem of paginatedItems) {
      const content = await this.get(indexItem.uuid);
      if (content) {
        items.push(content);
      }
    }
    
    return { items, total: activeItems.length };
  }

  /**
   * Search content items
   * Uses search index with searchable text
   * Requirements: 2.3
   */
  async search(query: string): Promise<T[]> {
    const indexKey = `indexes/${this.contentType}-index.json`;
    
    const indexObject = await this.r2Bucket.get(indexKey);
    if (!indexObject) {
      return [];
    }
    
    const index = await indexObject.json() as { items: any[] };
    const searchTerm = query.toLowerCase();
    
    const matchingItems = index.items.filter(item => 
      !item.isDeleted && 
      item.searchableText && 
      item.searchableText.includes(searchTerm)
    );
    
    // Fetch full content for matching items
    const items: T[] = [];
    for (const indexItem of matchingItems) {
      const content = await this.get(indexItem.uuid);
      if (content) {
        items.push(content);
      }
    }
    
    return items;
  }

  /**
   * Save content item to R2 storage
   * Uses key pattern: content/{type}/{uuid}.json
   * Requirements: 2.1
   */
  private async save(content: T): Promise<void> {
    const key = `content/${this.contentType}/${content.uuid}.json`;
    await this.r2Bucket.put(key, JSON.stringify(content));
  }

  /**
   * Update search index with content changes
   * Maintains synchronization between storage and index
   * Requirements: 2.4
   */
  private async updateIndex(content: T, operation: 'create' | 'update' | 'delete'): Promise<void> {
    const indexKey = `indexes/${this.contentType}-index.json`;
    
    // Get current index
    const indexObject = await this.r2Bucket.get(indexKey);
    const index = indexObject ? await indexObject.json() : { 
      contentType: this.contentType,
      lastUpdated: new Date().toISOString(),
      items: [] 
    };
    
    // Ensure items array exists
    if (!index.items) {
      index.items = [];
    }
    
    // Update index based on operation
    const existingIndex = index.items.findIndex((item: any) => item.uuid === content.uuid);
    
    if (operation === 'delete') {
      if (existingIndex !== -1) {
        index.items[existingIndex].isDeleted = true;
      }
    } else {
      const indexItem = {
        uuid: content.uuid,
        contentType: content.contentType,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
        isDeleted: content.isDeleted,
        // Searchable fields extracted from data
        searchableText: this.extractSearchableText(content),
        ...this.extractIndexFields(content)
      };
      
      if (existingIndex !== -1) {
        index.items[existingIndex] = indexItem;
      } else {
        index.items.push(indexItem);
      }
    }
    
    // Update index metadata
    index.lastUpdated = new Date().toISOString();
    
    // Save updated index
    await this.r2Bucket.put(indexKey, JSON.stringify(index));
  }

  /**
   * Extract searchable text from content data
   * Override in subclasses for content-specific search
   * Requirements: 2.3
   */
  protected extractSearchableText(content: T): string {
    return JSON.stringify(content.data).toLowerCase();
  }

  /**
   * Extract index fields from content data
   * Override in subclasses for content-specific index fields
   * Requirements: 2.3
   */
  protected extractIndexFields(content: T): Record<string, any> {
    return {};
  }

  /**
   * Sort index items for listing
   * Override in subclasses for content-specific sorting
   * Default: by creation date (most recent first)
   * Clients: alphabetical sorting
   * Requirements: 2.3
   */
  protected sortIndexItems(items: any[]): any[] {
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

/**
 * Error types for storage operations
 */
export class ContentNotFoundError extends Error {
  constructor(contentType: string, uuid: string) {
    super(`${contentType} with UUID ${uuid} not found`);
    this.name = 'ContentNotFoundError';
  }
}

export class ContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentValidationError';
  }
}

/**
 * Storage service factory for creating content-specific services
 */
export function createContentStorageService<T extends BaseContent>(
  r2Bucket: StorageBucket, // Use generic storage interface
  contentType: string
): ContentStorageService<T> {
  return new ContentStorageService<T>(r2Bucket, contentType);
}