import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  requireAuth,
  getUserContext,
  requireUserContext,
  extractJwtToken,
  verifyClerkJwt,
} from '../middleware/clerk';
import {
  createContentRoutes,
  createStandardContentConfig,
  contentErrorHandler,
} from './content-route-template';
import clientsRouter from './clients';
import licensesRouter from './licenses';
import contractsRouter from './contracts';
import workSheetsRouter from './work-sheets';
import remoteAssistanceRouter from './remote-assistance';
import dailyRecordsRouter from './daily-records';
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
import {
  validateContractCreation,
  validateContractUpdate,
  validateWorkSheetCreation,
  validateWorkSheetUpdate,
  validateRemoteAssistanceCreation,
  validateRemoteAssistanceUpdate,
  validateDailyRecordCreation,
  validateDailyRecordUpdate,
  // Note: Reminders and pending items validation functions
  // will be added when those content types are implemented
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
      firstName: payload.firstName || '', // Extract firstName from token payload
      lastName: payload.lastName || '', // Extract lastName from token payload
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

// Contracts route with date-based sorting and custom validation
api.route('/content/contracts', contractsRouter);

// Work Sheets route with date-based sorting and custom validation
api.route('/content/work-sheets', workSheetsRouter);

// Remote Assistance route with date-based sorting and custom validation
api.route('/content/remote-assistance', remoteAssistanceRouter);

// Daily Records route with date-based sorting and custom validation
api.route('/content/daily-records', dailyRecordsRouter);

// Generic routes for other content types using standard configuration with relation validation


const remindersConfig = createStandardContentConfig('reminders', 'date-desc');
// TODO: Implement reminders validation when the content type is fully implemented
// remindersConfig.validateCreate = (data: any) => {
//   const errors = validateReminderCreation(data.data || data);
//   if (errors.length > 0) throw new Error(errors[0]);
// };
// remindersConfig.validateUpdate = (data: any) => {
//   const errors = validateReminderUpdate(data.data || data);
//   if (errors.length > 0) throw new Error(errors[0]);
// };
const remindersRouter = createContentRoutes<BaseContent>(remindersConfig);
api.route('/content/reminders', remindersRouter);

const pendingConfig = createStandardContentConfig('pending', 'date-desc');
// TODO: Implement pending items validation when the content type is fully implemented
// pendingConfig.validateCreate = (data: any) => {
//   const errors = validatePendingCreation(data.data || data);
//   if (errors.length > 0) throw new Error(errors[0]);
// };
// pendingConfig.validateUpdate = (data: any) => {
//   const errors = validatePendingUpdate(data.data || data);
//   if (errors.length > 0) throw new Error(errors[0]);
// };
const pendingRouter = createContentRoutes<BaseContent>(pendingConfig);
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
