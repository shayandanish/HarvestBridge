const { successResponse, errorResponse } = require('../../src/utils/responseFormatter');

describe('Response Formatter Utility', () => {
    let res;

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    test('successResponse should return 200 with data', () => {
        const data = { id: 1, name: 'Test' };
        successResponse(res, 200, 'Success', data);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            message: 'Success',
            data: data
        });
    });

    test('successResponse should return 200 without data', () => {
        successResponse(res, 200, 'Success');

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            message: 'Success'
        });
    });

    test('errorResponse should return error status and message', () => {
        errorResponse(res, 404, 'Not Found');

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            status: 'error',
            message: 'Not Found'
        });
    });

    test('errorResponse should handle multiple errors', () => {
        const errors = [{ msg: 'Invalid Email', field: 'email' }];
        errorResponse(res, 400, 'Validation Error', errors);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            status: 'error',
            message: 'Validation Error',
            errors: errors
        });
    });
});
