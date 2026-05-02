const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const marketplaceController = {
    // Get all verified lands (public)
    getVerifiedLands: async (req, res) => {
        try {
            const { city, page = 1, limit = 10 } = req.query;
            const where = {
                isVerified: true,
                isActive: true
            };

            if (city) {
                where.city = { contains: city, mode: 'insensitive' };
            }

            const lands = await prisma.land.findMany({
                where,
                select: {
                    id: true,
                    landName: true,
                    totalArea: true,
                    areaUnit: true,
                    city: true,
                    state: true,
                    address: true,
                    specificLocation: true,
                    landPhotos: true,
                    rentalFeeMonthly: true,
                    soilQuality: true,
                    waterAvailability: true,
                    sunlightExposure: true,
                    overallRating: true,
                    cultivablePlants: true,
                    ownershipDocumentUrl: false,
                    landowner: {
                        select: {
                            user: {
                                select: {
                                    fullName: true
                                }
                            }
                        }
                    },
                    farms: {
                        select: {
                            totalArea: true,
                            areaUnit: true,
                            isApproved: true,
                            isActive: true
                        }
                    }
                },
                skip: (page - 1) * limit,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' }
            });

            const total = await prisma.land.count({ where });

            res.json({
                lands,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching verified lands:', error);
            res.status(500).json({ message: 'Error fetching verified lands' });
        }
    },

    // Search farms and plants
    search: async (req, res) => {
        try {
            const { query } = req.query;
            if (!query) {
                return res.status(400).json({ message: 'Search query is required' });
            }

            const farms = await prisma.farm.findMany({
                where: {
                    isActive: true,
                    isApproved: true,
                    OR: [
                        { farmName: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { land: { city: { contains: query, mode: 'insensitive' } } },
                        { land: { state: { contains: query, mode: 'insensitive' } } },
                        { farmer: { user: { fullName: { contains: query, mode: 'insensitive' } } } }
                    ]
                },
                include: {
                    land: true,
                    farmer: { include: { user: { select: { fullName: true, profilePhotoUrl: true } } } },
                    photos: true,
                    plants: { where: { status: 'available' }, include: { cropType: true } }
                },
                take: 10
            });

            const plants = await prisma.plant.findMany({
                where: {
                    status: 'available',
                    cropType: { name: { contains: query, mode: 'insensitive' } }
                },
                include: {
                    farm: { include: { land: true, farmer: { include: { user: { select: { fullName: true } } } } } },
                    cropType: true
                },
                take: 10
            });

            res.json({ farms, plants });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error searching marketplace' });
        }
    },

    // Get all approved farms with filters
    getFarms: async (req, res) => {
        try {
            const {
                city, state, cropType, isOrganic,
                minPrice, maxPrice, sortBy, page = 1, limit = 20
            } = req.query;

            const where = {
                isActive: true,
                isApproved: true
            };

            if (city) where.land = { city: { contains: city, mode: 'insensitive' } };
            if (state) where.land = { ...where.land, state: { contains: state, mode: 'insensitive' } };
            if (isOrganic === 'true') where.isOrganic = true;
            if (req.query.investorOnly === 'true') {
                where.investorId = { not: null };
            }
            if (cropType) {
                where.plants = { some: { cropType: { name: { contains: cropType, mode: 'insensitive' } } } };
            }
            // Price filter logic would go here if price was on Farm model directly or aggregated

            const orderBy = {};
            if (sortBy === 'newest') orderBy.createdAt = 'desc';
            // if (sortBy === 'price_asc') ... complex sorting
            // if (sortBy === 'rating') orderBy.farmer = { rating: 'desc' };

            const farms = await prisma.farm.findMany({
                where,
                include: {
                    land: true,
                    farmer: { include: { user: { select: { fullName: true, profilePhotoUrl: true } } } },
                    photos: { where: { isPrimary: true } },
                    _count: { select: { plants: { where: { status: 'available' } } } }
                },
                skip: (page - 1) * limit,
                take: parseInt(limit),
                orderBy
            });

            const total = await prisma.farm.count({ where });

            res.json({
                farms,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching farms' });
        }
    },

    // Get single farm details (public)
    getFarmDetails: async (req, res) => {
        try {
            const { id } = req.params;
            const farm = await prisma.farm.findUnique({
                where: { id },
                include: {
                    land: true,
                    farmer: { include: { user: { select: { fullName: true, profilePhotoUrl: true, createdAt: true } } } },
                    photos: { orderBy: { displayOrder: 'asc' } },
                    trackingActivities: {
                        orderBy: { activityDate: 'desc' },
                        take: 10
                    },
                    trackingPhotos: {
                        orderBy: { takenDate: 'desc' },
                        take: 20
                    },
                    plants: {
                        where: { status: { in: ['available', 'sponsored', 'planted', 'growing', 'harvest_ready', 'harvested'] } },
                        include: { 
                            cropType: true,
                            photos: {
                                orderBy: { createdAt: 'desc' },
                                take: 1
                            }
                        }
                    },
                    reviews: {
                        include: { user: { select: { fullName: true, profilePhotoUrl: true } } },
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    },
                    plantationRequests: {
                        where: { status: { in: ['pending', 'approved'] } },
                        include: {
                            items: {
                                include: {
                                    tree: true
                                }
                            }
                        }
                    }
                }
            });

            if (!farm) {
                return res.status(404).json({ message: 'Farm not found' });
            }

            res.json(farm);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching farm details' });
        }
    },

    // Get available plants with filters
    getAvailablePlants: async (req, res) => {
        try {
            const {
                cropType, city, minPrice, maxPrice, sortBy, page = 1, limit = 20
            } = req.query;

            const where = {
                status: 'available',
                farm: { isApproved: true, isActive: true }
            };

            if (cropType) where.cropType = { name: { contains: cropType, mode: 'insensitive' } };
            if (city) where.farm = { land: { city: { contains: city, mode: 'insensitive' } } };

            // Price filter example (assuming plant fees)
            if (minPrice || maxPrice) {
                where.AND = [];
                if (minPrice) where.AND.push({ maintenanceFeeMonthly: { gte: parseFloat(minPrice) } });
                if (maxPrice) where.AND.push({ maintenanceFeeMonthly: { lte: parseFloat(maxPrice) } });
            }

            const orderBy = {};
            if (sortBy === 'lowest_price') orderBy.maintenanceFeeMonthly = 'asc'; // simplified
            else if (sortBy === 'nearest_harvest') orderBy.expectedHarvestDate = 'asc';
            else orderBy.createdAt = 'desc';

            const plants = await prisma.plant.findMany({
                where,
                include: {
                    farm: { include: { land: true, farmer: { select: { rating: true, user: { select: { fullName: true } } } } } },
                    cropType: true
                },
                skip: (page - 1) * limit,
                take: parseInt(limit),
                orderBy
            });

            const total = await prisma.plant.count({ where });

            res.json({
                plants,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching plants' });
        }
    },

    // Get single plant details
    getPlantDetails: async (req, res) => {
        try {
            const { id } = req.params;
            const plant = await prisma.plant.findUnique({
                where: { id },
                include: {
                    farm: {
                        include: {
                            land: true,
                            farmer: { include: { user: { select: { fullName: true, profilePhotoUrl: true } } } },
                            photos: { where: { isPrimary: true } }
                        }
                    },
                    cropType: true
                }
            });

            if (!plant) {
                return res.status(404).json({ message: 'Plant not found' });
            }

            // Fetch similar plants (same crop type, different id)
            const similarPlants = await prisma.plant.findMany({
                where: {
                    cropTypeId: plant.cropTypeId,
                    id: { not: plant.id },
                    status: 'available'
                },
                include: { farm: { select: { farmName: true, land: { select: { city: true } } } }, cropType: true },
                take: 4
            });

            res.json({ plant, similarPlants });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching plant details' });
        }
    },

    // Get recommendations for authenticated user
    getRecommendations: async (req, res) => {
        try {
            // Simplified logic: Recommend based on most popular crop types or recent additions
            // In a real app, use user history
            const recommendedPlants = await prisma.plant.findMany({
                where: { status: 'available' },
                include: {
                    farm: { select: { farmName: true, land: { select: { city: true, state: true } } } },
                    cropType: true
                },
                orderBy: { createdAt: 'desc' }, // Just showing newest for now
                take: 10
            });

            res.json(recommendedPlants);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching recommendations' });
        }
    },

    // Compare plants
    comparePlants: async (req, res) => {
        try {
            const { plantIds } = req.body; // Array of IDs
            if (!plantIds || !Array.isArray(plantIds) || plantIds.length > 4) {
                return res.status(400).json({ message: 'Invalid plant IDs (max 4)' });
            }

            const plants = await prisma.plant.findMany({
                where: { id: { in: plantIds } },
                include: {
                    farm: { include: { farmer: { select: { rating: true } }, land: { select: { city: true, state: true } } } },
                    cropType: true
                }
            });

            res.json(plants);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error comparing plants' });
        }
    },

    // Lease land (Investor-initiated farm creation)
    leaseLand: async (req, res) => {
        try {
            const { landId, farmName, description, area, areaUnit } = req.body;
            const investorId = req.user.id;

            if (req.user.role !== 'investor') {
                return res.status(403).json({ message: 'Only investors can lease land' });
            }

            const { convertArea } = require('../utils/unitUtils');

            // 1. Fetch land and its active farms
            const land = await prisma.land.findUnique({
                where: { id: landId },
                include: { farms: { where: { isActive: true } } }
            });

            if (!land || !land.isVerified || !land.isActive) {
                return res.status(404).json({ message: 'Land not found or not available for leasing' });
            }

            // 2. Calculate available area in land's base unit
            const totalLeasedInBaseUnit = land.farms.reduce((sum, f) => {
                const farmAreaInBaseUnit = convertArea(f.totalArea, f.areaUnit || land.areaUnit, land.areaUnit);
                return sum + Number(farmAreaInBaseUnit || 0);
            }, 0);

            const availableAreaInBaseUnit = Number(land.totalArea) - totalLeasedInBaseUnit;
            const requestedAreaInBaseUnit = convertArea(area, areaUnit || land.areaUnit, land.areaUnit);

            if (Number(requestedAreaInBaseUnit) > availableAreaInBaseUnit) {
                return res.status(400).json({
                    message: `Requested area (${area} ${areaUnit || land.areaUnit}) exceeds available land area (${convertArea(availableAreaInBaseUnit, land.areaUnit, areaUnit || land.areaUnit).toFixed(2)} ${areaUnit || land.areaUnit})`
                });
            }

            // 3. Calculate lease amount
            // Rental Fee is typically defined per base unit (e.g., per Kanal)
            const leaseAmount = Number(requestedAreaInBaseUnit) * Number(land.rentalFeeMonthly || 0);

            // 4. Create Farm
            const farm = await prisma.farm.create({
                data: {
                    investorId,
                    landId,
                    farmName,
                    description,
                    totalArea: Number(area),
                    areaUnit: areaUnit || land.areaUnit,
                    isLeasePaid: false, // REQUIRES PAYMENT
                    leaseAmount,
                    isApproved: false, // Approved after payment
                    isActive: false    // Active after payment
                }
            });

            res.status(201).json({
                message: 'Land lease initialized. Please complete the payment to activate your farm.',
                farmId: farm.id,
                leaseAmount
            });

        } catch (error) {
            console.error('Error leasing land:', error);
            res.status(500).json({ message: 'Error leasing land' });
        }
    }
};

module.exports = marketplaceController;
