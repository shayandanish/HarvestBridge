const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { uploadToStorage, deleteFromStorage } = require('../config/storage');

/**
 * Create new land
 * @route POST /api/v1/lands
 */
const createLand = async (req, res, next) => {
    try {
        const {
            landName,
            totalArea,
            areaUnit,
            latitude,
            longitude,
            address,
            city,
            state,
            country,
            postalCode,
            specificLocation,
            soilQuality,
            waterAvailability,
            sunlightExposure,
            cultivablePlants,
            rentalFeeMonthly,
            minimumRentalPeriod,
            additionalNotes,
        } = req.body;


        // Get or create landowner profile
        let landowner = await prisma.landowner.findUnique({
            where: { userId: req.user.id },
        });

        if (!landowner) {
            landowner = await prisma.landowner.create({
                data: { userId: req.user.id },
            });
        }

        // Separate ownership document from land photos
        console.log('Received files:', {
            hasOwnershipDoc: !!req.files?.ownershipDocument,
            photoCount: req.files?.landPhotos?.length || 0
        });
        const ownershipDocFile = req.files?.ownershipDocument?.[0] || null;
        const landPhotoFiles = req.files?.landPhotos || [];

        // Upload ownership document if provided
        let ownershipDocumentUrl = null;
        if (ownershipDocFile) {
            ownershipDocumentUrl = await uploadToStorage(ownershipDocFile, 'land-documents');
        }

        // Upload land photos if provided
        let landPhotosJson = null;
        if (landPhotoFiles.length > 0) {
            const photoUrls = await Promise.all(
                landPhotoFiles.map(file => uploadToStorage(file, 'land-photos'))
            );
            landPhotosJson = JSON.stringify(photoUrls);
        }

        // Calculate overall rating
        let overallRating = null;
        const soil = soilQuality ? parseInt(soilQuality) : null;
        const water = waterAvailability ? parseInt(waterAvailability) : null;
        const sunlight = sunlightExposure ? parseInt(sunlightExposure) : null;
        if (soil && water && sunlight) {
            overallRating = (soil + water + sunlight) / 3;
        }

        // Parse cultivable plants
        let cultivablePlantsJson = null;
        if (cultivablePlants) {
            try {
                cultivablePlantsJson = typeof cultivablePlants === 'string'
                    ? cultivablePlants  // already a JSON string
                    : JSON.stringify(cultivablePlants);
            } catch {
                cultivablePlantsJson = cultivablePlants;
            }
        }

        // Create land
        const land = await prisma.land.create({
            data: {
                landownerId: landowner.id,
                landName,
                totalArea: parseFloat(totalArea),
                areaUnit,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                address,
                city,
                state,
                country,
                postalCode,
                specificLocation: specificLocation || null,
                ownershipDocumentUrl,
                landPhotos: landPhotosJson,
                soilQuality: soil,
                waterAvailability: water,
                sunlightExposure: sunlight,
                overallRating,
                cultivablePlants: cultivablePlantsJson,
                rentalFeeMonthly: rentalFeeMonthly ? parseFloat(rentalFeeMonthly) : null,
                minimumRentalPeriod: minimumRentalPeriod ? parseInt(minimumRentalPeriod) : null,
                additionalNotes: additionalNotes || null,
                isVerified: false,
                isActive: true,
            },
            include: {
                landowner: {
                    include: {
                        user: {
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

        return successResponse(
            res,
            201,
            'Land registered successfully. Pending admin verification.',
            land
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Get all lands for current landowner
 * @route GET /api/v1/lands
 */
const getLands = async (req, res, next) => {
    try {


        const landowner = await prisma.landowner.findUnique({
            where: { userId: req.user.id },
        });

        if (!landowner) {
            return successResponse(res, 200, 'No lands found', []);
        }

        const lands = await prisma.land.findMany({
            where: {
                landownerId: landowner.id,
                isActive: true,
            },
            include: {
                farms: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        farmName: true,
                        isApproved: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return successResponse(res, 200, 'Lands retrieved successfully', lands);
    } catch (error) {
        next(error);
    }
};

/**
 * Get land by ID
 * @route GET /api/v1/lands/:id
 */
const getLandById = async (req, res, next) => {
    try {
        const { id } = req.params;



        const landowner = await prisma.landowner.findUnique({
            where: { userId: req.user.id },
        });

        if (!landowner) {
            return errorResponse(res, 404, 'Landowner profile not found');
        }

        const land = await prisma.land.findFirst({
            where: {
                id,
                landownerId: landowner.id,
                isActive: true,
            },
            include: {
                landowner: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                phone: true,
                            },
                        },
                    },
                },
                farms: {
                    where: { isActive: true },
                    include: {
                        farmer: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!land) {
            return errorResponse(res, 404, 'Land not found or access denied');
        }

        return successResponse(res, 200, 'Land retrieved successfully', land);
    } catch (error) {
        next(error);
    }
};

/**
 * Update land
 * @route PUT /api/v1/lands/:id
 */
const updateLand = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            landName,
            totalArea,
            areaUnit,
            latitude,
            longitude,
            address,
            city,
            state,
            country,
            postalCode,
        } = req.body;


        const landowner = await prisma.landowner.findUnique({
            where: { userId: req.user.id },
        });

        if (!landowner) {
            return errorResponse(res, 404, 'Landowner profile not found');
        }

        // Check ownership and if land has active farms
        const land = await prisma.land.findFirst({
            where: {
                id,
                landownerId: landowner.id,
                isActive: true,
            },
            include: {
                farms: {
                    where: {
                        isActive: true,
                        isApproved: true,
                    },
                },
            },
        });

        if (!land) {
            return errorResponse(res, 404, 'Land not found or access denied');
        }

        if (land.farms.length > 0) {
            return errorResponse(
                res,
                400,
                'Cannot update land with active approved farms'
            );
        }

        // Upload new ownership document if provided
        let ownershipDocumentUrl = land.ownershipDocumentUrl;
        if (req.file) {
            // Delete old document
            if (land.ownershipDocumentUrl) {
                try {
                    await deleteFromStorage(land.ownershipDocumentUrl);
                } catch (deleteError) {
                    console.error('Failed to delete old document:', deleteError);
                }
            }
            ownershipDocumentUrl = await uploadToStorage(req.file, 'land-documents');
        }

        // Update land
        const updatedLand = await prisma.land.update({
            where: { id },
            data: {
                ...(landName && { landName }),
                ...(totalArea && { totalArea: parseFloat(totalArea) }),
                ...(areaUnit && { areaUnit }),
                ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
                ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
                ...(address !== undefined && { address }),
                ...(city !== undefined && { city }),
                ...(state !== undefined && { state }),
                ...(country !== undefined && { country }),
                ...(postalCode !== undefined && { postalCode }),
                ...(ownershipDocumentUrl && { ownershipDocumentUrl }),
                // Reset verification if document changed
                ...(req.file && { isVerified: false, rejectionReason: null }),
            },
        });

        return successResponse(res, 200, 'Land updated successfully', updatedLand);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete land (soft delete)
 * @route DELETE /api/v1/lands/:id
 */
const deleteLand = async (req, res, next) => {
    try {
        const { id } = req.params;


        const landowner = await prisma.landowner.findUnique({
            where: { userId: req.user.id },
        });

        if (!landowner) {
            return errorResponse(res, 404, 'Landowner profile not found');
        }

        // Check ownership and if land has active farms
        const land = await prisma.land.findFirst({
            where: {
                id,
                landownerId: landowner.id,
                isActive: true,
            },
            include: {
                farms: {
                    where: { isActive: true },
                },
            },
        });

        if (!land) {
            return errorResponse(res, 404, 'Land not found or access denied');
        }

        if (land.farms.length > 0) {
            return errorResponse(
                res,
                400,
                'Cannot delete land with active farms. Please remove all farms first.'
            );
        }

        // Soft delete
        await prisma.land.update({
            where: { id },
            data: { isActive: false },
        });

        return successResponse(res, 200, 'Land deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createLand,
    getLands,
    getLandById,
    updateLand,
    deleteLand,
};
