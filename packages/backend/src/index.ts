import { Hono } from 'hono';
import { cors } from 'hono/cors';
import api from './routes/api';
import { errorHandler, notFoundHandler } from './middleware/error';
import type { StorageBucket } from '@clever/shared';
import { migrateSaldo } from './services/migrate-saldo';

// Create Hono app instance with basic typing
const app = new Hono();

// Global error handler
app.onError(errorHandler);

// CORS middleware - apply only to API routes
app.use(
  '/api/*',
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:8787',
      'https://*.clerk.accounts.dev',
      'https://clerk.accounts.dev',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);

// API routes
app.route('/api', api);

// Basic health check endpoint
app.get('/health', c => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API health check endpoint
app.get('/api/health', c => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dev-only Saldo migration route — wipes and rebuilds all balance data.
// Never registered in production. Protected by X-Admin-Token.
app.post('/admin/migrate-saldo', async c => {
  const env = c.env as { ENVIRONMENT?: string; ADMIN_MIGRATION_TOKEN?: string; R2_BUCKET?: StorageBucket };

  if (env?.ENVIRONMENT === 'production') {
    return c.text('Not Found', 404);
  }

  const token = c.req.header('X-Admin-Token');
  if (!env?.ADMIN_MIGRATION_TOKEN || token !== env.ADMIN_MIGRATION_TOKEN) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const r2Bucket = env?.R2_BUCKET;
  if (!r2Bucket) {
    return c.json({ success: false, error: 'Storage not available' }, 500);
  }

  const report = await migrateSaldo(r2Bucket);
  return c.json({ success: true, data: report, timestamp: new Date().toISOString() });
});

// Static assets middleware with SPA fallback
app.use('*', async c => {
  const assets = c.env?.ASSETS as Fetcher;
  if (!assets) {
    return c.text('Assets not available', 500);
  }

  // Try to fetch the requested asset
  const response = await assets.fetch(c.req.raw);

  // If asset exists, return it
  if (response.status === 200) {
    return response;
  }

  // If asset doesn't exist and it's not an API route, serve index.html for SPA routing
  const url = new URL(c.req.url);
  if (!url.pathname.startsWith('/api/')) {
    // Create a new request for index.html
    const indexRequest = new Request(new URL('/index.html', c.req.url).toString(), {
      method: 'GET',
      headers: c.req.raw.headers,
    });
    return assets.fetch(indexRequest);
  }

  // For API routes that don't exist, return 404
  return c.text('Not Found', 404);
});

// Export the Hono app as default
export default app;
