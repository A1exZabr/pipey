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
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto, MoveDealDto } from './dto/update-deal.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { Auditable } from '../common/decorators/auditable.decorator';

@Controller('deals')
@UseGuards(JwtAuthGuard)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @Auditable('deal.create')
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateDealDto,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.dealsService.create(organizationId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('orgId') orgId?: string,
    @Query('pipelineId') pipelineId?: string,
    @Query('stageId') stageId?: string,
    @Query('contactId') contactId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.dealsService.findAll(organizationId, { pipelineId, stageId, contactId });
  }

  @Get('pipeline/:pipelineId')
  findByPipeline(
    @CurrentUser() user: CurrentUserData,
    @Param('pipelineId') pipelineId: string,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.dealsService.findByPipeline(organizationId, pipelineId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.dealsService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.dealsService.update(organizationId, id, dto);
  }

  @Patch(':id/move')
  move(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: MoveDealDto,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.dealsService.move(organizationId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.dealsService.remove(organizationId, id);
  }
}
