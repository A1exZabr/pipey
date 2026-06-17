import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { SentryTransport } from './sentry.transport';

const isProduction = process.env.NODE_ENV === 'production';

export const winstonConfig: winston.LoggerOptions = {
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProduction
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  ),
  transports: [
    new winston.transports.Console(),
    new (winston.transports as any).DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d',
      maxSize: '50m',
    }),
    new (winston.transports as any).DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      maxSize: '50m',
    }),
    new (winston.transports as any).DailyRotateFile({
      filename: 'logs/integrations-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d',
      maxSize: '50m',
      format: winston.format.combine(
        winston.format((info): any => {
          const ctx = (info as any).context || '';
          const match = ['TelegramService', 'MaxService', 'AvitoService', 'WebhookProcessor', 'MessageProcessor'].some(
            (s) => ctx.includes(s),
          );
          return match ? info : false;
        })(),
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    ...(process.env.SENTRY_DSN
      ? [new SentryTransport({ level: 'error' })]
      : []),
  ],
};
