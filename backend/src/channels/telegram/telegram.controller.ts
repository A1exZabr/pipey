import { Controller, Post, Body, Param, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SkipThrottle } from '@nestjs/throttler';
import { TelegramWebhookDto } from '../dto/connect-telegram.dto';

@Controller('channels/telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    @InjectQueue('webhook-processing') private webhookQueue: Queue,
  ) {}

  @Post('webhook/:channelId')
  @SkipThrottle()
  async handleWebhook(
    @Param('channelId') channelId: string,
    @Body() update: TelegramWebhookDto,
  ) {
    this.logger.log(`Received Telegram webhook for channel ${channelId}`);

    try {
      await this.webhookQueue.add(
        'telegram-webhook',
        { channelId, payload: update, channelType: 'telegram' },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: false,
        },
      );
    } catch (error) {
      this.logger.error(`Failed to queue webhook: ${error.message}`);
    }

    return { ok: true };
  }
}
