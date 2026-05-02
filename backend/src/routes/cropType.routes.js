const express = require('express');
const { body, query } = require('express-validator');
const cropTypeController = require('../controllers/cropType.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');

const router = express.Router();

/**
 * @route   GET /api/v1/crop-types
 * @desc    Get all crop types (Public)
 * @access  Public
 */
router.get(
    '/',
    [
        query('category')
            .optional()
            .isIn(['fruit_tree', 'vegetable', 'berry', 'herb', 'grain'])
            .withMessage('Invalid category'),
        validate,
    ],
    cropTypeController.getCropTypes
);

/**
 * @route   POST /api/v1/crop-types
 * @desc    Create new crop type
 * @access  Private (Admin only)
 */
router.post(
    '/',
    authenticate,
    checkRole(['admin']),
    [
        body('name').trim().notEmpty().withMessage('Crop name is required'),
        body('category')
            .isIn(['fruit_tree', 'vegetable', 'berry', 'herb', 'grain'])
            .withMessage('Invalid category'),
        body('typicalGrowthDurationDays')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Growth duration must be a positive integer'),
        body('typicalYieldPerPlant')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Yield must be a positive number'),
        body('yieldUnit').optional().isString(),
        body('description').optional().isString(),
        body('careInstructions').optional().isString(),
        validate,
    ],
    cropTypeController.createCropType
);

/**
 * @route   PUT /api/v1/crop-types/:id
 * @desc    Update crop type
 * @access  Private (Admin only)
 */
router.put(
    '/:id',
    authenticate,
    checkRole(['admin']),
    [
        body('name').optional().trim().notEmpty().withMessage('Crop name cannot be empty'),
        body('category')
            .optional()
            .isIn(['fruit_tree', 'vegetable', 'berry', 'herb', 'grain'])
            .withMessage('Invalid category'),
        body('typicalGrowthDurationDays')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Growth duration must be a positive integer'),
        body('typicalYieldPerPlant')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Yield must be a positive number'),
        validate,
    ],
    cropTypeController.updateCropType
);

module.exports = router;
