import { Request, Response, NextFunction } from 'express';
import { Role, ROLE_PERMISSIONS, PermissionAction } from '@sethu/shared';

/**
 * Require specific role(s) to access a route.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const userRoles = req.user.roles.map((r) => r.role);
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of: ${allowedRoles.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Require permission for a resource and action according to the RBAC matrix.
 */
export function requirePermission(resource: string, action: PermissionAction) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const userRoles = req.user.roles.map((r) => r.role);

    // Check if any of the user's roles have permission for this resource and action
    const hasPermission = userRoles.some((role) => {
      const permissions = ROLE_PERMISSIONS[role] || [];
      return permissions.some(
        (p) => p.resource === resource && p.actions.includes(action)
      );
    });

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Permission denied for ${action} on ${resource}`,
        },
      });
      return;
    }

    next();
  };
}
