const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Get all crop types
 * @route GET /api/v1/crop-types
 */
const getCropTypes = async (req, res, next) => {
    try {
        const { category } = req.query;

        const where = {
            ...(category && { category }),
        };

        const cropTypes = await prisma.cropType.findMany({
            where,
            orderBy: { name: 'asc' },
        });

        return successResponse(res, 200, 'Crop types retrieved successfully', cropTypes);
    } catch (error) {
        next(error);
    }
};

/**
 * Create crop type (Admin only)
 * @route POST /api/v1/crop-types
 */
const createCropType = async (req, res, next) => {
    try {
        const {
            name,
            category,
            typicalGrowthDurationDays,
            typicalYieldPerPlant,
            yieldUnit,
            description,
            careInstructions,
        } = req.body;

        // Check if crop type already exists
        const existing = await prisma.cropType.findUnique({
            where: { name },
        });

        if (existing) {
            return errorResponse(res, 409, 'Crop type with this name already exists');
        }

        const cropType = await prisma.cropType.create({
            data: {
                name,
                category,
                typicalGrowthDurationDays: typicalGrowthDurationDays ? parseInt(typicalGrowthDurationDays) : null,
                typicalYieldPerPlant: typicalYieldPerPlant ? parseFloat(typicalYieldPerPlant) : null,
                yieldUnit,
                description,
                careInstructions,
            },
        });

        return successResponse(res, 201, 'Crop type created successfully', cropType);
    } catch (error) {
        next(error);
    }
};

/**
 * Update crop type (Admin only)
 * @route PUT /api/v1/crop-types/:id
 */
const updateCropType = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            name,
            category,
            typicalGrowthDurationDays,
            typicalYieldPerPlant,
            yieldUnit,
            description,
            careInstructions,
        } = req.body;

        const cropType = await prisma.cropType.findUnique({
            where: { id },
        });

        if (!cropType) {
            return errorResponse(res, 404, 'Crop type not found');
        }

        const updatedCropType = await prisma.cropType.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(category && { category }),
                ...(typicalGrowthDurationDays !== undefined && {
                    typicalGrowthDurationDays: typicalGrowthDurationDays ? parseInt(typicalGrowthDurationDays) : null,
                }),
                ...(typicalYieldPerPlant !== undefined && {
                    typicalYieldPerPlant: typicalYieldPerPlant ? parseFloat(typicalYieldPerPlant) : null,
                }),
                ...(yieldUnit !== undefined && { yieldUnit }),
                ...(description !== undefined && { description }),
                ...(careInstructions !== undefined && { careInstructions }),
            },
        });

        return successResponse(res, 200, 'Crop type updated successfully', updatedCropType);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCropTypes,
    createCropType,
    updateCropType,
};
