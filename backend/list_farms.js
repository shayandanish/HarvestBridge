const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAllFarms() {
  const user = await prisma.user.findFirst({
    where: { fullName: { contains: 'shayan' } }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  const farmer = await prisma.farmer.findFirst({
    where: { userId: user.id }
  });

  if (!farmer) {
    console.log(`Farmer profile not found for user ${user.fullName}`);
    return;
  }

  const farms = await prisma.farm.findMany({
    where: { farmerId: farmer.id },
    include: {
      land: true,
      investor: true
    }
  });

  console.log(`Found ${farms.length} farms for farmer ${farmer.id}:`);
  farms.forEach(f => {
    console.log(`- ${f.farmName} (ID: ${f.id}, isActive: ${f.isActive}, hiringStatus: ${f.hiringStatus})`);
  });
}

listAllFarms()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
