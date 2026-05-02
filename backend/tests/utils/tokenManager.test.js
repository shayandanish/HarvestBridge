const { generateToken, blacklistToken, isTokenBlacklisted, clearExpiredTokens } = require('../../src/utils/tokenManager');

describe('TokenManager Utility', () => {
    test('generateToken should return a hex string of correct length', () => {
        const token = generateToken(16);
        expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
        expect(typeof token).toBe('string');
    });

    test('blacklistToken and isTokenBlacklisted should work correctly', () => {
        const token = 'some-token';
        expect(isTokenBlacklisted(token)).toBe(false);
        blacklistToken(token);
        expect(isTokenBlacklisted(token)).toBe(true);
    });

    test('clearExpiredTokens should work without error', () => {
        expect(() => clearExpiredTokens()).not.toThrow();
    });
});
