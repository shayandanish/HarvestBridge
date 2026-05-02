const express = require('express');
const router = express.Router();
const investorDashboardController = require('../controllers/investor.dashboard.controller.js');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/stats', investorDashboardController.getDashboardStats);

module.exports = router;
