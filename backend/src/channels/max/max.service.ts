import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MaxService {
  private readonly logger = new Logger(MaxService.name);
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get('MAX_API_URL') || 'https://api.max.ru';
  }

  async getBotInfo(token: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/bot/v1/self/get`, {
        params: { token },
      });

      if (!response.data.ok) {
        throw new Error(response.data.description || 'Failed to get bot info');
      }

      return response.data.result;
    } catch (error) {
      this.logger.error(`Failed to get MAX bot info: ${error.message}`);
      throw error;
    }
  }

  async setWebhook(token: string, webhookUrl: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/bot/v1/self/subscriptions`,
        {
          url: webhookUrl,
          update_types: ['message_created', 'message_callback'],
        },
        {
          params: { token },
        },
      );

      if (!response.data.ok) {
        throw new Error(response.data.description || 'Failed to set webhook');
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to set MAX webhook: ${error.message}`);
      throw error;
    }
  }

  async deleteWebhook(token: string, webhookUrl: string): Promise<boolean> {
    try {
      const response = await axios.delete(
        `${this.apiUrl}/bot/v1/self/subscriptions`,
        {
          params: { token },
          data: { url: webhookUrl },
        },
      );

      return response.data.ok || true;
    } catch (error) {
      this.logger.error(`Failed to delete MAX webhook: ${error.message}`);
      return false;
    }
  }

  async sendMessage(token: string, chatId: string, text: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/bot/v1/messages/sendText`,
        {
          chat_id: chatId,
          text,
        },
        {
          params: { token },
        },
      );

      if (!response.data.ok) {
        throw new Error(response.data.description || 'Failed to send message');
      }

      return response.data.result;
    } catch (error) {
      this.logger.error(`Failed to send MAX message: ${error.message}`);
      throw error;
    }
  }

  async getFile(token: string, fileId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/bot/v1/files/getInfo`, {
        params: { token, file_id: fileId },
      });

      if (!response.data.ok) {
        throw new Error(response.data.description || 'Failed to get file');
      }

      return response.data.result;
    } catch (error) {
      this.logger.error(`Failed to get MAX file: ${error.message}`);
      throw error;
    }
  }

  getFileUrl(token: string, fileId: string): string {
    return `${this.apiUrl}/bot/v1/files/get?token=${token}&file_id=${fileId}`;
  }
}
