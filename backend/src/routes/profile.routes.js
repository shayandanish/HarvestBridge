const express = require('express');
const { body } = require('express-validator');
const profileController = require('../controllers/profile.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { uploadSingle } = require('../utils/fileUpload');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/profile
 * @desc    Get user profile with role-based data
 * @access  Private
 */
router.get('/', profileController.getProfile);

/**
 * @route   PUT /api/v1/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
    '/',
    [
        body('addressLine1').optional().isString(),
        body('addressLine2').optional().isString(),
        body('city').optional().isString(),
        body('state').optional().isString(),
        body('country').optional().isString(),
        body('postalCode').optional().isString(),
        body('dateOfBirth').optional().isISO8601().withMessage('Valid date is required'),
        body('bio').optional().isString(),
        validate,
    ],
    profileController.updateProfile
);

/**
 * @route   POST /api/v1/profile/photo
 * @desc    Upload profile photo
 * @access  Private
 */
router.post(
    '/photo',
    uploadSingle('photo', ['image/jpeg', 'image/png', 'image/webp']),
    profileController.uploadProfilePhoto
);

/**
 * @route   POST /api/v1/profile/kyc
 * @desc    Upload KYC document
 * @access  Private
 */
router.post(
    '/kyc',
    uploadSingle('document', ['image/jpeg', 'image/png', 'application/pdf']),
    profileController.uploadKYCDocument
);

module.exports = router;
