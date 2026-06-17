import { Module, Global } from '@nestjs/common';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [PrismaModule, JwtModule, ConfigModule],
  controllers: [PushController],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
