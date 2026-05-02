const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calculateInvestmentBreakdown } = require('../utils/financeUtils');
const { createNotification } = require('../utils/notification.service');

const investmentController = {
    // Create new investment
    createInvestment: async (req, res) => {
        try {
            const { plantId, investmentDurationMonths } = req.body;
            const investorId = req.user.id;

            if (!plantId || !investmentDurationMonths) {
                return res.status(400).json({ message: 'Plant ID and duration are required' });
            }

            // check if plant exists and is available
            const plant = await prisma.plant.findUnique({
                where: { id: plantId },
                include: { farm: true }
            });

            if (!plant) {
                return res.status(404).json({ message: 'Plant not found' });
            }

            if (plant.status !== 'available') {
                return res.status(400).json({ message: 'Plant is not available for investment' });
            }

            // Calculate fees using utility
            const breakdown = calculateInvestmentBreakdown(
                parseFloat(plant.landFee) || 0,
                parseFloat(plant.maintenanceFeeMonthly) || 0,
                parseInt(investmentDurationMonths)
            );

            const { landFee, monthlyFee, platformFee, totalAmount, duration, totalMonthly } = breakdown;

            // Create Investment Record
            const investment = await prisma.investment.create({
                data: {
                    investorId,
                    plantId,
                    status: 'pending',
                    investmentDurationMonths: duration,
                    landFee,
                    monthlyFarmerFee: monthlyFee,
                    platformFee,
                    totalAmount,
                    startDate: new Date(), // Tentative start date
                }
            });

            // Update Plant Status (Reserved until payment)
            await prisma.plant.update({
                where: { id: plantId },
                data: { status: 'reserved' }
            });

            res.status(201).json({
                message: 'Investment created successfully',
                investment,
                breakdown: {
                    landFee,
                    monthlyFee,
                    duration,
                    totalMonthly,
                    platformFee,
                    totalAmount
                }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error creating investment' });
        }
    },

    // Get user investments
    getInvestments: async (req, res) => {
        try {
            const userId = req.user.id;

            // Fetch plant investments
            const investments = await prisma.investment.findMany({
                where: { investorId: userId },
                include: {
                    plant: { 
                        include: { 
                            cropType: true,
                            farm: { include: { farmer: { include: { user: { select: { fullName: true } } } } } }
                        } 
                    },
                    payments: true
                },
                orderBy: { createdAt: 'desc' }
            });

            // Fetch farm leases (owned farms)
            const farmLeases = await prisma.farm.findMany({
                where: { 
                    investorId: userId,
                    isDirectPlanting: false // Only show actual land leases, not direct planting containers
                },
                include: {
                    land: true,
                    payments: true,
                    farmer: { include: { user: { select: { fullName: true } } } }
                },
                orderBy: { createdAt: 'desc' }
            });

            // Fetch plantation requests
            const plantationRequests = await prisma.plantationRequest.findMany({
                where: { 
                    investorId: userId,
                    status: { in: ['pending', 'approved', 'planted'] },
                    farmId: { not: null }
                },
                include: {
                    farm: { include: { land: true, farmer: { include: { user: { select: { fullName: true } } } } } },
                    items: { include: { tree: true } }
                },
                orderBy: { createdAt: 'desc' }
            });

            // Format farm leases to match investment            // Format farm leases (owned farms)
            const formattedLeases = farmLeases.map(farm => {
                const totalPaid = farm.payments
                    .filter(p => p.status === 'completed')
                    .reduce((sum, p) => sum + Number(p.amount), 0);
                
                return {
                    id: farm.id,
                    type: 'farm_lease',
                    title: farm.farmName,
                    status: farm.isActive ? 'active' : (farm.isApproved ? 'approved' : 'pending'),
                    hiringStatus: farm.hiringStatus,
                    amount: totalPaid > 0 ? totalPaid : farm.leaseAmount,
                    farmerId: farm.farmerId,
                    farmerName: farm.farmer?.user?.fullName,
                    farmId: farm.id, // Farm ID here
                    createdAt: farm.createdAt,
                    details: {
                        area: farm.totalArea,
                        unit: farm.areaUnit,
                        location: `${farm.land?.city}, ${farm.land?.state}`,
                        isPlantingProject: farm.isDirectPlanting
                    }
                };
            });

            // Format plantation requests
            const formattedRequests = plantationRequests.map(req => ({
                id: req.id,
                type: 'plantation_request',
                title: req.description || (req.items.length > 0 ? `${req.items[0].tree.name} Project` : 'Plantation Project'),
                status: req.status,
                amount: req.totalPrice,
                createdAt: req.createdAt,
                farmerId: req.farm?.farmerId,
                farmerName: req.farm?.farmer?.user?.fullName,
                hiringStatus: req.farm?.hiringStatus, // Add this
                farmId: req.farmId,
                details: {
                    location: req.farm?.land ? `${req.farm.land.city}, ${req.farm.land.state}` : 'N/A',
                    items: req.items.map(i => `${i.quantity}x ${i.tree.name}`).join(', '),
                    area: req.farm?.totalArea,
                    unit: req.farm?.areaUnit,
                    isPlantingProject: true
                }
            }));

            // Format plant investments
            const formattedInvestments = investments.map(inv => ({
                id: inv.id,
                type: 'plant_investment',
                title: inv.plant?.cropType?.name || 'Plant Investment',
                status: inv.status,
                amount: inv.totalAmount,
                createdAt: inv.createdAt,
                details: {
                    duration: inv.investmentDurationMonths,
                    harvestDate: inv.plant?.expectedHarvestDate
                },
                plantId: inv.plantId,
                farmerId: inv.plant?.farm?.farmerId,
                farmerName: inv.plant?.farm?.farmer?.user?.fullName,
                farmId: inv.plant?.farmId
            }));

            res.json([...formattedLeases, ...formattedRequests, ...formattedInvestments].sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            ));
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching investments' });
        }
    },

    // Get single investment details
    getInvestmentDetails: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const investment = await prisma.investment.findUnique({
                where: { id },
                include: {
                    plant: {
                        include: {
                            cropType: true,
                            farm: { include: { farmer: { include: { user: { select: { fullName: true, email: true } } } } } }
                        }
                    },
                    payments: true,
                    investor: { select: { fullName: true, email: true } }
                }
            });

            if (!investment) {
                return res.status(404).json({ message: 'Investment not found' });
            }

            // Authorization check
            if (investment.investorId !== userId && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized' });
            }

            res.json(investment);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching investment details' });
        }
    },

    // Cancel investment
    cancelInvestment: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const investment = await prisma.investment.findUnique({
                where: { id }
            });

            if (!investment) {
                return res.status(404).json({ message: 'Investment not found' });
            }

            if (investment.investorId !== userId) {
                return res.status(403).json({ message: 'Not authorized' });
            }

            if (investment.status !== 'pending') {
                return res.status(400).json({ message: 'Only pending investments can be cancelled' });
            }

            // Update status
            await prisma.investment.update({
                where: { id },
                data: { status: 'cancelled' }
            });

            // Make plant available again
            await prisma.plant.update({
                where: { id: investment.plantId },
                data: { status: 'available' }
            });

            res.json({ message: 'Investment cancelled successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error cancelling investment' });
        }
    },

    // Initiate Hiring Payment (Create pending record before proof upload)
    initiateHiringPayment: async (req, res) => {
        try {
            const { farmId, paymentMethod } = req.body;
            const investorId = req.user.id;

            const farm = await prisma.farm.findFirst({
                where: { id: farmId, investorId, hiringStatus: 'awaiting_payment' },
                include: { farmer: true }
            });

            if (!farm) {
                return res.status(404).json({ message: 'Farm not found or not in awaiting_payment status' });
            }

            // Create a pending payment record
            const payment = await prisma.payment.create({
                data: {
                    farmId: farm.id,
                    amount: farm.farmer?.chargesPerTask || 0,
                    status: 'pending',
                    type: 'farmer_charges',
                    paymentMethod: paymentMethod || 'manual_pakistan',
                    description: `Farmer charges for hiring at ${farm.farmName}`,
                    recipientId: farm.farmer?.userId
                }
            });

            res.json({
                paymentId: payment.id,
                amount: payment.amount,
                farmName: farm.farmName,
                farmerName: farm.farmer?.user?.fullName
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error initiating hiring payment' });
        }
    },

    // Hire a farmer for a leased farm
    hireFarmer: async (req, res) => {
        try {
            const { farmId, farmerId } = req.body;
            const investorId = req.user.id;

            if (!farmId || !farmerId) {
                return res.status(400).json({ message: 'Farm ID and Farmer ID are required' });
            }

            // check if farm exists and belongs to the investor
            const farm = await prisma.farm.findFirst({
                where: { id: farmId, investorId }
            });

            if (!farm) {
                return res.status(404).json({ message: 'Farm not found or access denied' });
            }

            // Verify farmer exists and is verified
            const farmer = await prisma.farmer.findUnique({
                where: { id: farmerId, isVerified: true }
            });

            if (!farmer) {
                return res.status(404).json({ message: 'Farmer not found or not verified' });
            }

            // Update Farm with the farmerId
            const updatedFarm = await prisma.farm.update({
                where: { id: farmId },
                data: { farmerId, hiringStatus: 'pending' }
            });

            // Create notification for farmer
            await createNotification(
                farmer.userId,
                'system',
                'New Hiring Request',
                `Investor ${req.user.fullName} wants to hire you for farm "${farm.farmName}".`,
                { link: '/farmer/managed-farms', metadata: { farmId, farmName: farm.farmName } }
            );
            
            res.json({
                message: 'Farmer hired successfully',
                farm: updatedFarm
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error hiring farmer' });
        }
    },

    // Pay farmer charges to finalize hiring
    payFarmerCharges: async (req, res) => {
        try {
            const { farmId, bankName, accountTitle, accountNumber, transactionId, proofUrl, paymentMethod } = req.body;
            const investorId = req.user.id;

            if (!farmId) {
                return res.status(400).json({ message: 'Farm ID is required' });
            }

            const farm = await prisma.farm.findFirst({
                where: { id: farmId, investorId, hiringStatus: 'awaiting_payment' },
                include: { farmer: true }
            });

            if (!farm) {
                return res.status(404).json({ message: 'Farm not found or not in awaiting_payment status' });
            }

            // Create Payment Record
            const payment = await prisma.payment.create({
                data: {
                    farmId: farm.id,
                    amount: farm.farmer?.chargesPerTask || 0,
                    status: proofUrl ? 'pending_verification' : 'completed',
                    type: 'farmer_charges',
                    paymentMethod: paymentMethod || 'bank_transfer',
                    bankName,
                    accountTitle,
                    accountNumber,
                    transactionId,
                    proofUrl,
                    description: `Farmer charges for ${farm.farmName}`,
                    paidAt: new Date(),
                    recipientId: farm.farmer?.userId
                }
            });

            // Update Farm Status to accepted (Hired)
            const updatedFarm = await prisma.farm.update({
                where: { id: farmId },
                data: { hiringStatus: 'accepted' }
            });

            // Create notification for farmer
            await createNotification(
                farm.farmer.userId,
                'payment_success',
                'Payment Received',
                `Investor ${req.user.fullName} has paid the charges for farm "${farm.farmName}". Hiring is finalized.`,
                { link: '/farmer/managed-farms', metadata: { farmId, farmName: farm.farmName } }
            );

            res.json({
                message: proofUrl ? 'Payment proof submitted. Verification pending.' : 'Farmer charges paid successfully. Hiring finalized.',
                farm: updatedFarm,
                payment
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error processing payment' });
        }
    }
};

module.exports = investmentController;
