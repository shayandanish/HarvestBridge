import api from './api';

export const cropTypeService = {
    // Get all crop types
    getAllCropTypes: async () => {
        const response = await api.get('/crop-types');
        return response.data.data || response.data; // Fallback for robustness
    },

    // Get a specific crop type
    getCropTypeById: async (id) => {
        const response = await api.get(`/crop-types/${id}`);
        return response.data;
    }
};
