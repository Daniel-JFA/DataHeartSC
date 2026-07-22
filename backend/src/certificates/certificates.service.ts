import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);
  private readonly uploadsDir: string;

  constructor(
    private prisma: PrismaService,
    private mailer: MailerService,
  ) {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'certificates');
    fs.mkdirSync(this.uploadsDir, { recursive: true });
  }

  // ── Generar y emitir certificado para una donación aprobada ──────────────────
  async generateForDonation(donationId: string): Promise<string> {
    const donation = await this.prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        client: true,
        certificates: true,
      },
    });

    if (!donation) throw new NotFoundException(`Donación ${donationId} no encontrada`);

    // Idempotencia: si ya tiene certificado, retornar el existente
    if (donation.certificates.length > 0) {
      this.logger.log(`Donación ${donationId} ya tiene certificado. Omitiendo.`);
      return donation.certificates[0].id;
    }

    // Número de certificado consecutivo
    const lastCert = await this.prisma.certificate.findFirst({
      orderBy: { certificateNumber: 'desc' },
    });
    const certNumber = (lastCert?.certificateNumber ?? 0) + 1;
    const certNumberStr = `SC-${new Date().getFullYear()}-${String(certNumber).padStart(4, '0')}`;

    const pdfFilename = `certificado_${certNumberStr}.pdf`;
    const pdfPath = path.join(this.uploadsDir, pdfFilename);

    // Generar PDF
    await this.buildPdf({
      pdfPath,
      certNumber: certNumberStr,
      donorName: donation.client.name,
      donorDoc: `${donation.client.docType} ${donation.client.docNumber}`,
      amount: Number(donation.amount),
      gateway: donation.paymentGateway,
      transactionId: donation.transactionId,
      date: donation.date,
    });

    // Guardar registro en BD
    const cert = await this.prisma.certificate.create({
      data: {
        donationId: donation.id,
        certificateNumber: certNumber,
        pdfPath: `uploads/certificates/${pdfFilename}`,
        status: 'Enviado',
      },
    });

    // Enviar correo si el donante tiene email
    if (donation.client.email) {
      await this.mailer.sendCertificate({
        to: donation.client.email,
        donorName: donation.client.name,
        amount: Number(donation.amount),
        certificateNumber: certNumberStr,
        pdfPath,
      });
    }

    this.logger.log(`Certificado ${certNumberStr} generado para donación ${donationId}`);
    return cert.id;
  }

  // ── Descargar un certificado por su ID ───────────────────────────────────────
  async getPdfPath(certId: string): Promise<string> {
    const cert = await this.prisma.certificate.findUnique({ where: { id: certId } });
    if (!cert) throw new NotFoundException(`Certificado ${certId} no encontrado`);

    const fullPath = path.join(process.cwd(), cert.pdfPath);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('El archivo PDF ya no está disponible en el servidor');
    }
    return fullPath;
  }

  // ── Construcción del PDF ─────────────────────────────────────────────────────
  private async buildPdf(opts: {
    pdfPath: string;
    certNumber: string;
    donorName: string;
    donorDoc: string;
    amount: number;
    gateway: string;
    transactionId: string;
    date: Date;
  }): Promise<void> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4

    const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const { width, height } = page.getSize();
    const red   = rgb(0.882, 0.114, 0.282); // #e11d48
    const dark  = rgb(0.059, 0.090, 0.165); // #0f172a
    const gray  = rgb(0.392, 0.455, 0.545); // #647787
    const white = rgb(1, 1, 1);

    // ── Banda superior ──────────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: red });

    page.drawText('Fundación Infantil Santiago Corazón', {
      x: 40, y: height - 40,
      size: 20, font: fontBold, color: white,
    });
    page.drawText('NIT 900.XXX.XXX-X · Entidad sin ánimo de lucro', {
      x: 40, y: height - 64,
      size: 10, font: fontRegular, color: white,
    });

    // ── Título del certificado ──────────────────────────────────────────────────
    page.drawText('CERTIFICADO DE DONACIÓN', {
      x: 40, y: height - 130,
      size: 22, font: fontBold, color: red,
    });
    page.drawText(`N.° ${opts.certNumber}`, {
      x: 40, y: height - 158,
      size: 14, font: fontBold, color: dark,
    });

    // ── Línea divisoria ─────────────────────────────────────────────────────────
    page.drawLine({ start: { x: 40, y: height - 172 }, end: { x: width - 40, y: height - 172 }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });

    // ── Cuerpo del certificado ──────────────────────────────────────────────────
    const issueDate = opts.date.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
    const amountFormatted = new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(opts.amount);

    const bodyText = [
      `La Fundación Infantil Santiago Corazón certifica que la persona identificada a`,
      `continuación realizó una donación voluntaria, la cual es deducible de renta conforme`,
      `al Estatuto Tributario colombiano (Art. 125 y siguientes).`,
    ];

    let y = height - 210;
    for (const line of bodyText) {
      page.drawText(line, { x: 40, y, size: 11, font: fontRegular, color: dark });
      y -= 18;
    }

    // ── Tabla de datos ──────────────────────────────────────────────────────────
    y -= 16;
    const rows: [string, string][] = [
      ['Donante',          opts.donorName],
      ['Identificación',   opts.donorDoc],
      ['Valor donado',     amountFormatted],
      ['Fecha',            issueDate],
      ['Medio de pago',    opts.gateway],
      ['N.° de transacción', opts.transactionId],
    ];

    for (const [label, value] of rows) {
      page.drawRectangle({ x: 40, y: y - 4, width: 150, height: 24, color: rgb(0.98, 0.98, 0.98) });
      page.drawText(label, { x: 48, y: y + 4, size: 10, font: fontBold, color: gray });
      page.drawText(value, { x: 200, y: y + 4, size: 10, font: fontRegular, color: dark });
      page.drawLine({ start: { x: 40, y: y - 4 }, end: { x: width - 40, y: y - 4 }, thickness: 0.5, color: rgb(0.92, 0.92, 0.92) });
      y -= 28;
    }

    // ── Nota legal ──────────────────────────────────────────────────────────────
    y -= 24;
    page.drawRectangle({ x: 40, y: y - 30, width: width - 80, height: 54, color: rgb(0.996, 0.953, 0.957) });
    page.drawText('Nota legal:', { x: 52, y: y + 10, size: 9, font: fontBold, color: red });
    page.drawText('Este certificado es válido como soporte para deducción tributaria ante la DIAN.', {
      x: 52, y: y - 4, size: 9, font: fontRegular, color: dark,
    });
    page.drawText('Ley 223 de 1995 · Art. 125 del Estatuto Tributario · Resolución DIAN 000004/2021.', {
      x: 52, y: y - 18, size: 9, font: fontRegular, color: gray,
    });

    // ── Banda inferior de firma ─────────────────────────────────────────────────
    const footerY = 80;
    page.drawLine({ start: { x: 40, y: footerY + 50 }, end: { x: 240, y: footerY + 50 }, thickness: 1, color: dark });
    page.drawText('Representante Legal', { x: 40, y: footerY + 34, size: 9, font: fontBold, color: dark });
    page.drawText('Fundación Infantil Santiago Corazón', { x: 40, y: footerY + 20, size: 9, font: fontRegular, color: gray });

    page.drawText(`Generado el ${new Date().toLocaleDateString('es-CO')} · Verificable en sc.danielflorez.dev`, {
      x: 40, y: footerY,
      size: 8, font: fontRegular, color: gray,
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(opts.pdfPath, Buffer.from(pdfBytes));
  }
}
