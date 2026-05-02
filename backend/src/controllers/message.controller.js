const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createNotification } = require('../utils/notification.service');

// Get io instance
const getIo = () => {
    try { return require('../../socketInstance').getIo(); } catch { return null; }
};

const messageController = {

    // POST /messages  — investor sends to one or more farmers
    sendMessage: async (req, res) => {
        try {
            const senderId = req.user.id;
            const { recipientId, recipientIds, content } = req.body;

            if (!content || !content.trim()) {
                return res.status(400).json({ status: 'error', message: 'Message content is required' });
            }

            // Support single or bulk recipients
            const targets = recipientIds || (recipientId ? [recipientId] : []);
            if (targets.length === 0) {
                return res.status(400).json({ status: 'error', message: 'At least one recipient is required' });
            }

            const sender = await prisma.user.findUnique({
                where: { id: senderId },
                select: { fullName: true },
            });

            const messages = [];
            for (const rid of targets) {
                const message = await prisma.message.create({
                    data: {
                        senderId,
                        recipientId: rid,
                        content: content.trim(),
                        isDelivered: false,
                        isRead: false,
                    },
                    include: {
                        sender: { select: { id: true, fullName: true, profilePhotoUrl: true } },
                        recipient: { select: { id: true, fullName: true, profilePhotoUrl: true } },
                    },
                });
                messages.push(message);

                // Emit real-time message to recipient
                const io = getIo();
                if (io) {
                    io.to(`user:${rid}`).emit('new_message', message);
                    // Mark as delivered immediately since we emitted it
                    await prisma.message.update({
                        where: { id: message.id },
                        data: { isDelivered: true },
                    });
                }

                // Create in-app notification for recipient
                await createNotification(
                    rid,
                    'message',
                    `📬 New message from ${sender.fullName}`,
                    content.trim().substring(0, 120),
                    {
                        senderId,
                        metadata: { senderId, senderName: sender.fullName },
                        link: '/messages',
                    }
                );
            }

            res.status(201).json({ status: 'success', data: messages.length === 1 ? messages[0] : messages });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Failed to send message' });
        }
    },

    // GET /messages/inbox  — current user's inbox (distinct conversations)
    getInbox: async (req, res) => {
        try {
            const userId = req.user.id;

            // Get latest message from each conversation partner
            const messages = await prisma.message.findMany({
                where: {
                    OR: [{ senderId: userId }, { recipientId: userId }],
                },
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: { select: { id: true, fullName: true, profilePhotoUrl: true } },
                    recipient: { select: { id: true, fullName: true, profilePhotoUrl: true } },
                },
            });

            // Group by conversation partner, keep latest per partner
            const conversations = {};
            for (const msg of messages) {
                const partnerId = msg.senderId === userId ? msg.recipientId : msg.senderId;
                if (!conversations[partnerId]) {
                    conversations[partnerId] = { ...msg, partner: msg.senderId === userId ? msg.recipient : msg.sender };
                }
            }

            res.json({ status: 'success', data: Object.values(conversations) });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Failed to fetch inbox' });
        }
    },

    // GET /messages/conversations/:userId  — full thread with a specific user
    getConversation: async (req, res) => {
        try {
            const myId = req.user.id;
            const { userId: otherId } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const messages = await prisma.message.findMany({
                where: {
                    OR: [
                        { senderId: myId, recipientId: otherId },
                        { senderId: otherId, recipientId: myId },
                    ],
                },
                orderBy: { createdAt: 'asc' },
                skip,
                take: parseInt(limit),
                include: {
                    sender: { select: { id: true, fullName: true, profilePhotoUrl: true } },
                },
            });

            // Mark messages from other user as delivered + read
            await prisma.message.updateMany({
                where: { senderId: otherId, recipientId: myId, isRead: false },
                data: { isRead: true, isDelivered: true },
            });

            res.json({ status: 'success', data: messages });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Failed to fetch conversation' });
        }
    },

    // PUT /messages/:id/read
    markAsRead: async (req, res) => {
        try {
            await prisma.message.updateMany({
                where: { id: req.params.id, recipientId: req.user.id },
                data: { isRead: true, isDelivered: true },
            });
            res.json({ status: 'success', message: 'Message marked as read' });
        } catch (error) {
            res.status(500).json({ status: 'error', message: 'Failed to mark message as read' });
        }
    },

    // GET /messages/unread-count
    getUnreadCount: async (req, res) => {
        try {
            const count = await prisma.message.count({
                where: { recipientId: req.user.id, isRead: false },
            });
            res.json({ status: 'success', count });
        } catch (error) {
            res.status(500).json({ status: 'error', message: 'Failed to count unread messages' });
        }
    },

    // GET /messages/contacts  — list users the current user can message
    // Investors: see their linked farmers; Farmers: see their linked investors
    getContacts: async (req, res) => {
        try {
            const userId = req.user.id;
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });

            let contacts = [];
            if (user.role === 'investor') {
                // Farmers from direct farm links
                const farmsWithFarmer = await prisma.farm.findMany({
                    where: { investorId: userId },
                    include: { farmer: { include: { user: { select: { id: true, fullName: true, profilePhotoUrl: true } } } } },
                });
                const farmerUsers = farmsWithFarmer
                    .filter((f) => f.farmer?.user)
                    .map((f) => f.farmer.user);

                // Farmers from plant investments
                const investments = await prisma.investment.findMany({
                    where: { investorId: userId },
                    include: { plant: { include: { farm: { include: { farmer: { include: { user: { select: { id: true, fullName: true, profilePhotoUrl: true } } } } } } } } },
                });
                investments.forEach((inv) => {
                    const u = inv.plant?.farm?.farmer?.user;
                    if (u && !farmerUsers.find((x) => x.id === u.id)) farmerUsers.push(u);
                });

                contacts = farmerUsers;
            } else if (user.role === 'farmer') {
                // Investors linked through their farms
                const farmer = await prisma.farmer.findUnique({ where: { userId } });
                if (farmer) {
                    const farms = await prisma.farm.findMany({
                        where: { farmerId: farmer.id, investorId: { not: null } },
                        include: { investor: { select: { id: true, fullName: true, profilePhotoUrl: true } } },
                    });
                    const investorUsers = farms.filter((f) => f.investor).map((f) => f.investor);
                    contacts = [...new Map(investorUsers.map((u) => [u.id, u])).values()];
                }
            }

            res.json({ status: 'success', data: contacts });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Failed to fetch contacts' });
        }
    },
};

module.exports = messageController;
