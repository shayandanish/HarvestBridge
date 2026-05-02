const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMoreData() {
    try {
        const landId = 'f0ac8e0e-ebbf-4c81-8d6e-b4fc553d3c0e';
        console.log(`--- Checking Plantation Requests & Payments for Land ${landId} ---`);

        const land = await prisma.land.findUnique({
            where: { id: landId },
            include: {
                farms: {
                    include: {
                        plantationRequests: true,
                        payments: true
                    }
                }
            }
        });

        for (const farm of land.farms) {
            console.log(`\nFarm: ${farm.farmName} (${farm.id})`);
            console.log(`  Area: ${farm.totalArea}`);
            console.log(`  isActive: ${farm.isActive}`);
            console.log(`  Payments count: ${farm.payments.length}`);
            console.log(`  Plantation Requests count: ${farm.plantationRequests.length}`);

            farm.payments.forEach(p => {
                console.log(`    - Payment: ${p.amount} (${p.status})`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkMoreData();
