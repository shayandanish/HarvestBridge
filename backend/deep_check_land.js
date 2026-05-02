const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTotalLeased() {
    try {
        const landId = 'f0ac8e0e-ebbf-4c81-8d6e-b4fc553d3c0e';
        console.log(`--- Comprehensive Farm Check for Land ${landId} (2.0 Marla) ---`);
        const land = await prisma.land.findUnique({
            where: { id: landId },
            include: {
                farms: {
                    include: {
                        investor: true
                    }
                }
            }
        });

        console.log(`Land: ${land.landName}`);
        console.log(`Total Area: ${land.totalArea}`);

        console.log('\nAll Farm Records:');
        land.farms.forEach(f => {
            console.log(`- ID: ${f.id}`);
            console.log(`  Name: ${f.farmName}`);
            console.log(`  Area: ${f.totalArea}`);
            console.log(`  Status: ${f.status || 'N/A'}`);
            console.log(`  isActive: ${f.isActive}`);
            console.log(`  Investor: ${f.investor?.fullName || 'N/A'}`);
            console.log('-------------------');
        });

        const activeSum = land.farms.filter(f => f.isActive).reduce((s, f) => s + Number(f.totalArea), 0);
        const allSum = land.farms.reduce((s, f) => s + Number(f.totalArea), 0);

        console.log(`\nActive Sum: ${activeSum}`);
        console.log(`All Records Sum: ${allSum}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkTotalLeased();
