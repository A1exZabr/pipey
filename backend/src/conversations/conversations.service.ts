import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto, LinkContactDto } from './dto/conversation.dto';
import { TelegramService } from '../channels/telegram/telegram.service';
import { MaxService } from '../channels/max/max.service';
import { AvitoService } from '../channels/avito/avito.service';
import { EncryptionService } from '../common/services/encryption.service';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private prisma: PrismaService,
    private telegram: TelegramService,
    private max: MaxService,
    private avito: AvitoService,
    private encryption: EncryptionService,
  ) {}

  async findAll(orgId: string, options?: { channelId?: string; unreadOnly?: boolean }) {
    const where: any = { orgId };

    if (options?.channelId) {
      where.channelId = options.channelId;
    }

    if (options?.unreadOnly) {
      where.unreadCount = { gt: 0 };
    }

    return this.prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        channel: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        contactLinks: {
          include: {
            contact: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  async findOne(orgId: string, id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        channel: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        contactLinks: {
          include: {
            contact: true,
          },
        },
        aiSuggestions: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    if (conversation.unreadCount > 0) {
      await this.prisma.conversation.update({
        where: { id },
        data: { unreadCount: 0 },
      });
    }

    return conversation;
  }

  async getMessages(orgId: string, conversationId: string, options?: { limit?: number; before?: string }) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    const where: any = { conversationId };

    if (options?.before) {
      const beforeMessage = await this.prisma.message.findUnique({
        where: { id: options.before },
      });
      if (beforeMessage) {
        where.createdAt = { lt: beforeMessage.createdAt };
      }
    }

    return this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
    });
  }

  async sendMessage(orgId: string, conversationId: string, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { channel: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    let externalMessageId = 'local_' + Date.now().toString();

    // Send message to channel
    if (conversation.channel.type === 'TELEGRAM') {
      try {
        const credentials = this.encryption.decrypt(conversation.channel.credentialsEncrypted);
        const chatId = parseInt(conversation.externalChatId, 10);

        const result = await this.telegram.sendMessage(credentials.botToken, chatId, dto.text);
        externalMessageId = String(result.message_id);
        this.logger.log(`Sent Telegram message ${externalMessageId} to chat ${chatId}`);
      } catch (error) {
        this.logger.error(`Failed to send Telegram message: ${error.message}`);
        throw new BadRequestException('Failed to send message to Telegram');
      }
    } else if (conversation.channel.type === 'MAX') {
      try {
        const credentials = this.encryption.decrypt(conversation.channel.credentialsEncrypted);
        const chatId = conversation.externalChatId;

        const result = await this.max.sendMessage(credentials.botToken, chatId, dto.text);
        externalMessageId = String(result.message_id || result.msg_id || Date.now());
        this.logger.log(`Sent MAX message ${externalMessageId} to chat ${chatId}`);
      } catch (error) {
        this.logger.error(`Failed to send MAX message: ${error.message}`);
        throw new BadRequestException('Failed to send message to MAX');
      }
    } else if (conversation.channel.type === 'AVITO') {
      try {
        const credentials = this.encryption.decrypt(conversation.channel.credentialsEncrypted);
        const chatId = conversation.externalChatId;

        // Refresh access token
        const accessToken = await this.avito.getAccessToken(
          credentials.clientId,
          credentials.clientSecret,
        );

        const result = await this.avito.sendMessage(
          accessToken,
          credentials.accountId,
          chatId,
          dto.text,
        );
        externalMessageId = String(result.id || Date.now());
        this.logger.log(`Sent Avito message ${externalMessageId} to chat ${chatId}`);
      } catch (error) {
        this.logger.error(`Failed to send Avito message: ${error.message}`);
        throw new BadRequestException('Failed to send message to Avito');
      }
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        direction: 'OUT',
        text: dto.text,
        attachments: dto.attachments || [],
        externalMessageId,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async linkContact(orgId: string, conversationId: string, dto: LinkContactDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    const contact = await this.prisma.contact.findUnique({
      where: { id: dto.contactId },
    });

    if (!contact || contact.orgId !== orgId) {
      throw new BadRequestException('Invalid contact');
    }

    const existing = await this.prisma.conversationContact.findUnique({
      where: {
        conversationId_contactId: {
          conversationId,
          contactId: dto.contactId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.conversationContact.create({
      data: {
        conversationId,
        contactId: dto.contactId,
      },
      include: {
        contact: true,
      },
    });
  }

  async unlinkContact(orgId: string, conversationId: string, contactId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.conversationContact.delete({
      where: {
        conversationId_contactId: {
          conversationId,
          contactId,
        },
      },
    });

    return { success: true };
  }

  async markAsRead(orgId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });

    return { success: true };
  }
}
