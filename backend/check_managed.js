const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkManagedFarms() {
  const farmId = '679c863b-c2e4-4dd2-9df1-c66bcf471527';
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    include: {
      farmer: {
        include: { user: true }
      },
      investor: true
    }
  });

  console.log('Farm Details:');
  console.log(JSON.stringify(farm, null, 2));
}

checkManagedFarms()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
