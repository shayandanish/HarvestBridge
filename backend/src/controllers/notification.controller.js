const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const notificationController = {

    // GET /notifications
    getNotifications: async (req, res) => {
        try {
            const userId = req.user.id;
            const { type, page = 1, limit = 20 } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const where = { userId };
            if (type && type !== 'all') where.type = type;

            const [notifications, total] = await Promise.all([
                prisma.notification.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: parseInt(limit),
                    include: {
                        sender: { select: { id: true, fullName: true, profilePhotoUrl: true } },
                    },
                }),
                prisma.notification.count({ where }),
            ]);

            const parsed = notifications.map((n) => ({
                ...n,
                metadata: n.metadata ? JSON.parse(n.metadata) : null,
            }));

            res.json({
                status: 'success',
                data: parsed,
                pagination: { page: parseInt(page), limit: parseInt(limit), total },
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
        }
    },

    // GET /notifications/count  (unread badge count)
    getUnreadCount: async (req, res) => {
        try {
            const count = await prisma.notification.count({
                where: { userId: req.user.id, isRead: false },
            });
            res.json({ status: 'success', count });
        } catch (error) {
            res.status(500).json({ status: 'error', message: 'Failed to count notifications' });
        }
    },

    // PUT /notifications/:id/read
    markAsRead: async (req, res) => {
        try {
            const notification = await prisma.notification.updateMany({
                where: { id: req.params.id, userId: req.user.id },
                data: { isRead: true },
            });
            res.json({ status: 'success', notification });
        } catch (error) {
            res.status(500).json({ status: 'error', message: 'Failed to mark as read' });
        }
    },

    // PUT /notifications/read-all
    markAllAsRead: async (req, res) => {
        try {
            await prisma.notification.updateMany({
                where: { userId: req.user.id, isRead: false },
                data: { isRead: true },
            });
            res.json({ status: 'success', message: 'All notifications marked as read' });
        } catch (error) {
            res.status(500).json({ status: 'error', message: 'Failed to mark all as read' });
        }
    },

    // DELETE /notifications/:id
    deleteNotification: async (req, res) => {
        try {
            await prisma.notification.deleteMany({
                where: { id: req.params.id, userId: req.user.id },
            });
            res.json({ status: 'success', message: 'Notification deleted' });
        } catch (error) {
            res.status(500).json({ status: 'error', message: 'Failed to delete notification' });
        }
    },
};

module.exports = notificationController;
