const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPendingItems() {
    try {
        const lands = await prisma.land.count({ where: { isVerified: false, isActive: true } });
        const farms = await prisma.farm.count({ where: { isApproved: false, isActive: true } });
        const kyc = await prisma.userProfile.count({ where: { kycVerified: false, kycDocumentUrl: { not: null } } });
        const farmers = await prisma.farmer.count({ where: { isVerified: false, isProfilePublic: true } });

        console.log('Pending Lands:', lands);
        console.log('Pending Farms:', farms);
        console.log('Pending KYC:', kyc);
        console.log('Pending Farmers:', farmers);

        if (lands > 0) {
            const pendingLands = await prisma.land.findMany({
                where: { isVerified: false, isActive: true },
                include: { landowner: { include: { user: true } } }
            });
            console.log('Sample Pending Land:', JSON.stringify(pendingLands[0], null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPendingItems();
