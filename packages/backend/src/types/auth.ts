/**
 * Authentication types for Clerk integration
 */

import type { UserContext, AuthenticatedContext } from '@clever/shared';

// Re-export shared types for convenience
export type { UserContext, AuthenticatedContext };

/**
 * Environment bindings for Cloudflare Workers with Clerk configuration
 */
export interface ClerkBindings {
  ASSETS: Fetcher;
  CONTENT: R2Bucket;
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
  [key: string]: any; // Index signature for Hono compatibility
}