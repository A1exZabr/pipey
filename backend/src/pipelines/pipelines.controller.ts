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
import { PipelinesService } from './pipelines.service';
import { CreatePipelineDto, CreateStageDto } from './dto/create-pipeline.dto';
import { UpdatePipelineDto, UpdateStageDto } from './dto/update-pipeline.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@Controller('pipelines')
@UseGuards(JwtAuthGuard)
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreatePipelineDto,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.pipelinesService.create(organizationId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.pipelinesService.findAll(organizationId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.pipelinesService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdatePipelineDto,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.pipelinesService.update(organizationId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.pipelinesService.remove(organizationId, id);
  }

  // Stage endpoints
  @Post(':pipelineId/stages')
  addStage(
    @CurrentUser() user: CurrentUserData,
    @Param('pipelineId') pipelineId: string,
    @Body() dto: CreateStageDto,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.pipelinesService.addStage(organizationId, pipelineId, dto);
  }

  @Patch('stages/:stageId')
  updateStage(
    @CurrentUser() user: CurrentUserData,
    @Param('stageId') stageId: string,
    @Body() dto: UpdateStageDto,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.pipelinesService.updateStage(organizationId, stageId, dto);
  }

  @Delete('stages/:stageId')
  removeStage(
    @CurrentUser() user: CurrentUserData,
    @Param('stageId') stageId: string,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.pipelinesService.removeStage(organizationId, stageId);
  }
}
