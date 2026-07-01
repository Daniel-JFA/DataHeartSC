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

// ─── Roles reales de la Fundación (Matriz de Accesos) ────────────────────────
const ROLES = [
  { name: 'DIRECTORA',                  description: 'Directora de la fundación — solo lectura global' },
  { name: 'LIDER_DATA_HEART',           description: 'Líder Data Heart — acceso total a todos los módulos' },
  { name: 'ASISTENTE_CONTABLE',         description: 'Asistente Contable — finanzas, inventario y beneficiarios (lectura)' },
  { name: 'CONTADORA',                  description: 'Contadora — finanzas e inventario únicamente' },
  { name: 'LIDER_CLIENTES_BENEFACTORES',description: 'Líder Atención Clientes y Benefactores — ventas, facturación, voluntarios' },
  { name: 'LIDER_ATENCION_FAMILIAS',    description: 'Líder Atención Familias — ventas, beneficiarios, inventario' },
  { name: 'LIDER_COMUNICACIONES',       description: 'Líder Comunicaciones — segmentación CRM, lectura ventas y beneficiarios' },
  // Roles técnicos heredados (se conservan para compatibilidad con el admin inicial)
  { name: 'Admin',    description: 'Administrador del sistema' },
  { name: 'Operador', description: 'Personal operativo' },
  { name: 'Contador', description: 'Acceso contable y exportaciones' },
];

// ─── Mapeo rol → permisos (según Matriz de Accesos - Roles.jpeg) ─────────────
const ROLE_PERMISSIONS: Record<string, string[]> = {
  DIRECTORA: [
    'ventas_donaciones:read', 'facturacion:read', 'segmentacion:read',
    'beneficiarios:read', 'voluntarios:read', 'inventario:read', 'dashboards:read',
  ],
  LIDER_DATA_HEART: [
    'ventas_donaciones:read', 'ventas_donaciones:write',
    'facturacion:read',       'facturacion:write',
    'segmentacion:read',      'segmentacion:write',
    'beneficiarios:read',     'beneficiarios:write',
    'voluntarios:read',       'voluntarios:write',
    'inventario:read',        'inventario:write',
    'dashboards:read',        'dashboards:write',
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
  LIDER_CLIENTES_BENEFACTORES: [
    'ventas_donaciones:read', 'ventas_donaciones:write',
    'facturacion:read',       'facturacion:write',
    'voluntarios:read',       'voluntarios:write',
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
  // Admin heredado: acceso total (igual que LIDER_DATA_HEART)
  Admin: [
    'ventas_donaciones:read', 'ventas_donaciones:write',
    'facturacion:read',       'facturacion:write',
    'segmentacion:read',      'segmentacion:write',
    'beneficiarios:read',     'beneficiarios:write',
    'voluntarios:read',       'voluntarios:write',
    'inventario:read',        'inventario:write',
    'dashboards:read',        'dashboards:write',
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

  // 3. Mapear rol → permisos (upsert en role_permissions)
  let mappingCount = 0;
  for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleName];
    if (!roleId) continue;
    for (const key of permKeys) {
      const permissionId = permMap[key];
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
      mappingCount++;
    }
  }
  console.log(`✅ ${mappingCount} mappings rol→permiso creados`);

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
