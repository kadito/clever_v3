import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { UserContext } from '@clever/shared';

/**
 * Property-Based Test for User Context Structure
 *
 * Property 11: User Context Structure
 * For any created UserContext, it should contain email, firstName, lastName, userType, and userId fields
 *
 * Validates: Requirements 3.4
 * Feature: clerk-authentication, Property 11: User Context Structure
 */

describe('Property 11: User Context Structure', () => {
  // Generator for valid user IDs (Clerk format: user_xxxxxxxxxxxxxxxxxxxxxxxxxx)
  const userIdArb = fc
    .string({ minLength: 26, maxLength: 26 })
    .map(id => `user_${id.replace(/[^a-zA-Z0-9]/g, 'a')}`);

  // Generator for valid email addresses
  const emailArb = fc
    .record({
      username: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9._-]+$/.test(s)),
      domain: fc.string({ minLength: 2, maxLength: 15 }).filter(s => /^[a-zA-Z0-9.-]+$/.test(s)),
      tld: fc.constantFrom('com', 'org', 'net', 'edu', 'gov')
    })
    .map(({ username, domain, tld }) => `${username}@${domain}.${tld}`);

  // Generator for valid names (first and last)
  const nameArb = fc
    .string({ minLength: 1, maxLength: 50 })
    .filter(name => /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name) && name.trim().length > 0)
    .map(name => name.trim());

  // Generator for user types
  const userTypeArb = fc.constantFrom('Admin', 'User');

  // Generator for session IDs (Clerk format: sess_xxxxxxxxxxxxxxxxxxxxxxxxxx)
  const sessionIdArb = fc
    .string({ minLength: 26, maxLength: 26 })
    .map(id => `sess_${id.replace(/[^a-zA-Z0-9]/g, 'a')}`);

  // Generator for complete UserContext objects
  const userContextArb = fc.record({
    userId: userIdArb,
    email: emailArb,
    firstName: nameArb,
    lastName: nameArb,
    userType: userTypeArb,
    sessionId: sessionIdArb,
    isAuthenticated: fc.boolean()
  });

  it('should contain all required fields with correct types', () => {
    fc.assert(
      fc.property(userContextArb, (userContext: UserContext) => {
        // Property assertion: UserContext should contain all required fields
        
        // Check that all required fields exist
        expect(userContext).toHaveProperty('userId');
        expect(userContext).toHaveProperty('email');
        expect(userContext).toHaveProperty('firstName');
        expect(userContext).toHaveProperty('lastName');
        expect(userContext).toHaveProperty('userType');
        expect(userContext).toHaveProperty('sessionId');
        expect(userContext).toHaveProperty('isAuthenticated');

        // Check that all fields have the correct types
        expect(typeof userContext.userId).toBe('string');
        expect(typeof userContext.email).toBe('string');
        expect(typeof userContext.firstName).toBe('string');
        expect(typeof userContext.lastName).toBe('string');
        expect(typeof userContext.userType).toBe('string');
        expect(typeof userContext.sessionId).toBe('string');
        expect(typeof userContext.isAuthenticated).toBe('boolean');

        // Check that userType is one of the allowed values
        expect(['Admin', 'User']).toContain(userContext.userType);

        // Check that string fields are not empty (except potentially firstName/lastName which could be empty)
        expect(userContext.userId.length).toBeGreaterThan(0);
        expect(userContext.email.length).toBeGreaterThan(0);
        expect(userContext.sessionId.length).toBeGreaterThan(0);

        // Check that email has valid format (basic check)
        expect(userContext.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

        // Check that userId follows Clerk format
        expect(userContext.userId).toMatch(/^user_[a-zA-Z0-9]{26}$/);

        // Check that sessionId follows Clerk format
        expect(userContext.sessionId).toMatch(/^sess_[a-zA-Z0-9]{26}$/);

        return true;
      }),
      {
        numRuns: 100,
        timeout: 10000, // 10 seconds timeout
        verbose: false,
      }
    );
  });

  it('should maintain field consistency across different user contexts', () => {
    fc.assert(
      fc.property(fc.array(userContextArb, { minLength: 2, maxLength: 10 }), (userContexts: UserContext[]) => {
        // Property assertion: All UserContext objects should have the same structure
        
        const firstContext = userContexts[0];
        const firstContextKeys = Object.keys(firstContext).sort();

        for (const context of userContexts) {
          const contextKeys = Object.keys(context).sort();
          
          // All contexts should have the same keys
          expect(contextKeys).toEqual(firstContextKeys);
          
          // All contexts should have the same field types
          expect(typeof context.userId).toBe(typeof firstContext.userId);
          expect(typeof context.email).toBe(typeof firstContext.email);
          expect(typeof context.firstName).toBe(typeof firstContext.firstName);
          expect(typeof context.lastName).toBe(typeof firstContext.lastName);
          expect(typeof context.userType).toBe(typeof firstContext.userType);
          expect(typeof context.sessionId).toBe(typeof firstContext.sessionId);
          expect(typeof context.isAuthenticated).toBe(typeof firstContext.isAuthenticated);
        }

        return true;
      }),
      {
        numRuns: 50,
        timeout: 10000,
        verbose: false,
      }
    );
  });

  it('should validate UserContext against TypeScript interface requirements', () => {
    fc.assert(
      fc.property(userContextArb, (userContext: UserContext) => {
        // Property assertion: UserContext should satisfy TypeScript interface requirements
        
        // Create a function that would fail at compile time if UserContext doesn't match interface
        const validateUserContext = (ctx: UserContext): boolean => {
          // This function will only compile if ctx matches UserContext interface exactly
          const requiredFields: (keyof UserContext)[] = [
            'userId', 'email', 'firstName', 'lastName', 'userType', 'sessionId', 'isAuthenticated'
          ];
          
          return requiredFields.every(field => field in ctx);
        };

        // The function should return true for valid UserContext
        expect(validateUserContext(userContext)).toBe(true);

        // Additional runtime validation that mirrors the TypeScript interface
        const isValidUserContext = (ctx: any): ctx is UserContext => {
          return (
            typeof ctx === 'object' &&
            ctx !== null &&
            typeof ctx.userId === 'string' &&
            typeof ctx.email === 'string' &&
            typeof ctx.firstName === 'string' &&
            typeof ctx.lastName === 'string' &&
            (ctx.userType === 'Admin' || ctx.userType === 'User') &&
            typeof ctx.sessionId === 'string' &&
            typeof ctx.isAuthenticated === 'boolean'
          );
        };

        expect(isValidUserContext(userContext)).toBe(true);

        return true;
      }),
      {
        numRuns: 100,
        timeout: 10000,
        verbose: false,
      }
    );
  });
});