const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { convertArea } = require('./src/utils/unitUtils');

async function verifyFix() {
    try {
        const farmId = '679c863b-c2e4-4dd2-9df1-c66bcf471527';
        const tree = await prisma.tree.findFirst({ where: { isActive: true } });
        
        if (!tree) {
            console.error('No active trees found');
            return;
        }

        console.log(`Using Tree: ${tree.name} (ID: ${tree.id})`);
        console.log(`Using Farm: ${farmId}`);

        const farmBefore = await prisma.farm.findUnique({
            where: { id: farmId },
            include: { land: true }
        });

        console.log(`Farm Area Before: ${farmBefore.totalArea} ${farmBefore.areaUnit}`);

        // Mock the req, res for the controller
        const req = {
            user: { id: farmBefore.investorId },
            body: {
                farmId: farmId,
                items: [{ treeId: tree.id, quantity: 1 }]
            }
        };

        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.data = data;
                return this;
            }
        };

        const { createPlantationRequest } = require('./src/controllers/plantation.controller');
        
        console.log('Attempting to create plantation request...');
        await createPlantationRequest(req, res, (err) => { if (err) throw err; });

        if (res.statusCode === 201) {
            console.log('Success! Plantation request created.');
            const farmAfter = await prisma.farm.findUnique({ where: { id: farmId } });
            console.log(`Farm Area After: ${farmAfter.totalArea} ${farmAfter.areaUnit}`);
            
            if (Number(farmAfter.totalArea) > Number(farmBefore.totalArea)) {
                console.log('VERIFICATION PASSED: Farm expanded automatically.');
            } else {
                console.log('VERIFICATION FAILED: Farm did not expand.');
            }
        } else {
            console.error('Failed to create plantation request:', res.data);
        }

    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyFix();
