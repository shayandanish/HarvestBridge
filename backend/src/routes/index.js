const express = require('express');
const authRoutes = require('./auth.routes');
const profileRoutes = require('./profile.routes');
const farmerRoutes = require('./farmer.routes');
const landownerRoutes = require('./landowner.routes');
const landRoutes = require('./land.routes');
const cropTypeRoutes = require('./cropType.routes');
const plantRoutes = require('./plant.routes');
const adminRoutes = require('./admin.routes');
const { getPublicFarmers, getPublicFarmerById } = require('../controllers/farmer.controller');

const router = express.Router();

// Health check for API
router.get('/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'API is running',
        version: process.env.API_VERSION || 'v1',
        timestamp: new Date().toISOString(),
    });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/farmer', farmerRoutes);
router.use('/landowner', landownerRoutes);
router.use('/lands', landRoutes);
router.use('/crop-types', cropTypeRoutes);
router.use('/plants', plantRoutes);
router.use('/admin', adminRoutes);
router.use('/marketplace', require('./marketplace.routes'));
router.use('/favorites', require('./favorites.routes'));
router.use('/investments', require('./investment.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/tracking', require('./tracking.routes'));
router.use('/investor/dashboard', require('./investor.dashboard.routes'));
router.use('/farms', require('./farm.routes'));
router.use('/bookings', require('./booking.routes'));
router.use('/harvests', require('./harvest.routes'));
router.use('/disputes', require('./dispute.routes'));
router.use('/trees', require('./tree.routes'));
router.use('/plantations', require('./plantation.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/messages', require('./message.routes'));
router.use('/reviews', require('./review.routes'));

// Public farmer directory (no authentication required)
router.get('/public/farmers', getPublicFarmers);
router.get('/public/farmers/:id', getPublicFarmerById);

module.exports = router;
