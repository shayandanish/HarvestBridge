const crypto = require('crypto');

// In-memory token blacklist (use Redis in production)
const tokenBlacklist = new Set();

/**
 * Generate random token
 * @param {Number} length - Token length in bytes
 * @returns {String} Hex token
 */
const generateToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Add token to blacklist
 * @param {String} token - JWT token to blacklist
 */
const blacklistToken = (token) => {
    tokenBlacklist.add(token);
};

/**
 * Check if token is blacklisted
 * @param {String} token - JWT token to check
 * @returns {Boolean}
 */
const isTokenBlacklisted = (token) => {
    return tokenBlacklist.has(token);
};

/**
 * Clear expired tokens from blacklist (call periodically)
 * Note: In production, use Redis with TTL
 */
const clearExpiredTokens = () => {
    // This is a simple implementation
    // In production with Redis, tokens would expire automatically
    if (tokenBlacklist.size > 10000) {
        tokenBlacklist.clear();
    }
};

module.exports = {
    generateToken,
    blacklistToken,
    isTokenBlacklisted,
    clearExpiredTokens,
};
