const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { convertArea } = require('./src/utils/unitUtils');

async function testLandUsage() {
    console.log('Testing Land Usage Logic...');

    try {
        // 1. Get a test land (assuming some exists from seed or we create one)
        let land = await prisma.land.findFirst({
            where: { isActive: true, isVerified: true }
        });

        if (!land) {
            console.log('No verified land found, creating one...');
            const landowner = await prisma.landowner.findFirst() || await prisma.landowner.create({
                data: { userId: (await prisma.user.findFirst()).id }
            });
            land = await prisma.land.create({
                data: {
                    landownerId: landowner.id,
                    landName: 'Test Land 4 Kanal',
                    totalArea: 4,
                    areaUnit: 'KANAL',
                    isVerified: true,
                    isActive: true
                }
            });
        }

        console.log(`Using land: ${land.landName} (${land.totalArea} ${land.areaUnit})`);

        // 2. Get a test tree
        const tree = await prisma.tree.findFirst({ where: { isActive: true } });
        console.log(`Using tree: ${tree.name} (Required space: ${tree.spaceRequired} ${tree.spaceUnit})`);

        // 3. Test Direct Planting Area Calculation
        console.log('\nScenario 1: Single plant investment area calculation');
        const investor = await prisma.user.findFirst({ where: { role: 'investor' } });
        
        // We'll mock the req.body and call the logic or simulate it
        const treeAreaInSqFt = convertArea(tree.spaceRequired, tree.spaceUnit || 'SQ FT', 'SQ FT');
        console.log(`Expected area for 1 tree: ${treeAreaInSqFt} SQ FT`);

        // Check availability logic (the one we refactored)
        const totalLeasedInBaseUnit = 0; // Fresh land
        const availableAreaInBaseUnit = Number(land.totalArea) - totalLeasedInBaseUnit;
        const requestedAreaInBaseUnit = convertArea(treeAreaInSqFt, 'SQ FT', land.areaUnit);
        
        console.log(`Available land: ${availableAreaInBaseUnit} ${land.areaUnit}`);
        console.log(`Requested land for tree: ${requestedAreaInBaseUnit} ${land.areaUnit}`);

        if (requestedAreaInBaseUnit < availableAreaInBaseUnit) {
            console.log('SUCCESS: Tree fits in land.');
        } else {
            console.log('FAILURE: Tree does not fit in land? Check conversion.');
        }

        // 4. Test Overselling
        console.log('\nScenario 2: Overselling prevention');
        const hugeQuantity = 10000;
        const hugeAreaInSqFt = Number(treeAreaInSqFt) * hugeQuantity;
        const hugeAreaInBaseUnit = convertArea(hugeAreaInSqFt, 'SQ FT', land.areaUnit);
        
        if (hugeAreaInBaseUnit > availableAreaInBaseUnit) {
            console.log(`SUCCESS: correctly identified that ${hugeQuantity} trees do not fit.`);
        } else {
            console.log('FAILURE: Did not catch overselling.');
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testLandUsage();
