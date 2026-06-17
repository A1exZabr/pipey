import { Controller, Post, Body, Param, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SkipThrottle } from '@nestjs/throttler';
import { MaxWebhookDto } from '../dto/connect-max.dto';

@Controller('channels/max')
export class MaxController {
  private readonly logger = new Logger(MaxController.name);

  constructor(
    @InjectQueue('webhook-processing') private webhookQueue: Queue,
  ) {}

  @Post('webhook/:channelId')
  @SkipThrottle()
  async handleWebhook(
    @Param('channelId') channelId: string,
    @Body() update: MaxWebhookDto,
  ) {
    this.logger.log(`Received MAX webhook for channel ${channelId}`);

    try {
      await this.webhookQueue.add(
        'max-webhook',
        { channelId, payload: update, channelType: 'max' },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: false,
        },
      );
    } catch (error) {
      this.logger.error(`Failed to queue MAX webhook: ${error.message}`);
    }

    return { ok: true };
  }
}
