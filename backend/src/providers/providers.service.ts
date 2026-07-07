import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterProviderDto } from './dto/register-provider.dto';

interface UploadedFiles {
  rut?: Express.Multer.File[];
  camaraComercio?: Express.Multer.File[];
  certBancaria?: Express.Multer.File[];
  formatoProveedor?: Express.Multer.File[];
}

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterProviderDto, files: UploadedFiles) {
    const existing = await this.prisma.provider.findUnique({
      where: { docNumber: dto.docNumber },
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe un proveedor con el documento ${dto.docNumber}.`,
      );
    }

    const filePath = (f?: Express.Multer.File[]) =>
      f?.[0]?.path?.replace(/\\/g, '/') ?? null;

    return this.prisma.provider.create({
      data: {
        // Base
        name:                       dto.name,
        docType:                    dto.docType,
        docNumber:                  dto.docNumber,
        contactName:                dto.contactName ?? null,
        phone:                      dto.phone ?? null,
        email:                      dto.email ?? null,
        address:                    dto.address ?? null,
        city:                       dto.city ?? null,
        department:                 dto.department ?? null,
        status:                     'Pendiente',
        // Sección 1
        tipoSolicitud:              dto.tipoSolicitud ?? null,
        tipoSolicitudOtro:          dto.tipoSolicitudOtro ?? null,
        // Sección 2
        naturaleza:                 dto.naturaleza ?? null,
        formaPagoTipo:              dto.formaPagoTipo ?? null,
        diasCredito:                dto.diasCredito ?? null,
        // Sección 3 - Persona Natural
        lugarExpedicion:            dto.lugarExpedicion ?? null,
        fechaExpedicion:            dto.fechaExpedicion ?? null,
        nationality:                dto.nationality ?? null,
        departamentoResidencia:     dto.departamentoResidencia ?? null,
        ciudadResidencia:           dto.ciudadResidencia ?? null,
        telefonoDomicilio:          dto.telefonoDomicilio ?? null,
        primerApellido:             dto.primerApellido ?? null,
        segundoApellido:            dto.segundoApellido ?? null,
        primerNombre:               dto.primerNombre ?? null,
        segundoNombre:              dto.segundoNombre ?? null,
        // Sección 4 - Persona Jurídica
        nit:                        dto.nit ?? null,
        digitoVerificacion:         dto.digitoVerificacion ?? null,
        correoEmpresa:              dto.correoEmpresa ?? null,
        telefonoEmpresa:            dto.telefonoEmpresa ?? null,
        direccionOficina:           dto.direccionOficina ?? null,
        repLegal:                   (dto.repLegal ?? undefined) as never,
        // Sección 5
        actividadTipo:              dto.actividadTipo ?? null,
        actividadOtro:              dto.actividadOtro ?? null,
        codigoCIIU:                 dto.codigoCIIU ?? null,
        descripcionActividad:       dto.descripcionActividad ?? null,
        // Sección 6
        formaPago:                  dto.formaPago ?? null,
        tipoCuenta:                 dto.tipoCuenta ?? null,
        numeroCuenta:               dto.numeroCuenta ?? null,
        diasPago:                   dto.diasPago ?? null,
        // Sección 7
        factNombre:                 dto.factNombre ?? null,
        factCargo:                  dto.factCargo ?? null,
        factTelefono:               dto.factTelefono ?? null,
        factExt:                    dto.factExt ?? null,
        factCelular:                dto.factCelular ?? null,
        factEmail:                  dto.factEmail ?? null,
        // Sección 8
        referencias:                (dto.referencias ?? undefined) as never,
        // Sección 9
        accionistas:                (dto.accionistas ?? undefined) as never,
        // Sección 10
        totalActivos:               dto.totalActivos ?? null,
        totalPasivos:               dto.totalPasivos ?? null,
        totalPatrimonio:            dto.totalPatrimonio ?? null,
        ingresosMensuales:          dto.ingresosMensuales ?? null,
        egresosMensuales:           dto.egresosMensuales ?? null,
        otrosIngresosMensuales:     dto.otrosIngresosMensuales ?? null,
        conceptoOtrosIngresos:      dto.conceptoOtrosIngresos ?? null,
        // Sección 11
        operaciones:                (dto.operaciones ?? undefined) as never,
        // Sección 12
        manejaRecursosPublicos:     dto.manejaRecursosPublicos ?? null,
        tieneReconocimientoPublico: dto.tieneReconocimientoPublico ?? null,
        ejercePoder:                dto.ejercePoder ?? null,
        esFamiliarPPE:              dto.esFamiliarPPE ?? null,
        familiarPPEInfo:            dto.familiarPPEInfo ?? null,
        // Sección 13
        aceptaDeclaracion:          dto.aceptaDeclaracion,
        aceptaTratamientoDatos:     dto.aceptaTratamientoDatos,
        // Archivos
        rutPath:                    filePath(files.rut),
        camaraComercioPath:         filePath(files.camaraComercio),
        certBancariaPath:           filePath(files.certBancaria),
        formatoProveedorPath:       filePath(files.formatoProveedor),
      },
    });
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const where = search
      ? {
          OR: [
            { name:       { contains: search, mode: 'insensitive' as const } },
            { docNumber:  { contains: search, mode: 'insensitive' as const } },
            { email:      { contains: search, mode: 'insensitive' as const } },
            { city:       { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.provider.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.provider.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.provider.update({
      where: { id },
      data: { status },
    });
  }
}
