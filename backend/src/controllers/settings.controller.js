const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Get all platform settings
 * @route GET /api/v1/admin/settings
 */
const getAllSettings = async (req, res, next) => {
    try {
        const settings = await prisma.platformSetting.findMany({
            include: { updatedBy: { select: { fullName: true } } }
        });
        return successResponse(res, 200, 'Settings retrieved successfully', settings);
    } catch (error) {
        next(error);
    }
};

/**
 * Update platform setting
 * @route PUT /api/v1/admin/settings/:key
 */
const updateSetting = async (req, res, next) => {
    try {
        const { key } = req.params;
        const { settingValue, description } = req.body;

        const setting = await prisma.platformSetting.upsert({
            where: { settingKey: key },
            update: {
                settingValue,
                description,
                updatedById: req.user.id
            },
            create: {
                settingKey: key,
                settingValue,
                description,
                updatedById: req.user.id
            }
        });

        return successResponse(res, 200, 'Setting updated successfully', setting);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllSettings,
    updateSetting
};
