const { mockDeep, mockReset } = require('jest-mock-extended');
const prisma = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
    __esModule: true,
    default: mockDeep(),
}));

beforeEach(() => {
    mockReset(prismaMock);
});

const prismaMock = prisma;
module.exports = { prismaMock };
