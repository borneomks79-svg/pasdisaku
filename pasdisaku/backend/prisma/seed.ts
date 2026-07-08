import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);

  await prisma.adminUser.upsert({
    where: { email: 'admin@pasdisaku.local' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@pasdisaku.local',
      passwordHash,
      role: 'super_admin',
    },
  });

  // Contoh markup rule global default: markup 20%
  await prisma.markupRule.upsert({
    where: { id: 1n },
    update: {},
    create: {
      name: 'Markup Global Default',
      scope: 'global',
      ruleType: 'percentage',
      value: 20,
      priority: 0,
    },
  });

  console.log('Seed selesai. Login: admin@pasdisaku.local / ChangeMe123! (segera ganti password ini)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
