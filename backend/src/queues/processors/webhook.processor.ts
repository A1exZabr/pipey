import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Optional } from '@nestjs/common';
import { Job } from 'bullmq';
import * as Sentry from '@sentry/nestjs';
import { PrismaService } from '../../prisma/prisma.service';
import { MetricsService } from '../../common/metrics/metrics.service';
import { PushService } from '../../push/push.service';

interface WebhookJobData {
  channelId: string;
  channelType: 'telegram' | 'max' | 'avito';
  payload: any;
}

@Processor('webhook-processing', { concurrency: 5 })
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private prisma: PrismaService,
    private metricsService: MetricsService,
    @Optional() private pushService?: PushService,
  ) {
    super();
  }

  async process(job: Job<WebhookJobData>): Promise<void> {
    const { channelId, channelType, payload } = job.data;
    this.logger.log(`Processing ${channelType} webhook for channel ${channelId} (job ${job.id})`);
    const startTime = Date.now();

    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel || channel.status === 'INACTIVE') {
      this.logger.warn(`Channel ${channelId} not found or inactive, skipping`);
      return;
    }

    try {
      switch (channelType) {
        case 'telegram':
          await this.processTelegram(channel, payload);
          break;
        case 'max':
          await this.processMax(channel, payload);
          break;
        case 'avito':
          await this.processAvito(channel, payload);
          break;
        default:
          this.logger.error(`Unknown channel type: ${channelType}`);
      }

      if (channel.status === 'ERROR') {
        await this.prisma.channel.update({
          where: { id: channel.id },
          data: { status: 'ACTIVE', lastError: null },
        });
      }

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.queueJobDuration.observe(
        { queue: 'webhook-processing', status: 'completed' },
        duration,
      );
      this.metricsService.messagesProcessedTotal.inc({
        direction: 'in',
        channel_type: channelType,
      });

      // Send push notification for new inbound message
      if (this.pushService) {
        this.pushService.sendToOrg(channel.orgId, {
          title: `New message (${channelType})`,
          body: 'You have a new conversation',
          url: '/inbox',
        }).catch(() => {/* non-critical */});
      }
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.queueJobDuration.observe(
        { queue: 'webhook-processing', status: 'failed' },
        duration,
      );
      this.metricsService.channelErrorsTotal.inc({
        channel_type: channelType,
        error_type: error.constructor?.name || 'UnknownError',
      });
      Sentry.captureException(error, {
        tags: { channelType, channelId },
        extra: { jobId: job.id },
      });

      await this.prisma.channel.update({
        where: { id: channel.id },
        data: { status: 'ERROR', lastError: error.message },
      });
      throw error;
    }
  }

  private async processTelegram(channel: any, update: any): Promise<void> {
    if (!update.message) return;

    const message = update.message;
    const chatId = String(message.chat.id);
    const messageId = String(message.message_id);
    const senderId = message.from ? String(message.from.id) : null;
    const senderName = message.from
      ? [message.from.first_name, message.from.last_name].filter(Boolean).join(' ')
      : null;
    const senderUsername = message.from?.username;

    let conversation = await this.prisma.conversation.findFirst({
      where: { channelId: channel.id, externalChatId: chatId },
    });

    if (!conversation) {
      const title = message.chat.title || senderName || senderUsername || chatId;
      conversation = await this.prisma.conversation.create({
        data: {
          channelId: channel.id,
          orgId: channel.orgId,
          externalChatId: chatId,
          title,
          unreadCount: 1,
          lastMessageAt: new Date(message.date * 1000),
        },
      });
    }

    const existing = await this.prisma.message.findFirst({
      where: { conversationId: conversation.id, externalMessageId: messageId },
    });
    if (existing) return;

    const attachments: any[] = [];
    if (message.photo?.length > 0) {
      const photo = message.photo[message.photo.length - 1];
      attachments.push({ type: 'photo', fileId: photo.file_id, width: photo.width, height: photo.height });
    }
    if (message.document) {
      attachments.push({ type: 'document', fileId: message.document.file_id, fileName: message.document.file_name, mimeType: message.document.mime_type });
    }
    if (message.voice) {
      attachments.push({ type: 'voice', fileId: message.voice.file_id, duration: message.voice.duration });
    }
    if (message.video) {
      attachments.push({ type: 'video', fileId: message.video.file_id, duration: message.video.duration });
    }

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        externalMessageId: messageId,
        direction: 'IN',
        authorExternalId: senderId,
        text: message.text || message.caption || null,
        attachments: attachments.length > 0 ? attachments : [],
        createdAt: new Date(message.date * 1000),
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(message.date * 1000),
        unreadCount: { increment: 1 },
        ...(conversation.title === chatId && senderName ? { title: senderName } : {}),
      },
    });

    if (senderUsername || senderName) {
      await this.tryLinkContact(conversation.id, channel.orgId, senderId, senderUsername, senderName);
    }
  }

  private async processMax(channel: any, payload: any): Promise<void> {
    this.logger.log(`MAX webhook processing for channel ${channel.id}`);
    // TODO: Move existing MaxController logic here in next iteration
  }

  private async processAvito(channel: any, payload: any): Promise<void> {
    this.logger.log(`Avito webhook processing for channel ${channel.id}`);
    // TODO: Move existing AvitoController logic here in next iteration
  }

  private async tryLinkContact(
    conversationId: string,
    orgId: string,
    telegramId: string | null,
    telegramUsername: string | null,
    name: string | null,
  ): Promise<void> {
    const existingLink = await this.prisma.conversationContact.findFirst({
      where: { conversationId },
    });
    if (existingLink) return;

    let contact = null;
    if (telegramUsername) {
      contact = await this.prisma.contact.findFirst({
        where: { orgId, notes: { contains: telegramUsername, mode: 'insensitive' } },
      });
    }
    if (!contact && name) {
      contact = await this.prisma.contact.findFirst({
        where: { orgId, name: { equals: name, mode: 'insensitive' } },
      });
    }
    if (contact) {
      await this.prisma.conversationContact.create({
        data: { conversationId, contactId: contact.id },
      });
    }
  }
}
