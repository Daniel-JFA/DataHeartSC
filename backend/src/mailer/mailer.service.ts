import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT') || 587;
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log('Servicio de correo configurado.');
    } else {
      this.logger.warn('SMTP no configurado — los correos se omitirán. Configura SMTP_HOST, SMTP_USER, SMTP_PASS en .env');
    }
  }

  async sendCertificate(opts: {
    to: string;
    donorName: string;
    amount: number;
    certificateNumber: string;
    pdfPath: string;
  }): Promise<boolean> {
    if (!this.transporter) return false;

    const from = this.config.get<string>('EMAIL_FROM') || 'noreply@santiagocorazon.org';
    const amountFormatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(opts.amount);

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#e11d48;padding:24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">Fundación Infantil Santiago Corazón</h1>
        </div>
        <div style="padding:32px 24px;">
          <p style="font-size:16px;">Estimado/a <strong>${opts.donorName}</strong>,</p>
          <p>Gracias por su generosa donación de <strong>${amountFormatted}</strong>. Su contribución es fundamental para seguir transformando vidas.</p>
          <p>Adjunto encontrará su <strong>Certificado de Donación N.° ${opts.certificateNumber}</strong>, el cual puede utilizar como soporte para deducción de impuestos.</p>
          <p style="margin-top:32px;font-size:13px;color:#64748b;">
            Fundación Infantil Santiago Corazón · NIT 900.XXX.XXX-X<br>
            Medellín, Colombia
          </p>
        </div>
      </div>
    `;

    let attachments: nodemailer.SendMailOptions['attachments'] = [];

    if (fs.existsSync(opts.pdfPath)) {
      attachments = [{
        filename: `certificado_donacion_${opts.certificateNumber}.pdf`,
        path: opts.pdfPath,
        contentType: 'application/pdf',
      }];
    }

    try {
      await this.transporter.sendMail({
        from,
        to: opts.to,
        subject: `Certificado de Donación N.° ${opts.certificateNumber} — Fundación Santiago Corazón`,
        html,
        attachments,
      });
      this.logger.log(`Correo con certificado ${opts.certificateNumber} enviado a ${opts.to}`);
      return true;
    } catch (err) {
      this.logger.error(`Error al enviar correo a ${opts.to}:`, err);
      return false;
    }
  }
}
