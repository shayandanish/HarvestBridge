const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/tracking.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { upload } = require('../utils/fileUpload');

router.use(protect);

// Activities
router.post('/:plantId/activities', authorize('farmer'), upload.single('photo'), trackingController.logActivity);
router.post('/farm/:farmId/activities', authorize('farmer'), upload.single('photo'), trackingController.logActivity);

// Photos
router.post('/:plantId/photos', authorize('farmer'), upload.single('photo'), trackingController.uploadPhoto);
router.post('/farm/:farmId/photos', authorize('farmer'), upload.single('photo'), trackingController.uploadPhoto);

// Milestones
router.post('/:plantId/milestones', authorize('farmer'), trackingController.logMilestone);
router.post('/farm/:farmId/milestones', authorize('farmer'), trackingController.logMilestone);

// Consolidated Timeline (accessible by farmer and investor)
router.get('/:plantId/timeline', trackingController.getTimeline);
router.get('/farm/:farmId/timeline', trackingController.getTimeline);

module.exports = router;
