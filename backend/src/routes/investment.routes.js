const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investment.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

/**
 * @swagger
 * /investments:
 *   post:
 *     summary: Create a new investment
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plantId
 *               - investmentDurationMonths
 *             properties:
 *               plantId:
 *                 type: string
 *               investmentDurationMonths:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Investment created successfully
 *       400:
 *         description: Missing fields or plant unavailable
 */
router.post('/', investmentController.createInvestment);

/**
 * @swagger
 * /investments:
 *   get:
 *     summary: Get user investments
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of investments
 */
router.get('/', investmentController.getInvestments);

/**
 * @swagger
 * /investments/{id}:
 *   get:
 *     summary: Get investment details
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Investment details
 *       404:
 *         description: Investment not found
 */
router.get('/:id', investmentController.getInvestmentDetails);

/**
 * @swagger
 * /investments/{id}/cancel:
 *   put:
 *     summary: Cancel a pending investment
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Investment cancelled
 *       400:
 *         description: Only pending investments can be cancelled
 */
router.put('/:id/cancel', investmentController.cancelInvestment);
router.post('/hire', investmentController.hireFarmer);
router.post('/initiate-hiring', investmentController.initiateHiringPayment);
router.post('/pay-farmer-charges', investmentController.payFarmerCharges);

module.exports = router;
