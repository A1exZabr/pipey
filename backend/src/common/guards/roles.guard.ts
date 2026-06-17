import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]) => {
  return (target: any, key?: string, descriptor?: any) => {
    Reflect.defineMetadata(ROLES_KEY, roles, descriptor?.value ?? target);
    return descriptor ?? target;
  };
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.organizations || user.organizations.length === 0) {
      throw new ForbiddenException('No organization access');
    }

    // Get user's role in the first organization
    const userRole = user.organizations[0]?.role;

    if (!userRole) {
      throw new ForbiddenException('No role assigned');
    }

    // Role hierarchy: OWNER > ADMIN > MEMBER
    const roleHierarchy: Record<string, number> = {
      OWNER: 3,
      ADMIN: 2,
      MEMBER: 1,
    };

    const userRoleLevel = roleHierarchy[userRole] || 0;
    const requiredRoleLevel = Math.min(...requiredRoles.map(r => roleHierarchy[r] || 0));

    if (userRoleLevel < requiredRoleLevel) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
