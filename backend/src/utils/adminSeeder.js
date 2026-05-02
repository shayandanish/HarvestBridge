const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const logger = require('./logger');

const prisma = new PrismaClient();

/**
 * Synchronizes the admin user in the database with the ADMIN_EMAIL and ADMIN_PASSWORD
 * environment variables. This ensures the admin account is always available and
 * matches the current configuration.
 */
const syncAdminUser = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            logger.warn('⚠️ Admin credentials not found in environment variables. Skipping admin sync.');
            return;
        }

        const passwordHash = await bcrypt.hash(adminPassword, 10);

        // Upsert admin user (create if doesn't exist, update if it does)
        const user = await prisma.user.upsert({
            where: { email: adminEmail },
            update: {
                passwordHash,
                role: 'admin',
                isVerified: true,
                isActive: true
            },
            create: {
                email: adminEmail,
                passwordHash,
                fullName: 'System Admin',
                role: 'admin',
                isVerified: true,
                isActive: true
            }
        });

        logger.info(`✅ Admin account synchronized: ${user.email}`);
    } catch (error) {
        logger.error('❌ Failed to synchronize admin account:', error);
    } finally {
        await prisma.$disconnect();
    }
};

module.exports = { syncAdminUser };
