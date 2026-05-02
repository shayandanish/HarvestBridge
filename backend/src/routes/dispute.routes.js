const express = require('express');
const { body } = require('express-validator');
const disputeController = require('../controllers/dispute.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.use(authenticate);

/**
 * @route   POST /api/v1/disputes
 * @desc    Raise a new dispute
 * @access  Private (Investor or Farmer)
 */
router.post(
    '/',
    [
        body('investmentId').isUUID().withMessage('Valid investment ID is required'),
        body('disputeType').isIn(['payment', 'quality', 'harvest', 'other']).withMessage('Invalid dispute type'),
        body('description').notEmpty().withMessage('Description is required'),
        validate,
    ],
    disputeController.raiseDispute
);

module.exports = router;
