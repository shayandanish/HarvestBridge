const ics = require('ics');

/**
 * Generate an .ics calendar event for a booking
 * @param {Object} booking - The booking object from Prisma
 * @returns {Promise<string>} - The generated iCalendar string
 */
const generateIcsEvent = (booking) => {
    return new Promise((resolve, reject) => {
        const date = new Date(booking.visitDate);
        const [hours, minutes] = booking.visitTime.split(':').map(Number);

        // durationMinutes default 120 or from farm settings if available
        const duration = booking.farm.availability?.[0]?.slotDurationMinutes || 120;

        const event = {
            start: [
                date.getFullYear(),
                date.getMonth() + 1,
                date.getDate(),
                hours,
                minutes
            ],
            duration: { minutes: duration },
            title: `Farm Visit: ${booking.farm.farmName}`,
            description: `Planned visit to ${booking.farm.farmName}. Confirmation Code: ${booking.confirmationCode}\nSpecial Requests: ${booking.specialRequests || 'None'}`,
            location: booking.farm.land?.address || booking.farm.farmName,
            url: `http://localhost:3000/bookings/${booking.id}`, // Update with real frontend URL
            geo: booking.farm.land?.latitude ? {
                lat: Number(booking.farm.land.latitude),
                lon: Number(booking.farm.land.longitude)
            } : null,
            status: booking.status.toUpperCase(),
            organizer: { name: booking.farm.farmName, email: 'info@planttree.com' }, // Placeholder
        };

        ics.createEvent(event, (error, value) => {
            if (error) {
                return reject(error);
            }
            resolve(value);
        });
    });
};

module.exports = { generateIcsEvent };
