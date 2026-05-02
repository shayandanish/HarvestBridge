// Check land availability status
const prisma = require('./src/config/database');

async function checkLandStatus() {
    try {
        console.log('=== Checking Land Status ===\n');

        // Get the specific land that's showing as sold out
        const land = await prisma.land.findFirst({
            where: {
                totalArea: '4',
                areaUnit: 'KANAL'
            },
            include: {
                farms: {
                    include: {
                        investor: true
                    }
                }
            }
        });

        if (!land) {
            console.log('❌ No land found with 4 kanal');
            return;
        }

        console.log('📋 Land Details:');
        console.log(`   Land ID: ${land.id}`);
        console.log(`   Land Name: ${land.landName}`);
        console.log(`   Total Area: ${land.totalArea} ${land.areaUnit}`);
        console.log(`   Available Area: ${land.availableArea} ${land.areaUnit}`);
        console.log(`   Is Active: ${land.isActive}`);
        console.log(`   Is Verified: ${land.isVerified}`);

        console.log('\n🏡 Farms on this land:');
        if (land.farms && land.farms.length > 0) {
            land.farms.forEach((farm, index) => {
                console.log(`   ${index + 1}. ${farm.farmName}`);
                console.log(`      - Farm Area: ${farm.totalArea} ${farm.areaUnit}`);
                console.log(`      - Is Active: ${farm.isActive}`);
                console.log(`      - Investor ID: ${farm.investorId}`);
                console.log(`      - Created: ${farm.createdAt}`);
            });
        } else {
            console.log('   No farms on this land');
        }

        // Calculate total leased area
        const totalLeasedArea = land.farms?.reduce((sum, farm) => {
            return sum + Number(farm.totalArea || 0);
        }, 0) || 0;

        console.log('\n📊 Area Calculation:');
        console.log(`   Total Land Area: ${land.totalArea} ${land.areaUnit}`);
        console.log(`   Total Leased Area: ${totalLeasedArea} ${land.areaUnit}`);
        console.log(`   Available Area: ${land.availableArea} ${land.areaUnit}`);
        console.log(`   Should Be Available: ${land.totalArea - totalLeasedArea} ${land.areaUnit}`);

        // Check if available area is correct
        const shouldBeAvailable = land.totalArea - totalLeasedArea;
        if (Number(land.availableArea) !== shouldBeAvailable) {
            console.log('\n❌ Available area is incorrect!');
            console.log(`   Current available: ${land.availableArea}`);
            console.log(`   Should be: ${shouldBeAvailable}`);
            
            // Fix available area
            const updatedLand = await prisma.land.update({
                where: { id: land.id },
                data: {
                    availableArea: shouldBeAvailable,
                    isActive: shouldBeAvailable > 0
                }
            });
            
            console.log('\n✅ Land status fixed!');
            console.log(`   Updated Available Area: ${updatedLand.availableArea}`);
            console.log(`   Updated Is Active: ${updatedLand.isActive}`);
        } else {
            console.log('\n✅ Available area is correct');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkLandStatus();
