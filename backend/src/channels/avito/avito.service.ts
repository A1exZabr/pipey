import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AvitoService {
  private readonly logger = new Logger(AvitoService.name);
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get('AVITO_API_URL') || 'https://api.avito.ru';
  }

  async getAccessToken(clientId: string, clientSecret: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data.access_token;
    } catch (error) {
      this.logger.error(`Failed to get Avito access token: ${error.message}`);
      throw error;
    }
  }

  async getAccountInfo(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/core/v1/accounts/self`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get Avito account info: ${error.message}`);
      throw error;
    }
  }

  async getChats(accessToken: string, userId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/messenger/v2/accounts/${userId}/chats`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get Avito chats: ${error.message}`);
      throw error;
    }
  }

  async getMessages(
    accessToken: string,
    userId: string,
    chatId: string,
  ): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/messenger/v2/accounts/${userId}/chats/${chatId}/messages/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get Avito messages: ${error.message}`);
      throw error;
    }
  }

  async sendMessage(
    accessToken: string,
    userId: string,
    chatId: string,
    text: string,
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/messenger/v1/accounts/${userId}/chats/${chatId}/messages`,
        {
          message: {
            text,
          },
          type: 'text',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send Avito message: ${error.message}`);
      throw error;
    }
  }

  async subscribeToWebhook(
    accessToken: string,
    webhookUrl: string,
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/messenger/v3/webhook`,
        {
          url: webhookUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.status === 200;
    } catch (error) {
      this.logger.error(`Failed to subscribe to Avito webhook: ${error.message}`);
      throw error;
    }
  }

  async unsubscribeFromWebhook(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/messenger/v3/webhook/unsubscribe`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.status === 200;
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from Avito webhook: ${error.message}`);
      return false;
    }
  }

  async refreshAccessToken(clientId: string, clientSecret: string): Promise<string> {
    return this.getAccessToken(clientId, clientSecret);
  }
}
