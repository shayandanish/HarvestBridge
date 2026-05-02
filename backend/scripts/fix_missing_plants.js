const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createPlantsFromRequest } = require('../src/utils/plantCreation');

async function main() {
    const farmId = '679c863b-c2e4-4dd2-9df1-c66bcf471527';
    console.log(`Starting Data Repair for Farm: ${farmId}`);

    // 1. Find all plantation requests for this farm that are already approved or planted
    const requests = await prisma.plantationRequest.findMany({
        where: {
            farmId,
            status: { in: ['approved', 'planted'] }
        },
        include: { items: true }
    });

    console.log(`Found ${requests.length} requests to check.`);

    for (const req of requests) {
        // 2. Count existing plants for this farm
        const plantCount = await prisma.plant.count({
            where: { farmId }
        });

        if (plantCount === 0) {
            console.log(`Request ${req.id} has status ${req.status} but farm has 0 plants. Fixing...`);
            
            await prisma.$transaction(async (tx) => {
                await createPlantsFromRequest(tx, req, req.status);
            });
            
            console.log(`Plants created for request ${req.id}.`);
        } else {
            console.log(`Request ${req.id} already has associated plants (${plantCount}). Skipping.`);
        }
    }

    console.log("Data Repair Completed.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
