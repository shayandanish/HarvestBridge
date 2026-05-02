const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availability.controller');
const activityController = require('../controllers/activity.controller');
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

/**
 * @swagger
 * /farms/{id}/available-slots:
 *   get:
 *     summary: Get check-in slots
 *     tags: [Farms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Available slots
 */
router.get('/:id/available-slots', bookingController.getAvailableSlots);

/**
 * @swagger
 * /farms/{id}/activities:
 *   get:
 *     summary: Get activities
 *     tags: [Farms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of activities
 */
router.get('/:id/activities', activityController.getActivities);

router.use(authenticate);

/**
 * @swagger
 * /farms/{id}/availability:
 *   post:
 *     summary: Create slot
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
    '/:id/availability',
    checkRole(['farmer']),
    availabilityController.createAvailability
);

/**
 * @swagger
 * /farms/{id}/blackout-dates:
 *   post:
 *     summary: Create blackout date
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
    '/:id/blackout-dates',
    checkRole(['farmer']),
    availabilityController.createBlackoutDate
);

module.exports = router;
