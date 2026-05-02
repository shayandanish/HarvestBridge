const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/database');

// Mock Prisma
jest.mock('../../src/config/database', () => ({
    user: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        deleteMany: jest.fn()
    }
}));

describe('User Flow Integration (Mocked DB)', () => {
    let testUser = {
        fullName: 'Test User',
        email: `test@example.com`,
        password: 'Password123!',
        role: 'investor'
    };
    let token;

    test('POST /api/v1/auth/register - Should register a new user', async () => {
        prisma.user.findFirst.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue({
            id: 'user-123',
            email: testUser.email.toLowerCase(),
            fullName: testUser.fullName,
            role: testUser.role,
            isVerified: false
        });

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send(testUser);

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('success');
    });

    test('POST /api/v1/auth/login - Should login and return token', async () => {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(testUser.password, 10);

        prisma.user.findFirst.mockResolvedValue({
            id: 'user-123',
            email: testUser.email.toLowerCase(),
            passwordHash: hash,
            role: testUser.role,
            isActive: true,
            isVerified: true
        });

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.status).toBe(200);
        expect(res.body.data.accessToken).toBeDefined();
        token = res.body.data.accessToken;
    });

    test('GET /api/v1/auth/me - Should return user profile with token', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'user-123',
            email: testUser.email.toLowerCase(),
            fullName: testUser.fullName,
            role: testUser.role,
            isActive: true,
            isVerified: true,
            profile: null,
            farmer: null,
            landowner: null
        });

        const res = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.email).toBe(testUser.email.toLowerCase());
    });
});
