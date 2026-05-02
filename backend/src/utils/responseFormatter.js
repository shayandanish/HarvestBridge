/**
 * Standard success response formatter
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Object} data - Response data
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
    const response = {
        status: 'success',
        message,
    };

    if (data !== null) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

/**
 * Standard error response formatter
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Array} errors - Validation errors array
 */
const errorResponse = (res, statusCode = 500, message = 'Internal server error', errors = null) => {
    const response = {
        status: 'error',
        message,
    };

    if (errors && errors.length > 0) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

/**
 * Paginated response formatter
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Array} data - Response data array
 * @param {Object} pagination - Pagination metadata
 */
const paginatedResponse = (res, statusCode = 200, message = 'Success', data = [], pagination = {}) => {
    return res.status(statusCode).json({
        status: 'success',
        message,
        data,
        pagination: {
            page: pagination.page || 1,
            limit: pagination.limit || 10,
            total: pagination.total || 0,
            totalPages: pagination.totalPages || 0,
        },
    });
};

module.exports = {
    successResponse,
    errorResponse,
    paginatedResponse,
};
