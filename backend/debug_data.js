const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  try {
    const farmId = '48c77be3-2592-4c13-876d-01f203a16c35';
    const plants = await prisma.plant.findMany({
        where: { farmId }
    });
    console.log(`\n--- ALL PLANTS FOR FARM ${farmId} ---`);
    console.log(`Total plants found: ${plants.length}`);
    plants.forEach(p => {
        console.log(`Plant ${p.id}: Status=${p.status}, GrowthStatus=${p.growthStatus}`);
    });

    const requests = await prisma.plantationRequest.findMany({
        where: { farmId },
        include: { items: true }
    });
    console.log(`\n--- REQUESTS FOR FARM ${farmId} ---`);
    requests.forEach(r => {
        console.log(`Request ${r.id}: Status=${r.status}, CreatedAt=${r.createdAt}`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
