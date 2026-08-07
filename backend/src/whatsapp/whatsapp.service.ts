import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const META_API = 'https://graph.facebook.com/v20.0';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly phoneNumberId: string | null;
  private readonly accessToken: string | null;
  private readonly verifyToken: string;
  private readonly configured: boolean;

  constructor(private config: ConfigService) {
    this.phoneNumberId = this.config.get<string>('WABA_PHONE_NUMBER_ID') || null;
    this.accessToken   = this.config.get<string>('WABA_ACCESS_TOKEN')   || null;
    this.verifyToken   = this.config.get<string>('WABA_WEBHOOK_VERIFY_TOKEN') || 'dataheart_waba';
    this.configured    = !!(this.phoneNumberId && this.accessToken);

    if (this.configured) {
      this.logger.log('WhatsApp Business API configurada.');
    } else {
      this.logger.warn('WhatsApp no configurado — los mensajes se omitirán. Configura WABA_PHONE_NUMBER_ID y WABA_ACCESS_TOKEN en .env');
    }
  }

  // ── Verificación del webhook de Meta ────────────────────────────────────
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logger.log('Webhook de WhatsApp verificado por Meta.');
      return challenge;
    }
    return null;
  }

  // ── Procesar evento entrante del webhook ────────────────────────────────
  processWebhook(body: any): void {
    const entries: any[] = body?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry?.changes ?? []) {
        const messages: any[] = change?.value?.messages ?? [];
        for (const msg of messages) {
          const from = msg.from;
          const text = msg.text?.body ?? msg.type;
          this.logger.log(`Mensaje entrante de ${from}: ${text}`);
          // TODO: persistir en BD, disparar flujos automáticos
        }
      }
    }
  }

  // ── Enviar mensaje de texto (ventana de 24 h) ───────────────────────────
  async sendText(to: string, message: string): Promise<boolean> {
    if (!this.configured) {
      this.logger.warn(`[SIMULADO] Texto a ${to}: ${message}`);
      return false;
    }
    const payload = {
      messaging_product: 'whatsapp',
      to: this.normalizePhone(to),
      type: 'text',
      text: { body: message },
    };
    return this.post(payload);
  }

  // ── Enviar plantilla aprobada por Meta ──────────────────────────────────
  async sendTemplate(opts: {
    to: string;
    templateName: string;
    language?: string;
    params?: string[];
  }): Promise<boolean> {
    if (!this.configured) {
      this.logger.warn(`[SIMULADO] Template "${opts.templateName}" a ${opts.to}`);
      return false;
    }

    const components: any[] = [];
    if (opts.params?.length) {
      components.push({
        type: 'body',
        parameters: opts.params.map(p => ({ type: 'text', text: p })),
      });
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: this.normalizePhone(opts.to),
      type: 'template',
      template: {
        name: opts.templateName,
        language: { code: opts.language ?? 'es_CO' },
        ...(components.length ? { components } : {}),
      },
    };
    return this.post(payload);
  }

  // ── Envío masivo a lista de difusión ────────────────────────────────────
  async blast(opts: {
    phones: string[];
    templateName: string;
    language?: string;
    params?: string[];
  }): Promise<{ sent: number; failed: number; total: number }> {
    let sent = 0;
    let failed = 0;

    for (const phone of opts.phones) {
      const ok = await this.sendTemplate({
        to: phone,
        templateName: opts.templateName,
        language: opts.language,
        params: opts.params,
      });
      ok ? sent++ : failed++;
      // Pequeña pausa para no superar el rate-limit de Meta (80 msg/s)
      await this.sleep(15);
    }

    this.logger.log(`Blast "${opts.templateName}": ${sent} enviados, ${failed} fallidos de ${opts.phones.length}`);
    return { sent, failed, total: opts.phones.length };
  }

  // ── Internos ─────────────────────────────────────────────────────────────
  private async post(payload: object): Promise<boolean> {
    const url = `${META_API}/${this.phoneNumberId}/messages`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        this.logger.error(`Meta API error ${res.status}:`, JSON.stringify(err));
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error('Error llamando Meta API:', err);
      return false;
    }
  }

  private normalizePhone(phone: string): string {
    // Quitar espacios, guiones, paréntesis y el + inicial
    return phone.replace(/[\s\-().+]/g, '');
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
