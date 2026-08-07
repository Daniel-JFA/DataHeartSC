import {
  Controller, Get, Post, Body, Query,
  Res, HttpCode, HttpStatus, Logger,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { WhatsappService } from './whatsapp.service';
import { SendTextDto, SendTemplateDto, BlastTemplateDto } from './dto/send-whatsapp.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private whatsapp: WhatsappService) {}

  // ── Verificación del webhook (Meta llama esto al configurar) ────────────
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode')         mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge')    challenge: string,
    @Res() res: Response,
  ) {
    const result = this.whatsapp.verifyWebhook(mode, token, challenge);
    if (result !== null) {
      res.status(200).send(result);
    } else {
      res.status(403).json({ message: 'Token de verificación inválido' });
    }
  }

  // ── Recibir eventos de Meta (mensajes entrantes, status, etc.) ──────────
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  receiveWebhook(@Body() body: any) {
    this.whatsapp.processWebhook(body);
    return 'EVENT_RECEIVED';
  }

  // ── Enviar texto — solo dentro de la ventana de 24 h ───────────────────
  @Post('send-text')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('segmentacion:write')
  sendText(@Body() dto: SendTextDto) {
    return this.whatsapp.sendText(dto.to, dto.message).then(ok => ({ ok }));
  }

  // ── Enviar plantilla aprobada por Meta ──────────────────────────────────
  @Post('send-template')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('segmentacion:write')
  sendTemplate(@Body() dto: SendTemplateDto) {
    return this.whatsapp.sendTemplate({
      to:           dto.to,
      templateName: dto.templateName,
      language:     dto.language,
      params:       dto.params,
    }).then(ok => ({ ok }));
  }

  // ── Envío masivo a lista de difusión ────────────────────────────────────
  @Post('blast')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('segmentacion:write')
  blast(@Body() dto: BlastTemplateDto) {
    return this.whatsapp.blast({
      phones:       dto.phones,
      templateName: dto.templateName,
      language:     dto.language,
      params:       dto.params,
    });
  }
}
