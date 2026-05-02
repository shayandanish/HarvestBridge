const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Create or update landowner profile
 * @route POST /api/v1/landowner/profile
 */
const createLandownerProfile = async (req, res, next) => {
    try {
        const { totalLandArea, landUnit } = req.body;

        // Check if user is a landowner
        if (req.user.role !== 'landowner') {
            return errorResponse(res, 403, 'Only landowners can create landowner profiles');
        }

        // Check if profile exists
        const existingProfile = await prisma.landowner.findUnique({
            where: { userId: req.user.id },
        });

        let landowner;
        if (existingProfile) {
            // Update existing profile
            landowner = await prisma.landowner.update({
                where: { userId: req.user.id },
                data: {
                    ...(totalLandArea !== undefined && { totalLandArea }),
                    ...(landUnit && { landUnit }),
                },
            });
        } else {
            // Create new profile
            landowner = await prisma.landowner.create({
                data: {
                    userId: req.user.id,
                    totalLandArea,
                    landUnit,
                },
            });
        }

        return successResponse(res, 200, 'Landowner profile saved successfully', landowner);
    } catch (error) {
        next(error);
    }
};

/**
 * Get landowner profile
 * @route GET /api/v1/landowner/profile
 */
const getLandownerProfile = async (req, res, next) => {
    try {
        // Check if user is a landowner
        if (req.user.role !== 'landowner') {
            return errorResponse(res, 403, 'Only landowners can access landowner profiles');
        }

        const landowner = await prisma.landowner.findUnique({
            where: { userId: req.user.id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        phone: true,
                        profilePhotoUrl: true,
                    },
                },
                lands: {
                    include: {
                        farms: true,
                    },
                },
            },
        });

        if (!landowner) {
            return errorResponse(res, 404, 'Landowner profile not found');
        }

        return successResponse(res, 200, 'Landowner profile retrieved successfully', landowner);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createLandownerProfile,
    getLandownerProfile,
};
