import axios from 'axios';

// Create an Axios instance with base URL
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1',
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        if (token) {
            // Standard way for Axios 1.x to set headers
            if (config.headers.set) {
                config.headers.set('Authorization', `Bearer ${token}`);
            } else {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('accessToken');
            localStorage.removeItem('token');
            // Redirect to login page or handle accordingly
            // window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
    updateProfile: async (userData) => {
        const response = await api.put('/auth/profile', userData);
        return response.data;
    },
    uploadPhoto: async (formData) => {
        const response = await api.post('/profile/photo', formData);
        return response.data;
    },
    changePassword: async (data) => {
        const response = await api.put('/auth/change-password', data);
        return response.data;
    },
    forgotPassword: async (email) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },
    resetPassword: async (data) => {
        const response = await api.post('/auth/reset-password', data);
        return response.data;
    },
    logout: async () => {
        await api.post('/auth/logout');
    },
    verifyEmail: async (data) => {
        const response = await api.post('/auth/verify-email', data);
        return response.data;
    },
    // Platform Settings (Admin)
    getPlatformSettings: async () => {
        const response = await api.get('/admin/settings');
        return response.data;
    },
    updatePlatformSetting: async (key, value) => {
        const response = await api.put(`/admin/settings/${key}`, { settingValue: value });
        return response.data;
    }
};

export const marketplaceService = {
    // Search
    search: async (query) => {
        const response = await api.get(`/marketplace/search?query=${encodeURIComponent(query)}`);
        return response.data;
    },

    // Get Farms
    getFarms: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/marketplace/farms?${params}`);
        return response.data;
    },

    // Get Verified Lands
    getVerifiedLands: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/marketplace/lands/verified?${params}`);
        return response.data;
    },

    // Lease Land
    leaseLand: async (data) => {
        const response = await api.post('/marketplace/lands/lease', data);
        return response.data;
    },
    // Get Farm Details
    getFarmDetails: async (id) => {
        const response = await api.get(`/marketplace/farms/${id}`);
        return response.data;
    },

    // Get Available Plants
    getAvailablePlants: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/marketplace/plants/available?${params}`);
        return response.data;
    },

    // Get Plant Details
    getPlantDetails: async (id) => {
        const response = await api.get(`/marketplace/plants/${id}`);
        return response.data;
    },

    // Get Recommendations
    getRecommendations: async () => {
        const response = await api.get('/marketplace/recommendations');
        return response.data;
    },

    // Compare Plants
    comparePlants: async (plantIds) => {
        const response = await api.post('/marketplace/compare', { plantIds });
        return response.data;
    }
};

export const favoritesService = {
    addFavorite: async (data) => {
        const response = await api.post('/favorites', data);
        return response.data;
    },

    removeFavorite: async (id) => {
        const response = await api.delete(`/favorites/${id}`);
        return response.data;
    },

    getFavorites: async () => {
        const response = await api.get('/favorites');
        return response.data;
    }
};

export const investmentService = {
    create: async (data) => {
        const response = await api.post('/investments', data);
        return response.data;
    },
    getAll: async () => {
        const response = await api.get('/investments');
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/investments/${id}`);
        return response.data;
    },
    cancel: async (id) => {
        const response = await api.put(`/investments/${id}/cancel`);
        return response.data;
    }
};

export const paymentService = {
    initiate: async (data) => {
        const response = await api.post('/payments/initiate', data);
        return response.data;
    },
    confirm: async (data) => {
        const response = await api.post('/payments/confirm', data);
        return response.data;
    },
    getHistory: async () => {
        const response = await api.get('/payments/history');
        return response.data;
    },

    // Lease payments
    initiateLeasePayment: async (farmId, paymentMethod) => {
        const response = await api.post('/payments/lease/initiate', { farmId, paymentMethod });
        return response.data;
    },

    confirmLeasePayment: async (data) => {
        const response = await api.post('/payments/lease/confirm', data);
        return response.data;
    },

    confirmWithProof: async (data) => {
        const response = await api.post('/payments/confirm-proof', data);
        return response.data;
    },

    uploadProof: async (paymentId, formData) => {
        const response = await api.post(`/payments/${paymentId}/upload-proof`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    }
};

export const trackingService = {
    logActivity: async (plantId, data) => {
        const response = await api.post(`/tracking/${plantId}/activities`, data);
        return response.data;
    },
    logFarmActivity: async (farmId, data) => {
        const response = await api.post(`/tracking/farm/${farmId}/activities`, data);
        return response.data;
    },
    uploadPhoto: async (plantId, data) => {
        const response = await api.post(`/tracking/${plantId}/photos`, data);
        return response.data;
    },
    uploadFarmPhoto: async (farmId, data) => {
        const response = await api.post(`/tracking/farm/${farmId}/photos`, data);
        return response.data;
    },
    logMilestone: async (plantId, data) => {
        const response = await api.post(`/tracking/${plantId}/milestones`, data);
        return response.data;
    },
    logFarmMilestone: async (farmId, data) => {
        const response = await api.post(`/tracking/farm/${farmId}/milestones`, data);
        return response.data;
    },
    getTimeline: async (plantId) => {
        const response = await api.get(`/tracking/${plantId}/timeline`);
        return response.data;
    },
    getFarmTimeline: async (farmId) => {
        const response = await api.get(`/tracking/farm/${farmId}/timeline`);
        return response.data;
    }
};

export const farmerService = {
    getManagedFarms: async () => {
        const response = await api.get('/farmer/managed-farms');
        return response.data;
    },
    uploadFarmPhotos: async (farmId, formData) => {
        const response = await api.post(`/farmer/farms/${farmId}/photos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    }
};

export const plantService = {
    updateGrowth: async (plantId, data) => {
        const response = await api.patch(`/plants/${plantId}/growth`, data);
        return response.data;
    }
};

export const investorDashboardService = {
    getStats: async () => {
        const response = await api.get('/investor/dashboard/stats');
        return response.data;
    }
};

/**
 * Get full URL for media files
 * @param {string} path - Relative path from backend (e.g. /uploads/...)
 * @returns {string} Full URL
 */
export const getMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return encodeURI(path);

    // Base backend URL (strip /api/v1)
    const backendUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${backendUrl}${encodeURI(normalizedPath)}`;
};

export const treeService = {
    getAllTrees: async () => {
        const response = await api.get('/trees');
        return response.data;
    },
    createTree: async (data) => {
        const response = await api.post('/trees', data);
        return response.data;
    },
    updateTree: async (id, data) => {
        const response = await api.put(`/trees/${id}`, data);
        return response.data;
    },
    deleteTree: async (id) => {
        const response = await api.delete(`/trees/${id}`);
        return response.data;
    }
};

export const plantationService = {
    createRequest: async (data) => {
        const response = await api.post('/plantations', data);
        return response.data;
    },
    createDirectRequest: async (data) => {
        const response = await api.post('/plantations/direct', data);
        return response.data;
    },
    getMyRequests: async () => {
        const response = await api.get('/plantations/my-requests');
        return response.data;
    },
    getAllRequests: async () => {
        const response = await api.get('/plantations');
        return response.data;
    },
    updateRequestStatus: async (id, status) => {
        const response = await api.put(`/plantations/${id}/status`, { status });
        return response.data;
    },
    deleteRequest: async (id) => {
        const response = await api.delete(`/plantations/${id}`);
        return response.data;
    }
};

export default api;
