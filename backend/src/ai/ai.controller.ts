import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private ai: AiService) {}

  // ============================================
  // GENERATE SUGGESTIONS
  // ============================================

  @Post('conversations/:conversationId/draft-reply')
  async generateDraftReply(
    @Request() req,
    @Param('conversationId') conversationId: string,
  ) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.ai.generateDraftReply(orgId, conversationId);
  }

  @Post('conversations/:conversationId/action-suggestions')
  async generateActionSuggestions(
    @Request() req,
    @Param('conversationId') conversationId: string,
  ) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.ai.generateActionSuggestions(orgId, conversationId);
  }

  @Post('conversations/:conversationId/summary')
  async generateSummary(
    @Request() req,
    @Param('conversationId') conversationId: string,
  ) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.ai.generateSummary(orgId, conversationId);
  }

  // ============================================
  // GET & MANAGE SUGGESTIONS
  // ============================================

  @Get('conversations/:conversationId/suggestions')
  async getSuggestions(
    @Request() req,
    @Param('conversationId') conversationId: string,
  ) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.ai.getSuggestions(orgId, conversationId);
  }

  @Post('suggestions/:suggestionId/accept')
  async acceptSuggestion(
    @Request() req,
    @Param('suggestionId') suggestionId: string,
  ) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.ai.acceptSuggestion(orgId, suggestionId);
  }

  @Post('suggestions/:suggestionId/dismiss')
  async dismissSuggestion(
    @Request() req,
    @Param('suggestionId') suggestionId: string,
  ) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.ai.dismissSuggestion(orgId, suggestionId);
  }
}
