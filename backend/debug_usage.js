const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const UNIT_CONVERSIONS = {
    'KANAL': 1,
    'MARLA': 20,
    'SQ FT': 5445,
    'SQ YD': 605,
    'ACRE': 0.125
};

const convertArea = (amount, fromUnit, toUnit) => {
    if (amount === undefined || amount === null || !fromUnit || !toUnit) return amount;
    const normalizedFrom = fromUnit.toUpperCase().trim();
    const normalizedTo = toUnit.toUpperCase().trim();
    if (normalizedFrom === normalizedTo) return Number(amount);
    if (!UNIT_CONVERSIONS[normalizedFrom] || !UNIT_CONVERSIONS[normalizedTo]) return Number(amount);
    const kanalAmount = Number(amount) / UNIT_CONVERSIONS[normalizedFrom];
    const result = kanalAmount * UNIT_CONVERSIONS[normalizedTo];
    return parseFloat(result.toFixed(4));
};

async function checkFarmUsage() {
    const farmId = '679c863b-c2e4-4dd2-9df1-c66bcf471527';
    const farm = await prisma.farm.findUnique({
        where: { id: farmId },
        include: {
            plantationRequests: {
                where: { status: { in: ['pending', 'approved', 'planted'] } },
                include: { items: { include: { tree: true } } }
            }
        }
    });

    if (!farm) {
        console.log('Farm not found');
        return;
    }

    let usedSpaceInSqFt = 0;
    console.log(`Farm: ${farm.farmName}, Total Area: ${farm.totalArea} ${farm.areaUnit}`);
    
    for (const request of farm.plantationRequests) {
        console.log(`  Request ID: ${request.id}, Status: ${request.status}`);
        for (const item of request.items) {
            const treeAreaInSqFt = convertArea(item.tree.spaceRequired, item.tree.spaceUnit || 'SQ FT', 'SQ FT');
            const totalItemArea = Number(treeAreaInSqFt) * item.quantity;
            usedSpaceInSqFt += totalItemArea;
            console.log(`    Item: ${item.tree.name}, Qty: ${item.quantity}, Space/Tree: ${item.tree.spaceRequired} ${item.tree.spaceUnit}, Total: ${totalItemArea} SQ FT`);
        }
    }

    const farmTotalAreaInSqFt = convertArea(farm.totalArea, farm.areaUnit || 'SQ FT', 'SQ FT');
    console.log(`\nUsed Space: ${usedSpaceInSqFt} SQ FT`);
    console.log(`Total Farm Area: ${farmTotalAreaInSqFt} SQ FT`);
    console.log(`Remaining Space: ${farmTotalAreaInSqFt - usedSpaceInSqFt} SQ FT`);
}

checkFarmUsage()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
