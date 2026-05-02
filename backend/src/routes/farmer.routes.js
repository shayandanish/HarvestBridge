const express = require('express');
const { body } = require('express-validator');
const farmerController = require('../controllers/farmer.controller');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');

const router = express.Router();

// All routes require authentication and farmer role
router.use(authenticate);
router.use(checkRole(['farmer']));

/**
 * @swagger
 * /farmer/profile:
 *   post:
 *     summary: Create or update farmer profile
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               experienceYears:
 *                 type: integer
 *               specialization:
 *                 type: string
 *               certifications:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.post(
    '/profile',
    [
        body('experienceYears').optional().isInt({ min: 0 }).withMessage('Experience years must be a positive number'),
        body('specialization').optional().isString(),
        body('certifications').optional().isString(),
        body('bankAccountName').optional().isString(),
        body('bankAccountNumber').optional().isString(),
        body('bankName').optional().isString(),
        body('bankBranch').optional().isString(),
        // New validation
        body('age').optional().isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
        body('location').optional().isString(),
        body('services').optional().isArray().withMessage('Services must be an array'),
        body('chargesPerTask').optional().isNumeric().withMessage('Charges per task must be a number'),
        body('bio').optional().isString(),
        body('isProfilePublic').optional().isBoolean().withMessage('isProfilePublic must be a boolean'),
        validate,
    ],
    farmerController.createFarmerProfile
);

/**
 * @swagger
 * /farmer/profile:
 *   get:
 *     summary: Get farmer profile
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Farmer profile retrieved
 */
router.get('/profile', farmerController.getFarmerProfile);
router.delete('/profile', farmerController.deleteFarmerProfile);

/**
 * @swagger
 * /farmer/lands/available:
 *   get:
 *     summary: Get available verified lands
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available lands
 */
router.get('/lands/available', farmerController.getAvailableLands);

/**
 * @swagger
 * /farmer/farms:
 *   post:
 *     summary: Create a new farm
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - landId
 *               - farmName
 *             properties:
 *               landId:
 *                 type: string
 *               farmName:
 *                 type: string
 *               description:
 *                 type: string
 *               totalArea:
 *                 type: number
 *               areaUnit:
 *                 type: string
 *                 enum: [acre, hectare, sqft, sqm]
 *     responses:
 *       201:
 *         description: Farm created
 */
router.post(
    '/farms',
    [
        body('landId').notEmpty().withMessage('Land ID is required'),
        body('farmName').trim().isLength({ min: 3 }).withMessage('Farm name must be at least 3 characters'),
        body('description').optional().isString(),
        body('totalArea').optional().isFloat({ min: 0.01 }).withMessage('Total area must be positive'),
        body('areaUnit').optional().isIn(['acre', 'hectare', 'sqft', 'sqm']).withMessage('Invalid area unit'),
        body('isOrganic').optional().isBoolean(),
        validate,
    ],
    farmerController.createFarm
);

/**
 * @swagger
 * /farmer/farms:
 *   get:
 *     summary: Get all farms for current farmer
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of farms
 */
router.get('/farms', farmerController.getFarms);
router.get('/farms/:id', farmerController.getFarmById);
router.put('/farms/:id', farmerController.updateFarm);
router.delete('/farms/:id', farmerController.deleteFarm);

router.post('/farms/:id/accept-hiring', farmerController.acceptHiring);
router.post('/farms/:id/reject-hiring', farmerController.rejectHiring);

/**
 * @swagger
 * /farmer/farms/{id}/photos:
 *   post:
 *     summary: Upload farm photos
 *     tags: [Farmer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Photos uploaded
 */
const { uploadMultiple } = require('../utils/fileUpload');
router.post(
    '/farms/:id/photos',
    uploadMultiple('photos', 10, ['image/jpeg', 'image/png', 'image/webp']),
    farmerController.uploadFarmPhotos
);

router.get('/earnings', farmerController.getEarnings);
router.post('/farms/:id/request-payment', farmerController.requestPayment);
router.get('/managed-farms', farmerController.getManagedFarms);

module.exports = router;
