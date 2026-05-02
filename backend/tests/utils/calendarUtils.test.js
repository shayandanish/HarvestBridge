const { generateIcsEvent } = require('../../src/utils/calendarUtils');
const ics = require('ics');

jest.mock('ics', () => ({
    createEvent: jest.fn((event, cb) => cb(null, 'mock-ics-string'))
}));

describe('Calendar Utilities', () => {
    const booking = {
        id: 'book-1',
        visitDate: '2026-05-20',
        visitTime: '10:00',
        status: 'pending',
        confirmationCode: 'TESTCODE',
        farm: {
            farmName: 'Green Farm',
            availability: [{ slotDurationMinutes: 60 }],
            land: { address: '123 Farm Lane', latitude: 45.0, longitude: -93.0 }
        }
    };

    test('generateIcsEvent should return a string', async () => {
        const result = await generateIcsEvent(booking);
        expect(result).toBe('mock-ics-string');
        expect(ics.createEvent).toHaveBeenCalled();
    });
});
