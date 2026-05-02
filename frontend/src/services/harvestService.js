import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

const harvestService = {
    // Record a new harvest (Farmer)
    recordHarvest: async (plantId, harvestData) => {
        const formData = new FormData();
        Object.keys(harvestData).forEach(key => {
            if (key === 'photos') {
                harvestData.photos.forEach(photo => {
                    formData.append('photos', photo);
                });
            } else {
                formData.append(key, harvestData[key]);
            }
        });

        const response = await axios.post(`${API_URL}/harvests/plants/${plantId}/harvest`, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // Get harvests for a plant
    getPlantHarvests: async (plantId) => {
        const response = await axios.get(`${API_URL}/harvests/plants/${plantId}`);
        return response.data;
    },

    // Get investor's ready harvests
    getInvestorHarvests: async () => {
        const response = await axios.get(`${API_URL}/harvests/investor/ready`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Update collection method
    updateCollectionMethod: async (harvestId, collectionMethod) => {
        const response = await axios.put(`${API_URL}/harvests/${harvestId}/collection-method`, { collectionMethod }, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Create delivery request
    createDeliveryRequest: async (harvestId, deliveryData) => {
        const response = await axios.post(`${API_URL}/harvests/${harvestId}/delivery-request`, deliveryData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Update delivery status (Farmer)
    updateDeliveryStatus: async (requestId, statusData) => {
        const response = await axios.put(`${API_URL}/harvests/delivery-requests/${requestId}/status`, statusData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Submit harvest review
    submitReview: async (harvestId, reviewData) => {
        const formData = new FormData();
        Object.keys(reviewData).forEach(key => {
            if (key === 'photos') {
                reviewData.photos.forEach(photo => {
                    formData.append('photos', photo);
                });
            } else {
                formData.append(key, reviewData[key]);
            }
        });

        const response = await axios.post(`${API_URL}/harvests/${harvestId}/reviews`, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

export default harvestService;
