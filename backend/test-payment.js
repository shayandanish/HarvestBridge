const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const farmId = '679c863b-c2e4-4dd2-9df1-c66bcf471527';

        const farm = await prisma.farm.findUnique({
            where: { id: farmId },
            include: { 
                land: true,
                plantationRequests: {
                    where: { status: 'pending' },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!farm) {
            console.log('Farm not found');
            return;
        }

        console.log('Farm found:', farm.farmName);
        console.log('amount:', farm.leaseAmount);

        let totalAmount = Number(farm.leaseAmount || 0);
        let leaseAmount = Number(farm.leaseAmount || 0);
        let plantationAmount = 0;
        let description = `Gas Fee / Monthly Lease for ${farm.farmName} ${farm.land ? `at ${farm.land.landName}` : ''}`;
        
        // Check if there's a pending plantation request to bundle
        const pendingPlantation = farm.plantationRequests[0];
        if (pendingPlantation) {
            plantationAmount = Number(pendingPlantation.totalPrice || 0);
            totalAmount += plantationAmount;
            description += ` + Plantation Request (${plantationAmount} Rs)`;
        }

        console.log('Total Amount calculated:', totalAmount);
        
        // Mock Stripe Payment Intent
        const mockPaymentIntent = { id: 'pi_lease_' + Date.now(), client_secret: 'lease_secret_' + Date.now() };

        // Create Payment Record for the lease (and plantation)
        const payment = await prisma.payment.create({
            data: {
                farmId: farm.id,
                amount: totalAmount,
                description,
                transactionId: mockPaymentIntent.id,
                status: 'pending',
                paymentMethod: 'manual_pakistan',
                type: 'land_lease'
            }
        });

        console.log('Payment created successfully:', payment.id);

    } catch (error) {
        console.error('ERROR OCCURRED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
