import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('funnel')
  getFunnel(
    @CurrentUser() user: CurrentUserData,
    @Query('orgId') orgId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.analyticsService.getFunnel(organizationId, from, to);
  }

  @Get('revenue')
  getRevenue(
    @CurrentUser() user: CurrentUserData,
    @Query('orgId') orgId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.analyticsService.getRevenue(organizationId, from, to, groupBy);
  }

  @Get('channels')
  getChannelStats(
    @CurrentUser() user: CurrentUserData,
    @Query('orgId') orgId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.analyticsService.getChannelStats(organizationId, from, to);
  }

  @Get('team')
  getTeamStats(
    @CurrentUser() user: CurrentUserData,
    @Query('orgId') orgId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.analyticsService.getTeamStats(organizationId, from, to);
  }
}
