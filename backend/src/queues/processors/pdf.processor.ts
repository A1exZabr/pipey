import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('pdf-generation', { concurrency: 1 })
export class PdfProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfProcessor.name);

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing PDF job ${job.id}`);
    // Placeholder — existing PDF logic stays in artifacts service for now
  }
}
