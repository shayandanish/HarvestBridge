const express = require('express');
const { body, query } = require('express-validator');
const plantController = require('../controllers/plant.controller');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');
const { upload } = require('../utils/fileUpload');

const router = express.Router();

// All routes require authentication and farmer role
router.use(authenticate);
router.use(checkRole(['farmer']));

/**
 * @route   POST /api/v1/farms/:farmId/plants
 * @desc    Create new plant
 * @access  Private (Farmer only)
 */
router.post(
    '/farms/:farmId/plants',
    [
        body('cropTypeId').notEmpty().withMessage('Crop type ID is required'),
        body('uniqueIdentifier').optional().isString(),
        body('plantDate').optional().isISO8601().withMessage('Valid date is required'),
        body('locationInFarm').optional().isString(),
        validate,
    ],
    plantController.createPlant
);

/**
 * @route   GET /api/v1/farms/:farmId/plants
 * @desc    Get all plants for a farm
 * @access  Private (Farmer only)
 */
router.get(
    '/farms/:farmId/plants',
    [
        query('status')
            .optional()
            .isIn(['available', 'sponsored', 'growing', 'harvest_ready', 'harvested', 'inactive'])
            .withMessage('Invalid status'),
        validate,
    ],
    plantController.getPlants
);

/**
 * @route   GET /api/v1/plants/:id
 * @desc    Get plant by ID
 * @access  Private (Farmer only)
 */
router.get('/plants/:id', plantController.getPlantById);

/**
 * @route   PUT /api/v1/plants/:id
 * @desc    Update plant
 * @access  Private (Farmer only)
 */
router.put(
    '/plants/:id',
    [
        body('uniqueIdentifier').optional().isString(),
        body('plantDate').optional().isISO8601().withMessage('Valid date is required'),
        body('locationInFarm').optional().isString(),
        body('status')
            .optional()
            .isIn(['available', 'sponsored', 'growing', 'harvest_ready', 'harvested', 'inactive'])
            .withMessage('Invalid status'),
        validate,
    ],
    plantController.updatePlant
);

/**
 * @route   PATCH /api/v1/plants/:id/growth
 * @desc    Update plant growth status
 * @access  Private (Farmer only)
 */
router.patch('/plants/:id/growth', upload.single('photo'), plantController.updatePlantGrowth);

module.exports = router;
