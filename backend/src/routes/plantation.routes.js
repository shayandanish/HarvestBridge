const express = require('express');
const router = express.Router();
const plantationController = require('../controllers/plantation.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

// Investor routes
router.post('/', authorize('investor'), plantationController.createPlantationRequest);
router.post('/direct', authorize('investor'), plantationController.createDirectPlantationRequest);
router.get('/my-requests', authorize('investor'), plantationController.getMyPlantationRequests);
router.delete('/:id', authorize('investor'), plantationController.deletePlantationRequest);


// Admin routes
router.use(authorize('admin'));
router.get('/', plantationController.getAllPlantationRequests);
router.put('/:id/status', plantationController.updatePlantationRequestStatus);

module.exports = router;
