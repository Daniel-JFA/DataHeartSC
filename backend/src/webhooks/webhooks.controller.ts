import { Controller, Post, Headers, Req, BadRequestException, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
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

    // Validar firma HMAC SHA256
    const isValid = this.verifyHmac(req.rawBody, signature);
    if (!isValid) {
      throw new UnauthorizedException('Firma del webhook de Shopify inválida');
    }

    // Shopify envía pedidos en el topic "orders/create" o "orders/paid" etc.
    const payload = JSON.parse(req.rawBody.toString('utf8'));

    // Validar idempotencia (evitar procesar el mismo webhook múltiples veces)
    const shopifyOrderId = String(payload.id);
    const invoiceRef = `Shopify #${payload.order_number || payload.number || shopifyOrderId}`;
    
    const existingOrder = await this.prisma.order.findFirst({
      where: { invoiceNumber: invoiceRef },
    });

    const isPaid = payload.financial_status === 'paid' || payload.financial_status === 'authorized';

    if (existingOrder) {
      if (isPaid && existingOrder.paymentStatus !== 'Pagado') {
        const updated = await this.prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            paymentStatus: 'Pagado',
            status: 'Entregado',
          },
        });
        return { status: 'success', message: 'Pedido actualizado a Pagado (Shopify webhook)', orderId: updated.id };
      }
      return { status: 'success', message: 'Pedido ya procesado (idempotencia aplicada)' };
    }

    // Obtener o crear el cliente (ClientDonor)
    const customer = payload.customer || {};
    const customerEmail = customer.email || `shopify_no_email_${shopifyOrderId}@santiagocorazon.org`;
    const customerPhone = customer.phone || customer.default_address?.phone || '';
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
          phone: customerPhone || null,
          email: customer.email || null,
          address: customer.default_address?.address1 || null,
          city: customer.default_address?.city || null,
          neighborhood: customer.default_address?.address2 || null,
          status: 'Activo',
        },
      });
    }

    // Crear el Pedido (Order)
    const totalAmount = payload.total_price || '0.00';

    const order = await this.prisma.order.create({
      data: {
        clientId: client.id,
        orderDate: new Date(payload.created_at || Date.now()),
        status: isPaid ? 'Entregado' : 'Recibido',
        totalAmount: totalAmount,
        paymentStatus: isPaid ? 'Pagado' : 'Pendiente',
        source: 'Shopify',
        orderType: 'Venta',
        invoiceNumber: invoiceRef,
        canalAtencion: 'Sitio Web',
        municipioEntrega: payload.shipping_address?.city || customer.default_address?.city || null,
      },
    });

    // Crear los items del pedido (OrderItems)
    const lineItems = payload.line_items || [];
    for (const item of lineItems) {
      const itemSku = item.sku || `SKU-TEMP-${item.product_id || 'UNKNOWN'}`;
      
      // Buscar producto por SKU en nuestra DB
      let product = await this.prisma.product.findUnique({
        where: { sku: itemSku },
      });

      // Si el producto no existe, lo creamos dinámicamente para no romper la importación
      if (!product) {
        product = await this.prisma.product.create({
          data: {
            sku: itemSku,
            name: item.title || item.name || 'Producto Shopify Desconocido',
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
      const subtotal = String(Number(unitPrice) * quantity);

      await this.prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: quantity,
          unitPrice: unitPrice,
          subtotal: subtotal,
        },
      });

      // Descontar inventario de insumos (materias primas) si el producto tiene receta
      // Esto forma parte del descuento automático transaccional de Hito 5,
      // pero actualizamos el stock del producto directamente si aplica.
      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          stock: {
            decrement: quantity,
          },
        },
      });
    }

    return {
      status: 'success',
      orderId: order.id,
      invoiceNumber: invoiceRef,
    };
  }

  private verifyHmac(rawBody: Buffer, signature: string): boolean {
    if (!this.webhookSecret) {
      // En desarrollo, si no hay secret configurado, permitimos continuar con un warning
      console.warn('SHOPIFY_WEBHOOK_SECRET no está configurada. Omitiendo validación HMAC temporalmente.');
      return true;
    }
    const hash = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('base64');
    return hash === signature;
  }
}
