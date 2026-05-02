const { errorResponse } = require('../utils/responseFormatter');

/**
 * Role-based access control middleware
 * @param {Array} allowedRoles - Array of allowed user roles
 */
const authorize = (...roles) => {
    // Handle both authorize(['admin', 'user']) and authorize('admin', 'user')
    const allowedRoles = roles.length === 1 && Array.isArray(roles[0])
        ? roles[0]
        : roles;

    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 401, 'Authentication required');
        }

        if (!allowedRoles.includes(req.user.role)) {
            return errorResponse(
                res,
                403,
                'You do not have permission to access this resource'
            );
        }

        next();
    };
};

/**
 * Check if user is verified
 */
const requireVerified = (req, res, next) => {
    if (!req.user) {
        return errorResponse(res, 401, 'Authentication required');
    }

    if (!req.user.isVerified) {
        return errorResponse(res, 403, 'Account verification required');
    }

    next();
};

/**
 * Check if user owns the resource
 * @param {String} userIdField - Field name in req.params or req.body containing user ID
 */
const requireOwnership = (userIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 401, 'Authentication required');
        }

        const resourceUserId = req.params[userIdField] || req.body[userIdField];

        if (req.user.role === 'admin') {
            // Admins can access any resource
            return next();
        }

        if (req.user.id !== resourceUserId) {
            return errorResponse(
                res,
                403,
                'You can only access your own resources'
            );
        }

        next();
    };
};

module.exports = {
    authorize,
    checkRole: authorize,
    requireVerified,
    requireOwnership,
};
