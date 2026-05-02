const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger = require('../utils/logger');

/**
 * Raise a new dispute
 * @route POST /api/v1/disputes
 */
const raiseDispute = async (req, res, next) => {
    try {
        const { investmentId, disputeType, description, attachments } = req.body;
        const raisedById = req.user.id;

        // Verify investment exists and user is part of it
        const investment = await prisma.investment.findUnique({
            where: { id: investmentId },
            include: { investor: true, plant: { include: { farm: { include: { farmer: true } } } } }
        });

        if (!investment) return errorResponse(res, 404, 'Investment not found');

        const isInvestor = investment.investorId === raisedById;
        const isFarmer = investment.plant.farm.farmer.userId === raisedById;

        if (!isInvestor && !isFarmer) {
            return errorResponse(res, 403, 'You are not authorized to raise a dispute for this investment');
        }

        const dispute = await prisma.dispute.create({
            data: {
                investmentId,
                raisedById,
                disputeType,
                description,
                attachments,
                status: 'open'
            }
        });

        // Notify Admin and the other party
        const otherPartyId = isInvestor ? investment.plant.farm.farmer.userId : investment.investorId;

        await prisma.notification.createMany({
            data: [
                {
                    userId: otherPartyId,
                    title: 'Dispute Raised',
                    message: `A dispute has been raised regarding your investment ${investment.plant.uniqueIdentifier}.`,
                    type: 'system'
                },
                // In a real app, notify all admins or a specific support queue
            ]
        });

        return successResponse(res, 201, 'Dispute raised successfully', dispute);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all disputes (Admin)
 * @route GET /api/v1/admin/disputes
 */
const getAllDisputes = async (req, res, next) => {
    try {
        const { status, type, page = 1, limit = 50 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {
            ...(status && { status }),
            ...(type && { disputeType: type })
        };

        const [disputes, total] = await Promise.all([
            prisma.dispute.findMany({
                where,
                skip,
                take,
                include: {
                    raisedBy: { select: { fullName: true, role: true } },
                    investment: {
                        include: {
                            investor: { select: { fullName: true } },
                            plant: { include: { farm: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'asc' } // Oldest first for priority
            }),
            prisma.dispute.count({ where })
        ]);

        return successResponse(res, 200, 'Disputes retrieved successfully', {
            disputes,
            pagination: { total, page: parseInt(page), limit: parseInt(limit) }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get dispute details (Admin)
 */
const getDisputeById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const dispute = await prisma.dispute.findUnique({
            where: { id },
            include: {
                raisedBy: { select: { fullName: true, role: true, email: true, phone: true } },
                investment: {
                    include: {
                        investor: { select: { fullName: true, email: true, phone: true } },
                        plant: {
                            include: {
                                farm: { include: { farmer: { include: { user: true } } } },
                                cropType: true
                            }
                        },
                        payments: true
                    }
                },
                resolvedBy: { select: { fullName: true } }
            }
        });

        if (!dispute) return errorResponse(res, 404, 'Dispute not found');

        return successResponse(res, 200, 'Dispute details retrieved successfully', dispute);
    } catch (error) {
        next(error);
    }
};

/**
 * Update dispute status (Admin)
 */
const updateDisputeStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;

        const dispute = await prisma.dispute.update({
            where: { id },
            data: { status },
            include: { raisedBy: true, investment: { include: { investor: true, plant: { include: { farm: { include: { farmer: { include: { user: true } } } } } } } } }
        });

        // Notify parties if needed
        return successResponse(res, 200, 'Dispute status updated successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Resolve dispute (Admin)
 */
const resolveDispute = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { resolution, actions_taken } = req.body;

        const dispute = await prisma.dispute.update({
            where: { id },
            data: {
                status: 'resolved',
                resolution,
                resolvedById: req.user.id,
                resolvedAt: new Date()
            },
            include: { raisedBy: true, investment: { include: { investor: true, plant: { include: { farm: { include: { farmer: { include: { user: true } } } } } } } } }
        });

        // Execute actions (simplified)
        // e.g., if actions_taken.includes('refund'), trigger refund

        // Notify parties
        await prisma.notification.createMany({
            data: [
                {
                    userId: dispute.investment.investorId,
                    title: 'Dispute Resolved',
                    message: `Dispute #${dispute.id.substring(0, 8)} has been resolved. Resolution: ${resolution}`,
                    type: 'system'
                },
                {
                    userId: dispute.investment.plant.farm.farmer.userId,
                    title: 'Dispute Resolved',
                    message: `Dispute #${dispute.id.substring(0, 8)} has been resolved. Resolution: ${resolution}`,
                    type: 'system'
                }
            ]
        });

        return successResponse(res, 200, 'Dispute resolved successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    raiseDispute,
    getAllDisputes,
    getDisputeById,
    updateDisputeStatus,
    resolveDispute
};
