import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg(process.env['DATABASE_URL']!);
const prisma = new PrismaClient({ adapter });

// ─── Permisos por módulo (14 total) ──────────────────────────────────────────
const PERMISSIONS = [
  { keyName: 'ventas_donaciones:read',  name: 'Ver ventas y donaciones' },
  { keyName: 'ventas_donaciones:write', name: 'Gestionar ventas y donaciones' },
  { keyName: 'facturacion:read',        name: 'Ver facturación y recibos' },
  { keyName: 'facturacion:write',       name: 'Gestionar facturación y recibos' },
  { keyName: 'segmentacion:read',       name: 'Ver segmentación CRM' },
  { keyName: 'segmentacion:write',      name: 'Gestionar segmentación CRM' },
  { keyName: 'beneficiarios:read',      name: 'Ver módulo de beneficiarios' },
  { keyName: 'beneficiarios:write',     name: 'Gestionar módulo de beneficiarios' },
  { keyName: 'voluntarios:read',        name: 'Ver módulo de voluntarios' },
  { keyName: 'voluntarios:write',       name: 'Gestionar módulo de voluntarios' },
  { keyName: 'inventario:read',         name: 'Ver inventario y proveedores' },
  { keyName: 'inventario:write',        name: 'Gestionar inventario y proveedores' },
  { keyName: 'dashboards:read',         name: 'Ver dashboards y reportes' },
  { keyName: 'dashboards:write',        name: 'Gestionar dashboards y reportes' },
];

// ─── Roles reales de la Fundación (Matriz de Accesos v2 — Jul 2026) ──────────
const ROLES = [
  { name: 'DIRECTORA',                  description: 'Luisa Fernanda Muriel — solo lectura global en todos los módulos' },
  { name: 'LIDER_DATA_HEART',           description: 'Ana Maria Betancourt — acceso total a todos los módulos' },
  { name: 'ASISTENTE_CONTABLE',         description: 'Alejandra Betancur — ventas, facturación, inventario (total) + beneficiarios y dashboards (lectura)' },
  { name: 'CONTADORA',                  description: 'Doris Giraldo — ventas, facturación e inventario (acceso total)' },
  { name: 'LIDER_CLIENTES_BENEFACTORES',description: 'Paula Gómez — ventas, facturación y beneficiarios (total) + dashboards (lectura)' },
  { name: 'LIDER_ATENCION_FAMILIAS',    description: 'Marcela Gallego — ventas, inventario y beneficiarios (total) + dashboards (lectura)' },
  { name: 'LIDER_COMUNICACIONES',       description: 'Megan David — segmentación CRM (total) + ventas, beneficiarios, voluntarios y dashboards (lectura)' },
  // Roles técnicos heredados (se conservan para compatibilidad con el admin inicial)
  { name: 'Admin',    description: 'Administrador del sistema' },
  { name: 'Operador', description: 'Personal operativo' },
  { name: 'Contador', description: 'Acceso contable y exportaciones' },
];

// ─── Mapeo rol → permisos (Matriz de Accesos v2 — Jul 2026) ─────────────────
//
// Módulo                    DIRECTORA  DATA_HEART  ASIST_CONT  CONTADORA  CLIENTES  FAMILIAS  COMUNICACIONES
// Ventas y Donaciones       R          R+W         R+W         R+W        R+W       R+W       R
// Facturación y Recibos     R          R+W         R+W         R+W        R+W       —         —
// Proveedores e Inventario  R          R+W         R+W         R+W        —         R+W       —
// Módulo Beneficiarios      R          R+W         R           —          R+W       R+W       R
// Módulo Voluntarios        R          R+W         —           —          —         —         R
// Dashboards y Reportes     R          R+W         R           —          R         R         R
// Segmentación CRM          R          R+W         —           —          —         —         R+W
//
const ROLE_PERMISSIONS: Record<string, string[]> = {
  DIRECTORA: [
    'ventas_donaciones:read',
    'facturacion:read',
    'inventario:read',
    'beneficiarios:read',
    'voluntarios:read',
    'dashboards:read',
    'segmentacion:read',
  ],
  LIDER_DATA_HEART: [
    'ventas_donaciones:read', 'ventas_donaciones:write',
    'facturacion:read',       'facturacion:write',
    'inventario:read',        'inventario:write',
    'beneficiarios:read',     'beneficiarios:write',
    'voluntarios:read',       'voluntarios:write',
    'dashboards:read',        'dashboards:write',
    'segmentacion:read',      'segmentacion:write',
  ],
  ASISTENTE_CONTABLE: [
    'ventas_donaciones:read', 'ventas_donaciones:write',
    'facturacion:read',       'facturacion:write',
    'inventario:read',        'inventario:write',
    'beneficiarios:read',
    'dashboards:read',
  ],
  CONTADORA: [
    'ventas_donaciones:read', 'ventas_donaciones:write',
    'facturacion:read',       'facturacion:write',
    'inventario:read',        'inventario:write',
  ],
  // CAMBIO v2: Paula pierde Voluntarios, gana Beneficiarios (total)
  LIDER_CLIENTES_BENEFACTORES: [
    'ventas_donaciones:read', 'ventas_donaciones:write',
    'facturacion:read',       'facturacion:write',
    'beneficiarios:read',     'beneficiarios:write',
    'dashboards:read',
  ],
  LIDER_ATENCION_FAMILIAS: [
    'ventas_donaciones:read', 'ventas_donaciones:write',
    'inventario:read',        'inventario:write',
    'beneficiarios:read',     'beneficiarios:write',
    'dashboards:read',
  ],
  LIDER_COMUNICACIONES: [
    'ventas_donaciones:read',
    'segmentacion:read', 'segmentacion:write',
    'beneficiarios:read',
    'voluntarios:read',
    'dashboards:read',
  ],
  // Admin heredado: acceso total
  Admin: [
    'ventas_donaciones:read', 'ventas_donaciones:write',
    'facturacion:read',       'facturacion:write',
    'inventario:read',        'inventario:write',
    'beneficiarios:read',     'beneficiarios:write',
    'voluntarios:read',       'voluntarios:write',
    'dashboards:read',        'dashboards:write',
    'segmentacion:read',      'segmentacion:write',
  ],
};

// ─── Usuarios reales de la Fundación ─────────────────────────────────────────
const USERS = [
  { email: 'luisa@santiagocorazon.org',    firstName: 'Luisa',     lastName: 'Muriel',      roleName: 'DIRECTORA',                   password: 'dataheart2026' },
  { email: 'ana@santiagocorazon.org',      firstName: 'Ana',       lastName: 'Betancourt',  roleName: 'LIDER_DATA_HEART',             password: 'dataheart2026' },
  { email: 'alejandra@santiagocorazon.org',firstName: 'Alejandra', lastName: 'Betancur',    roleName: 'ASISTENTE_CONTABLE',           password: 'dataheart2026' },
  { email: 'doris@santiagocorazon.org',    firstName: 'Doris',     lastName: 'Giraldo',     roleName: 'CONTADORA',                   password: 'dataheart2026' },
  { email: 'paula@santiagocorazon.org',    firstName: 'Paula',     lastName: 'Gomez',       roleName: 'LIDER_CLIENTES_BENEFACTORES', password: 'dataheart2026' },
  { email: 'marcela@santiagocorazon.org',  firstName: 'Marcela',   lastName: 'Gallego',     roleName: 'LIDER_ATENCION_FAMILIAS',     password: 'dataheart2026' },
  { email: 'megan@santiagocorazon.org',    firstName: 'Megan',     lastName: 'David',       roleName: 'LIDER_COMUNICACIONES',        password: 'dataheart2026' },
];

async function main() {
  console.log('🌱 Iniciando seed de roles, permisos y usuarios...\n');

  // 1. Upsert permisos
  const permMap: Record<string, string> = {};
  for (const p of PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { keyName: p.keyName },
      update: { name: p.name },
      create: { name: p.name, keyName: p.keyName },
    });
    permMap[p.keyName] = perm.id;
  }
  console.log(`✅ ${PERMISSIONS.length} permisos upsertados`);

  // 2. Upsert roles
  const roleMap: Record<string, string> = {};
  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });
    roleMap[r.name] = role.id;
  }
  console.log(`✅ ${ROLES.length} roles upsertados`);

  // 3. Limpiar y re-crear mapeos rol → permisos (delete+create = idempotente real)
  let mappingCount = 0;
  for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleName];
    if (!roleId) continue;
    // Borra todos los permisos actuales del rol antes de re-asignar
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    for (const key of permKeys) {
      const permissionId = permMap[key];
      if (!permissionId) continue;
      await prisma.rolePermission.create({ data: { roleId, permissionId } });
      mappingCount++;
    }
  }
  console.log(`✅ ${mappingCount} mappings rol→permiso re-creados (matriz v2)`);

  // 4. Upsert usuarios reales (contraseña temporal: dataheart2026)
  for (const u of USERS) {
    const roleId = roleMap[u.roleName];
    const passwordHash = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { roleId },
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        roleId,
      },
    });
  }
  console.log(`✅ ${USERS.length} usuarios reales upsertados`);

  // 5. Mantener usuario admin técnico con rol Admin
  const adminRoleId = roleMap['Admin'];
  const adminHash = await bcrypt.hash('admin2026', 12);
  await prisma.user.upsert({
    where: { email: 'admin@santiagocorazon.org' },
    update: { roleId: adminRoleId },
    create: {
      email: 'admin@santiagocorazon.org',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'Sistema',
      roleId: adminRoleId,
    },
  });
  console.log('✅ Usuario admin técnico mantenido (admin@santiagocorazon.org / admin2026)\n');

  console.log('─────────────────────────────────────────────');
  console.log('Usuarios disponibles (contraseña: dataheart2026):');
  USERS.forEach((u) => console.log(`  ${u.email}  →  ${u.roleName}`));
  console.log('─────────────────────────────────────────────');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
