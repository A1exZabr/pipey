import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { TelegramController } from './telegram/telegram.controller';
import { TelegramService } from './telegram/telegram.service';
import { MaxController } from './max/max.controller';
import { MaxService } from './max/max.service';
import { AvitoController } from './avito/avito.controller';
import { AvitoService } from './avito/avito.service';
import { EncryptionService } from '../common/services/encryption.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, JwtModule, ConfigModule, BullModule.registerQueue({ name: 'webhook-processing' })],
  controllers: [ChannelsController, TelegramController, MaxController, AvitoController],
  providers: [ChannelsService, TelegramService, MaxService, AvitoService, EncryptionService],
  exports: [ChannelsService, TelegramService, MaxService, AvitoService, EncryptionService],
})
export class ChannelsModule {}
