const express = require('express');
const multer = require('multer');
const { body, query } = require('express-validator');
const landController = require('../controllers/land.controller');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Multer memory storage for mixed file uploads (ownership doc + land photos)
const storage = multer.memoryStorage();
const uploadFields = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'), false);
    },
}).fields([
    { name: 'ownershipDocument', maxCount: 1 },
    { name: 'landPhotos', maxCount: 8 },
]);

// All routes require authentication
router.use(authenticate);
// Allow landowners, farmers, and admins to manage land
router.use(checkRole(['landowner', 'farmer', 'admin']));

/**
 * @route   POST /api/v1/lands
 * @desc    Register new land
 * @access  Private (Landowner only)
 */
router.post(
    '/',
    uploadFields,
    [
        body('landName')
            .trim()
            .isLength({ min: 3 })
            .withMessage('Land name must be at least 3 characters'),
        body('totalArea')
            .isFloat({ min: 0.01 })
            .withMessage('Total area must be a positive number'),
        body('areaUnit')
            .isIn(['ACRES', 'HECTARES', 'SQFT', 'KANAL', 'MARLA'])
            .withMessage('Invalid area unit'),
        body('latitude')
            .optional()
            .isFloat({ min: -90, max: 90 })
            .withMessage('Invalid latitude'),
        body('longitude')
            .optional()
            .isFloat({ min: -180, max: 180 })
            .withMessage('Invalid longitude'),
        body('city').optional().isString(),
        body('state').optional().isString(),
        body('country').optional().isString(),
        body('specificLocation').optional().isString(),
        body('soilQuality').optional().isInt({ min: 1, max: 5 }).withMessage('Soil quality must be 1–5'),
        body('waterAvailability').optional().isInt({ min: 1, max: 5 }).withMessage('Water availability must be 1–5'),
        body('sunlightExposure').optional().isInt({ min: 1, max: 5 }).withMessage('Sunlight exposure must be 1–5'),
        body('rentalFeeMonthly').optional().isFloat({ min: 0 }).withMessage('Rental fee must be 0 or more'),
        body('minimumRentalPeriod').optional().isInt({ min: 1, max: 60 }).withMessage('Minimum rental period must be 1–60 months'),
        body('additionalNotes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
        validate,
    ],
    landController.createLand
);

/**
 * @route   GET /api/v1/lands
 * @desc    Get all lands for current landowner
 * @access  Private (Landowner only)
 */
router.get('/', landController.getLands);

/**
 * @route   GET /api/v1/lands/:id
 * @desc    Get land by ID
 * @access  Private (Landowner only)
 */
router.get('/:id', landController.getLandById);

/**
 * @route   PUT /api/v1/lands/:id
 * @desc    Update land
 * @access  Private (Landowner only)
 */
router.put(
    '/:id',
    uploadFields,
    [
        body('landName').optional().trim().isLength({ min: 3 }).withMessage('Land name must be at least 3 characters'),
        body('totalArea').optional().isFloat({ min: 0.01 }).withMessage('Total area must be a positive number'),
        body('areaUnit').optional().isIn(['ACRES', 'HECTARES', 'SQFT', 'KANAL', 'MARLA']).withMessage('Invalid area unit'),
        body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
        validate,
    ],
    landController.updateLand
);

/**
 * @route   DELETE /api/v1/lands/:id
 * @desc    Delete land (soft delete)
 * @access  Private (Landowner only)
 */
router.delete('/:id', landController.deleteLand);

module.exports = router;
