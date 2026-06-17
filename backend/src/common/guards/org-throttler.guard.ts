import { Injectable, CanActivate, ExecutionContext, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../providers/redis.provider';

@Injectable()
export class OrgThrottlerGuard implements CanActivate {
  private orgLimit: number;
  private orgTtl: number;

  constructor(
    @Inject(REDIS_CLIENT) private redis: Redis,
    private configService: ConfigService,
  ) {
    this.orgLimit = parseInt(configService.get('RATE_LIMIT_ORG', '300'));
    this.orgTtl = 60;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // No org context (webhook, auth endpoints) — skip org limiting
    if (!user?.orgId && !user?.organizations?.[0]?.id) {
      return true;
    }

    const orgId = user.orgId || user.organizations[0].id;
    const key = `throttle:org:${orgId}`;
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, this.orgTtl);
    }

    if (current > this.orgLimit) {
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
