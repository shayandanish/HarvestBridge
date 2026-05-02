const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { uploadToStorage, deleteFromStorage } = require('../config/storage');
const { createNotification } = require('../utils/notification.service');

/**
 * Create or update farmer profile
 * @route POST /api/v1/farmer/profile
 */
const createFarmerProfile = async (req, res, next) => {
    try {
        const {
            experienceYears,
            specialization,
            certifications,
            bankAccountName,
            bankAccountNumber,
            bankName,
            bankBranch,
            // New public profile fields
            age,
            location,
            services,
            chargesPerTask,
            bio,
            isProfilePublic,
        } = req.body;

        // Check if user is a farmer
        if (req.user.role !== 'farmer') {
            return errorResponse(res, 403, 'Only farmers can create farmer profiles');
        }

        // Serialize services array to JSON string for storage
        const servicesJson = services ? JSON.stringify(services) : undefined;

        // Check if profile exists
        const existingProfile = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        let farmer;
        if (existingProfile) {
            farmer = await prisma.farmer.update({
                where: { userId: req.user.id },
                data: {
                    ...(experienceYears !== undefined && { experienceYears }),
                    ...(specialization && { specialization }),
                    ...(certifications !== undefined && { certifications }),
                    ...(bankAccountName && { bankAccountName }),
                    ...(bankAccountNumber && { bankAccountNumber }),
                    ...(bankName && { bankName }),
                    ...(bankBranch && { bankBranch }),
                    ...(age !== undefined && { age }),
                    ...(location !== undefined && { location }),
                    ...(servicesJson !== undefined && { services: servicesJson }),
                    ...(chargesPerTask !== undefined && { chargesPerTask }),
                    ...(bio !== undefined && { bio }),
                    ...(isProfilePublic !== undefined && { isProfilePublic }),
                    // Clear rejection reason on update so farmer knows it's "re-submitted"
                    ...(!existingProfile.isVerified && { rejectionReason: null }),
                },
            });
        } else {
            farmer = await prisma.farmer.create({
                data: {
                    userId: req.user.id,
                    experienceYears,
                    specialization,
                    certifications,
                    bankAccountName,
                    bankAccountNumber,
                    bankName,
                    bankBranch,
                    age,
                    location,
                    ...(servicesJson && { services: servicesJson }),
                    chargesPerTask,
                    bio,
                    isProfilePublic: isProfilePublic !== undefined ? isProfilePublic : true,
                },
            });
        }

        // Parse services back to array before returning
        if (farmer.services) {
            try { farmer.services = JSON.parse(farmer.services); } catch (_) { }
        }

        return successResponse(res, 200, 'Farmer profile saved successfully', farmer);
    } catch (error) {
        next(error);
    }
};

/**
 * Get farmer profile
 * @route GET /api/v1/farmer/profile
 */
const getFarmerProfile = async (req, res, next) => {
    try {
        // Check if user is a farmer
        if (req.user.role !== 'farmer') {
            return errorResponse(res, 403, 'Only farmers can access farmer profiles');
        }

        const farmer = await prisma.farmer.findUnique({
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
                farms: {
                    include: {
                        land: true,
                    },
                },
            },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        // Parse services back to array before returning
        if (farmer.services) {
            try { farmer.services = JSON.parse(farmer.services); } catch (_) { }
        }

        return successResponse(res, 200, 'Farmer profile retrieved successfully', farmer);
    } catch (error) {
        next(error);
    }
};

/**
 * Get available lands for farming
 * @route GET /api/v1/lands/available
 */
const getAvailableLands = async (req, res, next) => {
    try {
        const { city, state, areaMin, areaMax, page = 1, limit = 20 } = req.query;

        const where = {
            isVerified: true,
            isActive: true,
            ...(city && { city: { contains: city, mode: 'insensitive' } }),
            ...(state && { state: { contains: state, mode: 'insensitive' } }),
            ...(areaMin && { totalArea: { gte: parseFloat(areaMin) } }),
            ...(areaMax && { totalArea: { lte: parseFloat(areaMax) } }),
        };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [lands, total] = await Promise.all([
            prisma.land.findMany({
                where,
                include: {
                    landowner: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    fullName: true,
                                },
                            },
                        },
                    },
                    farms: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            farmName: true,
                            farmer: {
                                select: {
                                    isVerified: true,
                                    user: {
                                        select: {
                                            id: true,
                                            fullName: true,
                                            profilePhotoUrl: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
            }),
            prisma.land.count({ where }),
        ]);

        return successResponse(res, 200, 'Available lands retrieved successfully', {
            lands,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new farm
 * @route POST /api/v1/farms
 */
const createFarm = async (req, res, next) => {
    try {
        const { landId, farmName, description, totalArea, areaUnit, isOrganic } = req.body;

        // Get or create farmer profile
        let farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            farmer = await prisma.farmer.create({
                data: { userId: req.user.id },
            });
        }

        // Validate land exists and is verified
        const land = await prisma.land.findFirst({
            where: {
                id: landId,
                isVerified: true,
                isActive: true,
            },
        });

        if (!land) {
            return errorResponse(res, 404, 'Land not found or not verified');
        }

        // Create farm
        const farm = await prisma.farm.create({
            data: {
                farmerId: farmer.id,
                landId,
                farmName,
                description,
                totalArea: totalArea ? parseFloat(totalArea) : null,
                areaUnit: areaUnit || land.areaUnit,
                isOrganic: isOrganic || false,
                isApproved: false,
                hiringStatus: 'accepted' // Direct creation by farmer is automatically accepted
            },
            include: {
                land: {
                    include: {
                        landowner: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                    },
                                },
                            },
                        },
                    },
                },
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
        });

        return successResponse(
            res,
            201,
            'Farm created successfully. Pending admin approval.',
            farm
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Get all farms for current farmer
 * @route GET /api/v1/farms
 */
const getFarms = async (req, res, next) => {
    try {
        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return successResponse(res, 200, 'No farms found', []);
        }

        const farms = await prisma.farm.findMany({
            where: {
                farmerId: farmer.id,
                isActive: true,
            },
            include: {
                land: {
                    include: {
                        landowner: {
                            include: {
                                user: {
                                    select: {
                                        fullName: true,
                                    },
                                },
                            },
                        },
                    },
                },
                investor: {
                    select: {
                        fullName: true,
                        email: true,
                    }
                },
                photos: {
                    where: { isPrimary: true },
                    take: 1,
                },
                plants: {
                    where: { status: { not: 'inactive' } },
                },
                plantationRequests: {
                    where: { status: 'pending' },
                    include: {
                        items: {
                            include: {
                                tree: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        return successResponse(res, 200, 'Farms retrieved successfully', farms);
    } catch (error) {
        next(error);
    }
};

/**
 * Get farm by ID
 * @route GET /api/v1/farms/:id
 */
const getFarmById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        const farm = await prisma.farm.findFirst({
            where: {
                id,
                farmerId: farmer.id,
                isActive: true,
            },
            include: {
                land: {
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
                    },
                },
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
                photos: {
                    orderBy: [
                        { isPrimary: 'desc' },
                        { displayOrder: 'asc' },
                    ],
                },
                plants: {
                    where: { status: { not: 'inactive' } },
                    include: {
                        cropType: true,
                    },
                },
                plantationRequests: {
                    include: {
                        items: {
                            include: {
                                tree: true
                            }
                        }
                    }
                },
                trackingActivities: {
                    orderBy: { activityDate: 'desc' },
                },
                trackingPhotos: {
                    orderBy: { takenDate: 'desc' },
                },
                trackingMilestones: {
                    orderBy: { milestoneDate: 'desc' },
                },
            },
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found or access denied');
        }

        return successResponse(res, 200, 'Farm retrieved successfully', farm);
    } catch (error) {
        next(error);
    }
};

/**
 * Update farm
 * @route PUT /api/v1/farms/:id
 */
const updateFarm = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { farmName, description, totalArea, areaUnit, isOrganic } = req.body;

        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        // Check ownership
        const farm = await prisma.farm.findFirst({
            where: {
                id,
                farmerId: farmer.id,
                isActive: true,
            },
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found or access denied');
        }

        // Update farm
        const updatedFarm = await prisma.farm.update({
            where: { id },
            data: {
                ...(farmName && { farmName }),
                ...(description !== undefined && { description }),
                ...(totalArea && { totalArea: parseFloat(totalArea) }),
                ...(areaUnit && { areaUnit }),
                ...(isOrganic !== undefined && { isOrganic }),
            },
            include: {
                land: true,
                photos: true,
            },
        });

        return successResponse(res, 200, 'Farm updated successfully', updatedFarm);
    } catch (error) {
        next(error);
    }
};

/**
 * Upload farm photos
 * @route POST /api/v1/farms/:id/photos
 */
const uploadFarmPhotos = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { captions } = req.body; // Array of captions

        if (!req.files || req.files.length === 0) {
            return errorResponse(res, 400, 'No photos uploaded');
        }

        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        // Check ownership
        const farm = await prisma.farm.findFirst({
            where: {
                id,
                farmerId: farmer.id,
                isActive: true,
            },
            include: {
                photos: true,
            },
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found or access denied');
        }

        // Check if farm has primary photo
        const hasPrimary = farm.photos.some(photo => photo.isPrimary);

        // Upload photos
        const uploadPromises = req.files.map(async (file, index) => {
            const photoUrl = await uploadToStorage(file, 'farm-photos');
            const captionArray = captions ? JSON.parse(captions) : [];

            return prisma.farmPhoto.create({
                data: {
                    farmId: id,
                    photoUrl,
                    caption: captionArray[index] || null,
                    isPrimary: !hasPrimary && index === 0, // Set first as primary if none exists
                    displayOrder: farm.photos.length + index,
                },
            });
        });

        const uploadedPhotos = await Promise.all(uploadPromises);

        return successResponse(
            res,
            201,
            'Photos uploaded successfully',
            uploadedPhotos
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Update farm photo
 * @route PUT /api/v1/farms/:id/photos/:photoId
 */
const updateFarmPhoto = async (req, res, next) => {
    try {
        const { id, photoId } = req.params;
        const { caption, isPrimary } = req.body;

        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        // Verify ownership
        const farm = await prisma.farm.findFirst({
            where: {
                id,
                farmerId: farmer.id,
                isActive: true,
            },
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found or access denied');
        }

        // Verify photo belongs to farm
        const photo = await prisma.farmPhoto.findFirst({
            where: {
                id: photoId,
                farmId: id,
            },
        });

        if (!photo) {
            return errorResponse(res, 404, 'Photo not found');
        }

        // If setting as primary, unset other primary photos
        if (isPrimary === true) {
            await prisma.farmPhoto.updateMany({
                where: {
                    farmId: id,
                    isPrimary: true,
                },
                data: { isPrimary: false },
            });
        }

        // Update photo
        const updatedPhoto = await prisma.farmPhoto.update({
            where: { id: photoId },
            data: {
                ...(caption !== undefined && { caption }),
                ...(isPrimary !== undefined && { isPrimary }),
            },
        });

        return successResponse(res, 200, 'Photo updated successfully', updatedPhoto);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete farm photo
 * @route DELETE /api/v1/farms/:id/photos/:photoId
 */
const deleteFarmPhoto = async (req, res, next) => {
    try {
        const { id, photoId } = req.params;

        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        // Verify ownership
        const farm = await prisma.farm.findFirst({
            where: {
                id,
                farmerId: farmer.id,
                isActive: true,
            },
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found or access denied');
        }

        // Get photo
        const photo = await prisma.farmPhoto.findFirst({
            where: {
                id: photoId,
                farmId: id,
            },
        });

        if (!photo) {
            return errorResponse(res, 404, 'Photo not found');
        }

        // Delete from storage
        try {
            await deleteFromStorage(photo.photoUrl);
        } catch (deleteError) {
            console.error('Failed to delete photo from storage:', deleteError);
        }

        // Delete from database
        await prisma.farmPhoto.delete({
            where: { id: photoId },
        });

        // If deleted photo was primary, set another as primary
        if (photo.isPrimary) {
            const firstPhoto = await prisma.farmPhoto.findFirst({
                where: { farmId: id },
                orderBy: { displayOrder: 'asc' },
            });

            if (firstPhoto) {
                await prisma.farmPhoto.update({
                    where: { id: firstPhoto.id },
                    data: { isPrimary: true },
                });
            }
        }

        return successResponse(res, 200, 'Photo deleted successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get public list of farmers (for investors)
 * @route GET /api/v1/public/farmers
 */
const getPublicFarmers = async (req, res, next) => {
    try {
        const { service, location, page = 1, limit = 20 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const farmers = await prisma.farmer.findMany({
            where: {
                isProfilePublic: true,
                isVerified: true, // Only show verified farmers in the directory
                ...(location && { location: { contains: location } }),
                ...(service && { services: { contains: service } }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePhotoUrl: true,
                        phone: true,
                    },
                },
            },
            skip,
            take: parseInt(limit),
            orderBy: { rating: 'desc' },
        });

        // Parse services JSON
        const parsed = farmers.map(f => ({
            ...f,
            services: f.services ? (() => { try { return JSON.parse(f.services); } catch (_) { return []; } })() : [],
            // Exclude bank details from public listing
            bankAccountName: undefined,
            bankAccountNumber: undefined,
            bankName: undefined,
            bankBranch: undefined,
        }));

        const total = await prisma.farmer.count({
            where: {
                isProfilePublic: true,
                isVerified: true,
                ...(location && { location: { contains: location } }),
                ...(service && { services: { contains: service } }),
            },
        });

        return successResponse(res, 200, 'Farmers retrieved successfully', {
            farmers: parsed,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single farmer's public profile
 * @route GET /api/v1/public/farmers/:id
 */
const getPublicFarmerById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const farmer = await prisma.farmer.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePhotoUrl: true,
                        phone: true,
                    },
                },
                farms: {
                    where: { isActive: true, isApproved: true },
                    select: { id: true, farmName: true },
                },
                _count: { select: { harvestReviews: true } },
            },
        });

        if (!farmer || !farmer.isProfilePublic || !farmer.isVerified) {
            return errorResponse(res, 404, 'Farmer profile not found, not public, or not verified');
        }

        // Parse services, strip bank details
        const { bankAccountName, bankAccountNumber, bankName, bankBranch, ...publicFarmer } = farmer;
        publicFarmer.services = publicFarmer.services
            ? (() => { try { return JSON.parse(publicFarmer.services); } catch (_) { return []; } })()
            : [];

        return successResponse(res, 200, 'Farmer profile retrieved successfully', publicFarmer);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete farm
 * @route DELETE /api/v1/farms/:id
 */
const deleteFarm = async (req, res, next) => {
    try {
        const { id } = req.params;

        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        // Check ownership
        const farm = await prisma.farm.findFirst({
            where: {
                id,
                farmerId: farmer.id,
            },
            include: {
                photos: true,
            }
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found or access denied');
        }

        // Delete photos from storage
        const photoDeletePromises = farm.photos.map(photo =>
            deleteFromStorage(photo.photoUrl).catch(err => console.error('Storage delete error:', err))
        );
        await Promise.all(photoDeletePromises);

        // Delete farm (Prisma will handle cascading deletes for photos if configured, 
        // but we explicitly delete them from storage above)
        await prisma.farm.delete({
            where: { id },
        });

        return successResponse(res, 200, 'Farm deleted successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Delete farmer profile
 * @route DELETE /api/v1/farmer/profile
 */
const deleteFarmerProfile = async (req, res, next) => {
    try {
        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
            include: {
                farms: {
                    include: {
                        photos: true
                    }
                }
            }
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        // Cleanup storage for all farms
        const cleanupPromises = [];
        farmer.farms.forEach(farm => {
            farm.photos.forEach(photo => {
                cleanupPromises.push(
                    deleteFromStorage(photo.photoUrl).catch(err => console.error('Storage error:', err))
                );
            });
        });
        await Promise.all(cleanupPromises);

        // Delete farmer profile (Cascades to farms, photos etc in DB)
        await prisma.farmer.delete({
            where: { userId: req.user.id },
        });

        return successResponse(res, 200, 'Farmer profile and all associated data deleted successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Accept a hiring request from an investor
 * @route POST /api/v1/farmer/farms/:id/accept-hiring
 */
const acceptHiring = async (req, res, next) => {
    try {
        const { id } = req.params;
        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id }
        });

        if (!farmer) return errorResponse(res, 404, 'Farmer profile not found');

        const farm = await prisma.farm.findFirst({
            where: { id, farmerId: farmer.id, hiringStatus: 'pending' }
        });

        if (!farm) return errorResponse(res, 404, 'Hiring request not found or already processed');

        const updatedFarm = await prisma.farm.update({
            where: { id },
            data: { hiringStatus: 'awaiting_payment' }
        });

        // Create notification for investor
        await createNotification(
            farm.investorId,
            'system',
            'Hiring Request Accepted',
            `Farmer ${req.user.fullName} has accepted your hiring request for farm "${farm.farmName}". Please proceed with payment.`,
            { link: '/investor/investments', metadata: { farmId: id, farmName: farm.farmName } }
        );

        return successResponse(res, 200, 'Hiring request accepted', updatedFarm);
    } catch (error) {
        next(error);
    }
};

/**
 * Reject a hiring request from an investor
 * @route POST /api/v1/farmer/farms/:id/reject-hiring
 */
const rejectHiring = async (req, res, next) => {
    try {
        const { id } = req.params;
        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id }
        });

        if (!farmer) return errorResponse(res, 404, 'Farmer profile not found');

        const farm = await prisma.farm.findFirst({
            where: { id, farmerId: farmer.id, hiringStatus: 'pending' }
        });

        if (!farm) return errorResponse(res, 404, 'Hiring request not found or already processed');

        const updatedFarm = await prisma.farm.update({
            where: { id },
            data: { farmerId: null, hiringStatus: 'rejected', paymentRequestSent: false }
        });

        // Create notification for investor
        await createNotification(
            farm.investorId,
            'system',
            'Hiring Request Rejected',
            `Farmer ${req.user.fullName} has declined your hiring request for farm "${farm.farmName}".`,
            { link: '/investor/investments', metadata: { farmId: id, farmName: farm.farmName } }
        );

        return successResponse(res, 200, 'Hiring request rejected', updatedFarm);
    } catch (error) {
        next(error);
    }
};

/**
 * Get farmer earnings (received payments)
 * @route GET /api/v1/farmer/earnings
 */
const getEarnings = async (req, res, next) => {
    try {
        const payments = await prisma.payment.findMany({
            where: {
                recipientId: req.user.id,
                status: 'completed'
            },
            include: {
                farm: {
                    select: {
                        id: true,
                        farmName: true,
                        investor: {
                            select: {
                                fullName: true
                            }
                        }
                    }
                }
            },
            orderBy: { paidAt: 'desc' }
        });

        const totalEarned = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

        return successResponse(res, 200, 'Earnings retrieved successfully', {
            payments,
            totalEarned
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Request payment from investor for a farm
 * @route POST /api/v1/farmer/farms/:id/request-payment
 */
const requestPayment = async (req, res, next) => {
    try {
        const { id } = req.params;

        const farm = await prisma.farm.findFirst({
            where: {
                id,
                farmer: { userId: req.user.id }
            },
            include: {
                investor: true
            }
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found or access denied');
        }

        if (farm.hiringStatus !== 'awaiting_payment') {
            return errorResponse(res, 400, 'Payment can only be requested for farms awaiting payment');
        }

        if (!farm.investorId) {
            return errorResponse(res, 400, 'This farm has no associated investor to request payment from');
        }

        // Update farm status to track that a request has been sent
        await prisma.farm.update({
            where: { id },
            data: { paymentRequestSent: true }
        });

        // Create notification for investor
        await prisma.notification.create({
            data: {
                userId: farm.investorId,
                type: 'payment_alert',
                title: 'Payment Request Received',
                message: `Farmer ${req.user.fullName} has requested payment for their charges on farm "${farm.farmName}". Please complete the payment to finalize the hiring.`
            }
        });

        return successResponse(res, 200, 'Payment request sent to investor successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get managed farms for current farmer
 * @route GET /api/v1/farmer/managed-farms
 */
const getManagedFarms = async (req, res, next) => {
    try {
        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        const farms = await prisma.farm.findMany({
            where: {
                farmerId: farmer.id,
                isActive: true,
            },
            include: {
                investor: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    }
                },
                photos: {
                    where: { isPrimary: true },
                    take: 1,
                },
                land: true,
                plants: {
                    include: {
                        cropType: true,
                    }
                },
                _count: {
                    select: { plants: true }
                },
                plantationRequests: {
                    where: { status: 'pending' },
                    include: {
                        items: {
                            include: {
                                tree: true
                            }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return successResponse(res, 200, 'Managed farms retrieved successfully', farms);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createFarmerProfile,
    getFarmerProfile,
    getAvailableLands,
    createFarm,
    getFarms,
    getFarmById,
    updateFarm,
    uploadFarmPhotos,
    updateFarmPhoto,
    deleteFarmPhoto,
    getPublicFarmers,
    getPublicFarmerById,
    deleteFarm,
    acceptHiring,
    rejectHiring,
    deleteFarmerProfile,
    getEarnings,
    requestPayment,
    getManagedFarms
};
