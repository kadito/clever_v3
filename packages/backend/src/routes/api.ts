import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { 
  BaseContent, 
  ApiResponse, 
  ListResponse, 
  ContentType,
  CreateContentRequest,
  UpdateContentRequest
} from '@clever/shared';

// Create API router
const api = new Hono();

// CORS middleware for development
api.use('/*', cors({
  origin: ['http://localhost:8787', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Content types supported by the system
const CONTENT_TYPES: ContentType[] = [
  'clients',
  'contracts', 
  'licenses',
  'work-sheets',
  'daily-records',
  'remote-assistance',
  'reminders',
  'pending'
];

// Validate content type middleware
const validateContentType = async (c: any, next: any) => {
  const type = c.req.param('type');
  if (!CONTENT_TYPES.includes(type as ContentType)) {
    const response: ApiResponse = {
      success: false, 
      error: `Invalid content type: ${type}`,
      timestamp: new Date().toISOString()
    };
    return c.json(response, 400);
  }
  await next();
};

// CRUD endpoints for content types

// List content items
api.get('/content/:type', validateContentType, async (c) => {
  const type = c.req.param('type') as ContentType;
  
  // TODO: Implement actual data retrieval from R2/KV
  const response: ListResponse<BaseContent> = {
    success: true,
    data: [],
    pagination: {
      page: 1,
      limit: 50,
      total: 0
    },
    timestamp: new Date().toISOString()
  };
  
  return c.json(response);
});

// Get single content item
api.get('/content/:type/:uuid', validateContentType, async (c) => {
  const type = c.req.param('type') as ContentType;
  const uuid = c.req.param('uuid');
  
  // TODO: Implement actual data retrieval from R2/KV
  const response: ApiResponse<BaseContent | null> = {
    success: true,
    data: null,
    timestamp: new Date().toISOString()
  };
  
  return c.json(response);
});

// Create new content item
api.post('/content/:type', validateContentType, async (c) => {
  const type = c.req.param('type') as ContentType;
  
  try {
    const body = await c.req.json();
    
    // Create new content item following BaseContent interface
    const newContent: BaseContent = {
      uuid: crypto.randomUUID(),
      contentType: type,
      createdAt: new Date().toISOString(),
      createdBy: 'system', // TODO: Get from auth context
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
      version: 1,
      isDeleted: false,
      data: body
    };
    
    // TODO: Implement actual data creation and storage
    const response: ApiResponse<BaseContent> = {
      success: true,
      data: newContent,
      timestamp: new Date().toISOString()
    };
    
    return c.json(response, 201);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid JSON body',
      timestamp: new Date().toISOString()
    };
    return c.json(response, 400);
  }
});

// Update existing content item
api.put('/content/:type/:uuid', validateContentType, async (c) => {
  const type = c.req.param('type') as ContentType;
  const uuid = c.req.param('uuid');
  
  try {
    const body: UpdateContentRequest<BaseContent> = await c.req.json();
    
    // TODO: Implement actual data update
    // For now, create a mock updated content item
    const updatedContent: Partial<BaseContent> = {
      uuid,
      contentType: type,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system', // TODO: Get from auth context
      version: 2, // TODO: Increment actual version
      data: body.data
    };
    
    const response: ApiResponse<Partial<BaseContent>> = {
      success: true,
      data: updatedContent,
      timestamp: new Date().toISOString()
    };
    
    return c.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid JSON body',
      timestamp: new Date().toISOString()
    };
    return c.json(response, 400);
  }
});

// Soft delete content item
api.delete('/content/:type/:uuid', validateContentType, async (c) => {
  const type = c.req.param('type') as ContentType;
  const uuid = c.req.param('uuid');
  
  // TODO: Implement actual soft delete
  const deletedContent: Partial<BaseContent> = {
    uuid,
    contentType: type,
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: 'system' // TODO: Get from auth context
  };
  
  const response: ApiResponse<Partial<BaseContent>> = {
    success: true,
    data: deletedContent,
    timestamp: new Date().toISOString()
  };
  
  return c.json(response);
});

export default api;