import type { BaseContent, ContentWithRelations } from './types.js';
import { resolveContentRelations, type ContentFetcher } from './utils.js';
import { extractRelationChanges, hasRelationFields } from './relation-validation.js';

/**
 * R2-like storage interface for type safety
 * This allows the shared package to be environment-agnostic
 * while still providing proper typing
 */
export interface StorageBucket {
  get(key: string): Promise<StorageObject | null>;
  put(
    key: string,
    value: string,
    options?: {
      httpMetadata?: { contentType?: string; cacheControl?: string };
      customMetadata?: Record<string, string>;
    }
  ): Promise<StorageObject>;
  delete(key: string): Promise<void>;
}

export interface StorageObject {
  json(): Promise<any>;
}

/**
 * Generic content storage service for R2 operations
 * Provides CRUD operations and search index synchronization
 * Includes automatic relation resolution for all API responses
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export class ContentStorageService<T extends BaseContent> {
  constructor(
    private r2Bucket: StorageBucket, // Use generic storage interface
    private contentType: string
  ) {}

  /**
   * Content fetcher implementation for relation resolution
   * Uses the same storage service to fetch related content
   */
  private createContentFetcher(): ContentFetcher {
    return async (contentType: string, uuid: string) => {
      // Create a temporary storage service for the target content type
      const targetStorage = new ContentStorageService(this.r2Bucket, contentType);
      return await targetStorage.getWithoutRelations(uuid);
    };
  }

  /**
   * Retrieve a content item by UUID without relation resolution
   * Internal method used by relation resolution to avoid circular dependencies
   * Uses R2 key pattern: content/{type}/{uuid}.json
   */
  private async getWithoutRelations(uuid: string): Promise<T | null> {
    const key = `content/${this.contentType}/${uuid}.json`;
    const object = await this.r2Bucket.get(key);

    if (!object) return null;

    const content = (await object.json()) as T;
    return content.isDeleted ? null : content;
  }

  /**
   * Retrieve a content item by UUID with resolved relations
   * Uses R2 key pattern: content/{type}/{uuid}.json
   * Requirements: 2.2
   */
  async get(uuid: string): Promise<ContentWithRelations<T['data']> | null> {
    const content = await this.getWithoutRelations(uuid);

    if (!content) return null;

    // Resolve relations and return enhanced content
    const contentFetcher = this.createContentFetcher();
    return await resolveContentRelations(content, contentFetcher);
  }

  /**
   * Create a new content item with resolved relations
   * Generates UUID and sets initial audit trail values
   * Requirements: 2.1, 2.4
   */
  async create(
    data: T['data'],
    userContext: { userId: string }
  ): Promise<ContentWithRelations<T['data']>> {
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
      data,
    } as T;

    await this.save(content);
    await this.updateIndex(content, 'create');

    // Resolve relations and return enhanced content
    const contentFetcher = this.createContentFetcher();
    return await resolveContentRelations(content, contentFetcher);
  }

  /**
   * Update an existing content item with resolved relations
   * Increments version and updates audit trail
   * Maintains audit trail for relation changes
   * Requirements: 2.4, 1.5 - Maintain audit trail for relation changes
   */
  async update(
    uuid: string,
    data: Partial<T['data']>,
    userContext: { userId: string }
  ): Promise<ContentWithRelations<T['data']>> {
    const existing = await this.getWithoutRelations(uuid);
    if (!existing) throw new Error('Content not found');

    const now = new Date().toISOString();

    // Extract relation changes for audit trail
    const relationChanges = extractRelationChanges(this.contentType, existing.data, {
      ...existing.data,
      ...data,
    });

    const updated: T = {
      ...existing,
      data: { ...existing.data, ...data },
      updatedAt: now,
      updatedBy: userContext.userId,
      version: existing.version + 1,
    };

    // Log relation changes if any occurred
    if (Object.keys(relationChanges).length > 0) {
      console.log(`Relation changes for ${this.contentType} ${uuid}:`, relationChanges);
      // In a production system, this would be stored in a proper audit log
      // For now, we log to console for debugging and audit purposes
    }

    await this.save(updated);
    await this.updateIndex(updated, 'update');

    // Resolve relations and return enhanced content
    const contentFetcher = this.createContentFetcher();
    return await resolveContentRelations(updated, contentFetcher);
  }

  /**
   * Soft delete a content item
   * Sets isDeleted flag and deletion audit trail
   * Requirements: 2.4
   */
  async delete(uuid: string, userContext: { userId: string }): Promise<void> {
    const existing = await this.getWithoutRelations(uuid);
    if (!existing) throw new Error('Content not found');

    const now = new Date().toISOString();

    const deleted: T = {
      ...existing,
      isDeleted: true,
      deletedAt: now,
      deletedBy: userContext.userId,
      version: existing.version + 1,
    };

    await this.save(deleted);
    await this.updateIndex(deleted, 'delete');
  }

  /**
   * List content items with pagination and resolved relations
   * Uses search index for efficient querying
   * Requirements: 2.3
   */
  async list(
    page: number = 1,
    limit: number = 50
  ): Promise<{ items: ContentWithRelations<T['data']>[]; total: number }> {
    const indexKey = `indexes/${this.contentType}-index.json`;

    const indexObject = await this.r2Bucket.get(indexKey);
    if (!indexObject) {
      return { items: [], total: 0 };
    }

    const index = (await indexObject.json()) as { items: any[] };
    const activeItems = index.items.filter(item => !item.isDeleted);

    // Sort by creation date (most recent first) for most content types
    // Clients should be sorted alphabetically (handled in subclasses)
    const sortedItems = this.sortIndexItems(activeItems);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = sortedItems.slice(startIndex, endIndex);

    // Fetch full content for paginated items and resolve relations
    const contentFetcher = this.createContentFetcher();
    const items: ContentWithRelations<T['data']>[] = [];

    for (const indexItem of paginatedItems) {
      const content = await this.getWithoutRelations(indexItem.uuid);
      if (content) {
        const contentWithRelations = await resolveContentRelations(content, contentFetcher);
        items.push(contentWithRelations);
      }
    }

    return { items, total: activeItems.length };
  }

  /**
   * Search content items with resolved relations
   * Uses search index with searchable text
   * Requirements: 2.3
   */
  async search(query: string): Promise<ContentWithRelations<T['data']>[]> {
    const indexKey = `indexes/${this.contentType}-index.json`;

    const indexObject = await this.r2Bucket.get(indexKey);
    if (!indexObject) {
      return [];
    }

    const index = (await indexObject.json()) as { items: any[] };
    const searchTerm = query.toLowerCase();

    const matchingItems = index.items.filter(
      item => !item.isDeleted && item.searchableText && item.searchableText.includes(searchTerm)
    );

    // Fetch full content for matching items and resolve relations
    const contentFetcher = this.createContentFetcher();
    const items: ContentWithRelations<T['data']>[] = [];

    for (const indexItem of matchingItems) {
      const content = await this.getWithoutRelations(indexItem.uuid);
      if (content) {
        const contentWithRelations = await resolveContentRelations(content, contentFetcher);
        items.push(contentWithRelations);
      }
    }

    return items;
  }

  /**
   * Save content item to R2 storage
   * Uses key pattern: content/{type}/{uuid}.json
   * Sets proper Content-Type metadata for R2 dashboard preview
   * Requirements: 2.1
   */
  private async save(content: T): Promise<void> {
    const key = `content/${this.contentType}/${content.uuid}.json`;
    await this.r2Bucket.put(key, JSON.stringify(content, null, 2), {
      httpMetadata: {
        contentType: 'application/json',
        cacheControl: 'public, max-age=3600',
      },
      customMetadata: {
        contentType: this.contentType,
        version: content.version.toString(),
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
      },
    });
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
    const index = indexObject
      ? await indexObject.json()
      : {
          contentType: this.contentType,
          lastUpdated: new Date().toISOString(),
          items: [],
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
        ...this.extractIndexFields(content),
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
    await this.r2Bucket.put(indexKey, JSON.stringify(index, null, 2), {
      httpMetadata: {
        contentType: 'application/json',
        cacheControl: 'public, max-age=300',
      },
      customMetadata: {
        contentType: `${this.contentType}-index`,
        lastUpdated: index.lastUpdated,
        itemCount: index.items.length.toString(),
      },
    });
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
