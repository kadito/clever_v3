---
inclusion: fileMatch
fileMatchPattern: ["**/permissions*", "**/usePermissions*", "**/middleware/permissions*"]
---

# User Permissions Patterns

## Overview

The CLEVER dashboard implements role-based access control (RBAC) using Clerk authentication with two user roles: Admin (full access) and User/Employee (restricted access). This document establishes the patterns and standards for implementing permission checks throughout the application.

## Core Principles

### Shared Permission Logic

- All permission logic resides in `@clever/shared/permissions.ts`
- Both frontend and backend use the same permission functions
- Ensures consistency between UI restrictions and API enforcement
- Pure functions with no side effects for predictable behavior

### Fail Closed Security Model

- When userType is unavailable or null, deny all permissions
- When authentication fails, default to most restrictive permissions
- When errors occur during permission checks, deny access
- Never assume permissions - always verify explicitly

### Defense in Depth

- Frontend hides UI elements based on permissions (UX layer)
- Backend enforces permissions at API level (security layer)
- Both layers use identical permission logic from shared package
- Frontend restrictions improve UX, backend restrictions ensure security

## Permission Types

### Current Permissions

**Delete Operations:**
- Only Admin users can delete content
- Applies to all content types uniformly
- Protected at both UI and API levels

**Audit Trail Viewing:**
- Only Admin users can view Histórico sections
- Applies to all content types uniformly
- Protected at UI level only (no API endpoint for audit trail)

### Future Extensibility

The permission system is designed to easily add new permissions:
- Add new permission check functions to shared package
- Update `Permissions` interface with new flags
- Implement checks in frontend composable and backend middleware
- Apply to relevant UI components and API endpoints

## Implementation Patterns

### Shared Package Pattern

```typescript
// packages/shared/src/permissions.ts

export type UserType = 'Admin' | 'User' | null;

export interface Permissions {
  canDelete: boolean;
  canViewAuditTrail: boolean;
  // Future permissions added here
}

// Pure function - no side effects
export function canDelete(userType: UserType): boolean {
  return userType === 'Admin';
}

// Get all permissions at once
export function getPermissions(userType: UserType): Permissions {
  const admin = userType === 'Admin';
  
  return {
    canDelete: admin,
    canViewAuditTrail: admin,
  };
}
```

**Key Principles:**
- Pure functions for testability and predictability
- Type-safe with TypeScript
- Deny by default (null userType = no permissions)
- Simple boolean logic
- Centralized in shared package

### Frontend Composable Pattern

```typescript
// packages/frontend/src/composables/usePermissions.ts

import { computed } from 'vue';
import { useAuth } from './useAuth';
import { getPermissions, type UserType, type Permissions } from '@clever/shared';

export function usePermissions() {
  const { user, isAuthenticated } = useAuth();
  
  // Extract userType from authenticated user
  const userType = computed<UserType>(() => {
    if (!isAuthenticated.value || !user.value) {
      return null;
    }
    return user.value.userType || null;
  });
  
  // Compute all permissions using shared utility
  const permissions = computed<Permissions>(() => {
    return getPermissions(userType.value);
  });
  
  return {
    userType,
    permissions,
    isAuthenticated,
  };
}
```

**Key Principles:**
- Thin wrapper around shared utilities
- Reactive computed properties for Vue integration
- Automatic updates when authentication state changes
- No additional API calls required
- Leverages existing useAuth composable

### Backend Middleware Pattern

```typescript
// packages/backend/src/middleware/permissions.ts

import { Context, Next } from 'hono';
import { canDelete, type UserType } from '@clever/shared';

export async function requireDeletePermission(c: Context, next: Next): Promise<Response | void> {
  const userContext = c.get('userContext');
  
  if (!userContext) {
    return c.json({ error: 'Não autenticado' }, 401);
  }
  
  const userType: UserType = userContext.userType || null;
  
  if (!canDelete(userType)) {
    console.warn('Delete permission denied:', JSON.stringify({
      userId: userContext.userId,
      userType: userType,
      path: c.req.path,
    }, null, 2));
    
    return c.json(
      { error: 'Não tem permissão para eliminar conteúdo' },
      403
    );
  }
  
  await next();
}
```

**Key Principles:**
- Uses Hono middleware pattern
- Leverages shared permission functions
- Returns 403 Forbidden for denied permissions
- Logs permission denials for security auditing
- Portuguese error messages for consistency
- Runs after authentication middleware

### Component Integration Pattern

**Delete Button Visibility:**

```vue
<script setup lang="ts">
import { usePermissions } from '@/composables/usePermissions';

const { permissions } = usePermissions();

const shouldShowDeleteButton = computed(() => {
  return props.showDeleteButton && permissions.value.canDelete;
});
</script>

<template>
  <button v-if="shouldShowDeleteButton" @click="handleDelete">
    Eliminar
  </button>
</template>
```

**Audit Trail Section Visibility:**

```vue
<script setup lang="ts">
import { usePermissions } from '@/composables/usePermissions';

const { permissions } = usePermissions();
</script>

<template>
  <section v-if="permissions.canViewAuditTrail" class="detail-section">
    <h3 class="section-title">Histórico</h3>
    <!-- Audit trail content -->
  </section>
</template>
```

**Key Principles:**
- Use v-if to completely remove elements from DOM
- Combine with existing props for backward compatibility
- Apply consistently across all content types
- No visual artifacts when elements are hidden
- Reactive updates when authentication changes

## Error Handling Standards

### Authentication Errors

```typescript
const userType = computed(() => {
  try {
    if (!isAuthenticated.value || !user.value) {
      return null;
    }
    return user.value.userType || null;
  } catch (error) {
    console.error('Error getting user type:', error);
    return null; // Fail closed
  }
});
```

**Principles:**
- Catch errors in computed properties
- Default to null userType (deny all)
- Log errors for debugging
- Don't show permission errors to users
- Allow UI to render with restricted access

### Missing UserType Field

```typescript
const permissions = computed<Permissions>(() => {
  if (!userType.value) {
    console.warn('UserType not available, denying all permissions');
    return {
      canDelete: false,
      canViewAuditTrail: false,
    };
  }
  
  return getPermissions(userType.value);
});
```

**Principles:**
- Warn when userType is missing
- Deny all permissions by default
- Don't break UI rendering
- Provide clear debugging information

### Backend Permission Denials

```typescript
if (!canDelete(userType)) {
  console.warn('Delete permission denied:', JSON.stringify({
    userId: userContext.userId,
    userType: userType,
    path: c.req.path,
  }, null, 2));
  
  return c.json(
    { error: 'Não tem permissão para eliminar conteúdo' },
    403
  );
}
```

**Principles:**
- Log all permission denials
- Include user and request context
- Return 403 Forbidden status
- Use Portuguese error messages
- Provide security audit trail

## Testing Standards

### Property-Based Testing

All permission features must include property-based tests:

```typescript
// Property 1: Admin Full Access
test('Admin users have full access', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        userType: fc.constant('Admin' as const),
        userId: fc.uuid(),
      }),
      async (adminUser) => {
        const permissions = getPermissions(adminUser.userType);
        expect(permissions.canDelete).toBe(true);
        expect(permissions.canViewAuditTrail).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Requirements:**
- Minimum 100 iterations per property test
- Use fast-check library for TypeScript
- Tag tests with feature name and property number
- Reference design document properties
- Test universal correctness properties

### Unit Testing

Complement property tests with specific scenarios:

```typescript
test('User role cannot delete content', () => {
  const permissions = getPermissions('User');
  expect(permissions.canDelete).toBe(false);
});

test('Null userType denies all permissions', () => {
  const permissions = getPermissions(null);
  expect(permissions.canDelete).toBe(false);
  expect(permissions.canViewAuditTrail).toBe(false);
});
```

**Requirements:**
- Test specific user roles
- Test edge cases (null, undefined)
- Test error handling
- Test component integration
- Test backend middleware

## Performance Considerations

### Frontend Performance

- Permission checks are simple boolean comparisons (< 1ms)
- Use computed properties for automatic caching
- No additional API calls required
- Reactive updates only when authentication changes
- No watchers needed (computed properties handle reactivity)

### Backend Performance

- Middleware runs only on protected endpoints
- Permission checks are simple boolean comparisons
- No database queries required
- Minimal logging overhead
- No impact on unprotected endpoints

## Security Considerations

### Defense in Depth

1. **Frontend Layer**: Hides UI elements based on permissions
2. **Backend Layer**: Enforces permissions at API level
3. **Shared Logic**: Same permission functions in both layers
4. **Audit Trail**: Logs all permission denials

### Fail Closed Principle

- Missing userType → deny all permissions
- Authentication failure → deny all permissions
- Error during check → deny all permissions
- Unknown user role → deny all permissions

### Security Audit Trail

- Log all permission denials in backend
- Include user ID, userType, and request path
- Use structured logging with JSON.stringify
- Monitor for suspicious patterns
- Review logs regularly

## Migration and Rollback

### No Data Migration Required

- Uses existing userType field from Clerk
- No database schema changes
- No R2 storage changes
- No user data migration

### Rollback Strategy

If issues arise:
1. Revert frontend deployment (removes UI restrictions)
2. Revert backend deployment (removes API protection)
3. No data cleanup required
4. Users automatically get previous behavior

### Backward Compatibility

- No breaking changes to existing functionality
- Admin users retain full access
- Components work with or without permission checks
- Existing props and behavior preserved

## Common Pitfalls to Avoid

1. **Don't bypass shared utilities**: Always use functions from @clever/shared
2. **Don't fail open**: Always deny permissions when in doubt
3. **Don't skip backend protection**: Frontend restrictions are not security
4. **Don't forget error handling**: Always catch and handle permission errors
5. **Don't hardcode permissions**: Use shared utilities, not inline checks
6. **Don't skip logging**: Log permission denials for security auditing
7. **Don't forget Portuguese**: Use Portuguese for all user-facing messages
8. **Don't break reactivity**: Use computed properties, not manual updates

## Future Enhancements

### Planned Improvements

- Granular permissions beyond Admin/User
- Content-type specific permissions
- Permission groups and roles
- Dynamic permission loading
- Role management UI
- Enhanced audit logging

### Extension Points

- Add new permission check functions to shared package
- Update Permissions interface with new flags
- Implement in frontend composable
- Add backend middleware for new protected operations
- Apply to relevant UI components

## Related Documentation

- **Authentication**: See `tech.md` for Clerk authentication setup
- **Backend Middleware**: See `architecture.md` for Hono middleware patterns
- **Frontend Composables**: See `form-patterns.md` for composable patterns
- **Error Handling**: See `coding-standards.md` for error handling standards
- **Testing**: See `ownership.md` for testing responsibilities
