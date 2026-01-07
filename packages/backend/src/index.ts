import { Hono } from 'hono';
import api from './routes/api';
import { errorHandler, notFoundHandler } from './middleware/error';

// Environment interface for Cloudflare Workers
type Bindings = {
  ASSETS: Fetcher;
};

// Create Hono app instance with proper typing
const app = new Hono<{ Bindings: Bindings }>();

// Global error handler
app.onError(errorHandler);

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
  return c.env.ASSETS.fetch(c.req.raw);
});

// Export the Hono app as default
export default app;
