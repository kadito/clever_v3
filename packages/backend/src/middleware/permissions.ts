import { Context, Next } from 'hono';
import { canDelete } from '@clever/shared';
import type { UserType } from '@clever/shared';

/**
 * Middleware to check if user has permission to delete content
 * Expects user context to be set by authentication middleware
 */
export async function requireDeletePermission(c: Context, next: Next): Promise<Response | void> {
  const userContext = c.get('user');
  
  if (!userContext) {
    console.error('Delete permission check: No user context available');
    return c.json(
      { error: 'Não autenticado' },
      401
    );
  }
  
  const userType: UserType | null | undefined = userContext.userType || null;
  
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
  
  // User has permission, continue to delete handler
  await next();
}
