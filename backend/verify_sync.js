const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifySync() {
  const farmId = '48c77be3-2592-4c13-876d-01f203a16c35';
  const activityType = 'growth_update';
  const growthStatus = 'planted';
  const locationInFarm = 'Row 8';
  const notes = 'i just planted the apple tree';

  console.log('--- BEFORE ---');
  const plantBefore = await prisma.plant.findFirst({ where: { farmId } });
  const reqBefore = await prisma.plantationRequest.findFirst({ where: { farmId } });
  console.log('Plant Status:', plantBefore.status, 'Growth:', plantBefore.growthStatus);
  console.log('Request Status:', reqBefore.status);

  console.log('\n--- SYNCING ---');
  // Copying the logic from tracking.controller.js
  await prisma.$transaction(async (tx) => {
    // 1. Update all plants in this farm that are 'to_be_planted'
    await tx.plant.updateMany({
        where: {
            farmId,
            growthStatus: 'to_be_planted'
        },
        data: {
            growthStatus: 'planted',
            plantDate: new Date(),
            status: 'planted',
            locationInFarm: locationInFarm
        }
    });

    // 2. Update all approved plantation requests to 'planted'
    await tx.plantationRequest.updateMany({
        where: {
            farmId,
            status: 'approved'
        },
        data: {
            status: 'planted'
        }
    });
  });

  console.log('\n--- AFTER ---');
  const plantAfter = await prisma.plant.findFirst({ where: { farmId } });
  const reqAfter = await prisma.plantationRequest.findFirst({ where: { farmId } });
  console.log('Plant Status:', plantAfter.status, 'Growth:', plantAfter.growthStatus, 'Location:', plantAfter.locationInFarm);
  console.log('Request Status:', reqAfter.status);

  if (plantAfter.growthStatus === 'planted' && reqAfter.status === 'planted') {
    console.log('\nSUCCESS: Statuses synced correctly!');
  } else {
    console.log('\nFAILURE: Sync failed.');
  }

  await prisma.$disconnect();
}

verifySync();
