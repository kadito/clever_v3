import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requireAuth, getUserContext, requireUserContext, extractJwtToken, verifyClerkJwt } from '../middleware/clerk';
import { createContentRoutes, createStandardContentConfig, contentErrorHandler } from './content-route-template';
import clientsRouter from './clients';
import licensesRouter from './licenses';
import type { AppContext } from '../types/auth';
import type {
  BaseContent,
  ApiResponse,
  ListResponse,
  ContentType,
  CreateContentRequest,
  UpdateContentRequest,
  UserContext,
} from '@clever/shared';

// Create API router with proper typing
const api = new Hono<AppContext>();

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

// Apply authentication to all API routes except health check
api.use('/*', async (c, next) => {
  // Skip authentication for health check
  if (c.req.path === '/api/health') {
    await next();
    return;
  }
  
  // Extract JWT token from request
  const token = extractJwtToken(c);
  
  if (!token) {
    const response: ApiResponse = {
      success: false,
      error: 'Authentication failed',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 401);
  }

  try {
    const payload = await verifyClerkJwt(token);
    
    // Extract user information from JWT payload
    const userContext: UserContext = {
      userId: payload.sub || '',
      email: '', // Email not available in session JWT, would need separate API call
      firstName: '', // Name not available in session JWT
      lastName: '', // Name not available in session JWT
      userType: (payload.o?.rol === 'admin' ? 'Admin' : 'User') as 'Admin' | 'User',
      sessionId: payload.sid || '',
      isAuthenticated: true,
    };

    // Make user context available to route handlers
    c.set('user', userContext);
    
    await next();
  } catch (error) {
    console.error('Error extracting user context:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Authentication failed',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 401);
  }
});

// Mount content-specific routes using the generic template
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.6, 10.1, 10.4

// Clients route with alphabetical sorting and custom validation
api.route('/content/clients', clientsRouter);

// Licenses route with date-based sorting and custom validation
api.route('/content/licenses', licensesRouter);

// Generic routes for other content types using standard configuration
const contractsRouter = createContentRoutes<BaseContent>(
  createStandardContentConfig('contracts', 'date-desc')
);
api.route('/content/contracts', contractsRouter);

const workSheetsRouter = createContentRoutes<BaseContent>(
  createStandardContentConfig('work-sheets', 'date-desc')
);
api.route('/content/work-sheets', workSheetsRouter);

const dailyRecordsRouter = createContentRoutes<BaseContent>(
  createStandardContentConfig('daily-records', 'date-desc')
);
api.route('/content/daily-records', dailyRecordsRouter);

const remoteAssistanceRouter = createContentRoutes<BaseContent>(
  createStandardContentConfig('remote-assistance', 'date-desc')
);
api.route('/content/remote-assistance', remoteAssistanceRouter);

const remindersRouter = createContentRoutes<BaseContent>(
  createStandardContentConfig('reminders', 'date-desc')
);
api.route('/content/reminders', remindersRouter);

const pendingRouter = createContentRoutes<BaseContent>(
  createStandardContentConfig('pending', 'date-desc')
);
api.route('/content/pending', pendingRouter);

// User profile endpoints - protected
// Requirements: 5.4 - Protect all API endpoints except health checks

// Get current user profile
api.get('/user/profile', async c => {
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
api.put('/user/preferences', async c => {
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
