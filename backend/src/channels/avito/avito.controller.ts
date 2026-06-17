import { Controller, Post, Body, Param, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SkipThrottle } from '@nestjs/throttler';
import { AvitoWebhookDto } from '../dto/connect-avito.dto';

@Controller('channels/avito')
export class AvitoController {
  private readonly logger = new Logger(AvitoController.name);

  constructor(
    @InjectQueue('webhook-processing') private webhookQueue: Queue,
  ) {}

  @Post('webhook/:channelId')
  @SkipThrottle()
  async handleWebhook(
    @Param('channelId') channelId: string,
    @Body() payload: AvitoWebhookDto,
  ) {
    this.logger.log(`Received Avito webhook for channel ${channelId}`);

    try {
      await this.webhookQueue.add(
        'avito-webhook',
        { channelId, payload, channelType: 'avito' },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: false,
        },
      );
    } catch (error) {
      this.logger.error(`Failed to queue Avito webhook: ${error.message}`);
    }

    return { ok: true };
  }
}
