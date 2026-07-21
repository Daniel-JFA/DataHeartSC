import {
  Controller, Post, Headers, Req, Body,
  BadRequestException, UnauthorizedException,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import * as crypto from 'crypto';

@Controller('webhooks')
export class WebhooksController {
  private webhookSecret: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.webhookSecret = this.config.get<string>('SHOPIFY_WEBHOOK_SECRET') || '';
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

  private verifyHmac(rawBody: Buffer, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('SHOPIFY_WEBHOOK_SECRET no configurada — omitiendo validación HMAC.');
      return true;
    }
    const hash = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('base64');
    return hash === signature;
  }
}
