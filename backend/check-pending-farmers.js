const prisma = require('./src/config/database');

async function checkPendingFarmers() {
    try {
        console.log('Checking for pending farmer profiles...');
        
        const pendingFarmers = await prisma.farmer.findMany({
            where: {
                isVerified: false,
                isProfilePublic: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        profilePhotoUrl: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        console.log(`Found ${pendingFarmers.length} pending farmer profiles:`);
        
        pendingFarmers.forEach((farmer, index) => {
            console.log(`\n${index + 1}. ${farmer.user.fullName}`);
            console.log(`   Email: ${farmer.user.email}`);
            console.log(`   Phone: ${farmer.user.phone}`);
            console.log(`   Age: ${farmer.age || 'Not specified'}`);
            console.log(`   Location: ${farmer.location || 'Not specified'}`);
            console.log(`   Specialization: ${farmer.specialization || 'Not specified'}`);
            console.log(`   Experience: ${farmer.experienceYears ? farmer.experienceYears + ' years' : 'Not specified'}`);
            console.log(`   Charges/Task: ${farmer.chargesPerTask || 'Not specified'}`);
            console.log(`   Profile Public: ${farmer.isProfilePublic ? 'Yes' : 'No'}`);
            console.log(`   Created: ${farmer.createdAt}`);
        });

        // Also check all farmers to see the total
        const allFarmers = await prisma.farmer.count();
        const verifiedFarmers = await prisma.farmer.count({ where: { isVerified: true } });
        
        console.log(`\nSummary:`);
        console.log(`Total farmers: ${allFarmers}`);
        console.log(`Verified farmers: ${verifiedFarmers}`);
        console.log(`Pending farmers: ${pendingFarmers.length}`);

    } catch (error) {
        console.error('Error checking pending farmers:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPendingFarmers();
