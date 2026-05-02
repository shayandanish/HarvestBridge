const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function testPendingSummary() {
    try {
        const [lands, farms, kyc, farmers] = await Promise.all([
            prisma.land.count({ where: { isVerified: false, isActive: true } }),
            prisma.farm.count({ where: { isApproved: false, isActive: true } }),
            prisma.userProfile.count({ where: { kycVerified: false, kycDocumentUrl: { not: null } } }),
            prisma.farmer.count({ where: { isVerified: false, isProfilePublic: true } })
        ]);

        console.log('Summary Result:', { lands, farms, kyc, farmers });

        // Test getPendingLands exactly as in controller
        const pendingLands = await prisma.land.findMany({
            where: { isVerified: false, isActive: true },
            include: {
                landowner: {
                    include: {
                        user: {
                            select: { id: true, fullName: true, email: true, phone: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        console.log('Pending Lands Count:', pendingLands.length);

    } catch (error) {
        console.error('SERVER ERROR REPRODUCED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testPendingSummary();
