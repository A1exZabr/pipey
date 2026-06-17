import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentryModule } from '@sentry/nestjs/setup';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { MetricsModule } from './common/metrics/metrics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ChannelsModule } from './channels/channels.module';
import { ContactsModule } from './contacts/contacts.module';
import { PipelinesModule } from './pipelines/pipelines.module';
import { DealsModule } from './deals/deals.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ArtifactsModule } from './artifacts/artifacts.module';
import { AiModule } from './ai/ai.module';
import { SettingsModule } from './settings/settings.module';
import { BookingModule } from './booking/booking.module';
import { TeamModule } from './team/team.module';
import { QueuesModule } from './queues/queues.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PushModule } from './push/push.module';
import { RedisProvider } from './common/providers/redis.provider';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { AuditLogService } from './common/services/audit-log.service';
import { APP_GUARD } from '@nestjs/core';
import { OrgThrottlerGuard } from './common/guards/org-throttler.guard';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { HealthController } from './common/health/health.controller';

@Module({
  imports: [
    SentryModule.forRoot(),
    // Config with ENV validation
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: require('joi').object({
        DATABASE_URL: require('joi').string().required(),
        REDIS_URL: require('joi').string().default('redis://localhost:6379'),
        JWT_SECRET: require('joi').string().min(16).required(),
        ENCRYPTION_KEY: require('joi').string().length(32).required(),
        PORT: require('joi').number().default(3001),
        NODE_ENV: require('joi').string().valid('development', 'production', 'test').default('development'),
        FRONTEND_URL: require('joi').string().default('http://localhost:3000'),
        BACKEND_URL: require('joi').string().optional(),
        OPENROUTER_API_KEY: require('joi').string().optional().allow(''),
        SENTRY_DSN: require('joi').string().optional().allow(''),
        VAPID_PUBLIC_KEY: require('joi').string().optional().allow(''),
        VAPID_PRIVATE_KEY: require('joi').string().optional().allow(''),
      }),
      validationOptions: { allowUnknown: true },
    }),
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
    ]),
    ScheduleModule.forRoot(),
    MetricsModule,
    // App modules
    PrismaModule,
    QueuesModule,
    AuthModule,
    ChannelsModule,
    ContactsModule,
    PipelinesModule,
    DealsModule,
    ConversationsModule,
    ArtifactsModule,
    AiModule,
    SettingsModule,
    BookingModule,
    TeamModule,
    AnalyticsModule,
    PushModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    RedisProvider,
    AuditLogService,
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    { provide: APP_GUARD, useClass: OrgThrottlerGuard },
  ],
  exports: [RedisProvider],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
