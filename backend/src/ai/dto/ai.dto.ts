import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum AiRequestType {
  DRAFT_REPLY = 'draft_reply',
  ACTION_SUGGESTION = 'action_suggestion',
  SUMMARY = 'summary',
}

export class GenerateAiSuggestionDto {
  @IsString()
  conversationId: string;

  @IsEnum(AiRequestType)
  type: AiRequestType;

  @IsOptional()
  @IsString()
  context?: string;
}

export class AcceptSuggestionDto {
  @IsString()
  suggestionId: string;
}

export class DismissSuggestionDto {
  @IsString()
  suggestionId: string;
}

// AI Response types
export interface DraftReplyPayload {
  text: string;
  confidence: number;
}

export interface ActionSuggestionPayload {
  actions: Array<{
    type: 'send_quote' | 'send_invoice' | 'send_calendar_link' | 'send_product_card' | 'create_deal' | 'create_contact';
    label: string;
    params?: Record<string, any>;
  }>;
}

export interface SummaryPayload {
  summary: string;
  clientNeeds: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}
