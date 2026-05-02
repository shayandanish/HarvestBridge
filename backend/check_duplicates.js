
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const farmId = '679c863b-c2e4-4dd2-9df1-c66bcf471527';
  console.log('Checking Farm:', farmId);

  try {
    const activities = await prisma.plantActivity.findMany({ where: { farmId } });
    const photos = await prisma.plantPhoto.findMany({ 
      where: { 
        OR: [
          { farmId },
          { plant: { farmId } }
        ]
      } 
    });

    console.log('\n--- Activities ---');
    activities.forEach(a => console.log(`- [${a.type || a.activityType}] ${a.description} (${a.activityDate})`));

    console.log('\n--- Photos ---');
    photos.forEach(p => console.log(`- [${p.farmId ? 'FARM' : 'PLANT'}] ${p.caption} | URL: ${p.photoUrl.substring(0, 50)}... | PlantID: ${p.plantId}`));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
