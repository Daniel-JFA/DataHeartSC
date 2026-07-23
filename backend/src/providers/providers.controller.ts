import {
  Controller, Post, Get, Patch, Param, Body, Query,
  UseGuards, UseInterceptors, UploadedFiles,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ProvidersService } from './providers.service';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';

const storage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'providers'),
  filename: (_req, file, cb) => {
    const unique = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, unique);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.xls'];
  if (allowed.includes(extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF, JPG, PNG o Excel (.xlsx)'), false);
  }
};

const uploadInterceptor = FileFieldsInterceptor(
  [
    { name: 'rut',              maxCount: 1 },
    { name: 'camaraComercio',   maxCount: 1 },
    { name: 'certBancaria',     maxCount: 1 },
    { name: 'formatoProveedor', maxCount: 1 },
  ],
  { storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }, // 5 MB por archivo
);

@Controller('providers')
export class ProvidersController {
  constructor(private service: ProvidersService) {}

  /** Registro público — sin autenticación */
  @Post('register')
  @UseInterceptors(uploadInterceptor)
  register(
    @Body() dto: RegisterProviderDto,
    @UploadedFiles() files: {
      rut?: Express.Multer.File[];
      camaraComercio?: Express.Multer.File[];
      certBancaria?: Express.Multer.File[];
      formatoProveedor?: Express.Multer.File[];
    },
  ) {
    return this.service.register(dto, files ?? {});
  }

  /** Lista de proveedores — protegida */
  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('inventario:read')
  findAll(
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(page, limit, search);
  }

  /** Actualizar estado (Pendiente → Aprobado | Rechazado) — protegida */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('inventario:write')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.service.updateStatus(id, status);
  }
}
