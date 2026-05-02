const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Middleware to log admin activities
 * @param {string} action - The action being performed
 * @param {string} entityType - The type of entity (user, farm, land, etc.)
 * @param {function} getEntityId - Optional function to extract entity ID from req
 */
const activityLogger = (action, entityType, getEntityId = null) => {
    return async (req, res, next) => {
        // We wrap the original send to log after response is sent successfully
        const originalSend = res.send;

        res.send = function (body) {
            const responseData = JSON.parse(body);

            // Only log successful actions
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const entityId = getEntityId ? getEntityId(req) : (req.params.id || req.body.id);

                // Fire and forget logging
                prisma.activityLog.create({
                    data: {
                        userId: req.user.id,
                        action,
                        entityType,
                        entityId: String(entityId),
                        details: {
                            path: req.originalUrl,
                            method: req.method,
                            body: req.method !== 'GET' ? req.body : undefined
                        },
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent')
                    }
                }).catch(err => logger.error('Activity logging failed:', err));
            }

            return originalSend.apply(res, arguments);
        };

        next();
    };
};

module.exports = activityLogger;
