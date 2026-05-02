import api from './api';

export const farmerService = {
    // Get all verified lands available for farming
    getAvailableLands: async (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        const response = await api.get(`/farmer/lands/available?${query}`);
        return response.data;
    },

    // Create a new farm
    createFarm: async (farmData) => {
        const response = await api.post('/farmer/farms', farmData);
        return response.data;
    },

    // Get farmer's farms
    getMyFarms: async () => {
        const response = await api.get('/farmer/farms');
        return response.data;
    },

    // Get specific farm
    getFarmById: async (id) => {
        const response = await api.get(`/farmer/farms/${id}`);
        return response.data;
    },

    // Update farm
    updateFarm: async (id, data) => {
        const response = await api.put(`/farmer/farms/${id}`, data);
        return response.data;
    },

    // Delete farm
    deleteFarm: async (id) => {
        const response = await api.delete(`/farmer/farms/${id}`);
        return response.data;
    },

    // Upload farm photos
    uploadPhotos: async (farmId, photos) => {
        const formData = new FormData();
        Array.from(photos).forEach(photo => {
            formData.append('photos', photo);
        });
        // Captions logic can be added here if needed, usually as a separate JSON field or iterating

        const response = await api.post(`/farmer/farms/${farmId}/photos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Delete photo
    deletePhoto: async (farmId, photoId) => {
        const response = await api.delete(`/farmer/farms/${farmId}/photos/${photoId}`);
        return response.data;
    },

    // Get the authenticated farmer's own profile
    getMyProfile: async () => {
        const response = await api.get('/farmer/profile');
        return response.data;
    },

    // Create or update the farmer's profile
    updateProfile: async (data) => {
        const response = await api.post('/farmer/profile', data);
        return response.data;
    },

    // Delete the farmer's profile
    deleteProfile: async () => {
        const response = await api.delete('/farmer/profile');
        return response.data;
    },

    // Public: list all farmers (for investors)
    getPublicFarmers: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/public/farmers?${params}`);
        return response.data;
    },

    // Public: get a single farmer's public profile
    getPublicFarmerById: async (id) => {
        const response = await api.get(`/public/farmers/${id}`);
        return response.data;
    },

    // Accept hiring request
    acceptHiring: async (farmId) => {
        const response = await api.post(`/farmer/farms/${farmId}/accept-hiring`);
        return response.data;
    },

    // Reject hiring request
    rejectHiring: async (farmId) => {
        const response = await api.post(`/farmer/farms/${farmId}/reject-hiring`);
        return response.data;
    },

    // Get farmer earnings
    getEarnings: async () => {
        const response = await api.get('/farmer/earnings');
        return response.data;
    },

    // Request payment from investor
    requestPayment: async (farmId) => {
        const response = await api.post(`/farmer/farms/${farmId}/request-payment`);
        return response.data;
    },
};
