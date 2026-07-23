import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CERTIFICATES_QUEUE, CertificateJobData } from './certificates.queue';
import { CertificatesService } from './certificates.service';

@Processor(CERTIFICATES_QUEUE)
export class CertificatesProcessor extends WorkerHost {
  private readonly logger = new Logger(CertificatesProcessor.name);

  constructor(private svc: CertificatesService) { super(); }

  async process(job: Job<CertificateJobData>) {
    this.logger.log(`Procesando job ${job.id} — donación ${job.data.donationId}`);
    await this.svc.generateForDonation(job.data.donationId);
    this.logger.log(`Job ${job.id} completado`);
  }
}
