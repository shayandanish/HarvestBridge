const { generateAccessToken, verifyAccessToken } = require('../../src/config/jwt');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('JWT Config Utilities', () => {
    const payload = { userId: 'user-123' };
    const token = 'mock.jwt.token';

    beforeEach(() => {
        // Based on src/config/jwt.js, it uses JWT_SECRET
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_EXPIRES_IN = '1h';
    });

    test('generateAccessToken should call jwt.sign', () => {
        jwt.sign.mockReturnValue(token);
        const result = generateAccessToken(payload);
        expect(jwt.sign).toHaveBeenCalledWith(payload, expect.any(String), expect.any(Object));
        expect(result).toBe(token);
    });

    test('verifyAccessToken should call jwt.verify', () => {
        jwt.verify.mockReturnValue(payload);
        const result = verifyAccessToken(token);
        // It uses JWT_SECRET which falls back or is from process.env
        expect(jwt.verify).toHaveBeenCalled();
        expect(result).toBe(payload);
    });

    test('verifyAccessToken should throw error on invalid token', () => {
        jwt.verify.mockImplementation(() => { throw new Error('invalid'); });
        expect(() => verifyAccessToken(token)).toThrow('Invalid or expired token');
    });
});
