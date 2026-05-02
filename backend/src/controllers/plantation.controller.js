const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { convertArea } = require('../utils/unitUtils');

// Create a plantation request for a new farm (Direct Planting Flow)
exports.createDirectPlantationRequest = async (req, res, next) => {
    try {
        const { items, landId, farmName, description, area, areaUnit } = req.body;
        const investorId = req.user.id;

        if (!items || !items.length) {
            return res.status(400).json({
                status: 'error',
                message: 'Items are required'
            });
        }

        if (!landId || !farmName) {
            return res.status(400).json({
                status: 'error',
                message: 'Land and Farm Name are required for direct planting.'
            });
        }

        // Use a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch land and its active farms to verify area
            const land = await tx.land.findUnique({
                where: { id: landId },
                include: { farms: { where: { isActive: true } } }
            });

            if (!land || !land.isVerified || !land.isActive) {
                throw new Error('Land not found or not available for leasing');
            }

            // 2. Fetch all requested trees to get their spacing requirements
            let treeTotalAreaInSqFt = 0;
            let treeTotalPrice = 0;
            const requestItems = [];

            for (const item of items) {
                const tree = await tx.tree.findUnique({ where: { id: item.treeId } });

                if (!tree || !tree.isActive) {
                    throw new Error(`Tree with id ${item.treeId} not found or not active`);
                }

                // Calculate required area for these trees (convert to SQ FT for consistent summation)
                const treeAreaInSqFt = convertArea(tree.spaceRequired, tree.spaceUnit || 'SQ FT', 'SQ FT');
                treeTotalAreaInSqFt += Number(treeAreaInSqFt) * item.quantity;

                const itemTotalPrice = tree.price * item.quantity;
                treeTotalPrice += itemTotalPrice;

                requestItems.push({
                    treeId: item.treeId,
                    quantity: item.quantity,
                    pricePerTree: tree.price,
                    totalPrice: itemTotalPrice
                });
            }

            // 3. Determine the final area to lease
            // If user provided an area, we use it (but check if it's enough for the trees)
            // If user didn't provide area, we use the tree total area
            let finalAreaValue;
            let finalAreaUnit;

            if (area) {
                const requestedAreaInSqFt = convertArea(area, areaUnit || land.areaUnit, 'SQ FT');
                if (Number(requestedAreaInSqFt) < treeTotalAreaInSqFt) {
                    throw new Error(`Requested area (${area} ${areaUnit || land.areaUnit}) is too small for the trees. Minimum required: ${convertArea(treeTotalAreaInSqFt, 'SQ FT', areaUnit || land.areaUnit).toFixed(2)} ${areaUnit || land.areaUnit}`);
                }
                finalAreaValue = Number(area);
                finalAreaUnit = areaUnit || land.areaUnit;
            } else {
                // Default to tree spacing requirement
                finalAreaValue = treeTotalAreaInSqFt;
                finalAreaUnit = 'SQ FT';
            }

            // 4. Calculate available area in land
            const totalLeasedInBaseUnit = land.farms.reduce((sum, f) => {
                const farmAreaInBaseUnit = convertArea(f.totalArea, f.areaUnit || land.areaUnit, land.areaUnit);
                return sum + Number(farmAreaInBaseUnit || 0);
            }, 0);

            const availableAreaInBaseUnit = Number(land.totalArea) - totalLeasedInBaseUnit;
            const requestedAreaInBaseUnit = convertArea(finalAreaValue, finalAreaUnit, land.areaUnit);

            if (Number(requestedAreaInBaseUnit) > availableAreaInBaseUnit) {
                const availableInRequestedUnit = convertArea(availableAreaInBaseUnit, land.areaUnit, finalAreaUnit);
                throw new Error(`Requested area exceeds available area (${availableInRequestedUnit.toFixed(2)} ${finalAreaUnit} available)`);
            }

            // 5. Calculate lease amount
            const leaseAmount = Number(requestedAreaInBaseUnit) * Number(land.rentalFeeMonthly || 0);

            // 6. Create Farm
            const farm = await tx.farm.create({
                data: {
                    investorId,
                    landId,
                    farmName,
                    description,
                    totalArea: finalAreaValue,
                    areaUnit: finalAreaUnit,
                    isLeasePaid: false,
                    leaseAmount,
                    isApproved: false,
                    isActive: false,
                    isDirectPlanting: true
                }
            });

            // 7. Create Plantation Request
            const plantationRequest = await tx.plantationRequest.create({
                data: {
                    investorId,
                    farmId: farm.id,
                    totalPrice: treeTotalPrice,
                    description: farmName || null,
                    items: {
                        create: requestItems
                    }
                }
            });

            return { farm, plantationRequest };
        });

        res.status(201).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        if (error.message.includes('not found') || error.message.includes('exceeds') || error.message.includes('too small')) {
            return res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
        next(error);
    }
};

// Create a plantation request
exports.createPlantationRequest = async (req, res, next) => {
    try {
        const { items, farmId, investmentName } = req.body; // Array of { treeId, quantity }, optional farmId and custom name

        if (!items || !items.length) {
            return res.status(400).json({
                status: 'error',
                message: 'Items are required'
            });
        }

        if (!farmId) {
            return res.status(400).json({
                status: 'error',
                message: 'Please select a managed farm/land to plant the trees on.'
            });
        }

        const investorId = req.user.id;

        // Use a transaction since we need to fetch prices, calculate total, and create request + items
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch farm to check total area
            const farm = await tx.farm.findUnique({
                where: { id: farmId },
                include: {
                    plantationRequests: {
                        where: { status: { in: ['pending', 'approved', 'planted'] } },
                        include: { items: { include: { tree: true } } }
                    }
                }
            });

            if (!farm) {
                throw new Error('Farm not found');
            }

            // 2. Calculate currently used space in the farm
            let usedSpaceInSqFt = 0;
            for (const request of farm.plantationRequests) {
                for (const item of request.items) {
                    const treeAreaInSqFt = convertArea(item.tree.spaceRequired, item.tree.spaceUnit || 'SQ FT', 'SQ FT');
                    usedSpaceInSqFt += Number(treeAreaInSqFt) * item.quantity;
                }
            }

            const farmTotalAreaInSqFt = convertArea(farm.totalArea, farm.areaUnit || 'SQ FT', 'SQ FT');

            // 3. Calculate new requested space
            let newSpaceRequiredInSqFt = 0;
            let totalPrice = 0;
            const requestItems = [];

            for (const item of items) {
                const tree = await tx.tree.findUnique({ where: { id: item.treeId } });

                if (!tree || !tree.isActive) {
                    throw new Error(`Tree with id ${item.treeId} not found or not active`);
                }

                const treeAreaInSqFt = convertArea(tree.spaceRequired, tree.spaceUnit || 'SQ FT', 'SQ FT');
                newSpaceRequiredInSqFt += Number(treeAreaInSqFt) * item.quantity;

                const itemTotalPrice = tree.price * item.quantity;
                totalPrice += itemTotalPrice;

                requestItems.push({
                    treeId: item.treeId,
                    quantity: item.quantity,
                    pricePerTree: tree.price,
                    totalPrice: itemTotalPrice
                });
            }

            // 4. Verify space
            if (usedSpaceInSqFt + newSpaceRequiredInSqFt > farmTotalAreaInSqFt) {
                // If farm is linked to a land, check if we can expand the farm's leased area
                if (farm.landId) {
                    const farmWithLand = await tx.farm.findUnique({
                        where: { id: farmId },
                        include: { 
                            land: { 
                                include: { farms: { where: { isActive: true } } } 
                            } 
                        }
                    });

                    if (farmWithLand && farmWithLand.land) {
                        const additionalNeededSqFt = (usedSpaceInSqFt + newSpaceRequiredInSqFt) - farmTotalAreaInSqFt;
                        const additionalInLandUnit = convertArea(additionalNeededSqFt, 'SQ FT', farmWithLand.land.areaUnit);

                        // Calculate total leased area in this land (excluding THIS farm's current area to avoid double counting)
                        const totalLeasedByOthersInBaseUnit = farmWithLand.land.farms
                            .filter(f => f.id !== farm.id)
                            .reduce((sum, f) => {
                                const farmAreaInBaseUnit = convertArea(f.totalArea, f.areaUnit || farmWithLand.land.areaUnit, farmWithLand.land.areaUnit);
                                return sum + Number(farmAreaInBaseUnit || 0);
                            }, 0);

                        const currentFarmAreaInBaseUnit = convertArea(farm.totalArea, farm.areaUnit || farmWithLand.land.areaUnit, farmWithLand.land.areaUnit);
                        const availableAreaInLandInBaseUnit = Number(farmWithLand.land.totalArea) - (totalLeasedByOthersInBaseUnit + currentFarmAreaInBaseUnit);

                        if (Number(additionalInLandUnit) <= availableAreaInLandInBaseUnit) {
                            // Expand the farm
                            const newTotalArea = Number(farm.totalArea) + convertArea(additionalNeededSqFt, 'SQ FT', farm.areaUnit || 'SQ FT');
                            const newLeaseAmount = Number(convertArea(newTotalArea, farm.areaUnit || 'SQ FT', farmWithLand.land.areaUnit)) * Number(farmWithLand.land.rentalFeeMonthly || 0);

                            await tx.farm.update({
                                where: { id: farm.id },
                                data: {
                                    totalArea: newTotalArea,
                                    leaseAmount: newLeaseAmount
                                }
                            });
                            // Space is now sufficient, proceed
                        } else {
                            const availableInSqFt = convertArea(availableAreaInLandInBaseUnit, farmWithLand.land.areaUnit, 'SQ FT');
                            throw new Error(`Insufficient space in farm and land. Remaining in land: ${availableInSqFt.toFixed(2)} SQ FT. Requested additional: ${additionalNeededSqFt.toFixed(2)} SQ FT.`);
                        }
                    } else {
                        throw new Error(`Insufficient space in farm. Remaining: ${(farmTotalAreaInSqFt - usedSpaceInSqFt).toFixed(2)} SQ FT. Requested: ${newSpaceRequiredInSqFt.toFixed(2)} SQ FT.`);
                    }
                } else {
                    const remainingSpace = farmTotalAreaInSqFt - usedSpaceInSqFt;
                    const remainingInSqFt = remainingSpace > 0 ? remainingSpace : 0;
                    throw new Error(`Insufficient space in farm. Remaining: ${remainingInSqFt.toFixed(2)} SQ FT. Requested: ${newSpaceRequiredInSqFt.toFixed(2)} SQ FT.`);
                }
            }

            const plantationRequest = await tx.plantationRequest.create({
                data: {
                    investorId,
                    farmId,
                    totalPrice,
                    description: investmentName || null,
                    items: {
                        create: requestItems
                    }
                },
                include: {
                    items: {
                        include: {
                            tree: true
                        }
                    },
                    farm: {
                        include: {
                            land: true
                        }
                    }
                }
            });

            return plantationRequest;
        });

        res.status(201).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
        next(error);
    }
};

// Get my plantation requests
exports.getMyPlantationRequests = async (req, res, next) => {
    try {
        const investorId = req.user.id;

        const requests = await prisma.plantationRequest.findMany({
            where: { 
                investorId,
                status: {
                    in: ['pending', 'approved', 'planted']
                },
                farmId: {
                    not: null  // Filter out orphaned requests with no linked farm
                }
            },
            include: {
                items: {
                    include: {
                        tree: true
                    }
                },
                farm: {
                    include: {
                        land: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            status: 'success',
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Get all plantation requests
exports.getAllPlantationRequests = async (req, res, next) => {
    try {
        const requests = await prisma.plantationRequest.findMany({
            include: {
                investor: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                items: {
                    include: {
                        tree: true
                    }
                },
                farm: {
                    include: {
                        land: true,
                        payments: {
                            where: { status: 'pending_verification' },
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            status: 'success',
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

// User: Delete a pending plantation request
exports.deletePlantationRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const investorId = req.user.id;

        const request = await prisma.plantationRequest.findUnique({
            where: { id },
            include: { farm: { include: { plantationRequests: true } } }
        });

        if (!request) {
            return res.status(404).json({ status: 'error', message: 'Request not found' });
        }

        if (request.investorId !== investorId) {
            return res.status(403).json({ status: 'error', message: 'Not authorized' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ status: 'error', message: 'Only pending requests can be deleted' });
        }

        await prisma.$transaction(async (tx) => {
            // Delete the request - items will cascade delete automatically (onDelete: Cascade in schema)
            await tx.plantationRequest.delete({
                where: { id }
            });

            // If the farm was created strictly for this request, isn't leased yet, and has no other pending requests, delete it
            if (request.farm && !request.farm.isLeasePaid && request.farm.isDirectPlanting) {
                const remainingRequests = request.farm.plantationRequests.filter(r => r.id !== id);
                if (remainingRequests.length === 0) {
                    // First delete any pending payments associated with this farm
                    await tx.payment.deleteMany({
                        where: { farmId: request.farmId }
                    });

                    await tx.farm.delete({
                        where: { id: request.farmId }
                    });
                }
            }
        });

        res.status(200).json({
            status: 'success',
            message: 'Plantation request deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Update plantation request status
exports.updatePlantationRequestStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { createPlantsFromRequest } = require('../utils/plantCreation');

        const result = await prisma.$transaction(async (tx) => {
            const updatedRequest = await tx.plantationRequest.update({
                where: { id },
                data: { status },
                include: { 
                    items: { include: { tree: true } },
                    investor: true,
                    farm: true
                }
            });

            // If status is 'approved' or 'planted'
            if (status === 'approved' || status === 'planted') {
                // 1. Create individual Plant records
                await createPlantsFromRequest(tx, updatedRequest, status);

                // 2. Update associated payment if it exists
                if (updatedRequest.farmId) {
                    await tx.payment.updateMany({
                        where: { 
                            farmId: updatedRequest.farmId,
                            status: 'pending_verification'
                        },
                        data: { 
                            status: 'completed',
                            paidAt: new Date()
                        }
                    });
                }

                // 3. Send notification to investor
                await tx.notification.create({
                    data: {
                        userId: updatedRequest.investorId,
                        type: 'payment_success',
                        title: 'Payment Verified! ✅',
                        message: `Your payment for "${updatedRequest.description || 'Plantation Request'}" has been verified. Your trees are now being managed.`,
                        link: '/investor/dashboard',
                        metadata: JSON.stringify({ 
                            requestId: updatedRequest.id,
                            farmId: updatedRequest.farmId 
                        })
                    }
                });
            }

            return updatedRequest;
        });

        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                status: 'error',
                message: 'Request not found'
            });
        }
        next(error);
    }
};
