import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';
import { TelegramService } from './telegram/telegram.service';
import { MaxService } from './max/max.service';
import { AvitoService } from './avito/avito.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private telegram: TelegramService,
    private max: MaxService,
    private avito: AvitoService,
    private config: ConfigService,
  ) {}

  async connectTelegram(user: any, botToken: string) {
    // Get first organization (for MVP, user has one org)
    const orgId = user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('User has no organization');
    }

    // Step 1: Validate bot token first
    let botInfo;
    try {
      botInfo = await this.telegram.getBotInfo(botToken);
    } catch (error) {
      this.logger.error(`Invalid bot token: ${error.message}`);
      throw new BadRequestException('Invalid bot token. Check the token and try again.');
    }

    const botName = botInfo.username ? `@${botInfo.username}` : botInfo.first_name;
    const botId = String(botInfo.id);

    // Encrypt credentials
    const encryptedCreds = this.encryption.encrypt({ botToken, botId });

    // Step 2: Check if this exact bot is already connected (by externalId)
    const existingChannel = await this.prisma.channel.findFirst({
      where: {
        orgId,
        type: 'TELEGRAM',
        externalId: botId,
      },
    });

    let channel;
    if (existingChannel) {
      // Update existing bot connection
      channel = await this.prisma.channel.update({
        where: { id: existingChannel.id },
        data: {
          name: botName,
          credentialsEncrypted: encryptedCreds,
          status: 'ACTIVE',
          lastSyncAt: new Date(),
        },
      });
      this.logger.log(`Updated existing channel ${channel.id} for bot ${botName}`);
    } else {
      // Create new channel (allows multiple bots)
      channel = await this.prisma.channel.create({
        data: {
          orgId,
          type: 'TELEGRAM',
          name: botName,
          externalId: botId,
          status: 'ACTIVE',
          credentialsEncrypted: encryptedCreds,
          lastSyncAt: new Date(),
        },
      });
      this.logger.log(`Created new channel ${channel.id} for bot ${botName}`);
    }

    // Step 3: Try to set webhook (non-blocking - don't fail if this fails)
    const backendUrl = this.config.get('BACKEND_URL');
    let webhookConfigured = false;

    if (!backendUrl) {
      this.logger.warn(
        'BACKEND_URL not configured. Webhook not set. ' +
        'For local development, use ngrok and set BACKEND_URL in .env'
      );
    } else if (backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1')) {
      this.logger.warn(
        `BACKEND_URL is set to localhost (${backendUrl}). ` +
        'Telegram cannot reach localhost. Use ngrok for local development.'
      );
    } else {
      try {
        const webhookUrl = `${backendUrl}/api/channels/telegram/webhook/${channel.id}`;
        await this.telegram.setWebhook(botToken, webhookUrl);
        webhookConfigured = true;
        this.logger.log(`Webhook configured: ${webhookUrl}`);
      } catch (error) {
        this.logger.error(`Failed to set webhook: ${error.message}`);
      }
    }

    return {
      ...channel,
      webhookConfigured,
    };
  }

  async connectMax(user: any, botToken: string) {
    const orgId = user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('User has no organization');
    }

    // Step 1: Validate bot token
    let botInfo;
    try {
      botInfo = await this.max.getBotInfo(botToken);
    } catch (error) {
      this.logger.error(`Invalid MAX bot token: ${error.message}`);
      throw new BadRequestException('Invalid MAX bot token. Check the token and try again.');
    }

    const botName = botInfo.name || botInfo.username || 'MAX Bot';
    const botId = String(botInfo.user_id || botInfo.id);

    // Encrypt credentials
    const encryptedCreds = this.encryption.encrypt({ botToken, botId });

    // Step 2: Check if this exact bot is already connected
    const existingChannel = await this.prisma.channel.findFirst({
      where: {
        orgId,
        type: 'MAX',
        externalId: botId,
      },
    });

    let channel;
    if (existingChannel) {
      channel = await this.prisma.channel.update({
        where: { id: existingChannel.id },
        data: {
          name: botName,
          credentialsEncrypted: encryptedCreds,
          status: 'ACTIVE',
          lastSyncAt: new Date(),
        },
      });
      this.logger.log(`Updated existing MAX channel ${channel.id} for bot ${botName}`);
    } else {
      channel = await this.prisma.channel.create({
        data: {
          orgId,
          type: 'MAX',
          name: botName,
          externalId: botId,
          status: 'ACTIVE',
          credentialsEncrypted: encryptedCreds,
          lastSyncAt: new Date(),
        },
      });
      this.logger.log(`Created new MAX channel ${channel.id} for bot ${botName}`);
    }

    // Step 3: Try to set webhook
    const backendUrl = this.config.get('BACKEND_URL');
    let webhookConfigured = false;

    if (!backendUrl) {
      this.logger.warn('BACKEND_URL not configured. MAX webhook not set.');
    } else if (backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1')) {
      this.logger.warn(`BACKEND_URL is localhost. MAX cannot reach localhost.`);
    } else {
      try {
        const webhookUrl = `${backendUrl}/api/channels/max/webhook/${channel.id}`;
        await this.max.setWebhook(botToken, webhookUrl);
        webhookConfigured = true;
        this.logger.log(`MAX webhook configured: ${webhookUrl}`);
      } catch (error) {
        this.logger.error(`Failed to set MAX webhook: ${error.message}`);
      }
    }

    return {
      ...channel,
      webhookConfigured,
    };
  }

  async connectAvito(user: any, clientId: string, clientSecret: string) {
    const orgId = user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('User has no organization');
    }

    // Step 1: Get access token and validate credentials
    let accessToken: string;
    let accountInfo: any;
    try {
      accessToken = await this.avito.getAccessToken(clientId, clientSecret);
      accountInfo = await this.avito.getAccountInfo(accessToken);
    } catch (error) {
      this.logger.error(`Invalid Avito credentials: ${error.message}`);
      throw new BadRequestException('Invalid Avito credentials. Check the Client ID and Client Secret.');
    }

    const accountName = accountInfo.name || accountInfo.email || 'Avito Account';
    const accountId = String(accountInfo.id);

    // Encrypt credentials (store both client credentials and current access token)
    const encryptedCreds = this.encryption.encrypt({
      clientId,
      clientSecret,
      accessToken,
      accountId,
    });

    // Step 2: Check if this account is already connected
    const existingChannel = await this.prisma.channel.findFirst({
      where: {
        orgId,
        type: 'AVITO',
        externalId: accountId,
      },
    });

    let channel;
    if (existingChannel) {
      channel = await this.prisma.channel.update({
        where: { id: existingChannel.id },
        data: {
          name: accountName,
          credentialsEncrypted: encryptedCreds,
          status: 'ACTIVE',
          lastSyncAt: new Date(),
        },
      });
      this.logger.log(`Updated existing Avito channel ${channel.id} for account ${accountName}`);
    } else {
      channel = await this.prisma.channel.create({
        data: {
          orgId,
          type: 'AVITO',
          name: accountName,
          externalId: accountId,
          status: 'ACTIVE',
          credentialsEncrypted: encryptedCreds,
          lastSyncAt: new Date(),
        },
      });
      this.logger.log(`Created new Avito channel ${channel.id} for account ${accountName}`);
    }

    // Step 3: Try to set webhook
    const backendUrl = this.config.get('BACKEND_URL');
    let webhookConfigured = false;

    if (!backendUrl) {
      this.logger.warn('BACKEND_URL not configured. Avito webhook not set.');
    } else if (backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1')) {
      this.logger.warn(`BACKEND_URL is localhost. Avito cannot reach localhost.`);
    } else {
      try {
        const webhookUrl = `${backendUrl}/api/channels/avito/webhook/${channel.id}`;
        await this.avito.subscribeToWebhook(accessToken, webhookUrl);
        webhookConfigured = true;
        this.logger.log(`Avito webhook configured: ${webhookUrl}`);
      } catch (error) {
        this.logger.error(`Failed to set Avito webhook: ${error.message}`);
      }
    }

    return {
      ...channel,
      webhookConfigured,
    };
  }

  async getChannels(user: any) {
    const orgId = user.organizations[0]?.id;
    if (!orgId) {
      return [];
    }

    return this.prisma.channel.findMany({
      where: { orgId },
      select: {
        id: true,
        type: true,
        name: true,
        status: true,
        externalId: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getChannel(user: any, channelId: string) {
    const orgId = user.organizations[0]?.id;
    if (!orgId) {
      throw new NotFoundException('Channel not found');
    }

    const channel = await this.prisma.channel.findFirst({
      where: {
        id: channelId,
        orgId,
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return {
      id: channel.id,
      type: channel.type,
      name: channel.name,
      status: channel.status,
      externalId: channel.externalId,
      lastSyncAt: channel.lastSyncAt,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
  }

  async findChannelByExternalId(type: string, externalId: string) {
    return this.prisma.channel.findFirst({
      where: {
        type: type as any,
        externalId,
      },
    });
  }

  async findAllTelegramChannels() {
    return this.prisma.channel.findMany({
      where: {
        type: 'TELEGRAM',
        status: 'ACTIVE',
      },
    });
  }

  async getChannelCredentials(channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return this.encryption.decrypt(channel.credentialsEncrypted);
  }

  async deleteChannel(user: any, channelId: string) {
    const orgId = user.organizations[0]?.id;
    if (!orgId) {
      throw new NotFoundException('Channel not found');
    }

    const channel = await this.prisma.channel.findFirst({
      where: {
        id: channelId,
        orgId,
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Remove webhook for channels
    try {
      const credentials = this.encryption.decrypt(channel.credentialsEncrypted);
      if (channel.type === 'TELEGRAM') {
        await this.telegram.setWebhook(credentials.botToken, '');
      } else if (channel.type === 'MAX') {
        const backendUrl = this.config.get('BACKEND_URL');
        if (backendUrl) {
          const webhookUrl = `${backendUrl}/api/channels/max/webhook/${channel.id}`;
          await this.max.deleteWebhook(credentials.botToken, webhookUrl);
        }
      } else if (channel.type === 'AVITO') {
        // Refresh access token and unsubscribe
        const accessToken = await this.avito.getAccessToken(
          credentials.clientId,
          credentials.clientSecret,
        );
        await this.avito.unsubscribeFromWebhook(accessToken);
      }
    } catch (error) {
      this.logger.error('Failed to remove webhook:', error);
    }

    // Delete the channel (conversations will be cascade deleted based on schema)
    await this.prisma.channel.delete({
      where: { id: channelId },
    });

    return { success: true };
  }
}
