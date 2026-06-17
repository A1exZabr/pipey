import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AuditLogService } from '../services/audit-log.service';
import { AUDIT_ACTION_KEY } from '../decorators/auditable.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const action = this.reflector.get<string>(AUDIT_ACTION_KEY, context.getHandler());
    if (!action) return next.handle();

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = user?.orgId || user?.organizations?.[0]?.id || request.query?.orgId;
    const actorUserId = user?.userId || user?.id;

    if (!orgId) return next.handle();

    return next.handle().pipe(
      tap(() => {
        const payload = {
          method: request.method,
          path: request.url,
          body: request.body || {},
          params: request.params || {},
        };
        this.auditLogService.log(orgId, action, payload, actorUserId);
      }),
    );
  }
}
