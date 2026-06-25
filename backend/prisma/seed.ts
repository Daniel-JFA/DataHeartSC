import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg(process.env['DATABASE_URL']!);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin', description: 'Administrador del sistema' },
  });

  await prisma.role.upsert({
    where: { name: 'Operador' },
    update: {},
    create: { name: 'Operador', description: 'Personal operativo' },
  });

  await prisma.role.upsert({
    where: { name: 'Contador' },
    update: {},
    create: { name: 'Contador', description: 'Acceso contable y exportaciones' },
  });

  // Usuario admin inicial
  const passwordHash = await bcrypt.hash('admin2026', 12);
  await prisma.user.upsert({
    where: { email: 'admin@santiagocorazon.org' },
    update: {},
    create: {
      email: 'admin@santiagocorazon.org',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Sistema',
      roleId: adminRole.id,
    },
  });

  console.log('✅ Seed completado: roles y usuario admin creados');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
