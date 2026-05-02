const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPlantations() {
  try {
    const farmId = '48c77be3-2592-4c13-876d-01f203a16c35';
    const requests = await prisma.plantationRequest.findMany({
      where: { farmId },
      include: { items: true }
    });
    console.log('Plantation Requests:', JSON.stringify(requests, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlantations();
