const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    // Only log errors — query logging in dev adds significant overhead per request
    log: process.env.NODE_ENV === 'development'
        ? ['warn', 'error']  // removed 'query' and 'info' — they slow down every DB call
        : ['error'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

module.exports = prisma;
