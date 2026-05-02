const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    try {
        console.log('Finding Cheery project for user...');
        
        // Find the Cheery request that is on a shared farm
        const request = await prisma.plantationRequest.findFirst({
            where: {
                description: { contains: 'cheery' },
                farm: { farmName: { contains: 'Apple' } }
            },
            include: { farm: true }
        });

        if (!request) {
            console.log('No mixed Cheery project found.');
            return;
        }

        console.log(`Found request ${request.id} on farm ${request.farm.farmName} (${request.farm.id})`);

        // Create a NEW farm for this request
        const newFarm = await prisma.farm.create({
            data: {
                investorId: request.investorId,
                landId: request.farm.landId,
                farmerId: request.farm.farmerId, // Copy same farmer for now or leave empty? User wants "Hire Farmer" button.
                // If we leave farmerId null, hiringStatus becomes 'none'
                farmName: request.description || 'Cheery Project',
                description: 'Separate project for Cheery trees.',
                totalArea: request.farm.totalArea, // Or proportional area?
                areaUnit: request.farm.areaUnit,
                isDirectPlanting: true,
                isActive: request.farm.isActive,
                isApproved: request.farm.isApproved,
                leaseAmount: 0 // Assume already paid or handled
            }
        });

        console.log(`Created new farm: ${newFarm.id}`);

        // Point the request to the new farm
        await prisma.plantationRequest.update({
            where: { id: request.id },
            data: { farmId: newFarm.id }
        });

        // Any plants?
        const plants = await prisma.plant.findMany({
            where: { 
                farmId: request.farm.id,
                cropType: { name: { contains: 'cheery' } }
            }
        });

        console.log(`Moving ${plants.length} plants to the new farm.`);
        for (const plant of plants) {
            await prisma.plant.update({
                where: { id: plant.id },
                data: { farmId: newFarm.id, plantationRequestId: request.id }
            });
        }

        console.log('Migration complete!');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
