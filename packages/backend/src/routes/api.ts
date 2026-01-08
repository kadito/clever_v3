import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requireAuth, getUserContext, requireUserContext } from '../middleware/clerk';
import type {
  BaseContent,
  ApiResponse,
  ListResponse,
  ContentType,
  CreateContentRequest,
  UpdateContentRequest,
} from '@clever/shared';

// Create API router with basic typing
const api = new Hono();

// CORS middleware for development
api.use(
  '/*',
  cors({
    origin: ['http://localhost:8787', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Content types supported by the system
const CONTENT_TYPES: ContentType[] = [
  'clients',
  'contracts',
  'licenses',
  'work-sheets',
  'daily-records',
  'remote-assistance',
  'reminders',
  'pending',
];

// Validate content type middleware
const validateContentType = async (c: any, next: any) => {
  const type = c.req.param('type');
  if (!CONTENT_TYPES.includes(type as ContentType)) {
    const response: ApiResponse = {
      success: false,
      error: `Invalid content type: ${type}`,
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 400);
  }
  await next();
};

// Authentication error handling middleware
const handleAuthError = async (c: any, next: any) => {
  try {
    await next();
  } catch (error) {
    if (error instanceof Error && error.message.includes('authentication required')) {
      const response: ApiResponse = {
        success: false,
        error: 'Authentication required. Please sign in to access this resource.',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 401);
    }
    throw error; // Re-throw non-auth errors
  }
};

// CRUD endpoints for content types

// Apply authentication to all content routes
// Requirements: 5.4, 5.5 - Protect all API endpoints except health checks
api.use('/content/*', requireAuth, handleAuthError);

// List content items
api.get('/content/:type', validateContentType, async c => {
  const type = c.req.param('type') as ContentType;
  
  try {
    // Ensure user context is available
    // Requirements: 3.5 - User context available to all protected endpoints
    const user = requireUserContext(c);
    
    // TODO: Implement actual data retrieval from R2/KV
    // For now, return empty list with user context validation
    const response: ListResponse<BaseContent> = {
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
      },
      timestamp: new Date().toISOString(),
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve content items',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }
});

// Get single content item
api.get('/content/:type/:uuid', validateContentType, async c => {
  const type = c.req.param('type') as ContentType;
  const uuid = c.req.param('uuid');
  
  try {
    // Ensure user context is available
    // Requirements: 3.5 - User context available to all protected endpoints
    const user = requireUserContext(c);
    
    // TODO: Implement actual data retrieval from R2/KV
    // For now, return null with user context validation
    const response: ApiResponse<BaseContent | null> = {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve content item',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }
});

// Create new content item
api.post('/content/:type', validateContentType, async c => {
  const type = c.req.param('type') as ContentType;
  
  try {
    // Ensure user context is available
    // Requirements: 3.5 - User context available to all protected endpoints
    const user = requireUserContext(c);
    
    const body = await c.req.json();

    // Create new content item following BaseContent interface
    // Requirements: 3.2, 3.4, 3.5 - Use authenticated user context
    const newContent: BaseContent = {
      uuid: crypto.randomUUID(),
      contentType: type,
      createdAt: new Date().toISOString(),
      createdBy: user.email || user.userId,
      updatedAt: new Date().toISOString(),
      updatedBy: user.email || user.userId,
      version: 1,
      isDeleted: false,
      data: body,
    };

    // TODO: Implement actual data creation and storage
    const response: ApiResponse<BaseContent> = {
      success: true,
      data: newContent,
      timestamp: new Date().toISOString(),
    };

    return c.json(response, 201);
  } catch (error) {
    if (error instanceof SyntaxError) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid JSON body',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 400);
    }
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create content item',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }
});

// Update existing content item
api.put('/content/:type/:uuid', validateContentType, async c => {
  const type = c.req.param('type') as ContentType;
  const uuid = c.req.param('uuid');
  
  try {
    // Ensure user context is available
    // Requirements: 3.5 - User context available to all protected endpoints
    const user = requireUserContext(c);
    
    const body: UpdateContentRequest<BaseContent> = await c.req.json();

    // TODO: Implement actual data update
    // For now, create a mock updated content item
    // Requirements: 3.2, 3.4, 3.5 - Use authenticated user context
    const updatedContent: Partial<BaseContent> = {
      uuid,
      contentType: type,
      updatedAt: new Date().toISOString(),
      updatedBy: user.email || user.userId,
      version: 2, // TODO: Increment actual version
      data: body.data,
    };

    const response: ApiResponse<Partial<BaseContent>> = {
      success: true,
      data: updatedContent,
      timestamp: new Date().toISOString(),
    };

    return c.json(response);
  } catch (error) {
    if (error instanceof SyntaxError) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid JSON body',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 400);
    }
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update content item',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }
});

// Soft delete content item
api.delete('/content/:type/:uuid', validateContentType, async c => {
  const type = c.req.param('type') as ContentType;
  const uuid = c.req.param('uuid');
  
  try {
    // Ensure user context is available
    // Requirements: 3.5 - User context available to all protected endpoints
    const user = requireUserContext(c);
    
    // TODO: Implement actual soft delete
    // Requirements: 3.2, 3.4, 3.5 - Use authenticated user context
    const deletedContent: Partial<BaseContent> = {
      uuid,
      contentType: type,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: user.email || user.userId,
    };

    const response: ApiResponse<Partial<BaseContent>> = {
      success: true,
      data: deletedContent,
      timestamp: new Date().toISOString(),
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete content item',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }
});

// User profile endpoints - protected
// Requirements: 5.4 - Protect all API endpoints except health checks

// Get current user profile
api.get('/user/profile', requireAuth, handleAuthError, async c => {
  try {
    const user = requireUserContext(c);
    
    const response: ApiResponse<typeof user> = {
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve user profile',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }
});

// Update user preferences (protected endpoint example)
api.put('/user/preferences', requireAuth, handleAuthError, async c => {
  try {
    const user = requireUserContext(c);
    const body = await c.req.json();
    
    // TODO: Implement user preferences storage
    const response: ApiResponse = {
      success: true,
      data: { message: 'Preferences updated successfully' },
      timestamp: new Date().toISOString(),
    };

    return c.json(response);
  } catch (error) {
    if (error instanceof SyntaxError) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid JSON body',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 400);
    }
    
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update preferences',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }
});

export default api;
