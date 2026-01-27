import { Hono } from 'hono';
import { cors } from 'hono/cors';
import api from './routes/api';
import { errorHandler, notFoundHandler } from './middleware/error';

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

// Basic health check endpoint
app.get('/test-ucpa', async c => {
  console.log("AUQI")
  const res = await fetch("https://staging.d216bmulyknrj1.amplifyapp.com/", {
    method: "GET"
  });

  if (!res.ok) {
    const bodyPreview = await res.text().catch(() => "");
    // eslint-disable-next-line no-console
    console.error(
      `[ERROR] HTTP ${res.status} ${res.statusText}\n${bodyPreview.slice(0, 500)}`,
    );
    throw new Error("EXIT")
  }
  console.log("[HEADERS]:", res.headers);
  const contentType = res.headers.get("content-type") ?? "";
  const html = await res.text();
  console.log("contentType: ", contentType)
  console.log("content-encoding:", res.headers.get("content-encoding"));

  // eslint-disable-next-line no-console
  // // eslint-disable-next-line no-console
  // console.log(`[INFO] content-type: ${contentType || "(missing)"}`);
  // // eslint-disable-next-line no-console
  // console.log(`[INFO] bytes: ${Buffer.byteLength(html, "utf8")}`);

  // fs.writeFileSync(join(__dirname, "output", "index.html"), html, "utf8");
  // // eslint-disable-next-line no-console
  // console.log(`[INFO] saved: ${join(__dirname, "output", "index.html")}`);

  return c.json(html);
});


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
