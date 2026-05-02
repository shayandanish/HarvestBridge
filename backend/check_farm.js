const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const farmId = '679c863b-c2e4-4dd2-9df1-c66bcf471527';
    console.log(`Checking Farm: ${farmId}`);

    const farm = await prisma.farm.findUnique({
        where: { id: farmId },
        include: {
            plants: true,
            plantationRequests: {
                include: { items: { include: { tree: true } } }
            },
            trackingActivities: true,
            trackingPhotos: true
        }
    });

    if (!farm) {
        console.log("Farm not found!");
        return;
    }

    console.log(`Plants Count: ${farm.plants.length}`);
    
    console.log(`Plantation Requests: ${farm.plantationRequests.length}`);
    for (const r of farm.plantationRequests) {
        console.log(`- Request ${r.id}: Status=${r.status}, Items=${r.items.length}`);
        for (const item of r.items) {
            console.log(`  - Tree: ${item.tree.name}, Qty: ${item.quantity}`);
        }
    }

    console.log(`Activities:`);
    farm.trackingActivities.forEach(a => console.log(`- ${a.activityType}: ${a.description}`));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
