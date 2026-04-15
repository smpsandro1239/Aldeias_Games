const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const aldeiaId = 'cmnj86jmu0025p7xcr9p9dpdy';
  
  const users = await prisma.user.findMany({
    where: { role: 'user', aldeiaId: null },
    select: { id: true, email: true },
  });

  console.log(`Found ${users.length} users without aldeiaId`);

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { aldeiaId },
    });
    console.log(`Updated ${user.email} -> aldeiaId: ${aldeiaId}`);
  }

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
