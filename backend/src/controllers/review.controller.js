const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { syncFarmerRating } = require('../utils/ratingUtils');

/**
 * Submit a direct review for a farmer
 * @route POST /api/v1/reviews/farmer
 */
const submitFarmerReview = async (req, res, next) => {
    try {
        const { farmerId, investmentId, farmId, rating, comment } = req.body;
        const userId = req.user.id;

        if (!farmerId || !rating) {
            return errorResponse(res, 400, 'Farmer ID and rating are required');
        }

        // Verify farmer exists
        const farmer = await prisma.farmer.findUnique({
            where: { id: farmerId }
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer not found');
        }

        // Check if review already exists for this investment/hiring session
        if (investmentId) {
            const existing = await prisma.review.findFirst({
                where: { userId, investmentId, farmerId }
            });
            if (existing) {
                return errorResponse(res, 400, 'Review already submitted for this session');
            }
        }

        // Create review
        const review = await prisma.review.create({
            data: {
                userId,
                farmerId,
                farmId,
                investmentId,
                rating: parseInt(rating),
                comment,
                isApproved: true // Direct reviews are approved by default for now
            }
        });

        // Sync farmer rating stats
        await syncFarmerRating(farmerId);

        return successResponse(res, 201, 'Review submitted successfully', review);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all reviews for a farmer
 * @route GET /api/v1/reviews/farmer/:id
 */
const getFarmerReviews = async (req, res, next) => {
    try {
        const { id } = req.params;

        const reviews = await prisma.review.findMany({
            where: { farmerId: id, isApproved: true },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePhotoUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Also fetch harvest reviews for a complete picture
        const harvestReviews = await prisma.harvestReview.findMany({
            where: { farmerId: id, isApproved: true },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePhotoUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Merge and format
        const combined = [
            ...reviews.map(r => ({
                id: r.id,
                type: 'direct',
                user: r.user,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt
            })),
            ...harvestReviews.map(r => ({
                id: r.id,
                type: 'harvest',
                user: r.reviewer,
                rating: r.rating,
                comment: r.reviewText,
                createdAt: r.createdAt
            }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return successResponse(res, 200, 'Farmer reviews retrieved successfully', combined);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    submitFarmerReview,
    getFarmerReviews
};
