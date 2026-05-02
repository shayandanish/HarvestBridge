const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger = require('../utils/logger');
const { uploadMultipleImages } = require('../utils/fileUpload');
const emailService = require('../utils/emailService');
const { syncFarmerRating } = require('../utils/ratingUtils');

/**
 * Record a new harvest (Farmer only)
 * @route POST /api/v1/plants/:id/harvest
 */
exports.recordHarvest = async (req, res) => {
    try {
        const { id: plantId } = req.params;
        const {
            actualYield,
            yieldUnit,
            qualityGrade,
            farmerNotes,
            harvestDate,
            collectionDeadline
        } = req.body;
        const farmerId = req.user.id;

        // 1. Validate plant and ownership
        const plant = await prisma.plant.findUnique({
            where: { id: plantId },
            include: {
                farm: {
                    select: { farmerId: true, farmName: true }
                },
                investments: {
                    where: { status: 'active' },
                    include: { investor: true }
                }
            }
        });

        if (!plant) {
            return errorResponse(res, 'Plant not found', 404);
        }

        if (plant.farm.farmerId !== farmerId) {
            return errorResponse(res, 'Unauthorized: You do not own the farm this plant belongs to', 403);
        }

        // 2. Handle photos
        let photoUrls = [];
        if (req.files && req.files.length > 0) {
            photoUrls = await uploadMultipleImages(req.files, 'harvests');
        }

        // 3. Create harvest record
        const harvest = await prisma.harvest.create({
            data: {
                plantId,
                investmentId: plant.investments[0]?.id || null,
                actualYield: parseFloat(actualYield),
                yieldUnit,
                qualityGrade,
                farmerNotes,
                harvestDate: new Date(harvestDate),
                photoUrls,
                collectionStatus: 'ready',
                collectionDeadline: collectionDeadline ? new Date(collectionDeadline) : null,
            },
            include: {
                plant: {
                    include: { farm: true }
                }
            }
        });

        // 4. Update plant status
        await prisma.plant.update({
            where: { id: plantId },
            data: { status: 'harvested' }
        });

        // 5. Notify investor if sponsored
        if (plant.investments.length > 0) {
            const investment = plant.investments[0];
            const investor = investment.investor;

            try {
                // We'll implement this in emailService later
                // await emailService.sendHarvestReadyNotification(investor.email, investor.fullName, {
                //     plantName: plant.customName || plant.id,
                //     farmName: plant.farm.farmName,
                //     yield: `${actualYield} ${yieldUnit}`,
                //     quality: qualityGrade,
                //     deadline: collectionDeadline
                // });

                // Create app notification
                await prisma.notification.create({
                    data: {
                        userId: investor.id,
                        title: 'Harvest Ready!',
                        message: `The harvest for your plant ${plant.customName || ''} at ${plant.farm.farmName} is ready. Please select a collection method.`,
                        type: 'harvest_ready',
                        relatedId: harvest.id
                    }
                });
            } catch (notifyError) {
                logger.error('Failed to notify investor about harvest:', notifyError);
            }
        }

        return successResponse(res, 'Harvest recorded successfully', harvest, 201);
    } catch (error) {
        logger.error('Error recording harvest:', error);
        return errorResponse(res, 'Failed to record harvest');
    }
};

/**
 * Get plant harvests
 */
exports.getPlantHarvests = async (req, res) => {
    try {
        const { id: plantId } = req.params;
        const harvests = await prisma.harvest.findMany({
            where: { plantId },
            orderBy: { createdAt: 'desc' }
        });
        return successResponse(res, 'Harvests fetched', harvests);
    } catch (error) {
        return errorResponse(res, 'Failed to fetch harvests');
    }
};

/**
 * Get investor harvests
 */
exports.getInvestorHarvests = async (req, res) => {
    try {
        const investorId = req.user.id;
        const harvests = await prisma.harvest.findMany({
            where: {
                investment: {
                    investorId: investorId
                }
            },
            include: {
                plant: {
                    include: {
                        farm: true,
                        cropType: true
                    }
                },
                deliveryRequests: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return successResponse(res, 'Investor harvests fetched', harvests);
    } catch (error) {
        return errorResponse(res, 'Failed to fetch investor harvests');
    }
};

/**
 * Update collection method
 */
exports.updateCollectionMethod = async (req, res) => {
    try {
        const { id: harvestId } = req.params;
        const { collectionMethod } = req.body;
        const investorId = req.user.id;

        const harvest = await prisma.harvest.findUnique({
            where: { id: harvestId },
            include: {
                investment: true,
                plant: { include: { farm: true } }
            }
        });

        if (!harvest || harvest.investment.investorId !== investorId) {
            return errorResponse(res, 'Harvest record not found or unauthorized', 404);
        }

        if (harvest.collectionStatus !== 'ready') {
            return errorResponse(res, `Cannot change collection method. Status is already ${harvest.collectionStatus}`, 400);
        }

        const updatedHarvest = await prisma.harvest.update({
            where: { id: harvestId },
            data: { collectionMethod }
        });

        // If 'donate' or 'farmer_keeps', we can finalize status immediately
        if (collectionMethod === 'donate' || collectionMethod === 'farmer_keeps') {
            await prisma.harvest.update({
                where: { id: harvestId },
                data: {
                    collectionStatus: collectionMethod === 'donate' ? 'donated' : 'collected'
                }
            });
        }

        return successResponse(res, 'Collection method updated', updatedHarvest);
    } catch (error) {
        return errorResponse(res, 'Failed to update collection method');
    }
};

/**
 * Create delivery request
 */
exports.createDeliveryRequest = async (req, res) => {
    try {
        const { id: harvestId } = req.params;
        const {
            deliveryAddress,
            deliveryPhone,
            deliveryInstructions,
            deliveryCity,
            deliveryState,
            deliveryPostalCode
        } = req.body;
        const investorId = req.user.id;

        const harvest = await prisma.harvest.findUnique({
            where: { id: harvestId },
            include: { investment: true }
        });

        if (!harvest || harvest.investment.investorId !== investorId) {
            return errorResponse(res, 'Harvest not found or unauthorized', 404);
        }

        if (harvest.collectionMethod !== 'home_delivery') {
            return errorResponse(res, 'Must select home delivery as collection method first', 400);
        }

        // Check if delivery request already exists
        const existing = await prisma.deliveryRequest.findFirst({
            where: { harvestId }
        });

        if (existing) {
            return errorResponse(res, 'Delivery request already exists for this harvest', 400);
        }

        // Calculate cost (Mocked for now)
        const deliveryCost = 25.00;

        const deliveryRequest = await prisma.deliveryRequest.create({
            data: {
                harvestId,
                investorId,
                deliveryAddress,
                deliveryPhone,
                deliveryInstructions,
                deliveryCity,
                deliveryState,
                deliveryPostalCode,
                deliveryCost,
                deliveryStatus: 'pending'
            }
        });

        return successResponse(res, 'Delivery request created', deliveryRequest, 201);
    } catch (error) {
        logger.error('Error creating delivery request:', error);
        return errorResponse(res, 'Failed to create delivery request');
    }
};

/**
 * Update delivery status (Farmer/Admin)
 */
exports.updateDeliveryStatus = async (req, res) => {
    try {
        const { id: requestId } = req.params;
        const { status, trackingNumber, courierService, actualDeliveryDate } = req.body;

        const deliveryRequest = await prisma.deliveryRequest.findUnique({
            where: { id: requestId },
            include: { harvest: true }
        });

        if (!deliveryRequest) {
            return errorResponse(res, 'Delivery request not found', 404);
        }

        const updatedRequest = await prisma.deliveryRequest.update({
            where: { id: requestId },
            data: {
                deliveryStatus: status,
                trackingNumber,
                courierService,
                actualDeliveryDate: actualDeliveryDate ? new Date(actualDeliveryDate) : undefined
            }
        });

        // Sync harvest collection status
        if (status === 'delivered') {
            await prisma.harvest.update({
                where: { id: deliveryRequest.harvestId },
                data: { collectionStatus: 'delivered' }
            });
        }

        return successResponse(res, 'Delivery status updated', updatedRequest);
    } catch (error) {
        return errorResponse(res, 'Failed to update delivery status');
    }
};

/**
 * Submit harvest review
 */
exports.submitReview = async (req, res) => {
    try {
        const { id: harvestId } = req.params;
        const {
            rating,
            reviewText,
            yieldSatisfaction,
            qualitySatisfaction,
            experienceSatisfaction,
            wouldInvestAgain
        } = req.body;
        const investorId = req.user.id;

        const harvest = await prisma.harvest.findUnique({
            where: { id: harvestId },
            include: {
                investment: true,
                plant: { include: { farm: true } }
            }
        });

        if (!harvest || harvest.investment.investorId !== investorId) {
            return errorResponse(res, 'Harvest not found or unauthorized', 404);
        }

        // Check if review already exists
        const existing = await prisma.harvestReview.findFirst({
            where: { harvestId }
        });

        if (existing) {
            return errorResponse(res, 'Review already submitted for this harvest', 400);
        }

        // Handle photos if any
        let photos = [];
        if (req.files && req.files.length > 0) {
            photos = await uploadMultipleImages(req.files, 'reviews');
        }

        const review = await prisma.harvestReview.create({
            data: {
                harvestId,
                investmentId: harvest.investmentId,
                reviewerId: investorId,
                farmId: harvest.plant.farmId,
                farmerId: harvest.plant.farm.farmerId,
                rating,
                reviewText,
                yieldSatisfaction,
                qualitySatisfaction,
                experienceSatisfaction,
                wouldInvestAgain,
                photos,
                isApproved: false // Requires moderation
            }
        });

        // Sync farmer rating stats
        await syncFarmerRating(harvest.plant.farm.farmerId);

        return successResponse(res, 'Review submitted successfully', review, 201);
    } catch (error) {
        logger.error('Error submitting review:', error);
        return errorResponse(res, 'Failed to submit review');
    }
};
