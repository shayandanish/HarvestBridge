const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPhotos() {
  const farmId = '679c863b-c2e4-4dd2-9df1-c66bcf471527';
  const photos = await prisma.farmPhoto.findMany({
    where: { farmId }
  });

  console.log('Photos:');
  console.log(JSON.stringify(photos, null, 2));
}

checkPhotos()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
