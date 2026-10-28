# CLEVER Dashboard Deployment Guide

This guide covers the deployment process for the CLEVER Dashboard application to
Cloudflare Workers using the modern static assets binding.

## Prerequisites

1. **Cloudflare Account**: Ensure you have a Cloudflare account with Workers
   enabled
2. **Wrangler CLI**: Install and authenticate Wrangler CLI
   ```bash
   pnpm add -g wrangler
   wrangler login
   ```
3. **KV Namespaces**: Create KV namespaces for application data (not assets)
4. **R2 Buckets**: Create R2 buckets for document storage

## Environment Setup

### 1. Create KV Namespaces (for app data only)

```bash
# Development
wrangler kv:namespace create "APP_DATA" --preview

# Staging
wrangler kv:namespace create "APP_DATA" --env staging

# Production
wrangler kv:namespace create "APP_DATA" --env production
```

### 2. Create R2 Buckets

```bash
# Development
wrangler r2 bucket create clever-documents-dev
wrangler r2 bucket create clever-documents-preview

# Staging
wrangler r2 bucket create clever-documents-staging

# Production
wrangler r2 bucket create clever-documents-prod
```

### 3. Update wrangler.toml

Update the KV namespace IDs and R2 bucket names in `wrangler.toml` with the
actual values from the creation commands above.

## Static Assets

The application uses Cloudflare Workers' modern **static assets binding** which
automatically handles:

- Asset serving from the `packages/frontend/dist` directory
- Proper caching headers
- Compression and optimization
- No manual KV uploads needed!

## Build Process

The build process is now much simpler:

1. **Shared Package**: Compile TypeScript types and utilities
2. **Frontend Package**: Build Vue 3 application with Vite
3. **Backend Package**: Compile Hono API server for Workers
4. **Assets**: Automatically served via assets binding

```bash
# Build all packages
pnpm build

# Build individual packages
pnpm build --filter @clever/shared
pnpm build --filter @clever/frontend
pnpm build --filter @clever/backend
```

## Deployment Commands

### Development Environment

```bash
# Full deployment (build + deploy)
pnpm deploy:dev

# Or step by step:
pnpm build
wrangler deploy --env development
```

### Staging Environment

```bash
# Full deployment
pnpm deploy:staging

# Or step by step:
pnpm build
wrangler deploy --env staging
```

### Production Environment

```bash
# Full deployment
pnpm deploy:prod

# Or step by step:
pnpm build
wrangler deploy --env production
```

## Development Workflow

### Local Development

```bash
# Start development server (both frontend and backend)
pnpm dev

# Start frontend only (for UI development)
pnpm dev --filter @clever/frontend

# Start backend only (for API development)
wrangler dev --config wrangler.dev.toml
```

### Testing Before Deployment

```bash
# Run all tests
pnpm test

# Type checking
pnpm type-check

# Linting and formatting
pnpm check-all
```

## Environment Configuration

### Environment Variables

Each environment can have specific variables configured in `wrangler.toml`:

- `NODE_ENV`: Environment name (development, staging, production)
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

### Bindings

- `ASSETS`: Static frontend assets (automatically handled by assets binding)
- `APP_DATA`: Application data and cache (KV namespace)
- `DOCUMENTS`: Document storage for uploaded files (R2 bucket)

## Monitoring and Debugging

### View Logs

```bash
# View real-time logs
wrangler tail

# View logs for specific environment
wrangler tail --env production
```

### KV Operations (for app data)

```bash
# List KV keys
wrangler kv:key list --binding APP_DATA --env production

# Get specific key
wrangler kv:key get "cache-key" --binding APP_DATA --env production

# Set key
wrangler kv:key put "cache-key" "value" --binding APP_DATA --env production
```

### R2 Operations

```bash
# List R2 objects
wrangler r2 object list clever-documents-prod

# Download object
wrangler r2 object get clever-documents-prod/path/to/file.pdf --file local-file.pdf
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Ensure all dependencies are installed: `pnpm install`
   - Check TypeScript errors: `pnpm type-check`
   - Verify package references are correct

2. **Asset Serving Issues**
   - Verify frontend build completed: check `packages/frontend/dist/`
   - Ensure assets binding is configured in `wrangler.toml`
   - Check that the directory path is correct

3. **Worker Deployment Failures**
   - Check Worker compatibility: review build logs
   - Verify main entry point exists: `packages/backend/dist/index.js`
   - Check for Node.js specific imports in backend code

4. **Runtime Errors**
   - Check Worker logs: `wrangler tail`
   - Verify environment variables are set correctly
   - Ensure KV and R2 bindings are properly configured

### Getting Help

- Check Cloudflare Workers documentation:
  https://developers.cloudflare.com/workers/
- Review static assets binding docs:
  https://developers.cloudflare.com/workers/static-assets/binding/
- Check project logs and build output for specific error messages

## Security Considerations

1. **Environment Separation**: Keep development, staging, and production
   environments completely separate
2. **Access Control**: Use Cloudflare Access or similar for staging environments
3. **Secrets Management**: Use Wrangler secrets for sensitive configuration
4. **CORS Configuration**: Ensure CORS is properly configured for your domains

## Performance Benefits

The modern assets binding provides several advantages:

1. **Automatic Optimization**: Assets are automatically compressed and optimized
2. **Edge Caching**: Static assets are cached at Cloudflare's edge locations
3. **No KV Limits**: No longer constrained by KV storage limits for assets
4. **Simplified Deployment**: No manual asset upload steps required
5. **Better Performance**: Faster asset serving with proper caching headers
