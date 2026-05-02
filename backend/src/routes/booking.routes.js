const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

// All booking routes require authentication
router.use(authenticate);

// Create a booking
// POST /api/v1/bookings
router.post(
    '/',
    checkRole(['investor']),
    bookingController.createBooking
);

// Get user's bookings (Investor or Farmer)
// GET /api/v1/bookings
router.get(
    '/',
    checkRole(['investor', 'farmer']),
    bookingController.getBookings
);

// Get booking details
// GET /api/v1/bookings/:id
router.get(
    '/:id',
    bookingController.getBookingById
);

// Cancel booking
// PUT /api/v1/bookings/:id/cancel
router.put(
    '/:id/cancel',
    checkRole(['investor']),
    bookingController.cancelBooking
);

// Reschedule booking
router.put(
    '/:id/reschedule',
    checkRole(['investor']),
    bookingController.rescheduleBooking
);

// Confirm booking (Farmer)
// PUT /api/v1/bookings/:id/confirm
router.put(
    '/:id/confirm',
    checkRole(['farmer']),
    bookingController.confirmBooking
);

// Check-in booking (Farmer)
// POST /api/v1/bookings/:id/check-in
router.post(
    '/:id/check-in',
    checkRole(['farmer']),
    bookingController.checkInBooking
);

module.exports = router;
