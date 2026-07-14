// @ts-nocheck
/**
 * Script de verificação e criação de usuários de teste
 * Executar com: npx tsx src/scripts/check-test-users.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureTestUsers() {
  console.log('🔍 Verificando usuários de teste...');
  
  const passwordHash = await bcrypt.hash('123456', 10);
  
  const testUsers = [
    {
      email: 'admin@aldeias.pt',
      nome: 'Administrador Global',
      telefone: '+351900000001',
      role: 'super_admin' as const,
      emailVerificado: true,
      saldo: 1000,
    },
    {
      email: 'admin.valeazinha@aldeias.pt',
      nome: 'Administrador Vale de Azinha',
      telefone: '+351275000001',
      role: 'aldeia_admin' as const,
      emailVerificado: true,
      saldo: 100,
    },
    {
      email: 'vendedor1@valeazinha.pt',
      nome: 'Vendedor Teste',
      telefone: '+351910000011',
      role: 'vendedor' as const,
      emailVerificado: true,
      saldo: 50,
    },
    {
      email: 'jogador1@valeazinha.pt',
      nome: 'Jogador Teste',
      telefone: '+351930000001',
      role: 'user' as const,
      emailVerificado: true,
      saldo: 20,
    },
  ];
  
  for (const userData of testUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    
    if (existing) {
      console.log(`✅ Usuário já existe: ${userData.email} (${userData.role})`);
      // Atualiza se necessário
      await prisma.user.update({
        where: { email: userData.email },
        data: {
          password: passwordHash,
          nome: userData.nome,
          telefone: userData.telefone,
          role: userData.role,
          emailVerificado: true,
          saldo: userData.saldo,
        },
      });
    } else {
      console.log(`🆕 Criando usuário: ${userData.email} (${userData.role})`);
      await prisma.user.create({
        data: {
          email: userData.email,
          password: passwordHash,
          nome: userData.nome,
          telefone: userData.telefone,
          role: userData.role,
          emailVerificado: userData.emailVerificado,
          saldo: userData.saldo,
        },
      });
    }
  }
  
  console.log('\n✅ Todos os usuários de teste estão configurados!');
  
  // Listar todos
  const users = await prisma.user.findMany({
    select: { email: true, role: true, nome: true, saldo: true },
  });
  
  console.log('\n📋 Usuários no banco:');
  users.forEach((u) => {
    console.log(`   - ${u.email} (${u.role}) - Saldo: ${u.saldo}€`);
  });
  
  await prisma.$disconnect();
}

ensureTestUsers().catch((error) => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
