const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Create farm availability slot
 * @route POST /api/v1/farms/:id/availability
 */
const createAvailability = async (req, res, next) => {
    try {
        const { id: farmId } = req.params;
        const { dayOfWeek, startTime, endTime, maxVisitorsPerSlot, slotDurationMinutes } = req.body;

        // Verify farmer owns the farm
        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        const farm = await prisma.farm.findFirst({
            where: {
                id: farmId,
                farmerId: farmer.id,
            },
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found or access denied');
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            return errorResponse(res, 400, 'Invalid time format. Use HH:MM');
        }

        const availability = await prisma.farmAvailability.create({
            data: {
                farmId,
                dayOfWeek: dayOfWeek.toLowerCase(),
                startTime,
                endTime,
                maxVisitorsPerSlot: parseInt(maxVisitorsPerSlot) || 10,
                slotDurationMinutes: parseInt(slotDurationMinutes) || 120,
            },
        });

        return successResponse(res, 201, 'Availability slot created successfully', availability);
    } catch (error) {
        next(error);
    }
};

/**
 * Get farm availability
 * @route GET /api/v1/farms/:id/availability
 */
const getAvailability = async (req, res, next) => {
    try {
        const { id: farmId } = req.params;

        const availability = await prisma.farmAvailability.findMany({
            where: { farmId },
            orderBy: { startTime: 'asc' },
        });

        // Group by day of week
        const grouped = availability.reduce((acc, slot) => {
            if (!acc[slot.dayOfWeek]) {
                acc[slot.dayOfWeek] = [];
            }
            acc[slot.dayOfWeek].push(slot);
            return acc;
        }, {});

        return successResponse(res, 200, 'Availability retrieved successfully', grouped);
    } catch (error) {
        next(error);
    }
};

/**
 * Update availability slot
 * @route PUT /api/v1/farms/:id/availability/:availabilityId
 */
const updateAvailability = async (req, res, next) => {
    try {
        const { id: farmId, availabilityId } = req.params;
        const { startTime, endTime, maxVisitorsPerSlot, isActive } = req.body;

        // Verify ownership
        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        const farm = await prisma.farm.findFirst({
            where: {
                id: farmId,
                farmerId: farmer.id,
            },
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found or access denied');
        }

        const availability = await prisma.farmAvailability.findFirst({
            where: { id: availabilityId, farmId },
        });

        if (!availability) {
            return errorResponse(res, 404, 'Availability slot not found');
        }

        const updatedAvailability = await prisma.farmAvailability.update({
            where: { id: availabilityId },
            data: {
                ...(startTime && { startTime }),
                ...(endTime && { endTime }),
                ...(maxVisitorsPerSlot && { maxVisitorsPerSlot: parseInt(maxVisitorsPerSlot) }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return successResponse(res, 200, 'Availability updated successfully', updatedAvailability);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete availability slot
 * @route DELETE /api/v1/farms/:id/availability/:availabilityId
 */
const deleteAvailability = async (req, res, next) => {
    try {
        const { id: farmId, availabilityId } = req.params;

        // Verify ownership
        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        const farm = await prisma.farm.findFirst({
            where: {
                id: farmId,
                farmerId: farmer.id,
            },
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found or access denied');
        }

        const availability = await prisma.farmAvailability.findUnique({
            where: { id: availabilityId }
        });

        if (!availability) {
            return errorResponse(res, 404, 'Availability slot not found');
        }

        // Check for future bookings in this slot
        const futureBookings = await prisma.booking.count({
            where: {
                farmId,
                visitTime: availability.startTime,
                visitDate: { gte: new Date() },
                status: { in: ['pending', 'confirmed'] }
            }
        });

        if (futureBookings > 0) {
            return errorResponse(res, 400, `Cannot delete slot. There are ${futureBookings} future bookings for this time.`);
        }

        await prisma.farmAvailability.delete({
            where: { id: availabilityId },
        });

        return successResponse(res, 200, 'Availability slot deleted successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Create blackout date
 * @route POST /api/v1/farms/:id/blackout-dates
 */
const createBlackoutDate = async (req, res, next) => {
    try {
        const { id: farmId } = req.params;
        const { blackoutDate, reason } = req.body;

        const dateObj = new Date(blackoutDate);

        // Verify ownership
        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        const farm = await prisma.farm.findFirst({
            where: {
                id: farmId,
                farmerId: farmer.id,
            },
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found or access denied');
        }

        const newBlackoutDate = await prisma.farmBlackoutDate.create({
            data: {
                farmId,
                blackoutDate: dateObj,
                reason,
            },
        });

        // Cancel existing bookings on this date and notify investors
        const bookingsToCancel = await prisma.booking.findMany({
            where: {
                farmId,
                visitDate: dateObj,
                status: { in: ['pending', 'confirmed'] }
            },
            include: { investor: true }
        });

        if (bookingsToCancel.length > 0) {
            await prisma.booking.updateMany({
                where: {
                    id: { in: bookingsToCancel.map(b => b.id) }
                },
                data: {
                    status: 'cancelled',
                    cancellationReason: `Farm is closed on this date: ${reason || 'No reason provided'}`
                }
            });

            // Trigger notifications (mock or real service)
            // bookingsToCancel.forEach(booking => {
            //     sendCancellationEmail(booking.investor.email, booking, reason);
            // });
        }

        return successResponse(res, 201, 'Blackout date created successfully', {
            blackoutDate: newBlackoutDate,
            cancelledBookingsCount: bookingsToCancel.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get blackout dates
 * @route GET /api/v1/farms/:id/blackout-dates
 */
const getBlackoutDates = async (req, res, next) => {
    try {
        const { id: farmId } = req.params;

        const blackoutDates = await prisma.farmBlackoutDate.findMany({
            where: { farmId },
            orderBy: { blackoutDate: 'asc' },
        });

        return successResponse(res, 200, 'Blackout dates retrieved successfully', blackoutDates);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete blackout date
 * @route DELETE /api/v1/farms/:id/blackout-dates/:id
 */
const deleteBlackoutDate = async (req, res, next) => {
    try {
        const { id: farmId, blackoutId } = req.params;

        // Verify ownership
        const farmer = await prisma.farmer.findUnique({
            where: { userId: req.user.id },
        });

        if (!farmer) {
            return errorResponse(res, 404, 'Farmer profile not found');
        }

        const farm = await prisma.farm.findFirst({
            where: {
                id: farmId,
                farmerId: farmer.id,
            },
        });

        if (!farm) {
            return errorResponse(res, 404, 'Farm not found or access denied');
        }

        await prisma.farmBlackoutDate.delete({
            where: { id: blackoutId },
        });

        return successResponse(res, 200, 'Blackout date deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createAvailability,
    getAvailability,
    updateAvailability,
    deleteAvailability,
    createBlackoutDate,
    getBlackoutDates,
    deleteBlackoutDate,
};
