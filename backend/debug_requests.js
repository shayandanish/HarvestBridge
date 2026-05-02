const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    try {
        const userId = process.argv[2];
        console.log('Checking requests for user:', userId);
        
        const requests = await prisma.plantationRequest.findMany({
            where: { investorId: userId },
            include: { farm: { include: { land: true } } }
        });
        
        console.log('Found', requests.length, 'requests:');
        requests.forEach(r => {
            console.log(`- Request ${r.id}: Status=${r.status}, farmId=${r.farmId}, hasLand=${!!r.farm?.land}`);
        });
        
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
