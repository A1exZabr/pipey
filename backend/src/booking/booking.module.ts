import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [BookingController],
})
export class BookingModule {}
