import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  AiRequestType,
  DraftReplyPayload,
  ActionSuggestionPayload,
  SummaryPayload,
} from './dto/ai.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openrouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly fallbackModel: string;
  private readonly cache = new Map<string, { result: any; timestamp: number }>();
  private readonly cacheTtl = 1000 * 60 * 60; // 1 hour

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.apiKey = this.config.get('OPENROUTER_API_KEY') || '';
    this.defaultModel = this.config.get('AI_MODEL') || 'anthropic/claude-3-haiku';
    this.fallbackModel = this.config.get('AI_FALLBACK_MODEL') || 'openai/gpt-3.5-turbo';
  }

  // ============================================
  // MAIN GENERATION METHODS
  // ============================================

  async generateDraftReply(
    orgId: string,
    conversationId: string,
  ): Promise<DraftReplyPayload> {
    const messages = await this.getConversationContext(conversationId);
    
    const prompt = this.buildDraftReplyPrompt(messages);
    const cacheKey = this.getCacheKey('draft_reply', conversationId, messages);
    
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.callAi(prompt, {
      type: 'json_object',
      schema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Draft reply text in Russian' },
          confidence: { type: 'number', description: 'Confidence score 0-1' },
        },
        required: ['text', 'confidence'],
      },
    });

    const payload: DraftReplyPayload = {
      text: result.text || 'Hello! How can I help you?',
      confidence: result.confidence || 0.5,
    };

    // Save to database
    await this.saveSuggestion(orgId, conversationId, 'DRAFT_REPLY', payload);
    this.setCache(cacheKey, payload);

    return payload;
  }

  async generateActionSuggestions(
    orgId: string,
    conversationId: string,
  ): Promise<ActionSuggestionPayload> {
    const messages = await this.getConversationContext(conversationId);
    
    const prompt = this.buildActionSuggestionPrompt(messages);
    const cacheKey = this.getCacheKey('action_suggestion', conversationId, messages);
    
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.callAi(prompt, {
      type: 'json_object',
      schema: {
        type: 'object',
        properties: {
          actions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['send_quote', 'send_invoice', 'send_calendar_link', 'send_product_card', 'create_deal', 'create_contact'] },
                label: { type: 'string' },
                params: { type: 'object' },
              },
              required: ['type', 'label'],
            },
          },
        },
        required: ['actions'],
      },
    });

    const payload: ActionSuggestionPayload = {
      actions: result.actions || [],
    };

    await this.saveSuggestion(orgId, conversationId, 'ACTION_SUGGESTION', payload);
    this.setCache(cacheKey, payload);

    return payload;
  }

  async generateSummary(
    orgId: string,
    conversationId: string,
  ): Promise<SummaryPayload> {
    const messages = await this.getConversationContext(conversationId);
    
    const prompt = this.buildSummaryPrompt(messages);
    const cacheKey = this.getCacheKey('summary', conversationId, messages);
    
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.callAi(prompt, {
      type: 'json_object',
      schema: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'Brief summary in Russian' },
          clientNeeds: { type: 'array', items: { type: 'string' } },
          sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
        },
        required: ['summary', 'clientNeeds', 'sentiment'],
      },
    });

    const payload: SummaryPayload = {
      summary: result.summary || 'Conversation without a clear topic',
      clientNeeds: result.clientNeeds || [],
      sentiment: result.sentiment || 'neutral',
    };

    await this.saveSuggestion(orgId, conversationId, 'SUMMARY', payload);
    this.setCache(cacheKey, payload);

    return payload;
  }

  // ============================================
  // SUGGESTION MANAGEMENT
  // ============================================

  async getSuggestions(orgId: string, conversationId: string) {
    return this.prisma.aiSuggestion.findMany({
      where: {
        orgId,
        conversationId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async acceptSuggestion(orgId: string, suggestionId: string) {
    const suggestion = await this.prisma.aiSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion || suggestion.orgId !== orgId) {
      throw new BadRequestException('Suggestion not found');
    }

    return this.prisma.aiSuggestion.update({
      where: { id: suggestionId },
      data: { status: 'ACCEPTED' },
    });
  }

  async dismissSuggestion(orgId: string, suggestionId: string) {
    const suggestion = await this.prisma.aiSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion || suggestion.orgId !== orgId) {
      throw new BadRequestException('Suggestion not found');
    }

    return this.prisma.aiSuggestion.update({
      where: { id: suggestionId },
      data: { status: 'DISMISSED' },
    });
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private async getConversationContext(conversationId: string) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return messages.reverse();
  }

  private buildDraftReplyPrompt(messages: any[]): string {
    const history = messages
      .map((m) => `${m.direction === 'IN' ? 'Client' : 'Us'}: ${m.text || '[attachment]'}`)
      .join('\n');

    return `You are a sales manager's assistant. Analyze the conversation and suggest a reply to the client.

Conversation:
${history}

Reply requirements:
- In Russian
- Polite and professional tone
- Brief and to the point
- If the client asks about the price, offer to clarify the details
- If the client complains, express understanding and propose a solution

Return JSON:
{
  "text": "reply text",
  "confidence": 0.0-1.0
}`;
  }

  private buildActionSuggestionPrompt(messages: any[]): string {
    const history = messages
      .map((m) => `${m.direction === 'IN' ? 'Client' : 'Us'}: ${m.text || '[attachment]'}`)
      .join('\n');

    return `You are a manager's assistant. Analyze the conversation and suggest actions.

Conversation:
${history}

Available actions:
- send_quote: Send a quote (the client is interested in the price)
- send_invoice: Send an invoice (the client is ready to pay)
- send_calendar_link: Send a booking link (a meeting/consultation is needed)
- send_product_card: Send a product card (the client is asking about a product)
- create_deal: Create a deal (a new potential client)
- create_contact: Create a contact (if not yet in the database)

Return JSON with an array of relevant actions (maximum 3):
{
  "actions": [
    {"type": "send_quote", "label": "Send quote"},
    {"type": "create_deal", "label": "Create deal"}
  ]
}

If no actions are needed, return an empty array.`;
  }

  private buildSummaryPrompt(messages: any[]): string {
    const history = messages
      .map((m) => `${m.direction === 'IN' ? 'Client' : 'Us'}: ${m.text || '[attachment]'}`)
      .join('\n');

    return `Analyze the conversation with the client and create a brief summary.

Conversation:
${history}

Return JSON:
{
  "summary": "Brief summary of the conversation in Russian (1-2 sentences)",
  "clientNeeds": ["need 1", "need 2"],
  "sentiment": "positive" | "neutral" | "negative"
}`;
  }

  private async callAi(prompt: string, responseFormat?: any): Promise<any> {
    if (!this.apiKey) {
      this.logger.warn('OpenRouter API key not configured, returning mock response');
      return this.getMockResponse(prompt);
    }

    try {
      const response = await axios.post(
        this.openrouterUrl,
        {
          model: this.defaultModel,
          messages: [{ role: 'user', content: prompt }],
          response_format: responseFormat,
          max_tokens: 500,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://pipey.ru',
            'X-Title': 'Pipey CRM',
          },
          timeout: 30000,
        },
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty AI response');
      }

      return JSON.parse(content);
    } catch (error) {
      this.logger.error(`AI call failed: ${error.message}`);
      
      // Try fallback model
      if (this.fallbackModel !== this.defaultModel) {
        try {
          const response = await axios.post(
            this.openrouterUrl,
            {
              model: this.fallbackModel,
              messages: [{ role: 'user', content: prompt }],
              response_format: responseFormat,
              max_tokens: 500,
            },
            {
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 30000,
            },
          );

          const content = response.data.choices[0]?.message?.content;
          return JSON.parse(content || '{}');
        } catch (fallbackError) {
          this.logger.error(`Fallback AI call failed: ${fallbackError.message}`);
        }
      }

      return this.getMockResponse(prompt);
    }
  }

  private getMockResponse(prompt: string): any {
    if (prompt.includes('reply text')) {
      return {
        text: 'Hello! Thank you for reaching out. How can I help you?',
        confidence: 0.7,
      };
    }
    if (prompt.includes('actions')) {
      return {
        actions: [
          { type: 'create_deal', label: 'Create deal' },
        ],
      };
    }
    return {
      summary: 'The client is interested in services',
      clientNeeds: ['Consultation'],
      sentiment: 'neutral',
    };
  }

  private async saveSuggestion(
    orgId: string,
    conversationId: string,
    type: 'DRAFT_REPLY' | 'ACTION_SUGGESTION' | 'SUMMARY',
    payload: any,
  ) {
    return this.prisma.aiSuggestion.create({
      data: {
        orgId,
        conversationId,
        type,
        payload,
        status: 'PENDING',
      },
    });
  }

  private getCacheKey(type: string, conversationId: string, messages: any[]): string {
    const lastMessages = messages.slice(-5).map(m => m.id).join(',');
    const hash = crypto.createHash('md5').update(`${type}:${conversationId}:${lastMessages}`).digest('hex');
    return hash;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.result;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, result: any): void {
    this.cache.set(key, { result, timestamp: Date.now() });
    
    // Clean old entries
    if (this.cache.size > 1000) {
      const now = Date.now();
      for (const [k, v] of this.cache.entries()) {
        if (now - v.timestamp > this.cacheTtl) {
          this.cache.delete(k);
        }
      }
    }
  }
}
