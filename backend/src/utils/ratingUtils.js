const prisma = require('../config/database');

/**
 * Synchronize farmer average rating and total reviews
 * @param {string} farmerId - The ID of the farmer to sync
 */
const syncFarmerRating = async (farmerId) => {
    try {
        // Get all harvest reviews for this farmer
        const harvestReviews = await prisma.harvestReview.findMany({
            where: { farmerId, isApproved: true },
            select: { rating: true }
        });

        // Get all direct farmer reviews
        const directReviews = await prisma.review.findMany({
            where: { farmerId, isApproved: true },
            select: { rating: true }
        });

        const allRatings = [
            ...harvestReviews.map(r => r.rating),
            ...directReviews.map(r => r.rating)
        ];

        const totalReviews = allRatings.length;
        const averageRating = totalReviews > 0 
            ? allRatings.reduce((sum, r) => sum + r, 0) / totalReviews 
            : 0;

        // Update farmer record
        await prisma.farmer.update({
            where: { id: farmerId },
            data: {
                rating: averageRating,
                totalReviews
            }
        });

        console.log(`Synced rating for farmer ${farmerId}: ${averageRating.toFixed(2)} (${totalReviews} reviews)`);
        return { averageRating, totalReviews };
    } catch (error) {
        console.error('Error syncing farmer rating:', error);
        throw error;
    }
};

module.exports = { syncFarmerRating };
