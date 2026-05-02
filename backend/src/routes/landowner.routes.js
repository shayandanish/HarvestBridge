const express = require('express');
const { body } = require('express-validator');
const landownerController = require('../controllers/landowner.controller');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');

const router = express.Router();

// All routes require authentication and landowner role
router.use(authenticate);
router.use(checkRole(['landowner']));

/**
 * @route   POST /api/v1/landowner/profile
 * @desc    Create or update landowner profile
 * @access  Private (Landowner only)
 */
router.post(
    '/profile',
    [
        body('totalLandArea').optional().isFloat({ min: 0 }).withMessage('Total land area must be a positive number'),
        body('landUnit').optional().isIn(['acre', 'hectare', 'sqft', 'sqm']).withMessage('Invalid land unit'),
        validate,
    ],
    landownerController.createLandownerProfile
);

/**
 * @route   GET /api/v1/landowner/profile
 * @desc    Get landowner profile
 * @access  Private (Landowner only)
 */
router.get('/profile', landownerController.getLandownerProfile);

module.exports = router;
