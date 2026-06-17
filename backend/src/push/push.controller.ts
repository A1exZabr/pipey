import { Controller, Get, Post, Delete, Body, Query, UseGuards } from '@nestjs/common';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

class SubscribeDto {
  endpoint: string;
  p256dh: string;
  auth: string;
}

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get('vapid-public-key')
  getVapidPublicKey() {
    return { publicKey: this.pushService.getVapidPublicKey() };
  }

  @Post('subscribe')
  subscribe(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SubscribeDto,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || user.organizations[0]?.id;
    return this.pushService.subscribe(user.id, organizationId, dto);
  }

  @Delete('unsubscribe')
  unsubscribe(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { endpoint: string },
  ) {
    return this.pushService.unsubscribe(user.id, body.endpoint);
  }
}
