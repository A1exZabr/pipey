import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ArtifactsController } from './artifacts.controller';
import { ArtifactsService } from './artifacts.service';
import { PdfService } from './pdf.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, ConversationsModule, SettingsModule, JwtModule, ConfigModule],
  controllers: [ArtifactsController],
  providers: [ArtifactsService, PdfService],
  exports: [ArtifactsService],
})
export class ArtifactsModule {}
