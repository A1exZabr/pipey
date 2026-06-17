import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from '../../channels/telegram/telegram.service';
import { MaxService } from '../../channels/max/max.service';
import { AvitoService } from '../../channels/avito/avito.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { MetricsService } from '../../common/metrics/metrics.service';

interface SendMessageJobData {
  conversationId: string;
  text: string;
  attachments?: any[];
}

@Processor('message-sending', { concurrency: 3 })
export class MessageProcessor extends WorkerHost {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
    private maxService: MaxService,
    private avitoService: AvitoService,
    private encryption: EncryptionService,
    private metricsService: MetricsService,
  ) {
    super();
  }

  async process(job: Job<SendMessageJobData>): Promise<void> {
    const { conversationId, text, attachments } = job.data;
    const startTime = Date.now();

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { channel: true },
    });

    if (!conversation) {
      this.logger.error(`Conversation ${conversationId} not found`);
      return;
    }

    const channel = conversation.channel;
    const channelType = channel.type.toLowerCase();
    const credentials = JSON.parse(this.encryption.decrypt(channel.credentialsEncrypted));

    try {
      let externalMessageId: string | null = null;

      switch (channel.type) {
        case 'TELEGRAM':
          const tgResult = await this.telegramService.sendMessage(
            credentials.botToken,
            Number(conversation.externalChatId),
            text,
          );
          externalMessageId = String(tgResult?.result?.message_id || Date.now());
          break;
        case 'MAX':
          const maxResult = await this.maxService.sendMessage(
            credentials.accessToken,
            conversation.externalChatId,
            text,
          );
          externalMessageId = String(maxResult?.message?.body?.mid || Date.now());
          break;
        case 'AVITO':
          await this.avitoService.sendMessage(
            credentials.accessToken,
            credentials.userId,
            conversation.externalChatId,
            text,
          );
          externalMessageId = String(Date.now());
          break;
      }

      await this.prisma.message.create({
        data: {
          conversationId,
          externalMessageId: externalMessageId || String(Date.now()),
          direction: 'OUT',
          text,
          attachments: attachments || [],
        },
      });

      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      if (channel.status === 'ERROR') {
        await this.prisma.channel.update({
          where: { id: channel.id },
          data: { status: 'ACTIVE', lastError: null },
        });
      }

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.queueJobDuration.observe(
        { queue: 'message-sending', status: 'completed' },
        duration,
      );
      this.metricsService.messagesProcessedTotal.inc({
        direction: 'out',
        channel_type: channelType,
      });

      this.logger.log(`Message sent to ${channel.type} conversation ${conversationId}`);
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.queueJobDuration.observe(
        { queue: 'message-sending', status: 'failed' },
        duration,
      );

      await this.prisma.channel.update({
        where: { id: channel.id },
        data: { status: 'ERROR', lastError: error.message },
      });
      throw error;
    }
  }
}
