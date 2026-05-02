import api from './api';

export const reviewService = {
    /**
     * Submit a direct review for a farmer
     * @param {Object} reviewData - { farmerId, investmentId, farmId, rating, comment }
     */
    submitFarmerReview: async (reviewData) => {
        const response = await api.post('/reviews/farmer', reviewData);
        return response.data;
    },

    /**
     * Get all reviews for a farmer
     * @param {string} farmerId 
     */
    getFarmerReviews: async (farmerId) => {
        const response = await api.get(`/reviews/farmer/${farmerId}`);
        return response.data;
    }
};

export default reviewService;
