const { verifyAccessToken } = require('../config/jwt');
const { errorResponse } = require('../utils/responseFormatter');
const prisma = require('../config/database');
const { isTokenBlacklisted } = require('../utils/tokenManager');
const logger = require('../utils/logger');

/**
 * Authentication middleware - verifies JWT token
 */
const authenticate = async (req, res, next) => {
    try {
        // Skip authentication for OPTIONS requests (CORS preflight)
        if (req.method === 'OPTIONS') {
            return next();
        }

        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logger.info(`[AUTH ERROR] Missing or invalid token for ${req.method} ${req.originalUrl}`);
            logger.info('[AUTH ERROR] Headers: ' + JSON.stringify(req.headers, null, 2));
            return errorResponse(res, 401, 'No token provided');
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = verifyAccessToken(token);

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                isActive: true,
                isVerified: true,
            },
        });

        if (!user) {
            return errorResponse(res, 401, 'User not found');
        }

        if (!user.isActive) {
            return errorResponse(res, 403, 'Account is deactivated');
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.message === 'Invalid or expired token') {
            return errorResponse(res, 401, error.message);
        }
        next(error);
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyAccessToken(token);

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    isActive: true,
                    isVerified: true,
                },
            });

            if (user && user.isActive) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

module.exports = {
    authenticate,
    optionalAuth,
};
