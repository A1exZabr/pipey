import { Controller, Get, Inject } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../../prisma/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../providers/redis.provider';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    private prisma: PrismaService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  @Get()
  async check() {
    let dbStatus = 'connected';
    let redisStatus = 'connected';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    try {
      await this.redis.ping();
    } catch {
      redisStatus = 'error';
    }

    const status = dbStatus === 'connected' && redisStatus === 'connected' ? 'ok' : 'degraded';

    return {
      status,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.7.0',
      db: dbStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    };
  }
}
