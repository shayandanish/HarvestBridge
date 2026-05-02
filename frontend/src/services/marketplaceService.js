import api from './api';

export const marketplaceService = {
    // Get all verified lands (public)
    getVerifiedLands: async (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        const response = await api.get(`/marketplace/lands/verified?${query}`);
        return response.data;
    },

    // Search farms and plants
    search: async (query) => {
        const response = await api.get(`/marketplace/search?query=${query}`);
        return response.data;
    },

    // Get all approved farms
    getFarms: async (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        const response = await api.get(`/marketplace/farms?${query}`);
        return response.data;
    },

    // Get specific farm details
    getFarmDetails: async (id) => {
        const response = await api.get(`/marketplace/farms/${id}`);
        return response.data;
    },

    // Get available plants
    getAvailablePlants: async (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        const response = await api.get(`/marketplace/plants/available?${query}`);
        return response.data;
    },

    // Get plant details
    getPlantDetails: async (id) => {
        const response = await api.get(`/marketplace/plants/${id}`);
        return response.data;
    }
};
