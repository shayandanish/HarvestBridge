const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

/**
 * Create a new email campaign
 * @route POST /api/v1/admin/campaigns
 */
const createCampaign = async (req, res, next) => {
    try {
        const { name, subject, body, recipientFilter } = req.body;

        const campaign = await prisma.emailCampaign.create({
            data: {
                name,
                subject,
                body,
                recipientFilter,
                status: 'draft'
            }
        });

        return successResponse(res, 201, 'Campaign created successfully', campaign);
    } catch (error) {
        next(error);
    }
};

/**
 * Send a campaign
 * @route POST /api/v1/admin/campaigns/:id/send
 */
const sendCampaign = async (req, res, next) => {
    try {
        const { id } = req.params;

        const campaign = await prisma.emailCampaign.findUnique({
            where: { id }
        });

        if (!campaign) return errorResponse(res, 404, 'Campaign not found');
        if (campaign.status === 'sent' || campaign.status === 'sending') {
            return errorResponse(res, 400, 'Campaign already sent or currently sending');
        }

        // 1. Resolve recipients based on filter
        const filter = campaign.recipientFilter;
        const where = {
            isActive: true,
            ...(filter.role && { role: filter.role }),
            ...(filter.isVerified !== undefined && { isVerified: filter.isVerified })
        };

        const recipients = await prisma.user.findMany({
            where,
            select: { email: true, fullName: true }
        });

        if (recipients.length === 0) {
            return errorResponse(res, 400, 'No recipients match the selected criteria');
        }

        // 2. Update status to sending
        await prisma.emailCampaign.update({
            where: { id },
            data: { status: 'sending' }
        });

        // 3. Send emails (simplified chunked processing)
        // In a real app, this should be a background job (Bull/Redis)
        let sentCount = 0;
        for (const recipient of recipients) {
            try {
                // Assuming emailService.sendGenericEmail exists or similar
                await emailService.sendGenericEmail(recipient.email, campaign.subject, campaign.body, recipient.fullName);
                sentCount++;
            } catch (err) {
                logger.error(`Failed to send campaign email to ${recipient.email}:`, err);
            }
        }

        // 4. Update status to sent
        const updatedCampaign = await prisma.emailCampaign.update({
            where: { id },
            data: {
                status: 'sent',
                sentCount,
                updatedAt: new Date()
            }
        });

        return successResponse(res, 200, 'Campaign started successfully', updatedCampaign);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all campaigns
 * @route GET /api/v1/admin/campaigns
 */
const getAllCampaigns = async (req, res, next) => {
    try {
        const campaigns = await prisma.emailCampaign.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return successResponse(res, 200, 'Campaigns retrieved successfully', campaigns);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a campaign
 */
const deleteCampaign = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.emailCampaign.delete({ where: { id } });
        return successResponse(res, 200, 'Campaign deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCampaign,
    sendCampaign,
    getAllCampaigns,
    deleteCampaign
};
