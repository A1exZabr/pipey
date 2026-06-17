import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('ai-generation', { concurrency: 2 })
export class AiProcessor extends WorkerHost {
  private readonly logger = new Logger(AiProcessor.name);

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing AI job ${job.id}`);
    // Placeholder — existing AI logic stays in ai service for now
  }
}
