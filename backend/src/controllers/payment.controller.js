const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { processAndUploadImage } = require('../utils/fileUpload');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Future integration

const paymentController = {
    // Initiate Payment
    initiatePayment: async (req, res) => {
        try {
            const { investmentId, paymentMethod } = req.body;
            const userId = req.user.id;

            const investment = await prisma.investment.findUnique({
                where: { id: investmentId }
            });

            if (!investment) {
                return res.status(404).json({ message: 'Investment not found' });
            }

            if (investment.investorId !== userId) {
                return res.status(403).json({ message: 'Not authorized' });
            }

            if (investment.status !== 'pending') {
                return res.status(400).json({ message: 'Investment is not pending' });
            }

            const amount = parseFloat(investment.totalAmount);

            // Create Stripe Payment Intent (Mocked)
            // const paymentIntent = await stripe.paymentIntents.create({
            //     amount: Math.round(amount * 100), // cents
            //     currency: 'usd',
            //     metadata: { investmentId }
            // });
            const mockPaymentIntent = { id: 'pi_mock_' + Date.now(), client_secret: 'secret_mock_' + Date.now() };

            // Create Payment Record
            const payment = await prisma.payment.create({
                data: {
                    investmentId,
                    amount,
                    description: `Initial investment for Plant ${investment.plantId}`,
                    transactionId: mockPaymentIntent.id,
                    status: 'pending',
                    type: 'investment'
                }
            });

            res.json({
                clientSecret: mockPaymentIntent.client_secret,
                paymentId: payment.id
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error initiating payment' });
        }
    },

    // Confirm Payment (Webhook or Client confirmation)
    confirmPayment: async (req, res) => {
        try {
            const { paymentId } = req.body;

            const payment = await prisma.payment.findUnique({
                where: { id: paymentId },
                include: { investment: true }
            });

            if (!payment) {
                return res.status(404).json({ message: 'Payment not found' });
            }

            // Verify with Stripe (Mocked: Assume success)

            // Update Payment
            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'completed',
                    paidAt: new Date()
                }
            });

            // Update Investment
            const investment = await prisma.investment.update({
                where: { id: payment.investmentId },
                data: {
                    status: 'active',
                    startDate: new Date()
                }
            });

            // Update Plant Status
            await prisma.plant.update({
                where: { id: investment.plantId },
                data: { status: 'sponsored' }
            });

            // Send Notifications (Future)

            res.json({ message: 'Payment confirmed and investment active' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error confirming payment' });
        }
    },

    // Get Payment History
    getHistory: async (req, res) => {
        try {
            // Placeholder
            res.json([]);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching history' });
        }
    },

    // Initiate Land Lease Payment (Gas Fee)
    initiateLeasePayment: async (req, res) => {
        try {
            const { farmId, paymentMethod } = req.body;
            const investorId = req.user.id;

            const farm = await prisma.farm.findUnique({
                where: { id: farmId },
                include: { 
                    land: true,
                    plantationRequests: {
                        where: { status: 'pending' },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            });

            if (!farm) {
                return res.status(404).json({ message: 'Farm not found' });
            }

            if (farm.investorId !== investorId) {
                return res.status(403).json({ message: 'Not authorized' });
            }

            let totalAmount = 0;
            let leaseAmount = 0;
            let plantationAmount = 0;
            let description = '';

            const pendingPlantation = farm.plantationRequests[0];

            if (farm.isLeasePaid) {
                // If lease is paid, we can ONLY proceed if there is a pending plantation request
                if (!pendingPlantation) {
                    return res.status(400).json({ message: 'Lease is already paid and no pending plantation requests found.' });
                }
                plantationAmount = Number(pendingPlantation.totalPrice || 0);
                totalAmount = plantationAmount;
                description = `Plantation Request for ${farm.farmName} (${plantationAmount} Rs)`;
            } else {
                // If lease is not paid, charge lease + any pending plantation request
                totalAmount = Number(farm.leaseAmount || 0);
                leaseAmount = Number(farm.leaseAmount || 0);
                description = `Gas Fee / Monthly Lease for ${farm.farmName} ${farm.land ? `at ${farm.land.landName}` : ''}`;
                
                if (pendingPlantation) {
                    plantationAmount = Number(pendingPlantation.totalPrice || 0);
                    totalAmount += plantationAmount;
                    description += ` + Plantation Request (${plantationAmount} Rs)`;
                }
            }

            // Mock Stripe Payment Intent
            const mockPaymentIntent = { id: 'pi_lease_' + Date.now(), client_secret: 'lease_secret_' + Date.now() };

            // Create Payment Record for the lease (and plantation)
            const payment = await prisma.payment.create({
                data: {
                    farmId,
                    amount: totalAmount,
                    description,
                    transactionId: mockPaymentIntent.id,
                    status: 'pending',
                    paymentMethod: paymentMethod || 'manual_pakistan',
                    type: 'land_lease'
                }
            });

            res.json({
                clientSecret: mockPaymentIntent.client_secret,
                paymentId: payment.id,
                amount: totalAmount,
                leaseAmount,
                plantationAmount,
                farmName: pendingPlantation?.description || farm.farmName,
                plantationRequestId: pendingPlantation?.id || null
            });

        } catch (error) {
            console.error('Error in initiateLeasePayment:', error);
            res.status(500).json({ message: 'Error initiating lease payment', error: error.message });
        }
    },

    // Confirm Land Lease Payment
    confirmLeasePayment: async (req, res) => {
        try {
            const { paymentId, farmId, bankName, accountTitle, accountNumber } = req.body;

            const { createPlantsFromRequest } = require('../utils/plantCreation');

            await prisma.$transaction(async (tx) => {
                // 1. Update Payment
                await tx.payment.update({
                    where: { id: paymentId },
                    data: {
                        status: 'completed',
                        paidAt: new Date(),
                        bankName,
                        accountTitle,
                        accountNumber,
                        proofUrl: req.body.proofUrl
                    }
                });

                // 2. Update Farm Status
                await tx.farm.update({
                    where: { id: farmId },
                    data: {
                        isLeasePaid: true,
                        isApproved: true, // Approved once paid
                        isActive: true    // Activated once paid
                    }
                });

                // 3. Find pending plantation requests
                const pendingRequests = await tx.plantationRequest.findMany({
                    where: { 
                        farmId,
                        status: 'pending'
                    }
                });

                // 4. Update and create plants for each
                for (const request of pendingRequests) {
                    const updatedRequest = await tx.plantationRequest.update({
                        where: { id: request.id },
                        data: { status: 'approved' }
                    });
                    
                    // Create individual Plant records
                    await createPlantsFromRequest(tx, updatedRequest, 'approved');
                }
            });

            res.json({ message: 'Lease payment confirmed. Farm is now active and plants have been initialized!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error confirming lease payment' });
        }
    },

    // Confirm Payment with Proof (Manual Verification)
    confirmWithProof: async (req, res) => {
        try {
            const { paymentId, proofUrl, paymentMethod, accountName, accountNumber } = req.body;
            
            const payment = await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'pending_verification',
                    proofUrl,
                    bankName: paymentMethod,
                    accountTitle: accountName,
                    accountNumber: accountNumber
                }
            });

            res.json({ 
                message: 'Receipt uploaded successfully. Our team will verify your payment shortly.',
                payment 
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error uploading payment proof' });
        }
    },

    // Upload Payment Proof Image
    uploadProof: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            const proofUrl = await processAndUploadImage(
                req.file.buffer,
                req.file.originalname,
                'payment_proofs'
            );

            res.json({ proofUrl });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error processing proof upload' });
        }
    }
};

module.exports = paymentController;
