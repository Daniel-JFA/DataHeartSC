/**
 * ETL: Importar voluntarios y sus apoyos desde Excel
 *
 * Fuentes:
 *   - "Datos Personales junio.xlsx"  → tabla volunteers
 *   - "Apoyos Junio.xlsx"            → tabla volunteer_supports
 *
 * Uso:
 *   npx ts-node --project tsconfig.json prisma/etl-volunteers.ts \
 *     --volunteers "../Datos Personales junio.xlsx" \
 *     --apoyos "../Apoyos Junio.xlsx"
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as XLSX from 'xlsx';
import * as path from 'path';

const adapter = new PrismaPg(process.env['DATABASE_URL']!);
const prisma = new PrismaClient({ adapter });

// ---------- helpers ----------

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    return new Date(d.y, d.m - 1, d.d);
  }
  if (typeof v === 'string') {
    const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  return String(v).trim() || null;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// ---------- importar voluntarios ----------

async function importVolunteers(filePath: string) {
  console.log(`\n📄 Leyendo voluntarios: ${filePath}`);
  const wb = XLSX.readFile(filePath, { cellDates: true, dense: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });

  let created = 0, updated = 0, skipped = 0;

  for (const row of rows) {
    const docNumber = str(row['Cédula']);
    if (!docNumber) { skipped++; continue; }

    const data = {
      firstName:    str(row['Nombres'])              ?? 'Sin nombre',
      lastName:     str(row['Apellidos'])             ?? 'Sin apellido',
      docType:      str(row['Tipo Documento'])        ?? 'Cédula de Ciudadanía',
      birthDate:    parseDate(row['Fecha de Nacimiento']),
      birthCity:    str(row['Ciudad de Nacimiento']),
      email:        str(row['Correo Electrónico']),
      phone:        str(row['Celular']),
      address:      str(row['Dirección']),
      city:         str(row['Ciudad Residencia']),
      department:   str(row['Departamento']),
      eps:          str(row['EPS']),
      occupation:   str(row['Ocupación']),
      shirtSize:    str(row['Talla de Camiseta']),
      availability: str(row['Disponibilidad tiempo']),
      segment:      str(row['Grupo segmento']),
      supportNeeds: str(row['Apoyo necesidades']),
      expectations: str(row['Expectativas']),
      joinDate:     parseDate(row['Fecha Ingreso']) ?? new Date(),
      lastUpdatedAt:parseDate(row['Fecha Actualización']),
    };

    try {
      const existing = await prisma.volunteer.findUnique({ where: { docNumber } });
      if (existing) {
        await prisma.volunteer.update({ where: { docNumber }, data });
        updated++;
      } else {
        await prisma.volunteer.create({ data: { docNumber, ...data } });
        created++;
      }
    } catch (e: any) {
      console.warn(`  ⚠️  doc ${docNumber}: ${e.message}`);
      skipped++;
    }
  }

  console.log(`  ✅ Voluntarios: ${created} creados, ${updated} actualizados, ${skipped} omitidos`);
}

// ---------- importar apoyos ----------

async function importApoyos(filePath: string) {
  console.log(`\n📄 Leyendo apoyos: ${filePath}`);
  const wb = XLSX.readFile(filePath, { cellDates: true, dense: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });

  let created = 0, skipped = 0;

  for (const row of rows) {
    const volunteerDoc = str(row['Nro documento']);
    if (!volunteerDoc) { skipped++; continue; }

    const date = parseDate(row['Fecha del Apoyo']);
    if (!date) { skipped++; continue; }

    // Verificar que el voluntario exista
    const volunteer = await prisma.volunteer.findUnique({ where: { docNumber: volunteerDoc } });
    if (!volunteer) {
      console.warn(`  ⚠️  Voluntario no encontrado: ${volunteerDoc}`);
      skipped++;
      continue;
    }

    try {
      await prisma.volunteerSupport.create({
        data: {
          volunteerDoc,
          date,
          hours:     num(row['Horas Donadas']),
          type:      str(row['Apoyo']),
          mealValue: num(row['Valor alimentación']),
          notes:     str(row['Observaciones']),
        },
      });
      created++;
    } catch (e: any) {
      console.warn(`  ⚠️  Apoyo doc ${volunteerDoc} fecha ${date}: ${e.message}`);
      skipped++;
    }
  }

  console.log(`  ✅ Apoyos: ${created} creados, ${skipped} omitidos`);
}

// ---------- main ----------

async function main() {
  const args = process.argv.slice(2);
  const idx = (flag: string) => args.indexOf(flag);

  const volunteersFile = idx('--volunteers') >= 0
    ? path.resolve(args[idx('--volunteers') + 1])
    : path.resolve(__dirname, '../../Datos Personales junio.xlsx');

  const apoyosFile = idx('--apoyos') >= 0
    ? path.resolve(args[idx('--apoyos') + 1])
    : path.resolve(__dirname, '../../Apoyos Junio.xlsx');

  console.log('🚀 ETL Voluntarios — DataHeartSC');

  await importVolunteers(volunteersFile);
  await importApoyos(apoyosFile);

  console.log('\n🎉 Importación completada');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
