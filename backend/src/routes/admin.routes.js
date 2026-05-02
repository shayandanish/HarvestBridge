const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const disputeController = require('../controllers/dispute.controller');
const settingsController = require('../controllers/settings.controller');
const campaignController = require('../controllers/campaign.controller');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');
const activityLogger = require('../middleware/activityLogger');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(checkRole(['admin']));

/**
 * @route   GET /api/v1/admin/dashboard/stats
 * @desc    Get comprehensive dashboard stats
 * @access  Private (Admin only)
 */
router.get('/dashboard/stats', adminController.getDashboardStats);

/**
 * @route   GET /api/v1/admin/lands/pending
 * @desc    Get all pending lands for verification
 * @access  Private (Admin only)
 */
router.get('/lands/pending', adminController.getPendingLands);
router.get('/lands', adminController.getAllLands);
router.delete('/lands/:id', adminController.deleteLand);

/**
 * @route   PUT /api/v1/admin/lands/:id/approve
 * @desc    Approve land verification
 * @access  Private (Admin only)
 */
router.put('/lands/:id/approve', adminController.approveLand);

/**
 * @route   PUT /api/v1/admin/lands/:id/reject
 * @desc    Reject land verification
 * @access  Private (Admin only)
 */
router.put(
    '/lands/:id/reject',
    [
        body('rejectionReason').notEmpty().withMessage('Rejection reason is required'),
        validate,
    ],
    adminController.rejectLand
);

/**
 * @route   GET /api/v1/admin/farms/pending
 * @desc    Get all pending farms for approval
 * @access  Private (Admin only)
 */
router.get('/farms/pending', adminController.getPendingFarms);
router.get('/farms', adminController.getAllFarms);
router.delete('/farms/:id', adminController.deleteFarm);

/**
 * @route   PUT /api/v1/admin/farms/:id/approve
 * @desc    Approve farm
 * @access  Private (Admin only)
 */
router.put('/farms/:id/approve', adminController.approveFarm);

/**
 * @route   PUT /api/v1/admin/farms/:id/reject
 * @desc    Reject farm
 * @access  Private (Admin only)
 */
router.put(
    '/farms/:id/reject',
    [
        body('rejectionReason').notEmpty().withMessage('Rejection reason is required'),
        validate,
    ],
    adminController.rejectFarm
);

/**
 * @route   GET /api/v1/admin/farmers/profiles/pending
 * @desc    Get all pending farmer profiles for verification
 * @access  Private (Admin only)
 */
router.get('/farmers/profiles/pending', adminController.getPendingFarmerProfiles);

/**
 * @route   PUT /api/v1/admin/farmers/profiles/:id/approve
 * @desc    Approve farmer profile verification
 * @access  Private (Admin only)
 */
router.put('/farmers/profiles/:id/approve', adminController.approveFarmerProfile);

/**
 * @route   PUT /api/v1/admin/farmers/profiles/:id/reject
 * @desc    Reject farmer profile verification
 * @access  Private (Admin only)
 */
router.put(
    '/farmers/profiles/:id/reject',
    [
        body('rejectionReason').notEmpty().withMessage('Rejection reason is required'),
        validate,
    ],
    adminController.rejectFarmerProfile
);

/**
 * @route   DELETE /api/v1/admin/farmers/profiles/:id
 * @desc    Delete farmer profile
 * @access  Private (Admin only)
 */
router.delete('/farmers/profiles/:id', adminController.deleteFarmerProfile);

/**
 * User Management Routes
 */
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);

router.put(
    '/users/:id/verify',
    activityLogger('user_verified', 'user'),
    adminController.verifyUser
);

router.put(
    '/users/:id/kyc-approve',
    activityLogger('kyc_approved', 'user'),
    adminController.approveKYC
);

router.put(
    '/users/:id/kyc-reject',
    [
        body('rejectionReason').notEmpty().withMessage('Rejection reason is required'),
        validate,
        activityLogger('kyc_rejected', 'user'),
    ],
    adminController.rejectKYC
);

router.put(
    '/users/:id/suspend',
    [
        body('suspensionReason').notEmpty().withMessage('Suspension reason is required'),
        validate,
        activityLogger('user_suspended', 'user'),
    ],
    adminController.suspendUser
);

router.put(
    '/users/:id/activate',
    activityLogger('user_activated', 'user'),
    adminController.activateUser
);

router.delete(
    '/users/:id',
    activityLogger('user_deleted', 'user'),
    adminController.deleteUser
);

/**
 * Approval Routes
 */
router.get('/users/kyc/pending', adminController.getPendingKYC);
router.get('/approvals/pending', adminController.getPendingApprovalsSummary);

/**
 * Investment Monitoring Routes
 */
router.get('/investments', adminController.getAllInvestments);
router.get('/investments/:id', adminController.getInvestmentById);
router.put(
    '/investments/:id/cancel',
    [
        body('cancellationReason').notEmpty().withMessage('Cancellation reason is required'),
        validate,
        activityLogger('investment_cancelled', 'investment'),
    ],
    adminController.cancelInvestment
);

router.put(
    '/investments/:id',
    activityLogger('investment_updated', 'investment'),
    adminController.updateInvestment
);

router.delete(
    '/investments/:id',
    activityLogger('investment_deleted', 'investment'),
    adminController.deleteInvestment
);

/**
 * Payment & Transaction Routes
 */
router.get('/payments', adminController.getAllPayments);
router.get('/payments/failed', adminController.getFailedPayments);
router.post(
    '/payments/:id/retry',
    activityLogger('payment_retry_initiated', 'payment'),
    adminController.retryPayment
);
router.post(
    '/payments/:id/refund',
    [
        body('refundAmount').isNumeric().withMessage('Refund amount must be a number'),
        body('refundReason').notEmpty().withMessage('Refund reason is required'),
        validate,
        activityLogger('payment_refunded', 'payment'),
    ],
    adminController.refundPayment
);

router.get('/revenue/report', adminController.getRevenueReport);

/**
 * Dispute Management Routes (Admin)
 */
router.get('/disputes', disputeController.getAllDisputes);
router.get('/disputes/:id', disputeController.getDisputeById);
router.put(
    '/disputes/:id/status',
    [
        body('status').isIn(['open', 'under_review', 'resolved', 'closed']).withMessage('Invalid status'),
        validate,
        activityLogger('dispute_status_updated', 'dispute'),
    ],
    disputeController.updateDisputeStatus
);
router.post(
    '/disputes/:id/resolve',
    [
        body('resolution').notEmpty().withMessage('Resolution is required'),
        validate,
        activityLogger('dispute_resolved', 'dispute'),
    ],
    disputeController.resolveDispute
);

/**
 * Platform Settings Routes
 */
router.get('/settings', settingsController.getAllSettings);
router.put(
    '/settings/:key',
    [
        body('settingValue').notEmpty().withMessage('Setting value is required'),
        validate,
        activityLogger('platform_setting_updated', 'setting', (req) => req.params.key),
    ],
    settingsController.updateSetting
);

/**
 * Activity Logs Route
 */
router.get('/activity-logs', adminController.getActivityLogs);

/**
 * Notification Routes
 */
router.get('/notifications', adminController.getAdminNotifications);
router.put('/notifications/:id/read', adminController.markNotificationAsRead);

/**
 * Email Campaign Routes
 */
router.get('/campaigns', campaignController.getAllCampaigns);
router.post(
    '/campaigns',
    [
        body('name').notEmpty().withMessage('Campaign name is required'),
        body('subject').notEmpty().withMessage('Subject is required'),
        body('body').notEmpty().withMessage('Body is required'),
        body('recipientFilter').isObject().withMessage('Recipient filter is required'),
        validate,
        activityLogger('campaign_created', 'campaign'),
    ],
    campaignController.createCampaign
);
router.post(
    '/campaigns/:id/send',
    activityLogger('campaign_sent', 'campaign'),
    campaignController.sendCampaign
);
router.delete(
    '/campaigns/:id',
    activityLogger('campaign_deleted', 'campaign'),
    campaignController.deleteCampaign
);

module.exports = router;
