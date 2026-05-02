const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllLands() {
    try {
        const lands = await prisma.land.findMany({
            include: { landowner: { include: { user: true } } }
        });
        console.log('Total Lands:', lands.length);
        lands.forEach(l => {
            console.log(`Land: ${l.landName}, isVerified: ${l.isVerified}, isActive: ${l.isActive}, rejectionReason: ${l.rejectionReason}`);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAllLands();
