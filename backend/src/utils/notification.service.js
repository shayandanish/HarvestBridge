const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lazy-loaded to avoid circular dependency with server.js
let _io = null;
const getIo = () => {
    if (!_io) {
        try { _io = require('../../socketInstance').getIo(); } catch { _io = null; }
    }
    return _io;
};

/**
 * Create a notification record and emit it via Socket.io.
 * @param {string} userId - Recipient user ID
 * @param {string} type   - activity_update | message | payment_success | system
 * @param {string} title
 * @param {string} message
 * @param {object} options - { senderId, metadata, link }
 */
async function createNotification(userId, type, title, message, options = {}) {
    const { senderId = null, metadata = null, link = null } = options;

    const notification = await prisma.notification.create({
        data: {
            userId,
            senderId,
            type,
            title,
            message,
            metadata: metadata ? JSON.stringify(metadata) : null,
            link,
            isRead: false,
        },
        include: { sender: { select: { id: true, fullName: true, profilePhotoUrl: true } } },
    });

    // Emit to target user's socket room
    const io = getIo();
    if (io) {
        io.to(`user:${userId}`).emit('new_notification', notification);
    }

    return notification;
}

/**
 * Find all investors linked to a farm and notify each one.
 * A farm is linked to an investor via Farm.investorId.
 * Plant investments are linked via Investment.investorId -> Plant.farmId.
 * @param {string} farmId
 * @param {string} activityType
 * @param {string} description
 * @param {string} farmerUserId
 */
async function notifyFarmActivity(farmId, activityType, description, farmerUserId) {
    try {
        // Fetch farm and farmer info
        const farm = await prisma.farm.findUnique({
            where: { id: farmId },
            include: {
                farmer: { include: { user: { select: { fullName: true } } } },
            },
        });
        if (!farm) return;

        const farmerName = farm.farmer?.user?.fullName || 'Farmer';
        const farmName = farm.farmName;

        // Collect investor user IDs (deduplicated)
        const investorIds = new Set();

        // 1. Direct farm investor
        if (farm.investorId) investorIds.add(farm.investorId);

        // 2. Investors via plant investments
        const investments = await prisma.investment.findMany({
            where: { plant: { farmId } },
            select: { investorId: true },
            distinct: ['investorId'],
        });
        investments.forEach((inv) => investorIds.add(inv.investorId));

        // 3. Investors via plantation requests
        const plantationRequests = await prisma.plantationRequest.findMany({
            where: { farmId },
            select: { investorId: true },
            distinct: ['investorId'],
        });
        plantationRequests.forEach((req) => investorIds.add(req.investorId));

        if (investorIds.size === 0) return;

        const typeLabels = {
            watering: '💧 Watering',
            fertilizing: '🌱 Fertilizing',
            growth_update: '📈 Growth Update',
            harvesting: '🌾 Harvesting',
            pest_control: '🛡️ Pest Control',
            pruning: '✂️ Pruning',
            photo_update: '📷 Photo Upload',
            milestone: '🏆 Milestone Reached',
        };
        const activityLabel = typeLabels[activityType] || activityType;

        const title = `${activityLabel} — ${farmName}`;
        const msg = `${farmerName} logged: ${description}`;
        const link = `/farms/${farmId}`;
        const metadata = { farmId, farmName, activityType, farmerName, farmerUserId };

        await Promise.all(
            [...investorIds].map((investorId) =>
                createNotification(investorId, 'activity_update', title, msg, {
                    senderId: farmerUserId,
                    metadata,
                    link,
                })
            )
        );
    } catch (err) {
        console.error('[NotificationService] notifyFarmActivity error:', err);
    }
}

module.exports = { createNotification, notifyFarmActivity };
