// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);
  const users = [
    { email: 'admin@aldeias.pt', nome: 'Super Admin', role: 'super_admin' as const },
    { email: 'aldeia@gmail.com', nome: 'Aldeia Admin', role: 'aldeia_admin' as const },
    { email: 'vendedor@gmail.com', nome: 'Vendedor', role: 'vendedor' as const },
    { email: 'smpsandro1239@gmail.com', nome: 'Jogador', role: 'user' as const },
  ];

  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        password: passwordHash,
        nome: user.nome,
        role: user.role,
        emailVerificado: true,
        saldo: 1000,
      },
      create: {
        email: user.email,
        password: passwordHash,
        nome: user.nome,
        role: user.role,
        emailVerificado: true,
        saldo: 1000,
      },
    });
    console.log(`✅ ${user.email} -> ${created.role}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
