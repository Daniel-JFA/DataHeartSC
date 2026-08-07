export class SendTextDto {
  to: string;       // número en formato internacional sin + ej: 573001234567
  message: string;
}

export class SendTemplateDto {
  to: string;
  templateName: string;
  language: string;         // ej: 'es_CO'
  params?: string[];        // parámetros del body en orden, ej: ['Juan', 'Pérez']
}

export class BlastTemplateDto {
  phones: string[];         // lista de números
  templateName: string;
  language: string;
  params?: string[];
}
