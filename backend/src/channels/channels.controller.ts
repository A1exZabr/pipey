import { Controller, Post, Get, Delete, Body, UseGuards, Param } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConnectTelegramDto } from './dto/connect-telegram.dto';
import { ConnectMaxDto } from './dto/connect-max.dto';
import { ConnectAvitoDto } from './dto/connect-avito.dto';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post('telegram/connect')
  async connectTelegram(
    @CurrentUser() user: any,
    @Body() dto: ConnectTelegramDto,
  ) {
    return this.channelsService.connectTelegram(user, dto.botToken);
  }

  @Post('max/connect')
  async connectMax(
    @CurrentUser() user: any,
    @Body() dto: ConnectMaxDto,
  ) {
    return this.channelsService.connectMax(user, dto.botToken);
  }

  @Post('avito/connect')
  async connectAvito(
    @CurrentUser() user: any,
    @Body() dto: ConnectAvitoDto,
  ) {
    return this.channelsService.connectAvito(user, dto.clientId, dto.clientSecret);
  }

  @Get()
  async getChannels(@CurrentUser() user: any) {
    return this.channelsService.getChannels(user);
  }

  @Get(':id')
  async getChannel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.channelsService.getChannel(user, id);
  }

  @Delete(':id')
  async deleteChannel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.channelsService.deleteChannel(user, id);
  }
}
