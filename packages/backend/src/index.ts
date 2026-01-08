import { Hono } from 'hono';
import { cors } from 'hono/cors';
import api from './routes/api';
import { errorHandler, notFoundHandler } from './middleware/error';

// Create Hono app instance with basic typing
const app = new Hono();

// Global error handler
app.onError(errorHandler);

// CORS middleware - apply only to API routes
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'http://localhost:8787', 'https://*.clerk.accounts.dev', 'https://clerk.accounts.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

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

// Static assets middleware - serve everything else through ASSETS binding
app.use('*', async c => {
  // Pass the request to the ASSETS binding
  const assets = c.env?.ASSETS as Fetcher;
  if (assets) {
    return assets.fetch(c.req.raw);
  }
  return c.text('Assets not available', 500);
});

// Export the Hono app as default
export default app;
