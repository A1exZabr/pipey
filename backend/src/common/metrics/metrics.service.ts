import { Injectable, OnModuleInit, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  public readonly registry: Registry;

  // HTTP metrics
  public readonly httpRequestDuration: Histogram;

  // Queue metrics
  public readonly queueJobDuration: Histogram;
  public readonly queueDepth: Gauge;

  // Channel metrics
  public readonly channelErrorsTotal: Counter;

  // Business metrics
  public readonly activeConversationsTotal: Gauge;
  public readonly messagesProcessedTotal: Counter;

  constructor(
    @Optional() @InjectQueue('webhook-processing') private webhookQueue?: Queue,
    @Optional() @InjectQueue('message-sending') private messageQueue?: Queue,
    @Optional() @InjectQueue('pdf-generation') private pdfQueue?: Queue,
    @Optional() @InjectQueue('ai-generation') private aiQueue?: Queue,
  ) {
    this.registry = new Registry();

    // HTTP request duration histogram
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'] as const,
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    // Queue job duration histogram
    this.queueJobDuration = new Histogram({
      name: 'queue_job_duration_seconds',
      help: 'Duration of queue job processing in seconds',
      labelNames: ['queue', 'status'] as const,
      buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
      registers: [this.registry],
    });

    // Queue depth gauge
    this.queueDepth = new Gauge({
      name: 'queue_depth',
      help: 'Number of jobs waiting in queue',
      labelNames: ['queue'] as const,
      registers: [this.registry],
    });

    // Channel errors counter
    this.channelErrorsTotal = new Counter({
      name: 'channel_errors_total',
      help: 'Total number of channel errors',
      labelNames: ['channel_type', 'error_type'] as const,
      registers: [this.registry],
    });

    // Active conversations gauge
    this.activeConversationsTotal = new Gauge({
      name: 'active_conversations_total',
      help: 'Total number of active conversations',
      registers: [this.registry],
    });

    // Messages processed counter
    this.messagesProcessedTotal = new Counter({
      name: 'messages_processed_total',
      help: 'Total number of messages processed',
      labelNames: ['direction', 'channel_type'] as const,
      registers: [this.registry],
    });
  }

  onModuleInit() {
    // Collect default Node.js metrics (CPU, memory, event loop, GC)
    collectDefaultMetrics({ register: this.registry });
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async collectQueueDepths() {
    const queues = [
      { name: 'webhook-processing', queue: this.webhookQueue },
      { name: 'message-sending', queue: this.messageQueue },
      { name: 'pdf-generation', queue: this.pdfQueue },
      { name: 'ai-generation', queue: this.aiQueue },
    ];

    for (const { name, queue } of queues) {
      if (!queue) continue;
      try {
        const waiting = await queue.getWaitingCount();
        const active = await queue.getActiveCount();
        this.queueDepth.set({ queue: name }, waiting + active);
      } catch {
        // Queue not available -- skip
      }
    }
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
