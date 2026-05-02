const express = require('express');
const { body } = require('express-validator');
const harvestController = require('../controllers/harvest.controller');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');
const { uploadMultiple } = require('../utils/fileUpload');

const router = express.Router();

/**
 * @route   POST /api/v1/harvests/plants/:id/harvest
 * @desc    Record a new harvest (Farmer only)
 * @access  Private (Farmer)
 */
router.post(
    '/plants/:id/harvest',
    authenticate,
    checkRole(['farmer']),
    uploadMultiple('photos', 5, ['image/jpeg', 'image/png', 'image/webp']),
    [
        body('actualYield').isNumeric().withMessage('Yield must be a number'),
        body('yieldUnit').notEmpty().withMessage('Yield unit is required'),
        body('qualityGrade').isIn(['premium', 'standard', 'below_standard']).withMessage('Invalid quality grade'),
        body('harvestDate').isISO8601().withMessage('Invalid harvest date'),
        validate
    ],
    harvestController.recordHarvest
);

/**
 * @route   GET /api/v1/harvests/plants/:id
 * @desc    Get all harvests for a specific plant
 * @access  Public
 */
router.get('/plants/:id', harvestController.getPlantHarvests);

/**
 * @route   GET /api/v1/harvests/investor/ready
 * @desc    Get all harvests for current investor
 * @access  Private (Investor)
 */
router.get(
    '/investor/ready',
    authenticate,
    checkRole(['investor']),
    harvestController.getInvestorHarvests
);

/**
 * @route   PUT /api/v1/harvests/:id/collection-method
 * @desc    Update collection method for a harvest
 * @access  Private (Investor)
 */
router.put(
    '/:id/collection-method',
    authenticate,
    checkRole(['investor']),
    [
        body('collectionMethod')
            .isIn(['self_collect', 'home_delivery', 'donate', 'farmer_keeps'])
            .withMessage('Invalid collection method'),
        validate
    ],
    harvestController.updateCollectionMethod
);

/**
 * @route   POST /api/v1/harvests/:id/delivery-request
 * @desc    Create a delivery request for a harvest
 * @access  Private (Investor)
 */
router.post(
    '/:id/delivery-request',
    authenticate,
    checkRole(['investor']),
    [
        body('deliveryAddress').notEmpty().withMessage('Delivery address is required'),
        body('deliveryPhone').notEmpty().withMessage('Delivery phone is required'),
        validate
    ],
    harvestController.createDeliveryRequest
);

/**
 * @route   PUT /api/v1/harvests/delivery-requests/:id/status
 * @desc    Update delivery status
 * @access  Private (Farmer/Admin)
 */
router.put(
    '/delivery-requests/:id/status',
    authenticate,
    checkRole(['farmer', 'admin']),
    [
        body('status').isIn(['pending', 'picked_up', 'in_transit', 'delivered', 'failed']).withMessage('Invalid status'),
        validate
    ],
    harvestController.updateDeliveryStatus
);

/**
 * @route   POST /api/v1/harvests/:id/reviews
 * @desc    Submit a review for a harvest
 * @access  Private (Investor)
 */
router.post(
    '/:id/reviews',
    authenticate,
    checkRole(['investor']),
    uploadMultiple('photos', 5, ['image/jpeg', 'image/png', 'image/webp']),
    [
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('reviewText').optional().isString(),
        validate
    ],
    harvestController.submitReview
);

module.exports = router;
