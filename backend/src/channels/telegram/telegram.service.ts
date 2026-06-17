import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private configService: ConfigService) {}

  async setWebhook(botToken: string, webhookUrl: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${botToken}/setWebhook`,
        {
          url: webhookUrl,
          allowed_updates: ['message'],
        },
      );
      return response.data.ok;
    } catch (error) {
      this.logger.error(`Failed to set webhook: ${error.message}`);
      throw error;
    }
  }

  async getBotInfo(botToken: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${botToken}/getMe`,
      );
      return response.data.result;
    } catch (error) {
      this.logger.error(`Failed to get bot info: ${error.message}`);
      throw error;
    }
  }

  async sendMessage(
    botToken: string,
    chatId: number,
    text: string,
  ): Promise<any> {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          chat_id: chatId,
          text,
        },
      );
      return response.data.result;
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`);
      throw error;
    }
  }

  async getFile(botToken: string, fileId: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`,
      );
      return response.data.result;
    } catch (error) {
      this.logger.error(`Failed to get file: ${error.message}`);
      throw error;
    }
  }

  getFileUrl(botToken: string, filePath: string): string {
    return `https://api.telegram.org/file/bot${botToken}/${filePath}`;
  }
}
