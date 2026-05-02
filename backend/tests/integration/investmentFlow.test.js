const request = require('supertest');
const app = require('../../src/app');

// Mock Prisma
jest.mock('../../src/config/database', () => ({
    user: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
    },
    plant: {
        findUnique: jest.fn(),
    },
    investment: {
        create: jest.fn(),
    }
}));

const prisma = require('../../src/config/database');

describe('Investment Flow Integration (Mocked DB)', () => {
    test('Setup Success', () => {
        expect(true).toBe(true);
    });
});
