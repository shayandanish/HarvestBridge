const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminUser() {
    try {
        const adminEmail = 'admin@planttree.com';
        const user = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (user) {
            console.log('Admin User Found:');
            console.log('ID:', user.id);
            console.log('Role:', user.role);
            console.log('Is Active:', user.isActive);
            console.log('Is Verified:', user.isVerified);
        } else {
            console.log('Admin user NOT found!');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdminUser();
