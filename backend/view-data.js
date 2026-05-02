const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function viewData() {
  try {
    // View all users
    const users = await prisma.user.findMany({
      take: 5, // Limit to 5 results
      include: {
        profile: true,
        landowner: true,
        farmer: true
      }
    });
    console.log('Users:', JSON.stringify(users, null, 2));

    // View all farms
    const farms = await prisma.farm.findMany({
      take: 5,
      include: {
        farmer: true,
        land: true
      }
    });
    console.log('Farms:', JSON.stringify(farms, null, 2));

    // View all plants
    const plants = await prisma.plant.findMany({
      take: 5,
      include: {
        farm: true,
        cropType: true
      }
    });
    console.log('Plants:', JSON.stringify(plants, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

viewData();
