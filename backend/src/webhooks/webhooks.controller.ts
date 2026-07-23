import {
  Controller, Post, Headers, Req, Body,
  BadRequestException, UnauthorizedException,
  HttpCode, HttpStatus, UseGuards, Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CertificatesService } from '../certificates/certificates.service';
import { Request } from 'express';
import * as crypto from 'crypto';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  private shopifySecret: string;
  private wompiIntegrityKey: string;
  private payuApiKey: string;
  private payuMerchantId: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private certificates: CertificatesService,
  ) {
    this.shopifySecret      = this.config.get<string>('SHOPIFY_WEBHOOK_SECRET') || '';
    this.wompiIntegrityKey  = this.config.get<string>('WOMPI_INTEGRITY_KEY') || '';
    this.payuApiKey         = this.config.get<string>('PAYU_API_KEY') || '';
    this.payuMerchantId     = this.config.get<string>('PAYU_MERCHANT_ID') || '';
  }

  // ── Webhook real de Shopify ─────────────────────────────────
  @Post('shopify/orders')
  @HttpCode(HttpStatus.OK)
  async handleShopifyOrder(
    @Headers('x-shopify-hmac-sha256') signature: string,
    @Headers('x-shopify-topic') topic: string,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    if (!signature) {
      throw new UnauthorizedException('Falta la firma del webhook de Shopify');
    }
    if (!req.rawBody) {
      throw new BadRequestException('No se recibió el cuerpo crudo de la petición');
    }
    const isValid = this.verifyHmac(req.rawBody, signature);
    if (!isValid) {
      throw new UnauthorizedException('Firma del webhook de Shopify inválida');
    }
    const payload = JSON.parse(req.rawBody.toString('utf8'));
    return this.processShopifyOrder(payload);
  }

  // ── Simulación para pruebas (requiere JWT) ──────────────────
  @Post('shopify/simulate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async simulateShopifyOrder(@Body() body: {
    orderNumber?: number;
    totalPrice?: string;
    financialStatus?: 'paid' | 'pending';
    customerName?: string;
    customerEmail?: string;
    city?: string;
    items?: { sku: string; title: string; price: string; quantity: number }[];
  }) {
    const now = new Date().toISOString();
    const orderId = Date.now();
    const orderNumber = body.orderNumber ?? Math.floor(Math.random() * 9000) + 1000;

    const payload = {
      id: orderId,
      order_number: orderNumber,
      financial_status: body.financialStatus ?? 'paid',
      total_price: body.totalPrice ?? '50000.00',
      created_at: now,
      customer: {
        id: orderId,
        first_name: (body.customerName ?? 'Cliente Prueba').split(' ')[0],
        last_name: (body.customerName ?? 'Cliente Prueba').split(' ').slice(1).join(' ') || 'Test',
        email: body.customerEmail ?? `test_${orderId}@simulacion.dev`,
        phone: null,
        default_address: {
          address1: 'Calle de prueba #1-23',
          city: body.city ?? 'Bogotá',
          address2: null,
        },
      },
      line_items: body.items?.length
        ? body.items
        : [
            {
              product_id: orderId,
              sku: `SIM-${orderId}`,
              title: 'Producto simulado',
              price: body.totalPrice ?? '50000.00',
              quantity: 1,
            },
          ],
      shipping_address: { city: body.city ?? 'Bogotá' },
    };

    return this.processShopifyOrder(payload);
  }

  // ── Lógica compartida ────────────────────────────────────────
  private async processShopifyOrder(payload: any) {
    const shopifyOrderId = String(payload.id);
    const invoiceRef = `Shopify #${payload.order_number || payload.number || shopifyOrderId}`;

    const existingOrder = await this.prisma.order.findFirst({
      where: { invoiceNumber: invoiceRef },
    });

    const isPaid =
      payload.financial_status === 'paid' ||
      payload.financial_status === 'authorized';

    if (existingOrder) {
      if (isPaid && existingOrder.paymentStatus !== 'Pagado') {
        const updated = await this.prisma.order.update({
          where: { id: existingOrder.id },
          data: { paymentStatus: 'Pagado', status: 'Entregado' },
        });
        return {
          status: 'success',
          action: 'updated',
          message: 'Pedido actualizado a Pagado',
          orderId: updated.id,
          invoiceNumber: invoiceRef,
        };
      }
      return {
        status: 'success',
        action: 'skipped',
        message: 'Pedido ya procesado (idempotencia aplicada)',
        orderId: existingOrder.id,
        invoiceNumber: invoiceRef,
      };
    }

    const customer = payload.customer || {};
    const customerEmail =
      customer.email || `shopify_no_email_${shopifyOrderId}@santiagocorazon.org`;
    const customerDocNumber = `SH-${customer.id || shopifyOrderId}`;

    let client = await this.prisma.clientDonor.findFirst({
      where: {
        OR: [
          { email: customer.email ? customer.email : undefined },
          { docNumber: customerDocNumber },
        ],
      },
    });

    if (!client) {
      client = await this.prisma.clientDonor.create({
        data: {
          name: `${customer.first_name || 'Cliente'} ${customer.last_name || 'Shopify'}`.trim(),
          docType: 'Otro',
          docNumber: customerDocNumber,
          phone: customer.phone || null,
          email: customerEmail || null,
          address: customer.default_address?.address1 || null,
          city: customer.default_address?.city || null,
          neighborhood: customer.default_address?.address2 || null,
          status: 'Activo',
        },
      });
    }

    const order = await this.prisma.order.create({
      data: {
        clientId: client.id,
        orderDate: new Date(payload.created_at || Date.now()),
        status: isPaid ? 'Entregado' : 'Recibido',
        totalAmount: payload.total_price || '0.00',
        paymentStatus: isPaid ? 'Pagado' : 'Pendiente',
        source: 'Shopify',
        orderType: 'Venta',
        invoiceNumber: invoiceRef,
        canalAtencion: 'Sitio Web',
        municipioEntrega:
          payload.shipping_address?.city ||
          customer.default_address?.city ||
          null,
      },
    });

    for (const item of payload.line_items || []) {
      const itemSku = item.sku || `SKU-TEMP-${item.product_id || 'UNKNOWN'}`;
      let product = await this.prisma.product.findUnique({ where: { sku: itemSku } });

      if (!product) {
        product = await this.prisma.product.create({
          data: {
            sku: itemSku,
            name: item.title || item.name || 'Producto Shopify',
            price: item.price || '0.00',
            stock: 0,
            minStock: 0,
            categoryName: 'Shopify Import',
            isActive: true,
          },
        });
      }

      const quantity = Number(item.quantity || 1);
      const unitPrice = item.price || '0.00';

      await this.prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity,
          unitPrice,
          subtotal: String(Number(unitPrice) * quantity),
        },
      });

      await this.prisma.product.update({
        where: { id: product.id },
        data: { stock: { decrement: quantity } },
      });
    }

    return {
      status: 'success',
      action: 'created',
      message: 'Pedido creado exitosamente',
      orderId: order.id,
      invoiceNumber: invoiceRef,
      clientId: client.id,
    };
  }

  // ── Webhook Wompi ────────────────────────────────────────────
  @Post('wompi')
  @HttpCode(HttpStatus.OK)
  async handleWompiEvent(@Body() body: any) {
    const event = body?.event;
    const transaction = body?.data?.transaction;

    if (!event || !transaction) {
      throw new BadRequestException('Payload de Wompi inválido');
    }

    // Verificar firma de integridad si la llave está configurada
    if (this.wompiIntegrityKey && body?.signature?.checksum) {
      const props: string[] = body.signature.properties || [];
      const concat = props.map((p: string) => {
        const parts = p.split('.');
        let val: any = body.data;
        for (const part of parts) val = val?.[part];
        return val ?? '';
      }).join('') + this.wompiIntegrityKey;
      const expected = crypto.createHash('sha256').update(concat).digest('hex');
      if (expected !== body.signature.checksum) {
        this.logger.warn('Firma Wompi inválida, rechazando evento');
        throw new UnauthorizedException('Firma de Wompi inválida');
      }
    }

    if (event === 'transaction.updated' && transaction.status === 'APPROVED') {
      await this.processWompiTransaction(transaction);
    }

    return { received: true };
  }

  private async processWompiTransaction(tx: any) {
    const transactionId = String(tx.id);
    const existing = await this.prisma.donation.findUnique({ where: { transactionId } });
    if (existing) {
      this.logger.log(`Transacción Wompi ${transactionId} ya procesada (idempotencia)`);
      return;
    }

    const email = tx.customer_email || `wompi_${transactionId}@santiagocorazon.org`;
    const amount = Number(tx.amount_in_cents || 0) / 100;

    let client = await this.prisma.clientDonor.findFirst({ where: { email } });
    if (!client) {
      const name = [tx.customer_data?.full_name, tx.billing_data?.full_name]
        .find(Boolean) || 'Donante Wompi';
      client = await this.prisma.clientDonor.create({
        data: {
          name,
          docType: 'Otro',
          docNumber: `WMP-${transactionId}`,
          email,
          status: 'Activo',
        },
      });
    }

    const donation = await this.prisma.donation.create({
      data: {
        clientId: client.id,
        amount,
        paymentGateway: 'Wompi',
        transactionId,
        status: 'Approved',
        campaign: tx.reference || null,
        concept: 'Donación vía Wompi',
        date: tx.created_at ? new Date(tx.created_at) : new Date(),
      },
    });

    await this.certificates.enqueueForDonation(donation.id);
    this.logger.log(`Donación Wompi ${transactionId} registrada y certificado generado`);
  }

  // ── Webhook PayU ─────────────────────────────────────────────
  @Post('payu')
  @HttpCode(HttpStatus.OK)
  async handlePayuEvent(@Body() body: Record<string, string>) {
    // PayU envía form-urlencoded, NestJS lo parsea como objeto plano
    const state         = body['transactionState'];  // '4' = aprobada
    const referenceCode = body['referenceCode'];
    const amount        = body['TX_VALUE'];
    const currency      = body['currency'];
    const sign          = body['sign'];
    const transactionId = body['transactionId'];
    const buyerEmail    = body['buyerEmail'];
    const description   = body['description'];

    if (!state || !referenceCode) {
      throw new BadRequestException('Payload de PayU inválido');
    }

    // Verificar firma MD5 si las credenciales están configuradas
    if (this.payuApiKey && this.payuMerchantId && sign) {
      const amountForSign = parseFloat(amount).toFixed(1);
      const raw = `${this.payuApiKey}~${this.payuMerchantId}~${referenceCode}~${amountForSign}~${currency}~${state}`;
      const expected = crypto.createHash('md5').update(raw).digest('hex');
      if (expected !== sign) {
        this.logger.warn('Firma PayU inválida, rechazando evento');
        throw new UnauthorizedException('Firma de PayU inválida');
      }
    }

    // Solo procesar transacciones aprobadas
    if (state !== '4') {
      return { received: true, action: 'skipped', reason: `Estado ${state} no es aprobado` };
    }

    const existing = await this.prisma.donation.findFirst({
      where: {
        OR: [
          { transactionId: transactionId || referenceCode },
          { transactionId: referenceCode },
        ],
      },
    });
    if (existing) {
      this.logger.log(`Transacción PayU ${referenceCode} ya procesada (idempotencia)`);
      return { received: true, action: 'skipped', reason: 'already_processed' };
    }

    const email = buyerEmail || `payu_${referenceCode}@santiagocorazon.org`;

    let client = await this.prisma.clientDonor.findFirst({ where: { email } });
    if (!client) {
      client = await this.prisma.clientDonor.create({
        data: {
          name: body['buyerFullName'] || 'Donante PayU',
          docType: 'Otro',
          docNumber: `PYU-${referenceCode}`,
          email,
          status: 'Activo',
        },
      });
    }

    const donation = await this.prisma.donation.create({
      data: {
        clientId: client.id,
        amount: parseFloat(amount) || 0,
        paymentGateway: 'PayU',
        transactionId: transactionId || referenceCode,
        status: 'Approved',
        campaign: referenceCode || null,
        concept: description || 'Donación vía PayU',
      },
    });

    await this.certificates.enqueueForDonation(donation.id);
    this.logger.log(`Donación PayU ${referenceCode} registrada y certificado generado`);
    return { received: true, action: 'created' };
  }

  // ── Simulación Wompi (requiere JWT) ──────────────────────────
  @Post('wompi/simulate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async simulateWompi(@Body() body: {
    amount?: number;
    email?: string;
    donorName?: string;
    reference?: string;
  }) {
    const txId = `SIM-WMP-${Date.now()}`;
    const tx = {
      id: txId,
      status: 'APPROVED',
      amount_in_cents: (body.amount ?? 50000) * 100,
      currency: 'COP',
      customer_email: body.email ?? `simulacion_${txId}@test.dev`,
      customer_data: { full_name: body.donorName ?? 'Donante Simulado' },
      reference: body.reference ?? `REF-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    await this.processWompiTransaction(tx);
    return { status: 'success', transactionId: txId };
  }

  private verifyHmac(rawBody: Buffer, signature: string): boolean {
    if (!this.shopifySecret) {
      this.logger.warn('SHOPIFY_WEBHOOK_SECRET no configurada — omitiendo validación HMAC.');
      return true;
    }
    const hash = crypto
      .createHmac('sha256', this.shopifySecret)
      .update(rawBody)
      .digest('base64');
    return hash === signature;
  }
}
