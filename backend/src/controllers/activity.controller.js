const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Create activity
 * @route POST /api/v1/farms/:id/activities
 */
const createActivity = async (req, res, next) => {
    try {
        const { id: farmId } = req.params;
        const { activityName, description, pricePerPerson, durationMinutes, maxParticipants } = req.body;

        // Verify ownership
        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        const farm = await prisma.farm.findFirst({
            where: {
                id: farmId,
                farmerId: farmer.id,
            },
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found or access denied');
        }

        const activity = await prisma.additionalActivity.create({
            data: {
                farmId,
                activityName,
                description,
                pricePerPerson: parseFloat(pricePerPerson),
                durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
                maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
            },
        });

        return successResponse(res, 201, 'Activity created successfully', activity);
    } catch (error) {
        next(error);
    }
};

/**
 * Get activities
 * @route GET /api/v1/farms/:id/activities
 */
const getActivities = async (req, res, next) => {
    try {
        const { id: farmId } = req.params;

        const activities = await prisma.additionalActivity.findMany({
            where: {
                farmId,
                isAvailable: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return successResponse(res, 200, 'Activities retrieved successfully', activities);
    } catch (error) {
        next(error);
    }
};

/**
 * Update activity
 * @route PUT /api/v1/farms/:id/activities/:activityId
 */
const updateActivity = async (req, res, next) => {
    try {
        const { id: farmId, activityId } = req.params;
        const { activityName, description, pricePerPerson, durationMinutes, maxParticipants, isAvailable } = req.body;

        // Verify ownership
        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        const farm = await prisma.farm.findFirst({
            where: {
                id: farmId,
                farmerId: farmer.id,
            },
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found or access denied');
        }

        const activity = await prisma.additionalActivity.update({
            where: { id: activityId },
            data: {
                ...(activityName && { activityName }),
                ...(description && { description }),
                ...(pricePerPerson && { pricePerPerson: parseFloat(pricePerPerson) }),
                ...(durationMinutes && { durationMinutes: parseInt(durationMinutes) }),
                ...(maxParticipants && { maxParticipants: parseInt(maxParticipants) }),
                ...(isAvailable !== undefined && { isAvailable }),
            },
        });

        return successResponse(res, 200, 'Activity updated successfully', activity);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete activity (soft delete)
 * @route DELETE /api/v1/farms/:id/activities/:activityId
 */
const deleteActivity = async (req, res, next) => {
    try {
        const { id: farmId, activityId } = req.params;

        // Verify ownership
        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        const farm = await prisma.farm.findFirst({
            where: {
                id: farmId,
                farmerId: farmer.id,
            },
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found or access denied');
        }

        // Soft delete
        await prisma.additionalActivity.update({
            where: { id: activityId },
            data: { isAvailable: false },
        });

        return successResponse(res, 200, 'Activity deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createActivity,
    getActivities,
    updateActivity,
    deleteActivity,
};
