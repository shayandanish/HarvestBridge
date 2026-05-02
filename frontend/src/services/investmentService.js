import api from './api';

export const investmentService = {
    // Get all investments for the logged-in user (plants and farms)
    getInvestments: async () => {
        const response = await api.get('/investments');
        return response.data;
    },

    // Create a new plant investment
    createInvestment: async (investmentData) => {
        const response = await api.post('/investments', investmentData);
        return response.data;
    },

    // Get investment details
    getInvestmentDetails: async (id) => {
        const response = await api.get(`/investments/${id}`);
        return response.data;
    },

    // Cancel a pending investment
    cancelInvestment: async (id) => {
        const response = await api.put(`/investments/${id}/cancel`);
        return response.data;
    },

    // Hire a farmer for a farm
    hireFarmer: async (farmId, farmerId) => {
        const response = await api.post('/investments/hire', { farmId, farmerId });
        return response.data;
    },

    // Pay farmer charges to finalize hiring
    payFarmerCharges: async (paymentData) => {
        const response = await api.post('/investments/pay-farmer-charges', paymentData);
        return response.data;
    },

    initiateHiringPayment: async (data) => {
        const response = await api.post('/investments/initiate-hiring', data);
        return response.data;
    }
};

export default investmentService;
