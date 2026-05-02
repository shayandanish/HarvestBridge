const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    try {
        console.log('Fetching Cheery Project farm and its plants...');
        const farm = await prisma.farm.findFirst({
            where: { farmName: { contains: 'Cheery' } },
            include: { 
                plants: { include: { cropType: true } },
                plantationRequests: { include: { items: { include: { tree: true } } } }
            }
        });

        if (!farm) {
            console.log('Cheery project farm not found.');
            return;
        }

        console.log(`Farm found: ${farm.farmName} (${farm.id})`);
        console.log(`Current plants count: ${farm.plants.length}`);

        // Check the request items count
        const totalRequested = farm.plantationRequests.reduce((sum, req) => {
            return sum + req.items.reduce((iSum, item) => iSum + item.quantity, 0);
        }, 0);

        console.log(`Total requested quantity: ${totalRequested}`);

        if (farm.plants.length > totalRequested && totalRequested > 0) {
            const extraCount = farm.plants.length - totalRequested;
            console.log(`Removing ${extraCount} extra plants...`);
            
            // Sort by createdAt desc to keep the newest ones (likely the most recent ones) or just take extra
            const extraPlants = farm.plants.slice(totalRequested);
            for (const p of extraPlants) {
                await prisma.plant.delete({ where: { id: p.id } });
            }
            console.log('Cleanup complete!');
        } else {
            console.log('No cleanup needed or insufficient request data.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
