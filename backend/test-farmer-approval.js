// Test script to verify farmer profile approval flow
const prisma = require('./src/config/database');

async function testFarmerApprovalFlow() {
    try {
        console.log('=== Farmer Profile Approval Flow Test ===\n');

        // 1. Check pending farmers
        console.log('1. Checking pending farmers...');
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
                    },
                },
            },
        });

        console.log(`   Found ${pendingFarmers.length} pending farmers`);
        
        if (pendingFarmers.length > 0) {
            const farmer = pendingFarmers[0];
            console.log(`   First pending farmer: ${farmer.user.fullName} (${farmer.user.email})`);
            
            // 2. Test approval process
            console.log('\n2. Testing approval process...');
            const approvedFarmer = await prisma.farmer.update({
                where: { id: farmer.id },
                data: {
                    isVerified: true,
                    rejectionReason: null,
                },
            });
            
            console.log(`   ✅ Farmer approved: ${approvedFarmer.isVerified}`);
            
            // 3. Verify notification was created
            console.log('\n3. Checking for notification...');
            const notification = await prisma.notification.findFirst({
                where: {
                    userId: farmer.userId,
                    title: 'Profile Verified!',
                },
            });
            
            if (notification) {
                console.log(`   ✅ Notification created: ${notification.title}`);
            } else {
                console.log(`   ❌ No notification found`);
            }
            
            // 4. Check if farmer appears in public listings
            console.log('\n4. Checking public farmer listing...');
            const publicFarmers = await prisma.farmer.findMany({
                where: {
                    isProfilePublic: true,
                    isVerified: true,
                },
                include: {
                    user: {
                        select: {
                            fullName: true,
                        },
                    },
                },
            });
            
            console.log(`   ✅ Public verified farmers: ${publicFarmers.length}`);
            
            // Reset for testing
            await prisma.farmer.update({
                where: { id: farmer.id },
                data: {
                    isVerified: false,
                },
            });
            
            console.log(`   🔄 Reset farmer to pending for further testing`);
        }

        console.log('\n=== Test Complete ===');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testFarmerApprovalFlow();
