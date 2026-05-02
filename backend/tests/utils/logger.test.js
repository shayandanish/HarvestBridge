const winston = require('winston');

jest.mock('winston', () => {
    const format = {
        combine: jest.fn(() => 'combined'),
        timestamp: jest.fn(() => 'timestamp'),
        json: jest.fn(() => 'json'),
        colorize: jest.fn(() => 'colorize'),
        printf: jest.fn(() => 'printf'),
        errors: jest.fn(() => 'errors'),
        splat: jest.fn(() => 'splat')
    };
    const transports = {
        Console: jest.fn(),
        File: jest.fn()
    };
    return {
        format,
        transports,
        createLogger: jest.fn().mockReturnValue({
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn()
        })
    };
});

const logger = require('../../src/utils/logger');

describe('Logger Utility', () => {
    test('logger should be defined', () => {
        expect(logger).toBeDefined();
    });

    test('logger should have standard methods', () => {
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.error).toBe('function');
    });
});
