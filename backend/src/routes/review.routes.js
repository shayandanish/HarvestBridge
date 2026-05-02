const express = require('express');
const { body } = require('express-validator');
const reviewController = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');

const router = express.Router();

/**
 * @route   POST /api/v1/reviews/farmer
 * @desc    Submit a direct review for a farmer
 * @access  Private (Investor)
 */
router.post(
    '/farmer',
    authenticate,
    checkRole(['investor']),
    [
        body('farmerId').notEmpty().withMessage('Farmer ID is required'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('comment').optional().isString(),
        validate
    ],
    reviewController.submitFarmerReview
);

/**
 * @route   GET /api/v1/reviews/farmer/:id
 * @desc    Get all reviews for a farmer
 * @access  Public
 */
router.get('/farmer/:id', reviewController.getFarmerReviews);

module.exports = router;
