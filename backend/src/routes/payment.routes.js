const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');

const { uploadSingle } = require('../utils/fileUpload');

router.use(protect);

router.post('/initiate', paymentController.initiatePayment);
router.post('/confirm', paymentController.confirmPayment);
router.post('/:id/upload-proof', uploadSingle('proof', ['image/jpeg', 'image/png', 'image/webp']), paymentController.uploadProof);
router.get('/history', paymentController.getHistory);

// Lease specific payments
router.post('/lease/initiate', paymentController.initiateLeasePayment);
router.post('/lease/confirm', paymentController.confirmLeasePayment);
router.post('/confirm-proof', paymentController.confirmWithProof);

module.exports = router;
