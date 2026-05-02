import api from './api';

export const adminService = {
    // Get pending lands
    getPendingLands: async () => {
        const response = await api.get('/admin/lands/pending');
        return response.data;
    },

    // Approve land
    approveLand: async (id) => {
        const response = await api.put(`/admin/lands/${id}/approve`);
        return response.data;
    },

    // Reject land
    rejectLand: async (id, reason) => {
        const response = await api.put(`/admin/lands/${id}/reject`, { rejectionReason: reason });
        return response.data;
    },

    // Get pending farms
    getPendingFarms: async () => {
        const response = await api.get('/admin/farms/pending');
        return response.data;
    },

    // Approve farm
    approveFarm: async (id) => {
        const response = await api.put(`/admin/farms/${id}/approve`);
        return response.data;
    },

    // Reject farm
    rejectFarm: async (id, reason) => {
        const response = await api.put(`/admin/farms/${id}/reject`, { rejectionReason: reason });
        return response.data;
    },

    // Get pending farmer profiles
    getPendingFarmerProfiles: async () => {
        const response = await api.get('/admin/farmers/profiles/pending');
        return response.data;
    },

    // Approve farmer profile
    approveFarmerProfile: async (id) => {
        const response = await api.put(`/admin/farmers/profiles/${id}/approve`);
        return response.data;
    },

    // Reject farmer profile
    rejectFarmerProfile: async (id, reason) => {
        const response = await api.put(`/admin/farmers/profiles/${id}/reject`, { rejectionReason: reason });
        return response.data;
    },

    // User Management
    getAllUsers: async (params) => {
        const response = await api.get('/admin/users', { params });
        return response.data;
    },

    getUserById: async (id) => {
        const response = await api.get(`/admin/users/${id}`);
        return response.data;
    },

    updateUser: async (id, userData) => {
        const response = await api.put(`/admin/users/${id}`, userData);
        return response.data;
    },

    deleteUser: async (id) => {
        const response = await api.delete(`/admin/users/${id}`);
        return response.data;
    },

    suspendUser: async (id, suspensionReason) => {
        const response = await api.put(`/admin/users/${id}/suspend`, { suspensionReason });
        return response.data;
    },

    activateUser: async (id) => {
        const response = await api.put(`/admin/users/${id}/activate`);
        return response.data;
    },

    // Investment Monitoring
    getAllInvestments: async (params) => {
        const response = await api.get('/admin/investments', { params });
        return response.data;
    },

    getInvestmentById: async (id) => {
        const response = await api.get(`/admin/investments/${id}`);
        return response.data;
    },

    updateInvestment: async (id, data) => {
        const response = await api.put(`/admin/investments/${id}`, data);
        return response.data;
    },

    cancelInvestment: async (id, reason) => {
        const response = await api.put(`/admin/investments/${id}/cancel`, { cancellationReason: reason });
        return response.data;
    },

    deleteInvestment: async (id) => {
        const response = await api.delete(`/admin/investments/${id}`);
        return response.data;
    },

    // Post Management
    getAllLands: async (params) => {
        const response = await api.get('/admin/lands', { params });
        return response.data;
    },

    getAllFarms: async (params) => {
        const response = await api.get('/admin/farms', { params });
        return response.data;
    },

    // Delete actions
    deleteLand: async (id) => {
        const response = await api.delete(`/admin/lands/${id}`);
        return response.data;
    },

    deleteFarm: async (id) => {
        const response = await api.delete(`/admin/farms/${id}`);
        return response.data;
    },

    deleteFarmerProfile: async (id) => {
        const response = await api.delete(`/admin/farmers/profiles/${id}`);
        return response.data;
    },

    // Notifications
    getNotifications: async () => {
        const response = await api.get('/admin/notifications');
        return response.data;
    },

    markNotificationAsRead: async (id) => {
        const response = await api.put(`/admin/notifications/${id}/read`);
        return response.data;
    }
};
