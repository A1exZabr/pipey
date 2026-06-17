import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { Auditable } from '../common/decorators/auditable.decorator';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @Auditable('contact.create')
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateContactDto,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.contactsService.create(organizationId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('orgId') orgId?: string,
    @Query('search') search?: string,
    @Query('tags') tags?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    const tagList = tags ? tags.split(',') : undefined;
    return this.contactsService.findAll(organizationId, { search, tags: tagList });
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.contactsService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.contactsService.update(organizationId, id, dto);
  }

  @Get(':id/conversations')
  getConversations(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.contactsService.getConversations(organizationId, id);
  }

  @Get(':id/deals')
  getDeals(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.contactsService.getDeals(organizationId, id);
  }

  @Get(':id/artifacts')
  getArtifacts(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.contactsService.getArtifacts(organizationId, id);
  }

  @Get(':id/timeline')
  getTimeline(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.contactsService.getTimeline(organizationId, id);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.contactsService.remove(organizationId, id);
  }
}
