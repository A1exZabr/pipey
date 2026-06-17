import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebhookProcessor } from './processors/webhook.processor';
import { MessageProcessor } from './processors/message.processor';
import { PdfProcessor } from './processors/pdf.processor';
import { AiProcessor } from './processors/ai.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { ChannelsModule } from '../channels/channels.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get('REDIS_URL', 'redis://localhost:6379');
        const url = new URL(redisUrl);
        return {
          connection: {
            host: url.hostname,
            port: parseInt(url.port || '6379'),
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: 'webhook-processing' },
      { name: 'message-sending' },
      { name: 'pdf-generation' },
      { name: 'ai-generation' },
      { name: 'failed-jobs' },
    ),
    PrismaModule,
    ChannelsModule,
  ],
  providers: [WebhookProcessor, MessageProcessor, PdfProcessor, AiProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
