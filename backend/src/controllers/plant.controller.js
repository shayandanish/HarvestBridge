const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Create plant
 * @route POST /api/v1/farms/:farmId/plants
 */
const createPlant = async (req, res, next) => {
    try {
        const { farmId } = req.params;
        const { cropTypeId, uniqueIdentifier, plantDate, locationInFarm } = req.body;

        // Verify farmer owns the farm
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
                isActive: true,
            },
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found or access denied');
        }

        // Verify crop type exists
        const cropType = await prisma.cropType.findUnique({
            where: { id: cropTypeId },
        });

        if (!cropType) {
            return errorResponse(res, 404, 'Crop type not found');
        }

        // Calculate expected harvest date
        let expectedHarvestDate = null;
        if (plantDate && cropType.typicalGrowthDurationDays) {
            const plantDateObj = new Date(plantDate);
            expectedHarvestDate = new Date(
                plantDateObj.getTime() + cropType.typicalGrowthDurationDays * 24 * 60 * 60 * 1000
            );
        }

        // Create plant
        const plant = await prisma.plant.create({
            data: {
                farmId,
                cropTypeId,
                uniqueIdentifier,
                plantDate: plantDate ? new Date(plantDate) : null,
                locationInFarm,
                expectedHarvestDate,
                status: 'available',
            },
            include: {
                cropType: true,
                farm: {
                    select: {
                        id: true,
                        farmName: true,
                    },
                },
            },
        });

        return successResponse(res, 201, 'Plant created successfully', plant);
    } catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('uniqueIdentifier')) {
            return errorResponse(res, 409, 'Plant with this identifier already exists');
        }
        next(error);
    }
};

/**
 * Get plants for a farm
 * @route GET /api/v1/farms/:farmId/plants
 */
const getPlants = async (req, res, next) => {
    try {
        const { farmId } = req.params;
        const { status } = req.query;

        // Verify farmer owns the farm
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
                isActive: true,
            },
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found or access denied');
        }

        const where = {
            farmId,
            ...(status && { status }),
        };

        const plants = await prisma.plant.findMany({
            where,
            include: {
                cropType: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return successResponse(res, 200, 'Plants retrieved successfully', plants);
    } catch (error) {
        next(error);
    }
};

/**
 * Get plant by ID
 * @route GET /api/v1/plants/:id
 */
const getPlantById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verify farmer owns the farm that owns the plant
        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        const plant = await prisma.plant.findFirst({
            where: {
                id,
                farm: {
                    farmerId: farmer.id,
                    isActive: true,
                },
            },
            include: {
                cropType: true,
                farm: {
                    include: {
                        land: true,
                    },
                },
                investments: {
                    include: {
                        investor: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!plant) {
            return errorResponse(res, 404, 'Plant not found or access denied');
        }

        return successResponse(res, 200, 'Plant retrieved successfully', plant);
    } catch (error) {
        next(error);
    }
};

/**
 * Update plant
 * @route PUT /api/v1/plants/:id
 */
const updatePlant = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { uniqueIdentifier, plantDate, locationInFarm, status } = req.body;

        // Verify farmer owns the farm that owns the plant
        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        const plant = await prisma.plant.findFirst({
            where: {
                id,
                farm: {
                    farmerId: farmer.id,
                    isActive: true,
                },
            },
            include: {
                cropType: true,
            },
        });

        if (!plant) {
            return errorResponse(res, 404, 'Plant not found or access denied');
        }

        // Prevent update if plant is sponsored
        if (plant.status === 'sponsored') {
            return errorResponse(res, 400, 'Cannot update sponsored plant');
        }

        // Recalculate expected harvest date if plant date changes
        let expectedHarvestDate = plant.expectedHarvestDate;
        if (plantDate && plant.cropType.typicalGrowthDurationDays) {
            const plantDateObj = new Date(plantDate);
            expectedHarvestDate = new Date(
                plantDateObj.getTime() + plant.cropType.typicalGrowthDurationDays * 24 * 60 * 60 * 1000
            );
        }

        const updatedPlant = await prisma.plant.update({
            where: { id },
            data: {
                ...(uniqueIdentifier && { uniqueIdentifier }),
                ...(plantDate && { plantDate: new Date(plantDate), expectedHarvestDate }),
                ...(locationInFarm !== undefined && { locationInFarm }),
                ...(status && { status }),
            },
            include: {
                cropType: true,
            },
        });

        return successResponse(res, 200, 'Plant updated successfully', updatedPlant);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete plant (soft delete)
 * @route DELETE /api/v1/plants/:id
 */
const deletePlant = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verify farmer owns the farm that owns the plant
        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        const plant = await prisma.plant.findFirst({
            where: {
                id,
                farm: {
                    farmerId: farmer.id,
                    isActive: true,
                },
            },
        });

        if (!plant) {
            return errorResponse(res, 404, 'Plant not found or access denied');
        }

        // Prevent delete if plant is sponsored
        if (plant.status === 'sponsored') {
            return errorResponse(res, 400, 'Cannot delete sponsored plant');
        }

        // Soft delete
        await prisma.plant.update({
            where: { id },
            data: { status: 'inactive' },
        });

        return successResponse(res, 200, 'Plant deleted successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Update plant growth status (Farmer only)
 * @route PATCH /api/v1/plants/:id/growth
 */
const updatePlantGrowth = async (req, res, next) => {
    try {
        const { id } = req.params;
        let { growthStatus, locationInFarm, plantDate, notes, photoUrl } = req.body;

        // Handle file upload
        if (req.file) {
            const { processAndUploadImage } = require('../utils/fileUpload');
            photoUrl = await processAndUploadImage(req.file.buffer, req.file.originalname, 'growth_updates');
        }

        // Verify farmer owns/manages the farm that owns the plant
        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        const plant = await prisma.plant.findFirst({
            where: {
                id,
                farm: {
                    farmerId: farmer.id,
                    isActive: true,
                },
            },
        });

        if (!plant) {
            return errorResponse(res, 404, 'Plant not found or access denied');
        }

        // Use transaction to update plant and log activity
        const result = await prisma.$transaction(async (tx) => {
            const updatedPlant = await tx.plant.update({
                where: { id },
                data: {
                    ...(growthStatus && { growthStatus }),
                    ...(locationInFarm !== undefined && { locationInFarm }),
                    ...(plantDate && { plantDate: new Date(plantDate) }),
                },
            });

            // Log activity
            await tx.plantActivity.create({
                data: {
                    plantId: id,
                    farmId: plant.farmId,
                    activityType: 'growth_update',
                    description: `Growth status updated to: ${growthStatus || plant.growthStatus || 'N/A'}`,
                    activityDate: new Date(),
                    notes: notes || `Location: ${locationInFarm || 'N/A'}`,
                },
            });

            // If photo provided, log it
            if (photoUrl) {
                await tx.plantPhoto.create({
                    data: {
                        plantId: id,
                        farmId: plant.farmId,
                        photoUrl,
                        caption: notes || 'Growth update photo',
                        takenDate: new Date(),
                        isMilestone: true,
                    },
                });
            }

            return updatedPlant;
        });

        return successResponse(res, 200, 'Plant growth updated successfully', result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPlant,
    getPlants,
    getPlantById,
    updatePlant,
    updatePlantGrowth,
    deletePlant,
};
