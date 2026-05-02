const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplace.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.get('/search', marketplaceController.search);
router.get('/farms', marketplaceController.getFarms);
router.get('/farms/:id', marketplaceController.getFarmDetails);
router.get('/lands/verified', marketplaceController.getVerifiedLands);
router.get('/plants/available', marketplaceController.getAvailablePlants);
router.get('/plants/:id', marketplaceController.getPlantDetails);
router.post('/compare', marketplaceController.comparePlants);

// Protected routes
router.get('/recommendations', protect, marketplaceController.getRecommendations);
router.post('/lands/lease', protect, marketplaceController.leaseLand);

module.exports = router;
