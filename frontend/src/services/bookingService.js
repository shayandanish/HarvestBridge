import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

const bookingService = {
    // Get available time slots
    getAvailableSlots: async (farmId, startDate, endDate) => {
        const response = await axios.get(`${API_URL}/farms/${farmId}/available-slots`, {
            params: { startDate, endDate }
        });
        return response.data.data;
    },

    // Get farm activities
    getFarmActivities: async (farmId) => {
        const response = await axios.get(`${API_URL}/farms/${farmId}/activities`);
        return response.data.data;
    },

    // Create a new booking
    createBooking: async (bookingData) => {
        const response = await axios.post(`${API_URL}/bookings`, bookingData, {
            headers: getAuthHeader()
        });
        return response.data.data;
    },

    // Get user's bookings
    getMyBookings: async (status = '') => {
        const response = await axios.get(`${API_URL}/bookings`, {
            params: { status },
            headers: getAuthHeader()
        });
        return response.data.data;
    },

    // Get booking details
    getBookingById: async (id) => {
        const response = await axios.get(`${API_URL}/bookings/${id}`, {
            headers: getAuthHeader()
        });
        return response.data.data;
    },

    // Cancel booking
    cancelBooking: async (id, reason) => {
        const response = await axios.put(`${API_URL}/bookings/${id}/cancel`, { reason }, {
            headers: getAuthHeader()
        });
        return response.data.data;
    },

    // Confirm booking
    confirmBooking: async (id) => {
        const response = await axios.put(`${API_URL}/bookings/${id}/confirm`, {}, {
            headers: getAuthHeader()
        });
        return response.data.data;
    },

    // Check in booking
    checkIn: async (id, confirmationCode) => {
        // The backend expects id in params or confirmationCode in body
        // POST /api/v1/bookings/:id/check-in
        const url = id ? `${API_URL}/bookings/${id}/check-in` : `${API_URL}/bookings/undefined/check-in`;
        const response = await axios.post(url, { confirmationCode }, {
            headers: getAuthHeader()
        });
        return response.data.data;
    },

    // Reschedule booking
    rescheduleBooking: async (id, newVisitDate, newVisitTime) => {
        const response = await axios.put(`${API_URL}/bookings/${id}/reschedule`, {
            newVisitDate,
            newVisitTime
        }, {
            headers: getAuthHeader()
        });
        return response.data.data;
    }
};

export default bookingService;
