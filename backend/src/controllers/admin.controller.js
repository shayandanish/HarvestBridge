const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { sendLandApprovalEmail, sendLandRejectionEmail, sendFarmApprovalEmail, sendFarmRejectionEmail } = require('../utils/emailService');
const { deleteFromStorage } = require('../config/storage');

/**
 * Get pending lands
 * @route GET /api/v1/admin/lands/pending
 */
const getPendingLands = async (req, res, next) => {
    try {
        const lands = await prisma.land.findMany({
            where: {
                isVerified: false,
                isActive: true,
            },
            include: {
                landowner: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return successResponse(res, 200, 'Pending lands retrieved successfully', lands);
    } catch (error) {
        next(error);
    }
};

/**
 * Approve land
 * @route PUT /api/v1/admin/lands/:id/approve
 */
const approveLand = async (req, res, next) => {
    try {
        const { id } = req.params;

        const land = await prisma.land.findUnique({
            where: { id },
            include: {
                landowner: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!land) {
            return errorResponse(res, 404, 'Land not found');
        }

        if (land.isVerified) {
            return errorResponse(res, 400, 'Land is already verified');
        }

        // Update land
        const updatedLand = await prisma.land.update({
            where: { id },
            data: {
                isVerified: true,
                rejectionReason: null,
            },
        });

        // Send approval email
        try {
            await sendLandApprovalEmail(
                land.landowner.user.email,
                land.landowner.user.fullName,
                land.landName
            );
        } catch (emailError) {
            console.error('Failed to send approval email:', emailError);
        }

        return successResponse(res, 200, 'Land approved successfully', updatedLand);
    } catch (error) {
        next(error);
    }
};

/**
 * Reject land
 * @route PUT /api/v1/admin/lands/:id/reject
 */
const rejectLand = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        if (!rejectionReason) {
            return errorResponse(res, 400, 'Rejection reason is required');
        }

        const land = await prisma.land.findUnique({
            where: { id },
            include: {
                landowner: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!land) {
            return errorResponse(res, 404, 'Land not found');
        }

        // Update land
        const updatedLand = await prisma.land.update({
            where: { id },
            data: {
                isVerified: false,
                rejectionReason,
            },
        });

        // Send rejection email
        try {
            await sendLandRejectionEmail(
                land.landowner.user.email,
                land.landowner.user.fullName,
                land.landName,
                rejectionReason
            );
        } catch (emailError) {
            console.error('Failed to send rejection email:', emailError);
        }

        return successResponse(res, 200, 'Land rejected successfully', updatedLand);
    } catch (error) {
        next(error);
    }
};

/**
 * Get pending farms
 * @route GET /api/v1/admin/farms/pending
 */
const getPendingFarms = async (req, res, next) => {
    try {
        const farms = await prisma.farm.findMany({
            where: {
                isApproved: false,
                isActive: true,
            },
            include: {
                farmer: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                phone: true,
                            },
                        },
                    },
                },
                land: {
                    include: {
                        landowner: {
                            include: {
                                user: {
                                    select: {
                                        fullName: true,
                                    },
                                },
                            },
                        },
                    },
                },
                photos: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        return successResponse(res, 200, 'Pending farms retrieved successfully', farms);
    } catch (error) {
        next(error);
    }
};

/**
 * Approve farm
 * @route PUT /api/v1/admin/farms/:id/approve
 */
const approveFarm = async (req, res, next) => {
    try {
        const { id } = req.params;

        const farm = await prisma.farm.findUnique({
            where: { id },
            include: {
                farmer: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found');
        }

        if (farm.isApproved) {
            return errorResponse(res, 400, 'Farm is already approved');
        }

        // Update farm
        const updatedFarm = await prisma.farm.update({
            where: { id },
            data: {
                isApproved: true,
                approvalDate: new Date(),
                rejectionReason: null,
            },
        });

        // Send approval email
        try {
            await sendFarmApprovalEmail(
                farm.farmer.user.email,
                farm.farmer.user.fullName,
                farm.farmName
            );
        } catch (emailError) {
            console.error('Failed to send approval email:', emailError);
        }

        return successResponse(res, 200, 'Farm approved successfully', updatedFarm);
    } catch (error) {
        next(error);
    }
};

/**
 * Reject farm
 * @route PUT /api/v1/admin/farms/:id/reject
 */
const rejectFarm = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        if (!rejectionReason) {
            return errorResponse(res, 400, 'Rejection reason is required');
        }

        const farm = await prisma.farm.findUnique({
            where: { id },
            include: {
                farmer: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found');
        }

        // Update farm
        const updatedFarm = await prisma.farm.update({
            where: { id },
            data: {
                isApproved: false,
                rejectionReason,
            },
        });

        // Send rejection email
        try {
            await sendFarmRejectionEmail(
                farm.farmer.user.email,
                farm.farmer.user.fullName,
                farm.farmName,
                rejectionReason
            );
        } catch (emailError) {
            console.error('Failed to send rejection email:', emailError);
        }

        return successResponse(res, 200, 'Farm rejected successfully', updatedFarm);
    } catch (error) {
        next(error);
    }
};

/**
 * Get pending farmer profiles
 * @route GET /api/v1/admin/farmers/profiles/pending
 */
const getPendingFarmerProfiles = async (req, res, next) => {
    try {
        const farmers = await prisma.farmer.findMany({
            where: {
                isVerified: false,
                isProfilePublic: true, // Only show if they want it public
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        profilePhotoUrl: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return successResponse(res, 200, 'Pending farmer profiles retrieved successfully', farmers);
    } catch (error) {
        next(error);
    }
};

/**
 * Approve farmer profile
 * @route PUT /api/v1/admin/farmers/profiles/:id/approve
 */
const approveFarmerProfile = async (req, res, next) => {
    try {
        const { id } = req.params;

        const farmer = await prisma.farmer.findUnique({
            where: { id },
            include: { user: true },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        if (farmer.isVerified) {
            return errorResponse(res, 400, 'Farmer profile is already verified');
        }

        const updatedFarmer = await prisma.farmer.update({
            where: { id },
            data: {
                isVerified: true,
                rejectionReason: null,
            },
        });

        // Create notification
        await prisma.notification.create({
            data: {
                userId: farmer.userId,
                title: 'Profile Verified!',
                message: 'Your farmer profile has been verified by the admin. It is now visible to investors.',
                type: 'system',
            },
        });

        return successResponse(res, 200, 'Farmer profile approved successfully', updatedFarmer);
    } catch (error) {
        next(error);
    }
};

/**
 * Reject farmer profile
 * @route PUT /api/v1/admin/farmers/profiles/:id/reject
 */
const rejectFarmerProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        if (!rejectionReason) {
            return errorResponse(res, 400, 'Rejection reason is required');
        }

        const farmer = await prisma.farmer.findUnique({
            where: { id },
            include: { user: true },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        const updatedFarmer = await prisma.farmer.update({
            where: { id },
            data: {
                isVerified: false,
                rejectionReason,
            },
        });

        // Create notification
        await prisma.notification.create({
            data: {
                userId: farmer.userId,
                title: 'Profile Verification Rejected',
                message: `Your farmer profile verification was rejected. Reason: ${rejectionReason}`,
                type: 'system',
            },
        });

        return successResponse(res, 200, 'Farmer profile rejected successfully', updatedFarmer);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a farmer profile
 * @route DELETE /api/v1/admin/farmers/profiles/:id
 */
const deleteFarmerProfile = async (req, res, next) => {
    try {
        const { id } = req.params;

        const farmer = await prisma.farmer.findUnique({
            where: { id },
            include: { user: true },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        // Hard delete the farmer profile
        await prisma.farmer.delete({
            where: { id },
        });

        // Log the deletion
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'farmer_profile_deleted',
                entityType: 'farmer',
                entityId: id,
                details: `Deleted farmer profile for user ${farmer.user.fullName} (${farmer.userId})`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
            },
        });

        return successResponse(res, 200, 'Farmer profile deleted successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get comprehensive dashboard stats
 * @route GET /api/v1/admin/dashboard/stats
 */
const getDashboardStats = async (req, res, next) => {
    try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

        // 1. User Stats
        const usersByRole = await prisma.user.groupBy({
            by: ['role'],
            _count: true
        });

        const newUsersThisMonth = await prisma.user.count({
            where: { createdAt: { gte: firstDayOfMonth } }
        });

        // 2. Investment Stats
        const totalInvestments = await prisma.investment.aggregate({
            _sum: { totalAmount: true },
            _count: true
        });

        const activeInvestments = await prisma.investment.count({
            where: { status: 'active' }
        });

        // 3. Revenue Stats
        const totalRevenue = await prisma.payment.aggregate({
            where: {
                type: 'platform_commission',
                status: 'completed'
            },
            _sum: { amount: true }
        });

        const totalVolume = await prisma.payment.aggregate({
            where: {
                status: 'completed',
                type: { in: ['investment', 'land_lease', 'farm_lease', 'plant_investment', 'platform_commission'] }
            },
            _sum: { amount: true }
        });

        const revenueThisMonth = await prisma.payment.aggregate({
            where: {
                type: 'platform_commission',
                status: 'completed',
                paidAt: { gte: firstDayOfMonth }
            },
            _sum: { amount: true }
        });

        // 4. Farm & Land Stats
        const farmsByStatus = {
            approved: await prisma.farm.count({ where: { isApproved: true } }),
            pending: await prisma.farm.count({ where: { isApproved: false, isActive: true } }),
            rejected: await prisma.farm.count({ where: { rejectionReason: { not: null }, isApproved: false } })
        };

        const pendingLands = await prisma.land.count({
            where: { isVerified: false, isActive: true }
        });

        const pendingFarms = farmsByStatus.pending;

        const pendingKYC = await prisma.userProfile.count({
            where: { kycVerified: false, kycDocumentUrl: { not: null } }
        });

        const pendingFarmerProfiles = await prisma.farmer.count({
            where: { isVerified: false, isProfilePublic: true }
        });

        // 5. Plant & Harvest Stats
        const plantsByStatus = await prisma.plant.groupBy({
            by: ['status'],
            _count: true
        });

        const harvestsCompleted = await prisma.harvest.count();

        const upcomingHarvests = await prisma.harvest.count({
            where: {
                collectionStatus: 'ready',
                collectionDeadline: {
                    lte: new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)),
                    gte: now
                }
            }
        });

        // 6. Recent Activity
        const recentActivities = await prisma.activityLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { fullName: true, role: true } } }
        });

        const stats = {
            users: {
                byRole: usersByRole,
                newThisMonth: newUsersThisMonth,
                total: await prisma.user.count()
            },
            investments: {
                totalValue: totalInvestments._sum.totalAmount || 0,
                totalCount: totalInvestments._count,
                activeCount: activeInvestments
            },
            revenue: {
                total: totalRevenue._sum.amount || 0,
                thisMonth: revenueThisMonth._sum.amount || 0,
                totalVolume: totalVolume._sum.amount || 0
            },
            farms: farmsByStatus,
            plants: plantsByStatus,
            harvests: {
                completed: harvestsCompleted,
                upcoming30Days: upcomingHarvests
            },
            approvals: {
                pendingLands,
                pendingFarms,
                pendingKYC,
                pendingFarmerProfiles
            },
            recentActivities
        };

        return successResponse(res, 200, 'Dashboard stats retrieved successfully', stats);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all users with filters and pagination
 * @route GET /api/v1/admin/users
 */
const getAllUsers = async (req, res, next) => {
    try {
        const {
            role,
            isVerified,
            isActive,
            search,
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {
            // Exclude soft-deleted (anonymized) users from the default listing
            NOT: {
                email: { endsWith: '@anonymized.com' }
            },
            ...(role && { role }),
            ...(isVerified && { isVerified: isVerified === 'true' }),
            ...(isActive && { isActive: isActive === 'true' }),
            ...(search && {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                ]
            })
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take,
                include: { profile: true },
                orderBy: { [sortBy]: sortOrder }
            }),
            prisma.user.count({ where })
        ]);

        return successResponse(res, 200, 'Users retrieved successfully', {
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get detailed user profile by ID
 * @route GET /api/v1/admin/users/:id
 */
const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                profile: true,
                landowner: { include: { lands: true } },
                farmer: { include: { farms: true } },
                investments: {
                    include: { plant: { include: { farm: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                activityLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });

        if (!user) {
            return errorResponse(res, 404, 'User not found');
        }

        return successResponse(res, 200, 'User profile retrieved successfully', user);
    } catch (error) {
        next(error);
    }
};

/**
 * Manually verify user
 * @route PUT /api/v1/admin/users/:id/verify
 */
const verifyUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.update({
            where: { id },
            data: { isVerified: true }
        });

        return successResponse(res, 200, 'User verified successfully', user);
    } catch (error) {
        next(error);
    }
};

/**
 * Approve KYC documents
 * @route PUT /api/v1/admin/users/:id/kyc-approve
 */
const approveKYC = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.userProfile.update({
            where: { userId: id },
            data: { kycVerified: true }
        });

        // Create notification for user
        await prisma.notification.create({
            data: {
                userId: id,
                title: 'KYC Approved!',
                message: 'Your identity verification has been successfullly approved by our admin team.',
                type: 'system'
            }
        });

        return successResponse(res, 200, 'KYC approved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Reject KYC documents
 * @route PUT /api/v1/admin/users/:id/kyc-reject
 */
const rejectKYC = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        if (!rejectionReason) {
            return errorResponse(res, 400, 'Rejection reason is required');
        }

        await prisma.userProfile.update({
            where: { userId: id },
            data: { kycVerified: false }
        });

        // Create notification for user
        await prisma.notification.create({
            data: {
                userId: id,
                title: 'KYC Rejected',
                message: `Your identity verification was rejected. Reason: ${rejectionReason}`,
                type: 'system'
            }
        });

        return successResponse(res, 200, 'KYC rejected successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Suspend user
 * @route PUT /api/v1/admin/users/:id/suspend
 */
const suspendUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { suspensionReason } = req.body;

        await prisma.user.update({
            where: { id },
            data: { isActive: false }
        });

        // Log the action
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'user_suspended',
                entityType: 'user',
                entityId: id,
                details: { reason: suspensionReason },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });

        return successResponse(res, 200, 'User suspended successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Activate user
 * @route PUT /api/v1/admin/users/:id/activate
 */
const activateUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.user.update({
            where: { id },
            data: { isActive: true }
        });

        return successResponse(res, 200, 'User activated successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Soft delete/Anonymize user
 * @route DELETE /api/v1/admin/users/:id
 */
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return errorResponse(res, 404, 'User not found');

        // Anonymize and deactivate
        await prisma.user.update({
            where: { id },
            data: {
                isActive: false,
                fullName: 'Deleted User',
                email: `deleted_${id}@anonymized.com`,
                phone: null,
                passwordHash: 'ANONYMIZED'
            }
        });

        return successResponse(res, 200, 'User anonymized and deactivated successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get all investments with filters and pagination
 * @route GET /api/v1/admin/investments
 */
const getAllInvestments = async (req, res, next) => {
    try {
        const {
            status,
            investorName,
            farmName,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            page = 1,
            limit = 50
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {
            ...(status && { status }),
            ...(startDate && endDate && {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            }),
            ...(minAmount || maxAmount) && {
                totalAmount: {
                    ...(minAmount && { gte: parseFloat(minAmount) }),
                    ...(maxAmount && { lte: parseFloat(maxAmount) })
                }
            },
            ...(investorName && {
                investor: { fullName: { contains: investorName, mode: 'insensitive' } }
            }),
            ...(farmName && {
                plant: { farm: { farmName: { contains: farmName, mode: 'insensitive' } } }
            })
        };

        // 1. Fetch plant-level investments
        const [plantInvestments, plantTotal] = await Promise.all([
            prisma.investment.findMany({
                where,
                skip,
                take,
                include: {
                    investor: { select: { fullName: true, email: true } },
                    plant: { include: { farm: true, cropType: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.investment.count({ where })
        ]);

        // 2. Fetch land-lease investments (Farm records with an investorId)
        const farmWhere = {
            investorId: { not: null },
            ...(investorName && {
                investor: { fullName: { contains: investorName, mode: 'insensitive' } }
            }),
            ...(farmName && {
                farmName: { contains: farmName, mode: 'insensitive' }
            }),
            ...(startDate && endDate && {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            }),
        };

        // Map status filter for farm records
        if (status) {
            if (status === 'active') {
                farmWhere.isApproved = true;
                farmWhere.isActive = true;
            } else if (status === 'pending') {
                farmWhere.isApproved = false;
                farmWhere.isActive = true;
                farmWhere.rejectionReason = null;
            } else if (status === 'cancelled') {
                farmWhere.isActive = false;
            }
        }

        const investorFarms = await prisma.farm.findMany({
            where: farmWhere,
            include: {
                investor: { select: { fullName: true, email: true } },
                land: true,
                farmer: { include: { user: { select: { fullName: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // 3. Normalize farm records to match investment shape
        const normalizedFarmInvestments = investorFarms.map(farm => ({
            id: farm.id,
            type: 'land_lease',
            investor: farm.investor,
            farmName: farm.farmName,
            landName: farm.land?.landName || null,
            farmerName: farm.farmer?.user?.fullName || null,
            totalAmount: farm.leaseAmount ? parseFloat(farm.leaseAmount) : 0,
            status: farm.isApproved && farm.isActive ? 'active'
                  : !farm.isActive ? 'cancelled'
                  : farm.rejectionReason ? 'rejected'
                  : 'pending',
            createdAt: farm.createdAt,
            isLeasePaid: farm.isLeasePaid,
            plant: null,
        }));

        // 4. Tag plant investments
        const taggedPlantInvestments = plantInvestments.map(inv => ({
            ...inv,
            type: 'plant',
            totalAmount: parseFloat(inv.totalAmount),
        }));

        // 5. Merge and sort by date descending
        const combined = [...taggedPlantInvestments, ...normalizedFarmInvestments]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const total = plantTotal + normalizedFarmInvestments.length;

        return successResponse(res, 200, 'Investments retrieved successfully', {
            investments: combined,
            pagination: { total, page: parseInt(page), limit: parseInt(limit) }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get detailed investment by ID
 * @route GET /api/v1/admin/investments/:id
 */
const getInvestmentById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const investment = await prisma.investment.findUnique({
            where: { id },
            include: {
                investor: { select: { fullName: true, email: true, phone: true } },
                plant: {
                    include: {
                        farm: { include: { farmer: { include: { user: true } } } },
                        cropType: true
                    }
                },
                payments: { orderBy: { createdAt: 'desc' } },
                bookings: { orderBy: { visitDate: 'desc' } },
                harvests: true,
                disputes: true
            }
        });

        if (!investment) return errorResponse(res, 404, 'Investment not found');

        return successResponse(res, 200, 'Investment details retrieved successfully', investment);
    } catch (error) {
        next(error);
    }
};

/**
 * Cancel investment
 * @route PUT /api/v1/admin/investments/:id/cancel
 */
const cancelInvestment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { cancellationReason } = req.body;

        const existingInvestment = await prisma.investment.findUnique({ where: { id } });
        if (!existingInvestment) {
            const farm = await prisma.farm.findUnique({ where: { id, investorId: { not: null } } });
            if (farm) {
                await prisma.farm.update({ where: { id }, data: { isActive: false } });
                await prisma.notification.create({
                    data: {
                        userId: farm.investorId,
                        title: 'Land Lease Cancelled',
                        message: `Your land lease for ${farm.farmName} has been cancelled by admin. Reason: ${cancellationReason}`,
                        type: 'system'
                    }
                });
                return successResponse(res, 200, 'Land lease cancelled successfully');
            }
            return errorResponse(res, 404, 'Investment not found');
        }

        const investment = await prisma.investment.update({
            where: { id },
            data: { status: 'cancelled' },
            include: { investor: true, plant: { include: { farm: { include: { farmer: { include: { user: true } } } } } } }
        });

        // Trigger refund process (simplified)
        // In a real app, this would call Stripe/PSP refund API

        // Notify parties
        await prisma.notification.createMany({
            data: [
                {
                    userId: investment.investorId,
                    title: 'Investment Cancelled',
                    message: `Your investment for ${investment.plant.uniqueIdentifier} has been cancelled by admin. Reason: ${cancellationReason}`,
                    type: 'system'
                },
                {
                    userId: investment.plant.farm.farmer.userId,
                    title: 'Investment Cancelled',
                    message: `An investment for your plant ${investment.plant.uniqueIdentifier} has been cancelled by admin.`,
                    type: 'system'
                }
            ]
        });

        return successResponse(res, 200, 'Investment cancelled successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Delete investment
 * @route DELETE /api/v1/admin/investments/:id
 */
const deleteInvestment = async (req, res, next) => {
    try {
        const { id } = req.params;

        const investment = await prisma.investment.findUnique({
            where: { id },
        });

        if (!investment) {
            const farm = await prisma.farm.findUnique({ where: { id, investorId: { not: null } } });
            if (farm) {
                await prisma.farm.delete({ where: { id } });
                await prisma.activityLog.create({
                    data: {
                        userId: req.user.id,
                        action: 'investment_deleted',
                        entityType: 'investment',
                        entityId: id,
                        details: `Deleted land lease investment ${id}`,
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent'),
                    },
                });
                return successResponse(res, 200, 'Land lease deleted successfully');
            }
            return errorResponse(res, 404, 'Investment not found');
        }

        await prisma.investment.delete({
            where: { id },
        });

        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'investment_deleted',
                entityType: 'investment',
                entityId: id,
                details: `Deleted investment ${id}`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
            },
        });

        return successResponse(res, 200, 'Investment deleted successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Update investment details
 * @route PUT /api/v1/admin/investments/:id
 */
const updateInvestment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const investment = await prisma.investment.findUnique({
            where: { id },
        });

        if (!investment) {
            const farm = await prisma.farm.findUnique({ where: { id, investorId: { not: null } } });
            if (farm) {
                let farmData = {};
                if (updateData.status === 'active') { farmData.isApproved = true; farmData.isActive = true; }
                else if (updateData.status === 'pending') { farmData.isApproved = false; farmData.isActive = true; }
                else if (updateData.status === 'cancelled') { farmData.isActive = false; }
                
                if (updateData.totalAmount !== undefined) { farmData.leaseAmount = updateData.totalAmount; }
                
                const updatedFarm = await prisma.farm.update({ where: { id }, data: farmData });
                
                await prisma.activityLog.create({
                    data: {
                        userId: req.user.id,
                        action: 'investment_updated',
                        entityType: 'investment',
                        entityId: id,
                        details: `Updated land lease investment ${id} details`,
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent'),
                    },
                });
                return successResponse(res, 200, 'Land lease updated successfully', updatedFarm);
            }
            return errorResponse(res, 404, 'Investment not found');
        }

        const updatedInvestment = await prisma.investment.update({
            where: { id },
            data: updateData,
        });

        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'investment_updated',
                entityType: 'investment',
                entityId: id,
                details: `Updated investment ${id} details`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
            },
        });

        return successResponse(res, 200, 'Investment updated successfully', updatedInvestment);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all payments with filters
 * @route GET /api/v1/admin/payments
 */
const getAllPayments = async (req, res, next) => {
    try {
        const { status, type, startDate, endDate, page = 1, limit = 50 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {
            ...(status && { status }),
            ...(type && { type }),
            ...(startDate && endDate && {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            })
        };

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                skip,
                take,
                include: {
                    investment: {
                        include: { investor: { select: { fullName: true } } }
                    },
                    farm: {
                        include: { investor: { select: { fullName: true } } }
                    },
                    recipientUser: {
                        select: { fullName: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.payment.count({ where })
        ]);

        return successResponse(res, 200, 'Payments retrieved successfully', {
            payments,
            pagination: { total, page: parseInt(page), limit: parseInt(limit) }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get failed payments
 * @route GET /api/v1/admin/payments/failed
 */
const getFailedPayments = async (req, res, next) => {
    try {
        const failedPayments = await prisma.payment.findMany({
            where: { status: 'failed' },
            include: {
                investment: {
                    include: { investor: { select: { fullName: true, email: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return successResponse(res, 200, 'Failed payments retrieved successfully', failedPayments);
    } catch (error) {
        next(error);
    }
};

/**
 * Retry failed payment (Manual)
 * @route POST /api/v1/admin/payments/:id/retry
 */
const retryPayment = async (req, res, next) => {
    try {
        const { id } = req.params;

        // This would typically re-trigger a Stripe Charge or send a reminder
        // For now, we'll mark as pending for system retry
        const payment = await prisma.payment.update({
            where: { id },
            data: { status: 'pending' }
        });

        return successResponse(res, 200, 'Payment retry initiated', payment);
    } catch (error) {
        next(error);
    }
};

/**
 * Process refund
 * @route POST /api/v1/admin/payments/:id/refund
 */
const refundPayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { refundAmount, refundReason } = req.body;

        const payment = await prisma.payment.update({
            where: { id },
            data: { status: 'refunded' },
            include: { investment: { include: { investor: true } } }
        });

        // Notify user
        await prisma.notification.create({
            data: {
                userId: payment.investment.investorId,
                title: 'Payment Refunded',
                message: `A refund of ${refundAmount} has been processed for your investment. Reason: ${refundReason}`,
                type: 'system'
            }
        });

        return successResponse(res, 200, 'Refund processed successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get revenue report
 * @route GET /api/v1/admin/revenue/report
 */
const getRevenueReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const where = {
            status: 'completed',
            ...(startDate && endDate && {
                paidAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            })
        };

        const revenueBySource = await prisma.payment.groupBy({
            by: ['type'],
            where,
            _sum: { amount: true },
            _count: true
        });

        const topFarms = await prisma.farm.findMany({
            take: 5,
            include: {
                plants: {
                    include: {
                        investments: {
                            include: {
                                payments: { where: { status: 'completed' } }
                            }
                        }
                    }
                }
            }
        });

        // Calculate revenue per farm (simplified mapping)
        const farmRevenue = topFarms.map(farm => {
            let total = 0;
            farm.plants.forEach(plant => {
                plant.investments.forEach(inv => {
                    inv.payments.forEach(p => {
                        if (p.type === 'platform_commission') total += Number(p.amount);
                    });
                });
            });
            return { farmName: farm.farmName, revenue: total };
        }).sort((a, b) => b.revenue - a.revenue);

        return successResponse(res, 200, 'Revenue report retrieved successfully', {
            revenueBySource,
            topFarms: farmRevenue
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get counts of items pending approval
 * @route GET /api/v1/admin/approvals/pending
 */
const getPendingApprovalsSummary = async (req, res, next) => {
    try {
        const [lands, farms, kyc, farmers] = await Promise.all([
            prisma.land.count({ where: { isVerified: false, isActive: true } }),
            prisma.farm.count({ where: { isApproved: false, isActive: true } }),
            prisma.userProfile.count({ where: { kycVerified: false, kycDocumentUrl: { not: null } } }),
            prisma.farmer.count({ where: { isVerified: false, isProfilePublic: true } })
        ]);

        return successResponse(res, 200, 'Pending approvals summary retrieved', {
            lands,
            farms,
            kyc,
            farmers,
            total: lands + farms + kyc + farmers
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get activity logs with filters and pagination
 * @route GET /api/v1/admin/activity-logs
 */
const getActivityLogs = async (req, res, next) => {
    try {
        const {
            userId,
            action,
            entityType,
            startDate,
            endDate,
            page = 1,
            limit = 100
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {
            ...(userId && { userId }),
            ...(action && { action }),
            ...(entityType && { entityType }),
            ...(startDate && endDate && {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            })
        };

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                skip,
                take,
                include: { user: { select: { fullName: true, role: true } } },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.activityLog.count({ where })
        ]);

        return successResponse(res, 200, 'Activity logs retrieved successfully', {
            logs,
            pagination: { total, page: parseInt(page), limit: parseInt(limit) }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get users with pending KYC documents
 * @route GET /api/v1/admin/users/kyc/pending
 */
const getPendingKYC = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            where: {
                profile: {
                    kycVerified: false,
                    kycDocumentUrl: { not: null }
                }
            },
            include: { profile: true },
            orderBy: { createdAt: 'desc' }
        });

        return successResponse(res, 200, 'Pending KYC users retrieved successfully', users);
    } catch (error) {
        next(error);
    }
};

/**
 * Update user details (Admin)
 * @route PUT /api/v1/admin/users/:id
 */
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { fullName, email, phone, role } = req.body;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return errorResponse(res, 404, 'User not found');

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                fullName: fullName || user.fullName,
                email: email || user.email,
                phone: phone || user.phone,
                role: role || user.role
            }
        });

        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'user_updated',
                entityType: 'user',
                entityId: id,
                details: { changes: req.body },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });

        return successResponse(res, 200, 'User updated successfully', updatedUser);
    } catch (error) {
        if (error.code === 'P2002') {
            return errorResponse(res, 400, 'Email already in use');
        }
        next(error);
    }
};

/**
 * Get all lands (for post management)
 * @route GET /api/v1/admin/lands
 */
const getAllLands = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = search ? {
            OR: [
                { landName: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
                { specificLocation: { contains: search, mode: 'insensitive' } },
            ]
        } : {};

        const [lands, total] = await Promise.all([
            prisma.land.findMany({
                where,
                include: {
                    landowner: {
                        include: {
                            user: {
                                select: { fullName: true, email: true }
                            }
                        }
                    },
                    farms: { select: { id: true } }
                },
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.land.count({ where })
        ]);

        return successResponse(res, 200, 'All lands retrieved', {
            lands,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all farms (for post management)
 * @route GET /api/v1/admin/farms
 */
const getAllFarms = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = search ? {
            OR: [
                { farmName: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ]
        } : {};

        const [farms, total] = await Promise.all([
            prisma.farm.findMany({
                where,
                include: {
                    farmer: {
                        include: {
                            user: {
                                select: { fullName: true, email: true }
                            }
                        }
                    },
                    land: { select: { landName: true } }
                },
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.farm.count({ where })
        ]);

        return successResponse(res, 200, 'All farms retrieved', {
            farms,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete land (Admin)
 * @route DELETE /api/v1/admin/lands/:id
 */
const deleteLand = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if land exists and include all farms (active or inactive) to check for constraints
        const land = await prisma.land.findUnique({
            where: { id },
            include: { farms: true }
        });

        if (!land) {
            return errorResponse(res, 404, 'Land not found');
        }

        // Prevent deletion if land has active farms
        if (land.farms.length > 0) {
            return errorResponse(
                res,
                400,
                'Cannot delete land with active farms. Please remove or deactivate associated farms first.'
            );
        }

        // Parse photos from JSON string
        let photoUrls = [];
        if (land.landPhotos) {
            try {
                photoUrls = JSON.parse(land.landPhotos);
            } catch (e) {
                console.error('Error parsing land photos:', e);
            }
        }

        // Delete from storage
        const cleanupPromises = [
            ...photoUrls.map(url => deleteFromStorage(url)),
            ...(land.ownershipDocumentUrl ? [deleteFromStorage(land.ownershipDocumentUrl)] : [])
        ];

        // Log storage cleanup but don't fail if some files are missing
        await Promise.all(cleanupPromises.map(p => p.catch(err => console.error('Storage cleanup error:', err))));

        await prisma.land.delete({ where: { id } });

        return successResponse(res, 200, 'Land deleted successfully by admin');
    } catch (error) {
        next(error);
    }
};

/**
 * Delete farm (Admin)
 * @route DELETE /api/v1/admin/farms/:id
 */
const deleteFarm = async (req, res, next) => {
    try {
        const { id } = req.params;

        const farm = await prisma.farm.findUnique({
            where: { id },
            include: {
                photos: true,
                plants: { include: { investments: true } },
                payments: true
            }
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found');
        }

        // Check for dependencies that block deletion
        const hasActiveInvestments = farm.plants.some(p => p.investments.length > 0);
        if (hasActiveInvestments) {
            return errorResponse(res, 400, 'Cannot delete farm with active investments. Please handle investments first.');
        }

        if (farm.payments.length > 0) {
            return errorResponse(res, 400, 'Cannot delete farm with associated payments. Deletion is restricted for audit purposes.');
        }

        // Delete photos from storage
        await Promise.all(farm.photos.map(p =>
            deleteFromStorage(p.photoUrl).catch(err => console.error('Storage error:', err))
        ));

        await prisma.farm.delete({ where: { id } });

        return successResponse(res, 200, 'Farm deleted successfully by admin');
    } catch (error) {
        next(error);
    }
};

/**
 * Get notifications for the current user
 * @route GET /api/v1/admin/notifications
 */
const getAdminNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        return successResponse(res, 200, 'Notifications retrieved successfully', notifications);
    } catch (error) {
        next(error);
    }
};

/**
 * Mark a notification as read
 * @route PUT /api/v1/admin/notifications/:id/read
 */
const markNotificationAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true }
        });

        return successResponse(res, 200, 'Notification marked as read');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPendingLands,
    approveLand,
    rejectLand,
    getPendingFarms,
    approveFarm,
    rejectFarm,
    getDashboardStats,
    getAllUsers,
    getUserById,
    verifyUser,
    approveKYC,
    rejectKYC,
    suspendUser,
    activateUser,
    deleteUser,
    getAllInvestments,
    getInvestmentById,
    cancelInvestment,
    deleteInvestment,
    updateInvestment,
    getAllPayments,
    getFailedPayments,
    retryPayment,
    refundPayment,
    getRevenueReport,
    getPendingApprovalsSummary,
    getActivityLogs,
    getPendingFarmerProfiles,
    approveFarmerProfile,
    rejectFarmerProfile,
    deleteFarmerProfile,
    getPendingKYC,
    updateUser,
    getAllLands,
    getAllFarms,
    deleteLand,
    deleteFarm,
    getAdminNotifications,
    markNotificationAsRead
};
