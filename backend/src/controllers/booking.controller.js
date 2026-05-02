const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const QRCode = require('qrcode');
const crypto = require('crypto');
const emailService = require('../utils/emailService');

/**
 * Get available time slots for a farm given a date range
 * @route GET /api/v1/farms/:id/available-slots
 */
const getAvailableSlots = async (req, res, next) => {
    try {
        const { id: farmId } = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return errorResponse(res, 400, 'Start date and end date are required');
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Get farm availability settings
        const availabilities = await prisma.farmAvailability.findMany({
            where: { farmId, isActive: true },
        });

        // Get blackout dates
        const blackoutDates = await prisma.farmBlackoutDate.findMany({
            where: {
                farmId,
                blackoutDate: {
                    gte: start,
                    lte: end,
                },
            },
        });
        const blackoutStrings = blackoutDates.map(b => b.blackoutDate.toISOString().split('T')[0]);

        // Get existing bookings
        const bookings = await prisma.booking.findMany({
            where: {
                farmId,
                visitDate: {
                    gte: start,
                    lte: end,
                },
                status: {
                    in: ['pending', 'confirmed'],
                },
            },
        });

        const availableSlots = [];
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        // Iterate through each day in range
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateString = d.toISOString().split('T')[0];
            const dayName = days[d.getDay()];

            // Check if blackout date
            if (blackoutStrings.includes(dateString)) {
                continue;
            }

            // Find availability for this day
            const dayAvailability = availabilities.filter(a => a.dayOfWeek === dayName);

            for (const slot of dayAvailability) {
                // Calculate booked visitors for this slot
                const slotBookings = bookings.filter(b =>
                    b.visitDate.toISOString().split('T')[0] === dateString &&
                    b.visitTime === slot.startTime // Assuming slots are fixed start times for now
                );

                const bookedVisitors = slotBookings.reduce((sum, b) => sum + b.numberOfGuests, 0);
                const remainingSpots = slot.maxVisitorsPerSlot - bookedVisitors;

                if (remainingSpots > 0) {
                    availableSlots.push({
                        date: dateString,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        availableSpots: remainingSpots,
                        maxVisitors: slot.maxVisitorsPerSlot
                    });
                }
            }
        }

        return successResponse(res, 200, 'Available slots retrieved', availableSlots);
    } catch (error) {
        next(error);
    }
};

/**
 * Create a booking
 * @route POST /api/v1/bookings
 */
const createBooking = async (req, res, next) => {
    try {
        const {
            farmId,
            investmentId,
            visitDate,
            visitTime,
            numberOfGuests,
            specialRequests,
            activities
        } = req.body;
        const userId = req.user.id;

        // 1. Verify Farm exists
        const farm = await prisma.farm.findUnique({
            where: { id: farmId },
            include: { availability: true }
        });
        if (!farm) return errorResponse(res, 404, 'Farm not found');

        // 2. Validate availability
        const dateObj = new Date(visitDate);
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[dateObj.getDay()];

        // Check blackout dates
        const blackout = await prisma.farmBlackoutDate.findFirst({
            where: { farmId, blackoutDate: dateObj }
        });
        if (blackout) return errorResponse(res, 400, 'This date is unavailable');

        // Check schedule
        const slot = farm.availability.find(a =>
            a.dayOfWeek === dayName &&
            a.isActive &&
            a.startTime === visitTime
        );

        if (!slot) return errorResponse(res, 400, 'Invalid time slot');

        // Check capacity
        const existingBookings = await prisma.booking.findMany({
            where: {
                farmId,
                visitDate: dateObj,
                visitTime,
                status: { in: ['pending', 'confirmed'] }
            }
        });

        const currentGuests = existingBookings.reduce((sum, b) => sum + b.numberOfGuests, 0);
        if (currentGuests + parseInt(numberOfGuests) > slot.maxVisitorsPerSlot) {
            return errorResponse(res, 400, 'Not enough spots available for this slot');
        }

        // 3. Calculate cost
        let totalCost = 0;
        const bookingActivitiesData = [];

        if (activities && activities.length > 0) {
            for (const activity of activities) {
                const activityDb = await prisma.additionalActivity.findUnique({
                    where: { id: activity.activityId }
                });

                if (activityDb) {
                    totalCost += Number(activityDb.pricePerPerson) * Number(activity.quantity);
                    bookingActivitiesData.push({
                        activityId: activity.activityId,
                        quantity: activity.quantity,
                        priceAtBooking: activityDb.pricePerPerson
                    });
                }
            }
        }

        // 4. Generate Confirmation Code & QR Code
        const confirmationCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        const qrData = JSON.stringify({
            code: confirmationCode,
            farmId,
            date: visitDate,
            guest: userId
        });

        const qrCodeUrl = await QRCode.toDataURL(qrData);

        // 5. Create Booking
        const booking = await prisma.booking.create({
            data: {
                investorId: userId,
                farmId,
                investmentId: investmentId || null,
                visitDate: dateObj,
                visitTime,
                numberOfGuests: parseInt(numberOfGuests),
                specialRequests,
                confirmationCode,
                qrCodeUrl,
                totalCost,
                status: 'pending',
                activities: {
                    create: bookingActivitiesData
                }
            },
            include: {
                activities: {
                    include: { activity: true }
                }
            }
        });

        // 6. Send Notification
        const investor = await prisma.user.findUnique({ where: { id: userId } });
        const farmerUser = await prisma.user.findUnique({ where: { id: farm.farmer.userId } });

        const bookingDetails = {
            farmName: farm.farmName,
            visitDate: booking.visitDate.toLocaleDateString(),
            visitTime: booking.visitTime,
            guests: booking.numberOfGuests,
            code: booking.confirmationCode,
            total: booking.totalCost
        };

        // Notify Investor
        emailService.sendBookingConfirmationEmail(investor.email, investor.fullName, bookingDetails).catch(e => console.error(e));

        // Notify Farmer
        emailService.sendFarmerBookingNotification(farmerUser.email, farmerUser.fullName, bookingDetails).catch(e => console.error(e));

        return successResponse(res, 201, 'Booking created successfully', booking);

    } catch (error) {
        next(error);
    }
};

/**
 * Get user's bookings
 * @route GET /api/v1/bookings
 */
const getBookings = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { role } = req.user;
        const { status } = req.query;

        let where = {};

        // If farmer, show bookings for their farms'
        if (role === 'farmer') {
            const farmer = await prisma.farmer.findUnique({ where: { userId } });
            if (!farmer) return errorResponse(res, 404, 'Farmer profile not found');

            // Find bookings where farm's farmerId is this farmer
            // Prisma relation: Booking -> Farm -> Farmer
            where.farm = { farmerId: farmer.id };
        } else {
            // Investor
            where.investorId = userId;
        }

        if (status) {
            where.status = status;
        }

        const bookings = await prisma.booking.findMany({
            where,
            include: {
                farm: {
                    select: { farmName: true, id: true, photos: { take: 1 } }
                },
                investor: {
                    select: { fullName: true, email: true, phone: true }
                },
                activities: {
                    include: { activity: true }
                }
            },
            orderBy: { visitDate: 'desc' }
        });

        return successResponse(res, 200, 'Bookings retrieved', bookings);
    } catch (error) {
        next(error);
    }
};

/**
 * Get booking details
 * @route GET /api/v1/bookings/:id
 */
const getBookingById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                farm: {
                    include: { land: true }
                },
                investor: true,
                activities: {
                    include: { activity: true }
                },
                investment: {
                    include: { plant: true }
                }
            }
        });

        if (!booking) return errorResponse(res, 404, 'Booking not found');

        // Auth check: Is owner or farmer?
        if (booking.investorId !== userId) {
            // Check if farmer
            const farmer = await prisma.farmer.findUnique({ where: { userId } });
            if (!farmer || booking.farm.farmerId !== farmer.id) {
                return errorResponse(res, 403, 'Access denied');
            }
        }

        return successResponse(res, 200, 'Booking details retrieved', booking);
    } catch (error) {
        next(error);
    }
};

/**
 * Cancel booking
 * @route PUT /api/v1/bookings/:id/cancel
 */
const cancelBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { reason } = req.body;

        const booking = await prisma.booking.findUnique({
            where: { id }
        });

        if (!booking) return errorResponse(res, 404, 'Booking not found');
        if (booking.investorId !== userId) return errorResponse(res, 403, 'Access denied');

        if (booking.status === 'completed' || booking.status === 'cancelled') {
            return errorResponse(res, 400, 'Cannot cancel already processed booking');
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                status: 'cancelled',
                cancellationReason: reason
            },
            include: { farm: { include: { farmer: { include: { user: true } } } }, investor: true }
        });

        // Notify Farmer
        const farmerEmail = updatedBooking.farm.farmer.user.email;
        emailService.sendBookingCancellationNotification(farmerEmail, updatedBooking.farm.farmer.user.fullName, {
            investorName: updatedBooking.investor.fullName,
            farmName: updatedBooking.farm.farmName,
            visitDate: updatedBooking.visitDate.toLocaleDateString(),
            reason
        }).catch(e => console.error(e));

        return successResponse(res, 200, 'Booking cancelled', updatedBooking);
    } catch (error) {
        next(error);
    }
};

/**
 * Farmer confirms booking
 * @route PUT /api/v1/bookings/:id/confirm
 */
const confirmBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify farmer
        const farmer = await prisma.farmer.findUnique({ where: { userId } });
        if (!farmer) return errorResponse(res, 403, 'Must be a farmer');

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { farm: true }
        });

        if (!booking) return errorResponse(res, 404, 'Booking not found');
        if (booking.farm.farmerId !== farmer.id) return errorResponse(res, 403, 'Access denied');

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: { status: 'confirmed' },
            include: { investor: true, farm: true }
        });

        // Notify Investor
        const bookingDetails = {
            farmName: updatedBooking.farm.farmName,
            visitDate: updatedBooking.visitDate.toLocaleDateString(),
            visitTime: updatedBooking.visitTime,
            guests: updatedBooking.numberOfGuests,
            code: updatedBooking.confirmationCode
        };
        emailService.sendBookingConfirmationEmail(updatedBooking.investor.email, updatedBooking.investor.fullName, bookingDetails).catch(e => console.error(e));

        return successResponse(res, 200, 'Booking confirmed', updatedBooking);

    } catch (error) {
        next(error);
    }
};

/**
 * Reschedule booking
 * @route PUT /api/v1/bookings/:id/reschedule
 */
const rescheduleBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { newVisitDate, newVisitTime } = req.body;
        const userId = req.user.id;

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { farm: { include: { availability: true } } }
        });

        if (!booking) return errorResponse(res, 404, 'Booking not found');
        if (booking.investorId !== userId) return errorResponse(res, 403, 'Access denied');

        if (booking.status === 'completed' || booking.status === 'cancelled') {
            return errorResponse(res, 400, 'Cannot reschedule already processed booking');
        }

        // Validate new slot
        const dateObj = new Date(newVisitDate);
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[dateObj.getDay()];

        // Check blackout dates
        const blackout = await prisma.farmBlackoutDate.findFirst({
            where: { farmId: booking.farmId, blackoutDate: dateObj }
        });
        if (blackout) return errorResponse(res, 400, 'The new date is unavailable');

        // Check schedule
        const slot = booking.farm.availability.find(a =>
            a.dayOfWeek === dayName &&
            a.isActive &&
            a.startTime === newVisitTime
        );
        if (!slot) return errorResponse(res, 400, 'Invalid time slot for the new date');

        // Check capacity
        const existingBookings = await prisma.booking.findMany({
            where: {
                farmId: booking.farmId,
                visitDate: dateObj,
                visitTime: newVisitTime,
                status: { in: ['pending', 'confirmed'] },
                id: { not: booking.id } // Exclude current booking
            }
        });

        const currentGuests = existingBookings.reduce((sum, b) => sum + b.numberOfGuests, 0);
        if (currentGuests + booking.numberOfGuests > slot.maxVisitorsPerSlot) {
            return errorResponse(res, 400, 'Not enough spots available for the new slot');
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                visitDate: dateObj,
                visitTime: newVisitTime,
                status: 'pending'
            },
            include: { farm: { include: { farmer: { include: { user: true } } } }, investor: true }
        });

        // Notify Farmer of reschedule
        emailService.sendBookingRescheduledNotification(updatedBooking.farm.farmer.user.email, updatedBooking.farm.farmer.user.fullName, {
            investorName: updatedBooking.investor.fullName,
            farmName: updatedBooking.farm.farmName,
            oldDate: booking.visitDate.toLocaleDateString(),
            newDate: updatedBooking.visitDate.toLocaleDateString(),
            newTime: updatedBooking.visitTime
        }).catch(e => console.error(e));

        return successResponse(res, 200, 'Booking rescheduled successfully', updatedBooking);
    } catch (error) {
        next(error);
    }
};

/**
 * Check-in visitor (Scan QR)
 * @route POST /api/v1/bookings/:id/check-in
 */
const checkInBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { confirmationCode } = req.body;
        const userId = req.user.id;

        // Verify farmer
        const farmer = await prisma.farmer.findUnique({ where: { userId } });
        if (!farmer) return errorResponse(res, 403, 'Must be a farmer');

        let booking;
        if (id && id !== 'undefined') {
            booking = await prisma.booking.findUnique({
                where: { id },
                include: { farm: true }
            });
        } else if (confirmationCode) {
            booking = await prisma.booking.findUnique({
                where: { confirmationCode },
                include: { farm: true }
            });
        }

        if (!booking) return errorResponse(res, 404, 'Booking not found');
        if (booking.farm.farmerId !== farmer.id) return errorResponse(res, 403, 'This booking is for another farm');

        if (booking.status === 'cancelled') return errorResponse(res, 400, 'Booking is cancelled');
        if (booking.status === 'completed') return errorResponse(res, 400, 'Guest already checked in');

        // Verify date is today
        const today = new Date().toISOString().split('T')[0];
        const visitDate = new Date(booking.visitDate).toISOString().split('T')[0];
        if (visitDate !== today) {
            return errorResponse(res, 400, `This booking is for ${visitDate}, not today (${today})`);
        }

        const updatedBooking = await prisma.booking.update({
            where: { id: booking.id },
            data: {
                status: 'completed',
                checkedInAt: new Date()
            }
        });

        return successResponse(res, 200, 'Check-in successful', updatedBooking);

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAvailableSlots,
    createBooking,
    getBookings,
    getBookingById,
    cancelBooking,
    confirmBooking,
    checkInBooking,
    rescheduleBooking
};
