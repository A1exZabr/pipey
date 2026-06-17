import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';
import { Request, Response } from 'express';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = httpContext.getResponse<Response>();
          this.recordDuration(request, response.statusCode, startTime);
        },
        error: (error) => {
          const statusCode = error.status || error.statusCode || 500;
          this.recordDuration(request, statusCode, startTime);
        },
      }),
    );
  }

  private recordDuration(
    request: Request,
    statusCode: number,
    startTime: number,
  ) {
    const duration = (Date.now() - startTime) / 1000;
    // Normalize route to avoid high-cardinality labels
    const route = this.normalizeRoute(request.route?.path || request.path);

    this.metricsService.httpRequestDuration.observe(
      {
        method: request.method,
        route,
        status_code: String(statusCode),
      },
      duration,
    );
  }

  private normalizeRoute(path: string): string {
    // Replace dynamic segments like UUIDs and IDs with :id
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/c[a-z0-9]{24}/gi, '/:id') // cuid
      .replace(/\/\d+/g, '/:id');
  }
}
