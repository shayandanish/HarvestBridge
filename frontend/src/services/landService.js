import api from './api';

export const landService = {
    // Get all lands for the current landowner
    getMyLands: async () => {
        const response = await api.get('/lands');
        return response.data;
    },

    // Get a specific land by ID
    getLandById: async (id) => {
        const response = await api.get(`/lands/${id}`);
        return response.data;
    },

    // Register a new land (basic)
    createLand: async (landData) => {
        const formData = new FormData();
        Object.keys(landData).forEach(key => {
            if (key === 'ownershipDocument') {
                formData.append('ownershipDocument', landData[key]);
            } else {
                formData.append(key, landData[key]);
            }
        });
        const response = await api.post('/lands', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // Register a new land with pre-built FormData (supports multiple photos)
    createLandFormData: async (formData) => {
        const response = await api.post('/lands', formData);
        return response.data;
    },

    // Update an existing land
    updateLand: async (id, landData) => {
        const formData = new FormData();
        Object.keys(landData).forEach(key => {
            if (key === 'ownershipDocument' && landData[key] instanceof File) {
                formData.append('ownershipDocument', landData[key]);
            } else {
                formData.append(key, landData[key]);
            }
        });

        const response = await api.put(`/lands/${id}`, formData);
        return response.data;
    },

    // Delete a land
    deleteLand: async (id) => {
        const response = await api.delete(`/lands/${id}`);
        return response.data;
    }
};
