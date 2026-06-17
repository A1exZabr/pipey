// Sentry/GlitchTip: only load if DSN is configured
if (process.env.SENTRY_DSN) {
  require('./instrument');
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { WinstonLoggerService } from './common/logger/winston-logger.service';

async function bootstrap() {
  const logger = new WinstonLoggerService();
  const app = await NestFactory.create(AppModule, { logger });

  const configService = app.get(ConfigService);

  // Sentry global exception filter (only when DSN is set)
  if (process.env.SENTRY_DSN) {
    const { SentryGlobalFilter } = require('@sentry/nestjs/setup');
    app.useGlobalFilters(new SentryGlobalFilter());
  }

  app.enableCors({
    origin: configService.get('FRONTEND_URL') || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api', {
    exclude: ['metrics'],
  });

  const port = configService.get('PORT') || 3001;
  await app.listen(port);

  logger.log(`Backend is running on: http://localhost:${port}`, 'Bootstrap');
  logger.log(`API endpoint: http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
