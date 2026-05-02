
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const farmId = '679c863b-c2e4-4dd2-9df1-c66bcf471527';
  console.log('Checking Farm:', farmId);

  const activities = await prisma.plantActivity.findMany({ where: { farmId } });
  const photos = await prisma.plantPhoto.findMany({ 
    where: { 
      OR: [
        { farmId },
        { plant: { farmId } }
      ]
    } 
  });
  const milestones = await prisma.plantMilestone.findMany({ 
    where: { 
      OR: [
        { farmId },
        { plant: { farmId } }
      ]
    } 
  });

  console.log('--- Activities ---');
  activities.forEach(a => console.log(`- [${a.type || a.activityType}] ${a.description} (${a.activityDate})`));

  console.log('\n--- Photos ---');
  photos.forEach(p => console.log(`- [${p.farmId ? 'FARM' : 'PLANT'}] ${p.caption} | URL: ${p.photoUrl} | PlantID: ${p.plantId}`));

  console.log('\n--- Milestones ---');
  milestones.forEach(m => console.log(`- [${m.milestoneType}] ${m.notes} | farmId: ${m.farmId} | plantId: ${m.plantId}`));
}

check();
