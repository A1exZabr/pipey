import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { SendMessageDto, LinkContactDto } from './dto/conversation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('orgId') orgId?: string,
    @Query('channelId') channelId?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.conversationsService.findAll(organizationId, {
      channelId,
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.conversationsService.findOne(organizationId, id);
  }

  @Get(':id/messages')
  getMessages(
    @CurrentUser() user: CurrentUserData,
    @Param('id') conversationId: string,
    @Query('orgId') orgId?: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.conversationsService.getMessages(organizationId, conversationId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      before,
    });
  }

  @Post(':id/messages')
  sendMessage(
    @CurrentUser() user: CurrentUserData,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.conversationsService.sendMessage(organizationId, conversationId, dto);
  }

  @Post(':id/contacts')
  linkContact(
    @CurrentUser() user: CurrentUserData,
    @Param('id') conversationId: string,
    @Body() dto: LinkContactDto,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.conversationsService.linkContact(organizationId, conversationId, dto);
  }

  @Delete(':id/contacts/:contactId')
  unlinkContact(
    @CurrentUser() user: CurrentUserData,
    @Param('id') conversationId: string,
    @Param('contactId') contactId: string,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.conversationsService.unlinkContact(organizationId, conversationId, contactId);
  }

  @Post(':id/read')
  markAsRead(
    @CurrentUser() user: CurrentUserData,
    @Param('id') conversationId: string,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.conversationsService.markAsRead(organizationId, conversationId);
  }
}
