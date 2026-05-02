const cron = require('node-cron');
const prisma = require('../config/database');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

/**
 * Scheduled jobs for Harvest Management
 */
const initHarvestJobs = () => {
    // Run every day at 00:00
    cron.schedule('0 0 * * *', async () => {
        logger.info('Running daily harvest management jobs...');
        await checkCollectionDeadlines();
        await autoForfeitUncollectedProduce();
        await sendReviewReminders();
    });
};

/**
 * 1. Check for approaching collection deadlines (48h reminder)
 */
async function checkCollectionDeadlines() {
    try {
        const twoDaysFromNow = new Date();
        twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

        const harvests = await prisma.harvest.findMany({
            where: {
                collectionStatus: 'ready',
                collectionDeadline: {
                    lte: twoDaysFromNow,
                    gt: new Date()
                },
                collectionMethod: null // No decision made yet
            },
            include: {
                investment: {
                    include: { investor: true }
                },
                plant: {
                    include: { farm: true }
                }
            }
        });

        for (const harvest of harvests) {
            const investor = harvest.investment.investor;
            await emailService.sendEmail(
                investor.email,
                'REMINDER: Collection Deadline Approaching',
                `<p>Hello ${investor.fullName},</p>
                 <p>Your harvest for ${harvest.plant.cropType.name} at ${harvest.plant.farm.farmName} has a collection deadline trip on ${harvest.collectionDeadline.toLocaleDateString()}.</p>
                 <p>Please select a collection method soon to avoid forfeiting the produce.</p>`
            );
        }
        logger.info(`Sent ${harvests.length} collection deadline reminders.`);
    } catch (error) {
        logger.error('Error in checkCollectionDeadlines job:', error);
    }
}

/**
 * 2. Auto-forfeit produce to farmer after deadline
 */
async function autoForfeitUncollectedProduce() {
    try {
        const today = new Date();

        const result = await prisma.harvest.updateMany({
            where: {
                collectionStatus: 'ready',
                collectionDeadline: {
                    lt: today
                }
            },
            data: {
                collectionStatus: 'not_collected',
                collectionMethod: 'farmer_keeps'
            }
        });

        if (result.count > 0) {
            logger.info(`Auto-forfeited ${result.count} uncollected harvests to farmers.`);
        }
    } catch (error) {
        logger.error('Error in autoForfeitUncollectedProduce job:', error);
    }
}

/**
 * 3. Send review reminders (3 days after collection/delivery)
 */
async function sendReviewReminders() {
    try {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const harvests = await prisma.harvest.findMany({
            where: {
                collectionStatus: { in: ['collected', 'delivered'] },
                updatedAt: {
                    lte: threeDaysAgo,
                    gt: new Date(threeDaysAgo.getTime() - 24 * 60 * 60 * 1000) // Within the last 24h of eligibility
                },
                reviews: {
                    none: {}
                }
            },
            include: {
                investment: {
                    include: { investor: true }
                },
                plant: {
                    include: { farm: true }
                }
            }
        });

        for (const harvest of harvests) {
            const investor = harvest.investment.investor;
            await emailService.sendHarvestReviewRequest(investor.email, investor.fullName, {
                farmName: harvest.plant.farm.farmName,
                reviewUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/harvests/${harvest.id}/review`
            });
        }
        logger.info(`Sent ${harvests.length} review reminders.`);
    } catch (error) {
        logger.error('Error in sendReviewReminders job:', error);
    }
}

module.exports = { initHarvestJobs };
