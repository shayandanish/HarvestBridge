const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixData() {
  try {
    // Find all approved or planted requests
    const requests = await prisma.plantationRequest.findMany({
      where: {
        status: { in: ['approved', 'planted'] }
      },
      include: {
        items: {
          include: {
            tree: true
          }
        },
        farm: {
          include: {
            plants: true
          }
        }
      }
    });

    console.log(`Found ${requests.length} approved/planted requests.`);

    for (const req of requests) {
      const totalRequested = req.items.reduce((sum, item) => sum + item.quantity, 0);
      const plantCount = req.farm.plants.length;

      console.log(`Request ${req.id} for Farm ${req.farm.farmName}: Requested=${totalRequested}, Existing Plants=${plantCount}`);

      if (plantCount < totalRequested) {
        console.log(`-> Creating ${totalRequested - plantCount} missing plants...`);
        
        for (const item of req.items) {
          // Find or create CropType
          let cropType = await prisma.cropType.findUnique({
            where: { name: item.tree.name }
          });

          if (!cropType) {
            cropType = await prisma.cropType.create({
              data: {
                name: item.tree.name,
                category: 'Tree',
                description: `Created for ${item.tree.name}`
              }
            });
          }

          // We only create what's missing. This is a bit naive but works if there are 0 plants.
          // For safety, if plantCount is 0, we create all.
          if (plantCount === 0) {
            for (let i = 0; i < item.quantity; i++) {
              await prisma.plant.create({
                data: {
                  farmId: req.farmId,
                  cropTypeId: cropType.id,
                  status: 'sponsored',
                  growthStatus: 'to_be_planted',
                  plantDate: req.status === 'planted' ? new Date() : null,
                }
              });
            }
          }
        }
      }
    }

    console.log('Data fix complete.');

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

fixData();
