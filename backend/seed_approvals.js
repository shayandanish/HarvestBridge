const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPendingData() {
    try {
        // 1. Find a landowner
        let landowner = await prisma.landowner.findFirst({
            include: { user: true }
        });

        if (!landowner) {
            console.log('No landowner found. Creating one...');
            const user = await prisma.user.create({
                data: {
                    email: 'test_landowner@example.com',
                    passwordHash: 'dummy',
                    fullName: 'Test Landowner',
                    role: 'landowner',
                    isVerified: true
                }
            });
            landowner = await prisma.landowner.create({
                data: { userId: user.id }
            });
        }

        // 2. Create a pending land
        const land = await prisma.land.create({
            data: {
                landownerId: landowner.id,
                landName: 'Pending Test Land',
                totalArea: 5,
                areaUnit: 'Kanal',
                address: '123 Pending St',
                city: 'Test City',
                isVerified: false,
                isActive: true
            }
        });
        console.log('Created Pending Land:', land.landName);

        // 3. Find a farmer
        let farmer = await prisma.farmer.findFirst({
            include: { user: true }
        });

        if (!farmer) {
            console.log('No farmer found. Creating one...');
            const user = await prisma.user.create({
                data: {
                    email: 'test_farmer@example.com',
                    passwordHash: 'dummy',
                    fullName: 'Test Farmer',
                    role: 'farmer',
                    isVerified: true
                }
            });
            farmer = await prisma.farmer.create({
                data: { userId: user.id }
            });
        }

        // 4. Create a pending farm
        const farm = await prisma.farm.create({
            data: {
                farmerId: farmer.id,
                landId: land.id,
                farmName: 'Pending Test Farm',
                description: 'A farm waiting for approval',
                isApproved: false,
                isActive: true
            }
        });
        console.log('Created Pending Farm:', farm.farmName);

        // 5. Create a user with pending KYC
        const kycUser = await prisma.user.create({
            data: {
                email: 'kyc_pending@example.com',
                passwordHash: 'dummy',
                fullName: 'KYC Pending User',
                role: 'investor',
                isVerified: true,
                profile: {
                    create: {
                        kycDocumentUrl: 'http://example.com/doc.pdf',
                        kycVerified: false
                    }
                }
            }
        });
        console.log('Created User with Pending KYC:', kycUser.fullName);

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedPendingData();
