const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApproval() {
    try {
        const landId = 'f0ac8e0e-ebbf-4c81-8d6e-b4fc553d3c0e';
        console.log(`--- Approval/Payment Check for Land ${landId} ---`);

        const land = await prisma.land.findUnique({
            where: { id: landId },
            include: { farms: true }
        });

        land.farms.forEach(f => {
            console.log(`\nFarm: ${f.farmName} (${f.id})`);
            console.log(`  Area: ${f.totalArea}`);
            console.log(`  isActive: ${f.isActive}`);
            console.log(`  isApproved: ${f.isApproved}`);
            console.log(`  isLeasePaid: ${f.isLeasePaid}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkApproval();
