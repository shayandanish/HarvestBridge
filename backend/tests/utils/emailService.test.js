const { sendEmail, loadTemplate } = require('../../src/utils/emailService');
const { transporter } = require('../../src/config/email');
const fs = require('fs/promises');

// Mock email config
jest.mock('../../src/config/email', () => ({
    transporter: {
        sendMail: jest.fn(),
        verify: jest.fn().mockResolvedValue(true)
    },
    EMAIL_FROM: 'test@example.com'
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
    readFile: jest.fn()
}));

describe('EmailService Utility', () => {
    const to = 'recipient@example.com';
    const subject = 'Test Subject';
    const body = '<h1>Test Body</h1>';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('sendEmail should call transporter.sendMail', async () => {
        transporter.sendMail.mockResolvedValue({ messageId: '123' });
        const result = await sendEmail(to, subject, body);
        expect(transporter.sendMail).toHaveBeenCalled();
        expect(result.success).toBe(true);
    });

    test('loadTemplate should read file and replace variables', async () => {
        fs.readFile.mockResolvedValue('Hello {{name}}!');

        try {
            const result = await loadTemplate('welcome', { name: 'World' });
            expect(result).toBe('Hello World!');
        } catch (e) {
            console.log('TEST DEBUG - caught error:', e.message);
            throw e;
        }
    });
});
