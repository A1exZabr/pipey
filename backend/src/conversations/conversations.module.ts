import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TelegramService } from '../channels/telegram/telegram.service';
import { MaxService } from '../channels/max/max.service';
import { AvitoService } from '../channels/avito/avito.service';
import { EncryptionService } from '../common/services/encryption.service';

@Module({
  imports: [PrismaModule, JwtModule, ConfigModule],
  controllers: [ConversationsController],
  providers: [ConversationsService, TelegramService, MaxService, AvitoService, EncryptionService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
