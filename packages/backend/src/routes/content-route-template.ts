/**
 * Generic API route template for content types
 * Provides standardized CRUD operations with authentication, error handling, and sorting
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.6, 10.1, 10.4
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { requireAuth, requireUserContext } from '../middleware/clerk';
import { requireDeletePermission } from '../middleware/permissions';
import { ContentStorageService } from '@clever/shared';
import type { StorageBucket } from '@clever/shared';
import type {
  BaseContent,
  ApiResponse,
  ListResponse,
  SearchResponse,
  ContentType,
  CreateContentRequest,
  UpdateContentRequest,
  UserContext,
  ContentWithRelations,
} from '@clever/shared';

/**
 * Content-specific sorting strategies
 * Requirements: 8.6 - Content-specific sorting logic
 */
export type SortStrategy = 'alphabetical' | 'date-desc' | 'date-asc';

/**
 * Content route configuration
 */
export interface ContentRouteConfig<T extends BaseContent> {
  contentType: ContentType;
  sortStrategy: SortStrategy;
  searchFields?: string[];
  validateCreate?: (data: any, userContext?: UserContext) => Promise<void> | void;
  validateUpdate?: (data: any, existingContent?: T, userContext?: UserContext) => Promise<void> | void;
  extractSearchableText?: (content: T) => string;
  extractIndexFields?: (content: T) => Record<string, any>;
}

/**
 * Extended storage service with content-specific sorting
 */
class ConfigurableContentStorageService<T extends BaseContent> extends ContentStorageService<T> {
  constructor(
    r2Bucket: StorageBucket, // Use the generic storage interface
    contentType: string,
    private config: ContentRouteConfig<T>
  ) {
    super(r2Bucket, contentType);
  }

  /**
   * Override sorting based on content type configuration
   * Requirements: 8.6 - Alphabetical for clients, by date for others
   */
  protected sortIndexItems(items: any[]): any[] {
    switch (this.config.sortStrategy) {
      case 'alphabetical':
        // Sort alphabetically by searchable text or name field
        return items.sort((a, b) => {
          const aText = a.searchableText || a.name || '';
          const bText = b.searchableText || b.name || '';
          return aText.localeCompare(bText, 'pt-PT');
        });

      case 'date-asc':
        // Sort by creation date (oldest first)
        return items.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

      case 'date-desc':
      default:
        // Sort by creation date (most recent first) - default behavior
        return items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }

  /**
   * Override searchable text extraction if configured
   */
  protected extractSearchableText(content: T): string {
    if (this.config.extractSearchableText) {
      return this.config.extractSearchableText(content);
    }
    return super.extractSearchableText(content);
  }

  /**
   * Override index fields extraction if configured
   */
  protected extractIndexFields(content: T): Record<string, any> {
    if (this.config.extractIndexFields) {
      return this.config.extractIndexFields(content);
    }
    return super.extractIndexFields(content);
  }
}

/**
 * Create generic CRUD routes for a content type
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 10.1, 10.4
 */
export function createContentRoutes<T extends BaseContent>(config: ContentRouteConfig<T>): Hono {
  const router = new Hono();

  // Authentication is now applied at the API level, no need to apply here

  /**
   * List content items with search and pagination
   * GET /api/content/{type}?search=query&page=1&limit=50
   * Requirements: 4.1 - GET /api/content/{type} endpoint for listing items
   */
  router.get('/', async (c: Context) => {
    try {
      const user = requireUserContext(c);
      const r2Bucket = c.env?.R2_BUCKET as StorageBucket; // Cast to generic interface

      if (!r2Bucket) {
        const response: ApiResponse = {
          success: false,
          error: 'Storage not available',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 500);
      }

      const storage = new ConfigurableContentStorageService<T>(
        r2Bucket,
        config.contentType,
        config
      );

      const searchQuery = c.req.query('search');
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '50');

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100.',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 400);
      }

      if (searchQuery) {
        // Search content
        const results = await storage.search(searchQuery);
        const response: SearchResponse<ContentWithRelations<any>> = {
          success: true,
          data: results,
          query: searchQuery,
          count: results.length,
          timestamp: new Date().toISOString(),
        };
        return c.json(response);
      } else {
        // List content with pagination
        const { items, total } = await storage.list(page, limit);
        const response: ListResponse<ContentWithRelations<any>> = {
          success: true,
          data: items,
          pagination: {
            page,
            limit,
            total,
          },
          timestamp: new Date().toISOString(),
        };
        return c.json(response);
      }
    } catch (error) {
      console.error(`Error listing ${config.contentType}:`, error);
      const response: ApiResponse = {
        success: false,
        error: `Failed to retrieve ${config.contentType}`,
        timestamp: new Date().toISOString(),
      };
      // Requirements: 4.6 - Appropriate HTTP status codes and error messages
      return c.json(response, 500);
    }
  });

  /**
   * Get single content item by UUID
   * GET /api/content/{type}/{uuid}
   * Requirements: 4.2 - GET /api/content/{type}/{uuid} endpoint for retrieving individual items
   */
  router.get('/:uuid', async (c: Context) => {
    try {
      const user = requireUserContext(c);
      const uuid = c.req.param('uuid');
      const r2Bucket = c.env?.R2_BUCKET as StorageBucket; // Cast to generic interface

      if (!r2Bucket) {
        const response: ApiResponse = {
          success: false,
          error: 'Storage not available',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 500);
      }

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(uuid)) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid UUID format',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 400);
      }

      const storage = new ConfigurableContentStorageService<T>(
        r2Bucket,
        config.contentType,
        config
      );

      const item = await storage.get(uuid);

      if (!item) {
        const response: ApiResponse = {
          success: false,
          error: `${config.contentType} not found`,
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 404);
      }

      const response: ApiResponse<ContentWithRelations<any>> = {
        success: true,
        data: item,
        timestamp: new Date().toISOString(),
      };
      return c.json(response);
    } catch (error) {
      console.error(`Error retrieving ${config.contentType}:`, error);
      const response: ApiResponse = {
        success: false,
        error: `Failed to retrieve ${config.contentType}`,
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 500);
    }
  });

  /**
   * Create new content item
   * POST /api/content/{type}
   * Requirements: 4.3 - POST /api/content/{type} endpoint for creating new items
   */
  router.post('/', async (c: Context) => {
    try {
      const user = requireUserContext(c);
      const r2Bucket = c.env?.R2_BUCKET as StorageBucket; // Cast to generic interface

      if (!r2Bucket) {
        const response: ApiResponse = {
          success: false,
          error: 'Storage not available',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 500);
      }

      let requestData;
      try {
        requestData = await c.req.json();
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid JSON body',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 400);
      }

      // Validate request data if validator is provided
      if (config.validateCreate) {
        try {
          await config.validateCreate(requestData, user);
        } catch (validationError) {
          const response: ApiResponse = {
            success: false,
            error: validationError instanceof Error ? validationError.message : 'Validation failed',
            timestamp: new Date().toISOString(),
          };
          return c.json(response, 400);
        }
      }

      // Note: Relation validation is handled within the validation functions
      // This allows content creation with relation IDs without validating referenced content exists
      // Requirements: 1.1, 1.3 - Allow creation without validating referenced content exists

      const storage = new ConfigurableContentStorageService<T>(
        r2Bucket,
        config.contentType,
        config
      );

      // Extract the actual content data from the request
      const contentData = requestData.data || requestData;
      const newItem = await storage.create(contentData, { userId: user.userId });

      const response: ApiResponse<ContentWithRelations<any>> = {
        success: true,
        data: newItem,
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 201);
    } catch (error) {
      console.error(`Error creating ${config.contentType}:`, error);
      const response: ApiResponse = {
        success: false,
        error: `Failed to create ${config.contentType}`,
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 500);
    }
  });

  /**
   * Update existing content item
   * PUT /api/content/{type}/{uuid}
   * Requirements: 4.4 - PUT /api/content/{type}/{uuid} endpoint for updating existing items
   */
  router.put('/:uuid', async (c: Context) => {
    try {
      const user = requireUserContext(c);
      const uuid = c.req.param('uuid');
      const r2Bucket = c.env?.R2_BUCKET as StorageBucket; // Cast to generic interface

      if (!r2Bucket) {
        const response: ApiResponse = {
          success: false,
          error: 'Storage not available',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 500);
      }

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(uuid)) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid UUID format',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 400);
      }

      let requestData;
      try {
        requestData = await c.req.json();
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid JSON body',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 400);
      }

      // Validate request data if validator is provided
      if (config.validateUpdate) {
        try {
          // Fetch existing content for validation that requires comparison
          const storage = new ConfigurableContentStorageService<T>(
            r2Bucket,
            config.contentType,
            config
          );

          let existingContent: T | undefined;
          try {
            const contentWithRelations = await storage.get(uuid);
            existingContent = contentWithRelations as unknown as T;
          } catch (error) {
            // If content doesn't exist, validation will handle it
            existingContent = undefined;
          }

          await config.validateUpdate(requestData, existingContent, user);
        } catch (validationError) {
          const response: ApiResponse = {
            success: false,
            error: validationError instanceof Error ? validationError.message : 'Validation failed',
            timestamp: new Date().toISOString(),
          };
          return c.json(response, 400);
        }
      }

      // Note: Relation validation is handled within the validation functions
      // This allows content updates with relation IDs without validating referenced content exists
      // Requirements: 1.1, 1.3 - Allow updates without validating referenced content exists

      const storage = new ConfigurableContentStorageService<T>(
        r2Bucket,
        config.contentType,
        config
      );

      try {
        // Extract the actual content data from the request
        const contentData = requestData.data || requestData;
        const updatedItem = await storage.update(uuid, contentData, { userId: user.userId });

        const response: ApiResponse<ContentWithRelations<any>> = {
          success: true,
          data: updatedItem,
          timestamp: new Date().toISOString(),
        };
        return c.json(response);
      } catch (error) {
        if (error instanceof Error && error.message === 'Content not found') {
          const response: ApiResponse = {
            success: false,
            error: `${config.contentType} not found`,
            timestamp: new Date().toISOString(),
          };
          return c.json(response, 404);
        }
        throw error;
      }
    } catch (error) {
      console.error(`Error updating ${config.contentType}:`, error);
      const response: ApiResponse = {
        success: false,
        error: `Failed to update ${config.contentType}`,
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 500);
    }
  });

  /**
   * Soft delete content item
   * DELETE /api/content/{type}/{uuid}
   * Requirements: 4.5 - DELETE /api/content/{type}/{uuid} endpoint for soft deleting items
   */
  router.delete('/:uuid', requireDeletePermission, async (c: Context) => {
    try {
      const user = requireUserContext(c);
      const uuid = c.req.param('uuid');
      const r2Bucket = c.env?.R2_BUCKET as StorageBucket; // Cast to generic interface

      if (!r2Bucket) {
        const response: ApiResponse = {
          success: false,
          error: 'Storage not available',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 500);
      }

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(uuid)) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid UUID format',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 400);
      }

      const storage = new ConfigurableContentStorageService<T>(
        r2Bucket,
        config.contentType,
        config
      );

      try {
        await storage.delete(uuid, { userId: user.userId });

        const response: ApiResponse<void> = {
          success: true,
          timestamp: new Date().toISOString(),
        };
        return c.json(response);
      } catch (error) {
        if (error instanceof Error && error.message === 'Content not found') {
          const response: ApiResponse = {
            success: false,
            error: `${config.contentType} not found`,
            timestamp: new Date().toISOString(),
          };
          return c.json(response, 404);
        }
        throw error;
      }
    } catch (error) {
      console.error(`Error deleting ${config.contentType}:`, error);
      const response: ApiResponse = {
        success: false,
        error: `Failed to delete ${config.contentType}`,
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 500);
    }
  });

  return router;
}

/**
 * Helper function to create standard content route configurations
 */
export function createStandardContentConfig<T extends BaseContent>(
  contentType: ContentType,
  sortStrategy: SortStrategy = 'date-desc'
): ContentRouteConfig<T> {
  return {
    contentType,
    sortStrategy,
  };
}

/**
 * Helper function to create client-specific route configuration
 * Requirements: 8.6 - Alphabetical sorting for clients
 */
export function createClientContentConfig<T extends BaseContent>(): ContentRouteConfig<T> {
  return {
    contentType: 'clients',
    sortStrategy: 'alphabetical',
    extractSearchableText: (content: T) => {
      const data = content.data as any;
      const searchableFields = [
        data.nomeEmpresa,
        data.nomeComercial,
        data.contribuinte,
        data.localidade,
        data.responsavel,
        data.telefoneContato,
        data.email,
      ].filter(Boolean);
      return searchableFields.join(' ').toLowerCase();
    },
    extractIndexFields: (content: T) => {
      const data = content.data as any;
      return {
        nomeEmpresa: data.nomeEmpresa || '',
        nomeComercial: data.nomeComercial || '',
        contribuinte: data.contribuinte || '',
        localidade: data.localidade || '',
        responsavel: data.responsavel || '',
        telefoneContato: data.telefoneContato || '',
        email: data.email || '',
      };
    },
  };
}

/**
 * Error handling middleware for content routes
 * Requirements: 4.6 - Error handling with appropriate HTTP status codes
 */
export const contentErrorHandler = async (c: Context, next: () => Promise<void>) => {
  try {
    await next();
  } catch (error) {
    console.error('Content route error:', error);

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('authentication required')) {
      const response: ApiResponse = {
        success: false,
        error: 'Authentication required. Please sign in to access this resource.',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 401);
    }

    // Handle validation errors
    if (error instanceof Error && error.message.includes('validation')) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 400);
    }

    // Handle not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 404);
    }

    // Generic server error
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }
};
