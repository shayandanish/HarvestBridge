const logger = require('../utils/logger');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
    });

    // Prisma errors
    if (err.code && err.code.startsWith('P')) {
        return handlePrismaError(err, res);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return errorResponse(res, 401, 'Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 401, 'Token expired');
    }

    // Multer errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return errorResponse(res, 400, 'File size too large');
        }
        return errorResponse(res, 400, err.message);
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return errorResponse(res, 400, 'Validation failed', err.errors);
    }

    // Default error
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    return errorResponse(res, statusCode, message);
};

/**
 * Handle Prisma-specific errors
 */
const handlePrismaError = (err, res) => {
    switch (err.code) {
        case 'P2002':
            // Unique constraint violation
            const field = err.meta?.target?.[0] || 'field';
            return errorResponse(res, 409, `${field} already exists`);

        case 'P2025':
            // Record not found
            return errorResponse(res, 404, 'Record not found');

        case 'P2003':
            // Foreign key constraint violation
            return errorResponse(res, 400, 'Invalid reference to related record');

        case 'P2014':
            // Required relation violation
            return errorResponse(res, 400, 'Required relation is missing');

        default:
            logger.error('Unhandled Prisma error:', err);
            return errorResponse(res, 500, 'Database error occurred');
    }
};

module.exports = errorHandler;
