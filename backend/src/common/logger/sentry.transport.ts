import Transport from 'winston-transport';
import * as Sentry from '@sentry/nestjs';

export class SentryTransport extends Transport {
  constructor(opts?: Transport.TransportStreamOptions) {
    super(opts);
    this.level = 'error';
  }

  log(info: any, callback: () => void) {
    setImmediate(() => this.emit('logged', info));

    const { message, level, trace, context, ...meta } = info;

    if (level === 'error' || level === 'fatal') {
      if (trace) {
        Sentry.captureException(new Error(message), {
          tags: { context: context || 'unknown' },
          extra: { trace, ...meta },
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          tags: { context: context || 'unknown' },
          extra: meta,
        });
      }
    }

    callback();
  }
}
