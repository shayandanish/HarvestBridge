const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { convertArea } = require('../utils/unitUtils');

const investorDashboardController = {
    getDashboardStats: async (req, res) => {
        try {
            const userId = req.user.id; // From auth middleware

            const investments = await prisma.investment.findMany({
                where: { investorId: userId, status: 'active' },
                include: { plant: true }
            });

            // Also include plantation requests that are planted or approved
            const plantationRequests = await prisma.plantationRequest.findMany({
                where: { 
                    investorId: userId,
                    status: { in: ['planted', 'approved'] },
                    farmId: { not: null }
                },
                include: { items: true, farm: { include: { land: true } } }
            });

            const investmentTotalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);
            const plantationTotalInvested = plantationRequests.reduce((sum, req) => sum + parseFloat(req.totalPrice || 0), 0);
            const totalInvested = investmentTotalInvested + plantationTotalInvested;

            const activePlants = investments.length + plantationRequests.length;
            const upcomingHarvests = investments.filter(inv => {
                if (!inv.plant?.expectedHarvestDate) return false;
                const harvestDate = new Date(inv.plant.expectedHarvestDate);
                const now = new Date();
                const diffTime = Math.abs(harvestDate - now);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 30 && diffDays > 0;
            }).length;

            const leasedFarms = await prisma.farm.findMany({
                where: { investorId: userId, isActive: true },
                include: {
                    land: {
                        include: {
                            farms: {
                                where: { isActive: true }
                            }
                        }
                    }
                }
            });

            // Get all verified lands that are active
            const allVerifiedLands = await prisma.land.findMany({
                where: { isVerified: true, isActive: true },
                include: {
                    farms: {
                        where: { isActive: true }
                    }
                }
            });

            // Don't aggregate farms by land if user wants to see individual projects
            const formattedLeasedFarms = leasedFarms.map(farm => ({
                ...farm,
                farmName: farm.farmName,
                location: farm.land ? `${farm.land.city}, ${farm.land.state}` : 'N/A',
                farmer: farm.farmer,
                hasManualLease: !farm.isDirectPlanting
            }));

            // Filter available lands
            const availableLands = allVerifiedLands
                .filter(land => {
                    const totalLeased = land.farms.reduce((sum, f) => {
                        const farmAreaInBaseUnit = convertArea(f.totalArea, f.areaUnit || land.areaUnit, land.areaUnit);
                        return sum + Number(farmAreaInBaseUnit || 0);
                    }, 0);
                    const remaining = Number(land.totalArea) - totalLeased;
                    return remaining > 0.01;
                })
                .map(land => {
                    const totalLeased = land.farms.reduce((sum, f) => {
                        const farmAreaInBaseUnit = convertArea(f.totalArea, f.areaUnit || land.areaUnit, land.areaUnit);
                        return sum + Number(farmAreaInBaseUnit || 0);
                    }, 0);
                    const remaining = Math.max(0, Number(land.totalArea) - totalLeased);
                    return {
                        ...land,
                        remainingArea: parseFloat(remaining.toFixed(2))
                    };
                });

            res.json({
                totalInvested,
                activePlants, // This is already investments.length + plantationRequests.length
                totalInvestmentsCount: investments.length + plantationRequests.length + leasedFarms.filter(f => !f.isDirectPlanting).length,
                upcomingHarvests,
                leasedFarms: formattedLeasedFarms,
                availableLands,
                recentUpdates: [] // Placeholder
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching dashboard stats' });
        }
    }
};

module.exports = investorDashboardController;
